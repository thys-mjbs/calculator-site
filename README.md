# Sitemap Setup for SnapCalc

This repository uses GitHub Pages with Jekyll enabled so that the `jekyll-sitemap` plugin can automatically generate a sitemap for all public pages on the SnapCalc site.

## How the Sitemap Works
- GitHub Pages runs Jekyll every time you push to the repo.
- Jekyll loads `_config.yml`, detects the `jekyll-sitemap` plugin, and generates `sitemap.xml`.
- The sitemap automatically includes all public pages under:

  https://snapcalc.site/

No manual editing or regenerating is required. New calculators, new categories, and new legal pages are picked up automatically.

## Required Files in the Repo Root
You must keep these three files in the root:

1. **_config.yml**  
   - Enables Jekyll  
   - Enables `jekyll-sitemap`  
   - Defines:
     - `url: "https://snapcalc.site"`
     - `baseurl: ""`

2. **robots.txt**  
   - Allows all crawlers  
   - Points search engines to the sitemap at:  
     https://snapcalc.site/sitemap.xml

3. **README-sitemap.md**  
   - This file you are reading now.

There must be **no `.nojekyll` file** in the repo root.

## What You Need to Do
1. Keep `_config.yml`, `robots.txt`, and this file in the repo root.  
2. Commit and push your changes.  
3. GitHub Pages will rebuild automatically.  
4. In Google Search Console, submit this sitemap URL once:

   https://snapcalc.site/sitemap.xml

Google will re-check the sitemap automatically over time. No further action is required.
deploy trigger