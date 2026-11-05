import { ArrowRight, Clock, Inbox, MessageCircleQuestion, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Ctx } from '../App'
import { DESIGNER, formatDate, type Status } from '../data'
import { Button, StyleThumb, cx } from '../ui'
import { ProjectCard } from '../components/ProjectCard'

export function Dashboard({ ctx }: { ctx: Ctx }) {
  const { projects, clients, go } = ctx
  const count = (s: Status) => projects.filter((p) => p.status === s).length
  const pending = projects.filter((p) => p.status === 'submitted')
  const recent = [...projects].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6)
  const clientOf = (id: string) => clients.find((c) => c.id === id)

  const stats = [
    { key: 'submitted', label: 'Pending review', value: count('submitted'), icon: Inbox, accent: true },
    { key: 'needs_clarification', label: 'Needs clarification', value: count('needs_clarification'), icon: MessageCircleQuestion },
    { key: 'in_progress', label: 'Client filling in', value: count('in_progress'), icon: Clock },
    { key: 'approved', label: 'Approved briefs', value: count('approved'), icon: ShieldCheck },
  ] as const

  return (
    <div className="space-y-12">
      <section className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-6 -top-10 bottom-0 [mask-image:radial-gradient(70%_80%_at_30%_30%,black,transparent)] opacity-60"
          style={{
            backgroundImage: 'linear-gradient(rgba(23,32,25,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(23,32,25,0.05) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted ring-1 ring-line">
              <span className="size-1.5 rounded-full bg-primary-strong" />
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="text-[40px] leading-[1.05] font-extrabold tracking-[-0.03em] sm:text-[56px] lg:text-[64px]">
              Good morning, {DESIGNER.name.split(' ')[0]}.
              <br />
              <span className="font-serif font-normal tracking-normal text-muted italic">
                {pending.length} brief{pending.length === 1 ? '' : 's'} await your eye.
              </span>
            </h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => go({ name: 'projects' })}>All projects</Button>
            <Button variant="dark" onClick={ctx.newProject}>
              Create brief link
            </Button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map((s) => (
          <button
            key={s.key}
            onClick={() => go({ name: 'projects', filter: s.key })}
            className={cx(
              'group relative overflow-hidden rounded-[20px] border p-5 text-left transition hover:-translate-y-0.5',
              'accent' in s ? 'border-[#D8EFA3] bg-soft' : 'border-line bg-surface hover:border-ink/15',
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cx('grid size-9 place-items-center rounded-xl', 'accent' in s ? 'bg-primary' : 'bg-bg')}>
                <s.icon className="size-[18px]" />
              </span>
              <ArrowRight className="size-4 -translate-x-1 text-muted opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
            </div>
            <div className="mt-6 text-4xl font-extrabold tracking-tight tabular-nums">{s.value}</div>
            <div className="mt-1 text-sm font-medium text-muted">{s.label}</div>
          </button>
        ))}
      </section>

      {pending.length > 0 && (
        <section>
          <SectionHead title="Needs your review" sub="Submitted by clients and ready to turn into a brief." />
          <div className="grid gap-4 lg:grid-cols-2">
            {pending.map((p) => {
              const c = clientOf(p.client_id)
              const b = p.brief
              const styles = Array.isArray(b?.visual_direction?.styles) ? b.visual_direction.styles : []
              const moods = Array.isArray(b?.visual_direction?.moods) ? b.visual_direction.moods : []
              const filesCount = Array.isArray(b?.files) ? b.files.length : 0
              const refCount = Array.isArray(b?.references) ? b.references.length : 0

              return (
                <div key={p.id} className="flex flex-col overflow-hidden rounded-[20px] border border-line bg-surface sm:flex-row">
                  <div className="grid h-40 grid-cols-3 sm:h-auto sm:w-56 sm:grid-cols-1 sm:grid-rows-3 bg-bg">
                    {styles.length > 0 ? (
                      styles.slice(0, 3).map((s) => (
                        <StyleThumb key={s} id={s} className="h-full" />
                      ))
                    ) : (
                      <div className="col-span-3 sm:col-span-1 sm:row-span-3 grid place-items-center p-4 text-xs font-semibold text-muted text-center">
                        Awaiting visual style
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="text-xs font-semibold text-muted">
                      {c?.company ?? c?.name ?? 'Client'} · submitted {formatDate(b?.submitted_at)}
                    </div>
                    <h3 className="mt-1 text-xl font-bold tracking-tight">{p.name}</h3>
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">“{b?.audience?.target || p.objective}”</p>
                    {moods.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {moods.map((m) => (
                          <span key={m} className="rounded-full bg-bg px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-line">
                            {m}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-6 flex items-center gap-2">
                      <Button variant="primary" onClick={() => go({ name: 'project', id: p.id })}>
                        Review brief <ArrowRight className="size-4" />
                      </Button>
                      <span className="text-xs text-muted">{filesCount} files · {refCount} references</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section>
        <SectionHead
          title="Recent projects"
          action={
            <button onClick={() => go({ name: 'projects' })} className="flex items-center gap-1 text-sm font-semibold hover:underline">
              View all <ArrowRight className="size-4" />
            </button>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {recent.map((p) => (
            <ProjectCard key={p.id} project={p} client={clientOf(p.client_id)} onOpen={() => go({ name: 'project', id: p.id })} />
          ))}
        </div>
      </section>
    </div>
  )
}

export function SectionHead({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  )
}
