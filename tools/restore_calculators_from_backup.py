import argparse
import os
import shutil
from pathlib import Path
from typing import Iterable, List, Tuple


def iter_files(root: Path, exclude_dirs: List[str]) -> Iterable[Path]:
    exclude = {d.strip().lower() for d in exclude_dirs if d.strip()}
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d.lower() not in exclude]
        for name in filenames:
            yield Path(dirpath) / name


def rel_to(path: Path, base: Path) -> Path:
    return path.resolve().relative_to(base.resolve())


def copy_tree_files(src_root: Path, dst_root: Path, safety_root: Path, dry_run: bool) -> Tuple[int, int, int]:
    copied = 0
    skipped = 0
    backed_up = 0

    for src in iter_files(src_root, exclude_dirs=[".git", "node_modules", ".venv", "venv", "dist", "build"]):
        if src.is_dir():
            continue

        rel = rel_to(src, src_root)
        dst = dst_root / rel

        # Only restore HTML/HTM files (safe scope)
        if src.suffix.lower() not in (".html", ".htm"):
            continue

        # If destination exists, back it up first
        if dst.exists():
            safety_path = safety_root / rel
            if not dry_run:
                safety_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(dst, safety_path)
            backed_up += 1

        # Copy restored file in place
        if not dry_run:
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
        copied += 1

    return copied, backed_up, skipped


def main() -> int:
    parser = argparse.ArgumentParser(description="Restore /calculators HTML files from a backup folder safely.")
    parser.add_argument(
        "--backup-calculators",
        default=r"C:\Users\MBenson\Documents\GitHub\calculator-site\tools\_normalize_main_backup\calculators",
        help="Backup calculators folder path.",
    )
    parser.add_argument(
        "--project-root",
        default=".",
        help="Project root (run from project root and keep default).",
    )
    parser.add_argument("--dry-run", action="store_true", help="Preview actions without writing files.")
    args = parser.parse_args()

    project_root = Path(args.project_root).resolve()
    backup_calculators = Path(args.backup_calculators).resolve()

    live_calculators = project_root / "calculators"
    safety_backup = project_root / "tools" / "_restore_safety_backup" / "calculators"

    if not backup_calculators.exists():
        raise SystemExit(f"Backup calculators folder not found: {backup_calculators}")
    if not live_calculators.exists():
        # Create if missing
        if not args.dry_run:
            live_calculators.mkdir(parents=True, exist_ok=True)

    if not args.dry_run:
        safety_backup.mkdir(parents=True, exist_ok=True)

    copied, backed_up, skipped = copy_tree_files(
        src_root=backup_calculators,
        dst_root=live_calculators,
        safety_root=safety_backup,
        dry_run=args.dry_run,
    )

    if args.dry_run:
        print(f"[DRY RUN] Would restore {copied} HTML files into: {live_calculators}")
        print(f"[DRY RUN] Would safety-backup {backed_up} existing live files into: {safety_backup}")
    else:
        print(f"Done. Restored {copied} HTML files into: {live_calculators}")
        print(f"Safety backup created for {backed_up} files in: {safety_backup}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
