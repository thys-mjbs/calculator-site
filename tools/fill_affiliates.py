from __future__ import annotations

import os
import random
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Tuple, List, Dict


CALCULATORS_DIR = Path(r"C:\Users\MBenson\Documents\GitHub\calculator-site\calculators")
COMBOS_ROOT = Path(r"G:\My Drive\MJBS Projects\Calculators\Affilliate Combos")

# ----------------------------
# Parsing combo variant files
# ----------------------------

@dataclass
class Slot:
    kind: str  # "text" or "image" or "blank"
    url: str = ""
    label: str = ""
    desc: str = ""
    cta: str = ""
    img_src: str = ""
    product_name: str = ""


SLOT_URL_RE = re.compile(r"^Slot\s+(\d+)\s+URL:\s*(.+?)\s*$", re.IGNORECASE)
SLOT_TYPE_RE = re.compile(r"^Slot\s+(\d+)\s+Affiliate\s+Type:\s*(.+?)\s*$", re.IGNORECASE)
SLOT_LABEL_RE = re.compile(r"^Slot\s+(\d+)\s+Label:\s*(.+?)\s*$", re.IGNORECASE)
SLOT_DESC_RE = re.compile(r"^Slot\s+(\d+)\s+Description:\s*(.+?)\s*$", re.IGNORECASE)
SLOT_CTA_RE = re.compile(r"^Slot\s+(\d+)\s+Link\s+Text:\s*(.+?)\s*$", re.IGNORECASE)
SLOT_IMG_RE = re.compile(r"^Slot\s+(\d+)\s+Image\s+Src:\s*(.+?)\s*$", re.IGNORECASE)
SLOT_PROD_RE = re.compile(r"^Slot\s+(\d+)\s+Product\s+Name:\s*(.+?)\s*$", re.IGNORECASE)

def parse_variant_file(path: Path) -> Dict[int, Slot]:
    slots: Dict[int, Slot] = {1: Slot("blank"), 2: Slot("blank"), 3: Slot("blank"), 4: Slot("blank")}
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()

    tmp: Dict[int, Dict[str, str]] = {1: {}, 2: {}, 3: {}, 4: {}}

    for line in lines:
        line = line.strip()
        if not line:
            continue

        m = SLOT_URL_RE.match(line)
        if m:
            tmp[int(m.group(1))]["url"] = m.group(2).strip()
            continue

        m = SLOT_TYPE_RE.match(line)
        if m:
            tmp[int(m.group(1))]["type"] = m.group(2).strip().lower()
            continue

        m = SLOT_LABEL_RE.match(line)
        if m:
            tmp[int(m.group(1))]["label"] = m.group(2).strip()
            continue

        m = SLOT_DESC_RE.match(line)
        if m:
            tmp[int(m.group(1))]["desc"] = m.group(2).strip()
            continue

        m = SLOT_CTA_RE.match(line)
        if m:
            tmp[int(m.group(1))]["cta"] = m.group(2).strip()
            continue

        m = SLOT_IMG_RE.match(line)
        if m:
            tmp[int(m.group(1))]["img_src"] = m.group(2).strip()
            continue

        m = SLOT_PROD_RE.match(line)
        if m:
            tmp[int(m.group(1))]["product_name"] = m.group(2).strip()
            continue

    for i in (1, 2, 3, 4):
        data = tmp[i]
        url = data.get("url", "").strip()

        # Image slot if url + img + product_name exist
        if url and data.get("img_src") and data.get("product_name"):
            slots[i] = Slot(
                kind="image",
                url=url,
                img_src=data.get("img_src", "").strip(),
                product_name=data.get("product_name", "").strip(),
            )
            continue

        # Text slot if type==text and all fields exist
        if data.get("type", "").strip() == "text" and url:
            slots[i] = Slot(
                kind="text",
                url=url,
                label=data.get("label", "").strip(),
                desc=data.get("desc", "").strip(),
                cta=data.get("cta", "").strip(),
            )
            continue

        # Otherwise blank
        slots[i] = Slot(kind="blank")

    return slots


def render_inner_html(slot: Slot) -> str:
    if slot.kind == "text":
        return (
            f'  <a class="affiliate-link" href="{slot.url}" target="_blank" rel="nofollow sponsored noopener">\n'
            f'    <div class="affiliate-label">{slot.label}</div>\n'
            f'    <p class="affiliate-copy">{slot.desc}</p>\n'
            f'    <div class="affiliate-cta">{slot.cta}</div>\n'
            f'  </a>\n'
        )

    if slot.kind == "image":
        # enforce root-relative
        img = slot.img_src.strip()
        if not img.startswith("/"):
            img = "/" + img.lstrip("/")

        alt = f"{slot.product_name} book cover".strip()
        return (
            f'  <a href="{slot.url}" target="_blank" rel="nofollow sponsored noopener">\n'
            f'    <img src="{img}" alt="{alt}">\n'
            f'  </a>\n'
        )

    return (
        '  <div class="ad-placeholder-img" aria-label="Reserved space for future advertisement"></div>\n'
        "  <p></p>\n"
    )


# ----------------------------
# Finding and editing ad-blocks
# ----------------------------

OPEN_ADBLOCK_RE = re.compile(r'<div\s+class="ad-block"[^>]*>', re.IGNORECASE)
DIV_OPEN_RE = re.compile(r"<div\b", re.IGNORECASE)
DIV_CLOSE_RE = re.compile(r"</div>", re.IGNORECASE)

