# temp_affiliates_disable.py
# Wrap every <div class="ad-block"> ... </div> in HTML comments so affiliate blocks become invisible.
# Safe to run multiple times (idempotent). Only touches calculators/**/index.html

from __future__ import annotations

import os
from pathlib import Path

START_MARK = "<!-- AFFILIATES_DISABLED_START -->"
END_MARK = "<!-- AFFILIATES_DISABLED_END -->"

def find_ad_blocks(html: str) -> list[tuple[int, int]]:
    """
    Returns list of (start_idx, end_idx) ranges for each <div class="ad-block">...</div> block.
    Uses a simple tag-depth scan to handle nested divs inside ad-block.
    """
    lower = html.lower()
    results: list[tuple[int, int]] = []
    i = 0
    while True:
        start = lower.find('<div', i)
        if start == -1:
            break

        tag_end = lower.find('>', start)
        if tag_end == -1:
            break

        open_tag = lower[start:tag_end + 1]
        if 'class=' in open_tag and 'ad-block' in open_tag:
            # Ensure it's specifically a div with class containing "ad-block"
            # Quick check that class attribute includes ad-block token-ish
            # This is intentionally permissive since your HTML is consistent.
            depth = 0
            j = start
            while True:
                next_open = lower.find('<div', j)
                next_close = lower.find('</div', j)

                if next_close == -1:
                    # Malformed HTML, abort this match
                    break

                if next_open != -1 and next_open < next_close:
                    # Found an opening div
                    open_end = lower.find('>', next_open)
                    if open_end == -1:
                        break
                    depth += 1
                    j = open_end + 1
                else:
                    # Found a closing div
                    close_end = lower.find('>', next_close)
                    if close_end == -1:
                        break
                    depth -= 1
                    j = close_end + 1

                if depth == 0:
                    # j is the position after the closing </div>
                    results.append((start, j))
                    i = j
                    break
            else:
                i = tag_end + 1
        else:
            i = tag_end + 1

    return results

def is_already_disabled(html: str, start_idx: int) -> bool:
    # If the marker appears right before this block, we consider it already disabled
    window_start = max(0, start_idx - 200)
    window = html[window_start:start_idx]
    return START_MARK in window

def disable_in_file(path: Path) -> bool:
    html = path.read_text(encoding="utf-8")
    blocks = find_ad_blocks(html)
    if not blocks:
        return False

    # Apply from the end so indices stay valid
    changed = False
    for start, end in reversed(blocks):
        if is_already_disabled(html, start):
            continue
        block_html = html[start:end]
        wrapped = f"{START_MARK}\n{block_html}\n{END_MARK}"
        html = html[:start] + wrapped + html[end:]
        changed = True

    if changed:
        path.write_text(html, encoding="utf-8")
    return changed

def main() -> None:
    tools_dir = Path(__file__).resolve().parent
    repo_root = tools_dir.parent
    calculators_dir = repo_root / "calculators"

    if not calculators_dir.exists():
        raise SystemExit(f"ERROR: calculators folder not found at: {calculators_dir}")

    files = list(calculators_dir.rglob("index.html"))
    touched = 0
    changed = 0

    for f in files:
        touched += 1
        if disable_in_file(f):
            changed += 1
            print(f"DISABLED: {f}")

    print("")
    print(f"Scanned: {touched} files")
    print(f"Modified: {changed} files")
    print("Done.")

if __name__ == "__main__":
    main()
