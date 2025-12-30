import os
import shutil
from bs4 import BeautifulSoup, Comment

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "calculators"))
BACKUP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "tools", "_affiliates_backup"))

AFF_CLASSES = {"ad-block", "affiliate-link", "affiliate-label", "affiliate-copy", "affiliate-cta"}
MARKER_PHRASES = {"AFFILIATES_DISABLED_START", "AFFILIATES_DISABLED_END"}

def ensure_parent_dir(path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)

def disable_file(path: str) -> int:
    with open(path, "r", encoding="utf-8") as f:
        html = f.read()

    soup = BeautifulSoup(html, "html.parser")

    # Remove existing marker comments
    removed_markers = 0
    for c in soup.find_all(string=lambda t: isinstance(t, Comment)):
        if any(p in str(c) for p in MARKER_PHRASES):
            c.extract()
            removed_markers += 1

    removed_nodes = 0

    # Remove any elements that have affiliate-related classes (drift-safe)
    for cls in list(AFF_CLASSES):
        for el in soup.select(f".{cls}"):
            el.decompose()
            removed_nodes += 1

    if removed_nodes == 0 and removed_markers == 0:
        return 0

    # Write back prettified HTML without changing too much structure
    out = str(soup)

    with open(path, "w", encoding="utf-8") as f:
        f.write(out)

    return removed_nodes + removed_markers

def main():
    if not os.path.isdir(BASE_DIR):
        print(f"ERROR: calculators folder not found: {BASE_DIR}")
        return

    files_changed = 0
    total_removed = 0

    for root, _, files in os.walk(BASE_DIR):
        for name in files:
            if name.lower() != "index.html":
                continue

            path = os.path.join(root, name)

            # Backup path mirrors calculators/...
            rel = os.path.relpath(path, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
            backup_path = os.path.join(BACKUP_DIR, rel)

            # Backup only once (first time we touch the file)
            if not os.path.exists(backup_path):
                ensure_parent_dir(backup_path)
                shutil.copy2(path, backup_path)

            removed = disable_file(path)
            if removed > 0:
                files_changed += 1
                total_removed += removed

    print(f"DISABLE DONE: files_changed={files_changed}, removed_items={total_removed}")
    print(f"BACKUPS SAVED TO: {BACKUP_DIR}")

if __name__ == "__main__":
    main()
