from pathlib import Path
import webbrowser

# -----------------------
# CONFIG
# -----------------------
URL_FILE = Path.home() / "Desktop" / "snapcalc_extracted_urls.txt"
BATCH_SIZE = 10

# -----------------------
# LOAD URLS
# -----------------------
if not URL_FILE.exists():
    raise FileNotFoundError(f"URL file not found: {URL_FILE}")

urls = [
    line.strip()
    for line in URL_FILE.read_text(encoding="utf-8").splitlines()
    if line.strip()
]

total = len(urls)
print(f"Loaded {total} URLs")

# -----------------------
# OPEN IN BATCHES
# -----------------------
for i in range(0, total, BATCH_SIZE):
    batch = urls[i : i + BATCH_SIZE]

    print()
    print(f"Opening URLs {i + 1} to {min(i + BATCH_SIZE, total)}")

    for url in batch:
        webbrowser.open_new_tab(url)

    if i + BATCH_SIZE < total:
        input("Press ENTER to open the next batch...")

print()
print("All URLs opened.")
