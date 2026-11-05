import { useState } from 'react'
import { FolderOpen, Search } from 'lucide-react'
import type { Ctx } from '../App'
import { STATUS_META, type Status } from '../data'
import { Button, cx } from '../ui'
import { ProjectCard } from '../components/ProjectCard'

const FILTERS: (Status | 'all')[] = ['all', 'draft', 'sent', 'in_progress', 'submitted', 'needs_clarification', 'approved']

export function Projects({ ctx, initialFilter, initialQ }: { ctx: Ctx; initialFilter?: string; initialQ?: string }) {
  const { projects, clients, go } = ctx
  const [filter, setFilter] = useState<Status | 'all'>((initialFilter as Status) ?? 'all')
  const [q, setQ] = useState(initialQ ?? '')

  const clientOf = (id: string) => clients.find((c) => c.id === id)
  const ql = q.trim().toLowerCase()
  const list = projects.filter((p) => {
    if (filter !== 'all' && p.status !== filter) return false
    if (!ql) return true
    const c = clientOf(p.client_id)
    return [p.name, c?.name, c?.company].some((s) => s?.toLowerCase().includes(ql))
  })

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[40px] leading-[1.1] font-extrabold tracking-[-0.03em]">Projects</h1>
          <p className="mt-2 text-muted">{projects.length} projects across {clients.length} clients</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search project or client"
            className="h-11 w-full rounded-full border border-line bg-surface pr-4 pl-10 text-sm outline-none transition focus:border-ink/40 focus:ring-4 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {FILTERS.map((f) => {
          const n = f === 'all' ? projects.length : projects.filter((p) => p.status === f).length
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cx(
                'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap ring-1 transition',
                filter === f ? 'bg-ink text-white ring-ink' : 'bg-surface text-muted ring-line hover:text-ink',
              )}
            >
              {f === 'all' ? 'All' : STATUS_META[f].label}
              <span className={cx('rounded-full px-1.5 text-xs tabular-nums', filter === f ? 'bg-white/15' : 'bg-bg')}>{n}</span>
            </button>
          )
        })}
      </div>

      {list.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <ProjectCard key={p.id} project={p} client={clientOf(p.client_id)} onOpen={() => go({ name: 'project', id: p.id })} />
          ))}
        </div>
      ) : (
        <div className="grid place-items-center rounded-[20px] border border-dashed border-line bg-surface/60 px-6 py-20 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-soft">
            <FolderOpen className="size-5" />
          </span>
          <h3 className="mt-4 text-lg font-bold">No projects match</h3>
          <p className="mt-1 max-w-sm text-sm text-muted">Try another status or search term, or start a new brief for a client.</p>
          <div className="mt-5 flex gap-2">
            <Button
              onClick={() => {
                setFilter('all')
                setQ('')
              }}
            >
              Clear filters
            </Button>
            <Button variant="primary" onClick={ctx.newProject}>
              New project
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
