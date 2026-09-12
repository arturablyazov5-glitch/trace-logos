#!/usr/bin/env node
/**
 * Concatenates the fixed set of CSS files every seo-page.html load pulls in
 * separately into one file, so the ~570 logo pages issue one <link
 * rel="stylesheet"> instead of seven — fewer round-trips before first paint,
 * which matters for Yandex's behavioral-factor ranking signals (time to
 * interactive, bounce).
 *
 * Source files stay untouched and keep their "1 file = 1 concern" split
 * (css/seo-page.css, css/support-btn.css, ...) — this script only bundles the
 * BUILD OUTPUT. Edit the source files as always; rerun this script (or
 * `npm run build`) to refresh the bundle.
 *
 * Sponsor/easter-egg CSS stay out of the bundle on purpose — they're
 * per-page-conditional ({{SPONSOR_CSS}}/{{EASTER_EGG_CSS}} in
 * templates/seo-page.html), bundling them would ship dead CSS to every page
 * that doesn't need them.
 *
 * Output: css/seo-page.bundle.css — committed to the repo like any other
 * generated artifact (this is a static site with no server-side build step;
 * the bundle must exist on disk for the deployed site to serve it).
 *
 * Usage:
 *   node scripts/build-css-bundles.js            # build
 *   node scripts/build-css-bundles.js --dry-run  # preview without writing
 */

const fs   = require('fs');
const path = require('path');

const ROOT    = path.resolve(__dirname, '..');
const CSS_DIR = path.join(ROOT, 'css');
const DRY_RUN = process.argv.includes('--dry-run');

const BUNDLES = {
  // tokens.css, catalog-grid.css and faq.css go first — seo-page.css pulls all
  // three in via `@import`, which stays render-blocking even inside a bundled
  // file (the browser still fetches it as a separate request, just later).
  // Inlined here instead, with the `@import` lines stripped from seo-page.css's
  // own contribution below — none has another <link> consumer of its own on
  // pages using this bundle (grep confirmed), so this is safe.
  // faq.css also has a direct <link> on tools/index.html, which doesn't use
  // this bundle — that page is unaffected either way.
  'seo-page.bundle.css': [
    'tokens.css',
    'catalog-grid.css',
    'faq.css',
    'seo-page.css',
    'support-btn.css',
    'site-header.css',
    'modals.css',
    'confetti.css',
    'site-footer.css',
  ],

  // The four hand-written/templated pages that load js/main.js (logos/index.html,
  // emoji/index.html, icons/index.html, templates/category-page.html) each linked
  // their own 15-18 <link rel="stylesheet"> tags — every one a separate request on
  // every catalog page view, and the single biggest contributor to the site's Edge
  // Request count. One bundle instead: 19 requests → 1.
  //
  // Deliberately a SUPERSET of what any one of those pages linked: emoji/ and
  // icons/ never linked filters.css / support-btn.css / category-seo.css, which
  // style markup they don't render. Shipping those rules to them costs a few dead
  // selectors and zero extra requests — the point of the bundle. (support-btn.css
  // was arguably a real gap: all four pages DO load components/support-btn.min.js.)
  //
  // Order is logos/index.html's original link order, which the pages' cascade
  // already depended on — tokens.css hoisted to the front because base.css pulls
  // it via @import, and mobile.css kept late so its media queries still override.
  'catalog.bundle.css': [
    'tokens.css',
    'base.css',
    'sidebar.css',
    'search.css',
    'filters.css',
    'cards.css',
    'detail.css',
    'support-btn.css',
    'color.css',
    'picker.css',
    'modals.css',
    'mobile.css',
    'confetti.css',
    'easter-amongus.css',
    'easter-doodlejump.css',
    'easter-google.css',
    'easter-minicrewmate.css',
    'category-seo.css',
    'microanim.css',
  ],
};

// Minimal, safe CSS minifier: strips comments and collapses whitespace
// around syntax characters. No new dependency (mirrors the project's
// "no build step" philosophy) — this isn't trying to be cssnano, just to
// stop shipping human-formatting bytes (indentation, blank lines, comments)
// to every page load. Doesn't touch string contents, so content: "..." /
// url("...") stay intact.
function minifyCss(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const ch = src[i];
    if (ch === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const start = i;
      i++;
      while (i < n && src[i] !== ch) {
        if (src[i] === '\\') i++;
        i++;
      }
      i++;
      out += src.slice(start, i);
      continue;
    }
    out += ch;
    i++;
  }
  return out
    .replace(/\s+/g, ' ')
    .replace(/ ?([{}:;,>~+]) ?/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

// An `@import` inside a bundled file is worse than useless: CSS only honours
// @import before any rule, so once a contribution lands mid-bundle the browser
// ignores the line entirely — and where it IS honoured it costs the extra
// request the bundle exists to remove. Every import naming a file the bundle
// already inlines is therefore stripped from that file's contribution. Derived
// from the sources list rather than hard-coded per file, so adding a bundle
// can't reintroduce the problem by forgetting a name (that is how seo-page.css's
// `@import './faq.css'` survived: the old strip list covered only tokens and
// catalog-grid, leaving a line that happened to be inert only by position).
function stripBundledImports(src, sources) {
  const names = sources.map(n => n.replace(/\.css$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return src.replace(
    new RegExp(`^@import\\s+['"]\\./(?:${names.join('|')})\\.css['"];\\s*\\n?`, 'gm'),
    ''
  );
}

function buildBundle(outFile, sources) {
  const parts = sources.map(name => {
    let src = fs.readFileSync(path.join(CSS_DIR, name), 'utf8').replace(/\s+$/, '');
    src = stripBundledImports(src, sources);
    return minifyCss(src);
  });
  const banner =
    `/* AUTO-GENERATED by scripts/build-css-bundles.js — do not edit directly. */\n` +
    `/* Source files: ${sources.join(', ')} */\n`;
  return banner + parts.join('') + '\n';
}

function main() {
  let written = 0, unchanged = 0;

  for (const [outFile, sources] of Object.entries(BUNDLES)) {
    const outPath = path.join(CSS_DIR, outFile);
    const bundle  = buildBundle(outFile, sources);

    if (DRY_RUN) {
      console.log(`css/${outFile}  ←  ${sources.join(', ')}`);
      continue;
    }

    const prev = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
    if (prev === bundle) { unchanged++; continue; }
    fs.writeFileSync(outPath, bundle, 'utf8');
    written++;
  }

  if (!DRY_RUN) console.log(`✓ CSS-бандлы: written=${written} unchanged=${unchanged}`);
}

// BUNDLES is the single source of truth for what each bundle inlines;
// scripts/test-css-parity.js reads it to tell "linked via bundle" from "missing".
// Guarded so that require() doesn't run a build as a side effect.
module.exports = { BUNDLES };

if (require.main === module) main();
