import { db } from './firebase'
import { addDoc, collection, getDocs, limit, orderBy, query, where, serverTimestamp, Timestamp, writeBatch, doc, setDoc } from 'firebase/firestore'
import { ensureAuth, currentUid } from './auth'

export type WindowKey = '1h' | '24h' | '30d'

export interface ScoreEntry {
  name: string
  score: number
  ts: number // epoch ms (UI için dönüştürülmüş)
}

export interface LeaderboardResult {
  window: WindowKey
  entries: ScoreEntry[]
}

function windowToMs(win: WindowKey): number {
  switch (win) {
    case '1h':
      return 60 * 60 * 1000
    case '24h':
      return 24 * 60 * 60 * 1000
    case '30d':
      return 30 * 24 * 60 * 60 * 1000
  }
}

export async function saveScore(name: string, score: number): Promise<void> {
  if (!db) throw new Error('Firebase yapılandırması eksik')
  const cleanName = name.trim().slice(0, 24)
  if (!cleanName) throw new Error('İsim gerekli')
  if (!Number.isFinite(score) || score < 0) throw new Error('Skor geçersiz')

  const user = await ensureAuth()
  const uid = user.uid

  const batch = writeBatch(db)
  const scoresCol = collection(db, 'scores')
  const usersDoc = doc(db, 'users', uid)
  const scoreDoc = doc(scoresCol) // otomatik id

  batch.set(scoreDoc, {
    uid,
    name: cleanName,
    score,
    ts: serverTimestamp(),
  })
  batch.set(usersDoc, {
    lastScoreTs: serverTimestamp(),
  }, { merge: true })

  await batch.commit()
}

export async function getLeaderboard(win: WindowKey, topN = 50): Promise<LeaderboardResult> {
  if (!db) return { window: win, entries: [] }
  const cutoff = Date.now() - windowToMs(win)
  // Not: Firestore kuralı gereği inequality yapılan alan ilk orderBy ile sıralanmalı
  // Bu nedenle önce ts ile sıralayıp (yaklaşık son kayıtlar) client tarafında skor ile yeniden sıralıyoruz.
  const q = query(
    collection(db, 'scores'),
    where('ts', '>=', Timestamp.fromMillis(cutoff)),
    orderBy('ts', 'desc'),
    limit(200)
  )
  const snap = await getDocs(q)
  const items: ScoreEntry[] = []
  snap.forEach((d) => {
    const data = d.data() as any
    const ts = data?.ts instanceof Timestamp ? (data.ts as Timestamp).toMillis() : undefined
    if (typeof data?.name === 'string' && typeof data?.score === 'number' && typeof ts === 'number') {
      items.push({ name: data.name, score: data.score, ts })
    }
  })
  items.sort((a, b) => b.score - a.score || b.ts - a.ts)
  return { window: win, entries: items.slice(0, topN) }
}
