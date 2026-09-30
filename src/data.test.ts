import { describe, expect, it } from 'vitest'
import { computeResults, loadDataset, profileLine, type Dataset } from './data'

const levels = [1, 50, 99.9]
const ds: Dataset = {
  meta: { year: 2025, source: 'x', ipca_factor: 2, ipca_ref: '2026-08', generated_at: 'x', percentiles: levels },
  groups: {
    BR: { n: 1000, pop: 1, p: [500, 2000, 50000] },
    'UF:SP': { n: 500, pop: 1, p: [600, 2500, 60000] },
    'AGE:35-44': { n: 300, pop: 1, p: [700, 3000, 70000] },
    'UF:SP|AGE:35-44': { n: 42, pop: 1, p: [800, 3500, 80000] },
    // 'POS:09' intentionally missing
  },
}

describe('computeResults', () => {
  const results = computeResults(ds, { monthlyIncome: 4000, uf: 'SP', age: '35-44', position: '09' })

  it('returns five scopes in order', () => {
    expect(results.map((r) => r.id)).toEqual(['br', 'uf', 'age', 'ufAge', 'pos'])
  })

  it('applies the IPCA factor before ranking', () => {
    // adjusted BR: [1000, 4000, 100000] -> 4000 is exactly the median
    expect(results[0].rank).toBe(50)
    expect(results[0].values).toEqual([1000, 4000, 100000])
  })

  it('labels scopes in Portuguese', () => {
    expect(results.map((r) => r.label)).toEqual(['Brasil', 'São Paulo', '35–44 · Brasil', '35–44 · SP', 'Conta própria'])
    expect(results[1].audience).toBe('dos trabalhadores de São Paulo')
    expect(results[3].audience).toBe('dos trabalhadores de 35 a 44 anos em SP')
  })

  it('flags small samples as imprecise', () => {
    expect(results[3].imprecise).toBe(true)
    expect(results[1].imprecise).toBe(false)
  })

  it('handles a missing group without throwing', () => {
    expect(results[4]).toMatchObject({ rank: null, imprecise: true, n: 0, values: [] })
  })
})

describe('profileLine', () => {
  it('summarises the input', () => {
    expect(profileLine({ monthlyIncome: 1, uf: 'SP', age: '65+', position: '07' })).toBe(
      'SP · 65+ anos · Militar e estatutário',
    )
  })
})

describe('loadDataset', () => {
  it('fetches and parses JSON', async () => {
    const fakeFetch = (async () => new Response(JSON.stringify(ds))) as typeof fetch
    await expect(loadDataset('/x.json', fakeFetch)).resolves.toEqual(ds)
  })

  it('throws on HTTP error', async () => {
    const fakeFetch = (async () => new Response('nope', { status: 404 })) as typeof fetch
    await expect(loadDataset('/x.json', fakeFetch)).rejects.toThrow('404')
  })
})
