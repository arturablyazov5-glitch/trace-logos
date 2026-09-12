#!/usr/bin/env node
/**
 * Generates Figma plugin store assets:
 *   tools/figma-plugins/trace-logos/assets/thumbnail.png  1920×1080
 *
 * icon.png больше не генерируется этим скриптом (был неудачно закадрирован —
 * глиф занимал ~37.5% канваса, двойной отступ через .inner-обёртку) — теперь
 * это отдельный файл, который поддерживается вручную.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { getLogoReadyCount, getLogoCategoryCount, getEmojiCount } = require('./lib/counts');

const OUT = path.resolve(__dirname, '../tools/figma-plugins/trace-logos/assets');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const LOGO_COUNT = getLogoReadyCount();
const CATEGORY_COUNT = getLogoCategoryCount();
const EMOJI_COUNT = getEmojiCount();

const THUMBNAIL_HTML = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 1920px; height: 1080px;
  background: #0d0d0d;
  font-family: 'Inter', -apple-system, sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 100px;
  overflow: hidden;
  position: relative;
}
body::before {
  content: '';
  position: absolute;
  width: 800px; height: 800px;
  background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%);
  left: 40px; top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

/* Left — branding */
.left {
  display: flex;
  flex-direction: column;
  gap: 48px;
  flex-shrink: 0;
}
.brand {
  display: flex;
  align-items: center;
  gap: 26px;
}
.brand-icon {
  width: 115px; height: 115px;
  background: #fff;
  border-radius: 29px;
  display: flex; align-items: center; justify-content: center;
}
.brand-icon svg { width: 70px; height: 70px; }
.brand-icon svg path { fill: #0d0d0d; }
.brand-name {
  font-size: 55px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.7px;
}
.brand-badge {
  font-size: 19px;
  font-weight: 500;
  color: #555;
  background: #1e1e1e;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  padding: 5px 12px;
  margin-left: 14px;
  vertical-align: middle;
}
.headline {
  font-size: 89px;
  font-weight: 700;
  color: #fff;
  line-height: 1.15;
  letter-spacing: -1.6px;
  max-width: 1080px;
}
.headline span { color: #666; }
.stats {
  display: flex;
  gap: 38px;
}
.stat {
  background: #161616;
  border: 1px solid #222;
  border-radius: 22px;
  padding: 29px 43px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.stat-num {
  font-size: 50px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.7px;
}
.stat-label {
  font-size: 20px;
  color: #555;
  font-weight: 500;
}

/* Right — plugin mockup */
.plugin {
  width: 740px;
  background: #111;
  border-radius: 26px;
  border: 1px solid #222;
  overflow: hidden;
  box-shadow: 0 40px 120px rgba(0,0,0,0.8);
  flex-shrink: 0;
}
.plugin-titlebar {
  background: #1a1a1a;
  border-bottom: 1px solid #222;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 14px;
}
.plugin-titlebar-icon {
  width: 32px; height: 32px;
  background: #333;
  border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
}
.plugin-titlebar-icon svg { width: 20px; height: 20px; }
.plugin-title { font-size: 26px; font-weight: 600; color: #ccc; }
.plugin-tabs {
  display: flex;
  padding: 9px 12px;
  gap: 3px;
  border-bottom: 1px solid #222;
  background: #111;
}
.plugin-tab {
  flex: 1;
  text-align: center;
  padding: 9px 6px;
  border-radius: 8px;
  font-size: 23px;
  font-weight: 500;
  color: #666;
}
.plugin-tab.active { background: #222; color: #fff; }
.plugin-search {
  margin: 14px;
  background: #161616;
  border: 1px solid #2a2a2a;
  border-radius: 11px;
  padding: 12px 17px;
  font-size: 26px;
  color: #444;
}
.plugin-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 6px 14px 14px;
}
.plugin-card {
  background: #161616;
  border-radius: 16px;
  border: 1px solid #1e1e1e;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 9px 12px;
  gap: 9px;
}
.plugin-card img {
  width: 72px; height: 72px;
  border-radius: 16px;
  object-fit: contain;
}
.plugin-card-name {
  font-size: 18px;
  color: #555;
  text-align: center;
}
.section-header {
  grid-column: 1 / -1;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  text-transform: uppercase;
  letter-spacing: .06em;
  padding: 6px 3px 3px;
}
</style></head><body>

<div class="left">
  <div class="brand">
    <div class="brand-icon">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10.9844 2.13613C12.4512 1.60535 14 2.69196 14 4.25188V4.42892L7.47401 6.79038C5.98917 7.32768 5 8.73756 5 10.3166V15.8704C3.5378 16.3879 2 15.3035 2 13.7491V7.6674C2 6.29888 2.85728 5.07698 4.14414 4.61132L10.9844 2.13613ZM14.9844 5.1362C16.4512 4.60541 18 5.69202 18 7.25194V7.42896L11.1441 9.90979C9.85728 10.3754 9 11.5973 9 12.9659V18.8705C7.5378 19.388 6 18.3035 6 16.7491V10.3167C6 9.15868 6.72539 8.12477 7.81427 7.73075L14.9844 5.1362ZM18.9844 8.13618C20.4512 7.60539 22 8.692 22 10.2519V17.0352C22 17.9826 21.4065 18.8286 20.5156 19.1509L13.0156 21.8649C11.5488 22.3956 10 21.309 10 19.7491V12.9658C10 12.0184 10.5935 11.1725 11.4844 10.8501L18.9844 8.13618Z" fill="#0d0d0d"/>
      </svg>
    </div>
    <div>
      <span class="brand-name">Trace Logo's<span class="brand-badge">Plugin</span></span>
    </div>
  </div>

  <div class="headline">${LOGO_COUNT}+ логотипов<br><span>и ${EMOJI_COUNT}+ эмодзи</span><br>для Figma</div>

  <div class="stats">
    <div class="stat">
      <div class="stat-num">${LOGO_COUNT}+</div>
      <div class="stat-label">Логотипов SVG</div>
    </div>
    <div class="stat">
      <div class="stat-num">${EMOJI_COUNT}+</div>
      <div class="stat-label">Эмодзи</div>
    </div>
    <div class="stat">
      <div class="stat-num">${CATEGORY_COUNT}+</div>
      <div class="stat-label">Категорий</div>
    </div>
  </div>
</div>

<div class="plugin">
  <div class="plugin-titlebar">
    <div class="plugin-titlebar-icon">
      <svg viewBox="0 0 24 24" fill="none"><path d="M10.9844 2.13613C12.4512 1.60535 14 2.69196 14 4.25188V4.42892L7.47401 6.79038C5.98917 7.32768 5 8.73756 5 10.3166V15.8704C3.5378 16.3879 2 15.3035 2 13.7491V7.6674C2 6.29888 2.85728 5.07698 4.14414 4.61132L10.9844 2.13613ZM14.9844 5.1362C16.4512 4.60541 18 5.69202 18 7.25194V7.42896L11.1441 9.90979C9.85728 10.3754 9 11.5973 9 12.9659V18.8705C7.5378 19.388 6 18.3035 6 16.7491V10.3167C6 9.15868 6.72539 8.12477 7.81427 7.73075L14.9844 5.1362ZM18.9844 8.13618C20.4512 7.60539 22 8.692 22 10.2519V17.0352C22 17.9826 21.4065 18.8286 20.5156 19.1509L13.0156 21.8649C11.5488 22.3956 10 21.309 10 19.7491V12.9658C10 12.0184 10.5935 11.1725 11.4844 10.8501L18.9844 8.13618Z" fill="white"/></svg>
    </div>
    <span class="plugin-title">Trace Logo's</span>
  </div>
  <div class="plugin-tabs">
    <div class="plugin-tab active">Лого</div>
    <div class="plugin-tab">Эмодзи</div>
  </div>
  <div class="plugin-search">Поиск...</div>
  <div class="plugin-grid">
    <div class="section-header">Мессенджеры и соцсети</div>
    ${['telegram','whatsapp','vk','instagram','youtube','max'].map(s => `
    <div class="plugin-card">
      <img src="https://trace-logos.ru/assets/logos/svgs/${s}.svg">
      <div class="plugin-card-name">${s.charAt(0).toUpperCase()+s.slice(1)}</div>
    </div>`).join('')}
    <div class="section-header">Банки</div>
    ${[['sber','Сбер'],['t-bank','Т-Банк'],['alfa-bank','Альфа'],['vtb','ВТБ'],['ozon-bank','Ozon Банк'],['mir','Мир']].map(([s,n]) => `
    <div class="plugin-card">
      <img src="https://trace-logos.ru/assets/logos/svgs/${s}.svg">
      <div class="plugin-card-name">${n}</div>
    </div>`).join('')}
  </div>
</div>

</body></html>`;

async function generate() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'],
  });

  // Скриншот детерминирован при одном и том же HTML, поэтому сравниваем байты и
  // пишем только при изменении: скрипт обязателен в build-all.js, а thumbnail
  // весит 350 КБ — без этого каждая сборка дёргала бы его в git на ровном месте.
  // build-all.js прокидывает --dry-run в КАЖДЫЙ шаг — скрипт, игнорирующий флаг,
  // превращает «preview, write nothing» в ложь и пишет файлы на диск.
  const DRY_RUN = process.argv.includes('--dry-run');
  const writeIfChanged = (name, buf) => {
    const out  = path.join(OUT, name);
    const prev = fs.existsSync(out) ? fs.readFileSync(out) : null;
    const same = prev && prev.equals(buf);
    if (DRY_RUN) { console.log(`(dry-run) ${name} — ${same ? 'без изменений' : 'обновился бы'}`); return; }
    if (same) { console.log(`· ${name} — без изменений`); return; }
    fs.writeFileSync(out, buf);
    console.log(`✓ ${name}`);
  };

  // Thumbnail 1920×1080
  const thumbPage = await browser.newPage();
  await thumbPage.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await thumbPage.setContent(THUMBNAIL_HTML, { waitUntil: 'networkidle0' });
  writeIfChanged('thumbnail.png', await thumbPage.screenshot({ clip: { x: 0, y: 0, width: 1920, height: 1080 } }));

  await browser.close();
}

generate().catch(e => { console.error(e); process.exit(1); });
