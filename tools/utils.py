from __future__ import annotations

import json
import re
from dataclasses import dataclass
from html import unescape
from pathlib import Path
from typing import Optional, Tuple

from calculators_config import (
    BREADCRUMBS_CATEGORY_LINK_RE,
    CANONICAL_RE,
    CATEGORY_GRID_OPEN,
    CATEGORY_H1_RE,
    META_DESC_RE,
    TITLE_TAG_RE,
)


@dataclass(frozen=True)
class CalculatorRecord:
    title: str
    url: str
    category_slug: str
    category_name: str
    description: str
    calculator_slug: str
    source_path: Path


def read_text(path: Path) -> str:
    # Tolerate mixed line endings and odd encodings.
    return path.read_text(encoding="utf-8", errors="replace")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8", newline="\n")


def normalize_ws(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def strip_tags(s: str) -> str:
    return re.sub(r"<[^>]+>", "", s)


def html_text(s: str) -> str:
    return normalize_ws(unescape(strip_tags(s)))


def re_first(pattern: str, text: str, flags: int = re.DOTALL | re.IGNORECASE) -> Optional[str]:
    m = re.search(pattern, text, flags)
    if not m:
        return None
    return m.group(1)


def re_first_two(pattern: str, text: str, flags: int = re.DOTALL | re.IGNORECASE) -> Optional[Tuple[str, str]]:
    m = re.search(pattern, text, flags)
    if not m:
        return None
    return m.group(1), m.group(2)


def rel_url_from_canonical(canonical: str) -> str:
    # canonical like https://snapcalc.site/calculators/.../ -> /calculators/.../
    canonical = canonical.strip()
    if canonical.startswith("http://") or canonical.startswith("https://"):
        parts = canonical.split("/", 3)
        if len(parts) >= 4:
            return "/" + parts[3].lstrip("/")
        return "/"
    return canonical if canonical.startswith("/") else "/" + canonical


def slug_from_calc_path(calc_index_path: Path, calculators_dir: Path) -> Tuple[str, str]:
    # /calculators/<cat>/<calc>/index.html
    rel = calc_index_path.relative_to(calculators_dir)
    parts = list(rel.parts)
    if len(parts) < 3:
        raise ValueError(f"Unexpected calculator path: {calc_index_path}")
    return parts[0], parts[1]


def scan_calculator_index_files(calculators_dir: Path) -> list[Path]:
    if not calculators_dir.exists():
        return []
    return sorted(calculators_dir.glob("*/*/index.html"))


def scan_category_index_files(categories_dir: Path) -> list[Path]:
    if not categories_dir.exists():
        return []
    return sorted(categories_dir.glob("*/index.html"))


def build_category_name_map(categories_dir: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    for p in scan_category_index_files(categories_dir):
        slug = p.parent.name
        html = read_text(p)
        h1 = re_first(CATEGORY_H1_RE, html)
        if h1:
            out[slug] = html_text(h1)
    return out


def parse_calculator_page(
    index_path: Path,
    calculators_dir: Path,
    category_name_map: dict[str, str],
) -> Optional[CalculatorRecord]:
    raw = read_text(index_path)

    title = re_first(TITLE_TAG_RE, raw)
    title = html_text(title or "")

    desc = re_first(META_DESC_RE, raw)
    desc = html_text(desc or "")

    canonical = re_first(CANONICAL_RE, raw)
    if canonical:
        url = rel_url_from_canonical(canonical)
    else:
        cat_slug, calc_slug = slug_from_calc_path(index_path, calculators_dir)
        url = f"/calculators/{cat_slug}/{calc_slug}/"

    # Prefer breadcrumbs category link for both slug + name
    crumbs = re_first_two(BREADCRUMBS_CATEGORY_LINK_RE, raw)
    if crumbs:
        category_slug_from_breadcrumbs = crumbs[0].strip()
        category_name = html_text(crumbs[1])
    else:
        category_slug_from_breadcrumbs = ""
        category_slug_from_path, _ = slug_from_calc_path(index_path, calculators_dir)
        category_name = category_name_map.get(
            category_slug_from_path,
            category_slug_from_path.replace("-", " ").title(),
        )

    # Fallback title if missing
    if not title:
        h1 = re_first(r"<h1>\s*(.*?)\s*</h1>", raw)
        title = html_text(h1 or "")
    if not title:
        return None

    # Calc slug + category slug from path are authoritative for file placement
    category_slug_from_path, calc_slug = slug_from_calc_path(index_path, calculators_dir)

    # Keep URL and category slug consistent with path, but keep readable category name from breadcrumbs if present
    category_slug = category_slug_from_path
    if category_slug_from_breadcrumbs:
        # breadcrumbs name already captured; slug mismatch not used
        pass

    return CalculatorRecord(
        title=title,
        url=url,
        category_slug=category_slug,
        category_name=category_name,
        description=desc,
        calculator_slug=calc_slug,
        source_path=index_path,
    )


def build_aliases(title: str, calculator_slug: str, category_name: str) -> list[str]:
    # Keep this simple and deterministic.
    t = title.lower()
    t_clean = re.sub(r"[^a-z0-9\s]+", " ", t)
    t_clean = normalize_ws(t_clean)

    slug_words = calculator_slug.replace("-", " ").lower()
    slug_words = normalize_ws(slug_words)

    # Acronym from title words (skip trivial)
    words = [w for w in re.split(r"\s+", t_clean) if w and w not in {"and", "or", "the", "a", "an", "of", "to"}]
    acronym = "".join(w[0] for w in words)[:6]

    aliases: list[str] = []

    def add(x: str) -> None:
        x = normalize_ws(x.lower())
        if not x:
            return
        if x not in aliases:
            aliases.append(x)

    add(title)
    add(t_clean)
    add(slug_words)
    add(category_name + " " + t_clean)
    add(category_name + " " + slug_words)

    if "calculator" in t_clean:
        add(t_clean.replace(" calculator", ""))

    if acronym and len(acronym) >= 2:
        add(acronym)

    return aliases[:12]


def write_search_index_json(path: Path, records: list[CalculatorRecord]) -> None:
    data = []
    for r in records:
        data.append(
            {
                "title": r.title,
                "url": r.url,
                "category": r.category_name,
                "aliases": build_aliases(r.title, r.calculator_slug, r.category_name),
            }
        )
    content = json.dumps(data, ensure_ascii=False, indent=2)
    write_text(path, content + "\n")


def escape_html(s: str) -> str:
    # minimal HTML escaping for text nodes
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def make_category_tile_html(r: CalculatorRecord, indent: str = "          ") -> str:
    desc = (r.description or "").strip()
    if not desc:
        desc = f"Open {r.title}."
    return (
        f'{indent}<div class="category-item">\n'
        f'{indent}  <a href="{r.url}">\n'
        f'{indent}    <div class="category-item-title">{escape_html(r.title)}</div>\n'
        f'{indent}    <p class="category-item-desc">{escape_html(desc)}</p>\n'
        f"{indent}  </a>\n"
        f"{indent}</div>\n"
    )


def _find_matching_div_close(html: str, open_tag_end_index: int) -> int:
    """
    Return the index (in html) of the '<' that begins the closing </div> tag
    that matches the currently-open <div ...> whose '>' ended at open_tag_end_index.

    This is a real tag scanner (not regex counting), and skips:
    - comments <!-- ... -->
    - <script> ... </script>
    - <style> ... </style>
    """
    i = open_tag_end_index
    depth = 1
    n = len(html)

    def starts_with_ci(pos: int, s: str) -> bool:
        return html[pos : pos + len(s)].lower() == s.lower()

    while i < n:
        ch = html[i]
        if ch != "<":
            i += 1
            continue

        # Comments
        if starts_with_ci(i, "<!--"):
            end = html.find("-->", i + 4)
            if end == -1:
                # malformed comment; bail out safely
                return -1
            i = end + 3
            continue

        # Find end of tag
        gt = html.find(">", i + 1)
        if gt == -1:
            return -1

        tag_inner = html[i + 1 : gt].strip()
        tag_inner_l = tag_inner.lower()

        # Skip doctype and other declarations
        if tag_inner_l.startswith("!doctype") or tag_inner_l.startswith("!"):
            i = gt + 1
            continue

        # Extract tag name
        is_close = tag_inner_l.startswith("/")
        tag_body = tag_inner_l[1:].lstrip() if is_close else tag_inner_l
        tag_name = ""
        for c in tag_body:
            if c.isalnum() or c in {"-", ":"}:
                tag_name += c
            else:
                break

        # Skip script/style blocks as raw text
        if not is_close and tag_name in {"script", "style"}:
            close_pat = f"</{tag_name}>"
            end_block = html.lower().find(close_pat, gt + 1)
            if end_block == -1:
                return -1
            i = end_block + len(close_pat)
            continue

        if tag_name == "div":
            if not is_close:
                # self-closing div is not valid HTML, but tolerate "<div ... />"
                if tag_inner_l.endswith("/"):
                    i = gt + 1
                    continue
                depth += 1
            else:
                depth -= 1
                if depth == 0:
                    return i  # index of '<' for matching </div>

        i = gt + 1

    return -1

def replace_category_grid(category_index_html: str, new_inner_html: str) -> str:
    """
    Replace ONLY the inner HTML of <div class="category-grid"> ... </div>.

    This implementation is tolerant of messy/unbalanced <div> tags inside the grid.
    It does NOT try to count nested <div> depth. Instead it:
      - finds the grid open tag
      - finds </main>
      - finds the last two </div> tags before </main>
      - treats the second-last </div> as the grid close tag
    """
    open_match = re.search(CATEGORY_GRID_OPEN, category_index_html, re.IGNORECASE)
    if not open_match:
        raise ValueError('Could not find <div class="category-grid"> in category page.')

    open_end = open_match.end()

    main_close = category_index_html.lower().find("</main>", open_end)
    if main_close == -1:
        raise ValueError("Could not find </main> after category-grid open.")

    between = category_index_html[open_end:main_close]

    # Find ALL closing div tags between grid open and </main>
    closes = list(re.finditer(r"(?is)</div\s*>", between))
    if len(closes) < 2:
        raise ValueError("Not enough </div> tags between category-grid and </main> to identify grid close.")

    # The last </div> closes the category-layout; the second-last closes category-grid
    grid_close_in_between = closes[-2].start()
    grid_close_abs = open_end + grid_close_in_between

    before = category_index_html[:open_end]
    after = category_index_html[grid_close_abs:]  # keep the grid closing </div> and everything after intact

    inner = "\n" + new_inner_html.rstrip() + "\n        "
    return before + inner + after

def rewrite_category_pages(categories_dir: Path, records: list[CalculatorRecord]) -> list[Path]:
    # Group calculators by category slug, then rewrite that category page's grid tiles.
    by_cat: dict[str, list[CalculatorRecord]] = {}
    for r in records:
        by_cat.setdefault(r.category_slug, []).append(r)

    touched: list[Path] = []
    for cat_slug, items in by_cat.items():
        cat_index = categories_dir / cat_slug / "index.html"
        if not cat_index.exists():
            continue

        items_sorted = sorted(items, key=lambda x: x.title.lower())
        tiles = "".join(make_category_tile_html(r) for r in items_sorted)

        page = read_text(cat_index)
        try:
            new_page = replace_category_grid(page, tiles)
        except Exception as e:
            print(f"\nERROR rewriting category page: {cat_index}")
            print(f"Reason: {e}\n")
            raise

        if new_page != page:
            write_text(cat_index, new_page)
            touched.append(cat_index)

    return touched
