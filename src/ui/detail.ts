import { formatBRL, headline, valueAt } from '../calc'
import type { ScopeResult } from '../data'
import { renderCurveSvg } from './curve'

let lastFocus: HTMLElement | null = null

function close(root: HTMLElement, onKey: (e: KeyboardEvent) => void): void {
  document.removeEventListener('keydown', onKey)
  root.remove()
  document.body.classList.remove('has-sheet')
  lastFocus?.focus()
}

export function openDetail(scope: ScopeResult, income: number): void {
  if (scope.rank === null) return
  lastFocus = document.activeElement as HTMLElement | null
  const h = headline(scope.rank)
  const median = valueAt(50, scope.levels, scope.values)
  const p90 = valueAt(90, scope.levels, scope.values)
  const p99 = valueAt(99, scope.levels, scope.values)
  const warn = scope.imprecise
    ? `<p class="sheet__warn">Estimativa imprecisa: esta combinação tem poucas pessoas na amostra da PNAD (${scope.n}).</p>`
    : ''

  const root = document.createElement('div')
  root.className = 'sheet-root'
  root.innerHTML = `
    <div class="sheet-backdrop" data-close></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
      <button type="button" class="sheet__close" aria-label="Fechar" data-close>×</button>
      <p class="sheet__eyebrow">${scope.label}</p>
      <h2 id="sheet-title" class="sheet__title">${h.lead} <b>${h.num}%</b> ${scope.audience}.</h2>
      <figure class="curve">
        ${renderCurveSvg(scope, income)}
        <figcaption class="sr-only">Distribuição de renda ${scope.audience}. A mediana é ${formatBRL(median)}. Sua renda fica acima de ${h.num}% dessas pessoas.</figcaption>
      </figure>
      <dl class="refs">
        <div class="refs__item"><dt>Mediana</dt><dd>${formatBRL(median)}</dd></div>
        <div class="refs__item"><dt>Entrada do top 10%</dt><dd>${formatBRL(p90)}</dd></div>
        <div class="refs__item"><dt>Entrada do top 1%</dt><dd>${formatBRL(p99)}</dd></div>
      </dl>
      <p class="sheet__context">Metade ${scope.audience} ganha até ${formatBRL(median)} por mês.</p>
      ${warn}
    </div>`

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close(root, onKey)
    if (e.key === 'Tab') {
      e.preventDefault()
      root.querySelector<HTMLElement>('.sheet__close')!.focus()
    }
  }
  root.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', () => close(root, onKey)))
  document.addEventListener('keydown', onKey)
  document.body.appendChild(root)
  document.body.classList.add('has-sheet')
  root.querySelector<HTMLElement>('.sheet__close')!.focus()
}
