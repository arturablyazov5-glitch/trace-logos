#!/usr/bin/env node
/**
 * Appends ?v=ASSET_VERSION to every local .css/.js href/src in every
 * rendered HTML file, so a CSS/JS change actually reaches browsers that
 * already cached the old file under vercel.json's 1-day
 * (max-age=86400, stale-while-revalidate=86400) policy for /css/*, /js/*,
 * /components/* — those responses are served straight from the browser
 * cache with no revalidation request for up to a day, so a plain redeploy
 * alone does not invalidate them. Changing the URL is the only way to force
 * an already-cached browser to fetch the new file immediately.
 *
 * Mirrors how assets/logos/* and assets/emoji/* already get busted via
 * SVG_URL_V (js/utils.js, built from the same ASSET_VERSION) — this script
 * extends the same convention to <link rel="stylesheet">/<script src> tags,
 * which SVG_URL_V never touched.
 *
 * Must run AFTER build-version.js (needs the fresh ASSET_VERSION it just
 * wrote) and AFTER every HTML page builder + test-html.js/test-links.js —
 * it's the very last step in build-all.js, deliberately after the link
 * checker so a stamped ?v= query never has to satisfy that test (test-links
 * already strips query strings when it does run, so this would be
 * transparent to it either way, but ordering keeps the intent explicit).
 *
 * Idempotent: strips any existing ?v=... (or other query) on a matched
 * href/src before reapplying the current version, so re-running the full
 * build twice in a row converges instead of accumulating query strings.
 *
 * Usage:
 *   node scripts/build-cache-bust.js [--dry-run]
 */

const fs   = require('fs');
const path = require('path');

const ROOT     = path.resolve(__dirname, '..');
const DRY_RUN  = process.argv.includes('--dry-run');

const VERSION_FILE = path.join(ROOT, 'js', 'version.js');
const versionMatch = fs.readFileSync(VERSION_FILE, 'utf8').match(/ASSET_VERSION\s*=\s*'([^']+)'/);
if (!versionMatch) {
  console.error('build-cache-bust.js: could not read ASSET_VERSION from js/version.js — run build-version.js first.');
  process.exit(1);
}
const VERSION = versionMatch[1];

// Same prune list as test-links.js: skip service dirs, raw {{...}} templates,
// and unrelated mirrored repos.
const PRUNE_DIRS = new Set([
  'node_modules', '.git', '.claude', 'cdn-dist', 'templates',
  'figma-plugins', 'supabase', 'sanitizer', 'upptime',
]);

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

// Only local .css/.js references get stamped — external scripts (Yandex ads,
// Metrika, etc.) are always absolute http(s)/protocol-relative and must stay
// untouched.
const ATTR_RE = /(href|src)="([^"]+)"/g;

// Must reference our own css/js/components directories specifically — not
// just "any local-looking path ending in .css/.js". Vercel injects its own
// absolute-path scripts (/_vercel/speed-insights/script.js,
// /_vercel/insights/script.js) that look local but belong to Vercel, not
// this repo; stamping those risks breaking their analytics query contract.
const OWN_DIR_RE = /(^|\/)(css|js|components)\/[^/]+\.(css|js)$/i;

function isLocalAsset(value) {
  if (/^(https?:)?\/\//i.test(value)) return false;
  if (/^(data|mailto|tel|javascript):/i.test(value)) return false;
  const withoutHash = value.split('#')[0];
  const withoutQuery = withoutHash.split('?')[0];
  return OWN_DIR_RE.test(withoutQuery);
}

function stamp(value) {
  const [withoutHash, hash] = value.split('#');
  const [pathPart] = withoutHash.split('?');
  return `${pathPart}?v=${VERSION}${hash !== undefined ? '#' + hash : ''}`;
}

let filesChanged = 0;
let linksStamped = 0;

for (const file of walkHtml(ROOT)) {
  const original = fs.readFileSync(file, 'utf8');
  let changed = false;

  const updated = original.replace(ATTR_RE, (full, attr, value) => {
    if (!isLocalAsset(value)) return full;
    const stamped = stamp(value);
    if (stamped !== value) {
      changed = true;
      linksStamped++;
    }
    return `${attr}="${stamped}"`;
  });

  if (changed) {
    filesChanged++;
    if (!DRY_RUN) fs.writeFileSync(file, updated);
  }
}

const verb = DRY_RUN ? '[dry-run] would stamp' : 'stamped';
console.log(`build-cache-bust.js: ${verb} ${linksStamped} css/js links across ${filesChanged} files with ?v=${VERSION}`);
