# tools/apply_chatgpt_bundle.py
from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Tuple


# ----------------------------
# Config
# ----------------------------
REPO_ROOT = Path(__file__).resolve().parents[1]
CALCULATORS_DIR = REPO_ROOT / "calculators"

# Accept either:
#   ## index.html
#   ### index.html
# and same for style.css + script.js
SECTION_RE = re.compile(
    r"(?m)^\s*#{2,3}\s*(index\.html|style\.css|script\.js)\s*$",
    re.IGNORECASE,
)

FENCED_BLOCK_RE = re.compile(
    r"```([a-zA-Z0-9_-]*)\s*\n(.*?)\n```",
    re.DOTALL,
)

# Canonical tag finder (tolerant)
CANONICAL_TAG_RE = re.compile(r"<link\b[^>]*>", re.IGNORECASE | re.DOTALL)
REL_CANONICAL_RE = re.compile(r"""\brel\s*=\s*["']canonical["']""", re.IGNORECASE)
HREF_CALC_RE = re.compile(
    r"""\bhref\s*=\s*["'](https?://[^"']+/calculators/([^/]+)/([^/]+)/?)["']""",
    re.IGNORECASE,
)

# Explicit slug fence (single-line slug)
SLUG_FENCE_RE = re.compile(
    r"```html\s*\n\s*([a-z0-9]+(?:-[a-z0-9]+)*)\s*\n```",
    re.IGNORECASE,
)


@dataclass
class CalcBundle:
    category_slug: str
    calc_slug: str
    index_html: str
    style_css: str
    script_js: str


def _strip_bom(text: str) -> str:
    return text.lstrip("\ufeff")


