import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  FileText,
  MapPin,
  Menu,
  Navigation,
  Pause,
  Play,
  ShieldCheck,
  Smartphone,
  Truck,
  Wrench,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Splash from './Splash'

const WEB_APP_URL = 'https://tsela.expo.app'

const hero = [
  { icon: BadgeCheck, text: 'Every mechanic verified by Tsela before going live' },
  { icon: MapPin, text: 'Matched by distance, so the nearest help responds first' },
  { icon: ShieldCheck, text: 'Itemised VAT invoices, paid in the app' },
]

const steps = [
  { icon: Smartphone, title: 'Driver reports it', image: '/how/issue-blowout.jpg', text: 'One big button, a photo and the truck’s GPS location. No phone call to the office.' },
  { icon: ClipboardCheck, title: 'Manager confirms', image: '/how/billing-depot.jpg', text: 'The fleet manager checks the report and picks a mechanic by distance, arrival time, rating and call-out fee.' },
  { icon: Wrench, title: 'Mechanic accepts', image: '/how/status-roadside.jpg', text: 'The nearest verified mobile mechanic accepts the call-out and drives to the truck.' },
  { icon: FileText, title: 'Invoice and pay', image: '/how/job-fitting.jpg', text: 'The mechanic confirms the work, the fleet receives an itemised VAT invoice and pays through the app.' },
]

// The three portals shown in the rotating showcase.
const portals = [
  {
    id: 'manager',
    icon: Truck,
    label: 'Fleet manager',
    image: '/manager.jpg',
    lead: 'Every breakdown in one place.',
    points: [
      { title: 'Live job board', text: 'Every open breakdown with its status, from reported to repaired.' },
      { title: 'Log a request', text: 'Pick the truck, the problem and the wheel position, then drop the location.' },
      { title: 'Compare mechanics', text: 'See nearby mechanics on a map by distance, arrival time, rating and call-out fee.' },
      { title: 'Invoices and history', text: 'Itemised VAT invoices paid in the app, with full history by date, truck and cost.' },
    ],
  },
  {
    id: 'driver',
    icon: Navigation,
    label: 'Driver',
    image: '/driver.jpg',
    lead: 'Report it the moment it happens.',
    points: [
      { title: 'One-tap report', text: 'A single large button to report a puncture or breakdown, no phone call needed.' },
      { title: 'Photo and GPS', text: 'Attach a photo and your phone’s location so help knows exactly where to go.' },
      { title: 'Live status', text: 'See when your manager confirms the report and who is on the way.' },
      { title: 'Arrival time', text: 'Watch the mechanic’s ETA update, and look back at your past reports.' },
    ],
  },
  {
    id: 'mechanic',
    icon: Wrench,
    label: 'Mechanic',
    image: '/mechanic.jpg',
    lead: 'Call-outs near you, paid properly.',
    points: [
      { title: 'Call-outs near you', text: 'New requests show the truck type, the problem, the distance and your payout.' },
      { title: 'Accept in a tap', text: 'Accept or decline instantly, and go online or offline when it suits you.' },
      { title: 'Roadside updates', text: 'Open the map to the truck and update the job status in one tap.' },
      { title: 'Invoices and earnings', text: 'Send the invoice from the roadside and track payouts and the platform fee.' },
    ],
  },
]

const stats = [
  { value: '3', label: 'portals in one app: manager, driver and mechanic' },
  { value: '4', label: 'steps from breakdown report to paid invoice' },
  { value: '24/7', label: 'live dispatch, wherever the truck stops' },
  { value: '0', label: 'phone calls to the office to report a puncture' },
]

const faqs = [
  { q: 'How does Tsela work?', a: 'Tsela is a mobile app and website that lets fleet companies call the nearest mobile truck mechanic when a truck has a puncture or breakdown, much like Uber matches a rider with a driver.' },
  { q: 'Who can report a breakdown?', a: 'Drivers report from the app. The report goes to the fleet manager, who confirms it and chooses the mechanic.' },
  { q: 'How do mechanics get on the platform?', a: 'Mechanics sign up with their business details, service area and the tyre services they offer. Tsela verifies each one before they can receive call-outs.' },
  { q: 'How are jobs paid for?', a: 'The fleet pays through the app against an itemised invoice with VAT. Tsela takes a platform fee from each job and the mechanic receives the rest.' },
  { q: 'When can I use it?', a: 'Tsela is in development. Leave your email and we will tell you when it opens.' },
]

const nav = [
  ['About', '#about'],
  ['Portals', '#portals'],
  ['How it works', '#how'],
  ['FAQ', '#faq'],
] as const

const STEP_MS = 5500

