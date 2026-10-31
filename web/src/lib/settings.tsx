import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Corridor = {
  id: string
  name: string
  route: string
  enabled: boolean
  radiusKm: number
}

export type Settings = {
  /** Tsela's cut of every job, as a percentage (product spec: owner-configurable) */
  feePct: number
  vatPct: number
  callout: {
    baseFee: number
    heavyRigSurcharge: number
    nightSurchargePct: number
    includedKm: number
    perExtraKm: number
  }
  corridors: Corridor[]
}

// Placeholder defaults: fee and VAT come from the mockups, pricing rules are samples to be replaced.
export const defaultSettings: Settings = {
  feePct: 8,
  vatPct: 15,
  callout: {
    baseFee: 1200,
    heavyRigSurcharge: 250,
    nightSurchargePct: 25,
    includedKm: 15,
    perExtraKm: 12,
  },
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
      save: setSettings,
      reset: () => setSettings(defaultSettings),
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
