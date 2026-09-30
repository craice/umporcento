import { describe, expect, it } from 'vitest'
import { curveGeometry } from './curve'

const points = [
  { x: 1000, y: 0.2 },
  { x: 3000, y: 1 },
  { x: 10000, y: 0.4 },
  { x: 30000, y: 0.1 },
]

describe('curveGeometry', () => {
  it('builds closed area and open line paths', () => {
    const g = curveGeometry(points, 3000, 3000, 300, 100)
    expect(g.area.startsWith('M0,100')).toBe(true)
    expect(g.area.endsWith('Z')).toBe(true)
    expect(g.line.startsWith('M0,')).toBe(true)
  })

  it('places the marker on a log scale', () => {
    const g = curveGeometry(points, 3000, 3000, 300, 100)
    const expected = (300 * Math.log(3000 / 1000)) / Math.log(30000 / 1000)
    expect(g.markerX).toBeCloseTo(expected)
    expect(g.medianX).toBeCloseTo(expected)
  })

  it('clamps the marker inside the chart for extreme incomes', () => {
    expect(curveGeometry(points, 10, 3000, 300, 100).markerX).toBe(0)
    expect(curveGeometry(points, 10_000_000, 3000, 300, 100).markerX).toBe(300)
  })

  it('only emits ticks inside the range', () => {
    const g = curveGeometry(points, 3000, 3000, 300, 100)
    expect(g.ticks.map((t) => t.label)).toEqual(['R$ 1 mil', 'R$ 3 mil', 'R$ 10 mil', 'R$ 30 mil'])
    g.ticks.forEach((t) => expect(t.x).toBeGreaterThanOrEqual(0))
  })
})

describe('curve ticks spacing', () => {
  it('drops a tick that would overlap the previous one', () => {
    const wide = [
      { x: 400, y: 0.2 },
      { x: 3000, y: 1 },
      { x: 100000, y: 0.1 },
    ]
    const labels = curveGeometry(wide, 3000, 3000, 320, 100).ticks.map((t) => t.label)
    expect(labels).toEqual(['R$ 500', 'R$ 3 mil', 'R$ 10 mil', 'R$ 30 mil', 'R$ 100 mil'])
  })
})
