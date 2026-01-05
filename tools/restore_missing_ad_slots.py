import os
import re
from pathlib import Path

# -----------------------------
# Configuration
# -----------------------------

ROOT_DEFAULT = Path(".")
EXTS = {".html", ".htm"}
EXCLUDE_DIRS = {".git", "node_modules", ".venv", "venv", "dist", "build", ".next", ".cache"}

NATIVE_BANNER_BLOCK = (
    '  <!-- Ads (Native banner) -->\n'
    '  <script async="async" data-cfasync="false" '
    'src="https://pl28402284.effectivegatecpm.com/0ebd073c7baf207558a86b92738ee2ed/invoke.js"></script>\n'
    '  <div id="container-0ebd073c7baf207558a86b92738ee2ed"></div>\n'
)

SOCIAL_BAR_SCRIPT = (
    '  <!-- Ads (Social bar) -->\n'
    '  <script src="https://pl28401807.effectivegatecpm.com/16/d6/13/16d6138b6d74e1866cb0f7a3960bfd77.js"></script>\n'
)

ADBLOCK_AD_PLACEHOLDER = (
    '    <div class="ad-block" aria-label="Sponsored content">\n'
    '      <div class="ad-placeholder-img" aria-label="Reserved space for future advertisement"></div>\n'
    '      <p></p>\n'
    '    </div>\n'
)

ADBLOCK_AFF_PLACEHOLDER = (
    '    <div class="ad-block" aria-label="Sponsored content">\n'
    '      <div class="ad-placeholder-img" aria-label="Reserved space for future affiliate promotion"></div>\n'
    '      <p></p>\n'
    '    </div>\n'
)

# Matches a grid-slot block (non-greedy). We only fill if "inner" is empty after stripping comments + whitespace.
GRID_SLOT_RE = re.compile(
    r'(?P<open><div\s+class="grid-slot"\s*>)(?P<inner>.*?)(?P<close></div\s*>)',
    re.IGNORECASE | re.DOTALL,
)

COMMENT_RE = re.compile(r"<!--.*?-->", re.DOTALL)

# -----------------------------
# Helpers
# -----------------------------

def iter_html_files(root: Path):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d.lower() not in EXCLUDE_DIRS]
        for fn in filenames:
            p = Path(dirpath) / fn
            if p.suffix.lower() in EXTS:
                yield p

def read_text(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return p.read_text(encoding="utf-8", errors="replace")

def write_text(p: Path, s: str) -> None:
    p.write_text(s, encoding="utf-8")

def strip_comments_and_ws(s: str) -> str:
    s2 = COMMENT_RE.sub("", s)
    return s2.strip()

def ensure_native_banner(html: str) -> str:
    # Only insert if container id is not already present
    if "container-0ebd073c7baf207558a86b92738ee2ed" in html:
        return html

    m = re.search(r"(<main\s+class=\"site-main\"\s*>)", html, re.IGNORECASE)
    if not m:
        return html  # do nothing if structure is unexpected

    insert_at = m.end()
    # Keep formatting: insert newline after <main...>
    return html[:insert_at] + "\n" + NATIVE_BANNER_BLOCK + html[insert_at:]

def ensure_social_bar(html: str) -> str:
    # Only insert if script src is not already present near end.
    # If it exists anywhere, do nothing to avoid duplicates.
    if "pl28401807.effectivegatecpm.com/16/d6/13/16d6138b6d74e1866cb0f7a3960bfd77.js" in html:
        # Note: Your template currently includes this in <head>. If you want it ONLY at end, say so.
        # For now we avoid duplicates.
        return html

    m = re.search(r"(</body\s*>)", html, re.IGNORECASE)
    if not m:
        return html

    return html[:m.start()] + "\n" + SOCIAL_BAR_SCRIPT + html[m.start():]

def fill_empty_grid_slots(html: str):
    """
    Fill up to 4 EMPTY grid-slot blocks with ad-block placeholders.
    First 2 filled -> advertisement placeholder
    Next 2 filled -> affiliate promotion placeholder
    Returns (new_html, filled_count)
    """
    filled = 0
    out_parts = []
    last_idx = 0

    for m in GRID_SLOT_RE.finditer(html):
        open_tag = m.group("open")
        inner = m.group("inner")
        close_tag = m.group("close")

        cleaned = strip_comments_and_ws(inner)

        # Only fill if truly empty (no tags/content), and only up to 4.
        if cleaned == "" and filled < 4:
            placeholder = ADBLOCK_AD_PLACEHOLDER if filled < 2 else ADBLOCK_AFF_PLACEHOLDER

            # Preserve indentation: detect indentation before <div class="grid-slot">
            start = m.start()
            line_start = html.rfind("\n", 0, start)
            if line_start == -1:
                line_start = 0
            else:
                line_start += 1
            indent = ""
            i = line_start
            while i < len(html) and html[i] in (" ", "\t"):
                indent += html[i]
                i += 1

            # Inner placeholder should be indented one level deeper than grid-slot
            inner_block = "\n" + "\n".join(
                (indent + "  " + line if line else line)
                for line in placeholder.rstrip("\n").splitlines()
            ) + "\n" + indent

            replacement = open_tag + inner_block + close_tag

            out_parts.append(html[last_idx:m.start()])
            out_parts.append(replacement)
            last_idx = m.end()
            filled += 1

    out_parts.append(html[last_idx:])
    return "".join(out_parts), filled

def make_backup(path: Path) -> None:
    bak = path.with_suffix(path.suffix + ".bak")
    if not bak.exists():
        bak.write_bytes(path.read_bytes())

# -----------------------------
# Main
# -----------------------------

def main():
    root = ROOT_DEFAULT.resolve()

    changed_files = 0
    total_slots_filled = 0
    native_added = 0
    social_added = 0
    errors = 0

    for p in iter_html_files(root):
        try:
            original = read_text(p)
            html = original

            # 1) Fill missing ad slots (only empty grid-slots, max 4)
            html2, filled = fill_empty_grid_slots(html)
            html = html2

            # 2) Ensure Native banner exists
            before_native = html
            html = ensure_native_banner(html)
            if html != before_native:
                native_added += 1

            # 3) Ensure Social bar exists (only if not already anywhere)
            before_social = html
            html = ensure_social_bar(html)
            if html != before_social:
                social_added += 1

            if html != original:
                make_backup(p)
                write_text(p, html)
                changed_files += 1
                total_slots_filled += filled

        except Exception as e:
            errors += 1
            print(f"[ERROR] {p}: {e}")

    print(
        f"Done.\n"
        f"Files changed: {changed_files}\n"
        f"Ad slots filled (max 4 per file): {total_slots_filled}\n"
        f"Native banner inserted on files: {native_added}\n"
        f"Social bar inserted on files: {social_added}\n"
        f"Errors: {errors}"
    )

if __name__ == "__main__":
    main()
