import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'

// Init Admin SDK (one-time)
if (admin.apps.length === 0) {
  admin.initializeApp()
}

const db = admin.firestore()

// Helper validations
function isValidName(name: unknown): name is string {
  return typeof name === 'string' && /\S/.test(name) && name.trim().length <= 40
}
function isValidScore(score: unknown): score is number {
  return typeof score === 'number' && Number.isInteger(score) && score >= 3 && score <= 5000
}

// Callable function with optional App Check protection and rate-limit
const REQUIRE_APP_CHECK = process.env.APP_CHECK_REQUIRED === '1'
export const submitScore = functions
  .region('europe-west3')
  .runWith({ memory: '128MB', invoker: 'public' })
  .https.onCall(async (data, context) => {
    // Optionally require App Check
    if (REQUIRE_APP_CHECK && !context.app) {
      throw new functions.https.HttpsError('failed-precondition', 'Missing App Check. Enable App Check on client.')
    }
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Sign-in required (anonymous allowed).')
    }

    const uid = context.auth.uid
    const name = data?.name
    const score = data?.score

    if (!isValidName(name)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid name')
    }
    if (!isValidScore(score)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid score')
    }

    // 10s rate-limit per uid via users/{uid}.lastScoreTs
    const userRef = db.collection('users').doc(uid)
    const userSnap = await userRef.get()
    const now = admin.firestore.Timestamp.now()
    const last = userSnap.exists && userSnap.get('lastScoreTs')
    if (last && last.toDate && now.toMillis() - last.toDate().getTime() < 10_000) {
      throw new functions.https.HttpsError('resource-exhausted', 'Too many submissions')
    }

    // Write score and bump lastScoreTs atomically
    const batch = db.batch()
    const scoreRef = db.collection('scores').doc()
    batch.set(scoreRef, { uid, name: name.trim(), score, ts: now })
    batch.set(userRef, { lastScoreTs: now }, { merge: true })
    await batch.commit()

    return { ok: true }
  })
