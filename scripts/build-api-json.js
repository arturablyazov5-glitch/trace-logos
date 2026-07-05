#!/usr/bin/env node
/**
 * Generates public API JSON files from logos/categories/*.json.
 *
 * Output:
 *   logos/<slug>.json   — per-category file (e.g. logos/assistant.json)
 *   logos.json          — flat list of all logos
 *
 * Usage:
 *   node scripts/build-api-json.js            # build all
 *   node scripts/build-api-json.js --dry-run  # print stats without writing
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY_RUN  = process.argv.includes('--dry-run');

// Public API URLs are ABSOLUTE. The site lives on GitHub project pages
// (…/trace-logos/), so root-relative "/assets/…" would resolve to the domain
// root (404). Absolute URLs work for every consumer regardless of where the
// JSON is fetched or embedded: the homepage live search, per-category JSON,
// external bots, and build-collections.js (whose rel() strips this exact base).
const BASE_URL = 'https://trace-logos.ru';

// ── Slug helpers (mirrors build-seo-pages.js) ─────────────────────────────────

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '');
}

function itemUrl(item) {
  const parts = (item.figma || '').split('/').map(slugify).filter(Boolean);
  if (parts[0] !== 'icon' || parts.length < 3) return null;
  return `/logos/${parts.slice(1).join('/')}/`;
}

// ── Logo entry builder ────────────────────────────────────────────────────────

const TYPE_LABELS = { svg: 'SVG', full: 'Full', full_en: 'Full EN', png: 'PNG' };

function assetExt(file) {
  return (file || '').split('.').pop().toLowerCase();
}

// A "-full" file is a wide horizontal logo → gets the checkerboard backing.
// Mirrors isFullFile() in js/main.js so logos.json's `wide` matches site behavior.
function isFullFile(file) {
  return /-full(\.[^.]+)?$/.test(file || '');
}

function buildEntry(item, catSlug, catName, includeCategorySlug) {
  const url = itemUrl(item);
  if (!url) return null;

  const primaryExt  = assetExt(item.file);
  const primaryIsPng = primaryExt === 'png';

  const svgUrl = primaryIsPng
    ? null
    : `${BASE_URL}/assets/logos/svgs/${item.file}`;

  // pngUrl: primary file if PNG, or first PNG-type variant, otherwise null
  let pngUrl = null;
  if (primaryIsPng) {
    pngUrl = `${BASE_URL}/assets/logos/pngs/${item.file}`;
  } else {
    const pngVariant = (item.variants || []).find(v => assetExt(v.file) === 'png');
    if (pngVariant && !pngVariant.file.startsWith('/assets/emoji/')) {
      pngUrl = pngVariant.file.startsWith('/assets/')
        ? `${BASE_URL}${pngVariant.file}`
        : `${BASE_URL}/assets/logos/pngs/${pngVariant.file}`;
    }
  }

  // formats: svg items can export PNG → ["svg","png"]; png-only items → ["png"]
  const formats = primaryIsPng ? ['png'] : ['svg', 'png'];

  // All variants with full URLs
  const allVariants = (item.variants || [])
    .filter(v => v.file)
    .map(v => {
      const ext = assetExt(v.file);
      const label = v.label ?? TYPE_LABELS[v.type] ?? v.type ?? '';
      const wide = v.type === 'full' || v.type === 'full_en' || isFullFile(v.file);
      // Root-relative asset path in source (e.g. emoji variants: "/assets/emoji/pngs/...")
      if (v.file.startsWith('/assets/')) {
        const url = `${BASE_URL}${v.file}`;
        return ext === 'png' ? { label, pngUrl: url, wide } : { label, svgUrl: url, wide };
      }
      if (ext === 'png') {
        return { label, pngUrl: `${BASE_URL}/assets/logos/pngs/${v.file}`, wide };
      }
      return { label, svgUrl: `${BASE_URL}/assets/logos/svgs/${v.file}`, wide };
    });

  const entry = {
    name:      item.name,
    ...(item.name_en ? { name_en: item.name_en } : {}),
    tags:      item.tags || '',
    url:       `${BASE_URL}${url}`,
    svgUrl,
    pngUrl,
    ecosystem: item.ecosystem || null,
    formats,
  };

  if (allVariants.length) entry.variants = allVariants;
  if (item.macos_styles) {
    const ms = {};
    if (item.macos_styles.dark)  ms.dark  = `${BASE_URL}/assets/logos/pngs/${item.macos_styles.dark}`;
    if (item.macos_styles.light) ms.light = `${BASE_URL}/assets/logos/pngs/${item.macos_styles.light}`;
    entry.macos_styles = ms;
  }
  if (item.comingSoon) entry.comingSoon = true;
  if (includeCategorySlug) {
    entry.categorySlug = catSlug;
    entry.categoryName = catName;
  }

  return entry;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', 'manifest.json'), 'utf8'));
  const today    = new Date().toISOString().slice(0, 10);

  const allLogos = [];
  let totalReady = 0;
  let totalAll   = 0;
  let catWritten = 0;

  for (const cat of manifest.categories) {
    const data  = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', cat.file), 'utf8'));
    const items = data.items || [];

    const catEntries = [];
    let catReady = 0;

    for (const item of items) {
      if (!item.file) continue;
      totalAll++;

      const entry = buildEntry(item, cat.slug, cat.section, false);
      if (!entry) continue;

      catEntries.push(entry);
      if (!item.comingSoon) { catReady++; totalReady++; }

      allLogos.push(buildEntry(item, cat.slug, cat.section, true));
    }

    const catJson = {
      category: cat.section,
      slug:     cat.slug,
      total:    catReady,
      logos:    catEntries,
    };

    const outPath = path.join(ROOT, 'logos', `${cat.slug}.json`);
    const content = JSON.stringify(catJson, null, 2);

    if (!DRY_RUN) {
      const prev = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
      if (prev !== content) {
        fs.writeFileSync(outPath, content, 'utf8');
        catWritten++;
      }
    } else {
      console.log(`logos/${cat.slug}.json  (${catEntries.length} items, ${catReady} ready)`);
    }
  }

  const rootJson = {
    total:                    totalReady,
    totalIncludingComingSoon: totalAll,
    updated:                  today,
    logos:                    allLogos.filter(Boolean),
  };

  const rootContent = JSON.stringify(rootJson, null, 0)
    .replace(/^\{"/, '{\n  "')
    .replace(/"logos":\[/, '"logos":[\n');

  // logos.json is minified (one line per logo) — match existing format
  const rootMinified = JSON.stringify(rootJson);
  const rootPath = path.join(ROOT, 'logos.json');

  if (!DRY_RUN) {
    const prev = fs.existsSync(rootPath) ? fs.readFileSync(rootPath, 'utf8') : '';
    if (prev !== rootMinified) {
      fs.writeFileSync(rootPath, rootMinified, 'utf8');
    }
    console.log(`✓ logos.json        ${totalReady} ready / ${totalAll} total`);
    console.log(`  logos/<slug>.json  ${catWritten} updated`);
  } else {
    console.log(`\nlogos.json  ${totalReady} ready / ${totalAll} total`);
  }
}

main();
