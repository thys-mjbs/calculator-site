# temp_affiliates_enable.py
# Remove the HTML comment wrappers added by temp_affiliates_disable.py
# Safe to run multiple times (idempotent). Only touches calculators/**/index.html

from __future__ import annotations

from pathlib import Path

START_MARK = "<!-- AFFILIATES_DISABLED_START -->"
END_MARK = "<!-- AFFILIATES_DISABLED_END -->"

def enable_in_file(path: Path) -> bool:
    html = path.read_text(encoding="utf-8")
    if START_MARK not in html:
        return False

    # Remove only our exact markers (and the newlines immediately around them)
    html2 = html.replace(START_MARK + "\n", "")
    html2 = html2.replace("\n" + END_MARK, "")
    html2 = html2.replace(START_MARK, "")
    html2 = html2.replace(END_MARK, "")

    if html2 != html:
        path.write_text(html2, encoding="utf-8")
        return True
    return False

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
        if enable_in_file(f):
            changed += 1
            print(f"ENABLED: {f}")

    print("")
    print(f"Scanned: {touched} files")
    print(f"Modified: {changed} files")
    print("Done.")

if __name__ == "__main__":
    main()
