import os
import re
import sys
import shutil
from bs4 import BeautifulSoup

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CALCS_DIR = os.path.join(PROJECT_ROOT, "calculators")
BACKUP_DIR = os.path.join(PROJECT_ROOT, "tools", "_normalize_layout_backup")

# Visible arrow remnants from broken HTML comments
ORPHAN_LINE_PATS = [
    re.compile(r"(?m)^[ \t]*--&gt;[ \t]*\r?\n"),
    re.compile(r"(?m)^[ \t]*-->[ \t]*\r?\n"),
]

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

def find_matching_div_close(html: str, start_idx: int):
    token_re = re.compile(r'(?is)<div\b[^>]*>|</div\s*>')
    depth = 0
    seen_open = False
    for m in token_re.finditer(html, start_idx):
        tok = m.group(0).lower()
        if tok.startswith("<div"):
            depth += 1
            seen_open = True
        else:
            depth -= 1
        if seen_open and depth == 0:
            return m.end()
        if depth < 0:
            return None
    return None

def get_main_html_soup(fragment: str) -> BeautifulSoup:
    # Parse fragments reliably
    return BeautifulSoup(fragment, "html.parser")

def direct_grid_slots(page_grid):
    if not page_grid:
        return []
    return page_grid.find_all("div", class_="grid-slot", recursive=False)

def layout_looks_canonical(layout_div):
    if not layout_div:
        return False
    page_grid = layout_div.find("div", class_="page-grid")
    slots = direct_grid_slots(page_grid)
    if len(slots) != 9:
        return False

    # Ensure no affiliate blocks remain
    for blk in layout_div.find_all("div", class_="ad-block"):
        aria = (blk.get("aria-label") or "").strip().lower()
        if "affiliate" in aria:
            return False

    return True

def clone_children_to_string(children):
    # Convert a list of nodes to stable HTML string
    return "".join(str(c) for c in children).strip()

def extract_parts(layout_fragment: str):
    soup = get_main_html_soup(layout_fragment)
    layout = soup.find("div", class_="page-layout")
    if not layout:
        return None, "no page-layout"

    h1 = layout.find("h1")
    if not h1:
        return None, "no h1"

    calc = layout.find("div", class_="calculator-container")
    if not calc:
        return None, "no calculator-container"

    cards = layout.find_all("a", class_="related-card")
    if len(cards) != 3:
        return None, f"related-card count={len(cards)}"

    seo = layout.find("section", class_="seo-section")
    if not seo:
        return None, "no seo-section"

    # Row 1 ad placeholders: preserve exactly what exists now (if present)
    row1_left_html = ""
    row1_right_html = ""

    page_grid = layout.find("div", class_="page-grid")
    if page_grid:
        slots = direct_grid_slots(page_grid)
        if len(slots) >= 3:
            row1_left_html = clone_children_to_string(slots[0].contents)
            row1_right_html = clone_children_to_string(slots[2].contents)

    # Detach extracted nodes so we can reinsert without duplication
    h1.extract()
    calc.extract()
    for c in cards:
        c.extract()
    seo.extract()

    return {
        "h1": str(h1).strip(),
        "calc": str(calc).strip(),
        "cards": [str(c).strip() for c in cards],
        "seo": str(seo).strip(),
        "row1_left": row1_left_html,
        "row1_right": row1_right_html,
    }, "ok"

def build_canonical_page_layout(parts):
    # Canonical structure: keep Row 1 side slots content exactly if present; otherwise leave empty.
    # Row 3 side slots must be empty (affiliates already removed).
    def grid_slot(inner_html: str, indent="            "):
        if inner_html.strip():
            # Indent the preserved HTML block for readability only
            inner = "\n".join(
                (indent + line if line.strip() else line)
                for line in inner_html.splitlines()
            )
            return f'          <div class="grid-slot">\n{inner}\n          </div>'
        else:
            return '          <div class="grid-slot">\n          </div>'

    row1_left = grid_slot(parts["row1_left"])
    row1_mid = (
        '          <div class="grid-slot">\n'
        f'            {parts["calc"]}\n'
        '          </div>'
    )
    row1_right = grid_slot(parts["row1_right"])

    row2 = []
    for card in parts["cards"]:
        row2.append(
            '          <div class="grid-slot">\n'
            f'            {card}\n'
            '          </div>'
        )

    row3_left = '          <div class="grid-slot">\n          </div>'
    row3_mid = (
        '          <div class="grid-slot">\n'
        f'            {parts["seo"]}\n'
        '          </div>'
    )
    row3_right = '          <div class="grid-slot">\n          </div>'

    out = (
        '      <div class="page-layout">\n'
        f'        {parts["h1"]}\n\n'
        '        <div class="page-grid">\n'
        '          <!-- Row 1: ad + main calculator + ad -->\n'
        f'{row1_left}\n\n'
        f'{row1_mid}\n\n'
        f'{row1_right}\n\n'
        '          <!-- Row 2: related CATEGORIES (three thin tiles) -->\n'
        f'{row2[0]}\n\n'
        f'{row2[1]}\n\n'
        f'{row2[2]}\n\n'
        '          <!-- Row 3: affiliate + SEO + affiliate -->\n'
        f'{row3_left}\n\n'
        f'{row3_mid}\n\n'
        f'{row3_right}\n'
        '        </div>\n'
        '      </div>\n'
    )
    return out

def normalize_one_file(path: str, dry_run: bool):
    with open(path, "r", encoding="utf-8") as f:
        original = f.read()

    cleaned = clean_orphan_markers(original)

    # Locate page-layout region by string scanning, do not touch <head> at all.
    m = re.search(r'(?i)<div\s+class="page-layout"\s*>', cleaned)
    if not m:
        return "skip:no page-layout"

    start = m.start()
    end = find_matching_div_close(cleaned, start)
    if end is None:
        return "skip:cannot bound page-layout"

    layout_fragment = cleaned[start:end]
    soup_frag = get_main_html_soup(layout_fragment)
    layout_div = soup_frag.find("div", class_="page-layout")

    # If already canonical and affiliate-free, only write if orphan markers were removed
    if layout_looks_canonical(layout_div):
        if cleaned == original:
            return "skip:already-canonical"
        if dry_run:
            return "would-clean-arrows"
        backup_once(path)
        with open(path, "w", encoding="utf-8") as f:
            f.write(cleaned)
        return "cleaned-arrows"

    parts, status = extract_parts(layout_fragment)
    if status != "ok":
        return f"skip:{status}"

    new_layout = build_canonical_page_layout(parts)

    updated = cleaned[:start] + new_layout + cleaned[end:]

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
            status = normalize_one_file(p, dry_run=dry_run)
            counts[status] = counts.get(status, 0) + 1

    print("SUMMARY")
    for k in sorted(counts.keys()):
        print(f"{k}: {counts[k]}")

    if (not dry_run) and any(k in ("normalized", "cleaned-arrows") for k in counts):
        print(f"BACKUPS SAVED TO: {BACKUP_DIR}")

if __name__ == "__main__":
    main()
