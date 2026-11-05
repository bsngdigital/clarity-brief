import { useState } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  Briefcase,
  Building,
  CheckCircle2,
  Clock,
  Edit2,
  Mail,
  Phone,
  Plus,
  Trash2,
} from 'lucide-react'
import type { Ctx } from '../App'
import { TYPE_LABEL, formatDate, type Client, type Project } from '../data'
import { Avatar, Button, StatusBadge, inputCls } from '../ui'

export function ClientDetail({ ctx, id }: { ctx: Ctx; id: string }) {
  const { clients, projects, go, update, notify } = ctx
  const client = clients.find((c) => c.id === id)

  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(client?.name || '')
  const [company, setCompany] = useState(client?.company || '')
  const [email, setEmail] = useState(client?.email || '')
  const [phone, setPhone] = useState(client?.phone || '')

  if (!client) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-xl font-bold">Client not found</h2>
        <Button onClick={() => go({ name: 'clients' })} className="mt-4">
          <ArrowLeft className="size-4" /> Back to Clients
        </Button>
      </div>
    )
  }

  const clientProjects = projects.filter((p) => p.client_id === client.id)
  const approvedCount = clientProjects.filter((p) => p.status === 'approved').length
  const activeCount = clientProjects.filter((p) => ['in_progress', 'submitted', 'needs_clarification'].includes(p.status)).length

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    // Update client in ctx
    const updatedClient: Client = {
      ...client,
      name,
      company: company || undefined,
      email: email || undefined,
      phone: phone || undefined,
    }
    // Update client array
    const idx = clients.findIndex((c) => c.id === client.id)
    if (idx !== -1) {
      clients[idx] = updatedClient
    }
    setIsEditing(false)
    notify('Client information updated')
  }

  return (
    <div className="space-y-8">
      {/* Back button */}
      <button
        onClick={() => go({ name: 'clients' })}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-ink"
      >
        <ArrowLeft className="size-4" /> All Clients
      </button>

      {/* Header Profile Card */}
      <div className="rounded-[24px] border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={client.name} className="size-16 text-xl shadow-sm" />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{client.name}</h1>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="rounded-full p-1.5 text-muted hover:bg-bg hover:text-ink transition"
                  title="Edit client"
                >
                  <Edit2 className="size-4" />
                </button>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted font-medium">
                <Building className="size-3.5" />
                {client.company || 'Independent Client'}
              </p>

              {/* Contact details */}
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
                {client.email && (
                  <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 hover:text-ink transition">
                    <Mail className="size-3.5" /> {client.email}
                  </a>
                )}
                {client.phone && (
                  <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 hover:text-ink transition">
                    <Phone className="size-3.5" /> {client.phone}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="dark" onClick={ctx.newProject} className="rounded-full">
              <Plus className="size-4" /> New Project
            </Button>
          </div>
        </div>

        {/* Inline Edit Form */}
        {isEditing && (
          <form onSubmit={handleSaveEdit} className="mt-6 border-t border-line pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted mb-1">Company / Brand</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted mb-1">Phone (WhatsApp)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button size="sm" variant="ghost" type="button" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        )}

        {/* Stats Row */}
        <div className="mt-8 grid grid-cols-3 gap-3 border-t border-line pt-6">
          <div className="rounded-2xl bg-bg/50 p-4 text-center">
            <div className="text-2xl font-extrabold tabular-nums">{clientProjects.length}</div>
            <div className="mt-1 text-xs text-muted font-medium">Total Projects</div>
          </div>
          <div className="rounded-2xl bg-soft p-4 text-center">
            <div className="text-2xl font-extrabold text-ink tabular-nums">{activeCount}</div>
            <div className="mt-1 text-xs text-muted font-medium">Active Briefs</div>
          </div>
          <div className="rounded-2xl bg-[#E7F3EA] p-4 text-center">
            <div className="text-2xl font-extrabold text-[#2F6B41] tabular-nums">{approvedCount}</div>
            <div className="mt-1 text-xs text-[#2F6B41] font-medium">Approved Briefs</div>
          </div>
        </div>
      </div>

      {/* Client's Projects */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Projects with {client.name}</h2>
          <span className="text-xs text-muted font-semibold">{clientProjects.length} projects</span>
        </div>

        {clientProjects.length > 0 ? (
          <div className="space-y-3">
            {clientProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => go({ name: 'project', id: p.id })}
                className="group flex cursor-pointer items-center justify-between rounded-2xl border border-line bg-surface p-5 transition hover:border-ink/20 hover:shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="rounded-full bg-bg px-2.5 py-0.5 text-xs font-semibold text-muted ring-1 ring-line">
                      {TYPE_LABEL[p.type]}
                    </span>
                    <StatusBadge status={p.status} />
                    {p.brief && (
                      <span className="text-xs text-muted font-semibold">v{p.brief.version}</span>
                    )}
                  </div>
                  <h3 className="truncate font-bold text-base group-hover:text-ink">{p.name}</h3>
                  <p className="mt-1 line-clamp-1 text-xs text-muted">{p.objective}</p>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted pl-4">
                  <span className="hidden sm:inline">Created {formatDate(p.created_at)}</span>
                  <div className="grid size-8 place-items-center rounded-full bg-bg transition group-hover:bg-primary group-hover:text-ink">
                    <ArrowUpRight className="size-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-line p-10 text-center">
            <p className="text-sm text-muted">No projects created for this client yet.</p>
            <Button variant="primary" size="sm" onClick={ctx.newProject} className="mt-4 rounded-full">
              <Plus className="size-4" /> Create First Project
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

