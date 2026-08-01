#!/usr/bin/env node
/**
 * Scans the logos/, emoji/, and blog/ directories (plus their en/ mirrors) for
 * orphaned HTML pages. If a directory contains an index.html but no corresponding
 * entry exists in the source data (JSON for logos/emoji, blog/posts/*.md for blog),
 * the directory (and its index.html) is deleted.
 *
 * Usage:
 *   node scripts/cleanup-orphaned-pages.js            # delete orphans
 *   node scripts/cleanup-orphaned-pages.js --dry-run  # preview only
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');

// --- Helpers ---

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '');
}

function getExpectedSlugs(manifestPath) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const expected = new Set(); // Set of "category/slug"

  for (const cat of manifest.categories) {
    const catJsonPath = path.join(ROOT, 'logos', cat.file);
    if (!fs.existsSync(catJsonPath)) continue;

    const catData = JSON.parse(fs.readFileSync(catJsonPath, 'utf8'));

    for (const item of catData.items) {
      if (item.comingSoon) continue;

      // Mirrors seoUrl() in build-seo-pages.js EXACTLY: the real page path is built
      // from the item's own figma-path segments, NOT the manifest's declared cat.slug —
      // several categories (e.g. sayty-i-cms.json: slug "web", figma segment "Design")
      // diverge between the two. Using cat.slug here previously caused every item in a
      // diverging category to look "orphaned" and get deleted right after being generated.
      const parts = (item.figma || '').split('/').map(slugify).filter(Boolean);
      if (parts[0] !== 'icon' || parts.length < 3) continue;

      const urlCatSlug = parts[1];
      const itemSlug = parts.slice(2).join('/');
      expected.add(`${urlCatSlug}/${itemSlug}`);
    }
  }
  return expected;
}

function getValidCategorySlugs(manifestPath) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  return new Set(manifest.categories.map(cat => cat.slug));
}

// Catches a category renamed/removed from manifest.json whose logos/<slug>/index.html
// (build-category-pages.js's own overview page, not an item page) is left behind.
// cleanup() below only walks INTO existing category directories to check item pages —
// it never asks whether the category directory itself still belongs, so a category with
// no more items (or one deleted wholesale) leaves a stale index.html with old copy that
// nothing ever revisits. Reported 2026-07-27: logos/reading/, logos/photo/, logos/sports/.
function cleanupOrphanedCategoryDirs(baseDir, validSlugs, label) {
  console.log(`\nChecking ${label} category dirs in ${baseDir}...`);
  if (!fs.existsSync(baseDir)) return;

  const SKIP = new Set(['categories', 'ecosystem']);
  const entries = fs.readdirSync(baseDir).filter(f => fs.statSync(path.join(baseDir, f)).isDirectory());
  let deletedCount = 0;

  for (const entry of entries) {
    if (SKIP.has(entry) || validSlugs.has(entry)) continue;
    const entryPath = path.join(baseDir, entry);
    const indexPath = path.join(entryPath, 'index.html');
    if (!fs.existsSync(indexPath)) continue; // empty leftover dir, e.g. from an old rename — nothing to clean

    console.log(`  [ORPHAN CATEGORY] ${entry}`);
    if (!DRY_RUN) {
      fs.rmSync(entryPath, { recursive: true, force: true });
    }
    deletedCount++;
  }

  console.log(`${DRY_RUN ? 'Found' : 'Deleted'} ${deletedCount} orphaned ${label} category dirs.`);
}

function getExpectedOgSlugs(manifestPath) {
  // Mirrors seoSlug() in build-og-images.js: assets/og/<catSlug>-<itemSlug>.png
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const expected = new Set();

  for (const cat of manifest.categories) {
    const catJsonPath = path.join(ROOT, 'logos', cat.file);
    if (!fs.existsSync(catJsonPath)) continue;

    const catData = JSON.parse(fs.readFileSync(catJsonPath, 'utf8'));

    for (const item of catData.items) {
      if (item.comingSoon) continue;

      const parts = (item.figma || '').split('/').map(slugify).filter(Boolean);
      if (parts[0] !== 'icon' || parts.length < 3) continue;

      expected.add(parts.slice(1).join('-'));
    }
  }
  return expected;
}

function getExpectedBlogSlugs() {
  // Mirrors slug resolution in build-blog.js: frontmatter `slug:` if present, else the filename.
  const postsDir = path.join(ROOT, 'blog', 'posts');
  const expected = new Set();
  if (!fs.existsSync(postsDir)) return expected;

  for (const f of fs.readdirSync(postsDir)) {
    if (!f.endsWith('.md')) continue;
    const raw = fs.readFileSync(path.join(postsDir, f), 'utf8');
    const m = raw.match(/^slug:\s*(\S+)/m);
    const slug = m ? m[1] : path.basename(f, '.md');
    expected.add(slug);
  }
  return expected;
}

function getExpectedBlogOgSlugs() {
  // Mirrors build-blog-og-images.js / build-blog-covers.js:
  // assets/og/blog/social/<slug>.png + assets/og/blog/webp/<slug>.webp
  return getExpectedBlogSlugs();
}

function getExpectedCollectionOgSlugs() {
  // Mirrors build-collection-og-images.js: assets/og/collection-<slug>.png
  const file = path.join(ROOT, 'collections.json');
  const expected = new Set();
  if (!fs.existsSync(file)) return expected;
  const { collections = [] } = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const c of collections) expected.add(`collection-${c.slug}`);
  return expected;
}

function cleanupOgImages(expectedSlugs) {
  const ogDir = path.join(ROOT, 'assets', 'og');
  console.log(`\nChecking OG images in ${ogDir}...`);
  if (!fs.existsSync(ogDir)) return;

  // build-og-home.js / build-collection-og-images.js output — not logo items
  // (blog OG images live under assets/og/blog/ — see cleanupBlogOgImages)
  const KEEP = new Set(['home', ...getExpectedCollectionOgSlugs()]);
  let deletedCount = 0;

  for (const file of fs.readdirSync(ogDir)) {
    if (!file.endsWith('.png')) continue;
    const slug = file.slice(0, -4);
    if (KEEP.has(slug) || expectedSlugs.has(slug)) continue;

    console.log(`  [ORPHAN] assets/og/${file}`);
    if (!DRY_RUN) {
      fs.rmSync(path.join(ogDir, file), { force: true });
    }
    deletedCount++;
  }

  console.log(`${DRY_RUN ? 'Found' : 'Deleted'} ${deletedCount} orphaned OG images.`);
}

function cleanupBlogOgImages() {
  // Mirrors build-blog-og-images.js / build-blog-covers.js output layout.
  const expected = getExpectedBlogOgSlugs();
  const dirs = [
    { dir: path.join(ROOT, 'assets', 'og', 'blog', 'social'), ext: '.png' },
    { dir: path.join(ROOT, 'assets', 'og', 'blog', 'webp'),   ext: '.webp' },
  ];
  let deletedCount = 0;

  for (const { dir, ext } of dirs) {
    console.log(`\nChecking blog OG images in ${dir}...`);
    if (!fs.existsSync(dir)) continue;

    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(ext)) continue;
      const slug = file.slice(0, -ext.length);
      if (expected.has(slug)) continue;

      console.log(`  [ORPHAN] ${path.relative(ROOT, path.join(dir, file))}`);
      if (!DRY_RUN) {
        fs.rmSync(path.join(dir, file), { force: true });
      }
      deletedCount++;
    }
  }

  console.log(`${DRY_RUN ? 'Found' : 'Deleted'} ${deletedCount} orphaned blog OG images.`);
}

// Emoji manifest categories only carry `file` (no `slug`) — the folder slug is a
// short alias defined in build-emoji-seo-pages.js's CATEGORIES map, keyed by filename.
const EMOJI_CATEGORY_SLUGS = {
  'smileys-emotion': 'smileys',
  'people-body':     'people',
  'animals-nature':  'animals',
  'food-drink':      'food',
  'travel-places':   'travel',
  'activities':      'activities',
  'objects':         'objects',
  'symbols':         'symbols',
  'flags':           'flags',
};

function getExpectedEmojiSlugs() {
  const manifestPath = path.join(ROOT, 'emoji', 'manifest.json');
  if (!fs.existsSync(manifestPath)) return new Set();

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const expected = new Set();

  for (const cat of manifest.categories) {
    const catJsonPath = path.join(ROOT, 'emoji', cat.file);
    if (!fs.existsSync(catJsonPath)) continue;

    const catData = JSON.parse(fs.readFileSync(catJsonPath, 'utf8'));
    const catFileBase = path.basename(cat.file, '.json');
    const catSlug = EMOJI_CATEGORY_SLUGS[catFileBase];
    if (!catSlug) { console.warn(`⚠ no slug mapping for emoji category ${catFileBase} — skipped`); continue; }

    // Mirrors parseFile() + the usedSlugs dedupe in build-emoji-seo-pages.js:
    // a second item with the same base slug gets codepoints appended.
    const usedSlugs = new Set();
    for (const item of catData.items) {
      const fileBase = (item.file || '').split('/').pop().replace(/\.[^.]+$/, '');
      const us = fileBase.lastIndexOf('_');
      let slug = us === -1 ? fileBase : fileBase.slice(0, us);
      const codes = us === -1 ? [] : fileBase.slice(us + 1).split('-').filter(Boolean);
      if (!slug) continue;
      if (usedSlugs.has(slug)) slug = slug + '-' + codes.join('-');
      usedSlugs.add(slug);
      expected.add(`${catSlug}/${slug}`);
    }
  }
  return expected;
}

function cleanup(baseDir, expectedSlugs, label) {
  console.log(`\nChecking ${label} in ${baseDir}...`);
  if (!fs.existsSync(baseDir)) return;

  const categories = fs.readdirSync(baseDir).filter(f => fs.statSync(path.join(baseDir, f)).isDirectory());
  let deletedCount = 0;

  for (const cat of categories) {
    // Skip internal directories
    if (cat === 'categories' || cat === 'ecosystem') continue;
    
    const catPath = path.join(baseDir, cat);
    const items = fs.readdirSync(catPath).filter(f => fs.statSync(path.join(catPath, f)).isDirectory());

    for (const item of items) {
      const itemPath = path.join(catPath, item);
      const indexPath = path.join(itemPath, 'index.html');
      
      if (fs.existsSync(indexPath)) {
        const currentSlug = `${cat}/${item}`;
        if (!expectedSlugs.has(currentSlug)) {
          console.log(`  [ORPHAN] ${currentSlug}`);
          if (!DRY_RUN) {
            fs.rmSync(itemPath, { recursive: true, force: true });
          }
          deletedCount++;
        }
      }
    }
  }

  console.log(`${DRY_RUN ? 'Found' : 'Deleted'} ${deletedCount} orphaned ${label} pages.`);
}

function cleanupFlat(baseDir, expectedSlugs, label) {
  // Same idea as cleanup(), but for a flat <baseDir>/<slug>/index.html layout
  // (blog/, unlike logos/emoji, has no category level).
  console.log(`\nChecking ${label} in ${baseDir}...`);
  if (!fs.existsSync(baseDir)) return;

  const entries = fs.readdirSync(baseDir).filter(f => fs.statSync(path.join(baseDir, f)).isDirectory());
  let deletedCount = 0;

  for (const item of entries) {
    if (item === 'posts') continue; // markdown sources, not a rendered page
    const itemPath = path.join(baseDir, item);
    const indexPath = path.join(itemPath, 'index.html');

    if (fs.existsSync(indexPath) && !expectedSlugs.has(item)) {
      console.log(`  [ORPHAN] ${item}`);
      if (!DRY_RUN) {
        fs.rmSync(itemPath, { recursive: true, force: true });
      }
      deletedCount++;
    }
  }

  console.log(`${DRY_RUN ? 'Found' : 'Deleted'} ${deletedCount} orphaned ${label} pages.`);
}

// --- Main ---

function main() {
  console.log(`Cleanup orphaned pages${DRY_RUN ? ' (dry-run)' : ''}`);

  // 1. Logos
  const logoManifest = path.join(ROOT, 'logos', 'manifest.json');
  let expectedLogos = new Set();
  if (fs.existsSync(logoManifest)) {
    const validCategorySlugs = getValidCategorySlugs(logoManifest);
    cleanupOrphanedCategoryDirs(path.join(ROOT, 'logos'), validCategorySlugs, 'logo');
    cleanupOrphanedCategoryDirs(path.join(ROOT, 'en', 'logos'), validCategorySlugs, 'EN logo');

    expectedLogos = getExpectedSlugs(logoManifest);
    cleanup(path.join(ROOT, 'logos'), expectedLogos, 'logo');

    const expectedOg = getExpectedOgSlugs(logoManifest);
    cleanupOgImages(expectedOg);
  }

  cleanupBlogOgImages();

  // 2. Emoji
  const emojiManifest = path.join(ROOT, 'emoji', 'manifest.json');
  let expectedEmoji = new Set();
  if (fs.existsSync(emojiManifest)) {
    expectedEmoji = getExpectedEmojiSlugs();
    cleanup(path.join(ROOT, 'emoji'), expectedEmoji, 'emoji');
  }

  // 3. EN mirror. build-en-pages.js only WRITES en/<...> copies of whatever RU
  // HTML exists at run time — it never deletes an en/ page whose RU source was
  // removed. So a deleted logo leaves its en/ leaf behind, pointing canonical/
  // hreflang at a now-404 RU page. The mirror follows the RU structure exactly,
  // so the same expected slug sets apply here.
  cleanup(path.join(ROOT, 'en', 'logos'), expectedLogos, 'EN logo');
  cleanup(path.join(ROOT, 'en', 'emoji'), expectedEmoji, 'EN emoji');

  // 4. Blog. build-blog.js only WRITES pages for posts currently in blog/posts/ —
  // it never deletes a rendered blog/<slug>/ (or its en/ mirror) whose source .md
  // was removed or temporarily moved out (e.g. by the daily-blog-publish embargo
  // workflow). Without this, a stale page — and everything it links to/from —
  // stays live/deployable even after its source disappears.
  const expectedBlog = getExpectedBlogSlugs();
  cleanupFlat(path.join(ROOT, 'blog'), expectedBlog, 'blog');
  cleanupFlat(path.join(ROOT, 'en', 'blog'), expectedBlog, 'EN blog');

  // Broken internal links are now owned by scripts/test-links.js (runs in the
  // build-all --post tier): it validates every navigational href in the RENDERED
  // HTML against real files on disk and fails the build — a strict superset of
  // the old JSON-only about/desc scan that used to live here.
}

main();
