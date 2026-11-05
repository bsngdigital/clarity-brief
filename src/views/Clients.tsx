import { useState } from 'react'
import { ArrowUpRight, ChevronRight, Mail, Phone, Plus, User } from 'lucide-react'
import type { Ctx } from '../App'
import { Avatar, Button, StatusBadge } from '../ui'
import { AddClientModal } from '../modals'

export function Clients({ ctx }: { ctx: Ctx }) {
  const { clients, projects, go } = ctx
  const [open, setOpen] = useState(false)

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[40px] leading-[1.1] font-extrabold tracking-[-0.03em]">Clients</h1>
          <p className="mt-2 text-muted">People and brands you collect design briefs from.</p>
        </div>
        <Button variant="dark" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Add client
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {clients.map((c) => {
          const ps = projects.filter((p) => p.client_id === c.id)
          return (
            <div key={c.id} className="group flex flex-col rounded-[20px] border border-line bg-surface p-5 transition hover:border-ink/20">
              <div
                onClick={() => go({ name: 'client-detail', id: c.id })}
                className="flex cursor-pointer items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={c.name} className="size-11 text-sm shrink-0" />
                  <div className="min-w-0">
                    <div className="truncate font-bold group-hover:text-ink">{c.name}</div>
                    <div className="truncate text-sm text-muted">{c.company ?? 'Independent'}</div>
                  </div>
                </div>
                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-bg text-muted transition group-hover:bg-primary group-hover:text-ink">
                  <ChevronRight className="size-4" />
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-sm text-muted">
                {c.email && (
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="size-3.5 shrink-0" /> {c.email}
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="size-3.5 shrink-0" /> {c.phone}
                  </div>
                )}
              </div>

              <div className="mt-5 flex-1 space-y-1.5 border-t border-line pt-4">
                <div className="flex items-center justify-between text-xs text-muted font-semibold mb-2">
                  <span>Projects ({ps.length})</span>
                  <button
                    onClick={() => go({ name: 'client-detail', id: c.id })}
                    className="hover:underline text-ink"
                  >
                    View profile
                  </button>
                </div>
                {ps.length ? (
                  ps.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => go({ name: 'project', id: p.id })}
                      className="group/p flex w-full items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-left -mx-2 hover:bg-bg transition"
                    >
                      <span className="truncate text-sm font-medium">{p.name}</span>
                      <span className="flex items-center gap-1.5">
                        <StatusBadge status={p.status} />
                        <ArrowUpRight className="size-3.5 text-muted opacity-0 group-hover/p:opacity-100" />
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-muted">No projects yet.</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <AddClientModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={(c) => {
          ctx.addClient(c)
          ctx.notify('Client added')
        }}
      />
    </div>
  )
}
