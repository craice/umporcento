from pathlib import Path

import math

from pipeline.constants import LEVELS, UF_CODES
from pipeline.read import ColumnSpec, parse_sas_input, read_microdata

SAS = """/* PROGRAMA DE LEITURA */
data pnadc;
input
@0001 Ano   $4.   /* Ano de referência */
@0005 UF   $2.   /* Unidade da Federação */
@0007 V2009   3.   /* Idade */
@0010 VD4002   $1.   /* Condição de ocupação */
@0011 VD4009   $2.   /* Posição na ocupação */
@0013 VD4019   8.   /* Rendim. habitual */
@0021 V1032   15.   /* Peso COM calibração */
;
run;
"""


def row(uf: str, age: str, occ: str, pos: str, income: str, weight: str) -> str:
    return f"2025{uf:>2}{age:>3}{occ:>1}{pos:>2}{income:>8}{weight:>15}"


def test_constants_shape():
    assert len(LEVELS) == 108
    assert LEVELS[0] == 1.0 and LEVELS[98] == 99.0 and LEVELS[-1] == 99.9
    assert len(UF_CODES) == 27


def test_parse_sas_input_reads_positions_and_widths():
    specs = parse_sas_input(SAS)
    assert specs["UF"] == ColumnSpec("UF", 5, 2)
    assert specs["VD4019"] == ColumnSpec("VD4019", 13, 8)
    assert specs["V1032"] == ColumnSpec("V1032", 21, 15)
    assert "run" not in specs


def test_read_microdata_types_and_blanks(tmp_path: Path):
    data = tmp_path / "data.txt"
    data.write_text(
        "\n".join([
            row("35", "40", "1", "01", "5000", "1234.5"),
            row("29", " 17", "1", "09", "", "10"),
            row("53", "70", "2", "", "", "7"),
        ]) + "\n",
        encoding="latin-1",
    )
    df = read_microdata(data, SAS)
    assert list(df.columns) == ["UF", "V2009", "VD4002", "VD4009", "VD4019", "V1032"]
    assert df.loc[0, "UF"] == "35"
    assert df.loc[0, "VD4009"] == "01"
    assert df.loc[0, "V2009"] == 40
    assert df.loc[0, "VD4019"] == 5000
    assert df.loc[0, "V1032"] == 1234.5
    assert math.isnan(df.loc[1, "VD4019"])
    assert df.loc[2, "VD4002"] == "2"


def test_read_microdata_missing_column_raises(tmp_path: Path):
    data = tmp_path / "data.txt"
    data.write_text(row("35", "40", "1", "01", "5000", "1") + "\n", encoding="latin-1")
    try:
        read_microdata(data, SAS, columns=["UF", "NOPE"])
    except KeyError as exc:
        assert "NOPE" in str(exc)
    else:
        raise AssertionError("expected KeyError")
