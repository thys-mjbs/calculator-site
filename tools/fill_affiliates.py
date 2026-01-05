import argparse
import os
import random
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple


# ----------------------------
# Inventory parsing
# ----------------------------

SECTION_RE = re.compile(r"^\[(.+?)\]\s*$")
COMMENT_RE = re.compile(r"^\s*#")
KV_RE = re.compile(r"^\s*([a-zA-Z0-9_]+)\s*=\s*(.+?)\s*$")


@dataclass
class ImageItem:
    href: str
    img: str
    alt: str


@dataclass
class Inventory:
    adsterra_html: str
    amazon_static: ImageItem
    affiliate_programs: List[ImageItem]
    books: List[ImageItem]


def _strip_bom(s: str) -> str:
    return s.lstrip("\ufeff")


def parse_inventory(path: Path) -> Inventory:
    if not path.exists():
        raise FileNotFoundError(f"Inventory file not found: {path}")

    raw = _strip_bom(path.read_text(encoding="utf-8", errors="replace"))
    lines = raw.splitlines()

    current = ""
    sections: Dict[str, List[str]] = {}

    for line in lines:
        m = SECTION_RE.match(line.strip())
        if m:
            current = m.group(1).strip().upper()
            sections.setdefault(current, [])
            continue
        if not current:
            continue
        sections[current].append(line)

    # ADSTERRA_HTML: keep as-is (minus leading/trailing blank lines)
    ad_lines = sections.get("ADSTERRA_HTML", [])
    adsterra_html = "\n".join(ad_lines).strip() + "\n"

    # AMAZON_STATIC: key=value lines
    amazon_lines = sections.get("AMAZON_STATIC", [])
    amazon_kv: Dict[str, str] = {}
    for ln in amazon_lines:
        if not ln.strip() or COMMENT_RE.match(ln):
            continue
        m = KV_RE.match(ln)
        if m:
            amazon_kv[m.group(1).strip().lower()] = m.group(2).strip()
    if "href" not in amazon_kv or "img" not in amazon_kv:
        raise ValueError("AMAZON_STATIC must contain href= and img= (alt= optional).")
    amazon_static = ImageItem(
        href=amazon_kv["href"],
        img=amazon_kv["img"],
        alt=amazon_kv.get("alt", "Shop online"),
    )

    # AFFILIATE_PROGRAMS + BOOKS: pipe-delimited lines
    def parse_pipe_list(key: str) -> List[ImageItem]:
        out: List[ImageItem] = []
        for ln in sections.get(key, []):
            if not ln.strip() or COMMENT_RE.match(ln):
                continue
            parts = [p.strip() for p in ln.split("|")]
            if len(parts) < 2:
                continue
            href = parts[0]
            img = parts[1]
            alt = parts[2] if len(parts) >= 3 and parts[2] else "Sponsored content"
            out.append(ImageItem(href=href, img=img, alt=alt))
        return out

    affiliate_programs = parse_pipe_list("AFFILIATE_PROGRAMS")
    books = parse_pipe_list("BOOKS")

    if not affiliate_programs:
        raise ValueError("AFFILIATE_PROGRAMS section must have at least 1 item.")
    if not books:
        raise ValueError("BOOKS section must have at least 1 item.")
    if not adsterra_html.strip():
        raise ValueError("ADSTERRA_HTML section is empty.")

    return Inventory(
        adsterra_html=adsterra_html,
        amazon_static=amazon_static,
        affiliate_programs=affiliate_programs,
        books=books,
    )


# ----------------------------
# HTML scanning and replacement
# ----------------------------

ADBLOCK_OPEN_RE = re.compile(r'<div\s+class="ad-block"[^>]*>', re.IGNORECASE)


def iter_files(root: Path, exts: List[str], exclude_dirs: List[str]) -> Iterable[Path]:
    exclude = {d.strip().lower() for d in exclude_dirs if d.strip()}
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d.lower() not in exclude]
        for name in filenames:
            p = Path(dirpath) / name
            if p.suffix.lower() in exts:
                yield p


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8", errors="replace")


