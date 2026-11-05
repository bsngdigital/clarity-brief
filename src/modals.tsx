import { useState, type ReactNode } from 'react'
import { Check, Copy, Link2, Plus, Sparkles, X } from 'lucide-react'
import { SECTIONS, STYLES, type Client, type Project, type ProjectType, type StyleId } from './data'
import { Button, Field, Modal, StyleThumb, cx, inputCls } from './ui'

export type NewProjectInput = Pick<Project, 'client_id' | 'name' | 'type' | 'objective' | 'deliverables' | 'deadline' | 'language'>

export const shareUrl = (token: string) => `clarity.app/c/${token}`

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; sub?: string }[] }) {
  return (
    <div role="radiogroup" className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'rounded-xl border px-3 py-2.5 text-left transition',
            value === o.value ? 'border-ink bg-soft' : 'border-line bg-surface hover:border-ink/25',
          )}
        >
          <div className="text-sm font-semibold">{o.label}</div>
          {o.sub && <div className="mt-0.5 text-xs text-muted">{o.sub}</div>}
        </button>
      ))}
    </div>
  )
}

export function NewProjectModal({
  open,
  onClose,
  clients,
  addClient,
  create,
  update,
  notify,
  openProject,
}: {
  open: boolean
  onClose: () => void
  clients: Client[]
  addClient: (c: Omit<Client, 'id'>) => Client
  create: (i: NewProjectInput) => Project
  update: (id: string, patch: Partial<Project>) => void
  notify: (m: string) => void
  openProject: (id: string) => void
}) {
  const blank = { client_id: clients[0]?.id ?? '', name: '', type: 'graphic' as ProjectType, objective: '', deliverables: [] as string[], deadline: '', language: 'id' as 'id' | 'en' }
  const [f, setF] = useState(blank)
  const [newClient, setNewClient] = useState('')
  const [clientMode, setClientMode] = useState<'pick' | 'new'>('pick')
  const [deliv, setDeliv] = useState('')
  const [tried, setTried] = useState(false)
  const [created, setCreated] = useState<Project | null>(null)

  const reset = () => {
    setF(blank)
    setNewClient('')
    setClientMode('pick')
    setDeliv('')
    setTried(false)
    setCreated(null)
  }
  const close = () => {
    onClose()
    setTimeout(reset, 200)
  }

  const errors = {
    client: clientMode === 'new' ? (!newClient.trim() ? 'Enter a client name' : '') : !f.client_id ? 'Pick a client' : '',
    name: !f.name.trim() ? 'Project name is required' : '',
    objective: !f.objective.trim() ? 'Describe the objective' : '',
    deliverables: f.deliverables.length === 0 ? 'Add at least one deliverable' : '',
  }
  const valid = Object.values(errors).every((e) => !e)

  const addDeliv = () => {
    const v = deliv.trim()
    if (v && !f.deliverables.includes(v)) setF({ ...f, deliverables: [...f.deliverables, v] })
    setDeliv('')
  }

  const submit = () => {
    setTried(true)
    if (!valid) return
    let client_id = f.client_id
    if (clientMode === 'new') client_id = addClient({ name: newClient.trim() }).id
    const p = create({ ...f, client_id, deadline: f.deadline || undefined })
    update(p.id, { status: 'sent' })
    setCreated({ ...p, status: 'sent' })
  }

  if (created) {
    return (
      <Modal
        open={open}
        onClose={close}
        eyebrow="Project created"
        title="Your brief link is ready"
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Done
            </Button>
            <Button variant="dark" onClick={() => { openProject(created.id); setTimeout(reset, 200) }}>
              Open project
            </Button>
          </>
        }
      >
        <div className="rounded-[20px] bg-soft p-6 ring-1 ring-[#D8EFA3]">
          <span className="grid size-11 place-items-center rounded-full bg-primary">
            <Check className="size-5" strokeWidth={3} />
          </span>
          <h3 className="mt-4 text-lg font-bold">{created.name}</h3>
          <p className="mt-1 text-sm text-muted">Share this link with your client — they can fill in the brief from their phone, no account needed.</p>
          <CopyLink token={created.share_token} onCopied={() => notify('Link copied to clipboard')} className="mt-5" />
        </div>
        <p className="mt-4 text-xs text-muted">Status moved from Draft to Sent. You'll get an email the moment the client submits.</p>
      </Modal>
    )
  }

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      eyebrow="New project"
      title="Set up a brief for your client"
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit}>
            <Link2 className="size-4" /> Save & generate link
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-semibold">Client</span>
            <button type="button" onClick={() => setClientMode(clientMode === 'pick' ? 'new' : 'pick')} className="text-xs font-semibold text-ink underline-offset-2 hover:underline">
              {clientMode === 'pick' ? '+ New client' : 'Choose existing'}
            </button>
          </div>
          {clientMode === 'pick' ? (
            <select className={inputCls} value={f.client_id} onChange={(e) => setF({ ...f, client_id: e.target.value })}>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.company ? ` — ${c.company}` : ''}
                </option>
              ))}
            </select>
          ) : (
            <input autoFocus className={inputCls} placeholder="Client name" value={newClient} onChange={(e) => setNewClient(e.target.value)} />
          )}
          {tried && errors.client && <span className="mt-1.5 block text-xs font-medium text-danger">{errors.client}</span>}
        </div>

        <Field label="Project name" error={tried ? errors.name : undefined}>
          <input className={inputCls} placeholder="e.g. Kopi Senja — Brand Refresh" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>

        <div>
          <span className="mb-1.5 block text-sm font-semibold">Project type</span>
          <Segmented
            value={f.type}
            onChange={(type) => setF({ ...f, type })}
            options={[
              { value: 'graphic', label: 'Graphic', sub: 'Brand, print, social' },
              { value: 'uiux', label: 'UI/UX', sub: 'Web, app, product' },
              { value: 'both', label: 'Both', sub: 'Asks both blocks' },
            ]}
          />
        </div>

        <Field label="Objective" error={tried ? errors.objective : undefined} hint="Shown to the client read-only on the welcome screen.">
          <textarea rows={3} className={cx(inputCls, 'resize-none')} placeholder="What should this design achieve?" value={f.objective} onChange={(e) => setF({ ...f, objective: e.target.value })} />
        </Field>

        <div>
          <span className="mb-1.5 block text-sm font-semibold">Deliverables</span>
          <div className={cx(inputCls, 'flex flex-wrap items-center gap-1.5 py-2')}>
            {f.deliverables.map((d) => (
              <span key={d} className="inline-flex items-center gap-1 rounded-full bg-soft py-1 pr-1.5 pl-3 text-[13px] font-medium ring-1 ring-[#D8EFA3]">
                {d}
                <button type="button" aria-label={`Remove ${d}`} onClick={() => setF({ ...f, deliverables: f.deliverables.filter((x) => x !== d) })} className="grid size-4 place-items-center rounded-full hover:bg-ink/10">
                  <X className="size-3" />
                </button>
              </span>
            ))}
            <input
              className="min-w-[140px] flex-1 bg-transparent py-0.5 outline-none placeholder:text-muted/70"
              placeholder={f.deliverables.length ? 'Add another…' : 'Type and press Enter'}
              value={deliv}
              onChange={(e) => setDeliv(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  addDeliv()
                }
              }}
              onBlur={addDeliv}
            />
          </div>
          {tried && errors.deliverables && <span className="mt-1.5 block text-xs font-medium text-danger">{errors.deliverables}</span>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Deadline" optional>
            <input type="date" className={inputCls} value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} />
          </Field>
          <div>
            <span className="mb-1.5 block text-sm font-semibold">Client form language</span>
            <Segmented
              value={f.language}
              onChange={(language) => setF({ ...f, language })}
              options={[
                { value: 'id', label: 'Bahasa' },
                { value: 'en', label: 'English' },
              ]}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}