export default function Home() {
  const [menu, setMenu] = useState(false)
  const [email, setEmail] = useState('')
  const [who, setWho] = useState('fleet')
  const [state, setState] = useState<'idle' | 'error' | 'done'>('idle')

  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [hover, setHover] = useState(false)

  useEffect(() => {
    if (paused || hover) return
    const id = setInterval(() => setActive((a) => (a + 1) % portals.length), STEP_MS)
    return () => clearInterval(id)
  }, [paused, hover])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    // Prototype: nothing is sent anywhere yet. Wire this to the backend / mailing list.
    setState(/\S+@\S+\.\S+/.test(email) ? 'done' : 'error')
  }

  const current = portals[active]

  return (
    <div className="bg-deep text-white">
      <Splash />
      {/* Hero */}
      <section id="top" className="relative isolate flex min-h-[100svh] flex-col overflow-hidden">
        <img src="/signin-bg.jpg" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-navy/70 via-navy/40 to-deep" />

        <header className="relative z-30">
          <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
            <a href="#top" className="flex items-center gap-2">
              <img src="/logo.png" alt="" className="h-11 w-auto rounded-xl bg-white p-1" />
              <span className="font-display text-xl font-extrabold">Tsela</span>
            </a>
            <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
              {nav.map(([l, h]) => (
                <a key={h} href={h} className="text-sm font-semibold text-white/80 hover:text-white">
                  {l}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <Link to="/admin/login" className="hidden text-sm font-semibold text-white/80 hover:text-white sm:inline">
                Owner sign in
              </Link>
              <button
                aria-label={menu ? 'Close menu' : 'Open menu'}
                aria-expanded={menu}
                className="rounded-lg p-2 hover:bg-white/10 md:hidden"
                onClick={() => setMenu((m) => !m)}
              >
                {menu ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
          {menu ? (
            <nav aria-label="Mobile" className="mx-4 flex flex-col rounded-xl bg-deep/95 px-4 py-2 backdrop-blur md:hidden">
              {[...nav, ['Get early access', '#access'] as const].map(([l, h]) => (
                <a key={h} href={h} onClick={() => setMenu(false)} className="py-3 text-sm font-semibold">
                  {l}
                </a>
              ))}
              <Link to="/admin/login" className="py-3 text-sm font-semibold">
                Owner sign in
              </Link>
            </nav>
          ) : null}
        </header>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <img
            src="/logo.png"
            alt="Tsela"
            className="logo-bounce mb-6 h-24 w-24 rounded-3xl bg-white p-2 shadow-2xl sm:h-28 sm:w-28"
          />
          <h1 className="max-w-2xl font-display text-4xl leading-tight font-extrabold tracking-tight sm:text-6xl">
            Truck repair,
            <br />
            dispatched in minutes.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-white/80">
            A truck stops. Tsela sends the nearest verified mechanic.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="#access"
              className="inline-flex h-12 items-center gap-2 rounded-md border border-white/70 px-6 text-sm font-semibold hover:bg-white hover:text-navy"
            >
              Get early access <ArrowRight size={16} aria-hidden />
            </a>
            <a
              href={WEB_APP_URL}
              className="inline-flex h-12 items-center gap-2 rounded-md bg-brand px-6 text-sm font-semibold hover:bg-brand-dark"
            >
              Open the web app
            </a>
          </div>
        </div>

        <ul className="relative z-10 mx-auto grid w-full max-w-6xl gap-6 px-4 pb-10 sm:grid-cols-3">
          {hero.map((h) => (
            <li key={h.text} className="flex items-center gap-4 text-sm text-white/85">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/30 text-lime">
                <h.icon size={20} aria-hidden />
              </span>
              {h.text}
            </li>
          ))}
        </ul>
      </section>

      <main>
        {/* About */}
        <section id="about" className="relative scroll-mt-4 overflow-hidden">
          <span
            aria-hidden
            className="pointer-events-none absolute -top-2 left-0 font-display text-[8rem] leading-none font-extrabold tracking-tight text-white/[0.04] select-none sm:text-[14rem]"
          >
            ABOUT
          </span>
          <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-24 md:grid-cols-2 md:gap-16">
            <div>
              <p className="font-display text-sm font-bold tracking-widest text-lime">LOGISTICS, FIXED</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Tsela, mobile truck repair for fleets
              </h2>
            </div>
            <p className="text-white/70">
              When a truck has a puncture or breakdown, every minute off the road costs money. Tsela connects
              fleet companies with the nearest verified mobile mechanic, much like Uber matches a rider with a
              driver. Drivers report in one tap, managers confirm and choose the mechanic, and the mechanic
              invoices from the roadside. Everyone sees the same job from report to payment.
            </p>
          </div>
        </section>

        {/* Rotating portals */}
        <section id="portals" className="relative scroll-mt-4 pb-24">
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/3 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-brand/30 blur-3xl"
          />
          <div
            className="relative mx-auto max-w-6xl px-4"
            role="group"
            aria-roledescription="carousel"
            aria-label="The three Tsela portals"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onFocus={() => setHover(true)}
            onBlur={() => setHover(false)}
          >
            <div className="relative mx-auto flex min-h-[26rem] items-center justify-center lg:min-h-[34rem]">
              {/* The disc: orbit ring + three photos that rotate into view */}
              <div className="relative aspect-square w-[min(78vw,22rem)] lg:w-[24rem]">
                {/* Liquid blobs drifting behind the photo */}
                <div aria-hidden className="pointer-events-none absolute -inset-10">
                  <span className="liquid liquid-a" />
                  <span className="liquid liquid-b" />
                  <span className="liquid liquid-c" />
                </div>
                <div
                  aria-hidden
                  className="absolute -inset-5 rounded-full border border-dashed border-white/25 transition-transform duration-[1200ms] ease-in-out"
                  style={{ transform: `rotate(${active * -120}deg)` }}
                >
                  <span className="absolute top-0 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-lime to-leaf shadow-[0_0_24px_var(--color-lime)]" />
                  <span className="absolute right-[7%] bottom-[14%] h-3.5 w-3.5 rounded-full bg-gradient-to-br from-blue-300 to-brand shadow-[0_0_18px_var(--color-brand)]" />
                  <span className="absolute bottom-[14%] left-[7%] h-4 w-4 rounded-full bg-gradient-to-br from-white to-slate-300" />
                </div>

                <div className="blob-photo absolute inset-0 overflow-hidden ring-4 ring-white/15">
                  {portals.map((p, i) => {
                    const offset = (i - active + portals.length) % portals.length
                    const transform =
                      offset === 0 ? 'rotate(0deg) scale(1)' : offset === 1 ? 'rotate(120deg) scale(0.55)' : 'rotate(-120deg) scale(0.55)'
                    return (
                      <img
                        key={p.id}
                        src={p.image}
                        alt={offset === 0 ? `${p.label} portal` : ''}
                        aria-hidden={offset !== 0}
                        className="absolute inset-0 h-full w-full object-cover transition-all duration-[1200ms] ease-in-out"
                        style={{ transform, opacity: offset === 0 ? 1 : 0 }}
                      />
                    )
                  })}
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent" />
                  <p className="absolute inset-x-0 bottom-8 flex items-center justify-center gap-2 font-display text-lg font-extrabold">
                    <current.icon size={20} className="text-lime" aria-hidden /> {current.label}
                  </p>
                </div>

                {/* Floating feature cards, desktop only (mobile list below). Each card's inner corner touches the circle. */}
                <div key={current.id} className="portal-in absolute inset-0 hidden lg:block" aria-hidden>
                  {current.points.map((pt, i) => (
                    <div
                      key={pt.title}
                      className={`absolute z-10 w-80 rounded-md border border-white/15 bg-deep/80 p-5 backdrop-blur ${
                        [
                          'right-[83%] bottom-[83%]',
                          'bottom-[83%] left-[83%]',
                          'top-[83%] right-[83%]',
                          'top-[83%] left-[83%]',
                        ][i]
                      }`}
                    >
                      <p className="font-display text-base font-extrabold text-lime">{pt.title}</p>
                      <p className="mt-1.5 text-[0.95rem] leading-relaxed text-white/85">{pt.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div key={`m-${current.id}`} className="portal-in mt-8 lg:hidden">
              <p className="font-display text-xl font-extrabold">{current.lead}</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {current.points.map((pt) => (
                  <li key={pt.title} className="rounded-md border border-white/10 bg-white/[0.07] p-4">
                    <p className="font-display text-sm font-extrabold text-lime">{pt.title}</p>
                    <p className="mt-1 text-sm text-white/80">{pt.text}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div aria-live="polite" className="sr-only">
              {current.label}: {current.lead}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {portals.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setActive(i)}
                  aria-pressed={i === active}
                  className={`inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors ${
                    i === active ? 'bg-brand text-white' : 'border border-white/25 text-white/75 hover:bg-white/10'
                  }`}
                >
                  <p.icon size={16} aria-hidden /> {p.label}
                </button>
              ))}
              <button
                onClick={() => setPaused((v) => !v)}
                aria-label={paused ? 'Play automatic rotation' : 'Pause automatic rotation'}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 hover:bg-white/10"
              >
                {paused ? <Play size={16} /> : <Pause size={16} />}
              </button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section aria-label="Tsela in numbers" className="mx-auto max-w-6xl px-4 pb-24">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-5xl font-extrabold text-lime">{s.value}</p>
                <div className="mx-auto mt-3 h-px w-12 bg-lime/60" />
                <p className="mx-auto mt-3 max-w-[14rem] text-sm text-white/70">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-4 px-4 pb-24">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            From puncture to paid,
            <br />
            in four steps
          </h2>
          <p className="mt-3 max-w-xl text-white/70">No phone tag. Everyone sees the same job from report to invoice.</p>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="overflow-hidden rounded-md border border-white/10 bg-white/[0.06]">
                <img src={s.image} alt="" loading="lazy" className="h-40 w-full object-cover" />
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-lime">
                      <s.icon size={18} aria-hidden />
                    </span>
                    <span className="font-display text-xs font-extrabold tracking-widest text-lime">STEP {i + 1}</span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-extrabold">{s.title}</h3>
                  <p className="mt-1 text-sm text-white/70">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-4 pb-24">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Questions</h2>
            <div className="mt-8 divide-y divide-white/10 rounded-md border border-white/10 bg-white/[0.04]">
              {faqs.map((f) => (
                <details key={f.q} className="group p-5">
                  <summary className="cursor-pointer list-none font-semibold marker:content-none">
                    <span className="flex items-center justify-between gap-4">
                      {f.q}
                      <span className="text-lime transition-transform group-open:rotate-45" aria-hidden>
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-white/70">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Early access */}
        <section id="access" className="relative scroll-mt-4 overflow-hidden pb-24">
          <span
            aria-hidden
            className="pointer-events-none absolute right-0 bottom-24 font-display text-[7rem] leading-none font-extrabold text-white/[0.04] select-none sm:text-[12rem]"
          >
            TSELA
          </span>
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[1fr_20rem]">
            <div>
              <p className="font-display text-sm font-bold tracking-widest text-lime">GET EARLY ACCESS</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Be first to know</h2>
              <p className="mt-2 text-white/70">Tell us who you are and we will email you when Tsela opens.</p>
              {state === 'done' ? (
                <p role="status" className="mt-8 rounded-md bg-white/10 p-4 font-semibold">
                  Thanks! We’ll be in touch at {email}.
                </p>
              ) : (
                <form onSubmit={submit} noValidate className="mt-8 flex max-w-xl flex-col gap-3">
                  <fieldset className="flex gap-2">
                    <legend className="sr-only">I am a</legend>
                    {[
                      ['fleet', 'Fleet company'],
                      ['mechanic', 'Truck mechanic'],
                    ].map(([k, l]) => (
                      <label
                        key={k}
                        className={`flex-1 cursor-pointer rounded-md border px-4 py-3 text-center text-sm font-semibold ${
                          who === k ? 'border-brand bg-brand' : 'border-white/30'
                        }`}
                      >
                        <input
                          type="radio"
                          name="who"
                          value={k}
                          checked={who === k}
                          onChange={() => setWho(k)}
                          className="sr-only"
                        />
                        {l}
                      </label>
                    ))}
                  </fieldset>
                  <label className="sr-only" htmlFor="lead-email">
                    Email
                  </label>
                  <input
                    id="lead-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setState('idle')
                    }}
                    placeholder="you@company.co.za"
                    className="h-12 rounded-md bg-white px-4 text-ink outline-none"
                  />
                  {state === 'error' ? (
                    <p className="text-sm font-semibold text-red-300">Enter a valid email address.</p>
                  ) : null}
                  <button className="inline-flex h-12 w-fit items-center gap-2 rounded-md border border-white/70 px-6 text-sm font-semibold hover:bg-white hover:text-navy">
                    Notify me <ArrowRight size={16} aria-hidden />
                  </button>
                </form>
              )}
            </div>

            <aside className="h-fit rounded-md bg-white/[0.08] p-6 backdrop-blur">
              <p className="flex items-center gap-3 font-display text-lg font-extrabold">
                <span className="h-px w-8 bg-lime" /> Try it now
              </p>
              <p className="mt-4 text-sm text-white/75">
                The web app works on any phone or computer. On iPhone, open it in Safari and choose Share, then
                Add to Home Screen.
              </p>
              <a
                href={WEB_APP_URL}
                className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-brand text-sm font-semibold hover:bg-brand-dark"
              >
                Open the web app
              </a>
            </aside>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 text-sm text-white/60">
          <a href="#top" className="flex items-center gap-2 text-white">
            <img src="/logo.png" alt="" className="h-8 w-auto rounded-lg bg-white p-0.5" />
            <span className="font-display text-base font-extrabold">Tsela</span>
          </a>
          <p>
            © Tsela. All rights reserved.
            <span className="mt-1 block text-xs text-white/50 sm:mt-0 sm:ml-3 sm:inline">
              Developed by Lufuno Mphela
            </span>
          </p>
          <Link to="/admin/login" className="font-semibold text-white hover:text-lime">
            Owner sign in
          </Link>
        </div>
      </footer>
    </div>
  )
}