def write_text(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")


def find_tag_end(text: str, start_idx: int) -> int:
    gt = text.find(">", start_idx)
    if gt == -1:
        raise ValueError("Malformed HTML: missing '>' on an opening tag.")
    return gt


def is_open_div_at(text: str, i: int) -> bool:
    if text.startswith("<div", i):
        if i + 4 < len(text):
            return text[i + 4] in (" ", ">", "\n", "\r", "\t")
        return True
    return False


def is_close_div_at(text: str, i: int) -> bool:
    return text.startswith("</div", i)


def find_matching_close_div_gt(text: str, open_tag_start: int) -> int:
    open_tag_end = find_tag_end(text, open_tag_start)
    i = open_tag_end + 1
    depth = 1

    while i < len(text):
        if is_open_div_at(text, i):
            depth += 1
            i = find_tag_end(text, i) + 1
            continue

        if is_close_div_at(text, i):
            depth -= 1
            close_gt = find_tag_end(text, i)
            i = close_gt + 1
            if depth == 0:
                return close_gt
            continue

        i += 1

    raise ValueError("Malformed HTML: no matching </div> found for ad-block.")


def get_line_indent(text: str, idx: int) -> str:
    line_start = text.rfind("\n", 0, idx)
    if line_start == -1:
        line_start = 0
    else:
        line_start += 1
    j = line_start
    while j < len(text) and text[j] in (" ", "\t"):
        j += 1
    return text[line_start:j]


def indent_block(block: str, indent: str) -> str:
    lines = block.strip("\n").splitlines()
    return "\n".join(indent + line for line in lines) + "\n"


def normalize_img_path(p: str) -> str:
    p = p.strip()
    if not p.startswith("/"):
        p = "/" + p.lstrip("/")
    return p


def build_image_anchor(item: ImageItem) -> str:
    img = normalize_img_path(item.img)
    return (
        f'<a class="affiliate-link" href="{item.href}" target="_blank" rel="nofollow sponsored noopener">\n'
        f'  <img src="{img}" alt="{item.alt}">\n'
        f"</a>\n"
    )


def normalize_adblock_aria_label(open_tag: str) -> str:
    # Force aria-label="Sponsored content" on the ad-block opening tag.
    if 'aria-label="' in open_tag.lower():
        open_tag = re.sub(
            r'aria-label\s*=\s*"(.*?)"',
            'aria-label="Sponsored content"',
            open_tag,
            flags=re.IGNORECASE,
        )
        return open_tag

    # If missing, add it
    if open_tag.endswith(">"):
        return open_tag[:-1] + ' aria-label="Sponsored content">'
    return open_tag


def replace_first_four_adblocks(html: str, inv: Inventory, seed: int) -> Tuple[str, int]:
    rng = random.Random(seed)

    # Slot rules
    slot1 = inv.adsterra_html.strip() + "\n"
    slot2_item = rng.choice(inv.affiliate_programs)
    slot3_item = rng.choice(inv.books)
    slot4_item = inv.amazon_static

    slot_blocks = [
        slot1,
        build_image_anchor(slot2_item).strip() + "\n",
        build_image_anchor(slot3_item).strip() + "\n",
        build_image_anchor(slot4_item).strip() + "\n",
    ]

    matches = list(ADBLOCK_OPEN_RE.finditer(html))
    if not matches:
        return html, 0

    # Only first 4 ad-blocks per file
    matches = matches[:4]

    out = html
    replaced = 0

    # Replace backwards to keep indices valid
    for idx in range(len(matches) - 1, -1, -1):
        m = matches[idx]
        open_start = m.start()
        open_end_gt = find_tag_end(out, open_start)
        open_tag = out[open_start : open_end_gt + 1]
        normalized_open = normalize_adblock_aria_label(open_tag)

        close_gt = find_matching_close_div_gt(out, open_start)
        close_tag_start = out.rfind("</div", 0, close_gt + 1)
        if close_tag_start == -1:
            raise ValueError("Malformed HTML: could not locate closing </div> start.")

        base_indent = get_line_indent(out, open_start)
        inner_indent = base_indent + "  "
        new_inner = "\n" + indent_block(slot_blocks[idx], inner_indent)

        out = (
            out[:open_start]
            + normalized_open
            + out[open_end_gt + 1 : open_end_gt + 1]
            + out[open_end_gt + 1 : close_tag_start]
        )
        # The above line is wrong if we keep old inner; we must drop old inner entirely:
        out = out[: open_start] + normalized_open + new_inner + out[close_tag_start:]

        replaced += 1

    return out, replaced


# ----------------------------
# Main
# ----------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Fill the first 4 .ad-blocks in each HTML file using tools/affiliate_inventory.txt and fixed slot rules."
    )
    parser.add_argument("--root", default=".", help="Project root to scan. Use --root .")
    parser.add_argument("--ext", default=".html,.htm", help='Extensions to scan. Default: ".html,.htm"')
    parser.add_argument(
        "--exclude-dirs",
        default=".git,node_modules,.venv,venv,dist,build,.next,.cache",
        help="Comma-separated directory names to skip.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Show files that would change without writing.")
    parser.add_argument("--seed", type=int, default=12345, help="Repeatable random seed for Slot 2 and Slot 3.")
    parser.add_argument(
        "--inventory",
        default=None,
        help="Path to inventory file. Default: tools/affiliate_inventory.txt next to this script.",
    )

    args = parser.parse_args()

    root = Path(args.root).resolve()
    exts = [e.strip().lower() for e in args.ext.split(",") if e.strip()]
    exts = [e if e.startswith(".") else f".{e}" for e in exts]
    exclude_dirs = [d.strip() for d in args.exclude_dirs.split(",") if d.strip()]

    script_dir = Path(__file__).resolve().parent
    inventory_path = Path(args.inventory).resolve() if args.inventory else (script_dir / "affiliate_inventory.txt")

    inv = parse_inventory(inventory_path)

    changed_files = 0
    total_blocks = 0
    errors = 0

    for path in iter_files(root, exts, exclude_dirs):
        try:
            original = read_text(path)
            updated, replaced = replace_first_four_adblocks(original, inv, seed=args.seed)
            if replaced == 0 or updated == original:
                continue

            changed_files += 1
            total_blocks += replaced

            if args.dry_run:
                print(f"[DRY RUN] {path}  (replaced {replaced} ad-block(s))")
                continue

            write_text(path, updated)
            print(f"[UPDATED] {path}  (replaced {replaced} ad-block(s))")

        except Exception as e:
            errors += 1
            print(f"[ERROR] {path}: {e}")

    if args.dry_run:
        print(f"\nDry run complete. Files that would change: {changed_files}. Ad-blocks replaced: {total_blocks}. Errors: {errors}.")
    else:
        print(f"\nDone. Files changed: {changed_files}. Ad-blocks replaced: {total_blocks}. Errors: {errors}.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
