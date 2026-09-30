import { describe, expect, it } from 'vitest'
import { validateForm, type RawForm } from './form'

const base: RawForm = { income: '8.000', period: 'month', uf: 'SP', age: '35-44', position: '01' }

describe('validateForm', () => {
  it('accepts a complete monthly form', () => {
    expect(validateForm(base)).toEqual({
      ok: true,
      input: { monthlyIncome: 8000, uf: 'SP', age: '35-44', position: '01' },
    })
  })

  it('converts annual income with the position divisor', () => {
    const r = validateForm({ ...base, income: '133.300', period: 'year' })
    expect(r.ok && r.input.monthlyIncome).toBeCloseTo(10000)
    const r2 = validateForm({ ...base, income: '120.000', period: 'year', position: '09' })
    expect(r2.ok && r2.input.monthlyIncome).toBe(10000)
  })

  it.each(['', 'abc', '0', '-5'])('rejects income %j', (income) => {
    const r = validateForm({ ...base, income })
    expect(r.ok).toBe(false)
    expect(!r.ok && r.errors.income).toBe('Informe sua renda bruta, maior que zero.')
  })

  it('rejects absurd income', () => {
    const r = validateForm({ ...base, income: '50.000.000' })
    expect(!r.ok && r.errors.income).toBe('Valor muito alto. Confira se digitou certo.')
  })

  it('requires every select', () => {
    const r = validateForm({ ...base, uf: '', age: '', position: '' })
    expect(r.ok).toBe(false)
    expect(!r.ok && Object.keys(r.errors).sort()).toEqual(['age', 'position', 'uf'])
  })

  it('rejects unknown codes', () => {
    const r = validateForm({ ...base, uf: 'XX', age: '99', position: '10' })
    expect(!r.ok && Object.keys(r.errors).sort()).toEqual(['age', 'position', 'uf'])
  })
})
