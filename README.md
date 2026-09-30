# umporcento

**Onde você está na renda do Brasil?** Informe sua renda bruta do trabalho, estado, faixa de idade e posição na ocupação e veja em que percentil você está entre as pessoas que trabalham no Brasil, no seu estado, na sua faixa de idade, na sua faixa de idade no seu estado e na sua posição na ocupação.

👉 https://craice.github.io/umporcento/

## Privacidade

Nenhum dado sai do seu navegador. O cálculo acontece no seu aparelho, a partir de uma tabela de percentis pública que é baixada junto com o site. Não há cookies, analytics, armazenamento local nem serviços de terceiros, e as fontes também são servidas pelo próprio site. Uma política de segurança de conteúdo (CSP) bloqueia no navegador qualquer requisição para fora do site.

## Metodologia

- **Fonte:** PNAD Contínua anual, 1ª visita (IBGE), ano mais recente disponível.
- **Renda:** rendimento mensal habitual de todos os trabalhos (variável `VD4019`), bruto.
- **Universo:** pessoas ocupadas, com 18 anos ou mais e renda maior que zero, ponderadas pelo peso amostral calibrado (`V1032`).
- **Recortes:** Brasil, UF, faixa etária (18–24, 25–34, 35–44, 45–54, 55–64, 65+), faixa etária × UF e posição na ocupação (`VD4009`).
- **Percentis:** p1 a p99 e p99,1 a p99,9 por recorte. A posição da pessoa é interpolada entre percentis vizinhos.
- **Renda anual:** dividida por 13,33 para posições com carteira ou servidor estatutário e por 12 nas demais.
- **Correção monetária:** IPCA (série 433 do Banco Central) acumulado de julho do ano dos dados até o último mês disponível na geração. A faixa de quem ganha exatamente o salário mínimo é levada ao salário mínimo atual.
- **Validação:** a renda média por UF calculada pelo pipeline é comparada com a tabela 4660 do SIDRA/IBGE. Diferenças acima de 2% interrompem a geração.
- **Limitações:** pesquisas domiciliares subestimam rendas muito altas. Recortes com menos de 100 pessoas na amostra são marcados como "estimativa imprecisa".

## Como rodar o site

Requer Node 20+.

```bash
npm install
npm run dev      # servidor local
npm test         # testes
npm run build    # gera dist/
```

## Como atualizar os dados

Requer Python 3.12+. O pipeline baixa os microdados do IBGE (algumas centenas de MB), valida, calcula e grava `public/data/percentiles.json`.

```bash
python3 -m venv .venv && . .venv/bin/activate
pip install -r pipeline/requirements.txt
python -m pytest pipeline        # testes
python -m pipeline.build         # ano mais recente
python -m pipeline.build --year 2024
```

Depois, faça commit do JSON gerado. O deploy não roda o pipeline.

**Todo mês de janeiro**, adicione o novo salário mínimo em `MIN_WAGE` (`src/config.ts`). Na correção pelo IPCA, quem ganhava exatamente o mínimo do ano dos dados passa a valer o mínimo atual, porque o mínimo é reajustado por lei e não pelo IPCA.

## Deploy

Todo push na `main` roda os testes e publica no GitHub Pages (`.github/workflows/deploy.yml`).

## Licença

Código sob licença MIT. Os microdados da PNAD Contínua são públicos e produzidos pelo IBGE. A fonte Londrina Solid é distribuída sob a SIL Open Font License.
