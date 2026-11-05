import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  Sparkles,
  User,
} from 'lucide-react'
import type { Ctx } from '../App'
import { DESIGNER } from '../data'
import { Button, inputCls } from '../ui'

export function Auth({
  ctx,
  initialScreen = 'login',
  onSuccess,
}: {
  ctx: Ctx
  initialScreen?: 'login' | 'signup' | 'forgot-password'
  onSuccess: () => void
}) {
  const [screen, setScreen] = useState<'login' | 'signup' | 'forgot-password'>(initialScreen)
  const [email, setEmail] = useState('nadia@studiopratama.co')
  const [password, setPassword] = useState('••••••••')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (screen === 'forgot-password') {
      setResetSent(true)
      ctx.notify('Password reset instructions sent to your email')
      return
    }
    ctx.notify(screen === 'login' ? `Welcome back, ${DESIGNER.name.split(' ')[0]}!` : 'Account created successfully!')
    onSuccess()
  }

  const handleDemoLogin = () => {
    ctx.notify(`Logged in as ${DESIGNER.name}`)
    onSuccess()
  }

  return (
    <div className="relative flex min-h-[85vh] items-center justify-center px-4 py-12">
      {/* Ambient background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-20 h-[500px] bg-[radial-gradient(50%_50%_at_50%_40%,rgba(183,239,42,0.18),transparent_70%)]"
      />

      <div className="relative w-full max-w-md">
        {/* Brand mark */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-surface p-2 ring-1 ring-line shadow-sm mb-4">
            <span className="grid size-9 place-items-center rounded-xl bg-ink text-white">
              <span className="size-3.5 rounded-full bg-primary" />
            </span>
            <span className="text-xl font-extrabold tracking-tight px-1.5">
              clarity<span className="text-primary-strong">.</span>
            </span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {screen === 'login' && 'Sign in to Clarity'}
            {screen === 'signup' && 'Create designer account'}
            {screen === 'forgot-password' && 'Reset your password'}
          </h1>
          <p className="mt-2 text-xs text-muted">
            {screen === 'login' && 'Collect better briefs. Design with clarity.'}
            {screen === 'signup' && 'Start collecting structured client requirements today.'}
            {screen === 'forgot-password' && 'Enter your email to receive a password reset link.'}
          </p>
        </div>

        {/* Card Form */}
        <div className="rounded-[24px] border border-line bg-surface p-6 shadow-sm sm:p-8">
          {resetSent ? (
            <div className="text-center py-4">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-soft text-primary-strong">
                <Check className="size-6 stroke-[3]" />
              </div>
              <h3 className="mt-4 font-bold text-base">Check your inbox</h3>
              <p className="mt-1.5 text-xs text-muted leading-relaxed">
                We sent a password reset link to <strong className="text-ink">{email}</strong>.
              </p>
              <Button
                variant="dark"
                onClick={() => {
                  setResetSent(false)
                  setScreen('login')
                }}
                className="mt-6 w-full rounded-full"
              >
                Back to Sign in
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {screen === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-muted mb-1.5">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Nadia Pratama"
                    className={inputCls}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="designer@example.com"
                  className={inputCls}
                />
              </div>

              {screen !== 'forgot-password' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-muted">Password</label>
                    {screen === 'login' && (
                      <button
                        type="button"
                        onClick={() => setScreen('forgot-password')}
                        className="text-xs font-semibold text-muted hover:text-ink transition"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`${inputCls} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              )}

              <Button variant="primary" type="submit" className="w-full rounded-full mt-2 font-bold">
                {screen === 'login' && 'Sign In'}
                {screen === 'signup' && 'Create Account'}
                {screen === 'forgot-password' && 'Send Reset Link'}
                <ArrowRight className="size-4" />
              </Button>

              {/* Quick Demo Login Option */}
              {screen === 'login' && (
                <div className="pt-2">
                  <div className="relative my-4 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-line" />
                    </div>
                    <span className="relative bg-surface px-2 text-[11px] font-bold uppercase tracking-wider text-muted">
                      Quick Demo
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="dark"
                    onClick={handleDemoLogin}
                    className="w-full rounded-full"
                  >
                    <Sparkles className="size-4 text-primary" />
                    Sign in as Nadia Pratama (Demo)
                  </Button>
                </div>
              )}
            </form>
          )}

          {/* Screen switch footer */}
          <div className="mt-6 border-t border-line pt-4 text-center text-xs text-muted">
            {screen === 'login' ? (
              <p>
                Don’t have an account?{' '}
                <button
                  type="button"
                  onClick={() => setScreen('signup')}
                  className="font-bold text-ink underline"
                >
                  Sign up
                </button>
              </p>
            ) : screen === 'signup' ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setScreen('login')}
                  className="font-bold text-ink underline"
                >
                  Sign in
                </button>
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setScreen('login')}
                className="inline-flex items-center gap-1 font-bold text-ink hover:underline"
              >
                <ArrowLeft className="size-3" /> Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

