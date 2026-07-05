#!/usr/bin/env node
/**
 * Generates Figma plugin store assets:
 *   figma-plugin/assets/icon.png       128×128
 *   figma-plugin/assets/thumbnail.png  1920×1080
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '../figma-plugin/assets');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const LOGO_SVG = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.9844 2.13613C12.4512 1.60535 14 2.69196 14 4.25188V4.42892L7.47401 6.79038C5.98917 7.32768 5 8.73756 5 10.3166V15.8704C3.5378 16.3879 2 15.3035 2 13.7491V7.6674C2 6.29888 2.85728 5.07698 4.14414 4.61132L10.9844 2.13613ZM14.9844 5.1362C16.4512 4.60541 18 5.69202 18 7.25194V7.42896L11.1441 9.90979C9.85728 10.3754 9 11.5973 9 12.9659V18.8705C7.5378 19.388 6 18.3035 6 16.7491V10.3167C6 9.15868 6.72539 8.12477 7.81427 7.73075L14.9844 5.1362ZM18.9844 8.13618C20.4512 7.60539 22 8.692 22 10.2519V17.0352C22 17.9826 21.4065 18.8286 20.5156 19.1509L13.0156 21.8649C11.5488 22.3956 10 21.309 10 19.7491V12.9658C10 12.0184 10.5935 11.1725 11.4844 10.8501L18.9844 8.13618Z" fill="white"/></svg>`;

const ICON_HTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 128px; height: 128px;
  background: #111;
  display: flex; align-items: center; justify-content: center;
  border-radius: 28px;
  overflow: hidden;
}
.inner {
  display: flex; align-items: center; justify-content: center;
  width: 80px; height: 80px;
}
</style></head><body>
<div class="inner">${LOGO_SVG}</div>
</body></html>`;

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
  gap: 120px;
  overflow: hidden;
  position: relative;
}
body::before {
  content: '';
  position: absolute;
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%);
  left: 200px; top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

/* Left — branding */
.left {
  display: flex;
  flex-direction: column;
  gap: 32px;
  flex-shrink: 0;
}
.brand {
  display: flex;
  align-items: center;
  gap: 18px;
}
.brand-icon {
  width: 72px; height: 72px;
  background: #fff;
  border-radius: 18px;
  display: flex; align-items: center; justify-content: center;
}
.brand-icon svg { width: 44px; height: 44px; }
.brand-icon svg path { fill: #0d0d0d; }
.brand-name {
  font-size: 36px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
}
.brand-badge {
  font-size: 13px;
  font-weight: 500;
  color: #555;
  background: #1e1e1e;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  padding: 3px 8px;
  margin-left: 10px;
  vertical-align: middle;
}
.headline {
  font-size: 56px;
  font-weight: 700;
  color: #fff;
  line-height: 1.15;
  letter-spacing: -1px;
  max-width: 680px;
}
.headline span { color: #666; }
.stats {
  display: flex;
  gap: 24px;
}
.stat {
  background: #161616;
  border: 1px solid #222;
  border-radius: 14px;
  padding: 18px 28px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-num {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
}
.stat-label {
  font-size: 14px;
  color: #555;
  font-weight: 500;
}

/* Right — plugin mockup */
.plugin {
  width: 380px;
  background: #111;
  border-radius: 16px;
  border: 1px solid #222;
  overflow: hidden;
  box-shadow: 0 40px 120px rgba(0,0,0,0.8);
  flex-shrink: 0;
}
.plugin-titlebar {
  background: #1a1a1a;
  border-bottom: 1px solid #222;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.plugin-titlebar-icon {
  width: 22px; height: 22px;
  background: #333;
  border-radius: 5px;
  display: flex; align-items: center; justify-content: center;
}
.plugin-titlebar-icon svg { width: 14px; height: 14px; }
.plugin-title { font-size: 13px; font-weight: 600; color: #ccc; }
.plugin-tabs {
  display: flex;
  padding: 6px 8px;
  gap: 2px;
  border-bottom: 1px solid #222;
  background: #111;
}
.plugin-tab {
  flex: 1;
  text-align: center;
  padding: 6px 4px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #666;
}
.plugin-tab.active { background: #222; color: #fff; }
.plugin-search {
  margin: 10px;
  background: #161616;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: #444;
}
.plugin-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  padding: 4px 10px 10px;
}
.plugin-card {
  background: #161616;
  border-radius: 10px;
  border: 1px solid #1e1e1e;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 6px 8px;
  gap: 6px;
}
.plugin-card img {
  width: 44px; height: 44px;
  border-radius: 10px;
  object-fit: contain;
}
.plugin-card-name {
  font-size: 9px;
  color: #555;
  text-align: center;
}
.section-header {
  grid-column: 1 / -1;
  font-size: 9px;
  font-weight: 600;
  color: #333;
  text-transform: uppercase;
  letter-spacing: .06em;
  padding: 4px 2px 2px;
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
      <span class="brand-name">Trace Logos<span class="brand-badge">Plugin</span></span>
    </div>
  </div>

  <div class="headline">288+ логотипов<br><span>и 1900+ эмодзи</span><br>для Figma</div>

  <div class="stats">
    <div class="stat">
      <div class="stat-num">288+</div>
      <div class="stat-label">Логотипов SVG</div>
    </div>
    <div class="stat">
      <div class="stat-num">1900+</div>
      <div class="stat-label">Эмодзи</div>
    </div>
    <div class="stat">
      <div class="stat-num">35+</div>
      <div class="stat-label">Категорий</div>
    </div>
  </div>
</div>

<div class="plugin">
  <div class="plugin-titlebar">
    <div class="plugin-titlebar-icon">
      <svg viewBox="0 0 24 24" fill="none"><path d="M10.9844 2.13613C12.4512 1.60535 14 2.69196 14 4.25188V4.42892L7.47401 6.79038C5.98917 7.32768 5 8.73756 5 10.3166V15.8704C3.5378 16.3879 2 15.3035 2 13.7491V7.6674C2 6.29888 2.85728 5.07698 4.14414 4.61132L10.9844 2.13613ZM14.9844 5.1362C16.4512 4.60541 18 5.69202 18 7.25194V7.42896L11.1441 9.90979C9.85728 10.3754 9 11.5973 9 12.9659V18.8705C7.5378 19.388 6 18.3035 6 16.7491V10.3167C6 9.15868 6.72539 8.12477 7.81427 7.73075L14.9844 5.1362ZM18.9844 8.13618C20.4512 7.60539 22 8.692 22 10.2519V17.0352C22 17.9826 21.4065 18.8286 20.5156 19.1509L13.0156 21.8649C11.5488 22.3956 10 21.309 10 19.7491V12.9658C10 12.0184 10.5935 11.1725 11.4844 10.8501L18.9844 8.13618Z" fill="white"/></svg>
    </div>
    <span class="plugin-title">Trace Logos</span>
  </div>
  <div class="plugin-tabs">
    <div class="plugin-tab active">Лого</div>
    <div class="plugin-tab">Эмодзи</div>
  </div>
  <div class="plugin-search">Поиск...</div>
  <div class="plugin-grid">
    <div class="section-header">Мессенджеры и соцсети</div>
    ${['telegram','whatsapp','vk','instagram','youtube','tiktok'].map(s => `
    <div class="plugin-card">
      <img src="https://trace-logos.ru/assets/logos/svgs/${s}.svg">
      <div class="plugin-card-name">${s.charAt(0).toUpperCase()+s.slice(1)}</div>
    </div>`).join('')}
    <div class="section-header">Банки</div>
    ${[['sber','Сбер'],['t-bank','Т-Банк'],['alfa-bank','Альфа'],['vtb','ВТБ'],['tinkoff','Tinkoff'],['mir','Мир']].map(([s,n]) => `
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

  // Icon 128×128
  console.log('Generating icon...');
  const iconPage = await browser.newPage();
  await iconPage.setViewport({ width: 128, height: 128, deviceScaleFactor: 2 });
  await iconPage.setContent(ICON_HTML, { waitUntil: 'networkidle0' });
  await iconPage.screenshot({ path: path.join(OUT, 'icon.png'), clip: { x: 0, y: 0, width: 128, height: 128 } });
  console.log('✓ icon.png');

  // Thumbnail 1920×1080
  console.log('Generating thumbnail...');
  const thumbPage = await browser.newPage();
  await thumbPage.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await thumbPage.setContent(THUMBNAIL_HTML, { waitUntil: 'networkidle0' });
  await thumbPage.screenshot({ path: path.join(OUT, 'thumbnail.png'), clip: { x: 0, y: 0, width: 1920, height: 1080 } });
  console.log('✓ thumbnail.png');

  await browser.close();
  console.log(`\nAssets saved to figma-plugin/assets/`);
}

generate().catch(e => { console.error(e); process.exit(1); });
