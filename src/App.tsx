import React, { useEffect, useRef, useState } from 'react'
import { FlappyEngine, type GameState } from './game/engine'
import { saveScore, getLeaderboard, hasSavedScore, type WindowKey, type LeaderboardResult } from './services/leaderboard'
import { ensureAuth } from './services/auth'

const CANVAS_W = 420
const CANVAS_H = 640

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const engineRef = useRef<FlappyEngine | null>(null)
  const [state, setState] = useState<GameState>('ready')
  const [score, setScore] = useState(0)
  const [playerName, setPlayerName] = useState('')
  const [lbWindow, setLbWindow] = useState<WindowKey>('1h')
  const [lb, setLb] = useState<LeaderboardResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [loadingLB, setLoadingLB] = useState(false)
  const [hasSaved, setHasSaved] = useState(false)

  useEffect(() => {
    // Anonymous auth'ı önden başlat (kurallara göre yazma yetkisi için)
    ensureAuth().catch((e) => console.warn('Auth error', e))

    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const engine = new FlappyEngine(ctx, { width: CANVAS_W, height: CANVAS_H })
    engineRef.current = engine

    const sync = () => {
      const s = engine.getSnapshot()
      setState(s.state)
      setScore(s.score)
      raf = requestAnimationFrame(sync)
    }
    let raf = requestAnimationFrame(sync)

    const onClick = () => engine.flap()
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault()
        engine.flap()
      } else if (e.code === 'KeyR' || e.code === 'Enter') {
        if (engine.getSnapshot().state === 'gameover') {
          engine.restart()
        }
      }
    }
    canvas.addEventListener('pointerdown', onClick)
    window.addEventListener('keydown', onKey)

    // draw initial ready screen
    engine.restart()

    // Kullanıcının daha önce skor kaydedip kaydetmediğini kontrol et
    hasSavedScore().then(setHasSaved).catch(() => setHasSaved(false))

    return () => {
      cancelAnimationFrame(raf)
      engine.destroy()
      canvas.removeEventListener('pointerdown', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const start = () => engineRef.current?.start()
  const restart = () => engineRef.current?.restart()

  const disabledSubmit = playerName.trim().length < 2 || state !== 'gameover' || saving || hasSaved || score <= 10

  const refreshLB = async (win: WindowKey = lbWindow) => {
    setLoadingLB(true)
    try {
      const data = await getLeaderboard(win)
      setLbWindow(win)
      setLb(data)
    } catch (e) {
      console.error(e)
      setLb({ window: win, entries: [] })
    } finally {
      setLoadingLB(false)
    }
  }

  return (
    <div className="page">
      <header>
        <h1>Pro Flappy Bird</h1>
        <div className="muted">TS + React, basit sürüm</div>
      </header>
      <div className="container">
        <div className="card">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            aria-label="Flappy Bird oyunu"
          />
          <div className="hud">
            <div className="score">Skor: {score}</div>
            {state === 'ready' && (
              <button className="btn" onClick={start}>Başlat</button>
            )}
            {state === 'gameover' && (
              <button className="btn" onClick={restart}>Yeniden Başlat</button>
            )}
          </div>

          <div className="row" style={{ marginTop: 8 }}>
            <input
              type="text"
              placeholder="İsmin (skor kaydı için)"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              aria-label="İsim"
            />
            <button className="btn" disabled={disabledSubmit} onClick={async () => {
              if (!engineRef.current) return
              setSaving(true)
              try {
                const s = engineRef.current.getSnapshot()
                await saveScore(playerName.trim(), s.score)
                await refreshLB()
                alert('Skor kaydedildi!')
                setHasSaved(true)
              } catch (e: any) {
                alert(e?.message ?? 'Skor kaydedilemedi')
              } finally {
                setSaving(false)
              }
            }}>
              Skoru Kaydet
            </button>
          </div>
          <div className="muted" style={{ marginTop: 6 }}>
            Boşluk / Yukarı / Tıkla: zıpla • R/Enter: yeniden • Min skor: 11
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div className="muted">Liderlik Tablosu</div>
              <div className="row">
                <button className="btn" onClick={() => refreshLB('1h')} disabled={loadingLB || lbWindow==='1h'}>1s</button>
                <button className="btn" onClick={() => refreshLB('24h')} disabled={loadingLB || lbWindow==='24h'}>24s</button>
                <button className="btn" onClick={() => refreshLB('30d')} disabled={loadingLB || lbWindow==='30d'}>1ay</button>
              </div>
            </div>
            <div className="muted" style={{ marginTop: 6 }}>
              {loadingLB ? 'Yükleniyor...' : lb ? `${lb.entries.length} kayıt` : 'Henüz yüklenmedi'}
            </div>
            {lb && lb.entries.slice(0, 10).map((e, i) => (
              <div key={i} className="row" style={{ justifyContent: 'space-between' }}>
                <div>{i + 1}. {e.name}</div>
                <div className="score">{e.score}</div>
              </div>
            ))}
            {!lb && (
              <button className="btn" style={{ marginTop: 8 }} onClick={() => refreshLB()}>Yükle</button>
            )}
          </div>
        </div>
      </div>
      <footer>
        <div className="muted">Liderlik tablosu (1s, 24s, 1ay) yakında</div>
        <a className="muted" href="#" onClick={(e)=>e.preventDefault()}>v0.1.0</a>
      </footer>
    </div>
  )
}
