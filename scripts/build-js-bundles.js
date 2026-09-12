#!/usr/bin/env node
/**
 * Bundles each ES-module entry point into a single self-contained .min.js, so a
 * page load costs one request per entry instead of one per module in its import
 * graph.
 *
 * Why: this site ships its ES modules as-is — the browser fetches every file in
 * the graph separately. js/main.js reaches 37 files, js/seo-page.js 23; those
 * graphs are re-fetched on every catalog and logo page view, which is where the
 * bulk of the site's Edge Requests come from. Bytes were never the problem
 * (build-js-minify.js already handles those, and everything is CDN-cached) —
 * the request COUNT is what's metered, and only bundling removes it.
 *
 * Relationship to build-js-minify.js: that script minifies every file
 * individually and rewrites import specifiers to .min.js, which is what
 * non-entry modules still need (and what keeps the un-bundled files usable).
 * This script runs AFTER it and overwrites the .min.js of ENTRY POINTS ONLY
 * with a bundled build. Source of truth stays the unminified file, exactly as
 * before; .min.js remains a committed build artifact.
 *
 * Entry points are discovered from the rendered HTML (`<script type="module"
 * src="…/x.min.js">`) rather than a hand-kept list here — a new entry point
 * added to a template should not also require remembering to register it in
 * this file. Entries whose graph is a single file are skipped: terser's output
 * is already one request, and rebundling it would only churn the artifact.
 *
 * The i18n dictionaries stay EXTERNAL on purpose. js/i18n.js dynamically
 * imports exactly one of js/i18n-dict-{ru,en}.js so a visitor downloads only
 * their own language (~27 KB saved); inlining them would either pull both into
 * every bundle or silently drop the split. They keep their own request, which
 * the <link rel="modulepreload"> hints in the page sources already cover.
 * Every other dynamic import (icns.js, download-modal.js, …) IS inlined —
 * those are on-demand chunks whose whole cost is an extra request.
 *
 * Usage:
 *   node scripts/build-js-bundles.js            # build
 *   node scripts/build-js-bundles.js --dry-run  # report without writing
 */

const fs      = require('fs');
const os      = require('os');
const path    = require('path');
const { spawnSync } = require('child_process');
const esbuild = require('esbuild');

const ROOT    = path.resolve(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');

// Same prune list as build-cache-bust.js / test-links.js.
const PRUNE_DIRS = new Set([
  'node_modules', '.git', '.claude', 'cdn-dist', 'templates',
  'figma-plugins', 'supabase', 'sanitizer', 'upptime',
]);

// Kept as separate requests — see the header note on the language split.
const EXTERNAL = ['./i18n-dict-ru.js', './i18n-dict-en.js'];

// esbuild decides a file is CommonJS when it contains no import/export syntax
// at all — which is true of the side-effect-only modules here (components/
// support-btn.js, js/search-shortcut.js, the easter-egg entries: real ES
// modules that simply export nothing). It then wraps them in a NON-async
// initializer, and js/i18n.js's top-level await lands inside that wrapper:
// `(() => { await … })()`, which does not parse. The bundle is emitted without
// an error and breaks the page on load.
//
// Appending an empty `export {}` at load time removes the ambiguity — the file
// is unmistakably ESM, esbuild keeps the await at real top level. Build-time
// only; nothing on disk changes, and `export {}` is legal even in a file that
// already exports. There is no genuine CommonJS under js/ or components/ to
// misclassify the other way (grep-verified), so this applies to all of them.
const forceEsmModule = {
  name: 'force-esm-module',
  setup(build) {
    build.onLoad({ filter: /\.js$/ }, args => {
      if (args.path.includes('node_modules')) return;
      return { contents: fs.readFileSync(args.path, 'utf8') + '\nexport {};\n', loader: 'js' };
    });
  },
};

// A bundler that emits unparsable JS must never be able to write it. esbuild's
// own success is not proof: the wrapper bug above produced a clean build with
// broken output. Same trick test-js.js uses — a .mjs copy so Node parses it as
// a module (the repo is "type": "commonjs") without executing it.
function assertParses(code, label) {
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tl-bundle-')), 'bundle.mjs');
  fs.writeFileSync(tmp, code, 'utf8');
  const res = spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
  fs.rmSync(path.dirname(tmp), { recursive: true, force: true });
  if (res.status !== 0) {
    const detail = (res.stderr || '').split('\n').find(l => /Error/.test(l)) || 'unknown parse error';
    throw new Error(`${label}: бандл не парсится — ${detail.trim()}`);
  }
}

function walkHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (PRUNE_DIRS.has(entry.name)) continue;
      walkHtml(abs, out);
    } else if (entry.name.endsWith('.html')) {
      out.push(abs);
    }
  }
  return out;
}

