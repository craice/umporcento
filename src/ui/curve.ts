import { densityCurve, valueAt } from '../calc'
import type { ScopeResult } from '../data'

export interface CurveGeometry {
  area: string
  line: string
  markerX: number
  medianX: number
  ticks: { x: number; label: string }[]
}

const TICKS = [
  { value: 500, label: 'R$ 500' },
  { value: 1000, label: 'R$ 1 mil' },
  { value: 3000, label: 'R$ 3 mil' },
  { value: 10000, label: 'R$ 10 mil' },
  { value: 30000, label: 'R$ 30 mil' },
  { value: 100000, label: 'R$ 100 mil' },
]

// Minimum horizontal distance between tick labels, in viewBox units.
const MIN_TICK_GAP = 48

export function curveGeometry(
  points: { x: number; y: number }[],
  income: number,
  median: number,
  width: number,
  height: number,
): CurveGeometry {
  const lo = Math.log(points[0].x)
  const hi = Math.log(points[points.length - 1].x)
  const sx = (v: number) => Math.min(width, Math.max(0, ((Math.log(v) - lo) / (hi - lo)) * width))
  const top = height * 0.08
  const sy = (y: number) => height - y * (height - top)
  const coords = points.map((p) => `${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`)
  const line = `M0,${sy(points[0].y).toFixed(1)} L${coords.join(' L')} L${width},${sy(points[points.length - 1].y).toFixed(1)}`
  const area = `M0,${height} L0,${sy(points[0].y).toFixed(1)} L${coords.join(' L')} L${width},${height} Z`
  const ticks: { x: number; label: string }[] = []
  for (const t of TICKS) {
    if (t.value < points[0].x || t.value > points[points.length - 1].x) continue
    const x = sx(t.value)
    if (ticks.length > 0 && x - ticks[ticks.length - 1].x < MIN_TICK_GAP) continue
    ticks.push({ x, label: t.label })
  }
  return { area, line, markerX: sx(income), medianX: sx(median), ticks }
}

export function renderCurveSvg(scope: ScopeResult, income: number): string {
  const W = 320
  const H = 150
  const points = densityCurve(scope.levels, scope.values)
  const median = valueAt(50, scope.levels, scope.values)
  const g = curveGeometry(points, income, median, W, H)
  const ticks = g.ticks
    .map((t) => `<text x="${t.x.toFixed(1)}" y="${H + 16}" text-anchor="middle" class="curve__tick">${t.label}</text>`)
    .join('')
  return `
  <svg viewBox="0 -18 ${W} ${H + 40}" class="curve__svg" role="img" aria-hidden="true">
    <defs><clipPath id="below"><rect x="0" y="-18" width="${g.markerX.toFixed(1)}" height="${H + 18}" /></clipPath></defs>
    <path d="${g.area}" class="curve__area" />
    <path d="${g.area}" class="curve__area curve__area--below" clip-path="url(#below)" />
    <path d="${g.line}" class="curve__line" />
    <line x1="${g.medianX.toFixed(1)}" x2="${g.medianX.toFixed(1)}" y1="0" y2="${H}" class="curve__median" />
    <text x="${(g.medianX + 4).toFixed(1)}" y="12" class="curve__label">mediana</text>
    <line x1="${g.markerX.toFixed(1)}" x2="${g.markerX.toFixed(1)}" y1="0" y2="${H}" class="curve__marker" />
    <text x="${Math.min(W - 16, Math.max(16, g.markerX)).toFixed(1)}" y="-4" text-anchor="middle" class="curve__you">você</text>
    <line x1="0" x2="${W}" y1="${H}" y2="${H}" class="curve__axis" />
    ${ticks}
  </svg>`
}
