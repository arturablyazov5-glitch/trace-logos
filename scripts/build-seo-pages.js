#!/usr/bin/env node
/**
 * Generates SEO pages for all logo items that have a valid figma path.
 *
 * Source of truth:
 *   templates/seo-page.html   — HTML structure and markup
 *   css/seo-page.css          — visual styles
 *   logos/categories/*.json   — logo data (names, variants, ecosystem, etc.)
 *
 * Output: logos/<category>/<slug>/index.html for each item.
 * Also regenerates sitemap.xml.
 *
 * Usage:
 *   node scripts/build-seo-pages.js            # build all pages
 *   node scripts/build-seo-pages.js --dry-run  # print paths without writing
 */

const fs             = require('fs');
const path           = require('path');
const sharp          = require('sharp');
const { loadTemplate } = require('./lib/render');
const { loadDict, enChrome, bakeI18n, hreflangBlock } = require('./lib/en-transform');
const { itemDate, itemPublishedDate }  = require('./lib/item-date');
const { extractBrandColors, hexToRgb } = require('./lib/brand-colors');
const { resolveCategoryLabels } = require('./lib/labels');

const BASE_URL   = 'https://trace-logos.ru';
// Mirrors the Organization block in index.html — every SEO page carries its own
// copy so an AI crawler/LLM landing directly on a deep page (90% of traffic)
// still sees a publisher entity, not just an anonymous ImageObject/FAQPage.
const FIGMA_PLUGIN_URL  = "https://www.figma.com/community/plugin/1643124536537861799/trace-logos";
const GITHUB_URL        = "https://github.com/rafael-mansurov/trace-logos";
const GITHUB_PROFILE_URL = "https://github.com/rafael-mansurov";
const TELEGRAM_URL      = "https://t.me/mansurov_rafael";
// Shared @id with AUTHOR/AUTHOR_EN in build-blog.js — same real person, same
// entity node, referenced from both the logo pages and the blog so Google/AI
// entity resolution treats them as one Person instead of two disconnected stubs.
const PERSON = {
  "@type": "Person",
  "@id": `${BASE_URL}/#person-rafael-mansurov`,
  "name": "Рафаэль Мансуров",
  "url": TELEGRAM_URL,
  "sameAs": [TELEGRAM_URL, GITHUB_PROFILE_URL],
};
const ORGANIZATION = {
  "@type": "Organization",
  "@id": `${BASE_URL}/#organization`,
  "name": "Trace Logo's",
  "url": `${BASE_URL}/`,
  "logo": `${BASE_URL}/assets/logos/svgs/trace-logos.svg`,
  // More sameAs = higher confidence for AI/Google entity resolution linking
  // this Organization node to the real-world brand (entity clarity/GEO).
  "sameAs": [FIGMA_PLUGIN_URL, GITHUB_URL, TELEGRAM_URL],
  // E-E-A-T: an anonymous Organization has no accountable author behind it —
  // founder ties the catalog to the named Person also credited on every blog post.
  "founder": { "@id": PERSON["@id"] },
};
const ROOT       = path.resolve(__dirname, '..');
const TEMPLATE   = loadTemplate(path.join(ROOT, 'templates', 'seo-page.html'));
const DRY_RUN    = process.argv.includes('--dry-run');
const DICT       = loadDict();

const RU_MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const EN_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatDate(iso, lang = 'ru') {
  const [y, m, d] = iso.split('-').map(Number);
  if (lang === 'en') return `${EN_MONTHS[m - 1]} ${d}, ${y}`;
  return `${d} ${RU_MONTHS[m - 1]} ${y}`;
}

// ── Slug helpers ──────────────────────────────────────────────────────────────

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '');
}

function seoUrl(item) {
  const parts = (item.figma || '').split('/').map(slugify).filter(Boolean);
  if (parts[0] !== 'icon' || parts.length < 3) return '';
  return '/logos/' + parts.slice(1).join('/') + '/';
}

// ── File size ─────────────────────────────────────────────────────────────────

function formatSize(size) {
  // Unit matches the runtime formatFileSize() in utils.js (universal "KB").
  if (size < 1024) return `${size} B`;
  const kb = size / 1024;
  return kb < 100 ? `${kb.toFixed(1)} KB` : `${Math.round(kb)} KB`;
}

function fileSize(relPath) {
  try {
    const { size } = fs.statSync(path.join(ROOT, 'assets', 'logos', relPath));
    return formatSize(size);
  } catch { return ''; }
}

// ── Approx PNG size for SVG-only logos ──────────────────────────────────────
// SVG-only items have no real PNG file — the "Скачать PNG" button rasterizes
// the SVG client-side on click (js/seo-page.js, svgToPngBlob at size:1000), so
// there's nothing on disk to stat. We rasterize the same 1000×1000 export
// server-side at build time (once per SVG, cached by mtime) purely to show a
// realistic "~NN KB" figure next to the button — not written to disk, not the
// file the visitor actually downloads (that's still generated live, and can
// vary slightly by export settings), just an honest estimate instead of a
// blank space.
const PNG_SIZE_CACHE_PATH = path.join(ROOT, 'logos', 'png-size-cache.json');
let pngSizeCache = {};
try { pngSizeCache = JSON.parse(fs.readFileSync(PNG_SIZE_CACHE_PATH, 'utf8')); } catch { /* first run */ }

