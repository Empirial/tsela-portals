import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../admin/auth'
import { db } from './firebase'

export type Corridor = {
  id: string
  name: string
  route: string
  enabled: boolean
  radiusKm: number
}

export type Settings = {
  /** Tsela Assist's cut of every job, as a percentage (product spec: owner-configurable) */
  feePct: number
  vatPct: number
  corridors: Corridor[]
}

// Placeholder defaults: fee and VAT come from the mockups; coverage areas are starting points the owner edits.
export const defaultSettings: Settings = {
  feePct: 8,
  vatPct: 15,
  corridors: [
    { id: 'n1', name: 'N1 Western', route: 'Johannesburg ⇄ Cape Town', enabled: true, radiusKm: 50 },
    { id: 'n3', name: 'N3 Natal', route: 'Gauteng ⇄ Durban', enabled: true, radiusKm: 50 },
    { id: 'n4', name: 'N4 Maputo', route: 'Mpumalanga ⇄ Maputo', enabled: true, radiusKm: 40 },
    { id: 'n2', name: 'N2 Garden Route', route: 'Cape Town ⇄ Durban', enabled: false, radiusKm: 40 },
  ],
}

const KEY = 'tsela.settings.v1'

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) }
  } catch {
    // storage unavailable (private window etc.): fall back to defaults
  }
  return defaultSettings
}

type Ctx = {
  settings: Settings
  save: (s: Settings) => void
  reset: () => void
}

const SettingsContext = createContext<Ctx | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load)
  const { signedIn } = useAuth()

  // With the live backend the fee, VAT and coverage areas live in Firestore: the Cloud Functions read the same
  // document when pricing invoices, so a change here applies to every new invoice.
  useEffect(() => {
    if (!signedIn) return
    return onSnapshot(
      doc(db, 'settings', 'platform'),
      (snap) => snap.exists() && setSettings({ ...defaultSettings, ...(snap.data() as Partial<Settings>) }),
      () => {},
    )
  }, [signedIn])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings))
    } catch {
      // ignore
    }
  }, [settings])

  const value = useMemo<Ctx>(
    () => ({
      settings,
      save: (s: Settings) => {
        setSettings(s)
        setDoc(doc(db, 'settings', 'platform'), s, { merge: true }).catch((e) => console.error('Could not save settings', e))
      },
      reset: () => {
        setSettings(defaultSettings)
        setDoc(doc(db, 'settings', 'platform'), defaultSettings, { merge: true }).catch((e) => console.error('Could not save settings', e))
      },
    }),
    [settings],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}
