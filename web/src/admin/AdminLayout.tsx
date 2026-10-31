import {
  BadgeDollarSign,
  Bell,
  Building2,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Truck,
  Wrench,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { cx } from '../components/ui'
import { isSignedIn, signOut } from './auth'

const groups = [
  {
    title: 'Operational control',
    items: [
      { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/admin/jobs', label: 'Jobs & Dispatches', icon: Truck },
    ],
  },
  {
    title: 'Network & partners',
    items: [
      { to: '/admin/fleets', label: 'Fleet Companies', icon: Building2 },
      { to: '/admin/mechanics', label: 'Truck Mechanics', icon: Wrench },
    ],
  },
  {
    title: 'Commercial & admin',
    items: [
      { to: '/admin/payments', label: 'Payments & Subscriptions', icon: BadgeDollarSign },
      { to: '/admin/settings', label: 'Platform Settings', icon: Settings },
    ],
  },
]

export default function AdminLayout() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  if (!isSignedIn()) return <Navigate to="/admin/login" replace />

  const nav = (
    <nav aria-label="Admin" className="flex flex-col gap-6 px-4 py-5">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wide text-muted">
            {g.title}
          </p>
          <ul className="flex flex-col gap-1">
            {g.items.map((i) => (
              <li key={i.to}>
                <NavLink
                  to={i.to}
                  end={i.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cx(
                      'flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors',
                      isActive ? 'bg-brand text-white' : 'text-ink hover:bg-canvas',
                    )
                  }
                >
                  <i.icon size={18} aria-hidden />
                  {i.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-line bg-white lg:block">
        <div className="sticky top-0 flex h-screen flex-col overflow-y-auto">
          <Brand />
          {nav}
          <div className="mt-auto m-4 rounded-xl bg-tint p-3 text-xs text-muted">
            <p className="flex items-center gap-2 font-bold text-ink">
              <span className="h-2 w-2 rounded-full bg-brand" /> CORRIDOR OPS
            </p>
            <p className="mt-1">N1, N3 &amp; N4 real-time dispatch grid active.</p>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-navy/70"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-72 overflow-y-auto bg-white">
            <button
              aria-label="Close menu"
              className="absolute top-4 right-4 text-muted"
              onClick={() => setOpen(false)}
            >
              <X size={22} />
            </button>
            <Brand />
            {nav}
          </aside>
        </div>
      ) : null}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur lg:px-8">
          <button
            aria-label="Open menu"
            className="rounded-lg p-2 text-ink hover:bg-canvas lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className="hidden items-center gap-2 rounded-full bg-tint px-3 py-1.5 text-xs font-semibold text-ink md:flex">
            <span className="h-2 w-2 rounded-full bg-brand" /> All South African corridors operational
          </div>
          <label className="relative ml-auto hidden max-w-sm flex-1 sm:block">
            <span className="sr-only">Search</span>
            <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
            <input
              type="search"
              placeholder="Search jobs, reg, partners…"
              className="h-10 w-full rounded-lg border border-line bg-white pr-3 pl-9 text-sm outline-none focus:border-brand"
            />
          </label>
          <button aria-label="Notifications" className="relative rounded-lg p-2 hover:bg-canvas">
            <Bell size={20} />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-danger" />
          </button>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-semibold">Lufuno Mphela</p>
              <p className="text-xs font-semibold text-brand">Owner</p>
            </div>
            <button
              aria-label="Sign out"
              title="Sign out"
              onClick={() => {
                signOut()
                navigate('/admin/login')
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-white"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>
        <main className="mx-auto flex max-w-[1400px] flex-col gap-6 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-6 pt-6">
      <img src="/logo.png" alt="" className="h-10 w-auto" />
      <div className="leading-tight">
        <p className="font-display text-lg font-extrabold">TSELA</p>
        <p className="text-[11px] font-bold tracking-wide text-brand">COMMAND CONSOLE</p>
      </div>
    </div>
  )
}
