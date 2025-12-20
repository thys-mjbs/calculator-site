from __future__ import annotations

import random
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Dict, List, Tuple


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

        # Text slot if type==text and url exists
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


def find_matching_div_end(html: str, start_open_idx: int) -> Optional[int]:
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

        depth -= 1
        idx = next_close + len("</div>")
        if depth == 0:
            return idx

    return None


def replace_adblock_inner(html: str, open_tag_end: int, close_tag_start: int, new_inner: str) -> str:
    return html[: open_tag_end + 1] + "\n" + new_inner + html[close_tag_start:]


def extract_category_slug_from_path(index_path: Path) -> str:
    rel = index_path.relative_to(CALCULATORS_DIR)
    return rel.parts[0]


def list_variant_files(category_slug: str) -> List[Path]:
    folder = COMBOS_ROOT / category_slug
    if not folder.exists():
        return []
    out: List[Path] = []
    for i in range(1, 7):
        p = folder / f"Variant {i:02d}.txt"
        if p.exists():
            out.append(p)
    return out


def iter_calc_index_files(root: Path):
    for p in root.rglob("index.html"):
        try:
            rel = p.relative_to(root)
        except ValueError:
            continue
        if len(rel.parts) >= 3:
            yield p


def slot_signature(s: Slot) -> Tuple[str, str, str]:
    """
    Signature used to enforce uniqueness WITHIN a page.
    - text: kind + url
    - image: kind + url + img_src
    - blank: always unique-ish but we avoid choosing blank if possible
    """
    if s.kind == "text":
        return ("text", s.url.strip(), "")
    if s.kind == "image":
        img = s.img_src.strip()
        return ("image", s.url.strip(), img)
    return ("blank", "", "")


def choose_unique_slots_for_page(variant_paths: List[Path]) -> Dict[int, Slot]:
    """
    Build Slot 1..4 for ONE page, ensuring no duplicates within the page.
    We pull Slot N from a randomly chosen variant, retrying if it duplicates.
    """
    # Parse all variants once
    parsed: List[Dict[int, Slot]] = []
    for vp in variant_paths:
        try:
            parsed.append(parse_variant_file(vp))
        except Exception:
            continue

    # If nothing parses, fallback to blanks
    if not parsed:
        return {1: Slot("blank"), 2: Slot("blank"), 3: Slot("blank"), 4: Slot("blank")}

    chosen: Dict[int, Slot] = {}
    used_sigs = set()

    for slot_num in (1, 2, 3, 4):
        # Try multiple random picks to find a unique, non-blank slot
        pick: Slot = Slot("blank")
        best_blank: Slot = Slot("blank")

        attempts = 0
        max_attempts = 40

        while attempts < max_attempts:
            attempts += 1
            variant = random.choice(parsed)
            candidate = variant.get(slot_num, Slot("blank"))

            sig = slot_signature(candidate)

            # prefer non-blank
            if candidate.kind == "blank":
                best_blank = candidate
                continue

            if sig not in used_sigs:
                pick = candidate
                break

        # If we failed to find a unique non-blank, allow a non-blank even if duplicate;
        # if even that isn't available, keep blank.
        if pick.kind == "blank":
            # attempt to at least get a non-blank (even if duplicate)
            for _ in range(20):
                variant = random.choice(parsed)
                candidate = variant.get(slot_num, Slot("blank"))
                if candidate.kind != "blank":
                    pick = candidate
                    break
            if pick.kind == "blank":
                pick = best_blank

        chosen[slot_num] = pick
        used_sigs.add(slot_signature(pick))

    return chosen


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

        variant_paths = list_variant_files(category_slug)
        if not variant_paths:
            missing_combo += 1
            continue

        try:
            html = index_path.read_text(encoding="utf-8", errors="replace")
        except Exception:
            errors += 1
            continue

        # Build unique slot content for THIS page
        page_slots = choose_unique_slots_for_page(variant_paths)
        slot_inners = [render_inner_html(page_slots[i]) for i in (1, 2, 3, 4)]

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
                html2 = replace_adblock_inner(html2, open_end, close_start, new_inner)

                updated = True
                filled_this_page += 1
                slot_ptr += 1
                cursor = block_end
            else:
                cursor = block_end

        if updated:
            try:
                index_path.write_text(html2, encoding="utf-8")
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
