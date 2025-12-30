import os
import re

# === CONFIG ===
ROOT_DIR = "."  # run from repo root
TARGET_FILENAME = "index.html"

CANONICAL_NAV = """<nav class="site-nav">
  <a href="/">Home</a>
  <a href="/#categories">Categories</a>
  <a href="/about.html">About</a>
  <a href="/methodology.html">Methodology</a>
  <a href="/accuracy.html">Accuracy</a>
  <a href="/contact.html">Contact</a>
</nav>"""

NAV_PATTERN = re.compile(
    r"<nav\s+class=[\"']site-nav[\"']>.*?</nav>",
    re.DOTALL | re.IGNORECASE,
)

# === RUN ===
changed_files = []

for root, _, files in os.walk(ROOT_DIR):
    for file in files:
        if file != TARGET_FILENAME:
            continue

        path = os.path.join(root, file)

        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        match = NAV_PATTERN.search(content)
        if not match:
            continue  # no site-nav, skip safely

        current_nav = match.group(0).strip()

        if current_nav.strip() == CANONICAL_NAV.strip():
            continue  # already correct

        new_content = (
            content[: match.start()]
            + CANONICAL_NAV
            + content[match.end() :]
        )

        with open(path, "w", encoding="utf-8") as f:
            f.write(new_content)

        changed_files.append(path)

# === REPORT ===
print("Header normalization complete.")
print(f"Files updated: {len(changed_files)}")

for f in changed_files:
    print(" -", f)
