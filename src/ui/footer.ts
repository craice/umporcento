import { MIN_SAMPLE_SIZE, REPO_URL } from '../config'
import type { Meta } from '../data'

function monthYear(ref: string | null): string {
  if (!ref) return ''
  const [year, month] = ref.split('-').map(Number)
  const name = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(year, month - 1, 1))
  return `${name.replace('.', '')}/${year}`
}

export function renderFooter(root: HTMLElement, meta: Meta): void {
  const ipca = meta.ipca_ref ? `Valores corrigidos pelo IPCA até ${monthYear(meta.ipca_ref)}.` : ''
  root.innerHTML = `
  <div class="footer">
    <p><b>Nenhum dado sai do seu navegador.</b> O cálculo acontece no seu aparelho; o site não usa cookies, analytics nem serviços de terceiros.</p>
    <p>Fonte: ${meta.source}, ${meta.year}. ${ipca}</p>
    <details class="method">
      <summary>Como calculamos</summary>
      <p>Comparamos sua renda bruta mensal com a <b>renda habitual de todos os trabalhos</b> de pessoas ocupadas com 18 anos ou mais e renda maior que zero, usando os pesos amostrais da PNAD Contínua (IBGE).</p>
      <p>Para cada recorte calculamos os percentis da distribuição. Sua posição é a parcela de pessoas que ganha menos que você, por interpolação entre percentis vizinhos.</p>
      <p>Se você informar a renda anual, dividimos por 13,33 para quem tem carteira ou é servidor estatutário (salário, 13º e 1/3 de férias) e por 12 nos demais casos.</p>
      <p>Os valores de ${meta.year} foram corrigidos pela inflação (IPCA). Isso assume que a renda real ficou estável desde então.</p>
      <p><b>Limitações:</b> pesquisas domiciliares captam mal as rendas muito altas, então o topo da distribuição é subestimado. Recortes com menos de ${MIN_SAMPLE_SIZE} pessoas na amostra aparecem como "estimativa imprecisa".</p>
    </details>
    <p class="footer__small">Como qualquer site, a hospedagem (GitHub Pages) registra acessos em seus servidores. O umporcento não recebe nem guarda nenhum dado.</p>
    <p class="footer__small">Código aberto: <a href="${REPO_URL}" rel="noopener">${REPO_URL.replace('https://', '')}</a></p>
  </div>`
}
