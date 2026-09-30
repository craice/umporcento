"""Universe selection and weighted percentiles per group."""

from collections.abc import Sequence

import numpy as np
import pandas as pd

from pipeline.constants import AGE_BANDS, LEVELS, POSITIONS, UF_CODES


def filter_universe(df: pd.DataFrame) -> pd.DataFrame:
    mask = (
        (df["VD4002"] == "1")
        & (df["V2009"] >= 18)
        & (df["VD4019"] > 0)
        & (df["VD4009"].isin(POSITIONS))
    )
    return df.loc[mask].copy()


def age_band(age: float) -> str | None:
    for band, low, high in AGE_BANDS:
        if low <= age <= high:
            return band
    return None


def weighted_percentiles(
    values: Sequence[float], weights: Sequence[float], levels: Sequence[float] = LEVELS
) -> list[float]:
    """Weighted percentiles using mid-point cumulative weights and linear interpolation."""
    v = np.asarray(values, dtype=float)
    w = np.asarray(weights, dtype=float)
    order = np.argsort(v, kind="stable")
    v, w = v[order], w[order]
    cumulative = np.cumsum(w)
    positions = (cumulative - w / 2) / cumulative[-1] * 100
    return [float(x) for x in np.interp(levels, positions, v)]


def _summary(sub: pd.DataFrame) -> dict:
    return {
        "n": int(len(sub)),
        "pop": int(round(float(sub["V1032"].sum()))),
        "p": [int(round(x)) for x in weighted_percentiles(sub["VD4019"], sub["V1032"])],
    }


def build_groups(universe: pd.DataFrame) -> dict[str, dict]:
    df = universe.assign(
        SIGLA=universe["UF"].map(UF_CODES),
        AGE=universe["V2009"].map(age_band),
    )
    groups: dict[str, dict] = {"BR": _summary(df)}
    for sigla, sub in df.groupby("SIGLA"):
        groups[f"UF:{sigla}"] = _summary(sub)
    for band, sub in df.groupby("AGE"):
        groups[f"AGE:{band}"] = _summary(sub)
    for (sigla, band), sub in df.groupby(["SIGLA", "AGE"]):
        groups[f"UF:{sigla}|AGE:{band}"] = _summary(sub)
    for pos, sub in df.groupby("VD4009"):
        groups[f"POS:{pos}"] = _summary(sub)
    return groups
