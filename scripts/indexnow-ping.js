#!/usr/bin/env node
/**
 * Pings the IndexNow API with every URL in the site's sitemaps, so
 * participating search engines (Bing, Yandex, Seznam, Naver...) queue an
 * immediate recrawl instead of waiting for their normal schedule. Yandex's
 * Alice AI answers are built from its freshest index, and ChatGPT Search
 * runs on Bing's index — faster recrawl means a better shot at both.
 *
 * The key file at /<INDEXNOW_KEY>.txt proves domain ownership. IndexNow
 * keys aren't secrets (anyone who can already deploy to the domain could
 * generate and host their own), so committing both the key and its key
 * file to the repo is the intended setup, not a leak.
 *
 * Run after every deploy (see .github/workflows/deploy.yml). Never fails
 * the workflow — a ping failure just means engines fall back to their
 * normal crawl schedule, not a broken deploy.
 *
 * Usage: node scripts/indexnow-ping.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT        = path.resolve(__dirname, '..');
const HOST         = 'trace-logos.ru';
const KEY          = '3b096c1b9f1be2461197014112c87d37'; // must match <KEY>.txt at repo root
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT      = 'https://api.indexnow.org/indexnow';

// Content sitemaps only — sitemap.xml itself is just the index, not a page.
const SITEMAPS = ['sitemap-pages.xml', 'sitemap-logos.xml', 'sitemap-emoji.xml'];

function extractUrls(file) {
  const xml = fs.readFileSync(path.join(ROOT, file), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
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

async function main() {
  const urls = SITEMAPS.flatMap(extractUrls);
  if (!urls.length) { console.warn('⚠ No URLs found in sitemaps — skipping IndexNow ping'); return; }

  // IndexNow caps a single submission at 10,000 URLs; chunk defensively even
  // though the current site (~2.5k URLs) fits in one request today.
  const CHUNK = 10000;
  for (let i = 0; i < urls.length; i += CHUNK) {
    const chunk = urls.slice(i, i + CHUNK);
    const status = await submit(chunk);
    console.log(`✓ IndexNow: submitted ${chunk.length} URLs (HTTP ${status})`);
  }
}

main().catch(err => {
  console.error('⚠ IndexNow ping failed (non-fatal):', err.message);
});
