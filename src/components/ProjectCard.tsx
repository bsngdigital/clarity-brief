import { ArrowUpRight, CalendarDays } from 'lucide-react'
import { STYLES, TYPE_LABEL, formatDate, type Client, type Project } from '../data'
import { StatusBadge, StyleThumb, cx } from '../ui'

export function ProjectCard({ project, client, onOpen }: { project: Project; client?: Client; onOpen: () => void }) {
  const styles = project.brief?.visual_direction.styles ?? []
  const undecided = project.brief?.visual_direction.styles_undecided
  const styleNames = styles.map((s) => STYLES.find((x) => x.id === s)?.name).join(' · ')

  return (
    <button
      onClick={onOpen}
      className="group flex flex-col overflow-hidden rounded-[20px] border border-line bg-surface text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/15 hover:shadow-[0_20px_40px_-24px_rgba(23,32,25,0.35)]"
    >
      <div className="relative h-32 border-b border-line">
        {styles.length > 0 ? (
          <div className="flex h-full">
            {styles.map((s) => (
              <StyleThumb key={s} id={s} className="h-full flex-1" />
            ))}
          </div>
        ) : (
          <div
            className={cx('grid h-full place-items-center', undecided ? 'bg-soft' : 'bg-bg')}
            style={{ backgroundImage: 'radial-gradient(rgba(23,32,25,0.08) 1px, transparent 1px)', backgroundSize: '14px 14px' }}
          >
            <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted ring-1 ring-line">
              {undecided ? 'Style left to designer' : project.status === 'in_progress' ? 'Client is filling in…' : 'Awaiting client brief'}
            </span>
          </div>
        )}
        <span className="absolute top-3 right-3 grid size-8 translate-y-1 place-items-center rounded-full bg-surface opacity-0 shadow-sm ring-1 ring-line transition group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <StatusBadge status={project.status} />
          <span className="text-xs font-semibold text-muted">{TYPE_LABEL[project.type]}</span>
        </div>
        <h3 className="text-[17px] leading-snug font-bold tracking-tight">{project.name}</h3>
        <p className="mt-1 text-sm text-muted">{client?.company ?? client?.name}</p>
        {project.status === 'in_progress' && project.progress != null && (
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-xs font-medium text-muted">
              <span>Client progress</span>
              <span className="text-ink">{project.progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-bg">
              <div className="h-full rounded-full bg-primary" style={{ width: `${project.progress}%` }} />
            </div>
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-5 text-xs text-muted">
          <span className="truncate">{styleNames || '—'}</span>
          <span className="flex shrink-0 items-center gap-1">
            <CalendarDays className="size-3.5" />
            {project.deadline ? formatDate(project.deadline) : 'No deadline'}
          </span>
        </div>
      </div>
    </button>
  )
}
