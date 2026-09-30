export type ScopeId = 'br' | 'uf' | 'age' | 'ufAge' | 'pos'
export const SCOPE_ORDER: readonly ScopeId[] = ['br', 'uf', 'age', 'ufAge', 'pos']

export interface Uf {
  code: string
  name: string
  prep: 'de' | 'do' | 'da'
}

export const UFS: readonly Uf[] = [
  { code: 'AC', name: 'Acre', prep: 'do' },
  { code: 'AL', name: 'Alagoas', prep: 'de' },
  { code: 'AP', name: 'Amapá', prep: 'do' },
  { code: 'AM', name: 'Amazonas', prep: 'do' },
  { code: 'BA', name: 'Bahia', prep: 'da' },
  { code: 'CE', name: 'Ceará', prep: 'do' },
  { code: 'DF', name: 'Distrito Federal', prep: 'do' },
  { code: 'ES', name: 'Espírito Santo', prep: 'do' },
  { code: 'GO', name: 'Goiás', prep: 'de' },
  { code: 'MA', name: 'Maranhão', prep: 'do' },
  { code: 'MT', name: 'Mato Grosso', prep: 'de' },
  { code: 'MS', name: 'Mato Grosso do Sul', prep: 'de' },
  { code: 'MG', name: 'Minas Gerais', prep: 'de' },
  { code: 'PA', name: 'Pará', prep: 'do' },
  { code: 'PB', name: 'Paraíba', prep: 'da' },
  { code: 'PR', name: 'Paraná', prep: 'do' },
  { code: 'PE', name: 'Pernambuco', prep: 'de' },
  { code: 'PI', name: 'Piauí', prep: 'do' },
  { code: 'RJ', name: 'Rio de Janeiro', prep: 'do' },
  { code: 'RN', name: 'Rio Grande do Norte', prep: 'do' },
  { code: 'RS', name: 'Rio Grande do Sul', prep: 'do' },
  { code: 'RO', name: 'Rondônia', prep: 'de' },
  { code: 'RR', name: 'Roraima', prep: 'de' },
  { code: 'SC', name: 'Santa Catarina', prep: 'de' },
  { code: 'SP', name: 'São Paulo', prep: 'de' },
  { code: 'SE', name: 'Sergipe', prep: 'de' },
  { code: 'TO', name: 'Tocantins', prep: 'do' },
]

export type AgeBand = '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+'

export const AGE_BANDS: readonly { id: AgeBand; label: string; audience: string }[] = [
  { id: '18-24', label: '18–24', audience: 'de 18 a 24 anos' },
  { id: '25-34', label: '25–34', audience: 'de 25 a 34 anos' },
  { id: '35-44', label: '35–44', audience: 'de 35 a 44 anos' },
  { id: '45-54', label: '45–54', audience: 'de 45 a 54 anos' },
  { id: '55-64', label: '55–64', audience: 'de 55 a 64 anos' },
  { id: '65+', label: '65+', audience: 'de 65 anos ou mais' },
]

export type PositionCode = '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09'

export interface Position {
  code: PositionCode
  label: string
  short: string
  hint: string
  audience: string
  annualDivisor: 12 | 13.33
}

export const POSITIONS: readonly Position[] = [
  { code: '01', label: 'Empregado no setor privado com carteira', short: 'Privado c/ carteira', hint: 'CLT', audience: 'dos empregados no setor privado com carteira', annualDivisor: 13.33 },
  { code: '02', label: 'Empregado no setor privado sem carteira', short: 'Privado s/ carteira', hint: '', audience: 'dos empregados no setor privado sem carteira', annualDivisor: 12 },
  { code: '03', label: 'Trabalhador doméstico com carteira', short: 'Doméstico c/ carteira', hint: '', audience: 'dos trabalhadores domésticos com carteira', annualDivisor: 13.33 },
  { code: '04', label: 'Trabalhador doméstico sem carteira', short: 'Doméstico s/ carteira', hint: '', audience: 'dos trabalhadores domésticos sem carteira', annualDivisor: 12 },
  { code: '05', label: 'Empregado no setor público com carteira', short: 'Público c/ carteira', hint: 'estatais, CLT público', audience: 'dos empregados no setor público com carteira', annualDivisor: 13.33 },
  { code: '06', label: 'Empregado no setor público sem carteira', short: 'Público s/ carteira', hint: 'temporários, comissionados', audience: 'dos empregados no setor público sem carteira', annualDivisor: 12 },
  { code: '07', label: 'Militar e servidor estatutário', short: 'Militar e estatutário', hint: 'servidor concursado', audience: 'dos militares e servidores estatutários', annualDivisor: 13.33 },
  { code: '08', label: 'Empregador', short: 'Empregador', hint: 'dono de empresa com funcionários', audience: 'dos empregadores', annualDivisor: 12 },
  { code: '09', label: 'Conta própria', short: 'Conta própria', hint: 'inclui PJ, MEI, autônomos', audience: 'dos trabalhadores por conta própria', annualDivisor: 12 },
]

export function findUf(code: string): Uf {
  const uf = UFS.find((u) => u.code === code)
  if (!uf) throw new Error(`Unknown UF: ${code}`)
  return uf
}

export function findAge(id: string) {
  const age = AGE_BANDS.find((a) => a.id === id)
  if (!age) throw new Error(`Unknown age band: ${id}`)
  return age
}

export function findPosition(code: string): Position {
  const pos = POSITIONS.find((p) => p.code === code)
  if (!pos) throw new Error(`Unknown position: ${code}`)
  return pos
}

export function groupKeys(uf: string, age: AgeBand, pos: PositionCode): Record<ScopeId, string> {
  return {
    br: 'BR',
    uf: `UF:${uf}`,
    age: `AGE:${age}`,
    ufAge: `UF:${uf}|AGE:${age}`,
    pos: `POS:${pos}`,
  }
}
