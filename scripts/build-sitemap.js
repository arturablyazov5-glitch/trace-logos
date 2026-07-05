#!/usr/bin/env node
/**
 * Single authoritative sitemap generator.
 *
 * Produces a sitemap index (sitemap.xml) + child sitemaps:
 *   sitemap-pages.xml   — static pages, logo categories, emoji categories, collections
 *   sitemap-logos.xml   — per-logo pages
 *   sitemap-emoji.xml   — per-emoji pages
 *
 * Sources (run the page builders first so URL lists exist):
 *   logos/manifest.json + logos/categories/*.json  → logo + logo-category URLs
 *   collections.json                                → collection URLs
 *   emoji/manifest.json                             → emoji-category URLs
 *   emoji/_urls.json (from build-emoji-seo-pages)   → per-emoji URLs
 *
 * Usage: node scripts/build-sitemap.js
 */

const fs   = require('fs');
const path = require('path');

const BASE_URL = 'https://trace-logos.ru';
const ROOT     = path.resolve(__dirname, '..');
const TODAY    = new Date().toISOString().slice(0, 10);

function slugify(value) {
  return String(value || '').trim().toLowerCase()
    .replace(/&/g, ' and ').replace(/[^a-z0-9а-яё]+/gi, '-').replace(/^-+|-+$/g, '');
}
function seoUrl(item) {
  const parts = (item.figma || '').split('/').map(slugify).filter(Boolean);
  if (parts[0] !== 'icon' || parts.length < 3) return '';
  return '/logos/' + parts.slice(1).join('/') + '/';
}

const EMOJI_CAT_SLUGS = {
  'smileys-emotion': 'smileys', 'people-body': 'people', 'animals-nature': 'animals',
  'food-drink': 'food', 'travel-places': 'travel', 'activities': 'activities',
  'objects': 'objects', 'symbols': 'symbols', 'flags': 'flags',
};

function urlEntry(loc, freq, priority) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}
function wrapUrlset(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
}

function main() {
  // ── Pages sitemap: static + logo categories + emoji categories + collections ──
  const pageEntries = [];
  pageEntries.push(urlEntry(`${BASE_URL}/`,        'weekly',  '1.0'));
  pageEntries.push(urlEntry(`${BASE_URL}/logos/`,  'weekly',  '0.9'));
  pageEntries.push(urlEntry(`${BASE_URL}/emoji/`,  'weekly',  '0.8'));
  pageEntries.push(urlEntry(`${BASE_URL}/blog/`,   'weekly',  '0.6'));
  pageEntries.push(urlEntry(`${BASE_URL}/sitemap/`, 'monthly', '0.3'));
  pageEntries.push(urlEntry(`${BASE_URL}/icons/`,  'monthly', '0.5'));

  const logoManifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', 'manifest.json'), 'utf8'));
  for (const cat of logoManifest.categories) {
    pageEntries.push(urlEntry(`${BASE_URL}/logos/${cat.slug}/`, 'weekly', '0.8'));
  }

  // Ecosystem pages
  const ecoDir = path.join(ROOT, 'logos', 'ecosystem');
  try {
    for (const d of fs.readdirSync(ecoDir, { withFileTypes: true })) {
      if (d.isDirectory()) pageEntries.push(urlEntry(`${BASE_URL}/logos/ecosystem/${d.name}/`, 'weekly', '0.7'));
    }
  } catch {}

  const emojiManifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'emoji', 'manifest.json'), 'utf8'));
  for (const ref of emojiManifest.categories) {
    const slug = EMOJI_CAT_SLUGS[path.basename(ref.file, '.json')];
    if (slug) pageEntries.push(urlEntry(`${BASE_URL}/emoji/${slug}/`, 'weekly', '0.7'));
  }

  try {
    const collections = JSON.parse(fs.readFileSync(path.join(ROOT, 'collections.json'), 'utf8')).collections;
    for (const c of collections) pageEntries.push(urlEntry(`${BASE_URL}/collections/${c.slug}/`, 'weekly', '0.7'));
  } catch {}

  try {
    const postsDir = path.join(ROOT, 'blog', 'posts');
    for (const f of fs.readdirSync(postsDir).filter(x => x.endsWith('.md'))) {
      const raw = fs.readFileSync(path.join(postsDir, f), 'utf8');
      const m = raw.match(/\bslug:\s*(\S+)/);
      const slug = m ? m[1] : path.basename(f, '.md');
      pageEntries.push(urlEntry(`${BASE_URL}/blog/${slug}/`, 'monthly', '0.5'));
    }
  } catch {}

  // ── Logos sitemap ──
  const logoEntries = [];
  for (const cat of logoManifest.categories) {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', cat.file), 'utf8'));
    for (const item of data.items) {
      if (item.comingSoon || !item.file || item.file === 'placeholder.svg') continue;
      const url = seoUrl(item);
      if (url) logoEntries.push(urlEntry(BASE_URL + url, 'monthly', '0.6'));
    }
  }

  // ── Emoji sitemap ──
  let emojiUrls = [];
  try { emojiUrls = JSON.parse(fs.readFileSync(path.join(ROOT, 'emoji', '_urls.json'), 'utf8')); }
  catch { console.warn('⚠ emoji/_urls.json not found — run build-emoji-seo-pages.js first'); }
  const emojiEntries = emojiUrls.map(u => urlEntry(BASE_URL + u, 'monthly', '0.5'));

  // ── Write child sitemaps ──
  fs.writeFileSync(path.join(ROOT, 'sitemap-pages.xml'), wrapUrlset(pageEntries), 'utf8');
  fs.writeFileSync(path.join(ROOT, 'sitemap-logos.xml'), wrapUrlset(logoEntries), 'utf8');
  fs.writeFileSync(path.join(ROOT, 'sitemap-emoji.xml'), wrapUrlset(emojiEntries), 'utf8');

  // ── Write sitemap index ──
  const children = ['sitemap-pages.xml', 'sitemap-logos.xml', 'sitemap-emoji.xml'];
  const indexBody = children
    .map(c => `  <sitemap>\n    <loc>${BASE_URL}/${c}</loc>\n    <lastmod>${TODAY}</lastmod>\n  </sitemap>`)
    .join('\n');
  const index = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexBody}\n</sitemapindex>\n`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), index, 'utf8');

  const total = pageEntries.length + logoEntries.length + emojiEntries.length;
  console.log(`✓ sitemap.xml (index) → pages:${pageEntries.length} logos:${logoEntries.length} emoji:${emojiEntries.length}  total ${total} URLs`);
}

main();
