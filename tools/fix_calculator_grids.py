#!/usr/bin/env python3
"""
SnapCalc calculator grid fixer

What it does:
- Finds calculator HTML files under: <root>/calculators/**/index.html
- Creates a timestamped backup folder under <root>
- Repairs malformed HTML where the <div class="page-grid"> is closed too early
  (common symptom: everything after row 1 stacks in a single centered column)

How it repairs (safest approach without rewriting content):
- Tokenizes only <div ...> and </div> tags (everything else is left untouched)
- Tracks a div-stack so it knows when a closing </div> would close .page-grid
- If a closing </div> would close .page-grid before 9 grid-slot blocks are opened,
  it skips that closing tag (the premature closure), allowing the remaining slots
  to stay inside the grid.

This intentionally avoids:
- Reformatting HTML
- Changing calculator UI, IDs, scripts, SEO, copy, or affiliate markup
- Reordering anything

Usage:
  Dry run (recommended first):
    python fix_calculator_grids.py --root "C:/path/to/site" --dry-run

  Apply changes:
    python fix_calculator_grids.py --root "C:/path/to/site" --apply

Notes:
- It only writes a file if it detects and fixes premature grid closure.
- It logs actions to: <root>/_snapcalc_grid_fix_log_YYYYMMDD_HHMMSS.json
"""

from __future__ import annotations

import argparse
import datetime as _dt
import json
import os
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Tuple


DIV_OPEN_RE = re.compile(r"<div\b[^>]*>", re.IGNORECASE)
DIV_CLOSE_RE = re.compile(r"</div\s*>", re.IGNORECASE)
DIV_TAG_RE = re.compile(r"(<div\b[^>]*>|</div\s*>)", re.IGNORECASE)

CLASS_ATTR_RE = re.compile(r"""\bclass\s*=\s*("([^"]*)"|'([^']*)')""", re.IGNORECASE)

PAGE_GRID_CLASS = "page-grid"
GRID_SLOT_CLASS = "grid-slot"
EXPECTED_SLOTS = 9


@dataclass
class FixResult:
    path: str
    changed: bool
    reason: str
    skipped_closings: int
    grid_slots_seen: int
    backup_path: Optional[str] = None


def _extract_class_list(div_open_tag: str) -> List[str]:
    """
    Extracts class names from an opening <div ...> tag.
    Returns a list of class tokens.
    """
    m = CLASS_ATTR_RE.search(div_open_tag)
    if not m:
        return []
    raw = m.group(2) if m.group(2) is not None else (m.group(3) or "")
    return [c for c in re.split(r"\s+", raw.strip()) if c]


def _fix_page_grid_premature_closure(html: str) -> Tuple[str, bool, int, int, str]:
    """
    Repairs premature closure of <div class="page-grid"> by skipping closing </div>
    tags that would close the page-grid container before EXPECTED_SLOTS grid-slot
    divs have been opened inside it.

    Returns: (new_html, changed, skipped_closings, grid_slots_seen, reason)
    """
    if PAGE_GRID_CLASS not in html or GRID_SLOT_CLASS not in html:
        return html, False, 0, 0, "No page-grid or grid-slot markers found."

    # Tokenize only div open/close tags, keep everything else untouched.
    parts = DIV_TAG_RE.split(html)
    # parts alternates: [text, tag, text, tag, ...] because of split with capture group.

    # Stack of div "types": "page-grid" or "other"
    div_stack: List[str] = []

    inside_page_grid = False
    grid_slots_seen = 0
    skipped_closings = 0

    out: List[str] = []

    # For better safety: only start applying the rule after we've actually entered a page-grid div.
    saw_page_grid = False

    for part in parts:
        if not part:
            continue

        if DIV_OPEN_RE.fullmatch(part):
            classes = _extract_class_list(part)
            is_page_grid = PAGE_GRID_CLASS in classes
            is_grid_slot = GRID_SLOT_CLASS in classes

            if is_page_grid:
                div_stack.append("page-grid")
                inside_page_grid = True
                saw_page_grid = True
                out.append(part)
                continue

            div_stack.append("other")
            if inside_page_grid and is_grid_slot:
                grid_slots_seen += 1

            out.append(part)
            continue

        if DIV_CLOSE_RE.fullmatch(part):
            if not div_stack:
                # Unbalanced close, keep it (do not attempt to "fix" beyond requested scope)
                out.append(part)
                continue

            top = div_stack[-1]

            if top == "page-grid":
                # This close would end the page-grid container.
                if saw_page_grid and grid_slots_seen < EXPECTED_SLOTS:
                    # Premature closure: skip it.
                    skipped_closings += 1
                    # Do NOT pop stack, since we didn't emit the closing tag.
                    continue

                # Otherwise, allow closure.
                div_stack.pop()
                inside_page_grid = any(x == "page-grid" for x in div_stack)
                out.append(part)
                continue

            # Normal close
            div_stack.pop()
            inside_page_grid = any(x == "page-grid" for x in div_stack)
            out.append(part)
            continue

        # Non-div text segment
        out.append(part)

    new_html = "".join(out)
    changed = skipped_closings > 0 and new_html != html

    if not changed:
        if saw_page_grid:
            return html, False, 0, grid_slots_seen, "No premature page-grid closure detected."
        return html, False, 0, grid_slots_seen, "No page-grid detected."

    return new_html, True, skipped_closings, grid_slots_seen, "Skipped premature </div> closures that would end page-grid early."


