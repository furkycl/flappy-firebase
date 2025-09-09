import { getAuth, onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth'
import { app } from './firebase'

let cachedUser: User | null = null

export function ensureAuth(): Promise<User> {
  if (!app) return Promise.reject(new Error('Firebase yapılandırması eksik'))
  const auth = getAuth(app)
  return new Promise<User>((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        cachedUser = u
        unsub()
        resolve(u)
      }
    })
    signInAnonymously(auth).catch((e) => {
      unsub()
      reject(e)
    })
  })
}

export function currentUid(): string | null {
  return cachedUser?.uid ?? null
}

