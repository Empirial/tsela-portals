// Prototype auth: a session flag only. Replace with real authentication once the backend exists.
const KEY = 'tsela.admin.session'

export function isSignedIn(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function signIn() {
  try {
    sessionStorage.setItem(KEY, '1')
  } catch {
    // ignore
  }
}

export function signOut() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
