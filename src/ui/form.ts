import { parseBRL, toMonthly, type Period } from '../calc'
import type { UserInput } from '../data'
import { AGE_BANDS, POSITIONS, UFS, type AgeBand, type PositionCode } from '../groups'

export interface RawForm { income: string; period: Period; uf: string; age: string; position: string }
export type Field = 'income' | 'uf' | 'age' | 'position'
export type Validation =
  | { ok: true; input: UserInput }
  | { ok: false; errors: Partial<Record<Field, string>> }

export const MAX_MONTHLY_INCOME = 10_000_000

export function validateForm(raw: RawForm): Validation {
  const errors: Partial<Record<Field, string>> = {}
  const position = POSITIONS.find((p) => p.code === raw.position)
  if (!UFS.some((u) => u.code === raw.uf)) errors.uf = 'Escolha seu estado.'
  if (!AGE_BANDS.some((a) => a.id === raw.age)) errors.age = 'Escolha sua faixa de idade.'
  if (!position) errors.position = 'Escolha sua posição na ocupação.'

  const amount = parseBRL(raw.income)
  let monthly = 0
  if (amount === null || amount <= 0) {
    errors.income = 'Informe sua renda bruta, maior que zero.'
  } else {
    monthly = toMonthly(amount, raw.period, position?.annualDivisor ?? 12)
    if (monthly > MAX_MONTHLY_INCOME) errors.income = 'Valor muito alto. Confira se digitou certo.'
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return {
    ok: true,
    input: { monthlyIncome: monthly, uf: raw.uf, age: raw.age as AgeBand, position: raw.position as PositionCode },
  }
}

const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

function template(): string {
  const ufOptions = UFS.map((u) => `<option value="${u.code}">${u.name}</option>`).join('')
  const ageChips = AGE_BANDS.map(
    (a) => `<label class="chip"><input type="radio" name="age" value="${a.id}" /><span>${a.label}</span></label>`,
  ).join('')
  const posOptions = POSITIONS.map((p) => `<option value="${p.code}">${p.label}</option>`).join('')
  return `
  <form class="poster poster--form" novalidate>
    <div class="poster__top"><span>umporcento</span><b class="stamp">PNAD · IBGE</b></div>
    <h1 class="poster__title">Onde você está<br />na renda do Brasil?</h1>

    <div class="field" data-field="income">
      <label for="income" class="field__label">Renda bruta do trabalho</label>
      <div class="money">
        <span class="money__prefix" aria-hidden="true">R$</span>
        <input id="income" name="income" type="text" inputmode="decimal" autocomplete="off" placeholder="0" aria-describedby="income-help income-error" />
      </div>
      <div class="period" role="radiogroup" aria-label="Período">
        <label class="chip"><input type="radio" name="period" value="month" checked /><span>por mês</span></label>
        <label class="chip"><input type="radio" name="period" value="year" /><span>por ano</span></label>
      </div>
      <p id="income-help" class="field__help">Valor bruto, antes de descontos, somando todos os trabalhos.</p>
      <p id="income-error" class="field__error" role="alert"></p>
    </div>

    <div class="field" data-field="uf">
      <label for="uf" class="field__label">Estado</label>
      <select id="uf" name="uf" aria-describedby="uf-error"><option value="">Escolha…</option>${ufOptions}</select>
      <p id="uf-error" class="field__error" role="alert"></p>
    </div>

    <fieldset class="field" data-field="age">
      <legend class="field__label">Faixa de idade</legend>
      <div class="chips">${ageChips}</div>
      <p class="field__error" role="alert"></p>
    </fieldset>

    <div class="field" data-field="position">
      <label for="position" class="field__label">Posição na ocupação</label>
      <select id="position" name="position" aria-describedby="position-hint position-error"><option value="">Escolha…</option>${posOptions}</select>
      <p id="position-hint" class="field__help"></p>
      <p id="position-error" class="field__error" role="alert"></p>
    </div>

    <button type="submit" class="btn btn--primary btn--block">Ver minha posição</button>
  </form>`
}

export function renderForm(root: HTMLElement, onSubmit: (input: UserInput) => void): { reset(): void } {
  root.innerHTML = template()
  const form = root.querySelector('form')!
  const income = form.querySelector<HTMLInputElement>('#income')!
  const position = form.querySelector<HTMLSelectElement>('#position')!
  const hint = form.querySelector<HTMLElement>('#position-hint')!

  position.addEventListener('change', () => {
    hint.textContent = POSITIONS.find((p) => p.code === position.value)?.hint ?? ''
  })

  income.addEventListener('blur', () => {
    const n = parseBRL(income.value)
    if (n !== null && n > 0) income.value = decimal.format(n)
  })

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const data = new FormData(form)
    const result = validateForm({
      income: String(data.get('income') ?? ''),
      period: (data.get('period') as Period) ?? 'month',
      uf: String(data.get('uf') ?? ''),
      age: String(data.get('age') ?? ''),
      position: String(data.get('position') ?? ''),
    })
    form.querySelectorAll<HTMLElement>('[data-field]').forEach((el) => {
      const field = el.dataset.field as Field
      const message = result.ok ? '' : (result.errors[field] ?? '')
      el.classList.toggle('field--invalid', message !== '')
      el.querySelector('.field__error')!.textContent = message
    })
    if (result.ok) onSubmit(result.input)
    else form.querySelector<HTMLElement>('.field--invalid input, .field--invalid select')?.focus()
  })

  return {
    reset() {
      form.reset()
      hint.textContent = ''
      form.querySelectorAll('.field__error').forEach((el) => (el.textContent = ''))
      form.querySelectorAll('.field--invalid').forEach((el) => el.classList.remove('field--invalid'))
      income.focus()
    },
  }
}
