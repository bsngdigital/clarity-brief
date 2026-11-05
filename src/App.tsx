import { useCallback, useEffect, useState } from 'react'
import { Bell, Check, LogOut, Plus, Search, Settings as SettingsIcon, User } from 'lucide-react'
import { DESIGNER, initialClients, initialProjects, makeToken, type Client, type Project } from './data'
import { Avatar, Button, cx } from './ui'
import { Dashboard } from './views/Dashboard'
import { Projects } from './views/Projects'
import { ProjectDetail } from './views/ProjectDetail'
import { Clients } from './views/Clients'
import { ClientDetail } from './views/ClientDetail'
import { Settings } from './views/Settings'
import { Auth } from './views/Auth'
import { ClientForm } from './views/ClientForm'
import { NewProjectModal, type NewProjectInput } from './modals'

export type View =
  | { name: 'dashboard' }
  | { name: 'projects'; filter?: string; q?: string }
  | { name: 'clients' }
  | { name: 'client-detail'; id: string }
  | { name: 'project'; id: string }
  | { name: 'settings' }
  | { name: 'auth'; screen?: 'login' | 'signup' | 'forgot-password' }
  | { name: 'client-form'; token: string; step?: string }

const NAV = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'projects', label: 'Projects' },
  { key: 'clients', label: 'Clients' },
  { key: 'settings', label: 'Settings' },
] as const

export type Ctx = {
  projects: Project[]
  clients: Client[]
  go: (v: View) => void
  update: (id: string, patch: Partial<Project> | ((p: Project) => Partial<Project>)) => void
  notify: (msg: string) => void
  newProject: () => void
  addClient: (c: Omit<Client, 'id'>) => Client
}