async function computeApproxPngSizes(svgFiles) {
  let changed = false;
  for (const svgFile of svgFiles) {
    const abs = path.join(ROOT, 'assets', 'logos', 'svgs', svgFile);
    let mtimeMs;
    try { mtimeMs = fs.statSync(abs).mtimeMs; } catch { continue; }
    if (pngSizeCache[svgFile]?.mtimeMs === mtimeMs) continue;
    try {
      const buf = await sharp(abs)
        .resize(1000, 1000, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      pngSizeCache[svgFile] = { mtimeMs, size: buf.length };
      changed = true;
    } catch { /* malformed/unsupported SVG — button just omits the size */ }
  }
  if (changed) fs.writeFileSync(PNG_SIZE_CACHE_PATH, JSON.stringify(pngSizeCache, null, 2) + '\n', 'utf8');
}

function approxPngSize(svgFile) {
  const cached = pngSizeCache[svgFile];
  return cached ? `~${formatSize(cached.size)}` : '';
}

// Like fileSize(), but accepts either a name inside assets/logos/<folder>/ or
// a root-relative path (leading "/") to an asset outside that folder.
function assetFileSize(file, folder) {
  if (file.startsWith('/')) {
    try {
      const { size } = fs.statSync(path.join(ROOT, file.slice(1)));
      if (size < 1024) return `${size} B`;
      const kb = size / 1024;
      return kb < 100 ? `${kb.toFixed(1)} KB` : `${Math.round(kb)} KB`;
    } catch { return ''; }
  }
  return fileSize(`${folder}/${file}`);
}

// Suggested download filename: basename only, never a path.
function downloadName(file) { return file.split('/').pop(); }

// ── Variant helpers ───────────────────────────────────────────────────────────

const TYPE_LABELS = { svg: 'SVG', full: 'Full', full_en: 'Full EN', png: 'PNG Icon' };
const FULL_TYPES  = new Set(['full', 'full_en']);

function isFullFile(file)    { return /-full(\.[^.]+)?$/.test(file); }
function isWideVariant(v)    { return FULL_TYPES.has(v.type) || (!v.type && isFullFile(v.file)); }
function variantLabel(v, lang = 'ru') {
  if (lang === 'en' && v.label_en) return v.label_en;
  return v.label ?? TYPE_LABELS[v.type] ?? v.type ?? '';
}
function assetExt(file)      { return file.split('.').pop().toLowerCase(); }

// Raster render of an SVG-primary logo (build-search-images.js) — the image
// actually indexable by Яндекс.Картинки/Google Images. Returns the repo-root
// relative path, or null when the item is PNG-primary or the render is missing.
function searchImageRel(item) {
  if (assetExt(item.file) !== 'svg') return null;
  const rel = `assets/logos/search/${item.file.replace(/\.svg$/i, '.png')}`;
  return fs.existsSync(path.join(ROOT, rel)) ? rel : null;
}

// Lightweight WebP render of the search/*.png (build-webp-previews.js
// "search" section) — for on-page display only. searchImageRel's 800px PNG
// stays the sitemap <image:loc> source untouched; this is just a smaller
// file for the <img> the browser actually paints.
function searchWebpPreviewRel(item) {
  const searchRel = searchImageRel(item);
  if (!searchRel) return null;
  const rel = searchRel.replace('assets/logos/search/', 'assets/logos/search-previews/').replace(/\.png$/i, '.webp');
  return fs.existsSync(path.join(ROOT, rel)) ? rel : null;
}

// WebP grid-thumbnail render of a PNG or SVG asset (build-webp-previews.js)
// — the same lightweight preview the catalog card grid uses, ~80-98% smaller
// than the raw file. Only for on-page display (hero preview + variant
// thumbnails); the full asset stays the download/lightbox/color-editor
// source. Returns null when the preview hasn't been generated yet.
function webpPreviewRel(file) {
  const ext = assetExt(file);
  if (ext !== 'png' && ext !== 'svg') return null;
  const rel = `assets/logos/previews/${file.replace(new RegExp(`\\.${ext}$`, 'i'), '.webp')}`;
  return fs.existsSync(path.join(ROOT, rel)) ? rel : null;
}

// Thumbnail-only src for a logo file, root-relative to `rel` — the WebP
// preview when one exists (both PNG and SVG, see webpPreviewRel), else the
// real asset. Used anywhere a logo shows up small on-page purely for
// browsing/cross-linking (related logos, category grid),
// never for the primary per-item preview/download/variant paths.
function thumbSrc(file, rel, ext) {
  const webpRel = webpPreviewRel(file);
  return webpRel ? `${rel}${webpRel}` : `${rel}assets/logos/${ext === 'png' ? 'pngs' : 'svgs'}/${file}`;
}

// 48×48 WebP tier (build-webp-previews.js's `logosMini` section) — ONLY for
// buildCatalogGridSection()'s "Остальные категории" tiles, which render at
// 26px CSS, smaller than every other spot thumbSrc()/webpPreviewRel() serve
// (~48px). Separate output dir (assets/logos/previews-mini/) so it never
// competes with the shared 192px previews other blocks rely on.
function miniThumbSrc(file, rel, ext) {
  if (ext !== 'png' && ext !== 'svg') return `${rel}assets/logos/${ext === 'png' ? 'pngs' : 'svgs'}/${file}`;
  const webpRel = `assets/logos/previews-mini/${file.replace(new RegExp(`\\.${ext}$`, 'i'), '.webp')}`;
  return fs.existsSync(path.join(ROOT, webpRel)) ? `${rel}${webpRel}` : `${rel}assets/logos/${ext === 'png' ? 'pngs' : 'svgs'}/${file}`;
}

// 100×100 WebP tier (build-webp-previews.js's `logosRelated` section) — ONLY
// for buildRelatedSection()'s "Другие логотипы этой категории" tiles
// (`.related-card img`, 48px CSS). Kept separate from the 192px tier the
// "Экосистема" block uses at the same display size, per explicit request.
function relatedThumbSrc(file, rel, ext) {
  if (ext !== 'png' && ext !== 'svg') return `${rel}assets/logos/${ext === 'png' ? 'pngs' : 'svgs'}/${file}`;
  const webpRel = `assets/logos/previews-related/${file.replace(new RegExp(`\\.${ext}$`, 'i'), '.webp')}`;
  return fs.existsSync(path.join(ROOT, webpRel)) ? `${rel}${webpRel}` : `${rel}assets/logos/${ext === 'png' ? 'pngs' : 'svgs'}/${file}`;
}
function variantType(v)      { return assetExt(v.file) === 'png' ? 'png' : 'svg'; }
// Mirrors svgUrl() in js/utils.js: a leading "/" means the file is already a
// root-relative path (e.g. a cross-folder emoji asset), not a name inside
// assets/logos/{svgs,pngs}/.
function assetSrc(file, rel, type) {
  if (file.startsWith('/')) return rel === '/' ? file : rel + file.slice(1);
  return `${rel}assets/logos/${type === 'png' ? 'pngs' : 'svgs'}/${file}`;
}
function variantKey(v)       {
  const ext  = assetExt(v.file);
  const base = v.file.split('/').pop().replace(/\.[^.]+$/, '');
  return (slugify(base) + '-' + ext) || 'v';
}

// ── Category icons ─────────────────────────────────────────────────────────────

const CATEGORY_ICONS = {
  bank:      `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>`,
  payment:   `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>`,
  social:    `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  video:     `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  media:     `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  music:     `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  cloud:     `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>`,
  mail:      `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  map:       `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
  search:    `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  ai:        `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>`,
  flag:      `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
  videocall: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
  tv:        `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>`,
};
const DEFAULT_ICON = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`;

function categoryIcon(figmaPath) {
  const seg = slugify((figmaPath || '').split('/')[1] || '');
  return CATEGORY_ICONS[seg] || DEFAULT_ICON;
}

// ── Ecosystem names ───────────────────────────────────────────────────────────

const ECO_DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', 'ecosystems.json'), 'utf8'));

function ecosystemName(id, lang = 'ru') {
  return (ECO_DATA[id] && ECO_DATA[id][lang]) || (ECO_DATA[id] && ECO_DATA[id].ru) || id;
}

// ── Download counter («Скачано: N раз») ─────────────────────────────────────
// Snapshot refreshed by build-download-stats.js, which MUST run before this
// script — see FAST_STEPS order in build-all.js.

const DOWNLOAD_STATS = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', 'download-stats.json'), 'utf8')).downloads || {};

// "1 раз" / "2 раза" / "5 раз" / "11 раз" (11-14 always genitive plural).
function pluralRu(n, [one, few, many]) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

// Some ecosystems read better with a custom phrase instead of the generic
// "Экосистема {name}" template (e.g. a design studio isn't itself a "logo
// ecosystem" the way Yandex or Sber are) — opt in via ecosystems.json.
function ecosystemSectionLabel(id, lang = 'ru') {
  const override = ECO_DATA[id] && ECO_DATA[id].sectionLabel;
  return (override && (override[lang] || override.ru)) || null;
}

// item.ecosystem may be a single key (string) or several (array) — normalize once.
function ecosystemIds(item) {
  return Array.isArray(item.ecosystem) ? item.ecosystem : item.ecosystem ? [item.ecosystem] : [];
}

// ── Sponsor banners (optional, per-logo; source of truth: logos/sponsors.json) ──

// Kill switch — flip back to `true` to bring the sponsor banners back. Gates
// both the markup (buildSponsorSection) and the <link> to css/sponsor-banner.css,
// so a hidden banner ships zero bytes instead of display:none'd markup.
// Temporarily off 2026-08-05 at the user's request; logos/sponsors.json is
// untouched, so re-enabling needs no data work.
const SPONSORS_ENABLED = false;

const SPONSORS = (() => {
  if (!SPONSORS_ENABLED) return {};
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', 'sponsors.json'), 'utf8')); }
  catch { return {}; }
})();

// Key into sponsors.json = the logo's url path without /logos/ and slashes trimmed,
// e.g. "/logos/ai/chatgpt/" → "ai/chatgpt".
function sponsorKey(item) {
  return seoUrl(item).replace(/^\/logos\/|\/$/g, '');
}

// ── HTML escaping ─────────────────────────────────────────────────────────────

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Links a "see also" name to its own SEO page for the HTML-rendered FAQ answer
// (JSON-LD stays plain text — see buildJsonLd, which never reads aHtml/aHtmlEn).
// Falls back to plain escaped text if the item has no valid seoUrl.
function linkTo(item, label) {
  const url = seoUrl(item);
  return url ? `<a href="${esc(url)}">${esc(label)}</a>` : esc(label);
}

// ── Snippet builders (pure data → HTML strings) ───────────────────────────────

const DL_ICON   = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
const COPY_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;

function buildVariantCard(v, isActive, rel, itemName) {
  const type  = variantType(v);
  const src   = assetSrc(v.file, rel, type);
  // Thumbnail-only WebP preview (falls back to the full asset when one hasn't
  // been generated for this file) — the full `src` stays data-src for
  // switch/download/lightbox, this is purely what the small on-page <img> loads.
  const webpRel = webpPreviewRel(v.file);
  const thumbSrc = webpRel ? `${rel}${webpRel}` : src;
  const wide  = isWideVariant(v);
  const label = variantLabel(v);
  const key   = variantKey(v);
  const altText = itemName ? `${esc(itemName)} — ${esc(label)}` : esc(label);
  const pngAttr = (type === 'svg' && v.pngFile)
    ? ` data-png="${assetSrc(v.pngFile, rel, 'png')}"`
    : '';
  const macosAttr = (v.macos_styles && !wide)
    ? ` data-macos='${JSON.stringify(v.macos_styles)}'`
    : '';
  const activeClass = isActive ? ' active' : '';
  const darkBgAttr = v.darkBg ? ` data-dark-bg="true"` : '';

  if (wide) {
    return `<div class="variant-card variant-wide${activeClass}" data-variant="${key}" data-src="${src}" data-preview="${thumbSrc}" data-type="${type}" data-wide="true"${darkBgAttr}>
            <span class="variant-preview-wide" aria-hidden="true">
              <img src="${thumbSrc}" alt="${altText}" width="100" height="48" loading="lazy">
            </span>
            <span class="variant-label">${esc(label)}</span>
          </div>`;
  }
  return `<div class="variant-card${activeClass}" data-variant="${key}" data-src="${src}" data-preview="${thumbSrc}" data-type="${type}" data-wide="false"${pngAttr}${macosAttr}>
            <span class="variant-preview-icon" aria-hidden="true">
              <img src="${thumbSrc}" alt="${altText}" width="48" height="48" loading="lazy">
            </span>
            <span class="variant-label">${esc(label)}</span>
          </div>`;
}

// "No official square icon" explainer — mirrors #detail-noicon in the catalog
// panel. Emitted only for items carrying `thumb`, i.e. where the square tile in
// the grid is a stand-in we drew and the real primary is the horizontal logo.
// Placed above the download buttons so it is read before anything is clicked.
// Also suppressed when the page has neither a "Варианты" nor an "Экосистема"
// section — with both absent the note has nothing on the page to anchor its
// explanation to and reads as a non sequitur floating above the download
// buttons.
function buildNoIconNote(item, lang = 'ru', hasVariants = false, hasEcosystem = false) {
  if (!item.thumb) return '';
  if (!hasVariants && !hasEcosystem) return '';
  const text = (lang === 'en' ? DICT.en : DICT.ru).noIconNote;
  return `
      <div class="noicon-note">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        <span data-i18n="noIconNote">${esc(text)}</span>
      </div>
`;
}

function buildVariantsSection(item, rel, lang = 'ru') {
  const rawVariants = item.variants || [];
  if (rawVariants.length === 0) return '';

  const primaryExt  = assetExt(item.file);
  const primaryType = primaryExt === 'png' ? 'png' : 'svg';

  const pngVariant = primaryType === 'svg'
    ? rawVariants.find(v => assetExt(v.file) === 'png')
    : null;

  const primary = {
    file:        item.file,
    type:        primaryType,
    label:       primaryType === 'png' ? 'PNG Icon' : 'SVG',
    pngFile:     pngVariant?.file ?? null,
    macos_styles: item.macos_styles || null,
  };

  const allVariants = [
    primary,
    ...rawVariants.map(v => ({ ...v, label: variantLabel(v, lang) })),
  ];

  const grid = allVariants.map((v, i) => buildVariantCard(v, i === 0, rel, item.name)).join('\n          ');

  return `
      <hr class="divider">

      <div class="info-section-lg">
        <span class="section-label" data-i18n="seoVariantsLabel">Варианты</span>
        <div class="variants-grid" id="variants-grid">
          ${grid}
        </div>
      </div>`;
}

function buildMacosStyleTabsHtml(id, extraClass, hidden) {
  const cls = ['macos-style-tabs', extraClass, hidden ? 'hidden' : ''].filter(Boolean).join(' ');
  return `<div class="${cls}" id="${id}">
        <button class="macos-style-tab active" data-style="color">
          <span class="macos-style-dot"></span>
          <span data-i18n="tabColor">Цвет</span>
        </button>
        <button class="macos-style-tab hidden" data-style="dark">
          <span class="macos-style-dot"></span>
          <span data-i18n="tabDark">Тёмное</span>
        </button>
        <button class="macos-style-tab hidden" data-style="light">
          <span class="macos-style-dot"></span>
          <span data-i18n="tabLight">Светлое</span>
        </button>
      </div>`;
}

function itemHasMacosStyles(item) {
  if (item.macos_styles) return true;
  return (item.variants || []).some(v => v.macos_styles);
}

function buildMacosStyleTabs(item, primaryType) {
  if (!itemHasMacosStyles(item)) return '';
  const hidden = primaryType !== 'png' || !item.macos_styles;
  return buildMacosStyleTabsHtml('macos-style-tabs', 'macos-tabs-side', hidden);
}

function buildMacosStyleTabsMobile(item, primaryType) {
  if (!itemHasMacosStyles(item)) return '';
  const hidden = primaryType !== 'png' || !item.macos_styles;
  return buildMacosStyleTabsHtml('macos-style-tabs-mobile', 'macos-tabs-info', hidden);
}

function buildDownloadButtons(item, rel) {
  const primaryExt  = assetExt(item.file);
  const primaryType = primaryExt === 'png' ? 'png' : 'svg';
  const primarySrc  = `${rel}assets/logos/${primaryType === 'png' ? 'pngs' : 'svgs'}/${item.file}`;

  const rawVariants = item.variants || [];
  const pngVariant  = rawVariants.find(v => assetExt(v.file) === 'png');
  const pngFile     = pngVariant?.file ?? (primaryType === 'png' ? item.file : null);
  const pngSrc      = pngFile ? assetSrc(pngFile, rel, 'png') : null;

  const svgFile  = primaryType === 'svg' ? item.file : rawVariants.find(v => assetExt(v.file) === 'svg')?.file;
  const svgSize  = svgFile ? assetFileSize(svgFile, 'svgs') : '';
  const pngSize  = pngFile ? assetFileSize(pngFile, 'pngs') : '';

  const copyBtn = `<button class="btn btn-primary" id="btn-copy" type="button"${primaryType !== 'svg' ? ' style="display:none"' : ''}>
            ${COPY_ICON}
            <span id="btn-copy-label" data-label="copySvg">Скопировать SVG</span>
          </button>`;

  const svgBtn = `<a class="btn btn-secondary" id="btn-dl-svg"${primaryType !== 'svg' ? ' style="display:none"' : ''} href="${primaryType === 'svg' ? primarySrc : '#'}" download="${primaryType === 'svg' ? item.file : ''}">
            ${DL_ICON}
            <span data-label="downloadSvg">Скачать SVG</span>${svgSize ? ` <span class="btn-size">${svgSize}</span>` : ''}
          </a>`;

  const pngBtn = pngSrc
    ? `<a class="btn btn-secondary" id="btn-dl-png" href="${pngSrc}" download="${downloadName(pngFile)}">
            ${DL_ICON}
            <span data-label="downloadPng">Скачать PNG</span>${pngSize ? ` <span class="btn-size">${pngSize}</span>` : ''}
          </a>`
    : `<a class="btn btn-secondary" id="btn-dl-png" href="#" download="${item.file.replace('.svg', '.png')}">
            ${DL_ICON}
            <span data-label="downloadPng">Скачать PNG</span>${svgFile && approxPngSize(svgFile) ? ` <span class="btn-size btn-size-approx" title="Примерный размер — файл рендерится в браузере при скачивании, байт в байт может немного отличаться">${approxPngSize(svgFile)}</span>` : ''}
          </a>`;

  // PNG-only, square variants only (ICO/ICNS are app-icon formats — meaningless
  // for a wide/full PNG lockup). Same one-click shortcut as the catalog's
  // detail panel (templates/partials/detail-panel.html) — that already offered
  // ICO/ICNS via the "Другие форматы" modal (shared js/download-modal.js), this
  // is just a faster path for the common square-icon case. Hidden by default;
  // js/seo-page.js's initPngBtn() reveals them for the active variant, same as
  // it already gates btn-dl-png.
  const icoBtn = `<button class="btn btn-secondary hidden" id="btn-download-ico" type="button">
            <svg width="15" height="15" viewBox="0 0 32 32" fill="currentColor"><path d="M15.49 6H6V15.492H15.492L15.49 6ZM26 6H16.508V15.492H26V6ZM15.49 16.508H6V26H15.492L15.49 16.508ZM26 16.508H16.508V26H26V16.508Z"/></svg>
            <span data-label="downloadIco">Скачать ICO</span>
          </button>`;

  const icnsBtn = `<button class="btn btn-secondary hidden" id="btn-download-icns" type="button">
            <svg width="15" height="15" viewBox="0 0 32 32" fill="currentColor"><path d="M23.8457 11.5898C22.4743 12.4367 21.6274 13.8892 21.6274 15.503C21.6274 17.3178 22.7166 18.9715 24.3703 19.6572C24.0484 20.6909 23.5722 21.67 22.9577 22.5612C22.0709 23.8115 21.1429 25.103 19.7714 25.103C18.4 25.103 17.9966 24.2961 16.3829 24.2961C14.8103 24.2961 14.2457 25.143 12.9543 25.143C11.6629 25.143 10.776 23.9738 9.768 22.5212C8.43657 20.5041 7.67086 18.1647 7.63086 15.7041C7.63086 11.711 10.2114 9.57268 12.7931 9.57268C14.1646 9.57268 15.2937 10.4607 16.1417 10.4607C16.9474 10.4607 18.2389 9.53268 19.7714 9.53268C20.5678 9.51148 21.3569 9.68835 22.068 10.0474C22.7791 10.4064 23.39 10.9364 23.8457 11.5898ZM19.0457 7.83896C19.7314 7.03211 20.0937 6.0241 20.1349 4.97496C20.1349 4.85382 20.1349 4.69268 20.0937 4.57153C18.9223 4.69283 17.8409 5.25501 17.0686 6.1441C16.3829 6.91096 15.9794 7.87896 15.9394 8.9281C15.9394 9.04925 15.9394 9.17039 15.9794 9.29039C16.0606 9.29039 16.1817 9.33153 16.2629 9.33153C17.3509 9.25153 18.36 8.68582 19.0457 7.83896Z"/></svg>
            <span data-label="downloadIcns">Скачать ICNS</span>
          </button>`;

  // The dropdown trigger itself is a build-time partial in seo-page.html
  // ({{> download-dropdown}}) — single source shared with the catalog. seo-page.js
  // wires it to open the shared "other formats" modal (js/download-modal.js).
  return [copyBtn, svgBtn, pngBtn, icoBtn, icnsBtn].join('\n          ');
}

function buildEcosystemSection(item, ecosystemLookup, rel, lang = 'ru') {
  const ecoIds = ecosystemIds(item);
  if (!ecoIds.length) return '';
  return ecoIds
    .map(ecoId => buildOneEcosystemSection(item, ecoId, ecosystemLookup, rel, lang))
    .filter(Boolean)
    .join('\n');
}

function buildOneEcosystemSection(item, ecoId, ecosystemLookup, rel, lang = 'ru') {
  const members = (ecosystemLookup[ecoId] || []);
  if (members.length <= 1) return '';

  const en      = lang === 'en';
  const ecoName = ecosystemName(ecoId, lang);
  const soonAria = en ? '(soon)' : '(скоро)';
  const curAria  = en ? '(current)' : '(текущий)';
  const cards = members.map(({ item: m }) => {
    const isCurrent  = m.figma === item.figma;
    const isSoon     = !!m.comingSoon;
    const thumbFile  = m.thumb || m.file;
    const ext        = assetExt(thumbFile);
    const src        = thumbSrc(thumbFile, rel, ext);
    const url        = seoUrl(m);
    const nm         = esc(en ? (m.name_en || m.name) : m.name);
    const altText    = en ? `${nm} logo` : `Логотип ${nm}`;

    if (isCurrent) {
      return `<a class="ecosystem-card current" href="#" aria-label="${nm} ${curAria}">
            <img src="${src}" alt="${altText}" width="48" height="48">
            <span class="ecosystem-label">${nm}</span>
          </a>`;
    }
    if (isSoon) {
      return `<div class="ecosystem-card soon" aria-label="${nm} ${soonAria}">
            <span class="ecosystem-soon-badge" data-i18n="comingSoon">Скоро</span>
            <img src="${src}" alt="${altText}" width="48" height="48">
            <span class="ecosystem-label">${nm}</span>
          </div>`;
    }
    const cardHref = url ? (en ? `/en${url}` : rel + url.slice(1)) : '#';
    return `<a class="ecosystem-card" href="${cardHref}" aria-label="${nm}">
            <img src="${src}" alt="${altText}" width="48" height="48">
            <span class="ecosystem-label">${nm}</span>
          </a>`;
  }).join('\n          ');

  return `
      <hr class="divider">

      <div class="info-section-lg">
        <span class="section-label" data-eco-id="${esc(ecoId)}">${
          ecosystemSectionLabel(ecoId, lang)
            ? esc(ecosystemSectionLabel(ecoId, lang))
            : `<span data-i18n="detailEcosystem">Экосистема</span> <span class="eco-name">${esc(ecoName)}</span>`
        }</span>
        <div class="ecosystem-grid">
          ${cards}
        </div>
      </div>`;
}

// ── Sponsor banner ─────────────────────────────────────────────────────────────

const SPONSOR_INFO_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="7" x2="12" y2="13"/><line x1="12" y1="17" x2="12" y2="17"/></svg>`;

// Renders the sponsor banner for one item, or '' if the logo has no sponsor.
// Picture left, gradient background, title + text; «Спонсор» + info tooltip top-right.
function buildSponsorSection(item, rel, lang = 'ru') {
  const sp = SPONSORS[sponsorKey(item)];
  if (!sp || !sp.title) return '';

  const en    = lang === 'en';
  const title = en ? (sp.title_en || sp.title) : sp.title;
  const text  = en ? (sp.text_en  || sp.text || '') : (sp.text || '');
  const accent = sp.accent || '';
  const img    = sp.image ? `${rel}assets/sponsors/${sp.image}` : '';
  const href   = sp.url || '#';

  const eyebrow = en ? 'Sponsor' : 'Спонсор';
  const adHint  = en ? 'This is an advertisement' : 'Это реклама';
  const cta     = en ? (sp.cta_en || sp.cta || '') : (sp.cta || '');

  const eridStrip = sp.erid
    ? `<span class="sp-banner-erid">${en ? 'Ad' : 'Реклама'} · erid: ${esc(sp.erid)}</span>`
    : '';

  const ctaEl = cta
    ? `<span class="sp-banner-cta" data-cta-en="${esc(sp.cta_en || '')}">${esc(cta)}</span>`
    : '';

  return `
    <aside class="sp-banner" id="sp-banner">
      <a class="sp-banner-link${img ? '' : ' sp-banner-link--no-image'}" href="${esc(href)}" target="_blank" rel="noopener sponsored nofollow"${accent ? ` style="--sp-accent:${esc(accent)}"` : ''}>
        <span class="sp-banner-body">
          <span class="sp-banner-title" data-title-en="${esc(sp.title_en || '')}">${esc(title)}</span>
          ${text ? `<span class="sp-banner-desc" data-desc-en="${esc(sp.text_en || '')}">${esc(text)}</span>` : ''}
          ${ctaEl}
          <span class="sp-banner-mark">
            <span class="sp-banner-eyebrow" data-i18n="sponsorEyebrow">${eyebrow}</span>
            <span class="sp-banner-info" tabindex="0" role="note"
                  data-i18n-aria="sponsorAdHint" aria-label="${adHint}">
              ${SPONSOR_INFO_ICON}
              <span class="sp-banner-tip" data-i18n="sponsorAdHint">${adHint}</span>
            </span>
          </span>
        </span>
        ${img ? `<span class="sp-banner-figure">
          <img src="${img}" alt="${esc(title)}" width="72" height="72" loading="lazy">
        </span>` : ''}
        ${eridStrip}
      </a>
    </aside>`;
}

// ── Related logos (neighbours from the same category) ──────────────────────────

function categoryIconBySlug(slug) {
  return CATEGORY_ICONS[slug] || DEFAULT_ICON;
}

// Full-width RSYA block, placed right before "Другие логотипы этой
// категории" on every logo SEO page.
function buildSeoAdSection() {
  return `
  <div class="seo-ad-block">
    <!-- Yandex.RTB R-A-19679616-6 -->
    <div id="yandex_rtb_R-A-19679616-6"></div>
    <script>
    window.yaContextCb.push(() => {
        Ya.Context.AdvManager.render({
            "blockId": "R-A-19679616-6",
            "renderTo": "yandex_rtb_R-A-19679616-6"
        })
    })
    </script>
  </div>`;
}

// Full-width RSYA feed block, placed right after the "N+ логотипов в
// каталоге" CTA at the bottom of every logo SEO page.
function buildSeoAdSectionBottom() {
  return `
  <div class="seo-ad-block seo-ad-block-bottom">
    <!-- Yandex.RTB R-A-19679616-5 -->
    <div id="yandex_rtb_R-A-19679616-5"></div>
    <script>
    window.yaContextCb.push(() => {
        Ya.Context.AdvManager.render({
            "blockId": "R-A-19679616-5",
            "renderTo": "yandex_rtb_R-A-19679616-5",
            "type": "feed"
        })
    })
    </script>
  </div>`;
}

// Up to 12 ready logos from the same category (current excluded) — internal
// cross-linking that's relevant to a visitor who landed from search.
function buildRelatedSection(item, siblings, homeRel, assetRel, lang = 'ru') {
  const en   = lang === 'en';
  const pool = (siblings || []).filter(m => m.figma !== item.figma);
  if (pool.length < 1) return '';

  const label = (en ? DICT.en : DICT.ru).seoRelatedLabel;
  const cards = pool.map(m => {
    const thumbFile = m.thumb || m.file;
    const ext     = assetExt(thumbFile);
    const src     = relatedThumbSrc(thumbFile, assetRel, ext);
    const url     = seoUrl(m);
    const nm      = esc(en ? (m.name_en || m.name) : m.name);
    const altText = en ? `${nm} logo` : `Логотип ${nm}`;
    return `<a class="related-card" href="${url ? homeRel + url.slice(1) : '#'}" aria-label="${nm}">
            <img src="${src}" alt="${altText}" width="48" height="48" loading="lazy">
            <span class="related-label">${nm}</span>
          </a>`;
  }).join('\n          ');

  return `
  <section class="catalog-section" aria-label="${label}">
    <h2 class="catalog-section-title" data-i18n="seoRelatedLabel">${label}</h2>
    <div class="related-grid">
          ${cards}
    </div>
  </section>`;
}

// Full catalog entry: all 37 categories with live counts → /logos/<slug>/.
// Static & crawlable; the prominent "whole catalog" the user can't find via the CTA.
// Each card shows 3–4 logo thumbnails from that category instead of an icon.
function buildCatalogGridSection(categories, homeRel, assetRel, itemsByCat, lang = 'ru', catSlug = null) {
  if (!categories || !categories.length) return '';
  const en    = lang === 'en';
  const label = (en ? DICT.en : DICT.ru).seoCategoriesLabel;

  const cards = categories.filter(c => c.slug !== catSlug).map(c => {
    const nm = esc(en ? (c.section_en || c.section) : c.section);
    const all = itemsByCat[c.slug] || [];
    const previews = all.slice(0, 4);
    const thumbs = previews.map(m => {
      const tf  = m.thumb || m.file;
      const src = miniThumbSrc(tf, assetRel, assetExt(tf));
      return `<img src="${src}" alt="" width="20" height="20" loading="lazy">`;
    }).join('');
    const more = all.length > 4
      ? `<span class="catalog-cat-more" aria-hidden="true"><svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg></span>`
      : '';

    // Мобилка (css/seo-page.css) показывает полное "N логотипов" — .catalog-cat-count-label
    // скрыт на десктопе, там остаётся голое число, как было.
    const countWordRu = pluralRu(c.count, ['логотип', 'логотипа', 'логотипов']);
    const countWordEn = c.count === 1 ? 'logo' : 'logos';
    return `<a class="catalog-cat" href="${homeRel}logos/${c.slug}/">
            <span class="catalog-cat-thumbs" aria-hidden="true">${thumbs}${more}</span>
            <span class="catalog-cat-bottom">
              <span class="catalog-cat-name" data-section-en="${esc(c.section_en || c.section)}">${nm}</span>
              <span class="catalog-cat-count">${c.count}<span class="catalog-cat-count-label" data-en=" ${countWordEn}"> ${countWordRu}</span></span>
            </span>
          </a>`;
  }).join('\n          ');

  return `
  <section class="catalog-section" aria-label="${label}">
    <h2 class="catalog-section-title" data-i18n="seoCategoriesLabel">${label}</h2>
    <div class="catalog-cats">
          ${cards}
    </div>
  </section>`;
}

// Single source of truth for which formats a logo offers. ICO/ICNS are only
// available for square logos (primary not ending in `-full`) — mirrors the
// download-dropdown gating in seo-page.js / main.js. Keeps the «Формат» meta,
// the FAQ text and the FAQPage JSON-LD in sync.
function isSquareLogo(item) {
  return !/-full(\.[^.]+)?$/.test(item.file);
}
// "SVG, PNG, ICO и ICNS" — comma-join all but the last item, conjunction before it.
function joinWithConjunction(list, conj) {
  if (list.length <= 1) return list.join('');
  return `${list.slice(0, -1).join(', ')} ${conj} ${list[list.length - 1]}`;
}

function logoFormats(item) {
  const primaryExt = assetExt(item.file);
  const hasSvg = primaryExt !== 'png' || (item.variants || []).some(v => assetExt(v.file) === 'svg');
  // PNG is always downloadable: either a real PNG file exists, or (see
  // buildDownloadButtons' pngBtn fallback + js/seo-page.js downloadPngFromSvg)
  // the SVG is rasterized to PNG client-side on click. There is no case where
  // the "Скачать PNG" button doesn't work.
  const hasPng = true;
  const square = isSquareLogo(item);
  // WebP/PDF/AI/EPS are always downloadable via the "Другие форматы" modal —
  // raster fallback for PNG-only logos, real vector export when an SVG exists.
  const list = [hasSvg && 'SVG', hasPng && 'PNG', square && 'ICO', square && 'ICNS', 'WebP', 'PDF', 'AI', 'EPS'].filter(Boolean);
  const fmtStr   = joinWithConjunction(list, 'и');
  const fmtStrEn = joinWithConjunction(list, 'and');
  return { hasSvg, hasPng, square, list, fmtStr, fmtStrEn };
}

function buildMetaTableRows(item, lang = 'ru') {
  const { fmtStr, fmtStrEn } = logoFormats(item);
  const fmt = lang === 'en' ? fmtStrEn : fmtStr;

  const figmaDisplay = (item.figma || '').replace(/\//g, ' / ');

  const brandRow = item.brandUrl
    ? `<tr class="meta-row">
          <th scope="row" class="meta-key" data-i18n="detailBrand">Бренд</th>
          <td class="meta-val"><a href="${esc(item.brandUrl)}" target="_blank" rel="noopener noreferrer" data-i18n="seoBrandRulesLink">Правила использования →</a></td>
        </tr>`
    : '';

  const date = itemDate(item);
  const isModified = item.dateModified !== undefined;
  const dateLabel = lang === 'en'
    ? (isModified ? 'Modified' : 'Added')
    : (isModified ? 'Изменён' : 'Добавлено');
  const dateFormatted = formatDate(date, lang);
  const dateRow = `<tr class="meta-row">
          <th scope="row" class="meta-key">${dateLabel}</th>
          <td class="meta-val"><time datetime="${date}">${dateFormatted}</time></td>
        </tr>`;

  const downloadCount = DOWNLOAD_STATS[item.figma] || 0;
  const downloadsRow = downloadCount > 0
    ? `<tr class="meta-row">
          <th scope="row" class="meta-key">${lang === 'en' ? 'Downloaded' : 'Скачано'}</th>
          <td class="meta-val">${lang === 'en' ? `${downloadCount} time${downloadCount === 1 ? '' : 's'}` : `${downloadCount} ${pluralRu(downloadCount, ['раз', 'раза', 'раз'])}`}</td>
        </tr>`
    : '';

  return `<tr class="meta-row">
          <th scope="row" class="meta-key" data-i18n="seoMetaFormat">Формат</th>
          <td class="meta-val">${esc(fmt)}</td>
        </tr>
        <tr class="meta-row">
          <th scope="row" class="meta-key">Figma</th>
          <td class="meta-val">${esc(figmaDisplay)}</td>
        </tr>${brandRow}${dateRow}${downloadsRow}`;
}

// Real <table> so format/size/date data is machine-parseable as tabular data
// — the format AI answer engines cite most reliably (CLAUDE.md rec #3).
// Visual layout stays byte-for-byte the same flex grid via CSS display
// overrides on table/tbody (see .meta-table in css/seo-page.css).
function buildMetaTableSection(item, nm, lang = 'ru') {
  const caption = lang === 'en' ? `${nm} logo specs` : `Характеристики логотипа ${nm}`;
  return `<table class="meta-table">
        <caption class="sr-only">${esc(caption)}</caption>
        <tbody>
        ${buildMetaTableRows(item, lang)}
        </tbody>
      </table>`;
}

// ── Brand colors (extracted from SVG source — source of truth) ─────────────────
// Сама логика извлечения — в scripts/lib/brand-colors.js: её делит с
// build-blog.js (виджет `:::widget logo-colors`), чтобы палитра в статье не
// разошлась с палитрой на странице того же логотипа.

function buildColorsSection(colors, lang = 'ru', nm = '') {
  if (!colors.length) return '';
  const copyLabel = lang === 'en' ? 'Copy' : 'Скопировать';
  const caption = lang === 'en' ? `${nm} brand colors, HEX and RGB codes` : `Фирменные цвета логотипа ${nm}, HEX и RGB коды`;
  const swatches = colors.map(c => {
    const hex = c.toUpperCase();
    const rgb = hexToRgb(c);
    // Single click target per swatch (two adjacent clickable lines caused
    // mis-clicks in two earlier attempts — user-reported both times). Click
    // copies whichever value is currently highlighted, then flips the
    // highlight to the other format for the next click — cycling HEX↔RGB
    // on one big unambiguous target, à la Coolors-style swatch clicks.
    const rgbLabel = `RGB ${rgb}`;
    return `<tr><td><button class="color-swatch" type="button" data-hex="${hex}" data-rgb="${rgb}" data-format="hex" aria-label="${copyLabel} ${hex}">
            <span class="color-swatch-dot" style="background:${c}"></span>
            <span class="color-swatch-text">
              <span class="color-swatch-line is-active" data-role="hex">${hex}</span>
              <span class="color-swatch-line" data-role="rgb">${rgbLabel}</span>
            </span>
          </button></td></tr>`;
  }).join('\n          ');

  // Real <table> — HEX codes are comparison-style data (CLAUDE.md rec #3).
  // Visual layout stays the original flex-wrap pill row via CSS display
  // overrides on table/tbody/tr/td (see .colors-grid in css/seo-page.css).
  return `
      <hr class="divider">

      <div class="info-section-lg">
        <span class="section-label" data-i18n="seoBrandColorsLabel">Цвета бренда</span>
        <table class="colors-grid" id="colors-grid">
          <caption class="sr-only">${esc(caption)}</caption>
          <tbody>
          ${swatches}
          </tbody>
        </table>
      </div>`;
}

// ── Embed widget (SVG/PNG <img> snippet linking back to this page) ─────────────
// Only offers a format when a REAL static asset file exists — SVG-primary logos
// render PNG client-side on demand (see logoFormats()'s hasPng comment), so a
// "PNG" embed for them would be a broken <img src> on someone else's site.
// The <a href> in the generated snippet points at this logo's own canonical
// page — every site that embeds the snippet is a natural backlink to it.
function assetUrl(file, ext) {
  return `${BASE_URL}/assets/logos/${ext === 'png' ? 'pngs' : 'svgs'}/${file}`;
}

// No format/variant picker here — one variant is one file, one embed. The
// variants grid right above this section (when one exists) is already the
// control for "which logo image": seo-page.js's #variants-grid click handler
// calls updateEmbedForVariant(src, type) with whatever the visitor just made
// the active download, and this widget just mirrors that src verbatim.
// (An earlier cut paired an SVG primary with any stray .png file elsewhere
// in variants[] and called that a "format" choice — wrong: on real data that
// stray file is often a different artwork entirely, e.g. an iOS-Tahoe-style
// icon variant, not a raster of the same primary. Each such file is already
// its own selectable card in the variants grid; it doesn't need a second,
// misleading way to reach it from inside the primary's embed code.)
function buildEmbedSection(item, nm, fullUrl, lang = 'ru') {
  const primaryExt = assetExt(item.file);
  const src = assetUrl(item.file, primaryExt === 'png' ? 'png' : 'svg');
  const altText = lang === 'en' ? `${nm} logo` : `Логотип ${nm}`;

  // One bordered panel — toolbar (width + copy) over the code — rather than
  // three separately-bordered boxes floating in a column, which read as
  // unrelated controls. The "Ширина" label lives inside the toolbar so it
  // doesn't stack directly under the section label as a second heading.
  return `
      <div class="info-section-lg embed-widget">
        <span class="section-label" data-i18n="seoEmbedLabel">Встроить на сайт</span>
        <div class="embed-box">
          <div class="embed-toolbar">
            <label class="embed-width-field">
              <span class="embed-width-label" data-i18n="seoEmbedWidth">Ширина</span>
              <span class="embed-num">
                <input class="embed-num-input" type="number" id="embed-width" value="200" min="8" max="4000" step="10">
                <span class="embed-num-unit">px</span>
              </span>
            </label>
            <button type="button" class="embed-copy-btn" id="btn-embed-copy">
              ${COPY_ICON}
              <span id="embed-copy-label" data-i18n="seoEmbedCopy">Скопировать код</span>
            </button>
          </div>
          <code class="embed-code" id="embed-code"
            data-page-url="${esc(fullUrl)}"
            data-src="${esc(src)}"
            data-alt="${esc(altText)}"></code>
        </div>
      </div>`;
}

// ── Figma how-to (visible markup + HowTo JSON-LD share the same data) ──────────
// GEO rationale: procedural "how do I X" content is the format AI answer
// engines (ChatGPT/Perplexity/AI Overviews) cite most reliably, and the Figma
// plugin is the one thing genuinely unique to this catalog vs. every other
// logo-download site — neither the schema nor the on-page copy used that
// until now. Steps double as HowToStep text, same pattern as buildFaqItems.
function buildFigmaHowtoSteps(nm, ne, figmaDisplay, lang = 'ru') {
  return [
    {
      title: `Откройте плагин Trace Logos`,
      titleEn: `Open the Trace Logos plugin`,
      desc: `В Figma: меню «Plugins» → «Trace Logos». Если ещё не установлен, поставьте один раз из Figma Community.`,
      descEn: `In Figma: the Plugins menu → "Trace Logos". Install it once from the Figma Community if you haven't already.`,
    },
    {
      title: `Найдите «${nm}» по названию`,
      titleEn: `Search for "${ne}"`,
      desc: `Введите «${nm}» в поиск плагина. Компонент называется «${figmaDisplay}» и содержит все варианты и стили логотипа.`,
      descEn: `Type "${ne}" into the plugin's search field. The component is named "${figmaDisplay}" and includes every variant and style of the logo.`,
    },
    {
      title: `Вставьте на холст`,
      titleEn: `Drop it on the canvas`,
      desc: `Клик по превью — логотип появится на холсте векторным слоем, готовым к перекраске и экспорту в любой формат.`,
      descEn: `Click the preview and the logo lands on your canvas as an editable vector layer, ready to recolor and export.`,
    },
  ];
}

function buildFigmaHowtoSection(item, nm, ne, lang = 'ru') {
  if (!item.figma) return '';
  const figmaDisplay = item.figma.replace(/\//g, ' / ');
  const steps = buildFigmaHowtoSteps(nm, ne, figmaDisplay, lang);
  const en = lang === 'en';
  const title = en ? `How to add the ${ne} logo in Figma` : `Как вставить лого ${nm} в Figma`;
  const ctaLabel = en ? 'Open the Figma plugin' : 'Открыть плагин Figma';

  const cards = steps.map((s, i) => `
      <div class="howto-step">
        <span class="howto-step-badge">${en ? 'Step' : 'Шаг'} ${i + 1}</span>
        <span class="howto-step-title">${esc(en ? s.titleEn : s.title)}</span>
        <p class="howto-step-desc">${esc(en ? s.descEn : s.desc)}</p>
      </div>`).join('');

  return `
  <section class="howto-section" id="figma-howto" aria-labelledby="howto-title">
    <h2 id="howto-title" class="catalog-section-title">${esc(title)}</h2>
    <div class="howto-steps">${cards}
    </div>
    <a class="howto-cta" href="${FIGMA_PLUGIN_URL}" target="_blank" rel="noopener">
      <svg width="14" height="14" viewBox="0 0 38 57" fill="none" aria-hidden="true"><path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" fill="#1ABCFE"/><path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" fill="#0ACF83"/><path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" fill="#FF7262"/><path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" fill="#F24E1E"/><path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" fill="#A259FF"/></svg>
      <span>${esc(ctaLabel)}</span>
    </a>
  </section>`;
}

// ── FAQ (visible markup + FAQPage JSON-LD share the same data) ─────────────────

// Fifth FAQ question — generated from this item's own data instead of a fixed
// template, so it varies per logo instead of only substituting the name.
// Priority: ecosystem siblings > variant list > category siblings (always
// available, guarantees every item gets a non-templated question).
function buildDataFaqItem(item, ecosystemLookup, siblings, section, section_en) {
  const nm = item.name;
  const ne = item.name_en || item.name;

  // An item can belong to more than one ecosystem — use the first one that
  // actually has other members to talk about.
  for (const ecoId of ecosystemIds(item)) {
    // Rotate so each item shows the 5 members *after itself* in the ecosystem
    // list (wrapping around), not always the same first 5 — otherwise, on a
    // large ecosystem (e.g. Apple, ~90 members) nearly every page ends up
    // with the exact same sentence, which is worse than the templating this
    // question was meant to break up.
    const raw = ecosystemLookup[ecoId] || [];
    const idx = raw.findIndex(({ item: m }) => m.figma === item.figma);
    const rotated = idx >= 0 ? [...raw.slice(idx + 1), ...raw.slice(0, idx)] : raw;
    const allMembers = rotated
      .map(({ item: m }) => m)
      .filter(m => m.figma !== item.figma && !m.comingSoon);
    if (allMembers.length) {
      const members = allMembers.slice(0, 5);
      const rest    = allMembers.length - members.length;
      const ecoName   = ecosystemName(ecoId, 'ru');
      const ecoNameEn = ecosystemName(ecoId, 'en');
      const names   = members.map(m => m.name).join(', ') + (rest > 0 ? ` и ещё ${rest}` : '');
      const namesEn = members.map(m => m.name_en || m.name).join(', ') + (rest > 0 ? ` and ${rest} more` : '');
      const linked   = members.map(m => linkTo(m, m.name)).join(', ') + (rest > 0 ? ` и ещё ${rest}` : '');
      const linkedEn = members.map(m => linkTo(m, m.name_en || m.name)).join(', ') + (rest > 0 ? ` and ${rest} more` : '');
      return {
        q:  `Какие ещё логотипы есть в экосистеме ${ecoName}?`,
        a:  `В экосистему ${ecoName} на Trace Logo's также входят: ${names}.`,
        qe: `What other logos are part of the ${ecoNameEn} ecosystem?`,
        ae: `The ${ecoNameEn} ecosystem on Trace Logo's also includes: ${namesEn}.`,
        aHtml:   `В экосистему ${esc(ecoName)} на Trace Logo's также входят: ${linked}.`,
        aHtmlEn: `The ${esc(ecoNameEn)} ecosystem on Trace Logo's also includes: ${linkedEn}.`,
      };
    }
  }

  const variants = item.variants || [];
  if (variants.length) {
    const labels   = variants.map(v => variantLabel(v, 'ru'));
    const labelsEn = variants.map(v => variantLabel(v, 'en'));
    return {
      q:  `Сколько вариантов оформления есть у логотипа ${nm}?`,
      a:  `Помимо основного варианта, у логотипа ${nm} есть ${variants.length} дополнительны${variants.length === 1 ? 'й' : 'х'}: ${labels.join(', ')}.`,
      qe: `How many design variants does the ${ne} logo have?`,
      ae: `Besides the primary version, the ${ne} logo has ${variants.length} additional variant${variants.length === 1 ? '' : 's'}: ${labelsEn.join(', ')}.`,
    };
  }

  const others = siblings.filter(s => s.figma !== item.figma && !s.comingSoon).slice(0, 5);
  if (others.length) {
    const secName   = section;
    const secNameEn = section_en || section;
    const names   = others.map(s => s.name).join(', ');
    const namesEn = others.map(s => s.name_en || s.name).join(', ');
    const linked   = others.map(s => linkTo(s, s.name)).join(', ');
    const linkedEn = others.map(s => linkTo(s, s.name_en || s.name)).join(', ');
    return {
      q:  `Какие ещё логотипы есть в категории «${secName}»?`,
      a:  `В категории «${secName}» на Trace Logo's также есть: ${names}.`,
      qe: `What other logos are in the "${secNameEn}" category?`,
      ae: `The "${secNameEn}" category on Trace Logo's also includes: ${namesEn}.`,
      aHtml:   `В категории «${esc(secName)}» на Trace Logo's также есть: ${linked}.`,
      aHtmlEn: `The "${esc(secNameEn)}" category on Trace Logo's also includes: ${linkedEn}.`,
    };
  }

  return null;
}

// Stable pseudo-random index — same item always picks the same phrasing across
// rebuilds (no git diff noise), but different items land on different phrasing.
function hashPick(seed, pool) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return pool[h % pool.length];
}

// Sixth FAQ question — "X vs Y" comparison, the pattern GEO guides flag as the
// most common AI-answer format. "Competitor" = another item in the same
// category (siblings) with its own extractable colors — no hand-authored
// text, no per-brand knowledge, scales to all ~587 logos unattended.
//
// Every fixed phrase (lead-in, closer) is picked from a small pool by a hash
// of item.figma, not a single hardcoded string — 500+ pages sharing one
// verbatim sentence ("Логотипы не связаны между собой...") reads as templated
// boilerplate to Yandex; rotating phrasing per item avoids that duplicate-
// content signal while staying fully deterministic (rebuild-stable).
const COMPARISON_LEADS = [
  { ru: (cat) => `Оба бренда — ${cat}, но фирменные цвета разные:`, en: (cat) => `Both brands are ${cat}, but their colors differ:` },
  { ru: (cat) => `${cat} — общая категория, а вот палитра у брендов разная:`, en: (cat) => `Same category (${cat}), different color palette:` },
  { ru: (cat) => `Логотипы работают в одной категории (${cat}), но выглядят по-разному:`, en: (cat) => `Both logos live in the same category (${cat}) but look nothing alike:` },
];
const COMPARISON_CLOSERS = [
  { ru: 'Логотипы не связаны между собой и принадлежат разным компаниям.', en: 'The logos are unrelated and belong to different companies.' },
  { ru: 'Совпадений в фирменном стиле у них нет.', en: 'There is no overlap in brand identity between them.' },
  { ru: 'Каждый бренд использует собственную палитру.', en: 'Each brand sticks to its own palette.' },
  { ru: 'Ничего общего в форме и цвете у них нет.', en: 'They share nothing in shape or color.' },
  { ru: 'Логотипы визуально не пересекаются.', en: "Visually the logos don't overlap." },
];
const COMPARISON_Q = [
  { ru: (a, b) => `Чем логотип ${a} отличается от логотипа ${b}?`, en: (a, b) => `What's the difference between the ${a} and ${b} logos?` },
  { ru: (a, b) => `В чём разница между логотипами ${a} и ${b}?`, en: (a, b) => `How do the ${a} and ${b} logos differ?` },
];

const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

function buildComparisonFaqItem(item, colors, siblings, section, section_en) {
  if (!colors.length) return null;
  const rival = (siblings || []).find(s => s.figma !== item.figma && !s.comingSoon && extractBrandColors(s).length);
  if (!rival) return null;

  const nm = item.name, ne = item.name_en || item.name;
  const rm = rival.name, re = rival.name_en || rival.name;
  const rivalColors = extractBrandColors(rival);

  const seed      = item.figma || nm;
  const lead      = hashPick(seed + ':lead', COMPARISON_LEADS);
  const closer    = hashPick(seed + ':close', COMPARISON_CLOSERS);
  const qTemplate = hashPick(seed + ':q', COMPARISON_Q);

  const hexA    = colors.slice(0, 3).map(c => c.toUpperCase());
  const hexB    = rivalColors.slice(0, 3).map(c => c.toUpperCase());
  const catLc   = (section || 'логотипы этой категории').toLowerCase();
  const catLcEn = (section_en || section || 'this category').toLowerCase();

  return {
    q:  qTemplate.ru(nm, rm),
    a:  cap(`${lead.ru(catLc)} у ${nm} ${hexA.join(', ')}, у ${rm} ${hexB.join(', ')}. ${closer.ru}`),
    qe: qTemplate.en(ne, re),
    ae: cap(`${lead.en(catLcEn)} ${ne} uses ${hexA.join(', ')}, ${re} uses ${hexB.join(', ')}. ${closer.en}`),
  };
}

// "color" isn't a key in item.macos_styles (only the alt styles are listed
// there — see buildMacosStyleTabsHtml) but it's always the first, always-on
// tab, so it must be counted alongside dark/light or the total is off by one.
const MACOS_STYLE_LABELS    = { color: 'цветной', dark: 'тёмный', light: 'светлый', tinted: 'акцентный' };
const MACOS_STYLE_LABELS_EN = { color: 'color', dark: 'dark', light: 'light', tinted: 'tinted' };

// item.macos_styles lives either on the item itself or on whichever variant
// carries it (iOS-version variants each have their own set) — see main.js:554-558.
function macosStylesOf(item) {
  return item.macos_styles || (item.variants || []).find(v => v.macos_styles)?.macos_styles || null;
}

function buildFaqItems(item, colors, ecosystemLookup, siblings, section, section_en) {
  const { fmtStr, fmtStrEn, square } = logoFormats(item);

  const nm = item.name;                       // RU name
  const ne = item.name_en || item.name;       // EN name (falls back to RU)

  const faq = [];
  faq.push({
    q:  `В каком формате можно скачать логотип ${nm}?`,
    a:  `Логотип ${nm} доступен в ${fmtStr}.`,
    qe: `What formats is the ${ne} logo available in?`,
    ae: `The ${ne} logo is available in ${fmtStrEn}.`,
  });
  // ICO is the format people most often search for by name ("скачать X ico") —
  // surface a direct download action inside the FAQ answer itself (see
  // buildFaqSection) instead of only the "other formats" modal, without touching
  // the primary action row that SVG-seeking visitors (the majority) scan first.
  if (square) faq.push({
    q:  `Как скачать логотип ${nm} в формате ICO?`,
    a:  `Иконку ${nm} можно скачать в формате ICO (.ico) для использования в Windows-приложениях и на рабочем столе.`,
    qe: `How do I download the ${ne} logo as an ICO file?`,
    ae: `The ${ne} icon can be downloaded as an ICO (.ico) file for use in Windows apps and on the desktop.`,
    action: { label: 'Скачать ICO', labelEn: 'Download ICO', id: 'btn-faq-download-ico' },
  });
  faq.push({
    q:  `Логотип ${nm} можно скачать бесплатно?`,
    a:  `Да. Скачать логотип ${nm} на Trace Logo's можно бесплатно и без регистрации. Логотип принадлежит правообладателю — используйте его в соответствии с фирменными правилами бренда.`,
    qe: `Is the ${ne} logo free to download?`,
    ae: `Yes. The ${ne} logo can be downloaded from Trace Logo's for free and without registration. The logo belongs to its rights holder — use it in accordance with the brand guidelines.`,
  });
  if (colors.length) faq.push({
    q:  `Какие официальные цвета у логотипа ${nm}?`,
    a:  `Основные цвета логотипа ${nm}: ${colors.map(c => c.toUpperCase()).join(', ')}. Значения извлечены из исходного SVG-файла.`,
    qe: `What are the official colors of the ${ne} logo?`,
    ae: `The main colors of the ${ne} logo are: ${colors.map(c => c.toUpperCase()).join(', ')}. Values extracted from the original SVG file.`,
  });
  const styles = macosStylesOf(item);
  if (styles) {
    const keys  = ['color', ...Object.keys(styles)];
    const ru    = joinWithConjunction(keys.map(k => MACOS_STYLE_LABELS[k] || k), 'и');
    const en    = joinWithConjunction(keys.map(k => MACOS_STYLE_LABELS_EN[k] || k), 'and');
    faq.push({
      q:  `В каких стилях доступна иконка ${nm} для macOS?`,
      a:  `Иконка ${nm} доступна в ${keys.length} стилях оформления: ${ru} — переключаются вкладками над превью.`,
      qe: `What macOS icon styles are available for ${ne}?`,
      ae: `The ${ne} icon is available in ${keys.length} styles: ${en} — switchable via the tabs above the preview.`,
    });
  }
  const dataFaq = buildDataFaqItem(item, ecosystemLookup, siblings, section, section_en);
  if (dataFaq) faq.push(dataFaq);
  const comparisonFaq = buildComparisonFaqItem(item, colors, siblings, section, section_en);
  if (comparisonFaq) faq.push(comparisonFaq);
  return faq;
}

function buildFaqSection(faq, lang = 'ru') {
  if (!faq.length) return '';
  const rows = faq.map(f => {
    const q = lang === 'en' ? (f.qe || f.q) : f.q;
    // aHtml/aHtmlEn ("see also" links to other logo pages) render as real <a>
    // tags; everything else stays plain escaped text. JSON-LD (buildJsonLd)
    // never reads these fields, so it's unaffected either way.
    const aRendered   = lang === 'en' ? (f.aHtmlEn || esc(f.ae || f.a)) : (f.aHtml || esc(f.a));
    // Attribute value carries the same (possibly HTML) content, escaped for the
    // attribute delimiter — js/seo-page.js decodes it back via .dataset and sets
    // innerHTML on runtime EN swap, so a link built here doesn't get clobbered.
    const dataAEn = esc(f.aHtmlEn || f.ae || '');
    const actionBtn = f.action
      ? `<button class="btn btn-secondary faq-action-btn" id="${f.action.id}" type="button">${DL_ICON}<span>${esc(lang === 'en' ? (f.action.labelEn || f.action.label) : f.action.label)}</span></button>`
      : '';
    return `<details class="faq-item" data-q-en="${esc(f.qe || '')}" data-a-en="${dataAEn}">
          <summary class="faq-q">${esc(q)}</summary>
          <p class="faq-a">${aRendered}</p>
          ${actionBtn}
        </details>`;
  }).join('\n        ');

  return `
  <section class="faq-section" aria-labelledby="faq-title">
    <h2 id="faq-title" class="faq-title" data-i18n="faqTitle">Частые вопросы</h2>
    <div class="faq-list">
        ${rows}
    </div>
  </section>`;
}

function buildSeoPageData(item, rel, lang = 'ru') {
  const primaryExt  = assetExt(item.file);
  const primaryType = primaryExt === 'png' ? 'png' : 'svg';
  const primarySrc  = `${rel}assets/logos/${primaryType === 'png' ? 'pngs' : 'svgs'}/${item.file}`;
  const displayName = lang === 'en' ? (item.name_en || item.name) : item.name;

  const translatedVariants = (item.variants || []).map(v =>
    (lang === 'en' && v.label_en) ? { ...v, label: v.label_en } : v
  );
  return `window.__SEO_PAGE__ = {
  assetBase:   '${rel}assets/logos/',
  name:        '${(displayName || '').replace(/'/g, "\\'")}',
  defaultSrc:  '${primarySrc}',
  defaultType: '${primaryType}',
  defaultWide: ${isFullFile(item.file)},
  figma:       '${item.figma || ''}',
  macosStyles: ${JSON.stringify(item.macos_styles || null)},
  item:        ${JSON.stringify({ figma: item.figma || '', file: item.file, variants: translatedVariants })},
};`;
}

// Optional per-item search alias (alt_name / alt_name_en in category JSON) —
// a second brand name users actually type («Сбербанк» for Сбер, "Tinkoff" for
// T-Bank). Rendered as «Имя (Алиас)» in title/H1/OG and as alternateName in
// JSON-LD. No RU→EN fallback: a Cyrillic alias on an EN page is noise.
function altName(item, lang) {
  return (lang === 'en' ? item.alt_name_en : item.alt_name) || '';
}

function buildJsonLd(item, section, section_en, catSlug, fullUrl, faq, lang = 'ru', pageMeta = {}) {
  const en        = lang === 'en';
  const nm        = en ? (item.name_en || item.name) : item.name;
  const urlPrefix = en ? `${BASE_URL}/en` : BASE_URL;
  const crumb2    = en ? 'Logos' : 'Логотипы';
  const crumb3    = en ? (section_en || section) : section;

  const breadcrumb = {
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Trace Logo's", "item": `${urlPrefix}/` },
      { "@type": "ListItem", "position": 2, "name": crumb2,         "item": `${urlPrefix}/logos/` },
      { "@type": "ListItem", "position": 3, "name": crumb3,         "item": `${urlPrefix}/logos/${catSlug}/` },
      { "@type": "ListItem", "position": 4, "name": nm,             "item": fullUrl },
    ],
  };

  const primaryExt = assetExt(item.file);
  const dateModified = itemDate(item);
  // Image search (Яндекс.Картинки) indexes only raster formats — point
  // contentUrl at the PNG render from build-search-images.js when one exists.
  // The SVG original is still linked on-page as the download.
  const searchRel = searchImageRel(item);
  const downloadCount = DOWNLOAD_STATS[item.figma] || 0;
  const imageObj = {
    "@type": "ImageObject",
    "@id": `${fullUrl}#logo`,
    "name": en ? `${nm} Logo` : `Логотип ${item.name}`,
    "description": en ? `Official ${nm} logo in SVG` : `Официальный логотип ${item.name} в SVG`,
    "contentUrl": searchRel
      ? `${BASE_URL}/${searchRel}`
      : `${BASE_URL}/assets/logos/${primaryExt === 'png' ? 'pngs' : 'svgs'}/${item.file}`,
    "encodingFormat": (searchRel || primaryExt === 'png') ? 'image/png' : 'image/svg+xml',
    "dateModified": dateModified,
    "publisher": { "@id": ORGANIZATION["@id"] },
    ...(altName(item, lang) ? { "alternateName": en ? `${altName(item, lang)} Logo` : `Логотип ${altName(item, lang)}` } : {}),
    // license/acquireLicensePage must point to a page describing the terms
    // governing use of THIS image (Google's Image License Metadata docs) —
    // that's our own /terms/ page, not item.brandUrl (the brand's own site,
    // which says nothing about how the file may be used and isn't ours to
    // license). Unconditional — every item now carries at least one of
    // license/creator/creditText/copyrightNotice, the minimum Google requires
    // for Licensable-badge eligibility, not just the ~70/700 with a brandUrl set.
    "license": `${BASE_URL}${en ? '/en' : ''}/terms/`,
    "acquireLicensePage": `${BASE_URL}${en ? '/en' : ''}/terms/`,
    "copyrightNotice": en ? 'Trademark of its respective rights holder' : 'Товарный знак принадлежит правообладателю',
    // Same DOWNLOAD_STATS[item.figma] lookup the meta-table "Скачано" row uses
    // (line ~648) — gives crawlers/AI engines a structured popularity signal
    // instead of forcing them to parse the prose row. Omitted at 0 rather than
    // published as a fake zero-count claim.
    ...(downloadCount > 0 ? {
      "interactionStatistic": {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/DownloadAction",
        "userInteractionCount": downloadCount,
      },
    } : {}),
  };

  // ImageObject describes the picture file — it doesn't tell a crawler "this
  // page is about the company Ozon". Brand is the entity node for that: same
  // sameAs signal Organization already carries for Trace Logo's itself, but
  // for the brand the page is actually about. sameAs only when item.brandUrl
  // is set (brand's own domain — guideline pages count, ~70/700 items today)
  // — omitted rather than fabricated for the rest, no Wikidata field exists
  // in the catalog yet to source a fallback from.
  const brandObj = {
    "@type": "Brand",
    "@id": `${fullUrl}#brand`,
    "name": nm,
    ...(altName(item, lang) ? { "alternateName": altName(item, lang) } : {}),
    "logo": { "@id": imageObj["@id"] },
    ...(item.brandUrl ? { "sameAs": [item.brandUrl] } : {}),
  };

  // Top-level connective node — without it an AI crawler sees a bag of loose
  // entities (image, org, faq...) with no single "this page, as a whole" node
  // to hang datePublished/dateModified/mainEntity off of. dateModified here is
  // the PAGE's freshness signal; imageObj's own dateModified stays about the
  // asset file specifically — the two can legitimately differ (e.g. FAQ/about
  // copy edited without the logo file changing). "about" points at the Brand
  // (the page's topic), "mainEntity" stays the ImageObject (what the page
  // actually delivers — the downloadable logo file).
  const webPage = {
    "@type": "WebPage",
    "@id": fullUrl,
    "url": fullUrl,
    "name": pageMeta.title || (en ? `${nm} Logo` : `Логотип ${nm}`),
    "description": pageMeta.description || '',
    "inLanguage": en ? 'en' : 'ru',
    "isPartOf": { "@id": `${BASE_URL}/#website` },
    "about": { "@id": brandObj["@id"] },
    "mainEntity": { "@id": imageObj["@id"] },
    "datePublished": itemPublishedDate(item),
    "dateModified": dateModified,
  };

  const graph = [webPage, breadcrumb, imageObj, brandObj, ORGANIZATION, PERSON];

  if (item.figma) {
    const ne = item.name_en || item.name;
    const figmaDisplay = item.figma.replace(/\//g, ' / ');
    const steps = buildFigmaHowtoSteps(nm, ne, figmaDisplay, lang);
    graph.push({
      "@type": "HowTo",
      "name": en ? `How to add the ${ne} logo in Figma` : `Как вставить лого ${nm} в Figma`,
      "description": en
        ? `Three steps to insert the ${ne} logo as a live Figma component using the Trace Logo's plugin.`
        : `Три шага, чтобы вставить логотип ${nm} в Figma живым компонентом через плагин Trace Logo's.`,
      "totalTime": "PT1M",
      "tool": [{ "@type": "HowToTool", "name": "Figma" }],
      "step": steps.map((s, i) => ({
        "@type": "HowToStep",
        "position": i + 1,
        "name": en ? s.titleEn : s.title,
        "text": en ? s.descEn : s.desc,
      })),
    });
  }

  if (faq && faq.length) {
    graph.push({
      "@type": "FAQPage",
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": [".faq-q", ".faq-a"],
      },
      "mainEntity": faq.map(f => ({
        "@type": "Question",
        "name": en ? (f.qe || f.q) : f.q,
        "acceptedAnswer": { "@type": "Answer", "text": en ? (f.ae || f.a) : f.a },
      })),
    });
  }

  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2);
}

