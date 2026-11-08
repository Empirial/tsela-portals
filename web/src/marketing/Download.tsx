import { useState } from 'react'
import { ArrowLeft, Download as DownloadIcon, Monitor, PlayCircle, ShieldCheck, Smartphone } from 'lucide-react'
import { Link } from 'react-router-dom'

// The APK is ~100 MB, over GitHub's file limit, so it is served from a GitHub Release.
// Upload the file to a release as "tsela.apk" and this link always points at the newest one.
const APK_URL = 'https://github.com/Empirial/tsela-portals/releases/latest/download/tsela.apk'

const steps = [
  'Tap Download APK below on your Android phone.',
  'Open the downloaded file. If Android asks, allow installs from your browser.',
  'Tap Install, then open Tsela Assist and sign in.',
]

const videos = {
  phone: {
    label: 'On a phone',
    icon: Smartphone,
    src: '/videos/tsela-walkthrough-phone.mp4',
    poster: '/videos/tsela-walkthrough-phone.jpg',
    box: 'mx-auto aspect-[860/1864] w-full max-w-[280px]',
  },
  desktop: {
    label: 'On a computer',
    icon: Monitor,
    src: '/videos/tsela-walkthrough-desktop.mp4',
    poster: '/videos/tsela-walkthrough-desktop.jpg',
    box: 'aspect-video w-full',
  },
} as const

function Walkthrough() {
  const [view, setView] = useState<keyof typeof videos>('phone')
  const v = videos[view]
  return (
    <section aria-labelledby="walkthrough" className="mt-12">
      <h2 id="walkthrough" className="flex items-center gap-2 font-display text-2xl font-extrabold">
        <PlayCircle size={24} className="text-lime" aria-hidden /> Watch the walkthrough
      </h2>
      <p className="mt-2 max-w-xl text-white/80">
        From a tyre breakdown to a paid invoice in 10 steps, with a voice-over. Sound on.
      </p>
      <div role="tablist" aria-label="Choose a video" className="mt-5 inline-flex rounded-md bg-white/[0.08] p-1">
        {(Object.keys(videos) as (keyof typeof videos)[]).map((k) => {
          const Icon = videos[k].icon
          return (
            <button
              key={k}
              role="tab"
              aria-selected={view === k}
              onClick={() => setView(k)}
              className={`inline-flex h-10 items-center gap-2 rounded px-4 text-sm font-semibold ${
                view === k ? 'bg-brand text-white' : 'text-white/75 hover:text-white'
              }`}
            >
              <Icon size={16} aria-hidden /> {videos[k].label}
            </button>
          )
        })}
      </div>
      <div className="mt-5 rounded-md bg-white/[0.08] p-3 sm:p-4">
        <video
          key={view}
          className={`${v.box} rounded bg-black`}
          controls
          playsInline
          preload="none"
          poster={v.poster}
          src={v.src}
        >
          Your browser can't play this video.
        </video>
      </div>
    </section>
  )
}

export default function Download() {
  return (
    <div className="min-h-screen bg-deep text-white">
      <header className="mx-auto flex h-20 max-w-3xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="" className="h-11 w-auto rounded-xl bg-white p-1" />
          <span className="font-display text-xl font-extrabold">Tsela Assist</span>
        </Link>
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
          <ArrowLeft size={16} aria-hidden /> Back to site
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-8 pb-20">
        <p className="flex items-center gap-3 text-sm font-bold tracking-wide text-lime uppercase">
          <span className="h-px w-8 bg-lime" /> Get the app
        </p>
        <h1 className="mt-4 font-display text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
          Download Tsela Assist for Android
        </h1>
        <p className="mt-4 max-w-xl text-lg text-white/80">
          One app for fleet managers, drivers and mechanics. Install it directly on your phone.
        </p>

        <div className="mt-8 rounded-md bg-white/[0.08] p-6 backdrop-blur">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="" className="h-16 w-16 rounded-2xl bg-white p-1.5" />
            <div>
              <p className="font-display text-xl font-extrabold">Tsela Assist</p>
              <p className="text-sm text-white/70">Android app (APK) • about 102 MB</p>
            </div>
          </div>
          <a
            href={APK_URL}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-brand px-6 text-sm font-semibold hover:bg-brand-dark sm:w-auto"
          >
            <DownloadIcon size={18} aria-hidden /> Download APK
          </a>
        </div>

        <Walkthrough />

        <h2 className="mt-12 font-display text-2xl font-extrabold">How to install</h2>
        <ol className="mt-4 flex flex-col gap-3">
          {steps.map((s, i) => (
            <li key={s} className="flex items-start gap-4 text-white/85">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/30 text-sm font-bold text-lime">
                {i + 1}
              </span>
              <span className="pt-1">{s}</span>
            </li>
          ))}
        </ol>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md bg-white/[0.08] p-5">
            <p className="flex items-center gap-2 font-semibold">
              <ShieldCheck size={18} className="text-lime" aria-hidden /> Why does Android warn me?
            </p>
            <p className="mt-2 text-sm text-white/75">
              The app is installed straight from this site, not from the Play Store, so Android asks you to confirm
              it first. This is normal.
            </p>
          </div>
          <div className="rounded-md bg-white/[0.08] p-5">
            <p className="flex items-center gap-2 font-semibold">
              <Smartphone size={18} className="text-lime" aria-hidden /> On iPhone?
            </p>
            <p className="mt-2 text-sm text-white/75">
              An iPhone version is not available yet. For now the app is Android only.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
