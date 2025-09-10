export type GameState = 'ready' | 'running' | 'gameover'

export interface GameOptions {
  width: number
  height: number
}

interface Bird {
  x: number
  y: number
  vy: number
  r: number
}

interface Pipe {
  x: number
  gapY: number
  passed: boolean
}

export interface Snapshot {
  state: GameState
  score: number
}

export class FlappyEngine {
  private ctx: CanvasRenderingContext2D
  private opts: GameOptions
  private raf: number | null = null
  private lastT = 0
  private state: GameState = 'ready'
  private bird: Bird
  private pipes: Pipe[] = []
  private pipeTimer = 0
  private score = 0

  // constants
  private readonly gravity = 1800 // px/s^2
  private readonly jumpVel = -500 // px/s
  private readonly pipeGap = 150
  private readonly pipeWidth = 70
  private readonly pipeSpeed = 180 // px/s
  private readonly groundH = 80

  constructor(ctx: CanvasRenderingContext2D, opts: GameOptions) {
    this.ctx = ctx
    this.opts = opts
    this.bird = { x: opts.width * 0.28, y: opts.height * 0.45, vy: 0, r: 14 }
    this.reset()
  }

  getSnapshot(): Snapshot {
    return { state: this.state, score: this.score }
  }

  start() {
    if (this.state === 'running') return
    if (this.state === 'gameover') this.reset()
    this.state = 'running'
    this.lastT = performance.now()
    this.loop(this.lastT)
  }

  flap() {
    if (this.state === 'ready') this.start()
    if (this.state !== 'running') return
    this.bird.vy = this.jumpVel
  }

  restart() {
    this.reset()
    this.state = 'ready'
    this.render() // draw ready screen
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = null
  }

  private reset() {
    this.pipes = []
    this.pipeTimer = 0
    this.score = 0
    this.bird.x = this.opts.width * 0.28
    this.bird.y = this.opts.height * 0.45
    this.bird.vy = 0
    this.lastT = performance.now()
  }

  private loop = (t: number) => {
    const dt = Math.min(0.033, (t - this.lastT) / 1000)
    this.lastT = t

    if (this.state === 'running') {
      this.update(dt)
    }
    this.render()
    this.raf = requestAnimationFrame(this.loop)
  }

  private update(dt: number) {
    // bird physics
    this.bird.vy += this.gravity * dt
    this.bird.y += this.bird.vy * dt

    // spawn pipes
    this.pipeTimer += dt
    if (this.pipeTimer >= 1.4) {
      this.pipeTimer = 0
      const margin = 50
      const minY = margin
      const maxY = this.opts.height - this.groundH - margin - this.pipeGap
      const gapY = Math.random() * (maxY - minY) + minY
      this.pipes.push({ x: this.opts.width + this.pipeWidth, gapY, passed: false })
    }

    // move pipes and remove off-screen
    for (const p of this.pipes) p.x -= this.pipeSpeed * dt
    while (this.pipes.length && this.pipes[0].x + this.pipeWidth < 0) this.pipes.shift()

    // score when bird passes center of a pipe pair
    for (const p of this.pipes) {
      const cx = p.x + this.pipeWidth / 2
      if (!p.passed && cx < this.bird.x) {
        p.passed = true
        this.score += 1
      }
    }

    // ground collision
    const groundY = this.opts.height - this.groundH
    if (this.bird.y + this.bird.r > groundY) {
      this.bird.y = groundY - this.bird.r
      this.gameOver()
      return
    }

    // ceiling collision
    if (this.bird.y - this.bird.r < 0) {
      this.bird.y = this.bird.r
      this.bird.vy = 0
    }

    // pipe collision
    for (const p of this.pipes) {
      const bx = this.bird.x
      const by = this.bird.y
      const r = this.bird.r
      const withinX = bx + r > p.x && bx - r < p.x + this.pipeWidth
      if (!withinX) continue

      const topH = p.gapY
      const bottomY = p.gapY + this.pipeGap
      const hitTop = by - r < topH
      const hitBottom = by + r > bottomY
      if (hitTop || hitBottom) {
        this.gameOver()
        return
      }
    }
  }

  private gameOver() {
    this.state = 'gameover'
  }

  private render() {
    const { ctx } = this
    const w = this.opts.width
    const h = this.opts.height
    const groundY = h - this.groundH

    ctx.clearRect(0, 0, w, h)

    // background sky
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, '#70c5ce')
    grad.addColorStop(1, '#dff9ff')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // pipes
    ctx.fillStyle = '#2ecc71'
    ctx.strokeStyle = '#27ae60'
    for (const p of this.pipes) {
      // top pipe
      ctx.fillRect(p.x, 0, this.pipeWidth, p.gapY)
      // bottom pipe
      const bottomY = p.gapY + this.pipeGap
      ctx.fillRect(p.x, bottomY, this.pipeWidth, h - this.groundH - bottomY)
      // borders
      ctx.strokeRect(p.x + 0.5, 0.5, this.pipeWidth, p.gapY)
      ctx.strokeRect(p.x + 0.5, bottomY + 0.5, this.pipeWidth, h - this.groundH - bottomY)
    }

    // ground
    ctx.fillStyle = '#de9f43'
    ctx.fillRect(0, groundY, w, this.groundH)
    ctx.fillStyle = '#c67f2a'
    for (let i = 0; i < w; i += 20) {
      ctx.fillRect(i, groundY, 10, 8)
    }

    // bird
    ctx.save()
    ctx.translate(this.bird.x, this.bird.y)
    ctx.rotate(Math.atan2(this.bird.vy, 300))
    ctx.fillStyle = '#f1c40f'
    ctx.beginPath()
    ctx.arc(0, 0, this.bird.r, 0, Math.PI * 2)
    ctx.fill()
    // beak
    ctx.fillStyle = '#e67e22'
    ctx.beginPath()
    ctx.moveTo(this.bird.r, -4)
    ctx.lineTo(this.bird.r + 12, 0)
    ctx.lineTo(this.bird.r, 4)
    ctx.closePath()
    ctx.fill()
    // eye (white + pupil)
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(this.bird.r * 0.25, -4, 3.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#111'
    ctx.beginPath()
    ctx.arc(this.bird.r * 0.25 + 1, -4, 1.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // UI overlays
    ctx.fillStyle = '#000'
    ctx.globalAlpha = 0.85
    ctx.font = 'bold 28px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${this.score}`, w / 2, 42)
    ctx.globalAlpha = 1

    if (this.state === 'ready') {
      ctx.fillStyle = '#000'
      ctx.globalAlpha = 0.75
      ctx.fillRect(w * 0.15, h * 0.3, w * 0.7, 100)
      ctx.globalAlpha = 1
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 22px system-ui, sans-serif'
      ctx.fillText('Başlamak için tıkla veya boşluk', w / 2, h * 0.3 + 40)
    } else if (this.state === 'gameover') {
      ctx.fillStyle = '#000'
      ctx.globalAlpha = 0.75
      ctx.fillRect(w * 0.15, h * 0.3, w * 0.7, 130)
      ctx.globalAlpha = 1
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 22px system-ui, sans-serif'
      ctx.fillText('Oyun Bitti', w / 2, h * 0.3 + 36)
      ctx.font = '16px system-ui, sans-serif'
      ctx.fillText(`Skor: ${this.score}  Yeniden başlat: R`, w / 2, h * 0.3 + 70)
    }
  }
}
