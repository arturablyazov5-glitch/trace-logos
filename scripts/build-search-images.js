#!/usr/bin/env node
/**
 * Renders raster PNG versions of every SVG logo for image-search indexing.
 *
 * Why: Яндекс.Картинки (and image search in general) does not index SVG —
 * only raster formats (PNG/JPEG/GIF/WebP). Every SVG-primary logo page used
 * to expose ONLY the SVG as its image, so the whole catalog was invisible
 * in image search. This script produces a clean transparent PNG render of
 * each SVG; build-seo-pages.js shows it as the visible page preview and
 * build-sitemap.js lists it as the primary <image:loc>. The SVG stays the
 * source of truth for downloads, the color editor and Figma export
 * (__SEO_PAGE__.defaultSrc still points at the .svg).
 *
 * PNG-primary logos don't need this — they are already raster.
 *
 *   assets/logos/svgs/<name>.svg → assets/logos/search/<name>.png (≤800px)
 *
 * Incremental by mtime, like build-webp-previews.js.
 *
 * Usage:
 *   node scripts/build-search-images.js              # render missing/stale
 *   node scripts/build-search-images.js --dry-run    # list without writing
 *   node scripts/build-search-images.js --force      # rebuild all
 */

const sharp = require('sharp');
const fs    = require('fs');
const path  = require('path');

const ROOT    = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'assets', 'logos', 'svgs');
const OUT_DIR = path.join(ROOT, 'assets', 'logos', 'search');

// Max side in px. Big enough for image-search thumbnails and previews at any
// DPR; small enough to keep files light. Not enlarged beyond render density.
const MAX = 800;

const argv    = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const FORCE   = argv.includes('--force');

async function main() {
  const svgs = fs.readdirSync(SRC_DIR).filter(f => f.toLowerCase().endsWith('.svg'));
  if (!DRY_RUN) fs.mkdirSync(OUT_DIR, { recursive: true });

  let made = 0, skipped = 0, failed = 0;
  for (const f of svgs) {
    const srcAbs = path.join(SRC_DIR, f);
    const outAbs = path.join(OUT_DIR, f.replace(/\.svg$/i, '.png'));

    if (!FORCE && fs.existsSync(outAbs) && fs.statSync(outAbs).mtimeMs >= fs.statSync(srcAbs).mtimeMs) {
      skipped++;
      continue;
    }
    if (DRY_RUN) {
      console.log(`would render ${path.relative(ROOT, outAbs)}`);
      made++;
      continue;
    }
    try {
      // SVGs rasterize at 72dpi natively; a typical 100-200px viewBox would
      // come out tiny. Probe the intrinsic size, then pick the density that
      // renders the longest side at exactly MAX — no wasted pixels, and huge
      // viewBoxes can't blow past sharp's input pixel limit.
      const meta    = await sharp(srcAbs).metadata();
      const side    = Math.max(meta.width || 1, meta.height || 1);
      const density = Math.max(72, Math.min(2400, Math.ceil(72 * MAX / side)));
      await sharp(srcAbs, { density })
        .resize(MAX, MAX, { fit: 'inside', withoutEnlargement: true })
        .png()
        .toFile(outAbs);
      made++;
    } catch (e) {
      failed++;
      console.error(`✗ ${f}: ${e.message}`);
    }
  }

  console.log(`✓ search images: ${made} rendered, ${skipped} up-to-date${failed ? `, ${failed} FAILED` : ''}`);
  if (failed) process.exit(1);
}

main();
