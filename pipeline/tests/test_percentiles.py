import pandas as pd
import pytest

from pipeline.percentiles import age_band, build_groups, filter_universe, weighted_percentiles


def frame(rows):
    return pd.DataFrame(rows, columns=["UF", "V2009", "VD4002", "VD4009", "VD4019", "V1032"])


def test_weighted_percentiles_equal_weights_hand_computed():
    # positions: 12.5, 37.5, 62.5, 87.5
    result = weighted_percentiles([4, 1, 3, 2], [1, 1, 1, 1], levels=[1, 25, 50, 99])
    assert result == pytest.approx([1.0, 1.5, 2.5, 4.0])


def test_weighted_percentiles_respects_weights():
    # value 10 weight 3 -> pos 37.5; value 20 weight 1 -> pos 87.5
    result = weighted_percentiles([10, 20], [3, 1], levels=[25, 50, 87.5])
    assert result == pytest.approx([10.0, 12.5, 20.0])


def test_age_band_edges():
    assert age_band(17) is None
    assert age_band(18) == "18-24"
    assert age_band(24) == "18-24"
    assert age_band(25) == "25-34"
    assert age_band(64) == "55-64"
    assert age_band(65) == "65+"
    assert age_band(101) == "65+"


def test_filter_universe_rules():
    df = frame([
        ["35", 30, "1", "01", 3000, 1],   # kept
        ["35", 17, "1", "01", 3000, 1],   # under 18
        ["35", 30, "2", "01", 3000, 1],   # not employed
        ["35", 30, "1", "10", 3000, 1],   # unpaid family worker
        ["35", 30, "1", "01", 0, 1],      # zero income
        ["35", 30, "1", "01", None, 1],   # missing income
    ])
    out = filter_universe(df)
    assert len(out) == 1


def test_build_groups_keys_and_payload():
    df = frame([
        ["35", 30, "1", "01", 1000, 2],
        ["35", 40, "1", "09", 3000, 1],
        ["29", 30, "1", "07", 5000, 1],
    ])
    groups = build_groups(filter_universe(df))
    assert set(groups) == {
        "BR",
        "UF:SP", "UF:BA",
        "AGE:25-34", "AGE:35-44",
        "UF:SP|AGE:25-34", "UF:SP|AGE:35-44", "UF:BA|AGE:25-34",
        "POS:01", "POS:09", "POS:07",
    }
    br = groups["BR"]
    assert br["n"] == 3
    assert br["pop"] == 4
    assert len(br["p"]) == 108
    assert all(isinstance(v, int) for v in br["p"])
    assert br["p"] == sorted(br["p"])
    assert groups["UF:BA"]["p"][0] == 5000
