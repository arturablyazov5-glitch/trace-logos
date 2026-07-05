#!/usr/bin/env node
/**
 * Scrape liquid glass icons from App Store.
 *
 * Usage:
 *   node scripts/scrape-appstore-icon.js <URL or App ID> [output-name]
 *   node scripts/scrape-appstore-icon.js https://apps.apple.com/ru/app/discord/id985746746
 *   node scripts/scrape-appstore-icon.js 985746746 discord
 *   node scripts/scrape-appstore-icon.js --batch list.txt     # one "ID name" per line
 *
 * Env:
 *   OUT_DIR=./output  (default: current dir)
 *
 * Output: <name>.png (1024×1024 RGBA PNG with liquid glass effect)
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const OUT_DIR = process.env.OUT_DIR || '.';
const SIZE = '1024x1024bb-75';

function get(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
    };
    const doReq = (u, redirects = 0) => {
      if (redirects > 5) return reject(new Error('Too many redirects'));
      mod.get(u, { headers }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return doReq(res.headers.location, redirects + 1);
        }
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
      }).on('error', reject);
    };
    doReq(url);
  });
}

function parseAppId(input) {
  const m = input.match(/id(\d{5,})/);
  if (m) return m[1];
  if (/^\d{5,}$/.test(input.trim())) return input.trim();
  throw new Error(`Can't parse App ID from: ${input}`);
}

function parseCountry(input) {
  const m = input.match(/apps\.apple\.com\/([a-z]{2})\//);
  return m ? m[1] : null;
}

async function getAppName(appId) {
  for (const country of ['ru', 'us']) {
    try {
      const { body } = await get(`https://itunes.apple.com/lookup?id=${appId}&country=${country}`);
      const data = JSON.parse(body.toString());
      if (data.resultCount) {
        return data.results[0].trackName || `app-${appId}`;
      }
    } catch {}
  }
  throw new Error(`App ${appId} not found in any store`);
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/gi, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const delay = ms => new Promise(r => setTimeout(r, ms));

async function getPageWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const { body, status } = await get(url);
    if (status === 200) return body;
    if (status === 429) {
      const wait = (i + 1) * 3000;
      console.warn(`  ⏳ Rate limited, waiting ${wait / 1000}s...`);
      await delay(wait);
      continue;
    }
    return null;
  }
  return null;
}

async function findMillIconUrl(appId, country) {
  const cc = country || 'ru';
  const pageUrl = `https://apps.apple.com/${cc}/app/id${appId}`;
  const body = await getPageWithRetry(pageUrl);

  if (!body) {
    if (cc !== 'us') return findMillIconUrl(appId, 'us');
    throw new Error('App Store page failed after retries');
  }

  const html = body.toString();
  const millRe = /https:\/\/is\d+-ssl\.mzstatic\.com\/image\/thumb\/[^"'\s}]+?\/Placeholder\.mill/g;
  const allMills = [...new Set(html.match(millRe) || [])];

  if (!allMills.length) {
    if (cc !== 'us') return findMillIconUrl(appId, 'us');
    throw new Error('No Placeholder.mill URLs found');
  }

  // App icon: used at 200x200 or 400x400
  for (const base of allMills) {
    if (html.includes(`${base}/200x200`) || html.includes(`${base}/400x400`)) {
      return base;
    }
  }
  // Fallback: 1200x630wa (OG image)
  for (const base of allMills) {
    if (html.includes(`${base}/1200x630wa`)) {
      return base;
    }
  }

  console.warn('  ⚠ Could not identify main icon, using first Placeholder.mill');
  return allMills[0];
}

async function downloadIcon(millUrl, outputName) {
  const pngUrl = `${millUrl}/${SIZE}.png`;
  const { status, body } = await get(pngUrl);

  if (status !== 200) throw new Error(`Download failed (HTTP ${status})`);

  const outPath = path.join(OUT_DIR, `${outputName}.png`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, body);
  return { outPath, size: body.length };
}

async function processApp(input, forceName) {
  const appId = parseAppId(input);
  const country = parseCountry(input);
  console.log(`\n→ App ID: ${appId}`);

  const appName = await getAppName(appId);
  console.log(`  Name: ${appName}`);

  const outputName = forceName || slugify(appName);
  console.log(`  File: ${outputName}.png`);

  const millUrl = await findMillIconUrl(appId, country);
  console.log(`  Mill: ...${millUrl.slice(-50)}`);

  const { outPath, size } = await downloadIcon(millUrl, outputName);
  console.log(`  ✓ ${outPath} (${(size / 1024).toFixed(0)} KB)`);
  return outPath;
}

async function main() {
  const args = process.argv.slice(2);

  if (!args.length) {
    console.log('Usage:');
    console.log('  node scripts/scrape-appstore-icon.js <URL|ID> [name]');
    console.log('  node scripts/scrape-appstore-icon.js --batch list.txt');
    console.log('');
    console.log('Env: OUT_DIR=./output (default: .)');
    process.exit(1);
  }

  if (args[0] === '--batch') {
    const file = args[1];
    if (!file || !fs.existsSync(file)) {
      console.error('Batch file not found');
      process.exit(1);
    }
    const lines = fs.readFileSync(file, 'utf8')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'));

    const delayMs = ms => new Promise(r => setTimeout(r, ms));
    let ok = 0, fail = 0;
    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(/\s+/);
      const [url, name] = parts;
      try {
        await processApp(url, name);
        ok++;
      } catch (e) {
        console.error(`  ✗ ${url}: ${e.message}`);
        fail++;
      }
      if (i < lines.length - 1) await delayMs(2000);
    }
    console.log(`\n═══ Done: ${ok} ok, ${fail} failed`);
    return;
  }

  await processApp(args[0], args[1]);
}

main().catch(e => { console.error(`Error: ${e.message}`); process.exit(1); });
