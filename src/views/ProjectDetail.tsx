import { useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Eye,
  FileImage,
  FileText,
  Lock,
  MessageCircleQuestion,
  Power,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import type { Ctx } from '../App'
import {
  ASSET_CATEGORIES,
  SECTIONS,
  STYLES,
  TYPE_LABEL,
  formatBytes,
  formatDate,
  humanize,
  makeToken,
  type Brief,
  type Project,
  type Status,
} from '../data'
import { Button, Chip, SectionCard, StatusBadge, StyleThumb, cx, inputCls } from '../ui'
import { ClarifyModal, ConfirmModal, CopyLink, StylePreviewModal } from '../modals'

type Tab = 'overview' | 'requirement' | 'assets' | 'review'

export function ProjectDetail({ ctx, id }: { ctx: Ctx; id: string }) {
  const p = ctx.projects.find((x) => x.id === id)
  const [tab, setTab] = useState<Tab>(p?.brief && p.status !== 'approved' ? 'requirement' : p?.status === 'approved' ? 'review' : 'overview')
  const [modal, setModal] = useState<null | 'approve' | 'clarify' | 'reopen' | 'regen' | 'preview'>(null)

  if (!p) return <p className="text-muted">Project not found.</p>
  const client = ctx.clients.find((c) => c.id === p.client_id)

  const approve = () => {
    ctx.update(p.id, (x) => ({ status: 'approved', brief: x.brief && { ...x.brief, approved_at: new Date().toISOString(), questions: undefined } }))
    setTab('review')
    ctx.notify('Brief approved and locked')
  }
  const reopen = () => {
    ctx.update(p.id, (x) => ({ status: 'needs_clarification', brief: x.brief && { ...x.brief, version: x.brief.version + 1, approved_at: undefined } }))
    ctx.notify('Brief reopened — version bumped')
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'requirement', label: 'Requirement' },
    { key: 'assets', label: 'Assets' },
    { key: 'review', label: p.status === 'approved' ? 'Approved brief' : 'Review' },
  ]

  return (
    <div>
      <button onClick={() => ctx.go({ name: 'projects' })} className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-ink">
        <ArrowLeft className="size-4" /> Projects
      </button>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={p.status} />
            <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-muted ring-1 ring-line">{TYPE_LABEL[p.type]}</span>
            {p.brief && <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-muted ring-1 ring-line">v{p.brief.version}</span>}
          </div>
          <h1 className="text-[32px] leading-[1.1] font-extrabold tracking-[-0.03em] sm:text-[40px]">{p.name}</h1>
          <p className="mt-2 text-muted">
            {client?.name}
            {client?.company && ` · ${client.company}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => ctx.go({ name: 'client-form', token: p.share_token } as any)}>
            <Eye className="size-4" /> Client view
          </Button>
          {p.status === 'submitted' && (
            <>
              <Button onClick={() => setModal('clarify')}>
                <MessageCircleQuestion className="size-4" /> Request clarification
              </Button>
              <Button variant="primary" onClick={() => setModal('approve')}>
                <Check className="size-4" strokeWidth={2.5} /> Approve brief
              </Button>
            </>
          )}
          {p.status === 'approved' && (
            <Button variant="dark" onClick={() => setModal('reopen')}>
              <RotateCcw className="size-4" /> Reopen
            </Button>
          )}
        </div>
      </div>

      <div role="tablist" className="no-scrollbar mt-8 mb-6 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cx(
              'relative px-4 pt-2 pb-3.5 text-sm font-semibold whitespace-nowrap transition',
              tab === t.key ? 'text-ink' : 'text-muted hover:text-ink',
            )}
          >
            {t.label}
            {tab === t.key && <span className="absolute inset-x-3 -bottom-px h-[3px] rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      <div key={tab} className="animate-slide-up">
        {tab === 'overview' && (
          <Overview
            p={p}
            ctx={ctx}
            onRegen={() => setModal('regen')}
            onPreview={() => ctx.go({ name: 'client-form', token: p.share_token } as any)}
          />
        )}
        {tab === 'requirement' && (p.brief ? <Requirement p={p} b={p.brief} /> : <NoBrief p={p} />)}
        {tab === 'assets' && (p.brief ? <Assets b={p.brief} /> : <NoBrief p={p} />)}
        {tab === 'review' &&
          (!p.brief ? (
            <NoBrief p={p} />
          ) : p.status === 'approved' ? (
            <FinalBrief p={p} b={p.brief} />
          ) : (
            <Review p={p} b={p.brief} ctx={ctx} onApprove={() => setModal('approve')} onClarify={() => setModal('clarify')} />
          ))}
      </div>

      <ConfirmModal open={modal === 'approve'} onClose={() => setModal(null)} title="Approve this brief?" confirmLabel="Approve & lock" onConfirm={approve}>
        The brief becomes read-only and turns into the final Design Brief. You can reopen it later — doing so bumps the version.
      </ConfirmModal>
      <ConfirmModal open={modal === 'reopen'} onClose={() => setModal(null)} title="Reopen approved brief?" confirmLabel="Reopen brief" tone="dark" onConfirm={reopen}>
        Status returns to <b className="text-ink">Needs clarification</b> and the brief moves to v{(p.brief?.version ?? 1) + 1}.
      </ConfirmModal>
      <ConfirmModal
        open={modal === 'regen'}
        onClose={() => setModal(null)}
        title="Regenerate link?"
        confirmLabel="Regenerate"
        tone="danger"
        onConfirm={() => {
          ctx.update(p.id, { share_token: makeToken(), link_enabled: true })
          ctx.notify('New link generated — old link no longer works')
        }}
      >
        The current link stops working immediately. The client's saved answers stay intact.
      </ConfirmModal>
      <ClarifyModal
        open={modal === 'clarify'}
        onClose={() => setModal(null)}
        clientEmail={client?.email}
        onSubmit={(questions) => {
          ctx.update(p.id, (x) => ({ status: 'needs_clarification', brief: x.brief && { ...x.brief, questions } }))
          ctx.notify('Clarification sent to client')
        }}
      />
      <StylePreviewModal open={modal === 'preview'} onClose={() => setModal(null)} projectName={p.name} />
    </div>
  )
}

/* ---------------- Overview ---------------- */

const FLOW: Status[] = ['draft', 'sent', 'in_progress', 'submitted', 'approved']

function Overview({ p, ctx, onRegen, onPreview }: { p: Project; ctx: Ctx; onRegen: () => void; onPreview: () => void }) {
  const idx = p.status === 'needs_clarification' ? 3 : FLOW.indexOf(p.status)
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <SectionCard title="Objective">
          <p className="text-lg leading-relaxed">{p.objective}</p>
        </SectionCard>
        <div className="grid gap-4 sm:grid-cols-2">
          <SectionCard title="Deliverables">
            <ul className="space-y-2">
              {p.deliverables.map((d) => (
                <li key={d} className="flex items-center gap-2.5 text-[15px]">
                  <span className="size-1.5 rounded-full bg-primary-strong" />
                  {d}
                </li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard title="Details">
            <dl className="space-y-2.5 text-sm">
              {[
                ['Type', TYPE_LABEL[p.type]],
                ['Deadline', p.deadline ? formatDate(p.deadline) : 'Not set'],
                ['Form language', p.language === 'id' ? 'Bahasa Indonesia' : 'English'],
                ['Created', formatDate(p.created_at)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>
        </div>
        <SectionCard title="Lifecycle">
          <ol className="grid grid-cols-5 gap-2">
            {FLOW.map((s, i) => (
              <li key={s} className="min-w-0">
                <div className={cx('h-1.5 rounded-full', i <= idx ? 'bg-primary' : 'bg-bg')} />
                <div className={cx('mt-2 truncate text-xs font-semibold', i <= idx ? 'text-ink' : 'text-muted')}>{humanize(s)}</div>
              </li>
            ))}
          </ol>
          {p.status === 'needs_clarification' && <p className="mt-4 text-sm text-muted">Waiting for the client to answer your clarification questions.</p>}
        </SectionCard>
      </div>

      <div className="space-y-4">
        <section className="relative overflow-hidden rounded-[20px] bg-ink p-6 text-white">
          <div aria-hidden className="absolute -top-16 -right-16 size-48 rounded-full bg-primary/25 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold">Client link</h3>
              <span className={cx('flex items-center gap-1.5 text-xs font-semibold', p.link_enabled ? 'text-primary' : 'text-white/50')}>
                <span className={cx('size-1.5 rounded-full', p.link_enabled ? 'bg-primary' : 'bg-white/40')} />
                {p.link_enabled ? 'Active' : 'Disabled'}
              </span>
            </div>
            <p className="mt-1 text-sm text-white/60">No account needed — works great from WhatsApp.</p>
            <CopyLink token={p.share_token} disabled={!p.link_enabled} onCopied={() => ctx.notify('Link copied to clipboard')} className="mt-4 text-ink" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  ctx.update(p.id, { link_enabled: !p.link_enabled })
                  ctx.notify(p.link_enabled ? 'Link disabled' : 'Link enabled')
                }}
                className="flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold ring-1 ring-white/15 transition hover:bg-white/10"
              >
                <Power className="size-4" /> {p.link_enabled ? 'Disable' : 'Enable'}
              </button>
              <button onClick={onRegen} className="flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold ring-1 ring-white/15 transition hover:bg-white/10">
                <RefreshCw className="size-4" /> Regenerate
              </button>
            </div>
          </div>
        </section>
        <button onClick={onPreview} className="group flex w-full items-center gap-4 rounded-[20px] border border-line bg-surface p-4 text-left transition hover:border-ink/15">
          <div className="grid h-16 w-24 shrink-0 grid-cols-2 gap-1 overflow-hidden rounded-xl">
            {(['editorial', 'playful', 'premium', 'minimal'] as const).map((s) => (
              <StyleThumb key={s} id={s} className="h-full" />
            ))}
          </div>
          <div>
            <div className="text-sm font-bold">Preview the client form</div>
            <div className="mt-0.5 text-xs text-muted">See the Visual Style step as your client does.</div>
          </div>
        </button>
      </div>
    </div>
  )
}

/* ---------------- Requirement ---------------- */

function Row({ label, children, id }: { label: string; children: ReactNode; id?: string }) {
  return (
    <div id={id} className="grid gap-2 border-t border-line py-5 first:border-t-0 first:pt-0 last:pb-0 md:grid-cols-[180px_1fr] md:gap-6">
      <div className="text-xs font-bold tracking-wide text-muted uppercase md:pt-1">{label}</div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

const NotSure = () => <Chip tone="neutral">Left to designer</Chip>

function Chips({ items, tone }: { items: string[]; tone?: 'default' | 'accent' | 'avoid' }) {
  if (!items.length) return <span className="text-sm text-muted">—</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <Chip key={i} tone={tone}>
          {humanize(i)}
        </Chip>
      ))}
    </div>
  )
}

function Questions({ b }: { b: Brief }) {
  if (!b.questions?.length) return null
  return (
    <div className="mb-4 rounded-[20px] border border-[#F1DDB4] bg-[#FBF3E3] p-5">
      <div className="flex items-center gap-2 text-sm font-bold text-[#8A5F12]">
        <MessageCircleQuestion className="size-4" /> Awaiting client answers
      </div>
      <ul className="mt-3 space-y-2">
        {b.questions.map((q) => (
          <li key={q.section} className="text-sm">
            <span className="font-semibold">{SECTIONS.find((s) => s.id === q.section)?.label}:</span> <span className="text-ink/80">{q.client_question}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function StyleTiles({ ids }: { ids?: Brief['visual_direction']['styles'] }) {
  const safeIds = Array.isArray(ids) ? ids : []
  return (
    <div className="grid grid-cols-3 gap-3 sm:max-w-lg">
      {safeIds.map((s) => {
        const st = STYLES.find((x) => x.id === s)
        return (
          <div key={s} className="overflow-hidden rounded-2xl border border-line">
            <StyleThumb id={s} className="aspect-[4/3]" />
            <div className="px-3 py-2">
              <div className="text-sm font-bold">{st?.name ?? s}</div>
              <div className="truncate text-xs text-muted">{st?.desc ?? ''}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Requirement({ p, b }: { p: Project; b: Brief }) {
  const vd = b?.visual_direction ?? {
    styles: [],
    styles_undecided: false,
    avoid_styles: [],
    moods: [],
    likes: [],
    avoid: [],
    colors: { mode: 'suggest', palette: [] },
  }
  const aud = b?.audience ?? { target: '', age_range: 'mixed', desired_reaction: [] }
  const content = b?.content ?? { copy_status: 'will_provide' }
  const refCount = Array.isArray(b?.references) ? b.references.length : 0

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
      <div>
        <Questions b={b} />
        <div className="space-y-4">
          <SectionCard title="Audience">
            <Row label="Target">
              <p className="text-[15px] leading-relaxed">{aud.target || p.objective}</p>
            </Row>
            <Row label="Age range">
              <Chip>{aud.age_range === 'mixed' ? 'Mixed ages' : aud.age_range || 'Mixed'}</Chip>
            </Row>
            {aud.demographic && (
              <Row label="Demographic">
                <p className="text-[15px] text-ink/85">{aud.demographic}</p>
              </Row>
            )}
            <Row label="Desired reaction">
              <Chips items={aud.desired_reaction || []} tone="accent" />
            </Row>
          </SectionCard>

          <SectionCard title="Visual direction">
            <Row label="Styles">{vd.styles_undecided ? <NotSure /> : <StyleTiles ids={vd.styles} />}</Row>
            <Row label="Mood">{vd.moods_undecided ? <NotSure /> : <Chips items={vd.moods || []} tone="accent" />}</Row>
            <Row label="Likes">
              <Chips items={vd.likes || []} />
            </Row>
            <Row label="Avoid">
              <div className="space-y-3">
                <Chips items={[...(vd.avoid_styles || []), ...(vd.avoid || [])]} tone="avoid" />
                {vd.avoid_note && <p className="border-l-2 border-danger/40 pl-3 text-sm text-ink/80 italic">“{vd.avoid_note}”</p>}
              </div>
            </Row>
          </SectionCard>

          <SectionCard title="Color & typography">
            <ColorBlock b={b} />
          </SectionCard>

          <SectionCard title={`References · ${refCount}`}>
            <References b={b} />
          </SectionCard>

          <SectionCard title="Content">
            <Row label="Copy status">
              <Chip tone={content.copy_status === 'need_help' ? 'neutral' : 'default'}>{humanize(content.copy_status)}</Chip>
            </Row>
            {content.copy && (
              <Row label="Copy">
                <p className="rounded-xl bg-bg p-4 text-[15px] leading-relaxed">{content.copy}</p>
              </Row>
            )}
          </SectionCard>

          <SectionCard title="Output">
            <Output b={b} />
          </SectionCard>
        </div>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-28 rounded-[20px] border border-line bg-surface p-5">
          <div className="text-xs font-bold tracking-wide text-muted uppercase">Submission</div>
          <div className="mt-2 text-sm">
            Submitted <b>{formatDate(b.submitted_at)}</b>
          </div>
          <div className="mt-5 space-y-2.5">
            {SECTIONS.map((s) => {
              const flagged = b.questions?.some((q) => q.section === s.id)
              return (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span>{s.label}</span>
                  {flagged ? (
                    <span className="grid size-5 place-items-center rounded-full bg-[#FBF3E3] text-[11px] font-bold text-warning">!</span>
                  ) : (
                    <span className="grid size-5 place-items-center rounded-full bg-soft">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted">{TYPE_LABEL[p.type]} project · conditional questions answered for this type.</div>
        </div>
      </aside>
    </div>
  )
}

function ColorBlock({ b }: { b: Brief }) {
  const c = b?.visual_direction?.colors ?? { mode: 'suggest', palette: [] }
  const modeLabels: Record<string, string> = {
    brand_colors: 'Follow existing brand',
    suggest: 'Designer suggests',
    custom: 'Custom palette',
  }
  const modeLabel = modeLabels[c.mode] || 'Designer suggests'
  const palette = Array.isArray(c.palette) ? c.palette : []
  const typography = b?.visual_direction?.typography

  return (
    <>
      <Row label="Mode">{c.mode === 'suggest' ? <NotSure /> : <Chip>{modeLabel}</Chip>}</Row>
      {palette.length > 0 && (
        <Row label="Palette">
          <div className="flex flex-wrap gap-3">
            {palette.map((hex) => (
              <div key={hex} className="text-center">
                <div className="size-14 rounded-2xl ring-1 ring-ink/10" style={{ background: hex }} />
                <div className="mt-1.5 font-mono text-[11px] text-muted uppercase">{hex}</div>
              </div>
            ))}
          </div>
          {c.note && <p className="mt-3 text-sm text-ink/80 italic">“{c.note}”</p>}
        </Row>
      )}
      <Row label="Typography">
        {!typography || typography === 'not_sure' ? (
          <NotSure />
        ) : (
          <span className={cx('text-2xl', typography === 'serif' && 'font-serif')}>Aa · {humanize(typography)}</span>
        )}
      </Row>
    </>
  )
}

function References({ b }: { b: Brief }) {
  const references = Array.isArray(b?.references) ? b.references : []
  if (!references.length) return <p className="text-sm text-muted">No references added.</p>
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {references.map((r) =>
        r.kind === 'image' ? (
          <figure key={r.id} className="overflow-hidden rounded-2xl border border-line">
            <img src={r.url} alt={r.note ?? 'Client reference'} className="aspect-square w-full object-cover" loading="lazy" />
            {r.note && <figcaption className="p-3 text-xs leading-snug text-ink/80">{r.note}</figcaption>}
          </figure>
        ) : (
          <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="group flex flex-col rounded-2xl border border-line bg-bg p-3 transition hover:border-ink/20">
            <div className="grid aspect-square place-items-center rounded-xl bg-surface">
              <ExternalLink className="size-5 text-muted transition group-hover:text-ink" />
            </div>
            <div className="mt-2 truncate text-xs font-semibold">{r.url.replace(/^https?:\/\//, '')}</div>
            {r.note && <div className="mt-1 text-xs leading-snug text-ink/80">{r.note}</div>}
          </a>
        ),
      )}
    </div>
  )
}

function Output({ b }: { b: Brief }) {
  const g = b?.output?.graphic
  const u = b?.output?.uiux
  if (!g && !u) return null
  return (
    <>
      {g && (
        <>
          <Row label="Graphic usage">
            <Chips items={g.usage || []} />
          </Row>
          {g.social_format && (
            <Row label="Social format">
              <Chip>{humanize(g.social_format)}</Chip>
            </Row>
          )}
          {g.print_size && (
            <Row label="Print">
              <p className="text-[15px]">
                {g.print_size} · {humanize(g.orientation ?? '')}
              </p>
            </Row>
          )}
          <Row label="Graphic formats">
            <Chips items={(g.final_formats || []).map((f) => f.toUpperCase())} />
          </Row>
        </>
      )}
      {u && (
        <>
          <Row label="UI/UX target">
            <Chip>{humanize(u.design_target || 'App')}</Chip>
          </Row>
          <Row label="Platforms">
            <Chips items={u.platforms || []} />
          </Row>
          <Row label="Existing product">
            {u.existing_product ? (
              <a href={u.product_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[15px] font-semibold underline-offset-2 hover:underline">
                {u.product_url?.replace(/^https?:\/\//, '')} <ExternalLink className="size-3.5" />
              </a>
            ) : (
              <span className="text-[15px]">None — new product</span>
            )}
          </Row>
          <Row label="Design system">{u.design_system === 'not_sure' || !u.design_system ? <NotSure /> : <Chip>{humanize(u.design_system)}</Chip>}</Row>
          <Row label="UI/UX formats">
            <Chips items={(u.final_formats || []).map((f) => (f === 'figma' ? 'Figma' : f.toUpperCase()))} />
          </Row>
        </>
      )}
    </>
  )
}

/* ---------------- Assets ---------------- */

const ASSET_TONE = {
  provided: 'bg-[#E7F3EA] text-[#2F6B41]',
  pending: 'bg-[#FBF3E3] text-[#8A5F12]',
  not_applicable: 'bg-bg text-muted',
}

function Assets({ b }: { b: Brief }) {
  const checklist = b?.assets_checklist && typeof b.assets_checklist === 'object' ? b.assets_checklist : {}
  const files = Array.isArray(b?.files) ? b.files : []
  const counts = Object.values(checklist).reduce<Record<string, number>>((a, s) => ({ ...a, [s]: (a[s] ?? 0) + 1 }), {})
  const total = files.reduce((s, f) => s + (f?.size_bytes || 0), 0)
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <SectionCard
        title="Asset checklist"
        action={
          <span className="text-xs font-semibold text-muted">
            {counts.provided ?? 0} provided · {counts.pending ?? 0} pending
          </span>
        }
      >
        <ul className="divide-y divide-line">
          {ASSET_CATEGORIES.map((c) => {
            const s = checklist[c] ?? 'not_applicable'
            return (
              <li key={c} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <span className={cx('text-[15px]', s === 'not_applicable' && 'text-muted')}>{humanize(c)}</span>
                <span className={cx('rounded-full px-2.5 py-1 text-xs font-semibold', ASSET_TONE[s])}>{s === 'not_applicable' ? 'N/A' : humanize(s)}</span>
              </li>
            )
          })}
        </ul>
      </SectionCard>
      <SectionCard
        title={`Files · ${files.length}`}
        action={<span className="text-xs font-semibold text-muted">{formatBytes(total)} of 200 MB</span>}
      >
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-bg">
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, (total / 200_000_000) * 100)}%` }} />
        </div>
        {files.length ? (
          <ul className="space-y-2">
            {files.map((f) => {
              const img = f.mime_type?.startsWith('image/')
              const Icon = img ? FileImage : FileText
              return (
                <li key={f.id} className="flex items-center gap-3 rounded-2xl border border-line p-3">
                  <span className={cx('grid size-10 shrink-0 place-items-center rounded-xl', img ? 'bg-soft' : 'bg-bg')}>
                    <Icon className="size-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{f.file_name}</div>
                    <div className="text-xs text-muted">
                      {humanize(f.category)} · {formatBytes(f.size_bytes)}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    Open
                  </Button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted">No files uploaded.</p>
        )}
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted">
          <Lock className="size-3" /> Private storage · short-lived signed URLs
        </p>
      </SectionCard>
    </div>
  )
}

/* ---------------- Review ---------------- */

function Review({ p, b, ctx, onApprove, onClarify }: { p: Project; b: Brief; ctx: Ctx; onApprove: () => void; onClarify: () => void }) {
  const [text, setText] = useState(b?.designer_interpretation ?? '')
  const dirty = text !== (b?.designer_interpretation ?? '')
  const canDecide = p.status === 'submitted'
  const vd = b?.visual_direction
  const moods = Array.isArray(vd?.moods) ? vd.moods : []
  const avoids = [...(vd?.avoid_styles || []), ...(vd?.avoid || [])].slice(0, 5)

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <Questions b={b} />
        <SectionCard
          title={
            <span className="flex items-center gap-2">
              <Sparkles className="size-4" /> Designer interpretation
            </span>
          }
          action={<span className="rounded-full bg-bg px-2.5 py-1 text-xs font-semibold text-muted ring-1 ring-line">Internal</span>}
        >
          <p className="mb-3 text-sm text-muted">Translate the client's words into design decisions. Never shown to the client.</p>
          <textarea
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={cx(inputCls, 'resize-y leading-relaxed')}
            placeholder="e.g. “Premium but not corporate” → serif display + generous whitespace, warm neutrals, avoid navy and stock photos…"
          />
          <div className="mt-3 flex justify-end">
            <Button
              variant="dark"
              disabled={!dirty}
              onClick={() => {
                ctx.update(p.id, (x) => ({ brief: x.brief && { ...x.brief, designer_interpretation: text } }))
                ctx.notify('Interpretation saved')
              }}
            >
              Save note
            </Button>
          </div>
        </SectionCard>
        <SectionCard title="At a glance">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <div className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">Feel</div>
              <Chips items={moods} tone="accent" />
            </div>
            <div>
              <div className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">Avoid</div>
              <Chips items={avoids} tone="avoid" />
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="space-y-3">
        <div className="rounded-[20px] border border-[#D8EFA3] bg-soft p-5">
          <ShieldCheck className="size-5" />
          <h3 className="mt-3 font-bold">Ready to start designing?</h3>
          <p className="mt-1 text-sm text-ink/70">Approving locks the brief and produces the final Design Brief.</p>
          <Button variant="dark" className="mt-4 w-full" disabled={!canDecide} onClick={onApprove}>
            Approve brief
          </Button>
        </div>
        <div className="rounded-[20px] border border-line bg-surface p-5">
          <MessageCircleQuestion className="size-5" />
          <h3 className="mt-3 font-bold">Something unclear?</h3>
          <p className="mt-1 text-sm text-muted">Ask per section. The client only edits what you flag.</p>
          <Button className="mt-4 w-full" disabled={!canDecide} onClick={onClarify}>
            Request clarification
          </Button>
        </div>
        {!canDecide && <p className="px-1 text-xs text-muted">Decisions are available once the client resubmits.</p>}
      </div>
    </div>
  )
}

/* ---------------- Final Brief ---------------- */

function FinalBrief({ p, b }: { p: Project; b: Brief }) {
  const vd = b?.visual_direction ?? {
    styles: [],
    styles_undecided: false,
    avoid_styles: [],
    moods: [],
    likes: [],
    avoid: [],
    colors: { mode: 'suggest', palette: [] },
  }
  const aud = b?.audience ?? { target: '', age_range: 'mixed', desired_reaction: [] }
  const checklist = b?.assets_checklist && typeof b.assets_checklist === 'object' ? b.assets_checklist : {}

  return (
    <article className="mx-auto max-w-4xl overflow-hidden rounded-[24px] border border-line bg-surface">
      <header className="relative overflow-hidden border-b border-line px-6 py-10 sm:px-12">
        <div aria-hidden className="absolute -top-24 -right-10 size-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F3EA] px-2.5 py-1 text-[#2F6B41]">
              <Lock className="size-3" /> Approved {formatDate(b?.approved_at)}
            </span>
            <span>Design Brief · v{b?.version ?? 1}</span>
          </div>
          <h2 className="mt-5 text-[32px] leading-[1.05] font-extrabold tracking-[-0.03em] sm:text-5xl">{p.name}</h2>
          <p className="mt-4 max-w-2xl font-serif text-2xl leading-snug text-ink/80 italic">{p.objective}</p>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <span>
              <span className="text-muted">Deadline</span> <b>{formatDate(p.deadline)}</b>
            </span>
            <span>
              <span className="text-muted">Type</span> <b>{TYPE_LABEL[p.type]}</b>
            </span>
            <span>
              <span className="text-muted">Deliverables</span> <b>{(p.deliverables || []).join(', ')}</b>
            </span>
          </div>
        </div>
      </header>
      <div className="px-6 py-8 sm:px-12">
        <Row label="Audience">
          <p className="text-[15px] leading-relaxed">
            {aud.target || p.objective}. <span className="text-muted">Age {aud.age_range || 'Mixed'}{aud.demographic ? ` · ${aud.demographic}` : ''}.</span>
          </p>
          <div className="mt-3">
            <Chips items={aud.desired_reaction || []} tone="accent" />
          </div>
        </Row>
        <Row label="Visual direction">
          {vd.styles_undecided ? <NotSure /> : <StyleTiles ids={vd.styles || []} />}
          <div className="mt-3">
            <Chips items={vd.moods || []} tone="accent" />
          </div>
        </Row>
        <Row label="Preferences">
          <Chips items={vd.likes || []} />
        </Row>
        <Row label="Avoid">
          <Chips items={[...(vd.avoid_styles || []), ...(vd.avoid || [])]} tone="avoid" />
          {vd.avoid_note && <p className="mt-2 text-sm italic">“{vd.avoid_note}”</p>}
        </Row>
        <ColorBlock b={b} />
        <Row label="References">
          <References b={b} />
        </Row>
        <Row label="Content">
          <Chip>{humanize(b?.content?.copy_status || 'will_provide')}</Chip>
          {b?.content?.copy && <p className="mt-2 text-[15px]">{b.content.copy}</p>}
        </Row>
        <Row label="Assets">
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(checklist)
              .filter(([, s]) => s !== 'not_applicable')
              .map(([c, s]) => (
                <span key={c} className={cx('rounded-full px-3 py-1 text-[13px] font-medium', ASSET_TONE[s])}>
                  {humanize(c)} · {s}
                </span>
              ))}
          </div>
        </Row>
        <Output b={b} />
      </div>
      {b?.designer_interpretation && (
        <footer className="m-4 mt-0 rounded-[20px] bg-ink p-6 text-white sm:m-6 sm:mt-0 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-primary uppercase">
            <Sparkles className="size-3.5" /> Designer interpretation · internal
          </div>
          <p className="mt-3 text-lg leading-relaxed text-white/90">{b.designer_interpretation}</p>
        </footer>
      )}
    </article>
  )
}

function NoBrief({ p }: { p: Project }) {
  const msg: Partial<Record<Status, string>> = {
    draft: 'Generate and share the link to start collecting requirements.',
    sent: "The link has been shared — the client hasn't opened it yet.",
    in_progress: `Your client is ${p.progress ?? 0}% through the form. Answers autosave as they go.`,
  }
  return (
    <div className="grid place-items-center rounded-[20px] border border-dashed border-line bg-surface/60 px-6 py-20 text-center">
      <div className="grid w-40 grid-cols-4 gap-1 overflow-hidden rounded-2xl opacity-80">
        {(['minimal', 'bold', 'editorial', 'futuristic'] as const).map((s) => (
          <StyleThumb key={s} id={s} className="aspect-[1/2]" />
        ))}
      </div>
      <h3 className="mt-6 text-lg font-bold">No submission yet</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{msg[p.status] ?? 'Waiting for the client.'}</p>
      {p.status === 'in_progress' && (
        <div className="mt-5 h-1.5 w-56 overflow-hidden rounded-full bg-bg">
          <div className="h-full rounded-full bg-primary" style={{ width: `${p.progress}%` }} />
        </div>
      )}
    </div>
  )
}