def find_matching_div_end(html: str, start_open_idx: int) -> Optional[int]:
    """
    Given index at the start of an opening <div ...>, return index of the end of the matching </div>.
    Returns the index immediately after the matching </div>.
    """
    # Find end of the opening tag
    open_tag_end = html.find(">", start_open_idx)
    if open_tag_end == -1:
        return None

    idx = open_tag_end + 1
    depth = 1

    while idx < len(html):
        next_open = html.find("<div", idx)
        next_close = html.find("</div>", idx)

        if next_close == -1:
            return None

        if next_open != -1 and next_open < next_close:
            depth += 1
            idx = next_open + 4
            continue

        # closing div
        depth -= 1
        idx = next_close + len("</div>")
        if depth == 0:
            return idx

    return None


def replace_adblock_inner(html: str, open_tag_start: int, open_tag_end: int, close_tag_start: int, new_inner: str) -> str:
    return html[: open_tag_end + 1] + "\n" + new_inner + html[close_tag_start:]


def extract_category_slug_from_path(index_path: Path) -> str:
    # calculators/<category>/<calculator>/index.html
    rel = index_path.relative_to(CALCULATORS_DIR)
    return rel.parts[0]


def pick_variant_file(category_slug: str) -> Optional[Path]:
    folder = COMBOS_ROOT / category_slug
    if not folder.exists():
        return None

    candidates = []
    for i in range(1, 7):
        p = folder / f"Variant {i:02d}.txt"
        if p.exists():
            candidates.append(p)

    if not candidates:
        return None

    return random.choice(candidates)


def iter_calc_index_files(root: Path):
    for p in root.rglob("index.html"):
        try:
            rel = p.relative_to(root)
        except ValueError:
            continue
        if len(rel.parts) >= 3:
            yield p


def main() -> int:
    random.seed()

    pages_scanned = 0
    pages_updated = 0
    slots_filled = 0
    missing_combo = 0
    errors = 0

    for index_path in iter_calc_index_files(CALCULATORS_DIR):
        pages_scanned += 1
        category_slug = extract_category_slug_from_path(index_path)

        variant_path = pick_variant_file(category_slug)
        if variant_path is None:
            missing_combo += 1
            continue

        try:
            html = index_path.read_text(encoding="utf-8", errors="replace")
        except Exception:
            errors += 1
            continue

        # Find ad-blocks and fill blanks
        matches = list(OPEN_ADBLOCK_RE.finditer(html))
        if not matches:
            continue

        slots = parse_variant_file(variant_path)
        slot_inners = [render_inner_html(slots[i]) for i in (1, 2, 3, 4)]

        updated = False
        filled_this_page = 0
        slot_ptr = 0

        # Work from left to right, but because we edit strings, rebuild using offsets
        # We will progressively update html and re-scan to keep indices correct.
        while slot_ptr < 4:
            m = OPEN_ADBLOCK_RE.search(html)
            if not m:
                break

            start = m.start()
            open_end = html.find(">", start)
            if open_end == -1:
                break

            block_end = find_matching_div_end(html, start)
            if block_end is None:
                break

            block = html[start:block_end]
            # Blank means it contains placeholder image class
            if "ad-placeholder-img" in block:
                # Find close tag start for outer div
                close_start = block.rfind("</div>")
                if close_start == -1:
                    break
                close_start = start + close_start

                new_inner = slot_inners[slot_ptr]
                html = replace_adblock_inner(html, start, open_end, close_start, new_inner)

                updated = True
                filled_this_page += 1
                slot_ptr += 1

                # Continue scanning AFTER this block
                continue

            # Not blank, skip this ad-block by removing it temporarily from scan head
            # We advance the scan window by slicing and keeping a marker.
            # Simplest: replace the first occurrence with a sentinel and restore later is messy.
            # Instead: move a cursor and search from there.
            # So we implement cursor-based search below.

            break  # cursor-based implementation below replaces this loop

        if True:
            # Cursor-based fill that skips non-blank ad-blocks correctly
            html2 = html
            cursor = 0
            slot_ptr = 0
            filled_this_page = 0
            updated = False

            while slot_ptr < 4:
                m = OPEN_ADBLOCK_RE.search(html2, cursor)
                if not m:
                    break

                start = m.start()
                open_end = html2.find(">", start)
                if open_end == -1:
                    break

                block_end = find_matching_div_end(html2, start)
                if block_end is None:
                    break

                block = html2[start:block_end]

                if "ad-placeholder-img" in block:
                    close_start_local = block.rfind("</div>")
                    if close_start_local == -1:
                        break
                    close_start = start + close_start_local

                    new_inner = slot_inners[slot_ptr]
                    html2 = replace_adblock_inner(html2, start, open_end, close_start, new_inner)

                    updated = True
                    filled_this_page += 1
                    slot_ptr += 1
                    cursor = block_end  # continue after block
                else:
                    cursor = block_end  # skip filled block

            html = html2

            try:
                index_path.write_text(html, encoding="utf-8")
                pages_updated += 1
                slots_filled += filled_this_page
            except Exception:
                errors += 1

    print("Affiliate fill complete.")
    print(f"- Pages scanned: {pages_scanned}")
    print(f"- Pages updated: {pages_updated}")
    print(f"- Slots filled: {slots_filled}")
    print(f"- Pages missing category combos on G drive: {missing_combo}")
    print(f"- Errors: {errors}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
