#!/usr/bin/env node
/**
 * Regenerates vercel.json's "redirects" array from logos/url-aliases.json
 * + redirects-extra.json.
 *
 * Why this exists: a logo item's URL is derived from its `figma` field's
 * second path segment (see build-seo-pages.js), NOT from the category's
 * manifest slug. Moving an item between logos/categories/*.json (e.g. to
 * fix a miscategorized logo) usually changes that segment, which changes
 * the item's live URL — and an already-indexed page starts 404ing unless a
 * 301 redirect is added. That redirect used to mean hand-editing
 * vercel.json's "redirects" array, which is exactly the kind of manual step
 * this project avoids (see build-all.js's header comment on optional steps
 * that get forgotten).
 *
 * Instead: logos/url-aliases.json is the source of truth for logo moves —
 * one `{ "from": "<old-category>/<slug>", "to": "<new-category>/<slug>" }`
 * entry per moved item, added by hand at the same time as the category
 * move. This script owns vercel.json's "redirects" key entirely (like
 * build-version.js owns js/version.js) — never hand-edit that key, edit
 * one of the two source files instead and rerun the build.
 *
 * For every alias this script emits two 301s (RU + /en/ mirror) and
 * validates:
 *   - the destination page exists on disk (logos/<to>/index.html and
 *     en/logos/<to>/index.html) — a broken destination is a build error,
 *     same severity as test-links.js's broken-link check.
 *   - the source page no longer exists — if it does, the alias is stale
 *     (the slug is back in active use for something else) or the move
 *     didn't actually happen; either way it's worth a human look, so this
 *     is a warning, not a failure.
 *
 * redirects-extra.json (repo root) covers every OTHER kind of redirect —
 * anything outside logos/<cat>/<slug>/ (tools pages, renamed sections,
 * etc.), where the RU/EN pairing and destination shape url-aliases.json
 * assumes don't apply. Each entry is a literal, already-absolute
 * `{ "source": "/abs/path/", "destination": "/abs/path/", "permanent"?: bool }`
 * — write both the RU and /en/ pair by hand if both exist. Added 2026-08-06
 * after a manual vercel.json edit for a tools/extensions rename got wiped by
 * the very next build (this script rewrote "redirects" from url-aliases.json
 * alone) — same class of bug as hand-editing js/data.js's ECOSYSTEMS block.
 * Validates `destination` resolves to a real page the same way as aliases;
 * does NOT check `source` (a renamed/removed tools page is expected to be
 * gone, unlike a logo slug drifting back into use).
 *
 * Run after test-links.js (needs the final built HTML to validate
 * destinations) and before build-sitemap.js.
 *
 * Usage: node scripts/build-redirects.js [--dry-run] [--strict]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ALIASES_PATH = path.join(ROOT, 'logos', 'url-aliases.json');
const EXTRA_PATH = path.join(ROOT, 'redirects-extra.json');
const VERCEL_JSON_PATH = path.join(ROOT, 'vercel.json');

const DRY_RUN = process.argv.includes('--dry-run');
const STRICT = process.argv.includes('--strict');

function pageExists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath, 'index.html'));
}

function main() {
  const aliases = JSON.parse(fs.readFileSync(ALIASES_PATH, 'utf8'));
  const extras = fs.existsSync(EXTRA_PATH) ? JSON.parse(fs.readFileSync(EXTRA_PATH, 'utf8')) : [];

  let errors = 0;
  let warnings = 0;
  const redirects = [];

  for (const { from, to } of aliases) {
    const destRu = `logos/${to}`;
    const destEn = `en/logos/${to}`;
    const srcRu = `logos/${from}`;

    if (!pageExists(destRu)) {
      console.error(`✗ битый алиас: "${from}" -> "${to}" — logos/${to}/index.html не найден`);
      errors++;
    }
    if (!pageExists(destEn)) {
      console.error(`✗ битый алиас: "${from}" -> "${to}" — en/logos/${to}/index.html не найден`);
      errors++;
    }
    if (pageExists(srcRu)) {
      console.warn(`⚠ алиас "${from}" -> "${to}": logos/${from}/index.html всё ещё существует — слаг снова живой или перенос не завершён`);
      warnings++;
    }

    // trailingSlash:true in vercel.json means Vercel's own normalization
    // 308s a slash-less request to the slash-suffixed path BEFORE evaluating
    // custom redirects — so `source` must already carry the trailing slash,
    // or it never matches and the request falls through to 404.
    redirects.push({ source: `/logos/${from}/`, destination: to ? `/logos/${to}/` : `/logos/`, permanent: true });
    redirects.push({ source: `/en/logos/${from}/`, destination: to ? `/en/logos/${to}/` : `/en/logos/`, permanent: true });
  }

  for (const { source, destination, permanent } of extras) {
    if (!/^\/.*\/$/.test(source)) {
      console.error(`✗ redirects-extra.json: "source" должен быть абсолютным путём с завершающим слэшем: "${source}"`);
      errors++;
    }
    if (!pageExists(destination.replace(/^\//, ''))) {
      console.error(`✗ redirects-extra.json: destination "${destination}" — ${destination.replace(/^\//, '')}index.html не найден`);
      errors++;
    }
    redirects.push({ source, destination, permanent: permanent !== false });
  }

  if (errors > 0 || (STRICT && warnings > 0)) {
    console.error(`\nredirects: ${errors} ошибок, ${warnings} предупреждений`);
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log(`[dry-run] vercel.json redirects: ${redirects.length} записей (${aliases.length} алиасов + ${extras.length} extra), ${warnings} предупреждений`);
    return;
  }

  const raw = fs.readFileSync(VERCEL_JSON_PATH, 'utf8');
  const updated = replaceRedirectsBlock(raw, redirects);
  // Round-trip through JSON.parse to fail loudly if the splice produced invalid JSON.
  JSON.parse(updated);
  fs.writeFileSync(VERCEL_JSON_PATH, updated);

  console.log(`✓ vercel.json redirects: ${redirects.length} записей (${aliases.length} алиасов + ${extras.length} extra)${warnings ? `, ${warnings} предупреждений` : ''}`);
}

// Surgical replace of just the "redirects" array's text, so the rest of
// vercel.json (headers, formatting, key order) is untouched — a full
// JSON.parse + JSON.stringify round-trip would reformat every nested object
// in the file (e.g. collapse the one-line header entries onto multiple
// lines), turning an unrelated diff into a full-file rewrite.
function replaceRedirectsBlock(raw, redirects) {
  const keyMatch = raw.match(/"redirects"\s*:\s*\[/);
  if (!keyMatch) throw new Error('vercel.json: "redirects" key not found — add an empty "redirects": [] first');

  const arrayStart = keyMatch.index + keyMatch[0].length - 1; // index of the opening [
  let depth = 0;
  let inString = false;
  let escaped = false;
  let arrayEnd = -1;
  for (let i = arrayStart; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) { arrayEnd = i; break; }
    }
  }
  if (arrayEnd === -1) throw new Error('vercel.json: unterminated "redirects" array');

  const entries = redirects
    .map(r => `    { "source": ${JSON.stringify(r.source)}, "destination": ${JSON.stringify(r.destination)}, "permanent": ${r.permanent} }`)
    .join(',\n');
  const newArray = `[\n${entries}\n  ]`;

  return raw.slice(0, arrayStart) + newArray + raw.slice(arrayEnd + 1);
}

main();
