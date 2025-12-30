import os
import re
import shutil

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CALCS_DIR = os.path.join(PROJECT_ROOT, "calculators")
BACKUP_DIR = os.path.join(PROJECT_ROOT, "tools", "_comment_arrow_backup")

# Only remove standalone orphan markers on their own line (safe).
LINE_PATTERNS = [
    re.compile(r"(?m)^[ \t]*--&gt;[ \t]*\r?\n"),   # escaped -->
    re.compile(r"(?m)^[ \t]*-->[ \t]*\r?\n"),      # raw -->
    re.compile(r"(?m)^[ \t]*&lt;!--[ \t]*\r?\n"),  # escaped <!-- (rare)
    re.compile(r"(?m)^[ \t]*<!--[ \t]*\r?\n"),      # raw <!-- (rare)
]

def ensure_parent_dir(path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)

def clean_file(path: str) -> int:
    with open(path, "r", encoding="utf-8") as f:
        original = f.read()

    cleaned = original
    for pat in LINE_PATTERNS:
        cleaned = pat.sub("", cleaned)

    if cleaned == original:
        return 0

    # Backup once
    rel = os.path.relpath(path, PROJECT_ROOT)
    backup_path = os.path.join(BACKUP_DIR, rel)
    if not os.path.exists(backup_path):
        ensure_parent_dir(backup_path)
        shutil.copy2(path, backup_path)

    with open(path, "w", encoding="utf-8") as f:
        f.write(cleaned)

    # return number of removed lines (approx)
    removed = original.count("--&gt;") + original.count("-->")
    removed_after = cleaned.count("--&gt;") + cleaned.count("-->")
    return max(0, removed - removed_after)

def main():
    if not os.path.isdir(CALCS_DIR):
        print(f"ERROR: calculators folder not found: {CALCS_DIR}")
        return

    files_changed = 0
    total_removed = 0

    for root, _, files in os.walk(CALCS_DIR):
        for name in files:
            if name.lower() != "index.html":
                continue

            path = os.path.join(root, name)
            removed = clean_file(path)
            if removed > 0:
                files_changed += 1
                total_removed += removed

    print(f"FIX DONE: files_changed={files_changed}, removed_markers={total_removed}")
    if files_changed > 0:
        print(f"BACKUPS SAVED TO: {BACKUP_DIR}")

if __name__ == "__main__":
    main()
