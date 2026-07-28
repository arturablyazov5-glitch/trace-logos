#!/usr/bin/env node
/**
 * Generates the branded homepage OG image: assets/og/home.png (1200×630).
 * Isolated from build-og-images.js (per-logo) — one concern per file.
 *
 * Usage: node scripts/build-og-home.js
 * Requires Google Chrome at the path below.
 */

const fs   = require('fs');
const path = require('path');
const { getLogoReadyCount, getEmojiCount } = require('./lib/counts');

const ROOT = path.resolve(__dirname, '..');
const OUT  = path.join(ROOT, 'assets', 'og', 'home.png');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const LOGO_B64 = fs.readFileSync(path.join(ROOT, 'assets', 'brand', 'logo.png')).toString('base64');
const LOGO_COUNT = getLogoReadyCount();
const EMOJI_COUNT = getEmojiCount();

const HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:1200px; height:630px; overflow:hidden;
    font-family:-apple-system, 'Segoe UI', sans-serif;
    background:#0a0a0a;
    background-image:
      radial-gradient(ellipse 80% 60% at 50% -10%, rgba(138, 107, 255,0.22) 0%, transparent 60%),
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size:100% 100%, 52px 52px, 52px 52px;
    display:flex; flex-direction:column; justify-content:center;
    padding:96px; color:#fff; position:relative;
  }
  .badge {
    display:inline-flex; align-items:center; gap:10px; align-self:flex-start;
    font-size:22px; color:#aaa; background:rgba(255,255,255,0.05);
    border:1px solid rgba(255,255,255,0.1); border-radius:100px; padding:10px 22px; margin-bottom:40px;
  }
  .dot { width:10px; height:10px; border-radius:50%; background:#8a6bff; box-shadow:0 0 10px #8a6bff; }
  h1 { font-size:82px; font-weight:700; line-height:1.05; letter-spacing:-0.03em; max-width:960px; }
  h1 .accent { color:#8a6bff; }
  p { margin-top:32px; font-size:30px; color:#999; max-width:820px; line-height:1.5; }
  .brand { position:absolute; bottom:64px; right:96px; display:flex; align-items:center; gap:14px; }
  .brand-logo { width:46px; height:46px; display:flex; align-items:center; justify-content:center; }
  .brand-logo img { width:100%; height:100%; display:block; object-fit:cover; }
  .brand-name { font-size:28px; font-weight:600; }
</style></head><body>
  <div class="badge"><span class="dot"></span>${LOGO_COUNT} логотипов · ${EMOJI_COUNT} эмодзи · бесплатно</div>
  <h1>SVG-логотипы брендов<br>и <span class="accent">эмодзи</span> для дизайна</h1>
  <p>Скачивайте, меняйте цвета и экспортируйте в Figma — без регистрации.</p>
  <div class="brand">
    <span class="brand-logo">
      <img src="data:image/png;base64,${LOGO_B64}" alt="">
    </span>
    <span class="brand-name">Trace Logo's</span>
  </div>
</body></html>`;

(async () => {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.setContent(HTML, { waitUntil: 'networkidle0' });
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  // Скриншот детерминирован при одном и том же HTML, поэтому сравниваем байты и
  // пишем только при изменении: скрипт обязателен в build-all.js и без этого
  // каждая сборка дёргала бы 116 КБ бинарника в git на ровном месте.
  const buf  = await page.screenshot();
  const prev = fs.existsSync(OUT) ? fs.readFileSync(OUT) : null;
  await browser.close();
  // build-all.js прокидывает --dry-run в КАЖДЫЙ шаг — скрипт, игнорирующий флаг,
  // превращает «preview, write nothing» в ложь и пишет файлы на диск.
  if (process.argv.includes('--dry-run')) {
    console.log(`(dry-run) ${path.relative(ROOT, OUT)} — ${prev && prev.equals(buf) ? 'без изменений' : 'обновился бы'}`);
    return;
  }
  if (prev && prev.equals(buf)) {
    console.log('· ' + path.relative(ROOT, OUT) + ' — без изменений');
    return;
  }
  fs.writeFileSync(OUT, buf);
  console.log('✓ ' + path.relative(ROOT, OUT));
})().catch(e => { console.error(e); process.exit(1); });
