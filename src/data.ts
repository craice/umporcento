import { adjust, percentileRank } from './calc'
import { DATA_URL, MIN_SAMPLE_SIZE } from './config'
import {
  SCOPE_ORDER, findAge, findPosition, findUf, groupKeys,
  type AgeBand, type PositionCode, type ScopeId,
} from './groups'

export interface Group { n: number; pop: number; p: number[] }

export interface Meta {
  year: number
  source: string
  ipca_factor: number
  ipca_ref: string | null
  generated_at: string
  percentiles: number[]
}

export interface Dataset { meta: Meta; groups: Record<string, Group> }

export interface UserInput {
  monthlyIncome: number
  uf: string
  age: AgeBand
  position: PositionCode
}

export interface ScopeResult {
  id: ScopeId
  key: string
  label: string
  audience: string
  rank: number | null
  imprecise: boolean
  n: number
  levels: number[]
  values: number[]
}

export async function loadDataset(url: string = DATA_URL, fetchFn: typeof fetch = fetch): Promise<Dataset> {
  const response = await fetchFn(url)
  if (!response.ok) throw new Error(`Failed to load dataset: HTTP ${response.status}`)
  return (await response.json()) as Dataset
}

function describeScope(id: ScopeId, input: UserInput): { label: string; audience: string } {
  const uf = findUf(input.uf)
  const age = findAge(input.age)
  const pos = findPosition(input.position)
  switch (id) {
    case 'br':
      return { label: 'Brasil', audience: 'dos trabalhadores do Brasil' }
    case 'uf':
      return { label: uf.name, audience: `dos trabalhadores ${uf.prep} ${uf.name}` }
    case 'age':
      return { label: `${age.label} · Brasil`, audience: `dos trabalhadores ${age.audience} no Brasil` }
    case 'ufAge':
      return { label: `${age.label} · ${uf.code}`, audience: `dos trabalhadores ${age.audience} em ${uf.code}` }
    case 'pos':
      return { label: pos.short, audience: `${pos.audience} no Brasil` }
  }
}

export function computeResults(ds: Dataset, input: UserInput): ScopeResult[] {
  const keys = groupKeys(input.uf, input.age, input.position)
  const levels = ds.meta.percentiles
  return SCOPE_ORDER.map((id) => {
    const key = keys[id]
    const group = ds.groups[key]
    const { label, audience } = describeScope(id, input)
    if (!group) {
      return { id, key, label, audience, rank: null, imprecise: true, n: 0, levels, values: [] }
    }
    const values = adjust(group.p, ds.meta.ipca_factor)
    return {
      id, key, label, audience,
      rank: percentileRank(input.monthlyIncome, levels, values),
      imprecise: group.n < MIN_SAMPLE_SIZE,
      n: group.n,
      levels,
      values,
    }
  })
}

export function profileLine(input: UserInput): string {
  return `${input.uf} · ${findAge(input.age).label} anos · ${findPosition(input.position).short}`
}
