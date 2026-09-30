import { describe, expect, it } from 'vitest'
import { detailCaption } from './detail'

describe('detailCaption', () => {
  it('describes a rank above the median', () => {
    expect(detailCaption(91.2, 'dos trabalhadores do Brasil', 2000)).toBe(
      'Distribuição de renda dos trabalhadores do Brasil. A mediana é R$ 2.000. Você ganha mais que 91% dessas pessoas.',
    )
  })
  it('does not claim "above 99%" for incomes below p1', () => {
    expect(detailCaption(0.3, 'dos trabalhadores do Brasil', 2000)).toBe(
      'Distribuição de renda dos trabalhadores do Brasil. A mediana é R$ 2.000. Você ganha menos que 99% dessas pessoas.',
    )
  })
})
