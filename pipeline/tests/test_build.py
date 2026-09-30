from pipeline.build import make_payload
from pipeline.constants import LEVELS


def test_make_payload_structure():
    groups = {"BR": {"n": 3, "pop": 4, "p": [1] * 108}}
    payload = make_payload(groups, 2025, 1.0567891, "2026-08", "2026-09-29T12:00:00Z")
    assert payload["meta"] == {
        "year": 2025,
        "source": "PNAD Contínua anual – 1ª visita (IBGE)",
        "ipca_factor": 1.056789,
        "ipca_ref": "2026-08",
        "generated_at": "2026-09-29T12:00:00Z",
        "percentiles": LEVELS,
    }
    assert payload["groups"] is groups
