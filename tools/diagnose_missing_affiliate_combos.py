from __future__ import annotations

import re
from pathlib import Path
from collections import defaultdict

CALCULATORS_DIR = Path(r"C:\Users\MBenson\Documents\GitHub\calculator-site\calculators")
COMBOS_ROOT = Path(r"G:\My Drive\MJBS Projects\Calculators\Affilliate Combos")

# Finds: <a href="/categories/<slug>/">...</a>
BREADCRUMB_CAT_RE = re.compile(r'href="/categories/([^/]+)/"')

def iter_index_files(root: Path):
    for p in root.rglob("index.html"):
        # Only calculator pages, not categories
        # calculators/<category>/<calculator>/index.html => depth >= 3 under calculators
        try:
            rel = p.relative_to(root)
        except ValueError:
            continue
        if len(rel.parts) >= 3:
            yield p

def extract_category_slug(html: str) -> str | None:
    m = BREADCRUMB_CAT_RE.search(html)
    if not m:
        return None
    return m.group(1).strip()

def main() -> int:
    if not CALCULATORS_DIR.exists():
        print(f"ERROR: calculators dir not found: {CALCULATORS_DIR}")
        return 1

    missing = defaultdict(list)
    scanned = 0
    for idx_path in iter_index_files(CALCULATORS_DIR):
        scanned += 1
        try:
            html = idx_path.read_text(encoding="utf-8", errors="replace")
        except Exception as e:
            missing["__read_error__"].append(f"{idx_path} :: {e}")
            continue

        slug = extract_category_slug(html)
        if not slug:
            missing["__no_breadcrumb_category__"].append(str(idx_path))
            continue

        # Expect combos folder to match slug exactly (case-insensitive).
        expected = COMBOS_ROOT / slug
        if expected.exists():
            continue

        # Try case-insensitive match
        found_ci = None
        if COMBOS_ROOT.exists():
            for child in COMBOS_ROOT.iterdir():
                if child.is_dir() and child.name.lower() == slug.lower():
                    found_ci = child
                    break
        if found_ci:
            continue

        missing[slug].append(str(idx_path))

    print("Affiliate combo diagnose complete.")
    print(f"- Pages scanned: {scanned}")
    slugs = [k for k in missing.keys() if not k.startswith("__")]
    print(f"- Missing category combo folders: {len(slugs)}")

    if slugs:
        print("\nMissing category slugs (and first 3 pages that triggered each):")
        for slug in sorted(slugs):
            pages = missing[slug]
            print(f"\n  {slug}")
            for p in pages[:3]:
                print(f"    - {p}")

    if "__no_breadcrumb_category__" in missing:
        print(f"\n- Pages missing breadcrumbs category: {len(missing['__no_breadcrumb_category__'])}")
    if "__read_error__" in missing:
        print(f"- Read errors: {len(missing['__read_error__'])}")

    return 0

if __name__ == "__main__":
    raise SystemExit(main())
