import { SITE_LABEL, SITE_URL } from '../config'

export interface CardData {
  lead: string
  num: string
  tail: string
  tags: { label: string; value: string; imprecise: boolean }[]
  profile: string
  incomeText: string | null
  source: string
}

export interface ShareEnv {
  canShare?: (data: ShareData) => boolean
  share?: (data: ShareData) => Promise<void>
  download: (blob: Blob, filename: string) => void
}

export type ShareOutcome = 'shared' | 'cancelled' | 'downloaded'

const FILENAME = 'umporcento.png'
const W = 1080
const H = 1920
const PAPER = '#FFE600'
const RED = '#E8001C'
const INK = '#141414'
const FONT = '"Londrina Solid"'

export function wrapWords(text: string, measure: (s: string) => number, maxWidth: number): string[] {
  const lines: string[] = []
  let current = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = current ? `${current} ${word}` : word
    if (current && measure(candidate) > maxWidth) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)
  return lines
}

function grain(ctx: CanvasRenderingContext2D): void {
  let seed = 42
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  ctx.fillStyle = 'rgba(0,0,0,0.05)'
  for (let i = 0; i < 9000; i++) ctx.fillRect(rand() * W, rand() * H, 2, 2)
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function draw(ctx: CanvasRenderingContext2D, d: CardData): void {
  const M = 80
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, W, H)
  grain(ctx)
  ctx.textBaseline = 'alphabetic'

  // top row
  ctx.fillStyle = INK
  ctx.font = `400 48px ${FONT}`
  ctx.fillText('UMPORCENTO', M, 140)
  ctx.font = `900 44px ${FONT}`
  const stamp = 'PNAD · IBGE'
  const sw = ctx.measureText(stamp).width + 40
  ctx.fillStyle = RED
  roundRect(ctx, W - M - sw, 92, sw, 66, 8)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(stamp, W - M - sw + 20, 142)

  // lead
  ctx.fillStyle = INK
  ctx.font = `900 120px ${FONT}`
  let y = 340
  for (const line of wrapWords(d.lead.toUpperCase(), (s) => ctx.measureText(s).width, W - 2 * M)) {
    ctx.fillText(line, M, y)
    y += 112
  }

  // number
  ctx.fillStyle = RED
  ctx.font = `900 520px ${FONT}`
  const numY = y + 400
  ctx.fillText(d.num, M - 10, numY)
  const nw = ctx.measureText(d.num).width
  ctx.font = `900 230px ${FONT}`
  ctx.fillText('%', M - 10 + nw + 10, numY - 220)

  // tail
  ctx.fillStyle = INK
  ctx.font = `900 88px ${FONT}`
  y = numY + 110
  for (const line of wrapWords(d.tail.toUpperCase(), (s) => ctx.measureText(s).width, W - 2 * M)) {
    ctx.fillText(line, M, y)
    y += 88
  }

  // tags 2x2
  const gap = 28
  const tw = (W - 2 * M - gap) / 2
  const th = 230
  y += 40
  d.tags.slice(0, 4).forEach((tag, i) => {
    const x = M + (i % 2) * (tw + gap)
    const ty = y + Math.floor(i / 2) * (th + gap)
    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    roundRect(ctx, x + 8, ty + 10, tw, th, 18)
    ctx.fill()
    ctx.fillStyle = '#FFFFFF'
    roundRect(ctx, x, ty, tw, th, 18)
    ctx.fill()
    ctx.fillStyle = INK
    ctx.font = `400 46px ${FONT}`
    ctx.fillText(tag.label.toUpperCase(), x + 28, ty + 70)
    ctx.fillStyle = RED
    ctx.font = `900 130px ${FONT}`
    ctx.fillText(tag.value + (tag.imprecise ? '*' : ''), x + 28, ty + 196)
  })
  y += 2 * th + gap + 90

  // profile, income, footnote
  ctx.fillStyle = INK
  ctx.font = `400 48px ${FONT}`
  ctx.fillText(d.profile, M, y)
  if (d.incomeText) {
    y += 64
    ctx.fillText(d.incomeText, M, y)
  }
  if (d.tags.some((t) => t.imprecise)) {
    y += 56
    ctx.font = `400 36px ${FONT}`
    ctx.fillText('* estimativa imprecisa (amostra pequena)', M, y)
  }

  // footer
  ctx.font = `900 56px ${FONT}`
  ctx.fillText(SITE_LABEL, M, H - 130)
  ctx.font = `400 40px ${FONT}`
  ctx.fillText(d.source, M, H - 76)
}

export async function renderCardBlob(data: CardData): Promise<Blob> {
  await Promise.all([document.fonts.load(`400 48px ${FONT}`), document.fonts.load(`900 120px ${FONT}`)])
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D not available')
  draw(ctx, data)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  )
}

export async function shareOrDownload(blob: Blob, env: ShareEnv): Promise<ShareOutcome> {
  const file = new File([blob], FILENAME, { type: 'image/png' })
  const data: ShareData = { files: [file], text: `Onde você está na renda do Brasil? ${SITE_URL}` }
  if (env.share && env.canShare?.(data)) {
    try {
      await env.share(data)
      return 'shared'
    } catch (error) {
      if ((error as Error).name === 'AbortError') return 'cancelled'
    }
  }
  env.download(blob, FILENAME)
  return 'downloaded'
}

export function browserShareEnv(): ShareEnv {
  return {
    canShare: navigator.canShare?.bind(navigator),
    share: navigator.share?.bind(navigator),
    download(blob, filename) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    },
  }
}
