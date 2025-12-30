# temp_affiliates_enable.py
# Re-enables affiliate blocks by removing the single HTML comment
# wrapper added by temp_affiliates_disable.py
# Idempotent and safe to re-run.

from pathlib import Path
import re

COMMENTED_RE = re.compile(
    r'<!--\s*(<div\s+class="ad-block"[\s\S]*?</div>)\s*-->',
    re.IGNORECASE
)

def enable_file(path: Path) -> bool:
    html = path.read_text(encoding="utf-8")

    new_html, count = COMMENTED_RE.subn(r"\1", html)

    if count > 0:
        path.write_text(new_html, encoding="utf-8")
        return True

    return False

def main():
    tools_dir = Path(__file__).resolve().parent
    repo_root = tools_dir.parent
    calculators = repo_root / "calculators"

    touched = 0
    modified = 0

    for file in calculators.rglob("index.html"):
        touched += 1
        if enable_file(file):
            modified += 1
            print(f"ENABLED: {file}")

    print(f"\nScanned: {touched}")
    print(f"Modified: {modified}")
    print("Done.")

if __name__ == "__main__":
    main()
