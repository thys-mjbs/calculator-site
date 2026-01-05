import argparse
import os
from pathlib import Path
from typing import Iterable, List, Tuple


# These wrappers must be removed, but the inner HTML must remain.
START_TOKENS = [
    "<!--",
    "<!-- AFFILIATES_DISABLED_START -->",
    "<!-- AFFILIATES_DISABLED_START",
]

END_TOKENS = [
    "AFFILIATES_DISABLED_END -->",
    "<!-- AFFILIATES_DISABLED_END -->",
    "<!-- AFFILIATES_DISABLED_END",
    "-->",
]


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


def strip_affiliate_wrappers(text: str) -> Tuple[str, int]:
    """
    Removes ONLY the wrapper/comment lines shown in the user's example, leaving the inner HTML intact.

    Typical pattern (but may vary in count):
      <!--
      <!-- AFFILIATES_DISABLED_START -->
      <!-- AFFILIATES_DISABLED_START -->
      <!-- AFFILIATES_DISABLED_START
      ... inner html ...
      AFFILIATES_DISABLED_END -->
      <!-- AFFILIATES_DISABLED_END -->
      <!-- AFFILIATES_DISABLED_END -->
      -->
    """
    lines = text.splitlines(keepends=True)
    out: List[str] = []
    removed = 0

    for line in lines:
        s = line.strip()

        # Remove these wrapper lines wherever they appear
        if s == "<!--":
            removed += 1
            continue

        if s == "-->":
            removed += 1
            continue

        # Any START wrapper line (exact or prefix forms)
        if s == "<!-- AFFILIATES_DISABLED_START -->":
            removed += 1
            continue
        if s.startswith("<!-- AFFILIATES_DISABLED_START"):
            removed += 1
            continue

        # Any END wrapper line (both bare and commented variants)
        if s == "AFFILIATES_DISABLED_END -->":
            removed += 1
            continue
        if s == "<!-- AFFILIATES_DISABLED_END -->":
            removed += 1
            continue
        if s.startswith("<!-- AFFILIATES_DISABLED_END"):
            removed += 1
            continue

        out.append(line)

    return "".join(out), removed


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Remove AFFILIATES_DISABLED wrappers from HTML files while keeping affiliate HTML intact."
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

    args = parser.parse_args()

    root = Path(args.root).resolve() if args.root else Path(__file__).resolve().parent
    exts = [e.strip().lower() for e in args.ext.split(",") if e.strip()]
    exts = [e if e.startswith(".") else f".{e}" for e in exts]
    exclude_dirs = [d.strip() for d in args.exclude_dirs.split(",") if d.strip()]

    changed_files = 0
    total_removed_lines = 0

    for path in iter_files(root, exts, exclude_dirs):
        original = read_text(path)
        updated, removed = strip_affiliate_wrappers(original)
        if removed == 0:
            continue

        changed_files += 1
        total_removed_lines += removed

        if args.dry_run:
            print(f"[DRY RUN] {path}  (remove {removed} wrapper lines)")
            continue

        write_text(path, updated)
        print(f"[UPDATED] {path}  (removed {removed} wrapper lines)")

    if args.dry_run:
        print(f"\nDry run complete. Files that would change: {changed_files}. Wrapper lines removed: {total_removed_lines}.")
    else:
        print(f"\nDone. Files changed: {changed_files}. Wrapper lines removed: {total_removed_lines}.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
