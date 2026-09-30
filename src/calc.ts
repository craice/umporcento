export type Period = 'month' | 'year'

export function parseBRL(raw: string): number | null {
  let s = raw.replace(/R\$/gi, '').replace(/\s/g, '')
  if (!s) return null
  if (s.includes(',')) {
    if ((s.match(/,/g) ?? []).length > 1) return null
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (!/^\d+\.\d{1,2}$/.test(s)) {
    s = s.replace(/\./g, '')
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export function toMonthly(amount: number, period: Period, annualDivisor: number): number {
  return period === 'month' ? amount : amount / annualDivisor
}

export function adjust(values: readonly number[], factor: number): number[] {
  return values.map((v) => v * factor)
}

export function percentileRank(income: number, levels: readonly number[], values: readonly number[]): number {
  const last = values.length - 1
  if (income < values[0]) return 0
  if (income > values[last]) return 100
  let i = 0
  while (values[i] < income) i++
  if (values[i] === income || i === 0) return levels[i]
  const lo = i - 1
  return levels[lo] + ((levels[i] - levels[lo]) * (income - values[lo])) / (values[i] - values[lo])
}

const oneDecimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export function percentNumber(rank: number): string {
  if (rank < 1) return '<1'
  if (rank >= 100) return '>99,9'
  if (rank > 99) return oneDecimal.format(Math.floor(rank * 10) / 10)
  return String(Math.floor(rank))
}

export function formatPercent(rank: number): string {
  return `${percentNumber(rank)}%`
}

export function headline(rank: number): { lead: string; num: string } {
  if (rank < 1) return { lead: 'Você ganha menos que', num: '99' }
  if (rank >= 100) return { lead: 'Você ganha mais que', num: '99,9' }
  return { lead: 'Você ganha mais que', num: percentNumber(rank) }
}

export function valueAt(level: number, levels: readonly number[], values: readonly number[]): number {
  const i = levels.indexOf(level)
  if (i < 0) throw new Error(`Level ${level} not available`)
  return values[i]
}

const brl = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

export function formatBRL(value: number): string {
  return `R$ ${brl.format(Math.round(value / 10) * 10)}`
}

export function densityCurve(
  levels: readonly number[],
  values: readonly number[],
  bins = 60,
): { x: number; y: number }[] {
  const lo = Math.log(values[0])
  const hi = Math.log(values[values.length - 1])
  const step = (hi - lo) / bins
  const raw: { x: number; y: number }[] = []
  for (let b = 0; b < bins; b++) {
    const a = Math.exp(lo + b * step)
    const z = Math.exp(lo + (b + 1) * step)
    const mass = percentileRank(z, levels, values) - percentileRank(a, levels, values)
    raw.push({ x: Math.exp(lo + (b + 0.5) * step), y: Math.max(0, mass) })
  }
  const blur = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => {
      const prev = pts[i - 1]?.y ?? p.y
      const next = pts[i + 1]?.y ?? p.y
      return { x: p.x, y: (prev + 2 * p.y + next) / 4 }
    })
  const smooth = blur(blur(blur(raw)))
  const max = Math.max(...smooth.map((p) => p.y)) || 1
  return smooth.map((p) => ({ x: p.x, y: p.y / max }))
}
