#!/usr/bin/env node
/**
 * Generates per-post OG preview images for the blog: assets/og/blog-<slug>.png (1200×630).
 * Isolated from build-og-images.js (per-logo) / build-og-home.js (homepage) — one concern per file.
 *
 * Without this, every blog post falls back to the generic assets/og/home.png in build-blog.js —
 * fine as a bootstrap default, but it means every post looks identical when shared on
 * Telegram/social. This gives each post its own title-card image instead.
 *
 * Usage:
 *   node scripts/build-blog-og-images.js            # build all
 *   node scripts/build-blog-og-images.js --dry-run  # list paths without writing
 */

const fs   = require('fs');
const path = require('path');

const ROOT      = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'blog', 'posts');
const OUT_DIR   = path.join(ROOT, 'assets', 'og');
const DRY_RUN   = process.argv.includes('--dry-run');
const CHROME    = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const LOGO_B64  = fs.readFileSync(path.join(ROOT, 'assets', 'brand', 'logo.png')).toString('base64');

// Cycled by post index — same idea as build-blog.js's COVER_GRADIENTS, just as a single accent
// color against the shared dark OG background instead of a full light gradient (keeps text legible).
const ACCENTS = ['#8a6bff', '#34d399', '#fbbf24', '#f87171', '#60a5fa'];

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return meta;
}

// Longer titles need a smaller size to fit two-to-four lines inside the 1200×630 canvas.
function titleFontSize(len) {
  if (len <= 45) return 68;
  if (len <= 60) return 58;
  if (len <= 75) return 50;
  return 44;
}

function buildHtml({ title, description, accent }) {
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
  h1 { font-size:${fontSize}px; font-weight:700; line-height:1.15; letter-spacing:-0.02em; max-width:1000px; }
  p {
    margin-top:28px; font-size:26px; color:#999; max-width:940px; line-height:1.5;
    display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;
  }
  .brand { position:absolute; bottom:64px; right:96px; display:flex; align-items:center; gap:14px; }
  .brand-logo { width:46px; height:46px; display:flex; align-items:center; justify-content:center; }
  .brand-logo img { width:100%; height:100%; display:block; object-fit:cover; }
  .brand-name { font-size:28px; font-weight:600; }
</style></head><body>
  <h1>${esc(title)}</h1>
  <p>${esc(description)}</p>
  <div class="brand">
    <span class="brand-logo"><img src="data:image/png;base64,${LOGO_B64}" alt=""></span>
    <span class="brand-name">Trace Logo's</span>
  </div>
</body></html>`;
}

async function main() {
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  const posts = files.map(f => {
    const raw  = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8');
    const meta = parseFrontmatter(raw);
    const slug = meta.slug || path.basename(f, '.md');
    return {
      slug,
      title: meta.title || slug,
      description: meta.description || '',
    };
  });

  if (DRY_RUN) {
    posts.forEach((p, i) => console.log(`assets/og/blog-${p.slug}.png  (${ACCENTS[i % ACCENTS.length]})`));
    console.log(`\nTotal: ${posts.length}`);
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

  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    const accent = ACCENTS[i % ACCENTS.length];
    const outPath = path.join(OUT_DIR, `blog-${p.slug}.png`);
    const html = buildHtml({ title: p.title, description: p.description, accent });

    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const buf = await page.screenshot({ type: 'png' });

    const prev = fs.existsSync(outPath) ? fs.readFileSync(outPath) : null;
    if (prev && prev.equals(buf)) { unchanged++; continue; }

    fs.writeFileSync(outPath, buf);
    written++;
    process.stdout.write(`\r  ${written + unchanged}/${posts.length} — ${p.slug}          `);
  }

  await browser.close();

  console.log(`\n\n✓ Written:   ${written}`);
  console.log(`  Unchanged: ${unchanged}`);
  console.log(`  Total:     ${posts.length}`);
}

main().catch(err => { console.error(err); process.exit(1); });