def _discover_calculator_index_files(root: Path) -> List[Path]:
    """
    Returns <root>/calculators/**/index.html
    """
    calculators_dir = root / "calculators"
    if not calculators_dir.exists():
        return []
    return sorted(calculators_dir.rglob("index.html"))


def _make_backup_root(root: Path) -> Path:
    ts = _dt.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_root = root / f"_snapcalc_backup_calculators_{ts}"
    backup_root.mkdir(parents=True, exist_ok=False)
    return backup_root


def _backup_file(root: Path, backup_root: Path, file_path: Path) -> Path:
    rel = file_path.relative_to(root)
    dest = backup_root / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(file_path, dest)
    return dest


def main() -> int:
    parser = argparse.ArgumentParser(description="Fix premature .page-grid closure in SnapCalc calculator pages.")
    parser.add_argument("--root", required=True, help="Path to the site root (the folder that contains /calculators).")
    parser.add_argument("--dry-run", action="store_true", help="Scan and report only. No backups, no writes.")
    parser.add_argument("--apply", action="store_true", help="Create backups and write fixes to disk.")
    args = parser.parse_args()

    root = Path(args.root).expanduser().resolve()

    if not root.exists():
        print(f"ERROR: Root path does not exist: {root}")
        return 2

    if args.apply and args.dry_run:
        print("ERROR: Use either --dry-run or --apply, not both.")
        return 2

    if not args.apply and not args.dry_run:
        print("ERROR: Choose one: --dry-run or --apply")
        return 2

    targets = _discover_calculator_index_files(root)
    if not targets:
        print(f"No calculator index files found under: {root / 'calculators'}")
        return 0

    ts = _dt.datetime.now().strftime("%Y%m%d_%H%M%S")
    log_path = root / f"_snapcalc_grid_fix_log_{ts}.json"

    backup_root: Optional[Path] = None
    if args.apply:
        backup_root = _make_backup_root(root)
        print(f"Backup folder created at: {backup_root}")

    results: List[FixResult] = []

    for fp in targets:
        try:
            original = fp.read_text(encoding="utf-8", errors="replace")
        except Exception as e:
            results.append(FixResult(str(fp), False, f"Read error: {e}", 0, 0))
            continue

        fixed, changed, skipped, slots_seen, reason = _fix_page_grid_premature_closure(original)

        if not changed:
            results.append(FixResult(str(fp), False, reason, skipped, slots_seen))
            continue

        if args.dry_run:
            results.append(FixResult(str(fp), True, f"DRY RUN: {reason}", skipped, slots_seen))
            continue

        # apply mode: backup then write
        assert backup_root is not None

        try:
            backup_dest = _backup_file(root, backup_root, fp)
        except Exception as e:
            results.append(FixResult(str(fp), False, f"Backup error: {e}", skipped, slots_seen))
            continue

        try:
            fp.write_text(fixed, encoding="utf-8", errors="strict")
        except Exception as e:
            # If write fails, restore from backup immediately
            try:
                shutil.copy2(backup_dest, fp)
            except Exception:
                pass
            results.append(FixResult(str(fp), False, f"Write error (restored from backup if possible): {e}", skipped, slots_seen, str(backup_dest)))
            continue

        results.append(FixResult(str(fp), True, reason, skipped, slots_seen, str(backup_dest)))

    # Summaries
    changed = [r for r in results if r.changed]
    unchanged = [r for r in results if not r.changed]

    print("")
    print(f"Scanned: {len(results)} files")
    print(f"Would change / changed: {len(changed)} files")
    print(f"Unchanged: {len(unchanged)} files")

    # Write log
    try:
        payload = {
            "root": str(root),
            "mode": "apply" if args.apply else "dry-run",
            "backup_root": str(backup_root) if backup_root else None,
            "scanned": len(results),
            "changed_count": len(changed),
            "unchanged_count": len(unchanged),
            "results": [r.__dict__ for r in results],
        }
        log_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        print(f"Log written to: {log_path}")
    except Exception as e:
        print(f"WARNING: Failed to write log: {e}")

    # In apply mode, show backup location again
    if args.apply and backup_root:
        print(f"Backup location: {backup_root}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
