import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore'
import type { Analytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
}

// Basit guard: gerekli alanlardan en az biri eksikse, init denemeyelim
const isConfigValid = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
)

let app: FirebaseApp | undefined
let db: Firestore | undefined
if (isConfigValid) {
  app = initializeApp(firebaseConfig)
  // Vercel gibi bazı ortamlar WebChannel'ı engelleyebilir.
  // Long-polling'i otomatik tespit ederek ağ sorunlarını azaltalım.
  db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    useFetchStreams: false,
  })
}
export { app, db }

// Opsiyonel: Analytics (yalnızca tarayıcıda ve destekleniyorsa)
export const analytics = (async (): Promise<Analytics | undefined> => {
  if (!app || typeof window === 'undefined') return undefined
  try {
    const { getAnalytics, isSupported } = await import('firebase/analytics')
    const ok = await isSupported()
    return ok ? getAnalytics(app) : undefined
  } catch {
    return undefined
  }
})()
