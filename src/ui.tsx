import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { STATUS_META, type Status, type StyleId } from './data'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark' | 'danger'

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  const v: Record<Variant, string> = {
    primary: 'bg-primary text-ink hover:bg-primary-strong shadow-[inset_0_-1px_0_rgba(23,32,25,0.12)]',
    secondary: 'bg-surface text-ink ring-1 ring-line hover:ring-ink/25',
    ghost: 'text-ink hover:bg-ink/5',
    dark: 'bg-ink text-white hover:bg-ink/90',
    danger: 'bg-surface text-danger ring-1 ring-line hover:bg-[#FBEAEA] hover:ring-[#F3CFCF]',
  }
  const s = { sm: 'h-8 px-3 text-[13px] gap-1.5', md: 'h-10 px-4 text-sm gap-2', lg: 'h-12 px-5 text-[15px] gap-2' }
  return (
    <button
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40',
        v[variant],
        s[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const m = STATUS_META[status]
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        m.cls,
        className,
      )}
    >
      <span className={cx('size-1.5 rounded-full', m.dot)} />
      {m.label}
    </span>
  )
}

export function Chip({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'accent' | 'avoid' | 'neutral' }) {
  const t = {
    default: 'bg-surface ring-line text-ink',
    accent: 'bg-soft ring-[#D8EFA3] text-ink',
    avoid: 'bg-[#FBEAEA] ring-[#F3CFCF] text-[#9E3434] line-through decoration-[#9E3434]/40',
    neutral: 'bg-bg ring-line text-muted italic',
  }
  return (
    <span className={cx('inline-flex items-center rounded-full px-3 py-1 text-[13px] font-medium ring-1 ring-inset', t[tone])}>
      {children}
    </span>
  )
}

export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  eyebrow?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])
  if (!open) return null
  const w = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-ink/30 backdrop-blur-[3px]" onClick={onClose} />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        className={cx(
          'relative flex max-h-[92vh] w-full animate-pop-in flex-col overflow-hidden rounded-t-[24px] bg-surface shadow-[0_30px_80px_-20px_rgba(23,32,25,0.35)] outline-none sm:rounded-[24px]',
          w[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 sm:px-8 sm:pt-7">
          <div>
            {eyebrow && <div className="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">{eyebrow}</div>}
            <h2 className="text-2xl leading-tight font-bold tracking-tight">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 shrink-0 place-items-center rounded-full text-muted ring-1 ring-line transition hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6 sm:px-8">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-bg/60 px-6 py-4 sm:px-8">{footer}</div>}
      </div>
    </div>
  )
}

