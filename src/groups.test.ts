import { describe, expect, it } from 'vitest'
import { AGE_BANDS, POSITIONS, SCOPE_ORDER, UFS, findPosition, groupKeys } from './groups'

describe('groups', () => {
  it('has 27 UFs with unique codes', () => {
    expect(UFS).toHaveLength(27)
    expect(new Set(UFS.map((u) => u.code)).size).toBe(27)
  })

  it('has the six age bands in order', () => {
    expect(AGE_BANDS.map((a) => a.id)).toEqual(['18-24', '25-34', '35-44', '45-54', '55-64', '65+'])
  })

  it('has the nine PNAD positions with correct annual divisors', () => {
    expect(POSITIONS.map((p) => p.code)).toEqual(['01', '02', '03', '04', '05', '06', '07', '08', '09'])
    const withThirteenth = POSITIONS.filter((p) => p.annualDivisor === 13.33).map((p) => p.code)
    expect(withThirteenth).toEqual(['01', '03', '05', '07'])
    expect(findPosition('09').label).toBe('Conta própria')
  })

  it('builds keys matching the pipeline format', () => {
    expect(groupKeys('SP', '35-44', '01')).toEqual({
      br: 'BR',
      uf: 'UF:SP',
      age: 'AGE:35-44',
      ufAge: 'UF:SP|AGE:35-44',
      pos: 'POS:01',
    })
    expect(SCOPE_ORDER).toEqual(['br', 'uf', 'age', 'ufAge', 'pos'])
  })
})
