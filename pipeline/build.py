"""Builds public/data/percentiles.json from the latest PNAD annual microdata."""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from pipeline.constants import LEVELS
from pipeline.download import download_latest
from pipeline.ipca import accumulated_factor, fetch_ipca
from pipeline.percentiles import build_groups, filter_universe
from pipeline.read import read_microdata
from pipeline.validate import compare, computed_means, official_means

SOURCE = "PNAD Contínua anual – 1ª visita (IBGE)"


def make_payload(
    groups: dict, year: int, factor: float, ipca_ref: str | None, generated_at: str
) -> dict:
    return {
        "meta": {
            "year": year,
            "source": SOURCE,
            "ipca_factor": round(factor, 6),
            "ipca_ref": ipca_ref,
            "generated_at": generated_at,
            "percentiles": LEVELS,
        },
        "groups": groups,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--year", type=int, default=None)
    parser.add_argument("--cache", type=Path, default=Path("pipeline/cache"))
    parser.add_argument("--out", type=Path, default=Path("public/data/percentiles.json"))
    args = parser.parse_args(argv)

    year, zip_path, input_text = download_latest(args.cache, args.year)
    print(f"Reading {zip_path.name} ...")
    df = read_microdata(zip_path, input_text)
    print(f"{len(df):,} rows read")

    errors = compare(computed_means(df), official_means(year))
    if errors:
        print("Validation against SIDRA 4660 failed:\n  " + "\n  ".join(errors), file=sys.stderr)
        return 1
    print("Validation against SIDRA 4660: OK")

    universe = filter_universe(df)
    groups = build_groups(universe)
    factor, ipca_ref = accumulated_factor(fetch_ipca(year))
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    payload = make_payload(groups, year, factor, ipca_ref, generated_at)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    br = groups["BR"]
    print(
        f"Wrote {args.out} ({args.out.stat().st_size / 1024:.0f} KB): {len(groups)} groups, "
        f"BR n={br['n']:,}, median R$ {br['p'][49]:,}, IPCA x{factor:.4f} to {ipca_ref}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
