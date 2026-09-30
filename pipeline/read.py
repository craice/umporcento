"""Reads PNAD fixed-width microdata using the official SAS input dictionary."""

import re
from dataclasses import dataclass
from pathlib import Path

import pandas as pd

from pipeline.constants import COLUMNS

_SAS_LINE = re.compile(r"^@(\d+)\s+(\w+)\s+\$?(\d+)\.")
_STRING_COLUMNS = {"UF", "VD4002", "VD4009"}


@dataclass(frozen=True)
class ColumnSpec:
    name: str
    start: int  # 1-based, as in the SAS dictionary
    width: int


def parse_sas_input(text: str) -> dict[str, ColumnSpec]:
    specs: dict[str, ColumnSpec] = {}
    for line in text.splitlines():
        match = _SAS_LINE.match(line.strip())
        if match:
            start, name, width = int(match.group(1)), match.group(2), int(match.group(3))
            specs[name] = ColumnSpec(name, start, width)
    return specs


def read_microdata(path: Path, input_text: str, columns: list[str] = COLUMNS) -> pd.DataFrame:
    specs = parse_sas_input(input_text)
    missing = [c for c in columns if c not in specs]
    if missing:
        raise KeyError(f"Columns not found in SAS input: {missing}")
    colspecs = [(specs[c].start - 1, specs[c].start - 1 + specs[c].width) for c in columns]
    df = pd.read_fwf(
        path,
        colspecs=colspecs,
        names=columns,
        dtype=str,
        encoding="latin-1",
        compression="infer",
    )
    for col in columns:
        if col in _STRING_COLUMNS:
            df[col] = df[col].fillna("").str.strip()
        else:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    return df
