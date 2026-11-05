import { useState } from 'react'
import {
  Bell,
  Check,
  Globe,
  Lock,
  Mail,
  Palette,
  Save,
  Shield,
  Sparkles,
  User,
} from 'lucide-react'
import type { Ctx } from '../App'
import { DESIGNER } from '../data'
import { Avatar, Button, inputCls } from '../ui'

export function Settings({ ctx }: { ctx: Ctx }) {
  const [name, setName] = useState(DESIGNER.name)
  const [email, setEmail] = useState(DESIGNER.email)
  const [studio, setStudio] = useState('Studio Pratama')
  const [tagline, setTagline] = useState('Collect better briefs. Design with clarity.')
  const [defaultLang, setDefaultLang] = useState<'id' | 'en'>('id')
  const [notifySubmit, setNotifySubmit] = useState(true)
  const [notifyClarify, setNotifyClarify] = useState(true)
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'defaults'>('profile')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    DESIGNER.name = name
    DESIGNER.email = email
    ctx.notify('Settings saved successfully')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[32px] leading-[1.1] font-extrabold tracking-[-0.03em] sm:text-[40px]">
          Settings
        </h1>
        <p className="mt-2 text-muted">Manage your designer profile, intake defaults, and notifications.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-line gap-6 text-sm font-semibold">
        {[
          { id: 'profile', label: 'Profile & Studio', icon: User },
          { id: 'defaults', label: 'Brief Defaults & Language', icon: Globe },
          { id: 'notifications', label: 'Email Notifications', icon: Bell },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 pb-3 transition ${
              activeTab === t.id
                ? 'border-b-2 border-ink text-ink font-bold'
                : 'text-muted hover:text-ink'
            }`}
          >
            <t.icon className="size-4" />
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="rounded-[24px] border border-line bg-surface p-6 sm:p-8">
        {/* Tab 1: Profile */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-xl">
            <div className="flex items-center gap-4">
              <Avatar name={name} className="size-16 text-xl shadow-sm" />
              <div>
                <div className="font-bold text-base">{name}</div>
                <div className="text-xs text-muted">Your name is displayed on client intake welcome screens.</div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">Studio / Brand Name</label>
              <input
                type="text"
                value={studio}
                onChange={(e) => setStudio(e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">Tagline / Bio</label>
              <textarea
                rows={2}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Defaults */}
        {activeTab === 'defaults' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-muted mb-2">Default Client Form Language</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDefaultLang('id')}
                  className={`flex flex-col rounded-xl border p-4 text-left transition ${
                    defaultLang === 'id' ? 'border-ink bg-soft ring-1 ring-primary/40' : 'border-line bg-surface'
                  }`}
                >
                  <span className="font-bold text-sm">Bahasa Indonesia</span>
                  <span className="text-xs text-muted mt-1">Default for Indonesian clients (WhatsApp first)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDefaultLang('en')}
                  className={`flex flex-col rounded-xl border p-4 text-left transition ${
                    defaultLang === 'en' ? 'border-ink bg-soft ring-1 ring-primary/40' : 'border-line bg-surface'
                  }`}
                >
                  <span className="font-bold text-sm">English</span>
                  <span className="text-xs text-muted mt-1">Default for international clients</span>
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-bg/50 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
                <Sparkles className="size-3.5 text-primary-strong" />
                Intake Design System
              </div>
              <p className="mt-1 text-xs text-muted">
                Intake forms automatically use the <strong>Soft Editorial Intelligence</strong> system with ambient radial glows, lime CTAs, and Manrope typography.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center justify-between rounded-xl border border-line p-4">
              <div>
                <div className="text-sm font-bold">New Brief Submission</div>
                <div className="text-xs text-muted">Receive an email immediately when a client submits their completed brief.</div>
              </div>
              <input
                type="checkbox"
                checked={notifySubmit}
                onChange={(e) => setNotifySubmit(e.target.checked)}
                className="size-4 accent-primary"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-line p-4">
              <div>
                <div className="text-sm font-bold">Clarification Resubmission</div>
                <div className="text-xs text-muted">Receive an email when a client answers clarification questions.</div>
              </div>
              <input
                type="checkbox"
                checked={notifyClarify}
                onChange={(e) => setNotifyClarify(e.target.checked)}
                className="size-4 accent-primary"
              />
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end border-t border-line pt-5">
          <Button variant="primary" type="submit" className="rounded-full px-6">
            <Save className="size-4" /> Save Settings
          </Button>
        </div>
      </form>
    </div>
  )
}

