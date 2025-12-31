import os
import re
import shutil

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CALCS_DIR = os.path.join(PROJECT_ROOT, "calculators")
BACKUP_DIR = os.path.join(PROJECT_ROOT, "tools", "_layout_fix_backup")

RE_PAGE_LAYOUT_OPEN = re.compile(r'<div\s+class="page-layout"\s*>', re.IGNORECASE)
RE_H1 = re.compile(r'(<h1>.*?</h1>)', re.IGNORECASE | re.DOTALL)
RE_CALC_CONTAINER = re.compile(r'(<div\s+class="calculator-container"\s*>.*?</div>)', re.IGNORECASE | re.DOTALL)
RE_RELATED_CARD = re.compile(r'(<a\s+class="related-card"\s+href="[^"]*"\s*>.*?</a>)', re.IGNORECASE | re.DOTALL)
RE_SEO_SECTION = re.compile(r'(<section\s+class="seo-section"\s*>.*?</section>)', re.IGNORECASE | re.DOTALL)

def ensure_parent_dir(path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)

def backup_once(path: str):
    rel = os.path.relpath(path, PROJECT_ROOT)
    backup_path = os.path.join(BACKUP_DIR, rel)
    if not os.path.exists(backup_path):
        ensure_parent_dir(backup_path)
        shutil.copy2(path, backup_path)

def find_matching_div_close(html: str, start_idx: int) -> int | None:
    """
    Returns the index just AFTER the closing </div> that matches the <div ...> at start_idx,
    using a simple div depth counter.
    If structure is too broken, returns None.
    """
    token_re = re.compile(r'(?is)<div\b[^>]*>|</div\s*>')
    depth = 0
    seen_open = False

    for m in token_re.finditer(html, start_idx):
        tok = m.group(0)
        if tok.lower().startswith("<div"):
            depth += 1
            seen_open = True
        else:
            depth -= 1

        if seen_open and depth == 0:
            return m.end()

        # If we go negative, the HTML is too broken for this method
        if depth < 0:
            return None

    return None

def build_page_layout(h1_html: str, calc_html: str, cards: list[str], seo_html: str) -> str:
    # Keep spacing style consistent with your existing files (blank lines in empty ad slots)
    empty_ad_slot = '\n\n\n\n\n          '

    return (
        '<div class="page-layout">\n'
        f'{h1_html}\n'
        '<div class="page-grid">\n'
        '<!-- Row 1: ad + main calculator + ad -->\n'
        f'<div class="grid-slot">{empty_ad_slot}</div>\n'
        '<div class="grid-slot">\n'
        f'{calc_html}\n'
        '</div>\n'
        f'<div class="grid-slot">{empty_ad_slot}</div>\n'
        '<!-- Row 2: related CATEGORIES (three thin tiles) -->\n'
        '<div class="grid-slot">\n'
        f'{cards[0]}\n'
        '</div>\n'
        '<div class="grid-slot">\n'
        f'{cards[1]}\n'
        '</div>\n'
        '<div class="grid-slot">\n'
        f'{cards[2]}\n'
        '</div>\n'
        '<!-- Row 3: affiliate + SEO + affiliate -->\n'
        f'<div class="grid-slot">{empty_ad_slot}</div>\n'
        '<div class="grid-slot">\n'
        f'{seo_html}\n'
        '</div>\n'
        f'<div class="grid-slot">{empty_ad_slot}</div>\n'
        '</div>\n'
        '</div>\n'
    )

def fix_file(path: str) -> bool:
    with open(path, "r", encoding="utf-8") as f:
        html = f.read()

    m_layout = RE_PAGE_LAYOUT_OPEN.search(html)
    if not m_layout:
        return False

    layout_start = m_layout.start()
    layout_end = find_matching_div_close(html, m_layout.start())
    if layout_end is None:
        # fallback: replace from page-layout open to just before </main>
        main_close = html.lower().find("</main>")
        if main_close == -1:
            return False
        layout_end = main_close

    layout_block = html[layout_start:layout_end]

    m_h1 = RE_H1.search(layout_block)
    m_calc = RE_CALC_CONTAINER.search(layout_block)
    cards = RE_RELATED_CARD.findall(layout_block)
    m_seo = RE_SEO_SECTION.search(layout_block)

    # Require minimum viable parts. If missing, skip file (do not risk damage).
    if not (m_h1 and m_calc and m_seo) or len(cards) != 3:
        return False

    new_layout = build_page_layout(
        h1_html=m_h1.group(1).strip(),
        calc_html=m_calc.group(1).strip(),
        cards=[c.strip() for c in cards],
        seo_html=m_seo.group(1).strip(),
    )

    new_html = html[:layout_start] + new_layout + html[layout_end:]

    if new_html == html:
        return False

    backup_once(path)
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_html)

    return True

def main():
    if not os.path.isdir(CALCS_DIR):
        print(f"ERROR: calculators folder not found: {CALCS_DIR}")
        return

    changed = 0
    skipped = 0

    for root, _, files in os.walk(CALCS_DIR):
        for name in files:
            if name.lower() != "index.html":
                continue
            p = os.path.join(root, name)
            ok = fix_file(p)
            if ok:
                changed += 1
            else:
                skipped += 1

    print(f"DONE: changed={changed}, skipped={skipped}")
    if changed > 0:
        print(f"BACKUPS: {BACKUP_DIR}")

if __name__ == "__main__":
    main()
