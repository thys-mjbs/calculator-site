from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Paths:
    repo_root: Path
    calculators_dir: Path
    categories_dir: Path
    search_index_path: Path


def get_paths(repo_root: Path) -> Paths:
    return Paths(
        repo_root=repo_root,
        calculators_dir=repo_root / "calculators",
        categories_dir=repo_root / "categories",
        search_index_path=repo_root / "search-index.json",
    )


# Category page rewrite boundary
CATEGORY_GRID_OPEN = r'<div\s+class="category-grid"\s*>'
CATEGORY_GRID_CLOSE = r"</div>"

# Calculator page parsing
TITLE_TAG_RE = r"<title>\s*(.*?)\s*</title>"
META_DESC_RE = r'<meta\s+name="description"\s+content="([^"]*)"\s*/?>'
CANONICAL_RE = r'<link\s+rel="canonical"\s+href="([^"]+)"\s*/?>'

# Breadcrumbs category link (preferred authority)
# Example:
# <nav class="breadcrumbs"> ... <a href="/categories/business-accounting/">Business &amp; Accounting</a> ...
BREADCRUMBS_CATEGORY_LINK_RE = (
    r'<nav\s+class="breadcrumbs"[^>]*>.*?'
    r'<a\s+href="/categories/([^/]+)/"\s*>(.*?)</a>.*?'
    r"</nav>"
)

# Category page category name (fallback authority)
CATEGORY_H1_RE = r"<h1>\s*(.*?)\s*</h1>"
