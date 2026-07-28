#!/usr/bin/env node
/**
 * Generates per-collection OG preview images: assets/og/collection-<slug>.png (1200×630).
 * Isolated from build-og-images.js (per-logo) / build-blog-og-images.js (per-post) /
 * build-og-home.js (homepage) — one concern per file.
 *
 * Without this, build-collections.js still emits a collection-<slug>.png OG URL
 * unconditionally (same convention as the blog) — this script is what puts the file
 * there. Until it runs, every collection's social-share preview is a broken image.
 *
 * Opt-in slow tier (Puppeteer/Chrome). Run standalone or via build-all.js --og-collections
 * (or --full). Doesn't depend on build-collections.js having run first.
 *
 * Usage:
 *   node scripts/build-collection-og-images.js            # build all
 *   node scripts/build-collection-og-images.js --dry-run  # list paths without writing
 */

const fs   = require('fs');
const path = require('path');

const ROOT     = path.resolve(__dirname, '..');
const OUT_DIR  = path.join(ROOT, 'assets', 'og');
const DRY_RUN  = process.argv.includes('--dry-run');
const CHROME   = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const LOGO_B64 = fs.readFileSync(path.join(ROOT, 'assets', 'brand', 'logo.png')).toString('base64');

// Cycled by collection index — same accent-on-dark idea as build-blog-og-images.js.
const ACCENTS = ['#8a6bff', '#34d399', '#fbbf24', '#f87171', '#60a5fa'];

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function titleFontSize(len) {
  if (len <= 28) return 76;
  if (len <= 40) return 64;
  return 54;
}

function buildHtml({ icon, title, lead, accent }) {
  const fontSize = titleFontSize(title.length);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:1200px; height:630px; overflow:hidden;
    font-family:-apple-system, 'Segoe UI', sans-serif;
    background:#0a0a0a;
    background-image:
      radial-gradient(ellipse 80% 60% at 50% -10%, ${accent}33 0%, transparent 60%),
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size:100% 100%, 52px 52px, 52px 52px;
    display:flex; flex-direction:column; justify-content:center;
    padding:96px; color:#fff; position:relative;
  }
  .icon {
    width:120px; height:120px; border-radius:28px; margin-bottom:36px;
    display:flex; align-items:center; justify-content:center; font-size:68px;
    background:${accent}22; border:1px solid ${accent}55;
  }
  h1 { font-size:${fontSize}px; font-weight:700; line-height:1.12; letter-spacing:-0.02em; max-width:1000px; }
  p {
    margin-top:26px; font-size:26px; color:#999; max-width:940px; line-height:1.5;
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
  }
  .brand { position:absolute; bottom:64px; right:96px; display:flex; align-items:center; gap:14px; }
  .brand-logo { width:46px; height:46px; display:flex; align-items:center; justify-content:center; }
  .brand-logo img { width:100%; height:100%; display:block; object-fit:cover; }
  .brand-name { font-size:28px; font-weight:600; }
</style></head><body>
  <div class="icon">${esc(icon)}</div>
  <h1>${esc(title)}</h1>
  <p>${esc(lead)}</p>
  <div class="brand">
    <span class="brand-logo"><img src="data:image/png;base64,${LOGO_B64}" alt=""></span>
    <span class="brand-name">Trace Logo's</span>
  </div>
</body></html>`;
}

async function main() {
  const collections = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'collections.json'), 'utf8')).collections;

  if (DRY_RUN) {
    collections.forEach((c, i) =>
      console.log(`assets/og/collection-${c.slug}.png  (${ACCENTS[i % ACCENTS.length]})`));
    console.log(`\nTotal: ${collections.length}`);
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });

  let written = 0, unchanged = 0;

  for (let i = 0; i < collections.length; i++) {
    const c = collections[i];
    const accent = ACCENTS[i % ACCENTS.length];
    const outPath = path.join(OUT_DIR, `collection-${c.slug}.png`);
    const html = buildHtml({ icon: c.icon || '🏷', title: c.h1, lead: c.lead, accent });

    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const buf = await page.screenshot({ type: 'png' });

    const prev = fs.existsSync(outPath) ? fs.readFileSync(outPath) : null;
    if (prev && prev.equals(buf)) { unchanged++; continue; }

    fs.writeFileSync(outPath, buf);
    written++;
    process.stdout.write(`\r  ${written + unchanged}/${collections.length} — ${c.slug}          `);
  }

  await browser.close();

  console.log(`\n\n✓ Written:   ${written}`);
  console.log(`  Unchanged: ${unchanged}`);
  console.log(`  Total:     ${collections.length}`);
}

main().catch(err => { console.error(err); process.exit(1); });
