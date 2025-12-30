# temp_affiliates_disable.py
# Correctly disables affiliate blocks by wrapping the entire ad-block
# in a SINGLE HTML comment: <!-- ... -->
# Idempotent and safe to re-run.

from pathlib import Path
import re

AD_BLOCK_RE = re.compile(
    r'(<div\s+class="ad-block"[\s\S]*?</div>)',
    re.IGNORECASE
)

COMMENTED_RE = re.compile(
    r'<!--\s*(<div\s+class="ad-block"[\s\S]*?</div>)\s*-->',
    re.IGNORECASE
)

def disable_file(path: Path) -> bool:
    html = path.read_text(encoding="utf-8")

    # Skip if already disabled
    if COMMENTED_RE.search(html):
        return False

    def replacer(match):
        return f"<!--\n{match.group(1)}\n-->"

    new_html, count = AD_BLOCK_RE.subn(replacer, html)

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
        if disable_file(file):
            modified += 1
            print(f"DISABLED: {file}")

    print(f"\nScanned: {touched}")
    print(f"Modified: {modified}")
    print("Done.")

if __name__ == "__main__":
    main()
