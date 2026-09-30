"""Shared constants for the PNAD pipeline. Keep in sync with src/groups.ts."""

LEVELS: list[float] = [float(i) for i in range(1, 100)] + [round(99 + i / 10, 1) for i in range(1, 10)]

AGE_BANDS: list[tuple[str, int, int]] = [
    ("18-24", 18, 24),
    ("25-34", 25, 34),
    ("35-44", 35, 44),
    ("45-54", 45, 54),
    ("55-64", 55, 64),
    ("65+", 65, 200),
]

UF_CODES: dict[str, str] = {
    "11": "RO", "12": "AC", "13": "AM", "14": "RR", "15": "PA", "16": "AP", "17": "TO",
    "21": "MA", "22": "PI", "23": "CE", "24": "RN", "25": "PB", "26": "PE", "27": "AL",
    "28": "SE", "29": "BA", "31": "MG", "32": "ES", "33": "RJ", "35": "SP", "41": "PR",
    "42": "SC", "43": "RS", "50": "MS", "51": "MT", "52": "GO", "53": "DF",
}

# VD4009 codes with income. "10" (unpaid family worker) is excluded.
POSITIONS: list[str] = ["01", "02", "03", "04", "05", "06", "07", "08", "09"]

COLUMNS: list[str] = ["UF", "V2009", "VD4002", "VD4009", "VD4019", "V1032"]
