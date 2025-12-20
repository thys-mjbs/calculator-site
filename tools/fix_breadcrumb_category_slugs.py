from __future__ import annotations

import re
from pathlib import Path

CALCULATORS_DIR = Path(r"C:\Users\MBenson\Documents\GitHub\calculator-site\calculators")

# Replace ONLY the href="/categories/<slug>/" in the breadcrumbs area
HREF_CAT_RE = re.compile(r'href="/categories/([^/]+)/"')

def iter_calc_index_files(root: Path):
    for p in root.rglob("index.html"):
        try:
            rel = p.relative_to(root)
        except ValueError:
            continue
        # calculators/<category>/<calculator>/index.html
        if len(rel.parts) >= 3:
            yield p, rel.parts[0]  # category folder

def main() -> int:
    scanned = 0
    changed = 0
    errors = 0

    for path, true_cat_slug in iter_calc_index_files(CALCULATORS_DIR):
        scanned += 1
        try:
            html = path.read_text(encoding="utf-8", errors="replace")
        except Exception:
            errors += 1
            continue

        m = HREF_CAT_RE.search(html)
        if not m:
            continue

        existing_slug = m.group(1).strip()
        if existing_slug == true_cat_slug:
            continue

        new_html = HREF_CAT_RE.sub(f'href="/categories/{true_cat_slug}/"', html, count=1)
        if new_html != html:
            path.write_text(new_html, encoding="utf-8")
            changed += 1

    print("Breadcrumb category slug fix complete.")
    print(f"- Pages scanned: {scanned}")
    print(f"- Pages updated: {changed}")
    print(f"- Errors: {errors}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
