"""IPCA correction from the middle of the data year to the latest available month (BCB SGS 433)."""

from datetime import date

import requests

SGS_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados"


def accumulated_factor(series: list[dict]) -> tuple[float, str | None]:
    if not series:
        return 1.0, None
    factor = 1.0
    for item in series:
        factor *= 1 + float(item["valor"]) / 100
    _, month, year = series[-1]["data"].split("/")
    return factor, f"{year}-{month}"


def fetch_ipca(data_year: int, today: date | None = None) -> list[dict]:
    today = today or date.today()
    params = {
        "formato": "json",
        "dataInicial": f"01/07/{data_year}",
        "dataFinal": today.strftime("%d/%m/%Y"),
    }
    response = requests.get(SGS_URL, params=params, timeout=60)
    response.raise_for_status()
    return response.json()
