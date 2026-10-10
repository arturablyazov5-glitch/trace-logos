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
 * Product landings (tools/extensions|figma-plugins/<slug>/) with an EN pair
 * tools/landing-en/<slug>.html are built from the pair instead of the RU HTML —
 * see scripts/lib/en-landings.js.
 *
 * Source HTML files are the SINGLE SOURCE OF TRUTH — never edit /en/ manually.
 * Run AFTER any other build script that changes HTML pages.
 */

const fs   = require('fs');
const path = require('path');
const { loadDict, transformToEn } = require('./lib/en-transform');
const { translateHome } = require('./lib/home-i18n');
const { translateToolsHub } = require('./lib/tools-hub-i18n');
const { build: buildToolsHub } = require('./build-tools-hub');
const { PAIR_DIR_NAME, pairFileFor } = require('./lib/en-landings');

const ROOT    = path.join(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');

const EXCLUDE_DIRS = new Set([
  'en', 'node_modules', 'scripts', '.git', '.claude', 'sanitizer',
  'assets', 'css', 'js', 'components', 'templates', 'upptime', 'figma-plugins',
  PAIR_DIR_NAME, // tools/landing-en/<slug>.html — EN-пары лендингов, не страницы (см. ниже)
]);

// Папка плагина — исходник (ui.html и т.п.), зеркалить его нельзя; зеркалим
// только лендинг tools/figma-plugins/<slug>/index.html.
const PLUGIN_LANDING = /^tools\/figma-plugins\/[^/]+\/index\.html$/;
const isPluginsParent = (rel) => rel === 'tools';
const isPluginsTree = (rel) => rel === 'tools/figma-plugins' || rel.startsWith('tools/figma-plugins/');

// Skip non-content HTML files at root level (search-engine verification stubs)
const { isVerificationStub } = require('./lib/verification-stubs');

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
// Стену благодарностей (RU + EN) целиком генерирует build-credits.js.
const CREDITS = /^credits\/index\.html$/;

function findHtmlFiles(dir, rel = '') {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const name = entry.name;
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(name) && !(name === 'figma-plugins' && isPluginsParent(rel))) continue;
      results.push(...findHtmlFiles(path.join(dir, name), rel ? `${rel}/${name}` : name));
    } else if (name.endsWith('.html')) {
      if (!rel && isVerificationStub(name)) continue;
      if (isPluginsTree(rel) && !PLUGIN_LANDING.test(`${rel}/${name}`)) continue;
      results.push(rel ? `${rel}/${name}` : name);
    }
  }
  return results;
}

(() => {
  const EN = loadDict().en;

  const pageArg = process.argv.find(arg => arg.startsWith('--page='));
  const sources = findHtmlFiles(ROOT).filter(rel => !pageArg || rel === pageArg.slice(7));
  if (pageArg && sources.length !== 1) throw new Error(`Unknown source page: ${pageArg.slice(7)}`);
  let count = 0, skipped = 0;

  for (const relPath of sources) {
    if (SEO_LEAF.test(relPath)) { skipped++; continue; }
    if (EMOJI_SEO_LEAF.test(relPath)) { skipped++; continue; }
    if (EMOJI_CATEGORY.test(relPath)) { skipped++; continue; }
    if (COLLECTION.test(relPath)) { skipped++; continue; }
    if (LOGOS_CATEGORY.test(relPath)) { skipped++; continue; }
    if (BLOG_POST.test(relPath)) { skipped++; continue; }
    if (relPath === 'partnership/index.html') { skipped++; continue; } // owned by build-partnership.js
    if (relPath === 'developers/index.html') { skipped++; continue; } // owned by build-developers.js
    if (CREDITS.test(relPath)) { skipped++; continue; }

    // Продуктовый лендинг с EN-парой (scripts/lib/en-landings.js): основа —
    // переведённая пара, а не RU-HTML. Пара написана «по пути RU-страницы»,
    // поэтому дальше тот же transformToEn с relPath RU-страницы.
    const pair      = pairFileFor(relPath);
    const src       = pair || path.join(ROOT, relPath);
    const dest      = path.join(ROOT, 'en', relPath);
    const html      = fs.readFileSync(src, 'utf8');
    // The hand-written homepage has no data-i18n — translate it via a dedicated
    // RU→EN string map before the generic chrome/bake pass.
    const base      = relPath === 'index.html' ? translateHome(html)
      : relPath === 'tools/index.html' ? translateToolsHub(html) : html;
    let processed = transformToEn(base, relPath, EN);
    if (relPath === 'tools/index.html') processed = buildToolsHub(processed, 'en');

    if (DRY_RUN || pair) console.log(`→ en/${relPath}${pair ? ' (EN-пара)' : ''}`);
    if (!DRY_RUN) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, processed, 'utf8');
    }
    count++;
  }

  console.log(`\n${DRY_RUN ? '[dry-run] ' : ''}${count} EN pages ${DRY_RUN ? 'would be ' : ''}generated in /en/ (skipped ${skipped} — owned by build-seo-pages.js / build-emoji-seo-pages.js / build-collections.js)`);
})();
