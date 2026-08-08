#!/usr/bin/env node
/**
 * Generates lightweight WebP grid previews for every logo/emoji catalog item
 * — both PNG and SVG.
 *
 * Why: catalog cards render at ~48-60px, but the sources are full-size (PNG
 * logos avg ~175 KB; emoji are 160×160). Serving the originals into the grid
 * loads megabytes to draw thumbnails. This produces small WebP previews used
 * ONLY in the card grid (and the related-logos/ecosystem/variant-thumbnail
 * blocks on SEO pages — see scripts/lib/static-grid.js and
 * webpPreviewRel()/thumbSrc() in build-seo-pages.js); the original file stays
 * untouched and remains the source for the detail panel, download, copy,
 * ZIP, and color editor.
 *
 * SVG logos got this treatment 2026-08-06, initially gated to a >300 KB
 * "heavy" threshold after `ozon-travel.svg` shipped at 2.9 MB (a Figma
 * export bug baked a soft-shadow fill into embedded full-resolution rasters
 * instead of real vector paths). Checking the numbers showed a normal SVG
 * logo rasterizes to a WebP preview at 80-99% less weight than the source
 * REGARDLESS of how "heavy" the vector is — the savings come from the format
 * change, not from something being broken — so the threshold was dropped
 * the same day: every SVG now gets a preview, same as every PNG. Across all
 * 894 SVG logos that's 9.76 MB → 1.90 MB (-81%) for the previews alone.
 *
 * Sections (see CLAUDE.md):
 *   logos — assets/logos/{pngs,svgs} (flat)     → assets/logos/previews
 *   emoji — assets/emoji/pngs/apple (primaries) → assets/emoji/previews/apple
 *
 * Only the grid-visible primaries are converted. For emoji that is the `apple`
 * vendor (CLAUDE.md: apple is always the primary); google/microsoft are
 * variants shown only in the detail panel, which uses the full PNG.
 *
 * The runtime swap is gated per page in main.js (setPreviewBase) and falls back
 * to the full asset if a preview is missing, so a forgotten rebuild degrades
 * gracefully rather than breaking thumbnails.
 *
 * Usage:
 *   node scripts/build-webp-previews.js              # all sections
 *   node scripts/build-webp-previews.js emoji        # one section
 *   node scripts/build-webp-previews.js --dry-run    # list without writing
 *   node scripts/build-webp-previews.js --force      # rebuild even if up-to-date
 */

const sharp = require('sharp');
const fs    = require('fs');
const path  = require('path');

const ROOT = path.resolve(__dirname, '..');

const SECTIONS = {
  logos:  { src: 'assets/logos',        out: 'assets/logos/previews',   subdirs: null, exts: ['png', 'svg'] },
  emoji:  { src: 'assets/emoji/pngs',   out: 'assets/emoji/previews',   subdirs: ['apple'], exts: ['png'] },
  // build-search-images.js renders SVG logos to 800px PNG for image-search
  // indexing (assets/logos/search/*.png). The SEO page hero <img> showed that
  // same 800px/~70KB file at 160px — this generates a matching small WebP so
  // the on-page preview is as light as the PNG-primary case already is via
  // `logos` above. The 800px PNG itself is untouched (still the sitemap
  // <image:loc> source for Google Images/Яндекс.Картинки).
  search: { src: 'assets/logos/search', out: 'assets/logos/search-previews', subdirs: null, exts: ['png'] },
  // 48×48 tier for ONE specific spot: the "Остальные категории" tiles on SEO
  // pages (buildCatalogGridSection() in build-seo-pages.js), which render
  // logos at 26px CSS size. Started at 16px (2026-08-06) but that read soft
  // on retina displays, so it was bumped to 48px the same day — still much
  // lighter than reusing the shared 192px tier below, with headroom for
  // ~1.85× DPR. Kept in its own output dir (assets/logos/previews-mini/)
  // instead of the 192px one, since that still backs every other spot.
  logosMini: { src: 'assets/logos', out: 'assets/logos/previews-mini', subdirs: null, exts: ['png', 'svg'], max: 48 },
  // 120×120 tier for ONE specific spot: the "Другие логотипы этой категории"
  // tiles on SEO pages (buildRelatedSection() in build-seo-pages.js), shown
  // at 48px CSS (`.related-card img`) — same display size as the "Экосистема"
  // block, which deliberately stays on the shared 192px tier below (not this
  // one). Added 2026-08-06 at the user's request (started at 100, bumped to
  // 120 same day); own output dir (assets/logos/previews-related/) so it
  // doesn't affect any other block.
  logosRelated: { src: 'assets/logos', out: 'assets/logos/previews-related', subdirs: null, exts: ['png', 'svg'], max: 120 },
};

