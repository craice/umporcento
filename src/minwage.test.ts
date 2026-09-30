import { describe, expect, it } from 'vitest'
import dataset from '../public/data/percentiles.json'
import { adjustValues, computeResults, minWageShift, type Dataset } from './data'

describe('adjustValues', () => {
  it('moves the data-year minimum wage plateau to the current minimum wage and keeps order', () => {
    expect(adjustValues([1000, 1500, 1500, 1520, 3000], 1.04, { from: 1500, to: 1600 })).toEqual([
      1040, 1600, 1600, 1600, 3120,
    ])
  })
  it('falls back to plain IPCA when no shift applies', () => {
    expect(adjustValues([100, 200], 2)).toEqual([200, 400])
  })
})

describe('minWageShift', () => {
  it('maps the data year to the IPCA reference year', () => {
    expect(minWageShift({ year: 2025, ipca_ref: '2026-08' })).toEqual({ from: 1518, to: 1621 })
  })
  it('is undefined for unknown years', () => {
    expect(minWageShift({ year: 2010, ipca_ref: '2026-08' })).toBeUndefined()
    expect(minWageShift({ year: 2025, ipca_ref: null })).toBeUndefined()
  })
})

describe('real dataset', () => {
  const ds = dataset as unknown as Dataset
  it('ranks someone earning exactly the current minimum wage at the start of the plateau', () => {
    const [br] = computeResults(ds, { monthlyIncome: 1621, uf: 'SP', age: '35-44', position: '01' })
    expect(br.rank).toBeGreaterThan(15)
    expect(br.rank).toBeLessThan(22)
  })
})
