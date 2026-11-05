import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth'
import { useSyncExternalStore } from 'react'
import { auth } from '../lib/firebase'

// Real authentication: only accounts with the 'admin' role (the platform owner) get in.
type State = { ready: boolean; signedIn: boolean }

let state: State = { ready: false, signedIn: false }
const listeners = new Set<() => void>()
const set = (next: State) => {
  state = next
  listeners.forEach((l) => l())
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return set({ ready: true, signedIn: false })
  const token = await user.getIdTokenResult()
  if (token.claims.role === 'admin') set({ ready: true, signedIn: true })
  else {
    await firebaseSignOut(auth)
    set({ ready: true, signedIn: false })
  }
})

export function useAuth(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => {
        listeners.delete(l)
      }
    },
    () => state,
  )
}

const friendly = (e: unknown) => {
  const code = (e as { code?: string }).code ?? ''
  if (/invalid-credential|wrong-password|user-not-found|invalid-email/.test(code)) return 'Email or password is not right.'
  if (code === 'auth/too-many-requests') return 'Too many attempts. Wait a minute and try again.'
  if (code === 'auth/network-request-failed') return 'Cannot reach the server. Check your connection.'
  return e instanceof Error ? e.message : 'Could not sign in.'
}

export async function signInOwner(email: string, password: string): Promise<void> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const token = await cred.user.getIdTokenResult(true)
    if (token.claims.role !== 'admin') {
      await firebaseSignOut(auth)
      throw new Error('This account is not the platform owner. Fleet and mechanic accounts use the mobile app.')
    }
    set({ ready: true, signedIn: true })
  } catch (e) {
    throw new Error(friendly(e))
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
  set({ ready: true, signedIn: false })
}
