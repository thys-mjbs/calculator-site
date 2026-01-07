#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import re
from pathlib import Path
from typing import Iterable, List, Tuple

DEFAULT_EXTS = [".html", ".htm"]
DEFAULT_EXCLUDE_DIRS = {".git", "node_modules", ".venv", "venv", "dist", "build", ".next", ".cache"}

TARGET_HREF = "/products.html"
TARGET_IMG_SRC = "/assets/site-imagery/products/utility-page-static-product.png"
TARGET_IMG_ALT = "Explore SnapCalc products"


def iter_files(root: Path, exts: List[str], exclude_dirs: set[str]) -> Iterable[Path]:
    exclude_lower = {d.lower() for d in exclude_dirs}
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d.lower() not in exclude_lower]
        for fn in filenames:
            p = Path(dirpath) / fn
            if p.suffix.lower() in exts:
                yield p


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def write_text(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")


def build_replacement_block(indent: str, newline: str) -> str:
    # Keep class="related-card" so it inherits existing tile styling,
    # but make the image fill the tile reliably.
    # Inline styles are minimal and only to guarantee correct rendering without CSS edits.
    return (
        f'<div class="grid-slot">{newline}'
        f'{indent}<a class="related-card" href="{TARGET_HREF}">{newline}'
        f'{indent}  <img src="{TARGET_IMG_SRC}" alt="{TARGET_IMG_ALT}" loading="lazy" '
        f'style="display:block;width:100%;height:auto;max-width:100%;" />{newline}'
        f'{indent}</a>{newline}'
        f"{indent}</div>"
    )


def replace_middle_related_card_triplet(content: str) -> Tuple[str, bool, str]:
    """
    Finds the first occurrence of THREE CONSECUTIVE related-card grid-slot blocks and
    replaces the middle one with an image CTA link to products.

    Returns: (updated_content, changed, note)
    """
    if TARGET_IMG_SRC in content:
        return content, False, "already_present"

    # Match ONE grid-slot that contains an <a class="related-card" ...>...</a>
    # We allow arbitrary whitespace and attributes.
    slot = r"""
        <div\s+class=["']grid-slot["']\s*>\s*
        <a\s+class=["']related-card["'][^>]*>\s*.*?\s*</a>\s*
        </div>
    """

    # Find THREE consecutive slots (this corresponds to your row of 3 related category cards)
    triplet_pat = re.compile(
        rf"(?P<all>(?P<s1>{slot})\s*(?P<s2>{slot})\s*(?P<s3>{slot}))",
        re.IGNORECASE | re.DOTALL | re.VERBOSE,
    )

    m = triplet_pat.search(content)
    if not m:
        return content, False, "no_triplet_found"

    s2 = m.group("s2")

    # Detect indentation used before the middle slot (best-effort)
    # Grab whitespace after the last newline before s2 starts.
    start_index = m.start("s2")
    newline = "\r\n" if "\r\n" in content else "\n"
    indent = ""
    last_nl = content.rfind("\n", 0, start_index)
    if last_nl != -1:
        # Collect spaces/tabs after that newline
        j = last_nl + 1
        while j < len(content) and content[j] in (" ", "\t"):
            indent += content[j]
            j += 1

    replacement = build_replacement_block(indent=indent, newline=newline)

    updated = content[: m.start("s2")] + replacement + content[m.end("s2") :]
    return updated, True, "replaced_middle_of_first_triplet"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Replace the middle related-card tile (in the first 3-card row) with a Products CTA image tile."
    )
    parser.add_argument("--root", default=".", help="Repo root to scan. Default: current directory.")
    parser.add_argument(
        "--ext",
        default=",".join(DEFAULT_EXTS),
        help='Comma-separated file extensions to scan. Default: ".html,.htm"',
    )
    parser.add_argument(
        "--exclude-dirs",
        default=",".join(sorted(DEFAULT_EXCLUDE_DIRS)),
        help="Comma-separated directory names to skip.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Report changes without writing.")
    parser.add_argument("--apply", action="store_true", help="Write changes to disk.")
    args = parser.parse_args()

    if args.dry_run and args.apply:
        print("ERROR: Use either --dry-run or --apply, not both.")
        return 2
    if not args.dry_run and not args.apply:
        print("ERROR: Choose one: --dry-run or --apply")
        return 2

    root = Path(args.root).resolve()
    exts = [e.strip().lower() for e in args.ext.split(",") if e.strip()]
    exts = [e if e.startswith(".") else f".{e}" for e in exts]
    exclude_dirs = {d.strip() for d in args.exclude_dirs.split(",") if d.strip()}

    scanned = 0
    changed_files = 0

    for p in iter_files(root, exts, exclude_dirs):
        scanned += 1
        original = read_text(p)
        updated, changed, note = replace_middle_related_card_triplet(original)

        if not changed:
            continue

        changed_files += 1
        if args.dry_run:
            print(f"[DRY RUN] {p}  (note: {note})")
        else:
            write_text(p, updated)
            print(f"[UPDATED] {p}  (note: {note})")

    mode = "DRY RUN" if args.dry_run else "APPLIED"
    print("")
    print(f"{mode} complete.")
    print(f"Files scanned: {scanned}")
    print(f"Files changed: {changed_files}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
