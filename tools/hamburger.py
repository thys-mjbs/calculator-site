import os

OLD_NAV = """<nav class="site-nav">
  <a href="/">Home</a>
  <a href="/#categories">Categories</a>
  <a href="/about.html">About</a>
  <a href="/methodology.html">Methodology</a>
  <a href="/accuracy.html">Accuracy</a>
  <a href="/hubs.html">Hubs</a>
  <a href="/contact.html">Contact</a>
</nav>"""

NEW_NAV = """<nav class="site-nav">
  <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false">
    ☰
  </button>
  <div class="nav-links">
    <a href="/">Home</a>
    <a href="/#categories">Categories</a>
    <a href="/about.html">About</a>
    <a href="/methodology.html">Methodology</a>
    <a href="/accuracy.html">Accuracy</a>
    <a href="/hubs.html">Hubs</a>
    <a href="/contact.html">Contact</a>
  </div>
</nav>"""

updated = 0
scanned = 0

for root, _, files in os.walk("."):
    for name in files:
        if not name.endswith(".html"):
            continue

        path = os.path.join(root, name)
        scanned += 1

        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        if OLD_NAV not in content:
            continue

        # backup
        with open(path + ".bak", "w", encoding="utf-8") as f:
            f.write(content)

        content = content.replace(OLD_NAV, NEW_NAV)

        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

        updated += 1
        print(f"UPDATED: {path}")

print("----------")
print(f"Scanned: {scanned}")
print(f"Updated: {updated}")
print("Done.")
