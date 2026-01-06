#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List


DEFAULT_RULES_PATH = Path(__file__).parent / "find_replace_rules.txt"
DEFAULT_EXTS = [".html", ".htm", ".css", ".js"]
DEFAULT_EXCLUDE_DIRS = {".git", "node_modules", ".venv", "venv", "dist", "build", ".next", ".cache"}


@dataclass(frozen=True)
class Rule:
    name: str
    find: str
    replace: str


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


def parse_rules(text: str) -> List[Rule]:
    """
    Parses rules from blocks like:

    [RULE]
    NAME=Something
    [FIND]
    ...
    [/FIND]
    [REPLACE]
    ...
    [/REPLACE]
    [/RULE]

    Multiple rules can be separated by "----" but that is optional.
    """
    lines = text.splitlines()

    rules: List[Rule] = []
    i = 0
    n = len(lines)

    def collect_until(end_tag: str, start_index: int) -> tuple[str, int]:
        buf: List[str] = []
        j = start_index
        while j < n:
            if lines[j].strip() == end_tag:
                return "\n".join(buf), j + 1
            buf.append(lines[j])
            j += 1
        raise ValueError(f"Missing closing tag: {end_tag}")

    while i < n:
        line = lines[i].strip()

        if not line or line.startswith("#") or line == "----":
            i += 1
            continue

        if line != "[RULE]":
            i += 1
            continue

        name = "Unnamed rule"
        find = None
        replace = None

        i += 1
        while i < n:
            cur = lines[i].strip()

            if cur.startswith("NAME="):
                name = cur.split("=", 1)[1].strip()
                i += 1
                continue

            if cur == "[FIND]":
                find_block, i = collect_until("[/FIND]", i + 1)
                find = find_block
                continue

            if cur == "[REPLACE]":
                replace_block, i = collect_until("[/REPLACE]", i + 1)
                replace = replace_block
                continue

            if cur == "[/RULE]":
                i += 1
                break

            i += 1

        if find is None or replace is None:
            raise ValueError(f"Rule '{name}' missing [FIND] or [REPLACE] block.")

        rules.append(Rule(name=name, find=find, replace=replace))

    return rules


def apply_rules(content: str, rules: List[Rule]) -> tuple[str, int, List[str]]:
    """
    Applies rules sequentially. Returns:
    - new_content
    - total_replacements (count of rules that triggered at least once)
    - list of rule names that triggered
    """
    new = content
    triggered: List[str] = []
    triggers_count = 0

    for r in rules:
        if r.find in new:
            new2 = new.replace(r.find, r.replace)
            if new2 != new:
                new = new2
                triggered.append(r.name)
                triggers_count += 1

    return new, triggers_count, triggered


def main() -> int:
    parser = argparse.ArgumentParser(description="Generic repo-wide find/replace runner for SnapCalc.")
    parser.add_argument("--root", default=".", help="Repo root to scan. Default: current directory.")
    parser.add_argument(
        "--rules",
        default=str(DEFAULT_RULES_PATH),
        help="Path to rules file. Default: tools/find_replace_rules.txt",
    )
    parser.add_argument(
        "--ext",
        default=",".join(DEFAULT_EXTS),
        help='Comma-separated file extensions to scan. Default: ".html,.htm,.css,.js"',
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
    rules_path = Path(args.rules).resolve()

    if not rules_path.exists():
        print(f"ERROR: Rules file not found: {rules_path}")
        return 2

    exts = [e.strip().lower() for e in args.ext.split(",") if e.strip()]
    exts = [e if e.startswith(".") else f".{e}" for e in exts]
    exclude_dirs = {d.strip() for d in args.exclude_dirs.split(",") if d.strip()}

    rules = parse_rules(read_text(rules_path))
    if not rules:
        print("ERROR: No rules found in rules file.")
        return 2

    scanned = 0
    changed_files = 0
    total_rule_triggers = 0

    for p in iter_files(root, exts, exclude_dirs):
        scanned += 1
        original = read_text(p)
        updated, triggers_count, triggered_names = apply_rules(original, rules)

        if updated == original:
            continue

        changed_files += 1
        total_rule_triggers += triggers_count

        if args.dry_run:
            print(f"[DRY RUN] {p}  (rules triggered: {', '.join(triggered_names)})")
        else:
            write_text(p, updated)
            print(f"[UPDATED] {p}  (rules triggered: {', '.join(triggered_names)})")

    mode = "DRY RUN" if args.dry_run else "APPLIED"
    print("")
    print(f"{mode} complete.")
    print(f"Rules loaded: {len(rules)}")
    print(f"Files scanned: {scanned}")
    print(f"Files changed: {changed_files}")
    print(f"Rule triggers (file-level): {total_rule_triggers}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