export default function App() {
  const [projects, setProjects] = useState(initialProjects)
  const [clients, setClients] = useState(initialClients)
  const [view, setView] = useState<View>(() => {
    // Check if initial URL or hash points to client form (/c/:token)
    if (typeof window !== 'undefined') {
      const path = window.location.pathname
      const hash = window.location.hash
      const cMatch = path.match(/\/c\/([a-zA-Z0-9]+)/) || hash.match(/#c\/([a-zA-Z0-9]+)/)
      if (cMatch) {
        return { name: 'client-form', token: cMatch[1] }
      }
    }
    return { name: 'dashboard' }
  })
  const [newOpen, setNewOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)

  const go = useCallback((v: View) => {
    setView(v)
    setUserMenuOpen(false)
    window.scrollTo({ top: 0 })
  }, [])

  const notify = useCallback((msg: string) => {
    const id = Date.now()
    setToast({ id, msg })
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2600)
  }, [])

  const update: Ctx['update'] = useCallback((id, patch) => {
    setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, ...(typeof patch === 'function' ? patch(p) : patch) } : p)))
  }, [])

  const addClient = (c: Omit<Client, 'id'>) => {
    const nc = { ...c, id: `c${Date.now()}` }
    setClients((cs) => [nc, ...cs])
    return nc
  }

  const createProject = (input: NewProjectInput) => {
    const p: Project = {
      ...input,
      id: `p${Date.now()}`,
      status: 'draft',
      share_token: makeToken(),
      link_enabled: true,
      created_at: new Date().toISOString(),
    }
    setProjects((ps) => [p, ...ps])
    return p
  }

  const ctx: Ctx = { projects, clients, go, update, notify, newProject: () => setNewOpen(true), addClient }

  // If in client-form view, render full-screen client intake form without designer shell
  if (view.name === 'client-form') {
    const project = projects.find((p) => p.share_token === view.token)
    return (
      <ClientForm
        token={view.token}
        ctx={ctx}
        initialStep={view.step}
        onBackToDesigner={() => go({ name: 'project', id: project?.id || 'p1' })}
      />
    )
  }

  // If in auth view, render auth screen
  if (view.name === 'auth') {
    return <Auth ctx={ctx} initialScreen={view.screen} onSuccess={() => go({ name: 'dashboard' })} />
  }

  const active = view.name === 'project' ? 'projects' : view.name === 'client-detail' ? 'clients' : view.name

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* ambient glow */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(60%_60%_at_15%_0%,rgba(183,239,42,0.18),transparent_70%),radial-gradient(40%_50%_at_90%_10%,rgba(77,155,98,0.10),transparent_70%)]" />

      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4">
        <nav className="mx-auto flex h-16 max-w-7xl items-center gap-3 rounded-[24px] border border-line/80 bg-surface/85 px-3 shadow-[0_8px_30px_-12px_rgba(23,32,25,0.12)] backdrop-blur-xl sm:px-4">
          <button onClick={() => go({ name: 'dashboard' })} className="flex shrink-0 items-center gap-2 rounded-xl px-1.5 py-1">
            <span className="grid size-8 place-items-center rounded-[10px] bg-ink">
              <span className="size-3 rounded-full bg-primary" />
            </span>
            <span className="hidden text-[17px] font-extrabold tracking-tight sm:block">
              clarity<span className="text-primary-strong">.</span>
            </span>
          </button>

          <div className="no-scrollbar mx-auto flex min-w-0 items-center gap-1 overflow-x-auto rounded-full bg-bg p-1 ring-1 ring-line">
            {NAV.map((n) => (
              <button
                key={n.key}
                onClick={() => go({ name: n.key } as View)}
                aria-current={active === n.key ? 'page' : undefined}
                className={cx(
                  'rounded-full px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap transition sm:px-4',
                  active === n.key ? 'bg-ink text-white shadow-sm' : 'text-muted hover:text-ink',
                )}
              >
                {n.label}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => go({ name: 'projects' })}
              aria-label="Search projects"
              className="hidden size-10 place-items-center rounded-full text-muted transition hover:bg-bg hover:text-ink md:grid"
            >
              <Search className="size-[18px]" />
            </button>
            <button aria-label="Notifications" className="relative hidden size-10 place-items-center rounded-full text-muted transition hover:bg-bg hover:text-ink sm:grid">
              <Bell className="size-[18px]" />
              <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-primary ring-2 ring-surface" />
            </button>
            <Button variant="primary" onClick={() => setNewOpen(true)} className="rounded-full max-sm:w-10 max-sm:px-0">
              <Plus className="size-4" strokeWidth={2.5} />
              <span className="max-sm:hidden">New project</span>
            </Button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-full p-0.5 transition hover:ring-2 hover:ring-line"
              >
                <Avatar name={DESIGNER.name} className="size-9" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-xl animate-pop-in">
                  <div className="px-3 py-2 border-b border-line">
                    <div className="font-bold text-xs truncate">{DESIGNER.name}</div>
                    <div className="text-[11px] text-muted truncate">{DESIGNER.email}</div>
                  </div>
                  <button
                    onClick={() => go({ name: 'settings' })}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-muted hover:bg-bg hover:text-ink transition"
                  >
                    <SettingsIcon className="size-3.5" />
                    Account Settings
                  </button>
                  <button
                    onClick={() => go({ name: 'auth', screen: 'login' })}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-danger hover:bg-[#FBEAEA] transition"
                  >
                    <LogOut className="size-3.5" />
                    Sign Out / Switch User
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 pt-8 pb-24 sm:px-6 sm:pt-10">
        {view.name === 'dashboard' && <Dashboard ctx={ctx} />}
        {view.name === 'projects' && <Projects ctx={ctx} initialFilter={view.filter} initialQ={view.q} />}
        {view.name === 'clients' && <Clients ctx={ctx} />}
        {view.name === 'client-detail' && <ClientDetail ctx={ctx} id={view.id} />}
        {view.name === 'project' && <ProjectDetail key={view.id} ctx={ctx} id={view.id} />}
        {view.name === 'settings' && <Settings ctx={ctx} />}
      </main>

      <NewProjectModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        clients={clients}
        addClient={addClient}
        create={createProject}
        update={update}
        notify={notify}
        openProject={(id) => {
          setNewOpen(false)
          go({ name: 'project', id })
        }}
      />

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 animate-slide-up">
          <div key={toast.id} className="flex items-center gap-2.5 rounded-full bg-ink py-2.5 pr-5 pl-2.5 text-sm font-medium text-white shadow-xl">
            <span className="grid size-6 place-items-center rounded-full bg-primary text-ink">
              <Check className="size-3.5" strokeWidth={3} />
            </span>
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  )
}
