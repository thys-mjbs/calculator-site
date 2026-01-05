import os
import random
import re
from pathlib import Path

INVENTORY_PATH = Path(__file__).parent / "affiliate_inventory.txt"

ADBLOCK_RE = re.compile(
    r'(<div\s+class="ad-block"[^>]*>)(.*?)(</div>)',
    re.IGNORECASE | re.DOTALL,
)

IMG_RE = re.compile(r"<img\s", re.IGNORECASE)
SCRIPT_RE = re.compile(r"<script\s", re.IGNORECASE)
LINK_RE = re.compile(r"<a\s", re.IGNORECASE)


def parse_inventory(path: Path):
    sections = {}
    current = None

    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("[") and line.endswith("]"):
            current = line[1:-1]
            sections[current] = []
        elif current:
            sections[current].append(line)

    def parse_pipe(lines):
        out = []
        for l in lines:
            parts = [p.strip() for p in l.split("|")]
            if len(parts) >= 2:
                out.append({
                    "href": parts[0],
                    "img": parts[1],
                    "alt": parts[2] if len(parts) > 2 else "Sponsored content",
                })
        return out

    return {
        "ADSTERRA": "\n".join(sections["ADSTERRA_HTML"]).strip(),
        "AMAZON": {
            "href": sections["AMAZON_STATIC"][0].split("=")[1],
            "img": sections["AMAZON_STATIC"][1].split("=")[1],
            "alt": "Shop online",
        },
        "AFFILIATES": parse_pipe(sections["AFFILIATE_PROGRAMS"]),
        "BOOKS": parse_pipe(sections["BOOKS"]),
    }


def is_filled(inner: str) -> bool:
    return bool(
        IMG_RE.search(inner)
        or SCRIPT_RE.search(inner)
        or LINK_RE.search(inner)
    )


def build_img_block(item):
    return (
        f'<a class="affiliate-link" href="{item["href"]}" '
        f'target="_blank" rel="nofollow sponsored noopener">\n'
        f'  <img src="{item["img"]}" alt="{item["alt"]}">\n'
        f'</a>\n'
    )


def main():
    inv = parse_inventory(INVENTORY_PATH)
    rng = random.Random(12345)

    files_changed = 0
    blocks_filled = 0

    for path in Path(".").rglob("*.html"):
        text = path.read_text(encoding="utf-8", errors="replace")
        matches = list(ADBLOCK_RE.finditer(text))

        if not matches:
            continue

        new_text = text
        replaced = 0

        for i, m in enumerate(matches[:4]):
            open_tag, inner, close_tag = m.groups()

            if is_filled(inner):
                continue

            if i == 0:
                content = inv["ADSTERRA"]
            elif i == 1:
                content = build_img_block(rng.choice(inv["AFFILIATES"]))
            elif i == 2:
                content = build_img_block(rng.choice(inv["BOOKS"]))
            else:
                content = build_img_block(inv["AMAZON"])

            replacement = open_tag + "\n" + content + close_tag
            new_text = new_text.replace(m.group(0), replacement, 1)

            replaced += 1
            blocks_filled += 1

        if replaced > 0:
            path.write_text(new_text, encoding="utf-8")
            files_changed += 1

    print(
        f"Done.\n"
        f"Files changed: {files_changed}\n"
        f"Ad-blocks filled: {blocks_filled}"
    )


if __name__ == "__main__":
    main()