// ── Page assembler ────────────────────────────────────────────────────────────

// Renders the page for ONE language. RU = baseline. EN substitutes English SEO
// text into the same placeholders; the chrome (data-i18n UI labels, paths, lang)
// is baked afterwards by the caller via enChrome + bakeI18n. English meta uses
// item.desc_en / item.about_en when present, else a templated English fallback.
function buildPage({ item, section, section_en, catSlug, ecosystemLookup, readyTotal, categories, itemsByCat }, lang = 'ru') {
  const url = seoUrl(item);
  if (!url) return null;

  const en       = lang === 'en';
  const nm       = en ? (item.name_en || item.name) : item.name; // display name for this lang
  // EN pages live at /en/logos/<cat>/<slug>/ — use root-relative asset paths so
  // every reference (preview, downloads, variant data-src, __SEO_PAGE__.assetBase)
  // resolves correctly without depending on depth or runtime path rewriting.
  const rel      = en ? '/' : '../../../';
  const fullUrl  = BASE_URL + url;

  const primaryExt  = assetExt(item.file);
  const primaryType = primaryExt === 'png' ? 'png' : 'svg';
  // PNG is always downloadable (real file or client-side SVG rasterization,
  // see logoFormats()'s hasPng comment) — don't gate it on a real PNG file existing.
  const fmtStr      = [primaryType === 'svg' && 'SVG', 'PNG'].filter(Boolean).join(' и ');
  const fmtStrEn    = [primaryType === 'svg' && 'SVG', 'PNG'].filter(Boolean).join(' and ');

  // <title>/og:title/twitter:title list every downloadable format instead of
  // a hardcoded "SVG" — "лого X png" and "иконка X ico" both outrank "svg"
  // in search volume among non-designers, and a PNG-only item's old title
  // claimed an SVG that didn't exist. ICNS is dropped here (near-zero search
  // volume of its own, title space is tight) — it still shows in the
  // on-page "Формат" row via the same logoFormats() call.
  const titleFmt = logoFormats(item).list.filter(f => !['ICNS', 'WebP', 'PDF', 'AI', 'EPS'].includes(f)).join(', ');

  const metaDescRu = item.desc || `Скачайте логотип ${item.name} в ${fmtStr} бесплатно. Официальные цвета, готово для Figma.`;
  const metaDescEn = item.desc_en || `Download the ${nm} logo in ${fmtStrEn} for free. Official colors, ready for Figma.`;
  const ogDescRu   = item.desc || `Векторный логотип ${item.name} в ${fmtStr}. Официальные цвета.`;
  const ogDescEn   = item.desc_en || `Vector ${nm} logo in ${fmtStrEn}. Official colors.`;

  const metaDesc = en ? metaDescEn : metaDescRu;
  const ogDesc   = en ? ogDescEn   : ogDescRu;

  // Auto-generated one-line fact (format + up to 2 brand colors) prepended
  // ahead of the hand-written about/desc text — a self-contained, quotable
  // sentence for AI answer engines (Yandex.Neuro, Perplexity etc.), built
  // purely from derivable data so it never needs manual upkeep across ~700
  // items. Rebrand year is intentionally NOT included — nowhere is it
  // structured data, only sometimes mentioned in hand-written `about` prose.
  const brandColors = extractBrandColors(item);
  const factColors   = brandColors.slice(0, 2);
  // No leading "Логотип {nm}" — the H1 right above already says exactly
  // that, and echoing it verbatim as the paragraph's first words read as
  // a stutter/duplicate to a human reader (caught 2026-07-30 on Ozon).
  const factLineRu = factColors.length
    ? `${nm} — ${fmtStr}, ${factColors.length === 1 ? 'цвет' : 'цвета'} ${factColors.join(' и ')}. `
    : '';
  const factLineEn = factColors.length
    ? `${nm} — ${fmtStrEn}, ${factColors.length === 1 ? 'color' : 'colors'} ${factColors.join(' and ')}. `
    : '';
  const logoDesc = en
    ? factLineEn + (item.about_en || metaDescEn)
    : factLineRu + (item.about || metaDescRu);

  // Search alias: «Логотип Сбера» и «логотип Сбербанка» — разные запросы;
  // title/H1 должны покрывать оба (см. alt_name в category JSON).
  const alt      = altName(item, lang);
  const nmFull   = alt ? `${nm} (${alt})` : nm;

  const title    = en ? `${nmFull} Logo — download ${titleFmt} free · Trace Logo's` : `Логотип ${nmFull} — скачать ${titleFmt} бесплатно · Trace Logo's`;
  const ogTitle  = en ? `${nmFull} Logo — download ${titleFmt} free`                : `Логотип ${nmFull} — скачать ${titleFmt} бесплатно`;
  const twTitle  = en ? `${nmFull} Logo ${titleFmt} — Trace Logo's`                 : `Логотип ${nmFull} ${titleFmt} — Trace Logo's`;
  const h1       = en ? `${nmFull} Logo` : `Логотип ${nmFull}`;
  // factColors (up to 2 hex, computed above for factLineRu/En) folded into the
  // hero image's alt — image search / AI image citation reads alt text, not
  // the on-page color swatches, so the same data needs to reach both places.
  const prevAlt  = en
    ? `${nmFull} Logo ${primaryType.toUpperCase()}${factColors.length ? `, ${factColors.join('/')}` : ''}`
    : `Логотип ${nmFull} ${primaryType.toUpperCase()}${factColors.length ? `, ${factColors.join('/')}` : ''}`;
  const secLabel = en ? (section_en || section) : section;
  const ctaTitle = en ? `${readyTotal}+ logos in the catalog` : `${readyTotal}+ логотипов в каталоге`;

  const ogSlug  = seoUrl(item).replace(/^\/logos\/|\/$/g, '').replace(/\//g, '-');
  const ogImage = `${BASE_URL}/assets/og/${ogSlug}.png`;

  // Visible preview: SVG-primary items get a raster render — Яндекс.Картинки
  // only indexes raster images found in the page HTML (it ignores the sitemap
  // image extension), so the <img> the crawler sees must stay raster (WebP
  // qualifies same as PNG). Prefer the small WebP render of the search PNG
  // over the full 800px/~70KB file — same crawler-friendly raster, much
  // lighter paint since it's shown at 160px either way. PNG-primary items get
  // the WebP grid preview instead, for the same reason. The full asset (SVG
  // or original PNG) stays the sitemap <image:loc> / download / lightbox /
  // color-editor source via searchImageRel / __SEO_PAGE__.defaultSrc.
  const searchRel      = searchImageRel(item);
  const searchWebpRel  = searchWebpPreviewRel(item);
  const webpRel        = searchRel ? null : webpPreviewRel(item.file);
  const previewRel  = searchWebpRel || searchRel || webpRel;
  const previewSrc  = previewRel
    ? `${rel}${previewRel}`
    : `${rel}assets/logos/${primaryType === 'png' ? 'pngs' : 'svgs'}/${item.file}`;
  const previewMime = (searchWebpRel || webpRel) ? 'image/webp'
    : (previewRel || primaryType === 'png') ? 'image/png' : 'image/svg+xml';

  const homeRel  = en ? '/en/' : rel;
  const siblings = (itemsByCat && itemsByCat[catSlug]) || [];
  const faqItems = buildFaqItems(item, brandColors, ecosystemLookup, siblings, section, section_en);

  const variantsSection  = buildVariantsSection(item, rel, lang);
  const ecosystemSection = buildEcosystemSection(item, ecosystemLookup, rel, lang);

  const vars = {
    REL:                      rel,
    HOME_REL:                 en ? '/en/' : rel,
    DATA_BASE:                en ? '/' : rel,
    TITLE:                    title,
    META_DESC:                esc(metaDesc),
    CANONICAL_URL:            fullUrl,
    HREFLANG_TAGS:            hreflangBlock(fullUrl, fullUrl.replace(BASE_URL + '/', BASE_URL + '/en/')),
    OG_TITLE:                 esc(ogTitle),
    OG_DESC:                  esc(ogDesc),
    OG_IMAGE:                 ogImage,
    TWITTER_TITLE:            esc(twTitle),
    JSON_LD:                  buildJsonLd(item, section, section_en, catSlug, fullUrl, faqItems, lang, { title, description: metaDesc }),
    BREADCRUMB_SECTION:       esc(secLabel),
    BREADCRUMB_SECTION_EN:    esc(section_en || section),
    BREADCRUMB_SECTION_SLUG:  catSlug,
    BREADCRUMB_CURRENT:       esc(nm),
    PREVIEW_SRC:              previewSrc,
    PREVIEW_MIME:             previewMime,
    PREVIEW_ALT:              esc(prevAlt),
    // Initial preview shape must match what seo-page.js would apply on variant
    // click (see its selectVariant: light-bg/dark-bg + preview-wide|preview-icon).
    // Hardcoding "square" here left a wide primary — items with `thumb`, whose
    // real logo is horizontal — without its checkerboard backing.
    PREVIEW_CARD_BG:          isFullFile(item.file) ? (item.darkBg ? ' dark-bg' : ' light-bg') : '',
    PREVIEW_MOUNT_CLASS:      isFullFile(item.file) ? 'preview-wide' : 'preview-icon',
    CATEGORY_ICON:            categoryIcon(item.figma),
    CATEGORY_NAME:            esc(secLabel),
    H1:                       esc(h1),
    H1_EN:                    esc(`${item.alt_name_en ? `${item.name_en || item.name} (${item.alt_name_en})` : (item.name_en || item.name)} Logo`),
    LOGO_DESC:                logoDesc,
    CATALOG_COUNT:            String(readyTotal),
    CATALOG_CTA_TITLE:        esc(ctaTitle),
    DOWNLOAD_BUTTONS:         buildDownloadButtons(item, rel),
    MACOS_STYLE_TABS:         buildMacosStyleTabs(item, primaryType),
    MACOS_STYLE_TABS_MOBILE:  buildMacosStyleTabsMobile(item, primaryType),
    NOICON_NOTE:              buildNoIconNote(item, lang, variantsSection !== '', ecosystemSection !== ''),
    VARIANTS_SECTION:         variantsSection,
    SPONSOR_SECTION:          buildSponsorSection(item, rel, lang),
    SPONSOR_CSS:              SPONSORS[sponsorKey(item)]?.title ? `<link rel="stylesheet" href="${rel}css/sponsor-banner.css">` : '',
    EASTER_EGG_CSS:           item.figma === 'Icon/Game/DoodleJump' ? `<link rel="stylesheet" href="${rel}css/easter-doodlejump.css">` : '',
    EASTER_EGG_SCRIPT:        item.figma === 'Icon/Game/DoodleJump'
      ? `<script type="module">import { showDoodleJumpWidget } from '/js/easter-doodlejump.min.js'; showDoodleJumpWidget();</script>`
      : '',
    ECOSYSTEM_SECTION:        ecosystemSection,
    COLORS_SECTION:           buildColorsSection(brandColors, lang, nm),
    EMBED_SECTION:            buildEmbedSection(item, nm, fullUrl, lang),
    META_TABLE_SECTION:       buildMetaTableSection(item, nm, lang),
    FAQ_SECTION:              buildFaqSection(faqItems, lang),
    SEO_AD_SECTION:           buildSeoAdSection(),
    SEO_AD_SECTION_BOTTOM:    buildSeoAdSectionBottom(),
    RELATED_SECTION:          buildRelatedSection(item, siblings, homeRel, rel, lang),
    CATALOG_GRID_SECTION:     buildCatalogGridSection(categories, homeRel, rel, itemsByCat, lang, catSlug),
    HOWTO_SECTION:            buildFigmaHowtoSection(item, nm, item.name_en || item.name, lang),
    SEO_PAGE_DATA:            buildSeoPageData(item, rel, lang),
  };

  return TEMPLATE.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in vars)) { console.warn(`Unknown placeholder: {{${key}}}`); return ''; }
    return vars[key];
  });
}


// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', 'manifest.json'), 'utf8'));

  // English dictionary (single source) — for baking data-i18n chrome on EN pages.
  const EN = loadDict().en;

  // Load all items with their section names and category slug
  const allItems = [];
  for (const cat of manifest.categories) {
    const data = resolveCategoryLabels(JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', cat.file), 'utf8')), ROOT);
    for (const item of data.items) allItems.push({ item, section: cat.section, section_en: cat.section_en, catSlug: cat.slug });
  }

  // Total ready logos count (same as header in the catalog)
  const readyTotal = allItems.filter(({ item }) => !item.comingSoon && item.file && item.file !== 'placeholder.svg').length;

  // Build ecosystem lookup: id → list of items in that ecosystem
  const ecosystemLookup = {};
  for (const { item } of allItems) {
    for (const ecoId of ecosystemIds(item)) {
      (ecosystemLookup[ecoId] ??= []).push({ item });
    }
  }

  // Ready items grouped by category slug → neighbours for the "Related" section.
  const isReady = it => !it.comingSoon && it.file && it.file !== 'placeholder.svg' && seoUrl(it);
  const itemsByCat = {};
  for (const { item, catSlug } of allItems) {
    if (!isReady(item)) continue;
    (itemsByCat[catSlug] ??= []).push(item);
  }

  // All categories with live counts → the full-catalog grid (same order as manifest).
  const categories = manifest.categories.map(cat => ({
    slug:       cat.slug,
    section:    cat.section,
    section_en: cat.section_en,
    count:      (itemsByCat[cat.slug] || []).length,
  })).filter(c => c.count > 0);

  // Approx PNG size for SVG-only items (see computeApproxPngSizes above) — one
  // rasterize pass per unique SVG, cached by mtime, before buildDownloadButtons
  // (sync, called per item below) looks the results up.
  if (!DRY_RUN) {
    const svgOnlyFiles = new Set();
    for (const { item } of allItems) {
      if (item.comingSoon || !item.file || item.file === 'placeholder.svg') continue;
      const primaryType = assetExt(item.file) === 'png' ? 'png' : 'svg';
      const rawVariants = item.variants || [];
      const pngFile = rawVariants.find(v => assetExt(v.file) === 'png')?.file ?? (primaryType === 'png' ? item.file : null);
      if (pngFile) continue; // real PNG on disk — exact size, no estimate needed
      const svgFile = primaryType === 'svg' ? item.file : rawVariants.find(v => assetExt(v.file) === 'svg')?.file;
      if (svgFile) svgOnlyFiles.add(svgFile);
    }
    await computeApproxPngSizes(svgOnlyFiles);
  }

  const builtUrls = [];
  let written = 0, unchanged = 0, skipped = 0;

  // Writes html to disk with change-detection; returns true if written.
  const writeIfChanged = (absPath, html) => {
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    const prev = fs.existsSync(absPath) ? fs.readFileSync(absPath, 'utf8') : '';
    if (prev === html) return false;
    fs.writeFileSync(absPath, html, 'utf8');
    return true;
  };

  for (const { item, section, section_en, catSlug } of allItems) {
    if (item.comingSoon || !item.file || item.file === 'placeholder.svg') { skipped++; continue; }
    const url = seoUrl(item);
    if (!url) { skipped++; continue; }

    builtUrls.push(url);

    if (DRY_RUN) { console.log(url.slice(1) + 'index.html'); continue; }

    const args    = { item, section, section_en, catSlug, ecosystemLookup, readyTotal, categories, itemsByCat };
    const relPath = url.slice(1) + 'index.html'; // e.g. logos/ai/chatgpt/index.html

    // RU page
    const ruHtml = buildPage(args, 'ru');
    if (writeIfChanged(path.join(ROOT, url.slice(1), 'index.html'), ruHtml)) written++; else unchanged++;

    // EN page — English SEO text baked in, chrome localized, static (no JS dependency)
    const enHtml = bakeI18n(enChrome(buildPage(args, 'en'), relPath), EN);
    if (writeIfChanged(path.join(ROOT, 'en', url.slice(1), 'index.html'), enHtml)) written++; else unchanged++;
  }

  if (!DRY_RUN) {
    console.log(`✓ Written:   ${written}  (RU + EN)`);
    console.log(`  Unchanged: ${unchanged}`);
    console.log(`  Skipped:   ${skipped}`);
    console.log(`  Sitemap:   run \`node scripts/build-sitemap.js\` to regenerate sitemap.xml`);
  } else {
    console.log(`\nDry run: ${builtUrls.length} pages would be generated (RU + EN each).`);
  }
}

main();
