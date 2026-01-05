import argparse
import os
import random
from pathlib import Path
from typing import Iterable, List, Optional, Tuple


# ----------------------------
# SLOT CONTENT (as provided)
# ----------------------------

ADSTERRA_BLOCK = """<script>
atOptions = {
  'key' : '46d1518853679ded4bcb05a44dc473ed',
  'format' : 'iframe',
  'height' : 300,
  'width' : 300,
  'params' : {}
};
</script>
<script src="https://www.highperformanceformat.com/46d1518853679ded4bcb05a44dc473ed/invoke.js"></script>
"""

AMAZON_STATIC = {
    "href": "https://amzn.to/3NtbDRk",
    "img": "/assets/affiliates/amazon/shop-amazon/shop-amazon-now-01052026.jpg",
    "alt": "Shop online",
}

# Note: Using the URL + image paths exactly as you pasted them (even if folder naming feels swapped).
CLOUDTALK = {
    "href": "https://get.cloudtalk.io/gfwvqzdos1w2-1xtqvk",
    "img": "/assets/affiliates/krispcall/krispcall-1711.jpg",
    "alt": "CloudTalk",
}

KRISPCALL = {
    "href": "https://try.krispcall.com/0gka10ewdh15",
    "img": "/assets/affiliates/cloudtalk/cloudtalk-01052026.jpg",
    "alt": "KrispCall",
}

CLERK_1 = {
    "href": "https://www.amazon.com/Clerk-Financial-Thriller-Control-Collapse/dp/B0FBT234PL",
    "img": "/assets/affiliates/amazon/the-clerk/cover-12.12.10.58.jpg",
    "alt": "The Clerk book cover",
}

CLERK_2 = {
    "href": "https://www.amazon.com/Clerk-system-shadow-Someone-mapping-ebook/dp/B0FBX487S8",
    "img": "/assets/affiliates/amazon/the-clerk-2/cover-12.12.11.05.jpg",
    "alt": "The Clerk 2 book cover",
}


# ----------------------------
# FILE WALKER
# ----------------------------

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


# ----------------------------
# AD-BLOCK PARSING (div stack)
# ----------------------------

def find_ad_block_open_positions(text: str) -> List[int]:
    needle = '<div class="ad-block"'
    positions: List[int] = []
    start = 0
    while True:
        idx = text.find(needle, start)
        if idx == -1:
            break
        positions.append(idx)
        start = idx + len(needle)
    return positions


def find_tag_end(text: str, start_idx: int) -> int:
    gt = text.find(">", start_idx)
    if gt == -1:
        raise ValueError("Malformed HTML: missing '>' after ad-block opening tag.")
    return gt


def is_open_div_at(text: str, i: int) -> bool:
    if text.startswith("<div", i):
        # Ensure it's a tag boundary like "<div", "<div ", "<div>"
        if i + 4 < len(text):
            nxt = text[i + 4]
            return nxt in (" ", ">", "\n", "\r", "\t")
        return True
    return False


def is_close_div_at(text: str, i: int) -> bool:
    return text.startswith("</div", i)


def find_matching_close_div(text: str, open_tag_start: int) -> int:
    """
    Given the start index of '<div class="ad-block"...', find the index of the '>' of its matching closing </div>.
    Uses a simple stack scan for <div ...> and </div> tokens.
    """
    open_tag_end = find_tag_end(text, open_tag_start)
    i = open_tag_end + 1
    depth = 1

    while i < len(text):
        if is_open_div_at(text, i):
            # Skip over the open tag
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

    raise ValueError("Malformed HTML: could not find matching </div> for an ad-block.")


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


def build_image_anchor(href: str, img: str, alt: str) -> str:
    return f"""<a class="affiliate-link" href="{href}" target="_blank" rel="nofollow sponsored noopener">
  <img src="{img}" alt="{alt}">
</a>
"""


# ----------------------------
# MAIN TRANSFORM
# ----------------------------

