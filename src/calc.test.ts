import { describe, expect, it } from 'vitest'
import {
  adjust, densityCurve, formatBRL, formatPercent, headline, parseBRL,
  percentNumber, percentileRank, toMonthly, valueAt,
} from './calc'

const LEVELS = [1, 10, 20, 30, 50, 90, 99, 99.9]
const VALUES = [500, 1000, 1518, 1518, 2500, 7000, 25000, 90000]

describe('parseBRL', () => {
  it.each([
    ['8.000', 8000],
    ['8.000,50', 8000.5],
    ['R$ 8.000', 8000],
    ['R$8000', 8000],
    ['8000,5', 8000.5],
    ['1.234.567', 1234567],
    ['8.50', 8.5],
    [' 3500 ', 3500],
    ['0', 0],
  ])('parses %s', (raw, expected) => {
    expect(parseBRL(raw)).toBe(expected)
  })

  it.each(['', '   ', 'abc', '-500', '8,000,00', '1.2.3,4,5'])('rejects %j', (raw) => {
    expect(parseBRL(raw)).toBeNull()
  })
})

describe('toMonthly', () => {
  it('keeps monthly values', () => expect(toMonthly(5000, 'month', 13.33)).toBe(5000))
  it('divides annual by 13.33 for positions with 13th salary', () =>
    expect(toMonthly(133300, 'year', 13.33)).toBeCloseTo(10000))
  it('divides annual by 12 otherwise', () => expect(toMonthly(120000, 'year', 12)).toBe(10000))
})

describe('percentileRank', () => {
  it('interpolates between neighbours', () => {
    expect(percentileRank(1750, LEVELS, VALUES)).toBeCloseTo(30 + 20 * (232 / 982))
  })
  it('returns the start of a plateau for incomes exactly on it', () => {
    expect(percentileRank(1518, LEVELS, VALUES)).toBe(20)
  })
  it('just above a plateau is above its end', () => {
    expect(percentileRank(1519, LEVELS, VALUES)).toBeGreaterThan(30)
  })
  it('returns 0 below p1 and 100 above the last level', () => {
    expect(percentileRank(100, LEVELS, VALUES)).toBe(0)
    expect(percentileRank(1_000_000, LEVELS, VALUES)).toBe(100)
  })
  it('returns the exact level on a knot', () => {
    expect(percentileRank(2500, LEVELS, VALUES)).toBe(50)
    expect(percentileRank(90000, LEVELS, VALUES)).toBe(99.9)
  })
})

describe('percent formatting', () => {
  it.each([
    [0, '<1'],
    [0.99, '<1'],
    [1, '1'],
    [91.97, '91'],
    [99, '99'],
    [99.46, '99,4'],
    [99.9, '99,9'],
    [100, '>99,9'],
  ])('percentNumber(%d) = %s', (rank, text) => {
    expect(percentNumber(rank)).toBe(text)
  })

  it('formatPercent appends %', () => expect(formatPercent(91.2)).toBe('91%'))

  it('headline handles extremes', () => {
    expect(headline(91.2)).toEqual({ lead: 'Você ganha mais que', num: '91' })
    expect(headline(100)).toEqual({ lead: 'Você ganha mais que', num: '99,9' })
    expect(headline(0.4)).toEqual({ lead: 'Você ganha menos que', num: '99' })
  })
})

describe('money helpers', () => {
  it('adjusts by factor', () => expect(adjust([100, 200], 1.1)).toEqual([110.00000000000001, 220.00000000000003]))
  it('valueAt reads a level', () => expect(valueAt(50, LEVELS, VALUES)).toBe(2500))
  it('formatBRL rounds to R$ 10 with dot thousands', () => {
    expect(formatBRL(2894)).toBe('R$ 2.890')
    expect(formatBRL(25000)).toBe('R$ 25.000')
  })
})

describe('densityCurve', () => {
  it('returns normalised points spanning the value range', () => {
    const pts = densityCurve(LEVELS, VALUES, 30)
    expect(pts).toHaveLength(30)
    expect(Math.max(...pts.map((p) => p.y))).toBeCloseTo(1)
    expect(pts[0].x).toBeGreaterThan(VALUES[0])
    expect(pts[29].x).toBeLessThan(VALUES[VALUES.length - 1])
    for (let i = 1; i < pts.length; i++) expect(pts[i].x).toBeGreaterThan(pts[i - 1].x)
  })
})
