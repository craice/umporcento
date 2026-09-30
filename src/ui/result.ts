import { formatPercent, headline } from '../calc'
import type { Meta, ScopeResult, UserInput } from '../data'
import { profileLine } from '../data'
import { browserShareEnv, createCardCache, renderCardBlob, shareOrDownload, type CardData } from './card'
import { openDetail } from './detail'
import { SITE_URL } from '../config'

function tagHtml(r: ScopeResult): string {
  if (r.rank === null) {
    return `<button type="button" class="tag" disabled><span class="tag__label">${r.label}</span><span class="tag__value tag__value--none">sem dados suficientes</span></button>`
  }
  const width = Math.min(100, Math.max(0, r.rank)).toFixed(1)
  const badge = r.imprecise ? '<span class="tag__badge">estimativa imprecisa</span>' : ''
  return `
    <button type="button" class="tag" data-scope="${r.id}" aria-label="${r.label}: ${formatPercent(r.rank)}. Ver detalhes">
      <span class="tag__label">${r.label}</span>
      <span class="tag__value">${formatPercent(r.rank)}</span>
      <span class="mini" aria-hidden="true"><i style="width:${width}%"></i></span>
      ${badge}
    </button>`
}

function cardData(input: UserInput, results: ScopeResult[], meta: Meta): CardData {
  const br = results[0]
  const h = headline(br.rank ?? 0)
  return {
    lead: h.lead,
    num: h.num,
    tail: 'do Brasil que trabalha',
    tags: results.slice(1).map((r) => ({
      label: r.label,
      value: r.rank === null ? '—' : formatPercent(r.rank),
      imprecise: r.imprecise && r.rank !== null,
    })),
    profile: profileLine(input),
    source: `Dados: PNAD Contínua ${meta.year} · IBGE`,
  }
}

export function renderResult(
  root: HTMLElement,
  ctx: { input: UserInput; results: ScopeResult[]; meta: Meta },
  handlers: { onReset(): void },
): void {
  const { input, results, meta } = ctx
  const br = results[0]
  const h = headline(br.rank ?? 0)
  root.innerHTML = `
  <article class="poster poster--result">
    <div class="poster__top"><span>sua posição</span><b class="stamp">PNAD ${meta.year}</b></div>
    <button type="button" class="hero" data-scope="br" aria-label="${h.lead} ${h.num}% do Brasil que trabalha. Ver detalhes">
      <span class="hero__lead">${h.lead}</span>
      <span class="hero__num${h.num.length > 2 ? ' hero__num--long' : ''}">${h.num}<span class="hero__pct">%</span></span>
      <span class="hero__tail">do Brasil que trabalha</span>
    </button>
    <div class="tags">${results.slice(1).map(tagHtml).join('')}</div>
    <p class="result__hint">Toque em um recorte para ver a distribuição.</p>
    <div class="actions">
      <button type="button" class="btn btn--primary btn--block" data-action="share">Compartilhar cartaz</button>
      <p class="share-status" role="status"></p>
      <button type="button" class="btn btn--block" data-action="reset">Refazer</button>
    </div>
  </article>`

  root.querySelectorAll<HTMLElement>('[data-scope]').forEach((el) =>
    el.addEventListener('click', () => {
      const scope = results.find((r) => r.id === el.dataset.scope)
      if (scope) openDetail(scope, input.monthlyIncome)
    }),
  )

  const status = root.querySelector<HTMLElement>('.share-status')!
  const shareBtn = root.querySelector<HTMLButtonElement>('[data-action="share"]')!
  const cards = createCardCache(() => renderCardBlob(cardData(input, results, meta)))
  cards.get().catch(() => {})
  shareBtn.addEventListener('click', async () => {
    shareBtn.disabled = true
    status.textContent = 'Gerando cartaz…'
    try {
      const blob = await cards.get()
      const outcome = await shareOrDownload(blob, browserShareEnv())
      if (outcome === 'downloaded') {
        status.innerHTML = 'Cartaz baixado. <button type="button" class="linkish" data-copy>Copiar link do site</button>'
        status.querySelector('[data-copy]')?.addEventListener('click', async () => {
          await navigator.clipboard.writeText(SITE_URL)
          status.textContent = 'Link copiado.'
        })
      } else {
        status.textContent = ''
      }
    } catch {
      status.textContent = 'Não foi possível gerar o cartaz neste navegador.'
    } finally {
      shareBtn.disabled = false
    }
  })

  root.querySelector('[data-action="reset"]')!.addEventListener('click', () => {
    root.innerHTML = ''
    handlers.onReset()
  })
}
