import { useEffect, useState } from 'react'

const MIN_MS = 1800
const MAX_MS = 4500
const FADE_MS = 500

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Opening screen: the logo pops in over a wireframe (skeleton) of the page that shimmers
// until the hero photo has loaded, then the whole overlay fades away.
export default function Splash() {
  const [phase, setPhase] = useState<'show' | 'fade' | 'gone'>('show')

  useEffect(() => {
    if (phase === 'gone') return
    document.body.style.overflow = phase === 'show' ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [phase])

  useEffect(() => {
    const min = reduced() ? 300 : MIN_MS
    let minDone = false
    let imgDone = false
    let finished = false

    const finish = () => {
      if (finished) return
      finished = true
      setPhase('fade')
      setTimeout(() => setPhase('gone'), FADE_MS)
    }
    const check = () => {
      if (minDone && imgDone) finish()
    }

    const img = new Image()
    img.onload = img.onerror = () => {
      imgDone = true
      check()
    }
    img.src = '/signin-bg.jpg'

    const t1 = setTimeout(() => {
      minDone = true
      check()
    }, min)
    const t2 = setTimeout(finish, MAX_MS)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  if (phase === 'gone') return null

  return (
    <div
      role="status"
      aria-label="Loading Tsela"
      className="fixed inset-0 z-[100] flex flex-col bg-deep px-4 transition-opacity ease-out"
      style={{ opacity: phase === 'fade' ? 0 : 1, transitionDuration: `${FADE_MS}ms` }}
    >
      {/* Wireframe header */}
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between">
        <div className="skeleton h-10 w-28 rounded-xl" />
        <div className="hidden gap-8 md:flex">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-3 w-16 rounded-full" />
          ))}
        </div>
        <div className="skeleton h-3 w-20 rounded-full" />
      </div>

      {/* Wireframe hero */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center text-center">
        <img
          src="/logo.png"
          alt=""
          className="logo-pop h-24 w-24 rounded-3xl bg-white p-2 shadow-2xl sm:h-28 sm:w-28"
        />
        <div className="skeleton mt-8 h-9 w-[min(80vw,28rem)] rounded-md sm:h-12" />
        <div className="skeleton mt-3 h-9 w-[min(60vw,20rem)] rounded-md sm:h-12" />
        <div className="skeleton mt-6 h-4 w-[min(70vw,24rem)] rounded-full" />
        <div className="mt-8 flex gap-3">
          <div className="skeleton h-12 w-36 rounded-md" />
          <div className="skeleton h-12 w-36 rounded-md" />
        </div>
      </div>

      {/* Wireframe feature points */}
      <div className="mx-auto hidden w-full max-w-6xl gap-6 pb-10 sm:grid sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="skeleton h-11 w-11 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-full rounded-full" />
              <div className="skeleton h-3 w-2/3 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
