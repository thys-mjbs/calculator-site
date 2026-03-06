// Generates sitemap.xml for snapcalc.site
// Run via: node scripts/generate-sitemap.js
// Vercel runs this automatically as the build step.

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://snapcalc.site';
const ROOT_DIR = path.join(__dirname, '..');
const OUTPUT_FILE = path.join(ROOT_DIR, 'sitemap.xml');

// Directories to exclude from the sitemap
const EXCLUDED_DIRS = [
  '_snapcalc_backup_calculators_20260105_220409',
  'tools',
  'diagnostic-insights/gated',
  '.git',
  'node_modules',
  'scripts',
  'styles',
  'assets',
];

// Root-level HTML files to include with their priorities
const ROOT_PAGES = [
  { file: 'index.html', priority: '1.0', changefreq: 'weekly' },
  { file: 'hubs.html', priority: '0.8', changefreq: 'monthly' },
  { file: 'about.html', priority: '0.5', changefreq: 'monthly' },
  { file: 'methodology.html', priority: '0.5', changefreq: 'monthly' },
  { file: 'accuracy.html', priority: '0.5', changefreq: 'monthly' },
  { file: 'contact.html', priority: '0.4', changefreq: 'monthly' },
  { file: 'products.html', priority: '0.4', changefreq: 'monthly' },
  { file: 'privacy-policy.html', priority: '0.3', changefreq: 'yearly' },
  { file: 'terms.html', priority: '0.3', changefreq: 'yearly' },
  { file: 'disclaimer.html', priority: '0.3', changefreq: 'yearly' },
];

function isExcluded(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  return EXCLUDED_DIRS.some(dir => normalized.startsWith(dir + '/') || normalized === dir);
}

function walkDir(dir, relBase, results) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const relPath = relBase ? `${relBase}/${entry.name}` : entry.name;
    if (isExcluded(relPath)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, relPath, results);
    } else if (entry.isFile() && entry.name === 'index.html' && relBase) {
      results.push(relBase);
    }
  }
}

function toUrl(urlPath, trailingSlash = true) {
  const clean = urlPath.replace(/\\/g, '/');
  return `${BASE_URL}/${clean}${trailingSlash ? '/' : ''}`;
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/'/g, '&apos;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildSitemap() {
  const today = new Date().toISOString().split('T')[0];
  const urls = [];

  // Root pages
  for (const page of ROOT_PAGES) {
    if (fs.existsSync(path.join(ROOT_DIR, page.file))) {
      const loc = page.file === 'index.html'
        ? BASE_URL + '/'
        : escapeXml(`${BASE_URL}/${page.file.replace('.html', '')}/`);
      urls.push(`  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>`);
    }
  }

  // Category hub pages
  const hubDir = path.join(ROOT_DIR, 'hubpages');
  if (fs.existsSync(hubDir)) {
    const hubFiles = fs.readdirSync(hubDir).filter(f => f.endsWith('.html'));
    for (const f of hubFiles) {
      const slug = f.replace('.html', '');
      const loc = escapeXml(`${BASE_URL}/hubpages/${slug}/`);
      urls.push(`  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`);
    }
  }

  // Category pages
  const catDir = path.join(ROOT_DIR, 'categories');
  if (fs.existsSync(catDir)) {
    const catFiles = fs.readdirSync(catDir).filter(f => f.endsWith('.html'));
    for (const f of catFiles) {
      const slug = f.replace('.html', '');
      const loc = escapeXml(`${BASE_URL}/categories/${slug}/`);
      urls.push(`  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`);
    }
  }

  // Calculator pages
  const calcPaths = [];
  const calcDir = path.join(ROOT_DIR, 'calculators');
  if (fs.existsSync(calcDir)) {
    walkDir(calcDir, 'calculators', calcPaths);
  }
  for (const p of calcPaths) {
    const loc = escapeXml(toUrl(p));
    urls.push(`  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

  fs.writeFileSync(OUTPUT_FILE, xml, 'utf8');
  console.log(`Sitemap generated: ${urls.length} URLs written to sitemap.xml`);
}

buildSitemap();
