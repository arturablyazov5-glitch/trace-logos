#!/usr/bin/env node
/**
 * Single authoritative sitemap generator.
 *
 * Produces a sitemap index (sitemap.xml) + child sitemaps:
 *   sitemap-pages.xml   — static pages, logo categories, emoji categories, collections
 *   sitemap-logos.xml   — per-logo pages
 *   sitemap-emoji.xml   — per-emoji pages
 *   sitemap-en.xml      — the /en/ mirror of all of the above (hreflang alone
 *                         doesn't get ~2500 EN pages crawled; they must be
 *                         listed explicitly). Only URLs whose en/<path>/index.html
 *                         actually exists on disk are included.
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
const { itemDate, assetExt } = require('./lib/item-date');

const BASE_URL = 'https://trace-logos.ru';
const ROOT     = path.resolve(__dirname, '..');
const TODAY    = new Date().toISOString().slice(0, 10);
const IMAGE_NS = 'http://www.google.com/schemas/sitemap-image/1.1';

// XML text-node escaping (image:title isn't HTML — no &apos;/&quot; needed
// outside attribute values, but escaping them too is harmless and safer).
function escXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

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

function urlEntry(loc, freq, priority, lastmod = TODAY) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

// Every RU URL is mirrored at /en/<path>/ by build-en-pages.js and the EN-aware
// page builders. Collect the EN twin only when the file is really there —
// build order or a skipped builder must not produce 404s in the sitemap.
const enEntries = [];
function pushEn(rusLoc, freq, priority, lastmod = TODAY) {
  const relPath = rusLoc.slice(BASE_URL.length); // "/logos/bank/sber/"
  if (!fs.existsSync(path.join(ROOT, 'en', relPath.slice(1), 'index.html'))) return;
  enEntries.push(urlEntry(`${BASE_URL}/en${relPath}`, freq, priority, lastmod));
}

// Same as urlEntry, plus <image:image> blocks — Google Images indexes straight
// from this without crawling the page itself. Image search only indexes raster
// formats, so for SVG logos the PNG render (build-search-images.js) goes
// first as the primary image; the SVG original is listed second for engines
// that do handle vectors.
function logoUrlEntry(item, loc, freq, priority, lastmod) {
  const ext   = assetExt(item.file);
  const title = escXml(`Логотип ${item.name}`);
  const imgBlock = (url) => `    <image:image>\n      <image:loc>${url}</image:loc>\n      <image:title>${title}</image:title>\n    </image:image>`;

  const urls = [];
  if (ext === 'svg') {
    const searchRel = `assets/logos/search/${item.file.replace(/\.svg$/i, '.png')}`;
    if (fs.existsSync(path.join(ROOT, searchRel))) urls.push(`${BASE_URL}/${searchRel}`);
    urls.push(`${BASE_URL}/assets/logos/svgs/${item.file}`);
  } else {
    urls.push(`${BASE_URL}/assets/logos/pngs/${item.file}`);
  }

  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n${urls.map(imgBlock).join('\n')}\n  </url>`;
}

function wrapUrlset(entries, withImageNs = false) {
  const imageAttr = withImageNs ? ` xmlns:image="${IMAGE_NS}"` : '';
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${imageAttr}>\n${entries.join('\n')}\n</urlset>\n`;
}

function main() {
  // ── Pages sitemap: static + logo categories + emoji categories + collections ──
  const pageEntries = [];
  const pushPage = (loc, freq, priority) => {
    pageEntries.push(urlEntry(loc, freq, priority));
    pushEn(loc, freq, priority);
  };
  pushPage(`${BASE_URL}/`,        'weekly',  '1.0');
  pushPage(`${BASE_URL}/logos/`,  'weekly',  '0.9');
  pushPage(`${BASE_URL}/emoji/`,  'weekly',  '0.8');
  pushPage(`${BASE_URL}/blog/`,   'weekly',  '0.6');
  pushPage(`${BASE_URL}/sitemap/`, 'monthly', '0.3');
  pushPage(`${BASE_URL}/terms/`,  'yearly',  '0.3');
  pushPage(`${BASE_URL}/consent/`, 'yearly', '0.3');
  pushPage(`${BASE_URL}/icons/`,  'monthly', '0.5');

  const logoManifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', 'manifest.json'), 'utf8'));
  for (const cat of logoManifest.categories) {
    pushPage(`${BASE_URL}/logos/${cat.slug}/`, 'weekly', '0.8');
  }

  // Ecosystem pages
  const ecoDir = path.join(ROOT, 'logos', 'ecosystem');
  try {
    for (const d of fs.readdirSync(ecoDir, { withFileTypes: true })) {
      if (d.isDirectory()) pushPage(`${BASE_URL}/logos/ecosystem/${d.name}/`, 'weekly', '0.7');
    }
  } catch {}

  const emojiManifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'emoji', 'manifest.json'), 'utf8'));
  for (const ref of emojiManifest.categories) {
    const slug = EMOJI_CAT_SLUGS[path.basename(ref.file, '.json')];
    if (slug) pushPage(`${BASE_URL}/emoji/${slug}/`, 'weekly', '0.7');
  }

  try {
    const collections = JSON.parse(fs.readFileSync(path.join(ROOT, 'collections.json'), 'utf8')).collections;
    for (const c of collections) pushPage(`${BASE_URL}/collections/${c.slug}/`, 'weekly', '0.7');
  } catch {}

  try {
    const postsDir = path.join(ROOT, 'blog', 'posts');
    for (const f of fs.readdirSync(postsDir).filter(x => x.endsWith('.md'))) {
      const raw = fs.readFileSync(path.join(postsDir, f), 'utf8');
      const m = raw.match(/\bslug:\s*(\S+)/);
      const slug = m ? m[1] : path.basename(f, '.md');
      pushPage(`${BASE_URL}/blog/${slug}/`, 'monthly', '0.5');
    }
  } catch {}

  // ── Logos sitemap ──
  const logoEntries = [];
  for (const cat of logoManifest.categories) {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', cat.file), 'utf8'));
    for (const item of data.items) {
      if (item.comingSoon || !item.file || item.file === 'placeholder.svg') continue;
      const url = seoUrl(item);
      if (!url) continue;
      logoEntries.push(logoUrlEntry(item, BASE_URL + url, 'monthly', '0.6', itemDate(item)));
      // EN twin without image blocks — images are language-neutral assets
      // already declared (with RU titles) on the RU entry; duplicating them
      // under /en/ URLs would just double the image index noise.
      pushEn(BASE_URL + url, 'monthly', '0.6', itemDate(item));
    }
  }

  // ── Emoji sitemap ──
  let emojiUrls = [];
  try { emojiUrls = JSON.parse(fs.readFileSync(path.join(ROOT, 'emoji', '_urls.json'), 'utf8')); }
  catch { console.warn('⚠ emoji/_urls.json not found — run build-emoji-seo-pages.js first'); }
  const emojiEntries = emojiUrls.map(u => {
    pushEn(BASE_URL + u, 'monthly', '0.5');
    return urlEntry(BASE_URL + u, 'monthly', '0.5');
  });

  // ── Write child sitemaps ──
  fs.writeFileSync(path.join(ROOT, 'sitemap-pages.xml'), wrapUrlset(pageEntries), 'utf8');
  fs.writeFileSync(path.join(ROOT, 'sitemap-logos.xml'), wrapUrlset(logoEntries, true), 'utf8');
  fs.writeFileSync(path.join(ROOT, 'sitemap-emoji.xml'), wrapUrlset(emojiEntries), 'utf8');
  fs.writeFileSync(path.join(ROOT, 'sitemap-en.xml'),    wrapUrlset(enEntries), 'utf8');

  // ── Write sitemap index ──
  const children = ['sitemap-pages.xml', 'sitemap-logos.xml', 'sitemap-emoji.xml', 'sitemap-en.xml'];
  const indexBody = children
    .map(c => `  <sitemap>\n    <loc>${BASE_URL}/${c}</loc>\n    <lastmod>${TODAY}</lastmod>\n  </sitemap>`)
    .join('\n');
  const index = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexBody}\n</sitemapindex>\n`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), index, 'utf8');

  const total = pageEntries.length + logoEntries.length + emojiEntries.length + enEntries.length;
  console.log(`✓ sitemap.xml (index) → pages:${pageEntries.length} logos:${logoEntries.length} emoji:${emojiEntries.length} en:${enEntries.length}  total ${total} URLs`);
}

main();