// templates/ is pruned above (its {{REL}} placeholders aren't real paths), but
// it's where an entry point is usually introduced — read those directly.
function templateFiles() {
  const dirs = [path.join(ROOT, 'templates'), path.join(ROOT, 'templates', 'partials')];
  const out = [];
  for (const d of dirs) {
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d)) if (f.endsWith('.html')) out.push(path.join(d, f));
  }
  return out;
}

const ENTRY_RE = /<script[^>]+type="module"[^>]+src="[^"]*?((?:js|components)\/[a-z0-9-]+)\.min\.js(?:\?[^"]*)?"/gi;

function discoverEntries() {
  const found = new Set();
  for (const file of [...walkHtml(ROOT), ...templateFiles()]) {
    const html = fs.readFileSync(file, 'utf8');
    for (const m of html.matchAll(ENTRY_RE)) found.add(m[1] + '.js');
  }
  return [...found].filter(rel => fs.existsSync(path.join(ROOT, rel))).sort();
}

// Number of files the entry would cost as unbundled modules, so the log can
// state the saving. Mirrors the browser's resolution: static + dynamic imports,
// relative specifiers only, externals excluded.
function graphSize(relEntry) {
  const seen = new Set();
  const queue = [path.join(ROOT, relEntry)];
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file) || !fs.existsSync(file)) continue;
    seen.add(file);
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(/(?:from|import)\s*\(?\s*['"](\.\.?\/[^'"]+)['"]/g)) {
      if (EXTERNAL.includes(m[1])) continue;
      let target = path.normalize(path.join(path.dirname(file), m[1]));
      if (!target.endsWith('.js')) target += '.js';
      queue.push(target);
    }
  }
  return seen.size;
}

// Classic (non-module) <script defer> components — no import/export, so no
// resolver is needed, just concatenation of the already-minified per-file
// output from build-js-minify.js. Unlike the ESM entries above, these are
// registered here by hand (there's no "type=module" marker to discover them
// by).
//
// lang-switcher.js/search-box.js/mobile-nav.js have ONE source of truth —
// templates/partials/nav-header.html — read by three mechanisms: {{> nav-header}}
// in 8 mustache templates, build-tools-headers.js's splice into tools/*.html,
// and build-home-sitemap.js's splice into index.html. Editing nav-header.html
// once (done alongside this bundle) propagates through all three.
//
// cookie-consent.js has NO single source: templates/partials/metrika.html,
// each tools/*.html, and the hand-authored catalog/terms/consent pages each
// carry their own separate copy of the tag. It's included in the bundle
// anyway — the four files here have no interaction with each other, nothing
// about being bundled requires a shared source — but every one of those
// standalone tags had to be hand-removed alongside nav-header.html's edit,
// there being no splice mechanism to do it for them. If a future page adds
// its own cookie-consent tag by copy-pasting an old one instead of pulling
// from metrika.html/nav-header.html, it'll silently go back to being a
// separate request — same drift risk the metrika.html/nav-header.html split
// already carried before this change, not a new one this bundle introduces.
//
// Safety: verified before writing this (see the CLAUDE.md entry) — none of
// the four declare `document.currentScript`, none share a top-level
// identifier, and classic <script> tags already share one global lexical
// scope on the page, so concatenation changes nothing about how they see
// each other versus staying separate tags.
const CLASSIC_BUNDLES = {
  'components/site-chrome.min.js': [
    'components/cookie-consent.js',
    'components/lang-switcher.js',
    'components/search-box.js',
    'components/mobile-nav.js',
  ],
};

