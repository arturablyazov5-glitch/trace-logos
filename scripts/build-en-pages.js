#!/usr/bin/env node
/**
 * Generates the /en/ mirror of all HTML pages with English BAKED INTO STATIC HTML.
 *
 * Translation must not depend on runtime JS (crawlers — especially Yandex — render
 * JS poorly). So each /en/ page gets English text directly in the markup:
 *   - data-i18n / data-label inner text → English from js/i18n-dict-en.js
 *   - data-i18n-placeholder / data-i18n-aria attributes → English
 *   - <html lang="en">, window.__LANG__='en', absolute asset paths, /en/ canonical
 *
 * Logo SEO leaf pages (logos/<cat>/<slug>/index.html) are OWNED by
 * build-seo-pages.js, which bakes their English meta/H1/FAQ/JSON-LD directly into
 * en/. This script SKIPS them to avoid clobbering with a meta-less version.
 *
 * Source HTML files are the SINGLE SOURCE OF TRUTH — never edit /en/ manually.
 * Run AFTER any other build script that changes HTML pages.
 */

const fs   = require('fs');
const path = require('path');
const { loadDict, transformToEn } = require('./lib/en-transform');
const { translateHome } = require('./lib/home-i18n');

const ROOT    = path.join(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');

const EXCLUDE_DIRS = new Set([
  'en', 'node_modules', 'scripts', '.git', '.claude', 'sanitizer',
  'assets', 'css', 'js', 'components', 'templates', 'upptime',
]);

// Skip non-content HTML files at root level (search-engine verification stubs)
const SKIP_ROOT_FILES = /^(yandex_|bing|google)/i;

// Logo SEO leaf pages are generated (with English meta) by build-seo-pages.js.
const SEO_LEAF = /^logos\/[^/]+\/[^/]+\/index\.html$/;
// Emoji SEO leaf pages are generated (with English content) by build-emoji-seo-pages.js.
const EMOJI_SEO_LEAF = /^emoji\/[^/]+\/[^/]+\/index\.html$/;
// Emoji category pages are generated (with English content) by build-emoji-category-pages.js.
const EMOJI_CATEGORY = /^emoji\/[^/]+\/index\.html$/;
// Collection pages are generated (with English content) by build-collections.js.
const COLLECTION = /^collections\/[^/]+\/index\.html$/;
// Logos category pages are generated (with English content) by build-category-pages.js.
const LOGOS_CATEGORY = /^logos\/[^/]+\/index\.html$/;
// Blog pages (index + posts) are generated (with English titles/cards) by build-blog.js.
const BLOG_POST = /^blog\/(?:[^/]+\/)?index\.html$/;

function findHtmlFiles(dir, rel = '') {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const name = entry.name;
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(name)) continue;
      results.push(...findHtmlFiles(path.join(dir, name), rel ? `${rel}/${name}` : name));
    } else if (name.endsWith('.html')) {
      if (!rel && SKIP_ROOT_FILES.test(name)) continue;
      results.push(rel ? `${rel}/${name}` : name);
    }
  }
  return results;
}

(() => {
  const EN = loadDict().en;

  const sources = findHtmlFiles(ROOT);
  let count = 0, skipped = 0;

  for (const relPath of sources) {
    if (SEO_LEAF.test(relPath)) { skipped++; continue; }
    if (EMOJI_SEO_LEAF.test(relPath)) { skipped++; continue; }
    if (EMOJI_CATEGORY.test(relPath)) { skipped++; continue; }
    if (COLLECTION.test(relPath)) { skipped++; continue; }
    if (LOGOS_CATEGORY.test(relPath)) { skipped++; continue; }
    if (BLOG_POST.test(relPath)) { skipped++; continue; }

    const src       = path.join(ROOT, relPath);
    const dest       = path.join(ROOT, 'en', relPath);
    const html      = fs.readFileSync(src, 'utf8');
    // The hand-written homepage has no data-i18n — translate it via a dedicated
    // RU→EN string map before the generic chrome/bake pass.
    const base      = relPath === 'index.html' ? translateHome(html) : html;
    const processed = transformToEn(base, relPath, EN);

    if (DRY_RUN) {
      console.log(`→ en/${relPath}`);
    } else {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, processed, 'utf8');
    }
    count++;
  }

  console.log(`\n${DRY_RUN ? '[dry-run] ' : ''}${count} EN pages ${DRY_RUN ? 'would be ' : ''}generated in /en/ (skipped ${skipped} — owned by build-seo-pages.js / build-emoji-seo-pages.js / build-collections.js)`);
})();
