#!/usr/bin/env node
/**
 * Generates lightweight WebP grid previews for raster (PNG) catalog items.
 *
 * Why: catalog cards render at ~48-60px, but the PNG sources are full-size
 * (logos avg ~175 KB; emoji are 160×160). Serving the originals into the grid
 * loads megabytes to draw thumbnails. This produces small WebP previews used
 * ONLY in the card grid; the original PNG stays untouched and remains the
 * source for the detail panel, download, copy and ZIP.
 *
 * Sections (see CLAUDE.md):
 *   logos — assets/logos/pngs (flat)            → assets/logos/previews
 *   emoji — assets/emoji/pngs/apple (primaries) → assets/emoji/previews/apple
 *
 * Only the grid-visible primaries are converted. For emoji that is the `apple`
 * vendor (CLAUDE.md: apple is always the primary); google/microsoft are
 * variants shown only in the detail panel, which uses the full PNG. SVG logos
 * are excluded on purpose — rasterizing them would make them heavier/blurrier.
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
  logos: { src: 'assets/logos/pngs',  out: 'assets/logos/previews',  subdirs: null },
  emoji: { src: 'assets/emoji/pngs',  out: 'assets/emoji/previews',  subdirs: ['apple'] },
};

// Max side in px. Grid shows ~48-60px; at 3× DPR ~180px → 192 covers it.
// Sources smaller than this are not enlarged (emoji stay native 160px).
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

// Relative paths of every .png under `dir` (recursive), restricted to `subdirs`
// at the top level when provided.
function listPngs(dir, subdirs) {
  const out = [];
  const walk = (abs, rel) => {
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const childAbs = path.join(abs, entry.name);
      const childRel = rel ? path.join(rel, entry.name) : entry.name;
      if (entry.isDirectory()) walk(childAbs, childRel);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) out.push(childRel);
    }
  };
  if (subdirs) {
    for (const sd of subdirs) {
      const abs = path.join(dir, sd);
      if (fs.existsSync(abs)) walk(abs, sd);
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
  if (!fs.existsSync(srcDir)) { console.error(`Source folder not found: ${srcDir}`); return null; }

  const rels = listPngs(srcDir, cfg.subdirs);
  let written = 0, skipped = 0, srcTotal = 0, outTotal = 0;

  for (const rel of rels) {
    const srcPath = path.join(srcDir, rel);
    const outPath = path.join(outDir, rel.replace(/\.png$/i, '.webp'));
    const srcSize = fs.statSync(srcPath).size;
    srcTotal += srcSize;

    if (!FORCE && fs.existsSync(outPath) && fs.statSync(outPath).mtimeMs >= fs.statSync(srcPath).mtimeMs) {
      outTotal += fs.statSync(outPath).size;
      skipped++;
      continue;
    }
    if (DRY_RUN) { written++; continue; }

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    const buf = await sharp(srcPath)
      .resize(MAX, MAX, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer();
    fs.writeFileSync(outPath, buf);
    outTotal += buf.length;
    written++;
  }

  const pct = srcTotal ? Math.round((1 - outTotal / srcTotal) * 100) : 0;
  console.log(`[${name}] ${rels.length} PNG (${fmt(srcTotal)}) → previews ${fmt(outTotal)} (${pct}% lighter)` +
              (DRY_RUN ? `  | would write ${written}, up-to-date ${skipped} (dry run)`
                       : `  | written ${written}, skipped ${skipped}`));
  return { srcTotal, outTotal, written, skipped };
}

(async () => {
  console.log('— WebP previews —');
  for (const name of targets) await buildSection(name);
})().catch(err => { console.error(err); process.exit(1); });
