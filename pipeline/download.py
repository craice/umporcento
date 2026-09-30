"""Locates and downloads PNAD Contínua annual (1st visit) files from the IBGE FTP."""

import re
from pathlib import Path
from typing import Literal

import requests

BASE_URL = (
    "https://ftp.ibge.gov.br/Trabalho_e_Rendimento/"
    "Pesquisa_Nacional_por_Amostra_de_Domicilios_continua/Anual/Microdados/Visita/Visita_1"
)

_PATTERNS = {
    "data": re.compile(r'href="(PNADC_(\d{4})_visita1_\d{8}\.zip)"'),
    "input": re.compile(r'href="(input_PNADC_(\d{4})_visita1_\d{8}\.txt)"'),
}


def latest_file(
    index_html: str, kind: Literal["data", "input"], year: int | None = None
) -> tuple[int, str]:
    found = {int(y): name for name, y in _PATTERNS[kind].findall(index_html)}
    if not found:
        raise LookupError(f"No {kind} files found in index")
    chosen = year if year is not None else max(found)
    if chosen not in found:
        raise LookupError(f"No {kind} file for year {chosen}; available: {sorted(found)}")
    return chosen, found[chosen]


def _get_text(url: str) -> str:
    response = requests.get(url, timeout=60)
    response.raise_for_status()
    return response.text


def _fetch(url: str, dest: Path) -> Path:
    if dest.exists() and dest.stat().st_size > 0:
        return dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".part")
    with requests.get(url, stream=True, timeout=600) as response:
        response.raise_for_status()
        with open(tmp, "wb") as fh:
            for chunk in response.iter_content(chunk_size=1 << 20):
                fh.write(chunk)
    tmp.rename(dest)
    return dest


def download_latest(cache_dir: Path, year: int | None = None) -> tuple[int, Path, str]:
    data_year, data_name = latest_file(_get_text(f"{BASE_URL}/Dados/"), "data", year)
    _, input_name = latest_file(_get_text(f"{BASE_URL}/Documentacao/"), "input", data_year)
    zip_path = _fetch(f"{BASE_URL}/Dados/{data_name}", cache_dir / data_name)
    input_path = _fetch(f"{BASE_URL}/Documentacao/{input_name}", cache_dir / input_name)
    return data_year, zip_path, input_path.read_text(encoding="latin-1")
