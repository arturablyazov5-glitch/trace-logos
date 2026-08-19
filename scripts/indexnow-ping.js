#!/usr/bin/env node
/**
 * Pings the IndexNow API with URLs whose page content actually changed since
 * the last successful ping, so participating search engines (Bing, Yandex,
 * Seznam, Naver...) queue an immediate recrawl instead of waiting for their
 * normal schedule. Yandex's Alice AI answers are built from its freshest
 * index, and ChatGPT Search runs on Bing's index — faster recrawl means a
 * better shot at both.
 *
 * The key file at /<INDEXNOW_KEY>.txt proves domain ownership. IndexNow
 * keys aren't secrets (anyone who can already deploy to the domain could
 * generate and host their own), so committing both the key and its key
 * file to the repo is the intended setup, not a leak.
 *
 * Run after every deploy. Never fails the deploy — a ping failure just
 * means engines fall back to their normal crawl schedule.
 *
 * SELECTIVE BY DEFAULT, baselined on the LAST PING, not on git (since
 * 2026-08-14): deploys go straight to Vercel via `vercel --archive=tgz`
 * from the working tree — a git commit is never required to ship, so
 * "diff against git HEAD" silently breaks the moment a deploy happens
 * without a commit either side of it (stale HEAD makes an old, unrelated
 * backlog of edits look "new"; a HEAD made right after a deploy makes real
 * changes disappear because they're already committed). The only baseline
 * that actually matches "what search engines have already been told about"
 * is this script's own last successful run, tracked in `.indexnow-state.json`
 * (committed — a build artifact, like `js/version.js` or `sitemap.xml`, not
 * a secret or a cache) as a content hash per URL, with the `?v=\d{8}`
 * cache-buster and other known build-time noise stripped before hashing.
 * `--all` bypasses the diff and pings the full sitemap (still updates the
 * baseline), for a first run or whenever the state file looks suspect.
 *
 * Usage: node scripts/indexnow-ping.js [--all] [--dry-run] [--seed-only]
 *
 * --seed-only writes the current hashes to `.indexnow-state.json` WITHOUT
 * pinging anything — for bootstrapping the baseline right after a deploy
 * whose content was already submitted some other way (e.g. the one-time
 * switch away from the git-HEAD-based diff, 2026-08-14).
 */

const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT          = path.resolve(__dirname, '..');
const HOST           = 'trace-logos.ru';
const KEY            = '3b096c1b9f1be2461197014112c87d37'; // must match <KEY>.txt at repo root
const KEY_LOCATION   = `https://${HOST}/${KEY}.txt`;
const ENDPOINT       = 'https://api.indexnow.org/indexnow';
const STATE_FILE     = path.join(ROOT, '.indexnow-state.json');

const ARGS     = process.argv.slice(2);
const FORCE_ALL = ARGS.includes('--all');
const DRY_RUN   = ARGS.includes('--dry-run');
const SEED_ONLY = ARGS.includes('--seed-only');

// Content sitemaps only — sitemap.xml itself is just the index, not a page.
const SITEMAPS = ['sitemap-pages.xml', 'sitemap-logos.xml', 'sitemap-emoji.xml'];

// Noise that changes on every build regardless of real content — stripped
// before hashing. Extend this if another build step starts stamping
// something build-time-only into every page.
const NOISE_RE = [
  /\?v=\d{8}/g, // build-cache-bust.js cache-buster on every css/js link
];

function stripNoise(html) {
  let out = html;
  for (const re of NOISE_RE) out = out.replace(re, '');
  return out;
}

function hashHtml(html) {
  return crypto.createHash('sha1').update(stripNoise(html)).digest('hex');
}

function extractUrls(file) {
  const xml = fs.readFileSync(path.join(ROOT, file), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
}

// https://trace-logos.ru/logos/apple/ -> logos/apple/index.html
function urlToFile(url) {
  let p = url.replace(/^https?:\/\/[^/]+/, '');
  if (p === '' || p.endsWith('/')) p += 'index.html';
  return p.replace(/^\//, '');
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return null; // missing, corrupt, or first run
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 0) + '\n');
}

async function submit(urlList) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
  });
  // IndexNow returns 200 or 202 on success.
  if (res.status !== 200 && res.status !== 202) {
    const body = await res.text().catch(() => '');
    throw new Error(`IndexNow ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.status;
}

// Reads the current on-disk HTML for every sitemap URL and hashes it.
// Missing files are skipped (shouldn't happen post-build, but don't crash
// the deploy over it).
function currentHashes(allUrls) {
  const hashes = {};
  for (const url of allUrls) {
    const file = urlToFile(url);
    let html;
    try { html = fs.readFileSync(path.join(ROOT, file), 'utf8'); }
    catch { continue; }
    hashes[url] = hashHtml(html);
  }
  return hashes;
}

async function main() {
  const allUrls = SITEMAPS.flatMap(extractUrls);
  if (!allUrls.length) { console.warn('⚠ No URLs found in sitemaps — skipping IndexNow ping'); return; }

  const hashes = currentHashes(allUrls);
  const prevState = loadState();

  if (SEED_ONLY) {
    if (DRY_RUN) { console.log(`--seed-only --dry-run: would write baseline for ${allUrls.length} URLs, no submission`); return; }
    saveState(hashes);
    console.log(`✓ IndexNow: baseline seeded for ${allUrls.length} URLs, nothing submitted`);
    return;
  }

  let urls;
  if (FORCE_ALL) {
    urls = allUrls;
  } else if (!prevState) {
    console.log('IndexNow: no previous state (.indexnow-state.json) — first run, pinging full sitemap');
    urls = allUrls;
  } else {
    urls = allUrls.filter((url) => hashes[url] !== undefined && hashes[url] !== prevState[url]);
    console.log(`IndexNow: ${urls.length}/${allUrls.length} pages changed since last ping`);
  }

  if (DRY_RUN) {
    console.log('--dry-run, would submit:');
    for (const u of urls) console.log(`  ${u}`);
    console.log('--dry-run: not updating .indexnow-state.json');
    return;
  }

  if (urls.length) {
    // IndexNow caps a single submission at 10,000 URLs; chunk defensively
    // even though the current site (~2.5k URLs) fits in one request today.
    const CHUNK = 10000;
    for (let i = 0; i < urls.length; i += CHUNK) {
      const chunk = urls.slice(i, i + CHUNK);
      const status = await submit(chunk);
      console.log(`✓ IndexNow: submitted ${chunk.length} URLs (HTTP ${status})`);
    }
  } else {
    console.log('✓ IndexNow: no real content changes since last ping — nothing to submit');
  }

  // Only reached after every submission above succeeded — a mid-way network
  // failure throws before this, so the state file stays on the OLD baseline
  // and the next run retries the same (deduped) diff instead of losing it.
  saveState(hashes);
}

main().catch(err => {
  console.error('⚠ IndexNow ping failed (non-fatal):', err.message);
});
