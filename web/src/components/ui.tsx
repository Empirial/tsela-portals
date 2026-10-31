import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}

export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-line bg-white p-5 shadow-[0_1px_3px_rgba(14,27,46,0.06)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

const tones = {
  blue: 'bg-blue-50 text-blue-700',
  amber: 'bg-amber-100 text-amber-700',
  green: 'bg-emerald-50 text-emerald-700',
  red: 'bg-red-100 text-red-700',
  neutral: 'bg-slate-100 text-slate-600',
  dark: 'bg-navy text-white',
}
export type Tone = keyof typeof tones

export function Badge({ children, tone = 'blue' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={cx(
        'inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}

export function Button({
  children,
  variant = 'primary',
  icon: Icon,
  className,
  ...rest
}: {
  variant?: 'primary' | 'dark' | 'secondary' | 'danger' | 'ghost'
  icon?: LucideIcon
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: 'bg-brand text-white hover:bg-brand-dark',
    dark: 'bg-navy text-white hover:bg-black',
    secondary: 'border border-line bg-white text-navy hover:bg-canvas',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100',
    ghost: 'text-brand hover:bg-tint',
  }[variant]
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        'disabled:cursor-not-allowed disabled:opacity-50',
        styles,
        className,
      )}
    >
      {Icon ? <Icon size={16} aria-hidden /> : null}
      {children}
    </button>
  )
}

export function Stat({
  label,
  value,
  sub,
  icon: Icon,
  dark,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  icon?: LucideIcon
  dark?: boolean
}) {
  return (
    <div
      className={cx(
        'rounded-2xl border p-5',
        dark ? 'border-navy bg-navy text-white' : 'border-line bg-white',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cx(
            'text-[11px] font-bold uppercase tracking-wide',
            dark ? 'text-slate-300' : 'text-muted',
          )}
        >
          {label}
        </p>
        {Icon ? <Icon size={18} className={dark ? 'text-lime' : 'text-brand'} aria-hidden /> : null}
      </div>
      <p className="num mt-2 font-display text-3xl font-extrabold tracking-tight">{value}</p>
      {sub ? (
        <p className={cx('mt-1 text-xs', dark ? 'text-slate-300' : 'text-muted')}>{sub}</p>
      ) : null}
    </div>
  )
}

export function Tabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T
  onChange: (v: T) => void
  items: { key: T; label: string; count?: number }[]
}) {
  return (
    <div role="tablist" className="inline-flex gap-1 rounded-xl bg-slate-200/70 p-1">
      {items.map((i) => (
        <button
          key={i.key}
          role="tab"
          aria-selected={value === i.key}
          onClick={() => onChange(i.key)}
          className={cx(
            'inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors',
            value === i.key ? 'bg-navy text-white' : 'text-slate-600 hover:text-navy',
          )}
        >
          {i.label}
          {i.count !== undefined ? (
            <span
              className={cx(
                'rounded-full px-2 text-[11px]',
                value === i.key ? 'bg-brand text-white' : 'bg-white text-slate-600',
              )}
            >
              {i.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  sub,
  actions,
}: {
  eyebrow?: string
  title: string
  sub?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">{title}</h1>
        {sub ? <p className="mt-1 max-w-2xl text-sm text-muted">{sub}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line text-[11px] font-bold uppercase tracking-wide text-muted">
            {head.map((h) => (
              <th key={h} className="px-3 py-3 font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        checked ? 'bg-brand' : 'bg-slate-300',
      )}
    >
      <span
        className={cx(
          'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked && 'translate-x-5',
        )}
      />
    </button>
  )
}
