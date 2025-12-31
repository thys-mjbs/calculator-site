import os
import re
import sys
import shutil
from bs4 import BeautifulSoup

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CALCS_DIR = os.path.join(PROJECT_ROOT, "calculators")
BACKUP_DIR = os.path.join(PROJECT_ROOT, "tools", "_normalize_main_backup")

# Visible arrow remnants from broken HTML comments
ORPHAN_LINE_PATS = [
    re.compile(r"(?m)^[ \t]*--&gt;[ \t]*\r?\n"),
    re.compile(r"(?m)^[ \t]*-->[ \t]*\r?\n"),
]

RE_MAIN_OPEN = re.compile(r'(?is)<main\b[^>]*class=["\']site-main["\'][^>]*>')
RE_MAIN_CLOSE = re.compile(r'(?is)</main\s*>')

def clean_orphan_markers(text: str) -> str:
    out = text
    for pat in ORPHAN_LINE_PATS:
        out = pat.sub("", out)
    return out

def ensure_parent_dir(path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)

def backup_once(path: str):
    rel = os.path.relpath(path, PROJECT_ROOT)
    backup_path = os.path.join(BACKUP_DIR, rel)
    if not os.path.exists(backup_path):
        ensure_parent_dir(backup_path)
        shutil.copy2(path, backup_path)

def find_main_bounds(html: str):
    mo = RE_MAIN_OPEN.search(html)
    if not mo:
        return None
    mc = RE_MAIN_CLOSE.search(html, mo.end())
    if not mc:
        return None
    return mo.start(), mo.end(), mc.start(), mc.end()

def html_of_children(tag) -> str:
    return "".join(str(c) for c in tag.contents).strip()

def find_adsense_blocks(main_soup: BeautifulSoup):
    """
    Try to preserve existing AdSense placeholders.
    Priority:
    1) If a page-grid exists with slots, take slot[0] and slot[2] inner HTML.
    2) Else, take first two ad-blocks with aria-label containing "advert" (Advertisement area).
    """
    left_html = ""
    right_html = ""

    layout = main_soup.find("div", class_="page-layout")
    if layout:
        pg = layout.find("div", class_="page-grid")
        if pg:
            slots = pg.find_all("div", class_="grid-slot", recursive=False)
            if len(slots) >= 3:
                left_html = html_of_children(slots[0])
                right_html = html_of_children(slots[2])

    if left_html.strip() or right_html.strip():
        return left_html, right_html

    # Fallback: scan for ad blocks that look like AdSense placeholders
    ad_blocks = []
    for div in main_soup.find_all("div", class_="ad-block"):
        aria = (div.get("aria-label") or "").strip().lower()
        if "advert" in aria:  # matches "Advertisement area"
            ad_blocks.append(str(div).strip())

    if len(ad_blocks) >= 1:
        left_html = ad_blocks[0]
    if len(ad_blocks) >= 2:
        right_html = ad_blocks[1]

    return left_html, right_html

def extract_required(main_soup: BeautifulSoup):
    breadcrumbs = main_soup.find("nav", class_="breadcrumbs")

    h1 = main_soup.find("h1")
    calc = main_soup.find("div", class_="calculator-container")
    cards = main_soup.find_all("a", class_="related-card")
    seo = main_soup.find("section", class_="seo-section")

    if not h1:
        return None, "no h1"
    if not calc:
        return None, "no calculator-container"
    if len(cards) != 3:
        return None, f"related-card count={len(cards)}"
    if not seo:
        return None, "no seo-section"

    # Detach core parts to avoid duplication
    h1.extract()
    calc.extract()
    for c in cards:
        c.extract()
    seo.extract()

    # Detach breadcrumbs only if present (we will reinsert unchanged)
    if breadcrumbs:
        breadcrumbs.extract()

    return {
        "breadcrumbs": str(breadcrumbs).strip() if breadcrumbs else "",
        "h1": str(h1).strip(),
        "calc": str(calc).strip(),
        "cards": [str(c).strip() for c in cards],
        "seo": str(seo).strip(),
    }, "ok"

