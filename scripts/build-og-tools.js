#!/usr/bin/env node
// Social preview uses the same hero illustration and type as the tools page.
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const ROOT = path.resolve(__dirname, '..');
async function main() {
  if (process.argv.includes('--dry-run')) return console.log('→ assets/og/tools.png');
  let source = fs.readFileSync(path.join(ROOT, 'tools/index.html'), 'utf8');
  let hero = source.match(/<div class="hub-hero-inner">([\s\S]*?)<div class="hub-dock/)[0];
  hero = hero.slice(0, hero.lastIndexOf('<div class="hub-dock'));
  hero = hero.replace(/<div class="hub-jump">[\s\S]*?<\/div>/, '')
    .replace(/<p class="hub-updated">[\s\S]*?<\/p>/, '')
    .replace(/src="([^"]+)"/g, (_, src) => {
      const file = path.resolve(ROOT, 'tools', src);
      const ext = path.extname(file).slice(1);
      const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
      return `src="data:${mime};base64,${fs.readFileSync(file).toString('base64')}"`;
    }).replace(/loading="lazy"/g, '');
  const font = fs.readFileSync(path.join(ROOT, 'assets/fonts/inter-cyrillic.woff2')).toString('base64');
  const latin = fs.readFileSync(path.join(ROOT, 'assets/fonts/inter-latin.woff2')).toString('base64');
  const css = ['home.css', 'tools-hub.css'].map(f => fs.readFileSync(path.join(ROOT, 'css', f), 'utf8')).join('\n');
  const browser = await puppeteer.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    await page.setContent(`<html lang="ru"><meta charset="UTF-8"><style>
      @font-face{font-family:Inter;src:url(data:font/woff2;base64,${font})} 
      @font-face{font-family:Inter;src:url(data:font/woff2;base64,${latin});unicode-range:U+0000-024F}
      ${css}
      body{margin:0;width:1200px;height:630px;overflow:hidden;padding:45px 55px;background:#101014;font-family:Inter,sans-serif}
      .og-brand{font-size:19px;font-weight:600;margin-bottom:50px;color:#d2c3f5}
      .hub-hero-inner{gap:38px;grid-template-columns:1.05fr 1fr}
      .hub-hero-copy h1{font-size:48px;line-height:1.07;letter-spacing:-.04em;margin:0 0 22px}
      .hub-hero-copy h1 .accent{color:#b299ff;display:block}
      .hub-lead{font-size:16px;line-height:1.6}.hub-eyebrow{margin-bottom:22px}
      .hub-visual{padding:0 0 55px}.hub-visual svg{max-width:100%}
      .og-url{position:absolute;bottom:35px;left:55px;color:#777;font-size:15px}
      </style><body><div class="og-brand">Trace Logo’s / Tools</div>${hero}<div class="og-url">trace-logos.ru/tools</div></body></html>`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(ROOT, 'assets/og/tools.png') });
    console.log('✓ assets/og/tools.png (1200×630)');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
