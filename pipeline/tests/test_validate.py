import pandas as pd
import pytest

from pipeline.validate import compare, computed_means, parse_sidra


def test_computed_means_uses_14_plus_employed_with_income_weighted():
    df = pd.DataFrame(
        [
            ["35", 30, "1", "01", 1000, 3],
            ["35", 15, "1", "02", 4000, 1],   # 14+ counts for validation
            ["35", 13, "1", "02", 9999, 1],   # under 14 excluded
            ["35", 30, "2", "01", 9999, 1],   # not employed excluded
            ["35", 30, "1", "01", 0, 1],      # zero income excluded
        ],
        columns=["UF", "V2009", "VD4002", "VD4009", "VD4019", "V1032"],
    )
    assert computed_means(df) == {"SP": pytest.approx(1750.0)}


def test_parse_sidra_skips_header_and_maps_codes():
    payload = [
        {"D1C": "Unidade da Federação (Código)", "V": "Valor"},
        {"D1C": "35", "V": "4183"},
        {"D1C": "29", "V": "2100"},
    ]
    assert parse_sidra(payload) == {"SP": 4183.0, "BA": 2100.0}


def test_compare_flags_out_of_tolerance_and_missing():
    errors = compare({"SP": 4300.0, "BA": 2100.0}, {"SP": 4183.0, "BA": 2101.0, "RJ": 3900.0}, min_ufs=3)
    assert len(errors) == 2
    assert any("SP" in e for e in errors)
    assert any("RJ" in e for e in errors)


def test_compare_ok_within_tolerance():
    assert compare({"SP": 4200.0}, {"SP": 4183.0}, min_ufs=1) == []


def test_compare_fails_when_official_data_is_incomplete():
    errors = compare({"SP": 4183.0}, {"SP": 4183.0})
    assert errors and "official" in errors[0]


def test_compare_fails_when_official_data_is_empty():
    assert compare({"SP": 4183.0}, {}) != []
