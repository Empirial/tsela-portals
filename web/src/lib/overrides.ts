import { useState } from 'react'

// Prototype only: remembers admin actions (approve, suspend…) for the browser session so the
// fleet list and the fleet detail page agree. Replace with API calls once the backend exists.
export function useOverrides(key: string): [Record<string, string>, (id: string, value: string) => void] {
  const [map, setMap] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(key) ?? '{}')
    } catch {
      return {}
    }
  })

  const set = (id: string, value: string) =>
    setMap((m) => {
      const next = { ...m, [id]: value }
      try {
        sessionStorage.setItem(key, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })

  return [map, set]
}