// Max side in px. Grid shows ~48-60px; at 3× DPR ~180px → 192 covers it.
// Sources smaller than this are not enlarged (emoji stay native 160px).
// Per-section override via cfg.max (see `logosMini` above).
const MAX     = 192;
const QUALITY = 80;

const argv    = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const FORCE   = argv.includes('--force');
const picked  = argv.filter(a => !a.startsWith('--'));
const targets = picked.length ? picked : Object.keys(SECTIONS);

function fmt(bytes) {
  if (bytes < 1024) return bytes + ' B';
  const kb = bytes / 1024;
  return kb < 1024 ? kb.toFixed(1) + ' KB' : (kb / 1024).toFixed(2) + ' MB';
}

// Relative paths of every file under `dir` whose extension is in `exts`
// (recursive), restricted to `subdirs` at the top level when provided.
// The `logos` section points `dir` at assets/logos/ itself and only descends
// into pngs/ and svgs/ (not previews/ or search/ etc.) so PNG and SVG share
// one flat output namespace without scanning unrelated sibling folders.
function listAssets(dir, exts, subdirs) {
  const out = [];
  const walk = (abs, rel) => {
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const childAbs = path.join(abs, entry.name);
      const childRel = rel ? path.join(rel, entry.name) : entry.name;
      if (entry.isDirectory()) walk(childAbs, childRel);
      else if (entry.isFile() && exts.some(ext => entry.name.toLowerCase().endsWith('.' + ext))) out.push(childRel);
    }
  };
  if (subdirs) {
    for (const sd of subdirs) {
      const abs = path.join(dir, sd);
      if (fs.existsSync(abs)) walk(abs, sd);
    }
  } else if (exts.length > 1) {
    // logos section: descend into one subfolder per extension (pngs/, svgs/)
    // instead of the whole assets/logos/ tree, so previews/search/etc. next
    // to it are never scanned.
    for (const ext of exts) {
      const sub = ext === 'png' ? 'pngs' : `${ext}s`;
      const abs = path.join(dir, sub);
      if (fs.existsSync(abs)) walk(abs, '');
    }
  } else {
    walk(dir, '');
  }
  return out.sort();
}

async function buildSection(name) {
  const cfg = SECTIONS[name];
  if (!cfg) { console.error(`Unknown section: ${name}`); return null; }
  const srcDir = path.join(ROOT, cfg.src);
  const outDir = path.join(ROOT, cfg.out);
  const max    = cfg.max || MAX;
  if (!fs.existsSync(srcDir)) { console.error(`Source folder not found: ${srcDir}`); return null; }

  const rels = listAssets(srcDir, cfg.exts, cfg.subdirs);
  let written = 0, skipped = 0, srcTotal = 0, outTotal = 0;

  for (const rel of rels) {
    const ext     = path.extname(rel).slice(1).toLowerCase();
    // Multi-ext sections (logos: pngs/ + svgs/) resolve rel against the right
    // subfolder; single-ext sections keep rel as-is (matches srcDir exactly).
    const srcPath = cfg.exts.length > 1 ? path.join(srcDir, ext === 'png' ? 'pngs' : `${ext}s`, rel) : path.join(srcDir, rel);
    const outPath = path.join(outDir, rel.replace(new RegExp(`\\.${ext}$`, 'i'), '.webp'));
    const srcSize = fs.statSync(srcPath).size;
    srcTotal += srcSize;

    if (!FORCE && fs.existsSync(outPath) && fs.statSync(outPath).mtimeMs >= fs.statSync(srcPath).mtimeMs) {
      outTotal += fs.statSync(outPath).size;
      skipped++;
      continue;
    }
    if (DRY_RUN) { written++; continue; }

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    // withoutEnlargement matters for PNG (tiny sources shouldn't be blown up)
    // but SVG has no meaningful "native" raster size to compare against —
    // always rasterize at MAX so every SVG preview is a consistent grid tile.
    const buf = await sharp(srcPath)
      .resize(max, max, { fit: 'inside', withoutEnlargement: ext === 'png' })
      .webp({ quality: QUALITY })
      .toBuffer();
    fs.writeFileSync(outPath, buf);
    outTotal += buf.length;
    written++;
  }

  const pct = srcTotal ? Math.round((1 - outTotal / srcTotal) * 100) : 0;
  console.log(`[${name}] ${rels.length} file (${fmt(srcTotal)}) → previews ${fmt(outTotal)} (${pct}% lighter)` +
              (DRY_RUN ? `  | would write ${written}, up-to-date ${skipped} (dry run)`
                       : `  | written ${written}, skipped ${skipped}`));
  return { srcTotal, outTotal, written, skipped };
}

(async () => {
  console.log('— WebP previews —');
  for (const name of targets) await buildSection(name);
})().catch(err => { console.error(err); process.exit(1); });