def build_slot_blocks(rng: random.Random) -> List[str]:
    slot1 = ADSTERRA_BLOCK

    slot2_choice = rng.choice([CLOUDTALK, KRISPCALL])
    slot2 = build_image_anchor(slot2_choice["href"], slot2_choice["img"], slot2_choice["alt"])

    slot3_choice = rng.choice([CLERK_1, CLERK_2])
    slot3 = build_image_anchor(slot3_choice["href"], slot3_choice["img"], slot3_choice["alt"])

    slot4 = build_image_anchor(AMAZON_STATIC["href"], AMAZON_STATIC["img"], AMAZON_STATIC["alt"])

    return [slot1, slot2, slot3, slot4]


def replace_ad_block_inners(text: str, seed: Optional[int]) -> Tuple[str, int]:
    positions = find_ad_block_open_positions(text)
    if not positions:
        return text, 0

    # Only the first 4 ad-blocks get replaced (your 4 grid slots).
    # If a file has fewer than 4, we replace what exists and report it.
    positions = positions[:4]

    rng = random.Random(seed)
    slot_blocks = build_slot_blocks(rng)

    # Replace from the end backwards so indices stay valid
    replacements_done = 0
    out = text

    for k in range(len(positions) - 1, -1, -1):
        open_start = positions[k]
        open_end_gt = find_tag_end(out, open_start)
        close_end_gt = find_matching_close_div(out, open_start)

        # Inner content region is (open_end_gt+1) to (close_tag_start)
        # We need the start index of the closing tag, not just its '>'.
        # Re-find the closing tag start by scanning backwards from close_end_gt to the nearest "</div".
        close_tag_start = out.rfind("</div", 0, close_end_gt + 1)
        if close_tag_start == -1 or close_tag_start <= open_end_gt:
            raise ValueError("Malformed HTML while locating closing </div>.")

        base_indent = get_line_indent(out, open_start)
        inner_indent = base_indent + "  "

        new_inner = "\n" + indent_block(slot_blocks[k], inner_indent)

        out = out[: open_end_gt + 1] + new_inner + out[close_tag_start:]
        replacements_done += 1

    return out, replacements_done


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Replace the first 4 .ad-block inner contents per HTML file with: Adsterra, random SaaS, random book, Amazon static."
    )
    parser.add_argument(
        "--root",
        default=None,
        help="Project root directory to scan. Defaults to this script's directory.",
    )
    parser.add_argument(
        "--ext",
        default=".html,.htm",
        help='Comma-separated extensions to scan. Default: ".html,.htm".',
    )
    parser.add_argument(
        "--exclude-dirs",
        default=".git,node_modules,.venv,venv,dist,build,.next,.cache",
        help='Comma-separated directory names to skip.',
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show which files would change without writing.",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=12345,
        help="Random seed for Slot 2 and Slot 3 selection. Same seed gives repeatable results.",
    )

    args = parser.parse_args()

    root = Path(args.root).resolve() if args.root else Path(__file__).resolve().parent
    exts = [e.strip().lower() for e in args.ext.split(",") if e.strip()]
    exts = [e if e.startswith(".") else f".{e}" for e in exts]
    exclude_dirs = [d.strip() for d in args.exclude_dirs.split(",") if d.strip()]

    changed_files = 0
    total_replaced_blocks = 0

    for path in iter_files(root, exts, exclude_dirs):
        original = read_text(path)
        updated, replaced = replace_ad_block_inners(original, seed=args.seed)

        if replaced == 0 or updated == original:
            continue

        changed_files += 1
        total_replaced_blocks += replaced

        if args.dry_run:
            print(f"[DRY RUN] {path}  (replaced {replaced} ad-block(s))")
            continue

        write_text(path, updated)
        print(f"[UPDATED] {path}  (replaced {replaced} ad-block(s))")

    if args.dry_run:
        print(f"\nDry run complete. Files that would change: {changed_files}. Ad-blocks replaced: {total_replaced_blocks}.")
    else:
        print(f"\nDone. Files changed: {changed_files}. Ad-blocks replaced: {total_replaced_blocks}.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