export function CopyLink({ token, onCopied, disabled, className }: { token: string; onCopied: () => void; disabled?: boolean; className?: string }) {
  const [copied, setCopied] = useState(false)
  const url = shareUrl(token)
  return (
    <div className={cx('flex items-center gap-2 rounded-xl bg-surface p-1.5 pl-3.5 ring-1 ring-line', disabled && 'opacity-50', className)}>
      <Link2 className="size-4 shrink-0 text-muted" />
      <span className={cx('min-w-0 flex-1 truncate font-mono text-[13px]', disabled && 'line-through')}>{url}</span>
      <Button
        size="sm"
        variant={copied ? 'primary' : 'dark'}
        disabled={disabled}
        onClick={() => {
          navigator.clipboard?.writeText(`https://${url}`).catch(() => {})
          setCopied(true)
          onCopied()
          setTimeout(() => setCopied(false), 1600)
        }}
      >
        {copied ? <Check className="size-3.5" strokeWidth={3} /> : <Copy className="size-3.5" />}
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  )
}

export function ConfirmModal({
  open,
  onClose,
  title,
  children,
  confirmLabel,
  onConfirm,
  tone = 'primary',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  confirmLabel: string
  onConfirm: () => void
  tone?: 'primary' | 'dark' | 'danger'
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : tone}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-[15px] leading-relaxed text-muted">{children}</div>
    </Modal>
  )
}

