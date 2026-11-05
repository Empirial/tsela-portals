import { useState } from 'react'
import { useLive } from './live'

// With the live backend, approving or suspending a company or mechanic is a real server call and the list
// updates from the database, so these two keys do not keep a local override.
const LIVE_KEYS = ['tsela.mechanics.state', 'tsela.fleets.state']

// Prototype only: remembers admin actions (approve, suspend…) for the browser session so the
// fleet list and the fleet detail page agree. Replace with API calls once the backend exists.
export function useOverrides(key: string): [Record<string, string>, (id: string, value: string) => void] {
  const live = useLive()
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

  if (LIVE_KEYS.includes(key)) {
    return [{}, (name, value) => void live.setOrgState(name, value).catch((e) => console.error('Could not update the account', e))]
  }
  return [map, set]
}