function buildClassicBundles() {
  let written = 0, unchanged = 0, saved = 0;
  for (const [outRel, sources] of Object.entries(CLASSIC_BUNDLES)) {
    const parts = sources.map(rel => {
      const minRel = rel.replace(/\.js$/, '.min.js');
      const abs = path.join(ROOT, minRel);
      if (!fs.existsSync(abs)) throw new Error(`site-chrome bundle: отсутствует ${minRel} — прогони build-js-minify.js`);
      return fs.readFileSync(abs, 'utf8').replace(/\s*$/, '');
    });
    // ';\n' between parts: minified output doesn't reliably end its last
    // statement with a semicolon, and ASI can misparse the next file's
    // leading '(' or '[' as a continuation of the previous expression.
    const code = `/* AUTO-GENERATED by scripts/build-js-bundles.js — do not edit directly. */\n` +
      `/* Source files: ${sources.join(', ')} */\n` + parts.join(';\n') + ';\n';
    assertParses(code, outRel);
    const outPath = path.join(ROOT, outRel);
    const prev = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
    if (prev === code) { unchanged++; saved += sources.length - 1; continue; }
    fs.writeFileSync(outPath, code, 'utf8');
    written++;
    saved += sources.length - 1;
    console.log(`  ${outRel}: ${sources.length} файлов → 1  (−${sources.length - 1} запросов на загрузку)`);
  }
  return { written, unchanged, saved };
}

async function main() {
  const entries = discoverEntries();
  let written = 0, unchanged = 0, skipped = 0, saved = 0;

  for (const rel of entries) {
    const size = graphSize(rel);
    if (size < 2) { skipped++; continue; }

    const result = await esbuild.build({
      entryPoints: [path.join(ROOT, rel)],
      bundle: true,
      format: 'esm',
      // es2022, not es2020: js/i18n.js awaits its dictionary import at the top
      // level. That is what the browser already executes today (the file is
      // served unbundled), so this matches reality rather than relaxing it.
      target: 'es2022',
      minify: true,
      write: false,
      external: EXTERNAL,
      legalComments: 'none',
      plugins: [forceEsmModule],
      // Not 'silent': the one bug this script has already hit announced itself
      // as a warning while the build still reported success.
      logLevel: 'warning',
    });

    // The external specifiers survive verbatim; point them at the minified
    // dictionaries, the same rewrite build-js-minify.js applies to specifiers
    // it emits. Without this the bundle would request the unminified dict.
    const code = result.outputFiles[0].text
      .replace(/(["'])(\.\/i18n-dict-(?:ru|en))\.js\1/g, '$1$2.min.js$1');

    assertParses(code, rel);

    const outPath = path.join(ROOT, rel.replace(/\.js$/, '.min.js'));
    if (DRY_RUN) {
      console.log(`[dry-run] ${rel}: ${size} файлов → 1  (−${size - 1} запросов на загрузку)`);
      saved += size - 1;
      continue;
    }

    const prev = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
    if (prev === code) { unchanged++; saved += size - 1; continue; }
    fs.writeFileSync(outPath, code, 'utf8');
    written++;
    saved += size - 1;
    console.log(`  ${rel}: ${size} файлов → 1  (−${size - 1} запросов на загрузку)`);
  }

  const tail = `точек входа ${entries.length}, забандлено ${entries.length - skipped}, ` +
               `однофайловых пропущено ${skipped}, суммарно −${saved} запросов на полный обход`;
  if (DRY_RUN) console.log(`[dry-run] JS-бандлы (ESM): ${tail}`);
  else console.log(`✓ JS-бандлы (ESM): written=${written} unchanged=${unchanged} — ${tail}`);

  if (DRY_RUN) {
    for (const [outRel, sources] of Object.entries(CLASSIC_BUNDLES)) {
      console.log(`[dry-run] ${outRel}: ${sources.length} файлов → 1  (−${sources.length - 1} запросов на загрузку)`);
    }
  } else {
    const c = buildClassicBundles();
    console.log(`✓ JS-бандлы (classic): written=${c.written} unchanged=${c.unchanged} — суммарно −${c.saved} запросов на полный обход`);
  }
}

// CLASSIC_BUNDLES is the single source of truth for what site-chrome.min.js
// inlines; scripts/test-component-wiring.js reads it the same way
// test-css-parity.js reads build-css-bundles.js's BUNDLES — require(), not a
// second hardcoded copy. Guarded so require() doesn't run a build as a side effect.
module.exports = { CLASSIC_BUNDLES };

if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
