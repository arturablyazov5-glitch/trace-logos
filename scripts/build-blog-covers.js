#!/usr/bin/env node
/**
 * Derives assets/og/blog/social/<slug>.png + assets/og/blog/webp/<slug>.webp
 * from a hand-made original in assets/og/blog/originals/<slug>.{png,jpg,jpeg}.
 *
 * assets/og/blog/originals/ is gitignored (full-res source art, too heavy to
 * commit — same reasoning as PNG logos vs their WebP grid previews in
 * build-webp-previews.js). This script is what regenerates the committed,
 * size-optimized copies from that source on every build:
 *   - assets/og/blog/social/<slug>.png → og:image / JSON-LD "image"
 *             (ogImageFor() in build-blog.js always expects this path, and
 *             PNG is the format social-share scrapers most reliably parse)
 *   - assets/og/blog/webp/<slug>.webp  → on-page cover (post frontmatter
 *             `cover:`), where only browsers render it and file weight beats
 *             crawler compat
 *
 * Only touches slugs that actually have an original — most posts have no
 * assets/og/blog/originals/<slug>.* file and are untouched (their
 * assets/og/blog/social/<slug>.png stays owned by build-blog-og-images.js's
 * gradient generator).
 *
 * Usage:
 *   node scripts/build-blog-covers.js            # build all
 *   node scripts/build-blog-covers.js --dry-run  # list paths without writing
 */

const fs   = require('fs');
const path = require('path');

const ROOT         = path.resolve(__dirname, '..');
const SRC_DIR       = path.join(ROOT, 'assets', 'og', 'blog', 'originals');
const PNG_OUT_DIR   = path.join(ROOT, 'assets', 'og', 'blog', 'social');
const WEBP_OUT_DIR  = path.join(ROOT, 'assets', 'og', 'blog', 'webp');
const DRY_RUN   = process.argv.includes('--dry-run');
const MAX_WIDTH = 1280; // 16:9 → 1280×720, matches css/blog.css cover boxes

async function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.log('  assets/og/blog/originals/ not found — nothing to do');
    return;
  }

  const files = fs.readdirSync(SRC_DIR).filter(f => /\.(png|jpe?g)$/i.test(f));
  if (!files.length) {
    console.log('  No originals in assets/og/blog/originals/ — nothing to do');
    return;
  }

  if (DRY_RUN) {
    for (const f of files) {
      const slug = f.replace(/\.(png|jpe?g)$/i, '');
      console.log(`assets/og/blog/originals/${f}  →  assets/og/blog/social/${slug}.png + assets/og/blog/webp/${slug}.webp`);
    }
    console.log(`\nTotal: ${files.length}`);
    return;
  }

  const sharp = require('sharp');
  fs.mkdirSync(PNG_OUT_DIR, { recursive: true });
  fs.mkdirSync(WEBP_OUT_DIR, { recursive: true });

  let written = 0, skipped = 0;

  for (const f of files) {
    const slug = f.replace(/\.(png|jpe?g)$/i, '');
    const srcPath = path.join(SRC_DIR, f);
    const pngPath = path.join(PNG_OUT_DIR, `${slug}.png`);
    const webpPath = path.join(WEBP_OUT_DIR, `${slug}.webp`);

    const srcMtime = fs.statSync(srcPath).mtimeMs;
    const upToDate = [pngPath, webpPath].every(p =>
      fs.existsSync(p) && fs.statSync(p).mtimeMs >= srcMtime
    );
    if (upToDate) { skipped++; continue; }

    const img = sharp(srcPath).resize({ width: MAX_WIDTH, withoutEnlargement: true });
    await img.clone().png({ compressionLevel: 9 }).toFile(pngPath);
    await img.clone().webp({ quality: 82 }).toFile(webpPath);

    written++;
    console.log(`  ✓ ${slug}  (.png + .webp)`);
  }

  console.log(`\n✓ Written:  ${written}`);
  console.log(`  Skipped:  ${skipped} (up to date)`);
}

main().catch(err => { console.error(err); process.exit(1); });
