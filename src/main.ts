import '@fontsource/londrina-solid/400.css'
import '@fontsource/londrina-solid/900.css'
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

  const form = renderForm(formRoot, (input) => {
    renderResult(resultRoot, { input, results: computeResults(ds, input), meta: ds.meta }, {
      onReset: () => {
        form.reset()
        formRoot.scrollIntoView({ behavior: 'smooth' })
      },
    })
    resultRoot.scrollIntoView({ behavior: 'smooth' })
  })
}

void main()
