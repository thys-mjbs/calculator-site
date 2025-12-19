from __future__ import annotations

import json
import re
from dataclasses import dataclass
from html import unescape
from pathlib import Path
from typing import Iterable, Optional, Tuple

from calculators_config import (
    BREADCRUMBS_CATEGORY_LINK_RE,
    CANONICAL_RE,
    CATEGORY_GRID_CLOSE,
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
        # find first "/" after domain
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
        category_slug = crumbs[0].strip()
        category_name = html_text(crumbs[1])
    else:
        category_slug, calc_slug = slug_from_calc_path(index_path, calculators_dir)
        category_name = category_name_map.get(category_slug, category_slug.replace("-", " ").title())

    # Fallback title if missing
    if not title:
        # try <h1>
        h1 = re_first(r"<h1>\s*(.*?)\s*</h1>", raw)
        title = html_text(h1 or "")
    if not title:
        return None

    # Calc slug from path (authoritative for slug)
    category_slug_from_path, calc_slug = slug_from_calc_path(index_path, calculators_dir)

    # If breadcrumbs slug differs, keep path for URL consistency but keep readable category name from crumbs
    category_slug = category_slug_from_path

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

    aliases = []
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

    # Useful partials
    if "calculator" in t_clean:
        add(t_clean.replace(" calculator", ""))
    if acronym and len(acronym) >= 2:
        add(acronym)

    # Cap for size control
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
    # Stable output, pretty, but not huge
    content = json.dumps(data, ensure_ascii=False, indent=2)
    write_text(path, content + "\n")


def make_category_tile_html(r: CalculatorRecord, indent: str = "          ") -> str:
    # Matches your existing structure: category-item -> a -> title div + p
    desc = r.description.strip()
    if not desc:
        desc = f"Open {r.title}."
    return (
        f"{indent}<div class=\"category-item\">\n"
        f"{indent}  <a href=\"{r.url}\">\n"
        f"{indent}    <div class=\"category-item-title\">{escape_html(r.title)}</div>\n"
        f"{indent}    <p class=\"category-item-desc\">{escape_html(desc)}</p>\n"
        f"{indent}  </a>\n"
        f"{indent}</div>\n"
    )


def escape_html(s: str) -> str:
    # minimal HTML escaping for text nodes
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def replace_category_grid(category_index_html: str, new_inner_html: str) -> str:
    # Replace only inside: <div class="category-grid"> ... </div>
    # Keep outer wrapper intact.
    open_match = re.search(CATEGORY_GRID_OPEN, category_index_html, re.IGNORECASE)
    if not open_match:
        raise ValueError("Could not find <div class=\"category-grid\"> in category page.")

    start = open_match.end()
    # Find the matching closing </div> for that grid div in a simple but safe way:
    # We'll locate the first </div> after the grid open that closes the grid by counting div depth.
    tail = category_index_html[start:]
    div_open_re = re.compile(r"<div\b", re.IGNORECASE)
    div_close_re = re.compile(r"</div\s*>", re.IGNORECASE)

    depth = 1
    i = 0
    while i < len(tail):
        next_open = div_open_re.search(tail, i)
        next_close = div_close_re.search(tail, i)

        if not next_close:
            break

        if next_open and next_open.start() < next_close.start():
            depth += 1
            i = next_open.end()
            continue

        # close
        depth -= 1
        i = next_close.end()
        if depth == 0:
            # i is end of the grid closing </div>
            end = start + (next_close.start())  # position of that closing tag start
            end_close = start + i               # end of closing tag
            before = category_index_html[:start]
            after = category_index_html[end_close:]
            # preserve original indentation around inner HTML
            inner = "\n" + new_inner_html.rstrip() + "\n        "
            return before + inner + after

    raise ValueError("Could not safely find closing </div> for category-grid.")


def rewrite_category_pages(categories_dir: Path, records: list[CalculatorRecord]) -> list[Path]:
    # Group calculators by category slug, then rewrite that category page's grid tiles.
    by_cat: dict[str, list[CalculatorRecord]] = {}
    for r in records:
        by_cat.setdefault(r.category_slug, []).append(r)

    touched: list[Path] = []
    for cat_slug, items in by_cat.items():
        cat_index = categories_dir / cat_slug / "index.html"
        if not cat_index.exists():
            # Skip silently (no page to rewrite)
            continue

        items_sorted = sorted(items, key=lambda x: x.title.lower())

        tiles = "".join(make_category_tile_html(r) for r in items_sorted)
        page = read_text(cat_index)
        new_page = replace_category_grid(page, tiles)

        if new_page != page:
            write_text(cat_index, new_page)
            touched.append(cat_index)

    return touched
