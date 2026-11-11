import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

// Header and footer shared by the inner pages (Download, Surveys) so they match the landing page.
// The section links use plain <a href="/#..."> so the browser scrolls to the section after the landing page loads.

const sections = [
  ['About', '/#about'],
  ['Portals', '/#portals'],
  ['How it works', '/#how'],
  ['FAQ', '/#faq'],
] as const

const pages = [
  ['Download', '/download'],
  ['Survey', '/survey'],
] as const

export function SiteHeader() {
  const [menu, setMenu] = useState(false)
  const { pathname } = useLocation()
  const here = (to: string) => pathname === to || pathname.startsWith(`${to}/`)
  const link = 'text-sm font-semibold hover:text-white'

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-deep/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="" className="h-11 w-auto rounded-xl bg-white p-1" />
          <span className="font-display text-xl font-extrabold text-white">Tsela Assist</span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {sections.map(([l, h]) => (
            <a key={h} href={h} className={`${link} text-white/80`}>
              {l}
            </a>
          ))}
          {pages.map(([l, to]) => (
            <Link
              key={to}
              to={to}
              aria-current={here(to) ? 'page' : undefined}
              className={`${link} ${here(to) ? 'text-lime' : 'text-white/80'}`}
            >
              {l}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/admin/login" className="hidden text-sm font-semibold text-white/80 hover:text-white sm:inline">
            Owner sign in
          </Link>
          <button
            aria-label={menu ? 'Close menu' : 'Open menu'}
            aria-expanded={menu}
            className="rounded-lg p-2 text-white hover:bg-white/10 md:hidden"
            onClick={() => setMenu((m) => !m)}
          >
            {menu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {menu ? (
        <nav aria-label="Mobile" className="mx-4 mb-3 flex flex-col rounded-xl bg-white/[0.06] px-4 py-2 md:hidden">
          {sections.map(([l, h]) => (
            <a key={h} href={h} className="py-3 text-sm font-semibold text-white">
              {l}
            </a>
          ))}
          {pages.map(([l, to]) => (
            <Link key={to} to={to} onClick={() => setMenu(false)} className="py-3 text-sm font-semibold text-white">
              {l}
            </Link>
          ))}
          <Link to="/admin/login" className="py-3 text-sm font-semibold text-white">
            Owner sign in
          </Link>
        </nav>
      ) : null}
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 py-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 text-sm text-white/60">
        <Link to="/" className="flex items-center gap-2 text-white">
          <img src="/logo.png" alt="" className="h-8 w-auto rounded-lg bg-white p-0.5" />
          <span className="font-display text-base font-extrabold">Tsela Assist</span>
        </Link>
        <p>
          © Tsela Assist. All rights reserved.
          <span className="mt-1 block text-xs text-white/50 sm:mt-0 sm:ml-3 sm:inline">Developed by Lufuno Mphela</span>
        </p>
        <div className="flex gap-6">
          <Link to="/download" className="font-semibold text-white hover:text-lime">
            Download app
          </Link>
          <Link to="/survey" className="font-semibold text-white hover:text-lime">
            Survey
          </Link>
          <Link to="/admin/login" className="font-semibold text-white hover:text-lime">
            Owner sign in
          </Link>
        </div>
      </div>
    </footer>
  )
}