export function Field({ label, hint, error, children, optional }: { label: string; hint?: string; error?: string; children: ReactNode; optional?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between text-sm font-semibold">
        {label}
        {optional && <span className="text-xs font-medium text-muted">Optional</span>}
      </span>
      {children}
      {error ? <span className="mt-1.5 block text-xs font-medium text-danger">{error}</span> : hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export const inputCls =
  'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted/70 transition outline-none focus:border-ink/40 focus:ring-4 focus:ring-primary/30'

export function SectionCard({ title, children, action, className }: { title?: ReactNode; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <section className={cx('rounded-[20px] border border-line bg-surface p-5 sm:p-6', className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h3 className="text-[15px] font-bold tracking-tight">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

/** CSS-composed thumbnails so each style reads as a distinct visual composition (poster, packaging, UI, logo). */
export function StyleThumb({ id, className }: { id: StyleId; className?: string }) {
  const base = cx('relative overflow-hidden', className)
  switch (id) {
    case 'minimal':
      return (
        <div className={cx(base, 'bg-[#F4F3EF]')}>
          <div className="absolute top-1/2 left-1/2 size-[34%] -translate-x-1/2 -translate-y-[60%] rounded-full bg-ink" />
          <div className="absolute right-[18%] bottom-[18%] left-[18%] h-px bg-ink/30" />
          <div className="absolute bottom-[10%] left-[18%] text-[8px] font-semibold tracking-[0.3em] text-ink/60">STILL</div>
        </div>
      )
    case 'modern':
      return (
        <div className={cx(base, 'bg-gradient-to-br from-[#E8EEF0] to-[#F6F2EC] p-[10%]')}>
          <div className="flex h-full flex-col gap-[6%] rounded-lg bg-white p-[8%] shadow-sm">
            <div className="flex items-center justify-between">
              <div className="h-1.5 w-1/4 rounded-full bg-ink/80" />
              <div className="h-1.5 w-1/6 rounded-full bg-ink/20" />
            </div>
            <div className="h-2 w-3/4 rounded-full bg-ink/70" />
            <div className="h-2 w-1/2 rounded-full bg-ink/25" />
            <div className="mt-auto grid grid-cols-3 gap-1.5">
              <div className="aspect-square rounded-md bg-[#C9D8DC]" />
              <div className="aspect-square rounded-md bg-[#E9D9C6]" />
              <div className="aspect-square rounded-md bg-[#D6DECF]" />
            </div>
          </div>
        </div>
      )
    case 'bold':
      return (
        <div className={cx(base, 'bg-[#FF5B2E]')}>
          <div className="absolute -bottom-[8%] -left-[4%] text-[64px] leading-[0.8] font-extrabold tracking-tighter text-ink">BIG</div>
          <div className="absolute top-[12%] right-[10%] size-[30%] rounded-full bg-primary" />
          <div className="absolute top-[14%] left-[10%] text-[9px] font-extrabold tracking-wider text-ink">VOL.04</div>
        </div>
      )
    case 'premium':
      return (
        <div className={cx(base, 'bg-[#1B1916]')}>
          <div className="absolute inset-[12%] border border-[#C9A96A]/50" />
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="font-serif text-5xl leading-none text-[#D7B878] italic">M</div>
              <div className="mt-1 text-[7px] tracking-[0.4em] text-[#C9A96A]/80">MAISON</div>
            </div>
          </div>
        </div>
      )
    case 'playful':
      return (
        <div className={cx(base, 'bg-[#FFE7F1]')}>
          <div className="absolute -top-[10%] -left-[10%] size-[55%] rounded-full bg-[#FFC93C]" />
          <div className="absolute right-[8%] bottom-[10%] size-[42%] rounded-[38%] bg-[#6C63FF]" />
          <div className="absolute top-[38%] left-[30%] size-[22%] rotate-12 rounded-lg bg-[#2EC4B6]" />
          <div className="absolute bottom-[12%] left-[10%] text-lg font-extrabold text-ink">yay!</div>
        </div>
      )
    case 'corporate':
      return (
        <div className={cx(base, 'bg-[#EEF1F4] p-[10%]')}>
          <div className="flex h-full gap-[6%]">
            <div className="w-1/4 space-y-1.5 rounded-md bg-[#2D3A4A] p-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-1 rounded-full bg-white/40" />
              ))}
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="grid grid-cols-3 gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-5 rounded bg-white" />
                ))}
              </div>
              <div className="flex flex-1 items-end gap-1 rounded bg-white p-1.5">
                {[40, 65, 50, 80, 60, 90].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-[#4A6A8A]" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    case 'editorial':
      return (
        <div className={cx(base, 'bg-[#F1ECE2] p-[10%]')}>
          <div className="text-[7px] font-bold tracking-[0.3em] text-ink/60">ISSUE 12</div>
          <div className="mt-1 font-serif text-[38px] leading-[0.85] text-ink">
            The <i>slow</i> life
          </div>
          <div className="absolute right-[10%] bottom-[10%] left-[10%] grid grid-cols-2 gap-2">
            {[0, 1].map((c) => (
              <div key={c} className="space-y-1">
                {[100, 90, 95, 70].map((w, i) => (
                  <div key={i} className="h-[3px] rounded-full bg-ink/25" style={{ width: `${w}%` }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )
    case 'futuristic':
      return (
        <div className={cx(base, 'bg-[#0D1117]')}>
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'linear-gradient(rgba(183,239,42,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(183,239,42,0.25) 1px, transparent 1px)',
              backgroundSize: '14px 14px',
            }}
          />
          <div className="absolute top-1/2 left-1/2 size-[46%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary shadow-[0_0_30px_rgba(183,239,42,0.6)]" />
          <div className="absolute top-1/2 left-1/2 size-[20%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7CF7FF] blur-[6px]" />
          <div className="absolute bottom-[10%] left-[10%] font-mono text-[8px] text-primary/80">SYS://01</div>
        </div>
      )
  }
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
  const hues = ['#EFF9D6', '#F3EDE4', '#E4EEF0', '#F5E6EE', '#E9E7F5']
  const bg = hues[name.length % hues.length]
  return (
    <span
      className={cx('grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold text-ink ring-1 ring-ink/5', className)}
      style={{ background: bg }}
    >
      {initials}
    </span>
  )
}
