import pytest

from pipeline.download import latest_file

DATA_INDEX = """
<a href="PNADC_2012_visita1_20250822.zip">x</a>
<a href="PNADC_2024_visita1_20251119.zip">x</a>
<a href="PNADC_2025_visita1_20260923.zip">x</a>
<a href="?C=N;O=D">sort</a>
"""

DOC_INDEX = """
<a href="dicionario_PNADC_microdados_2025_visita1_20260923.xls">x</a>
<a href="input_PNADC_2012_a_2014_visita1_20220224.txt">x</a>
<a href="input_PNADC_2024_visita1_20251119.txt">x</a>
<a href="input_PNADC_2025_visita1_20260923.txt">x</a>
"""


def test_latest_data_file():
    assert latest_file(DATA_INDEX, "data") == (2025, "PNADC_2025_visita1_20260923.zip")


def test_latest_input_file():
    assert latest_file(DOC_INDEX, "input") == (2025, "input_PNADC_2025_visita1_20260923.txt")


def test_specific_year():
    assert latest_file(DATA_INDEX, "data", year=2024) == (2024, "PNADC_2024_visita1_20251119.zip")


def test_missing_year_raises():
    with pytest.raises(LookupError):
        latest_file(DATA_INDEX, "data", year=2020)


def test_empty_index_raises():
    with pytest.raises(LookupError):
        latest_file("<html></html>", "data")