def _validate_slug(s: str) -> bool:
    return bool(re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", s))


def _extract_sections(raw: str) -> dict:
    """
    Returns dict like {"index.html": "...", "style.css": "...", "script.js": "..."}
    pulling the first fenced code block after each section heading.

    IMPORTANT: If a bundle contains multiple 'index.html' headings (it shouldn't),
    we take the FIRST one and ignore the rest to avoid silent overwrites.
    """
    out: dict = {}
    matches = list(SECTION_RE.finditer(raw))

    for i, m in enumerate(matches):
        fname = m.group(1).lower()

        # Only take the first occurrence within the bundle
        if fname in out:
            continue

        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(raw)
        chunk = raw[start:end].strip()

        fence = FENCED_BLOCK_RE.search(chunk)
        if not fence:
            continue

        code = fence.group(2)
        out[fname] = code.strip() + "\n"

    return out


def _infer_category_and_slug(index_html: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Reads canonical URL from index.html.
    Returns (category_slug, calc_slug, canonical_url) if found, else (None, None, None).
    """
    for tag_m in CANONICAL_TAG_RE.finditer(index_html):
        tag = tag_m.group(0)
        if not REL_CANONICAL_RE.search(tag):
            continue
        href_m = HREF_CALC_RE.search(tag)
        if not href_m:
            continue
        canonical_url = href_m.group(1)
        category_slug = href_m.group(2).strip()
        calc_slug = href_m.group(3).strip().rstrip("/")
        return category_slug, calc_slug, canonical_url
    return None, None, None


def _find_explicit_calc_slug(bundle_text: str) -> Optional[str]:
    """
    Finds the last ```html ... ``` slug fence in a bundle.
    We pick the LAST one to reduce false matches.
    """
    all_matches = list(SLUG_FENCE_RE.finditer(bundle_text))
    if not all_matches:
        return None
    return all_matches[-1].group(1).strip().lower()


def _rewrite_canonical_href(index_html: str, category_slug: str, new_calc_slug: str) -> Tuple[str, bool]:
    """
    Rewrite canonical href so that /calculators/<category>/<slug>/ matches new_calc_slug.
    Returns (updated_html, changed_flag).
    """
    changed = False

    def _replace_tag(match: re.Match) -> str:
        nonlocal changed
        tag = match.group(0)

        if not REL_CANONICAL_RE.search(tag):
            return tag

        href_m = HREF_CALC_RE.search(tag)
        if not href_m:
            return tag

        old_url = href_m.group(1)
        new_url = re.sub(
            r"(/calculators/)([^/]+)(/)([^/]+)(/?)$",
            rf"\1{category_slug}\3{new_calc_slug}/",
            old_url,
            flags=re.IGNORECASE,
        )

        if new_url != old_url:
            changed = True
            start, end = href_m.span(1)
            tag = tag[:start] + new_url + tag[end:]
        return tag

    updated = CANONICAL_TAG_RE.sub(_replace_tag, index_html)
    return updated, changed


def _split_into_bundles(all_text: str) -> List[str]:
    """
    Split the bundle file into multiple calculator bundles.

    A bundle starts at either:
      ## index.html
      ### index.html

    We slice by heading positions so we don't lose delimiters and we don't
    accidentally merge calculators when heading levels differ.
    """
    text = all_text.strip()
    if not text:
        return []

    start_re = re.compile(r"(?m)^\s*#{2,3}\s*index\.html\s*$", re.IGNORECASE)
    starts = [m.start() for m in start_re.finditer(text)]
    if not starts:
        return []

    bundles: List[str] = []
    for i, s in enumerate(starts):
        e = starts[i + 1] if i + 1 < len(starts) else len(text)
        chunk = text[s:e].strip()
        if chunk:
            bundles.append(chunk)
    return bundles


def write_calc(bundle: CalcBundle, dry_run: bool = False) -> Tuple[Path, int]:
    """
    Writes calculators/<category>/<slug>/{index.html,style.css,script.js}
    Returns (folder_path, files_written_count)
    """
    folder = CALCULATORS_DIR / bundle.category_slug / bundle.calc_slug
    files = {
        "index.html": bundle.index_html,
        "style.css": bundle.style_css,
        "script.js": bundle.script_js,
    }

    if dry_run:
        return folder, 3

    folder.mkdir(parents=True, exist_ok=True)

    written = 0
    for name, content in files.items():
        path = folder / name
        path.write_text(content, encoding="utf-8", newline="\n")
        written += 1
    return folder, written


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Apply ChatGPT bundle(s) (index/style/script) into calculators/<category>/<slug>/"
    )
    parser.add_argument(
        "bundle_file",
        nargs="?",
        default=str(REPO_ROOT / "tools" / "_bundle.txt"),
        help="Path to the bundle text file (default: tools/_bundle.txt)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Do not write files, only show what would happen",
    )
    parser.add_argument(
        "--no-overwrite-check",
        action="store_true",
        help="Skip warning if target files already exist (still overwrites).",
    )
    parser.add_argument(
        "--strict-slug-match",
        action="store_true",
        help="If explicit slug fence differs from canonical slug, error instead of auto-fixing canonical.",
    )
    args = parser.parse_args()

    bundle_path = Path(args.bundle_file)
    if not bundle_path.exists():
        print(f"ERROR: Bundle file not found: {bundle_path}")
        return 2

    text = _strip_bom(bundle_path.read_text(encoding="utf-8", errors="replace"))
    bundles = _split_into_bundles(text)

    if not bundles:
        print("ERROR: No bundles found. Expected at least one '## index.html' or '### index.html' section.")
        return 2

    updated = 0
    errors = 0

    for idx, btxt in enumerate(bundles, start=1):
        sections = _extract_sections(btxt)
        missing = [k for k in ("index.html", "style.css", "script.js") if k not in sections]
        if missing:
            print(f"[{idx}] ERROR: Missing sections: {', '.join(missing)}")
            errors += 1
            continue

        index_html = sections["index.html"]
        style_css = sections["style.css"]
        script_js = sections["script.js"]

        cat_from_canon, slug_from_canon, _ = _infer_category_and_slug(index_html)
        explicit_slug = _find_explicit_calc_slug(btxt)

        if explicit_slug and not _validate_slug(explicit_slug):
            print(f"[{idx}] ERROR: Invalid explicit slug format: {explicit_slug}")
            errors += 1
            continue

        if slug_from_canon and not _validate_slug(slug_from_canon):
            print(f"[{idx}] ERROR: Invalid canonical slug format: {slug_from_canon}")
            errors += 1
            continue

        if cat_from_canon and not _validate_slug(cat_from_canon):
            print(f"[{idx}] ERROR: Invalid canonical category slug format: {cat_from_canon}")
            errors += 1
            continue

        if not cat_from_canon or not slug_from_canon:
            print(f"[{idx}] ERROR: Could not infer category/slug from canonical URL in index.html.")
            errors += 1
            continue

        final_slug = explicit_slug or slug_from_canon

        if explicit_slug and explicit_slug != slug_from_canon:
            if args.strict_slug_match:
                print(
                    f"[{idx}] ERROR: Slug mismatch.\n"
                    f"     Canonical: {slug_from_canon}\n"
                    f"     Explicit : {explicit_slug}\n"
                    f"     Fix either canonical href or the final slug fence."
                )
                errors += 1
                continue

            index_html, changed = _rewrite_canonical_href(index_html, cat_from_canon, explicit_slug)
            if changed:
                print(
                    f"[{idx}] WARN: Canonical slug '{slug_from_canon}' did not match explicit slug '{explicit_slug}'. "
                    f"Auto-rewrote canonical href to match '{explicit_slug}'."
                )
            else:
                print(
                    f"[{idx}] WARN: Slug mismatch (canonical '{slug_from_canon}' vs explicit '{explicit_slug}'). "
                    f"Could not rewrite canonical tag automatically."
                )

        bundle = CalcBundle(
            category_slug=cat_from_canon,
            calc_slug=final_slug,
            index_html=index_html,
            style_css=style_css,
            script_js=script_js,
        )

        folder = CALCULATORS_DIR / bundle.category_slug / bundle.calc_slug
        paths = [folder / "index.html", folder / "style.css", folder / "script.js"]

        if not args.no_overwrite_check and not args.dry_run:
            existing = [p for p in paths if p.exists()]
            if existing:
                print(f"[{idx}] WARN: Overwriting existing files in: {folder}")

        try:
            out_folder, count = write_calc(bundle, dry_run=args.dry_run)
            updated += 1
            action = "WOULD WRITE" if args.dry_run else "WROTE"
            print(f"[{idx}] {action}: {out_folder}  (files: {count})")
        except Exception as e:
            print(f"[{idx}] ERROR: Failed to write files: {e}")
            errors += 1

    print("\nApply bundle complete.")
    print(f"- Bundles found: {len(bundles)}")
    print(f"- Bundles applied: {updated}")
    print(f"- Errors: {errors}")
    return 0 if errors == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
