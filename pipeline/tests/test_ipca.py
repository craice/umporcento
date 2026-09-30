import pytest

from pipeline.ipca import accumulated_factor


def test_accumulated_factor_compounds_monthly_rates():
    series = [
        {"data": "01/07/2025", "valor": "0.26"},
        {"data": "01/08/2025", "valor": "-0.11"},
        {"data": "01/09/2025", "valor": "0.48"},
    ]
    factor, ref = accumulated_factor(series)
    assert factor == pytest.approx(1.0026 * 0.9989 * 1.0048)
    assert ref == "2025-09"


def test_accumulated_factor_empty_series_is_neutral():
    assert accumulated_factor([]) == (1.0, None)
