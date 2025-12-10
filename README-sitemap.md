# Sitemap setup for SnapCalc

This repository uses GitHub Pages with Jekyll enabled so that the `jekyll-sitemap` plugin can automatically generate a sitemap for all public pages.

## What Jekyll and jekyll-sitemap are doing

- GitHub Pages runs Jekyll on this repo whenever you push changes.
- Jekyll reads `_config.yml`, sees the `jekyll-sitemap` plugin, and generates a `sitemap.xml` file at build time.
- That `sitemap.xml` includes all normal public URLs under:
  - `https://snapcalc.site/`
  - including the homepage, category pages, calculator pages, and legal pages.

You do **not** need to manually edit or regenerate `sitemap.xml`. It stays in sync as you add or remove pages.

## Files you added for this setup

- `_config.yml`  
  - Enables Jekyll.
  - Sets:
    - `url: "https://snapcalc.site"`
    - `baseurl: ""`
  - Turns on the `jekyll-sitemap` plugin.

- `robots.txt`  
  - Tells search engines they can crawl everything.
  - Points them to the sitemap at:  
    `https://snapcalc.site/sitemap.xml`

## What you need to do

1. Keep `_config.yml`, `robots.txt`, and this `README-sitemap.md` in the repo root.
2. Make sure there is **no** `.nojekyll` file in the root of the repo.
3. Commit and push your changes.
4. Wait for GitHub Pages to rebuild the site.
5. In Google Search Console, submit this sitemap URL **once**:

   `https://snapcalc.site/sitemap.xml`

Google will re-read the sitemap automatically over time.  
You do **not** need to resubmit URLs when you add new calculators or categories. As long as the pages are part of the site, Jekyll + `jekyll-sitemap` will include them in the sitemap.
