#!/usr/bin/env python3
"""
SnapCalc: Remove Google AdSense loader script and insert Adsterra Social Bar script.

What this script does (ONLY):
- Removes <script ... src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?..."></script>
- Inserts <script src="https://pl28401807.effectivegatecpm.com/16/d6/13/16d6138b6d74e1866cb0f7a3960bfd77.js"></script>
  once per HTML file, immediately before </head> (if not already present)

Safety:
- Dry-run by default (no files changed)
- Creates .bak backups for changed files
- Only edits .html files
"""

import argparse
import re
from pathlib import Path

ADSENSE_SRC_SUBSTRING = "pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
ADSTERRA_SRC = "https://pl28401807.effectivegatecpm.com/16/d6/13/16d6138b6d74e1866cb0f7a3960bfd77.js"

# Match the AdSense loader script tag
ADSENSE_SCRIPT_TAG_RE = re.compile(
    r"""(?is)
    <script\b
        [^>]*\bsrc\s*=\s*["']
        [^"']*pagead2\.googlesyndication\.com/pagead/js/adsbygoogle\.js[^"']*
        ["']
        [^>]*>
        \s*</script\s*>
    """,
    re.VERBOSE,
)

# Match the Adsterra Social Bar script tag (to avoid duplicates)
ADSTERRA_SCRIPT_TAG_RE = re.compile(
    r'''(?is)
    <script\b[^>]*\bsrc\s*=\s*["']
    https://pl28401807\.effectivegatecpm\.com/16/d6/13/16d6138b6d74e1866cb0f7a3960bfd77\.js
    ["'][^>]*>\s*</script\s*>
    ''',
    re.VERBOSE,
)

HEAD_CLOSE_RE = re.compile(r"(?is)</head\s*>")

def normalize_newlines(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\r", "\n")

def insert_before_head_close(html: str, insertion: str) -> str:
    match = HEAD_CLOSE_RE.search(html)
    if not match:
        raise ValueError("No </head> tag found; cannot safely insert Adsterra script.")
    idx = match.start()
    return html[:idx] + insertion + html[idx:]

def process_file(path: Path) -> dict:
    original_bytes = path.read_bytes()

    try:
        original = original_bytes.decode("utf-8")
        encoding = "utf-8"
    except UnicodeDecodeError:
        original = original_bytes.decode("latin-1")
        encoding = "latin-1"

    html = normalize_newlines(original)

    # Remove AdSense script(s)
    html_removed, removed_count = ADSENSE_SCRIPT_TAG_RE.subn("", html)

    # Insert Adsterra if not present
    has_adsterra = bool(ADSTERRA_SCRIPT_TAG_RE.search(html_removed))
    inserted = False

    if not has_adsterra:
        insertion = f'\n<script src="{ADSTERRA_SRC}"></script>\n'
        html_removed = insert_before_head_close(html_removed, insertion)
        inserted = True

    changed = html_removed != html

    return {
        "path": path,
        "changed": changed,
        "removed_adsense_count": removed_count,
        "inserted_adsterra": inserted,
        "encoding": encoding,
        "new_content": html_removed if changed else None,
    }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "root",
        help="Root folder to scan (e.g., repo root). All .html files under this folder are processed.",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually write changes. Without this flag, runs in dry-run mode.",
    )
    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="Do not create .bak backups (not recommended).",
    )
    parser.add_argument(
        "--exclude",
        action="append",
        default=[],
        help="Exclude paths containing this substring (can be used multiple times).",
    )

    args = parser.parse_args()
    root = Path(args.root).resolve()

    if not root.exists() or not root.is_dir():
        raise SystemExit(f"Root folder does not exist or is not a directory: {root}")

    html_files = [p for p in root.rglob("*.html") if p.is_file()]

    def is_excluded(p: Path) -> bool:
        sp = str(p)
        return any(x in sp for x in args.exclude)

    total = 0
    changed_files = 0
    removed_total = 0
    inserted_total = 0

    for path in html_files:
        if is_excluded(path):
            continue

        total += 1
        result = process_file(path)

        if result["changed"]:
            changed_files += 1
            removed_total += result["removed_adsense_count"]
            inserted_total += (1 if result["inserted_adsterra"] else 0)

            rel = path.relative_to(root)
            print(f"\nCHANGED: {rel}")
            if result["removed_adsense_count"] > 0:
                print(f"  - Removed AdSense script tags: {result['removed_adsense_count']}")
            if result["inserted_adsterra"]:
                print("  - Inserted Adsterra script: yes")

            if args.apply:
                if not args.no_backup:
                    backup_path = path.with_suffix(path.suffix + ".bak")
                    if not backup_path.exists():
                        backup_path.write_bytes(path.read_bytes())

                path.write_text(result["new_content"], encoding=result["encoding"])

    mode = "APPLIED" if args.apply else "DRY-RUN"
    print(f"\n=== {mode} SUMMARY ===")
    print(f"Scanned .html files: {total}")
    print(f"Files changed: {changed_files}")
    print(f"Total AdSense script tags removed: {removed_total}")
    print(f"Total Adsterra scripts inserted: {inserted_total}")
    if not args.apply:
        print("No files were modified (dry-run).")

if __name__ == "__main__":
    main()
