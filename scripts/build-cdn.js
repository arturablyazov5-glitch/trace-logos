#!/usr/bin/env node
/**
 * Generates a flat "CDN" mirror of logo assets under short slug names, for
 * sharing/embedding (cdn.trace-logos.ru/<slug>.<ext>). Deployed separately —
 * see the `trace-logos-cdn` repo and its GitHub Pages custom domain.
 *
 * Output: cdn-dist/
 *   <slug>.<ext>              — primary file (item.file)
 *   <slug>-<variant>.<ext>    — each entry in item.variants[]
 *
 * comingSoon items are skipped (their `file` is a shared placeholder, not a
 * real asset). Slug collisions (same last figma segment reused across
 * categories, e.g. Icon/Bank/Alfa vs Icon/Insurance/Alfa) are disambiguated
 * by prefixing the category slug on every colliding entry.
 *
 * Usage:
 *   node scripts/build-cdn.js            # build all
 *   node scripts/build-cdn.js --dry-run  # print stats without writing
 */

const fs   = require('fs');
const path = require('path');

const ROOT    = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'cdn-dist');
const DRY_RUN = process.argv.includes('--dry-run');

// ── Slug helpers (mirrors build-api-json.js / build-seo-pages.js) ────────────

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '');
}

function itemSlug(item) {
  const parts = (item.figma || '').split('/').map(slugify).filter(Boolean);
  if (parts[0] !== 'icon' || parts.length < 3) return null;
  return parts[parts.length - 1];
}

function assetExt(file) {
  return (file || '').split('.').pop().toLowerCase();
}

function sourcePath(file) {
  if (file.startsWith('/assets/')) return path.join(ROOT, file);
  const dir = assetExt(file) === 'png' ? 'pngs' : 'svgs';
  return path.join(ROOT, 'assets', 'logos', dir, file);
}

const TYPE_LABELS = { svg: 'SVG', full: 'Full', full_en: 'Full EN', png: 'PNG' };

function variantSlug(v) {
  const label = v.label ?? TYPE_LABELS[v.type] ?? v.type ?? '';
  return slugify(label) || 'variant';
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', 'manifest.json'), 'utf8'));

  const entries = []; // { catSlug, item, slug }
  const slugCounts = {};

  for (const cat of manifest.categories) {
    const data  = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', cat.file), 'utf8'));
    const items = data.items || [];

    for (const item of items) {
      if (!item.file || item.comingSoon) continue;
      const slug = itemSlug(item);
      if (!slug) continue;
      entries.push({ catSlug: cat.slug, item, slug });
      slugCounts[slug] = (slugCounts[slug] || 0) + 1;
    }
  }

  const copies = []; // { src, destName }
  const seenDest = new Set();
  let skippedMissing = 0;

  for (const { catSlug, item, slug } of entries) {
    const cdnSlug = slugCounts[slug] > 1 ? `${catSlug}-${slug}` : slug;

    const primaryExt = assetExt(item.file);
    addCopy(sourcePath(item.file), `${cdnSlug}.${primaryExt}`);

    const usedVariantSlugs = new Set();
    for (const v of item.variants || []) {
      if (!v.file) continue;
      const ext = assetExt(v.file);
      let vSlug = variantSlug(v);
      if (usedVariantSlugs.has(vSlug)) {
        let n = 2;
        while (usedVariantSlugs.has(`${vSlug}-${n}`)) n++;
        vSlug = `${vSlug}-${n}`;
      }
      usedVariantSlugs.add(vSlug);
      addCopy(sourcePath(v.file), `${cdnSlug}-${vSlug}.${ext}`);
    }
  }

  function addCopy(src, destName) {
    if (seenDest.has(destName)) {
      console.warn(`⚠ пропущена коллизия имени: ${destName} (уже занято)`);
      return;
    }
    seenDest.add(destName);
    if (!fs.existsSync(src)) {
      skippedMissing++;
      console.warn(`⚠ файл не найден, пропущен: ${path.relative(ROOT, src)}`);
      return;
    }
    copies.push({ src, destName });
  }

  if (DRY_RUN) {
    console.log(`cdn-dist/  ${copies.length} файлов (${skippedMissing} источников не найдено)`);
    for (const c of copies.slice(0, 20)) console.log(`  ${c.destName}  ←  ${path.relative(ROOT, c.src)}`);
    if (copies.length > 20) console.log(`  … и ещё ${copies.length - 20}`);
    return;
  }

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const { src, destName } of copies) {
    fs.copyFileSync(src, path.join(OUT_DIR, destName));
  }

  fs.writeFileSync(path.join(OUT_DIR, 'CNAME'), 'cdn.trace-logos.ru\n', 'utf8');

  console.log(`✓ cdn-dist/  ${copies.length} файлов записано (${skippedMissing} источников не найдено)`);
}

main();
