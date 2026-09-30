import { SITE_LABEL, SITE_URL } from '../config'

export interface CardData {
  lead: string
  num: string
  tail: string
  tags: { label: string; value: string; imprecise: boolean }[]
  profile: string
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
const DISPLAY = '"Carter One"'
const TEXT = 'Nunito'

// Largest font size (stepping down by 2px) at which the text fits maxWidth.
export function fitFontSize(measureAt: (size: number) => number, maxSize: number, maxWidth: number, minSize = 40): number {
  let size = maxSize
  while (size > minSize && measureAt(size) > maxWidth) size -= 2
  return Math.max(size, minSize)
}

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
  const measureAt = (font: (size: number) => string, text: string) => (size: number) => {
    ctx.font = font(size)
    return ctx.measureText(text).width
  }
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, W, H)
  grain(ctx)
  ctx.textBaseline = 'alphabetic'

  // top row
  ctx.fillStyle = INK
  ctx.font = `800 44px ${TEXT}`
  ctx.fillText('UMPORCENTO', M, 140)
  ctx.font = `800 40px ${TEXT}`
  const stamp = 'PNAD · IBGE'
  const sw = ctx.measureText(stamp).width + 40
  ctx.fillStyle = RED
  roundRect(ctx, W - M - sw, 92, sw, 66, 8)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(stamp, W - M - sw + 20, 140)

  // lead
  ctx.fillStyle = INK
  ctx.font = `400 88px ${DISPLAY}`
  let y = 300
  for (const line of wrapWords(d.lead, (s) => ctx.measureText(s).width, W - 2 * M)) {
    ctx.fillText(line, M, y)
    y += 100
  }

  // number + "%" sized to fit the width
  const pctRatio = 0.45
  const numSize = fitFontSize(
    (size) => measureAt((s) => `400 ${s}px ${DISPLAY}`, d.num)(size) + measureAt((s) => `400 ${s * pctRatio}px ${DISPLAY}`, '%')(size) + 20,
    400,
    W - 2 * M,
    160,
  )
  ctx.fillStyle = RED
  ctx.font = `400 ${numSize}px ${DISPLAY}`
  const numY = y + numSize * 0.8
  ctx.fillText(d.num, M, numY)
  const nw = ctx.measureText(d.num).width
  ctx.font = `400 ${numSize * pctRatio}px ${DISPLAY}`
  ctx.fillText('%', M + nw + 20, numY - numSize * 0.4)

  // tail
  ctx.fillStyle = INK
  ctx.font = `400 72px ${DISPLAY}`
  // Carter One uses old-style figures: 9 and the comma descend below the baseline
  y = numY + numSize * 0.3 + 80
  for (const line of wrapWords(d.tail, (s) => ctx.measureText(s).width, W - 2 * M)) {
    ctx.fillText(line, M, y)
    y += 84
  }

  // tags 2x2
  const gap = 28
  const tw = (W - 2 * M - gap) / 2
  const th = 210
  y += 20
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
    const label = tag.label.toUpperCase()
    ctx.font = `800 ${fitFontSize(measureAt((s) => `800 ${s}px ${TEXT}`, label), 40, tw - 56, 26)}px ${TEXT}`
    ctx.fillText(label, x + 28, ty + 66)
    ctx.fillStyle = RED
    const value = tag.value + (tag.imprecise ? '*' : '')
    ctx.font = `400 ${fitFontSize(measureAt((s) => `400 ${s}px ${DISPLAY}`, value), 110, tw - 56, 60)}px ${DISPLAY}`
    ctx.fillText(value, x + 28, ty + 176)
  })

  // bottom block, anchored to the bottom edge so it never collides with the tags
  ctx.fillStyle = INK
  ctx.font = `400 52px ${DISPLAY}`
  ctx.fillText(SITE_LABEL, M, H - 130)
  ctx.font = `700 38px ${TEXT}`
  ctx.fillText(d.source, M, H - 76)

  let by = H - 230
  if (d.tags.some((t) => t.imprecise)) {
    ctx.font = `700 34px ${TEXT}`
    ctx.fillText('* estimativa imprecisa (amostra pequena)', M, by)
    by -= 60
  }
  ctx.font = `700 44px ${TEXT}`
  ctx.fillText(d.profile, M, by)
}

export async function renderCardBlob(data: CardData): Promise<Blob> {
  await Promise.all([
    document.fonts.load(`400 100px ${DISPLAY}`),
    document.fonts.load(`700 40px ${TEXT}`),
    document.fonts.load(`800 40px ${TEXT}`),
  ])
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

export interface CardCache { get(): Promise<Blob> }

// Pre-renders the card so the share click can call navigator.share while user activation is still valid.
export function createCardCache(render: () => Promise<Blob>): CardCache {
  let pending: Promise<Blob> | null = null
  return {
    get() {
      if (!pending) {
        const current = render()
        current.catch(() => {
          if (pending === current) pending = null
        })
        pending = current
      }
      return pending
    },
  }
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
