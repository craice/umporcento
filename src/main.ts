import '@fontsource/carter-one/latin-400.css'
import '@fontsource/nunito/latin-400.css'
import '@fontsource/nunito/latin-700.css'
import '@fontsource/nunito/latin-800.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/poster.css'
import './styles/sheet.css'
import { computeResults, loadDataset } from './data'
import { renderForm } from './ui/form'
import { renderResult } from './ui/result'
import { renderFooter } from './ui/footer'

async function main(): Promise<void> {
  const formRoot = document.getElementById('form')!
  const resultRoot = document.getElementById('result')!

  let dataset
  try {
    dataset = await loadDataset()
  } catch {
    formRoot.innerHTML = '<p class="poster">Não foi possível carregar os dados. Recarregue a página.</p>'
    return
  }
  const ds = dataset
  renderFooter(document.getElementById('footer')!, ds.meta)

  // The form and the result are never shown together: submitting swaps to the result, "Refazer" swaps back.
  const form = renderForm(formRoot, (input) => {
    renderResult(resultRoot, { input, results: computeResults(ds, input), meta: ds.meta }, {
      onReset: () => {
        formRoot.hidden = false
        window.scrollTo({ top: 0 })
        form.reset()
      },
    })
    formRoot.hidden = true
    window.scrollTo({ top: 0 })
    resultRoot.querySelector<HTMLElement>('.hero')?.focus()
  })
}

void main()
