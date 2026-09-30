export const SITE_URL = 'https://craice.github.io/umporcento/'
export const SITE_LABEL = 'craice.github.io/umporcento'
export const REPO_URL = 'https://github.com/craice/umporcento'
export const MIN_SAMPLE_SIZE = 100
export const DATA_URL = `${import.meta.env.BASE_URL}data/percentiles.json`

// Monthly minimum wage by year (R$). Used to keep the minimum-wage plateau aligned when values are
// brought forward by IPCA. Add the new year's value every January.
export const MIN_WAGE: Record<number, number> = {
  2023: 1320,
  2024: 1412,
  2025: 1518,
  2026: 1621,
}
