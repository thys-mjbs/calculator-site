from __future__ import annotations

import re
from pathlib import Path

# EDIT THIS IF YOUR G: PATH EVER CHANGES
COMBOS_ROOT = Path(r"G:\My Drive\MJBS Projects\Calculators\Affilliate Combos")

IMG_SRC_RE = re.compile(r"^(Slot\s+[1-4]\s+Image Src:\s*)(.+?)\s*$", re.IGNORECASE)

def normalize_image_src(value: str) -> str:
    v = value.strip().strip('"').strip("'")

    # If someone accidentally used a Windows path, leave it alone (we do not want that).
    if re.match(r"^[A-Za-z]:\\", v):
        return v

    # If it's already correct, keep it.
    if v.startswith("/assets/"):
        return v

    # Common mistakes: "assets/..." or " /assets/..." or "assets\..."
    v = v.replace("\\", "/").lstrip()

    if v.startswith("assets/"):
        return "/" + v

    # If they used something else, do not guess.
    return v

def normalize_file(path: Path) -> tuple[bool, int]:
    original = path.read_text(encoding="utf-8", errors="replace").splitlines(True)
    changed = False
    fixes = 0
    out_lines: list[str] = []

    for line in original:
        m = IMG_SRC_RE.match(line.rstrip("\n").rstrip("\r"))
        if not m:
            out_lines.append(line)
            continue

        prefix, raw_val = m.group(1), m.group(2)
        new_val = normalize_image_src(raw_val)

        if new_val != raw_val.strip():
            changed = True
            fixes += 1

        newline = "\n"
        if line.endswith("\r\n"):
            newline = "\r\n"
        out_lines.append(f"{prefix}{new_val}{newline}")

    if changed:
        backup = path.with_suffix(path.suffix + ".bak")
        if not backup.exists():
            backup.write_text("".join(original), encoding="utf-8")
        path.write_text("".join(out_lines), encoding="utf-8")

    return changed, fixes

def main() -> int:
    if not COMBOS_ROOT.exists():
        print(f"ERROR: combos root not found: {COMBOS_ROOT}")
        return 1

    files = sorted(COMBOS_ROOT.rglob("Variant *.txt"))
    changed_files = 0
    total_fixes = 0
    errors = 0

    for f in files:
        try:
            changed, fixes = normalize_file(f)
            if changed:
                changed_files += 1
                total_fixes += fixes
        except Exception as e:
            errors += 1
            print(f"ERROR: {f} -> {e}")

    print("Affiliate combo normalize complete.")
    print(f"- Files scanned: {len(files)}")
    print(f"- Files changed: {changed_files}")
    print(f"- Image src fixes: {total_fixes}")
    print(f"- Errors: {errors}")
    print("(Backups saved as .bak next to any changed file.)")
    return 0 if errors == 0 else 2

if __name__ == "__main__":
    raise SystemExit(main())
