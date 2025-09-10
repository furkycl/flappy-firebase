import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, initializeFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore'
import type { Analytics } from 'firebase/analytics'
// App Check (opsiyonel)
let appCheckInited = false

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
export const USE_FIREBASE_EMULATORS = (import.meta as any)?.env?.VITE_FIREBASE_EMULATORS === '1'
if (isConfigValid) {
  app = initializeApp(firebaseConfig)
  // Vercel gibi bazı ortamlar WebChannel'ı engelleyebilir.
  // Long-polling'i otomatik tespit ederek ağ sorunlarını azaltalım.
  db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  })
  if (USE_FIREBASE_EMULATORS) {
    try {
      connectFirestoreEmulator(db, '127.0.0.1', 8080)
      // getFirestore(app) yerine initializeFirestore kullandığımız için
      // mevcut db örneğine bağlanmak yeterli.
    } catch (e) {
      console.warn('Firestore emulator bağlanamadı:', e)
    }
  }
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

// Opsiyonel: App Check (reCAPTCHA v3). Firestore için enforcement açıksa gereklidir.
// VITE_RECAPTCHA_SITE_KEY tanımlıysa etkinleştirir.
void (async () => {
  if (!app || typeof window === 'undefined') return
  const key = (import.meta as any)?.env?.VITE_RECAPTCHA_SITE_KEY as string | undefined
  if (!key || appCheckInited) return
  try {
    const { initializeAppCheck, ReCaptchaV3Provider } = await import('firebase/app-check')
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(key),
      isTokenAutoRefreshEnabled: true,
    })
    appCheckInited = true
  } catch {}
})()