def build_canonical_main_html(parts, row1_left_html, row1_right_html):
    def slot(inner_html: str):
        if inner_html.strip():
            return f'    <div class="grid-slot">\n{inner_html}\n    </div>'
        return '    <div class="grid-slot">\n    </div>'

    # Row 1: keep AdSense placeholders if present
    row1_left = slot(row1_left_html)
    row1_mid = (
        '    <div class="grid-slot">\n'
        f'{parts["calc"]}\n'
        '    </div>'
    )
    row1_right = slot(row1_right_html)

    # Row 2
    row2_slots = []
    for card in parts["cards"]:
        row2_slots.append(
            '    <div class="grid-slot">\n'
            f'{card}\n'
            '    </div>'
        )

    # Row 3: empty, SEO, empty
    row3_left = '    <div class="grid-slot">\n    </div>'
    row3_mid = (
        '    <div class="grid-slot">\n'
        f'{parts["seo"]}\n'
        '    </div>'
    )
    row3_right = '    <div class="grid-slot">\n    </div>'

    main_inner = ""

    if parts["breadcrumbs"]:
        main_inner += parts["breadcrumbs"] + "\n"

    main_inner += (
        '<div class="page-layout">\n'
        f'{parts["h1"]}\n'
        '<div class="page-grid">\n'
        '<!-- Row 1: ad + main calculator + ad -->\n'
        f'{row1_left}\n'
        f'{row1_mid}\n'
        f'{row1_right}\n'
        '<!-- Row 2: related CATEGORIES (three thin tiles) -->\n'
        f'{row2_slots[0]}\n'
        f'{row2_slots[1]}\n'
        f'{row2_slots[2]}\n'
        '<!-- Row 3: affiliate + SEO + affiliate -->\n'
        f'{row3_left}\n'
        f'{row3_mid}\n'
        f'{row3_right}\n'
        '</div>\n'
        '</div>\n'
    )

    return main_inner

def normalize_one(path: str, dry_run: bool):
    with open(path, "r", encoding="utf-8") as f:
        original = f.read()

    cleaned = clean_orphan_markers(original)

    bounds = find_main_bounds(cleaned)
    if not bounds:
        return "skip:no main bounds"

    main_start, main_open_end, main_close_start, main_end = bounds

    main_open_tag = cleaned[main_start:main_open_end]
    main_inner_html = cleaned[main_open_end:main_close_start]
    main_close_tag = cleaned[main_close_start:main_end]

    # Parse only main content (head untouched)
    main_soup = BeautifulSoup(main_inner_html, "html.parser")

    # Preserve AdSense placeholders if present
    row1_left_html, row1_right_html = find_adsense_blocks(main_soup)

    parts, status = extract_required(main_soup)
    if status != "ok":
        return f"skip:{status}"

    # Build canonical main inner HTML
    new_main_inner = build_canonical_main_html(parts, row1_left_html, row1_right_html)

    updated = cleaned[:main_start] + main_open_tag + "\n" + new_main_inner + "\n" + main_close_tag + cleaned[main_end:]

    if updated == original:
        return "skip:no change"

    if dry_run:
        return "would-normalize"

    backup_once(path)
    with open(path, "w", encoding="utf-8") as f:
        f.write(updated)

    return "normalized"

def main():
    dry_run = "--dry-run" in sys.argv

    if not os.path.isdir(CALCS_DIR):
        print(f"ERROR: calculators folder not found: {CALCS_DIR}")
        sys.exit(1)

    counts = {}

    for root, _, files in os.walk(CALCS_DIR):
        for name in files:
            if name.lower() != "index.html":
                continue
            p = os.path.join(root, name)
            status = normalize_one(p, dry_run=dry_run)
            counts[status] = counts.get(status, 0) + 1

    print("SUMMARY")
    for k in sorted(counts.keys()):
        print(f"{k}: {counts[k]}")

    if (not dry_run) and counts.get("normalized", 0) > 0:
        print(f"BACKUPS SAVED TO: {BACKUP_DIR}")

if __name__ == "__main__":
    main()
