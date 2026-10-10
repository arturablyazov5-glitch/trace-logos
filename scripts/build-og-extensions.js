#!/usr/bin/env node
/**
 * OG-картинки для лендингов расширений и Figma-плагинов: assets/og/tools-<slug>.png (1200×630).
 *
 * Источник правды — tools/extensions/<slug>/manifest.json (имя, описание,
 * версия) плюс необязательный блок og в этом файле (PLATFORMS) с логотипами
 * площадок из каталога. Отдельного текста для картинки нигде не заводим:
 * разъехаться с лендингом ему тогда негде.
 *
 * EN: у лендинга с EN-парой (tools/landing-en/<slug>.html, scripts/lib/en-landings.js)
 * ещё и assets/og/en/tools-<slug>.png — та же карточка, английский бейдж и подпись,
 * описание из og:description пары. Нет пары — EN-картинки нет.
 *
 * Инкрементальный: скриншот детерминирован, поэтому сравниваем байты и пишем
 * только изменившееся (тот же приём, что в build-og-images.js).
 *
 * Usage:
 *   node scripts/build-og-extensions.js
 *   node scripts/build-og-extensions.js --dry-run
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { pairFileFor } = require('./lib/en-landings');

const ROOT = path.resolve(__dirname, '..');
const EXT_ROOT = path.join(ROOT, 'tools/extensions');
// Figma-плагины: те же карточки, но manifest.json у них без версии и описания,
// поэтому описание берём из og:description самого лендинга (единственный текст).
const PLUGIN_ROOT = path.join(ROOT, 'tools/figma-plugins');
const OUT_DIR = path.join(ROOT, 'assets/og');
const OUT_DIR_EN = path.join(OUT_DIR, 'en');
const DRY_RUN = process.argv.includes('--dry-run');

// Логотипы площадок в подвале карточки — файлы каталога, не отдельные копии.
const PLATFORMS = {
  'reviews-exporter': ['yandex-maps.svg', 'avito.svg', 'ozon.svg', 'telegram.svg'],
};

const dataUri = (file) => {
  const ext = path.extname(file).slice(1).toLowerCase();
  const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
  return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
};

const decodeEntities = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

const ogDescription = (html, label) => {
  const og = html.match(/<meta property="og:description" content="([^"]*)"/);
  if (!og) throw new Error(`${label}: нет og:description`);
  return decodeEntities(og[1]);
};

function cardHtml(slug, manifest, fonts, kind = 'extension', lang = 'ru') {
  const en = lang === 'en';
  // «Reviews Exporter | Trace Logo's» → «Reviews Exporter»
  const name = manifest.name.split('|')[0].trim();
  const desc = (manifest.description || '').replace(/</g, '&lt;');
  const badge = en
    ? (kind === 'plugin' ? 'Figma plugin' : `Chrome extension · v${manifest.version}`)
    : (kind === 'plugin' ? 'Figma-плагин' : `Chrome-расширение · v${manifest.version}`);
  const logos = (PLATFORMS[slug] || [])
    .map((f) => `<img src="${dataUri(path.join(ROOT, 'assets/logos/svgs', f))}" alt="">`)
    .join('');

  return `<html lang="${lang}"><meta charset="UTF-8"><style>
    @font-face{font-family:Inter;src:url(${fonts.cyr})}
    @font-face{font-family:Inter;src:url(${fonts.lat});unicode-range:U+0000-024F}
    *{box-sizing:border-box;margin:0}
    body{width:1200px;height:630px;overflow:hidden;background:#101014;color:#fff;
         font-family:Inter,sans-serif;padding:56px 64px;position:relative}
    .grid{position:absolute;inset:0;background-image:
      linear-gradient(#1e1e1e 1px,transparent 1px),linear-gradient(90deg,#1e1e1e 1px,transparent 1px);
      background-size:40px 40px;opacity:.5}
    .glow{position:absolute;top:-180px;right:-120px;width:620px;height:620px;border-radius:50%;
      background:radial-gradient(circle,rgba(138,107,255,.28),transparent 65%)}
    .in{position:relative;height:100%;display:flex;flex-direction:column}
    .brand{font-size:19px;font-weight:600;color:#d2c3f5}
    .badge{margin-top:auto;display:inline-flex;align-items:center;gap:8px;align-self:flex-start;
      font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:#a78bfa;
      border:1px solid rgba(167,139,250,.3);background:rgba(167,139,250,.07);
      border-radius:6px;padding:6px 12px;margin-bottom:22px}
    h1{font-size:64px;line-height:1.05;letter-spacing:-.04em;font-weight:600}
    h1 span{color:#b299ff}
    p{margin-top:20px;font-size:21px;line-height:1.5;color:#aaa;max-width:840px}
    .foot{margin-top:34px;display:flex;align-items:center;gap:18px}
    .foot img{width:38px;height:38px;border-radius:9px;object-fit:contain}
    .url{margin-left:auto;font-size:17px;color:#777}
  </style><body>
    <div class="grid"></div><div class="glow"></div>
    <div class="in">
      <div class="brand">Trace Logo&rsquo;s / Tools</div>
      <div class="badge">${badge}</div>
      <h1>${name.replace(/\s(\S+)$/, ' <span>$1</span>')}</h1>
      <p>${desc}</p>
      <div class="foot">${logos}<span class="url">trace-logos.ru${en ? '/en' : ''}/tools</span></div>
    </div>
  </body></html>`;
}

async function main() {
  const hasPage = (root, d) =>
    fs.existsSync(path.join(root, d, 'manifest.json')) && fs.existsSync(path.join(root, d, 'index.html'));
  const targets = [
    ...fs.readdirSync(EXT_ROOT).filter((d) => hasPage(EXT_ROOT, d)).map((slug) => ({ slug, root: EXT_ROOT, kind: 'extension' })),
    ...fs.readdirSync(PLUGIN_ROOT).filter((d) => hasPage(PLUGIN_ROOT, d)).map((slug) => ({ slug, root: PLUGIN_ROOT, kind: 'plugin' })),
  ];
  const slugs = targets.map((x) => x.slug);
  // EN-пара ищется по пути RU-лендинга: tools/extensions|figma-plugins/<slug>/index.html.
  for (const t of targets) {
    t.pair = pairFileFor(path.relative(ROOT, path.join(t.root, t.slug, 'index.html')).split(path.sep).join('/'));
  }
  const enCount = targets.filter((t) => t.pair).length;

  if (DRY_RUN) {
    slugs.forEach((s) => console.log(`→ assets/og/tools-${s}.png`));
    targets.filter((t) => t.pair).forEach((t) => console.log(`→ assets/og/en/tools-${t.slug}.png (EN-пара)`));
    return;
  }

  const fonts = {
    cyr: dataUri(path.join(ROOT, 'assets/fonts/inter-cyrillic.woff2')).replace('image/', 'font/'),
    lat: dataUri(path.join(ROOT, 'assets/fonts/inter-latin.woff2')).replace('image/', 'font/'),
  };

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });
  let written = 0;
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    const render = async (html, out) => {
      await page.setContent(html, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const buf = await page.screenshot({ type: 'png' });
      const same = fs.existsSync(out) && Buffer.compare(fs.readFileSync(out), buf) === 0;
      if (same) return;
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, buf); written++;
      console.log(`✓ ${path.relative(ROOT, out)}`);
    };
    for (const { slug, root, kind, pair } of targets) {
      const manifest = JSON.parse(fs.readFileSync(path.join(root, slug, 'manifest.json'), 'utf8'));
      if (kind === 'plugin') {
        manifest.description = ogDescription(fs.readFileSync(path.join(root, slug, 'index.html'), 'utf8'), `${slug}: index.html`);
      }
      await render(cardHtml(slug, manifest, fonts, kind), path.join(OUT_DIR, `tools-${slug}.png`));
      if (pair) {
        const enManifest = { ...manifest, description: ogDescription(fs.readFileSync(pair, 'utf8'), path.relative(ROOT, pair)) };
        await render(cardHtml(slug, enManifest, fonts, kind, 'en'), path.join(OUT_DIR_EN, `tools-${slug}.png`));
      }
    }
  } finally {
    await browser.close();
  }
  console.log(`OG расширений: ${slugs.length} RU + ${enCount} EN проверено, ${written} обновлено`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