export function ClarifyModal({ open, onClose, onSubmit, clientEmail }: { open: boolean; onClose: () => void; onSubmit: (q: { section: string; client_question: string }[], note: string) => void; clientEmail?: string }) {
  const [picked, setPicked] = useState<Record<string, string>>({})
  const [note, setNote] = useState('')
  const [tried, setTried] = useState(false)
  const entries = Object.entries(picked)
  const valid = entries.length > 0 && entries.every(([, q]) => q.trim())

  const close = () => {
    onClose()
    setTimeout(() => {
      setPicked({})
      setNote('')
      setTried(false)
    }, 200)
  }

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      eyebrow="Needs clarification"
      title="What should the client revisit?"
      footer={
        <>
          <span className="mr-auto hidden text-xs text-muted sm:block">{clientEmail ? `Emails ${clientEmail}` : 'No client email — share the link manually'}</span>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            variant="dark"
            onClick={() => {
              setTried(true)
              if (!valid) return
              onSubmit(entries.map(([section, client_question]) => ({ section, client_question: client_question.trim() })), note)
              close()
            }}
          >
            Send to client
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-muted">The client can only edit the sections you mark, and will see your question right above them.</p>
      <div className="space-y-2">
        {SECTIONS.map((s) => {
          const on = s.id in picked
          return (
            <div key={s.id} className={cx('rounded-2xl border transition', on ? 'border-ink/30 bg-soft/50' : 'border-line')}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => {
                  const n = { ...picked }
                  if (on) delete n[s.id]
                  else n[s.id] = ''
                  setPicked(n)
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className={cx('grid size-5 place-items-center rounded-md border transition', on ? 'border-ink bg-ink text-primary' : 'border-line bg-surface')}>
                  {on && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <span className="text-sm font-semibold">{s.label}</span>
              </button>
              {on && (
                <div className="px-4 pb-4">
                  <textarea
                    autoFocus
                    rows={2}
                    className={cx(inputCls, 'resize-none text-sm')}
                    placeholder="Question for the client…"
                    value={picked[s.id]}
                    onChange={(e) => setPicked({ ...picked, [s.id]: e.target.value })}
                  />
                  {tried && !picked[s.id].trim() && <span className="mt-1 block text-xs font-medium text-danger">Write a question for this section</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {tried && entries.length === 0 && <p className="mt-3 text-sm font-medium text-danger">Select at least one section.</p>}
      <div className="mt-5">
        <Field label="Internal note" optional hint="Only visible to you.">
          <textarea rows={2} className={cx(inputCls, 'resize-none text-sm')} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Budget conversation pending" />
        </Field>
      </div>
    </Modal>
  )
}

/** Preview of the client-facing Visual Style step (max 3, "Not sure" exclusive). */
export function StylePreviewModal({ open, onClose, projectName }: { open: boolean; onClose: () => void; projectName: string }) {
  const [sel, setSel] = useState<StyleId[]>([])
  const [notSure, setNotSure] = useState(false)
  const full = sel.length >= 3
  const toggle = (id: StyleId) => {
    setNotSure(false)
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 3 ? s : [...s, id]))
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      eyebrow={`Client preview · ${projectName}`}
      title={
        <span className="text-[28px] sm:text-[32px]">
          What visual styles feel <span className="font-serif font-normal italic">right</span>?
        </span>
      }
      footer={
        <>
          <span className="mr-auto text-xs text-muted">Step 3 of 10 · autosaved</span>
          <Button variant="ghost">Back</Button>
          <Button variant="primary" disabled={!sel.length && !notSure}>
            Next
          </Button>
        </>
      }
    >
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-bg">
        <div className="h-full w-[30%] rounded-full bg-primary" />
      </div>
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="text-muted">Choose up to 3</span>
        <span className="font-semibold tabular-nums">{sel.length}/3</span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {STYLES.map((s) => {
          const on = sel.includes(s.id)
          const dis = full && !on
          return (
            <button
              key={s.id}
              aria-pressed={on}
              disabled={dis}
              title={dis ? 'You can pick up to 3 styles' : undefined}
              onClick={() => toggle(s.id)}
              className={cx(
                'group relative overflow-hidden rounded-2xl border-2 text-left transition',
                on ? 'border-ink bg-soft' : 'border-transparent bg-bg ring-1 ring-line hover:ring-ink/25',
                dis && 'cursor-not-allowed opacity-40',
              )}
            >
              <StyleThumb id={s.id} className="aspect-[4/3] w-full" />
              <div className="p-3">
                <div className="text-sm font-bold">{s.name}</div>
                <div className="mt-0.5 text-xs leading-snug text-muted">{s.desc}</div>
              </div>
              {on && (
                <span className="absolute top-2 right-2 grid size-6 animate-pop-in place-items-center rounded-full bg-ink text-primary">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              )}
            </button>
          )
        })}
      </div>
      <button
        aria-pressed={notSure}
        onClick={() => {
          setNotSure(!notSure)
          setSel([])
        }}
        className={cx('mt-3 flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition', notSure ? 'border-ink bg-soft' : 'border-dashed border-line hover:border-ink/25')}
      >
        <Sparkles className="size-4" />
        <span className="text-sm font-semibold">Not sure — let the designer decide</span>
      </button>
    </Modal>
  )
}

export function AddClientModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (c: Omit<Client, 'id'>) => void }) {
  const [c, setC] = useState({ name: '', company: '', email: '', phone: '' })
  const [tried, setTried] = useState(false)
  const close = () => {
    onClose()
    setTimeout(() => {
      setC({ name: '', company: '', email: '', phone: '' })
      setTried(false)
    }, 200)
  }
  return (
    <Modal
      open={open}
      onClose={close}
      eyebrow="New client"
      title="Add a client"
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setTried(true)
              if (!c.name.trim()) return
              onSave({ name: c.name.trim(), company: c.company || undefined, email: c.email || undefined, phone: c.phone || undefined })
              close()
            }}
          >
            <Plus className="size-4" /> Add client
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={tried && !c.name.trim() ? 'Name is required' : undefined}>
          <input autoFocus className={inputCls} value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
        </Field>
        <Field label="Company" optional>
          <input className={inputCls} value={c.company} onChange={(e) => setC({ ...c, company: e.target.value })} />
        </Field>
        <Field label="Email" optional hint="Used for link & clarification emails.">
          <input type="email" className={inputCls} value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} />
        </Field>
        <Field label="Phone / WhatsApp" optional>
          <input className={inputCls} value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} />
        </Field>
      </div>
    </Modal>
  )
}
