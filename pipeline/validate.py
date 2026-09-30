"""Checks computed mean income by UF against IBGE's published SIDRA table 4660 (variable 5929)."""

import pandas as pd
import requests

from pipeline.constants import UF_CODES

SIDRA_URL = "https://apisidra.ibge.gov.br/values/t/4660/n3/all/v/5929/p/{year}"


def computed_means(df: pd.DataFrame) -> dict[str, float]:
    sub = df[(df["VD4002"] == "1") & (df["V2009"] >= 14) & (df["VD4019"] > 0)]
    sub = sub.assign(SIGLA=sub["UF"].map(UF_CODES), WX=sub["VD4019"] * sub["V1032"])
    grouped = sub.groupby("SIGLA")[["WX", "V1032"]].sum()
    return {str(s): float(r.WX / r.V1032) for s, r in grouped.iterrows()}


def parse_sidra(payload: list[dict]) -> dict[str, float]:
    result: dict[str, float] = {}
    for item in payload[1:]:
        sigla = UF_CODES.get(item["D1C"])
        if sigla and item["V"] not in ("-", "...", "X"):
            result[sigla] = float(item["V"])
    return result


def official_means(year: int) -> dict[str, float]:
    response = requests.get(SIDRA_URL.format(year=year), timeout=60)
    response.raise_for_status()
    return parse_sidra(response.json())


def compare(
    computed: dict[str, float], official: dict[str, float], tolerance: float = 0.02
) -> list[str]:
    errors: list[str] = []
    for sigla, expected in sorted(official.items()):
        got = computed.get(sigla)
        if got is None:
            errors.append(f"{sigla}: missing in computed data")
            continue
        diff = abs(got - expected) / expected
        if diff > tolerance:
            errors.append(f"{sigla}: computed {got:.0f} vs official {expected:.0f} ({diff:.1%})")
    return errors
