#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import re
from pathlib import Path
from typing import Iterable, List, Tuple


DEFAULT_EXTS = [".html", ".htm"]
DEFAULT_EXCLUDE_DIRS = {".git", "node_modules", ".venv", "venv", "dist", "build", ".next", ".cache"}

KRISPCALL_HREF = "https://try.krispcall.com/0gka10ewdh15"
CLOUDTALK_HREF = "https://get.cloudtalk.io/gfwvqzdos1w2-1xtqvk"

KRISPCALL_KEY = "krispcall"
CLOUDTALK_KEY = "cloudtalk"

ANCHOR_BLOCK_RE = re.compile(r"(?is)<a\b[^>]*>.*?</a>")
HREF_ATTR_RE = re.compile(r'(?is)\bhref\s*=\s*(["\'])(.*?)\1')
CLASS_ATTR_RE = re.compile(r'(?is)\bclass\s*=\s*(["\'])(.*?)\1')
IMG_SRC_RE = re.compile(r'(?is)<img\b[^>]*\bsrc\s*=\s*(["\'])(.*?)\1')


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


def anchor_has_affiliate_class(anchor_html: str) -> bool:
    m = CLASS_ATTR_RE.search(anchor_html)
    if not m:
        return False
    classes = m.group(2).lower()
    return "affiliate-link" in classes


def desired_href_for_img_src(img_src: str) -> str | None:
    s = img_src.lower()
    if KRISPCALL_KEY in s:
        return KRISPCALL_HREF
    if CLOUDTALK_KEY in s:
        return CLOUDTALK_HREF
    return None


def replace_href(anchor_html: str, new_href: str) -> str:
    m = HREF_ATTR_RE.search(anchor_html)
    if not m:
        return anchor_html

    quote = m.group(1)
    old_href = m.group(2)
    if old_href == new_href:
        return anchor_html

    start, end = m.span(2)
    return anchor_html[:start] + new_href + anchor_html[end:]


def fix_content(html: str) -> Tuple[str, int]:
    fixes = 0

    def repl(m: re.Match) -> str:
        nonlocal fixes
        block = m.group(0)

        if not anchor_has_affiliate_class(block):
            return block

        href_m = HREF_ATTR_RE.search(block)
        img_m = IMG_SRC_RE.search(block)
        if not href_m or not img_m:
            return block

        current_href = href_m.group(2)
        img_src = img_m.group(2)

        desired = desired_href_for_img_src(img_src)
        if not desired:
            return block

        if current_href != desired:
            fixes += 1
            return replace_href(block, desired)

        return block

    new_html = ANCHOR_BLOCK_RE.sub(repl, html)
    return new_html, fixes


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Fix swapped KrispCall/CloudTalk affiliate hrefs by inspecting the <img src> keyword."
    )
    parser.add_argument("--root", default=".", help="Repo root. Default: current directory.")
    parser.add_argument(
        "--ext",
        default=",".join(DEFAULT_EXTS),
        help='Comma-separated extensions to scan. Default: ".html,.htm"',
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
    files_changed = 0
    total_fixes = 0

    for p in iter_files(root, exts, exclude_dirs):
        scanned += 1
        original = read_text(p)
        updated, fixes = fix_content(original)

        if fixes == 0 or updated == original:
            continue

        files_changed += 1
        total_fixes += fixes

        if args.dry_run:
            print(f"[DRY RUN] {p}  (href fixes: {fixes})")
        else:
            write_text(p, updated)
            print(f"[UPDATED] {p}  (href fixes: {fixes})")

    mode = "DRY RUN" if args.dry_run else "APPLIED"
    print("")
    print(f"{mode} complete.")
    print(f"Files scanned: {scanned}")
    print(f"Files changed: {files_changed}")
    print(f"Total href fixes: {total_fixes}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
