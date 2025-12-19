from __future__ import annotations

import sys
from pathlib import Path

from calculators_config import get_paths
from utils import (
    build_category_name_map,
    parse_calculator_page,
    rewrite_category_pages,
    scan_calculator_index_files,
    write_search_index_json,
)


def repo_root_from_tools_dir() -> Path:
    # tools/build.py -> tools -> repo root
    return Path(__file__).resolve().parent.parent


def main() -> int:
    repo_root = repo_root_from_tools_dir()
    paths = get_paths(repo_root)

    if not paths.calculators_dir.exists():
        print(f"ERROR: calculators folder not found at: {paths.calculators_dir}")
        return 1

    if not paths.categories_dir.exists():
        print(f"ERROR: categories folder not found at: {paths.categories_dir}")
        return 1

    # Build category name map from existing category pages (authoritative display names)
    category_name_map = build_category_name_map(paths.categories_dir)

    # Scan calculator pages
    calc_files = scan_calculator_index_files(paths.calculators_dir)
    if not calc_files:
        print("No calculator index.html files found under /calculators/<category>/<calc>/index.html")
        return 0

    records = []
    skipped = 0
    for p in calc_files:
        rec = parse_calculator_page(p, paths.calculators_dir, category_name_map)
        if rec is None:
            skipped += 1
            continue
        records.append(rec)

    # Stable ordering for outputs
    records = sorted(records, key=lambda r: (r.category_slug.lower(), r.title.lower()))

    # 1) Rebuild search-index.json (full rewrite)
    write_search_index_json(paths.search_index_path, records)

    # 2) Rebuild category pages grid (partial rewrite)
    touched = rewrite_category_pages(paths.categories_dir, records)

    # Sitemap intentionally paused
    print("Build complete.")
    print(f"- Calculators parsed: {len(records)} (skipped: {skipped})")
    print(f"- Search index written: {paths.search_index_path}")
    print(f"- Category pages updated: {len(touched)}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
