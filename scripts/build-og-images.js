#!/usr/bin/env node
/**
 * Generates OG preview images (1200×630 PNG) for all logo SEO pages.
 *
 * Output: assets/og/<slug>.png
 * Usage:
 *   node scripts/build-og-images.js            # build all
 *   node scripts/build-og-images.js --dry-run  # list paths without writing
 */

const puppeteer = require('puppeteer');
const fs        = require('fs');
const path      = require('path');

const ROOT    = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'og');
const DRY_RUN = process.argv.includes('--dry-run');
const LOGO_B64 = fs.readFileSync(path.join(ROOT, 'assets', 'brand', 'logo.png')).toString('base64');

const BASE_URL = 'https://trace-logos.ru';

function slugify(value) {
  return String(value || '').trim().toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '');
}

function seoSlug(item) {
  const parts = (item.figma || '').split('/').map(slugify).filter(Boolean);
  if (parts[0] !== 'icon' || parts.length < 3) return '';
  return parts.slice(1).join('-');
}

function buildHtml(item, section) {
  const svgFile = (item.file || '').endsWith('.svg');
  const assetAbs = svgFile
    ? path.join(ROOT, 'assets', 'logos', 'svgs', item.file)
    : path.join(ROOT, 'assets', 'logos', 'pngs', item.file);
  const mime = svgFile ? 'image/svg+xml' : 'image/png';
  const b64  = fs.existsSync(assetAbs) ? fs.readFileSync(assetAbs).toString('base64') : '';
  const assetPath = b64 ? `data:${mime};base64,${b64}` : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body {
    width: 1200px; height: 630px;
    background: #111;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 72px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    position: relative;
  }
  body::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
    background-size: 60px 60px;
  }
  .logo-wrap {
    flex-shrink: 0;
    position: relative;
    z-index: 1;
  }
  .logo-wrap img {
    width: 280px; height: 280px;
    object-fit: contain;
    border-radius: 56px;
    display: block;
  }
  .text {
    width: 600px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
    position: relative;
    z-index: 1;
  }
  .name {
    font-size: 96px;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.03em;
    line-height: 1.05;
    word-break: break-word;
  }
  .brand {
    position: absolute;
    bottom: 44px; right: 80px;
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 1;
  }
  .brand-logo {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
  }
  .brand-logo img { width: 100%; height: 100%; display: block; object-fit: cover; }
  .brand-name {
    font-size: 18px;
    font-weight: 600;
    color: #fff;
  }
</style>
</head>
<body>
  <div class="logo-wrap">
    <img src="${assetPath}" alt="${item.name}">
  </div>
  <div class="text">
    <div class="name">Логотип<br>${item.name}</div>
  </div>
  <div class="brand">
    <div class="brand-logo">
      <img src="data:image/png;base64,${LOGO_B64}" alt="">
    </div>
    <span class="brand-name">Trace Logo's</span>
  </div>
</body>
</html>`;
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', 'manifest.json'), 'utf8'));

  const allItems = [];
  for (const cat of manifest.categories) {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos', cat.file), 'utf8'));
    for (const item of data.items) {
      if (item.comingSoon || !item.file || item.file === 'placeholder.svg') continue;
      const slug = seoSlug(item);
      if (!slug) continue;
      allItems.push({ item, section: cat.section, slug });
    }
  }

  if (DRY_RUN) {
    allItems.forEach(({ slug }) => console.log(`assets/og/${slug}.png`));
    console.log(`\nTotal: ${allItems.length}`);
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });
  const page    = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });

  let written = 0, unchanged = 0;

  for (const { item, section, slug } of allItems) {
    const outPath = path.join(OUT_DIR, `${slug}.png`);
    const html    = buildHtml(item, section);

    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    const buf = await page.screenshot({ type: 'png' });

    const prev = fs.existsSync(outPath) ? fs.readFileSync(outPath) : null;
    if (prev && prev.equals(buf)) { unchanged++; continue; }

    fs.writeFileSync(outPath, buf);
    written++;
    process.stdout.write(`\r  ${written + unchanged}/${allItems.length} — ${item.name}          `);
  }

  await browser.close();

  console.log(`\n\n✓ Written:   ${written}`);
  console.log(`  Unchanged: ${unchanged}`);
  console.log(`  Total:     ${allItems.length}`);
}

main().catch(err => { console.error(err); process.exit(1); });
