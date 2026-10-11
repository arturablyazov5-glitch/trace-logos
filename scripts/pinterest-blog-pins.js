#!/usr/bin/env node
/**
 * Pinterest-пины 1000×1500 под статьи блога → dist/pinterest/blog/ (картинки, texts.md, plan.json).
 *
 *   node scripts/pinterest-blog-pins.js                 # все опубликованные статьи
 *   node scripts/pinterest-blog-pins.js --plan-only     # только план
 *   node scripts/pinterest-blog-pins.js --only slug,slug
 *   node scripts/pinterest-blog-pins.js --check-live    # дополнительно проверить, что статья отвечает 200 на проде
 *
 * Только статьи с date <= сегодня: посты с будущей датой по правилам репозитория не публикуются и не
 * анонсируются (см. CLAUDE.md, «Процедура запушить»). Визуал: логотипы, на которые ссылается статья
 * (оригиналы из каталога); если их нет — теги статьи. Дизайн — та же система, что у пинов-подборок.
 * Автономный инструмент по требованию (в build-all не входит, dist/ в .gitignore).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist', 'pinterest', 'blog');
const SITE = 'https://trace-logos.ru';
const args = process.argv.slice(2);
const PLAN_ONLY = args.includes('--plan-only');
const CHECK_LIVE = args.includes('--check-live');
const ONLY = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
const MAX_LOGOS = 6;

const today = new Date().toISOString().slice(0, 10);
const clean = (s) => String(s || '').replace(/ /g, ' ').replace(/‑/g, '-').replace(/\s+/g, ' ').trim();
const clip = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…');

function readPosts() {
  const dir = path.join(ROOT, 'blog', 'posts');
  const posts = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.md'))) {
    const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (!m) continue;
    const fm = {};
    m[1].split('\n').forEach((line) => { const k = /^(\w+):\s*(.*)$/.exec(line); if (k) fm[k[1]] = k[2]; });
    const ru = m[2].split(/^---EN---$/m)[0];
    posts.push({ file: f, ...fm, body: ru });
  }
  return posts;
}

const norm = (x) => clean(x).toLowerCase().replace(/ё/g, 'е');
/** Название логотипа (целиком или первое слово, если оно ≥4 букв) встречается в тексте. */
function mentioned(name, text) {
  const t = norm(text), n = norm(name);
  if (t.includes(n)) return true;
  const first = n.split(/[\s\-:]+/)[0];
  return first.length >= 4 && t.includes(first);
}

function buildPlan() {
  const logos = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos.json'), 'utf8')).logos;
  const byUrl = new Map(logos.map((l) => [l.url.replace(/\/+$/, ''), l]));
  const posts = readPosts().filter((p) => p.slug && p.date && p.date <= today && (!ONLY || ONLY.has(p.slug)));
  posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  return posts.map((p) => {
    const seen = new Set(), picked = [];
    for (const [, cat, slug] of p.body.matchAll(/\.\.\/\.\.\/logos\/([\w-]+)\/([\w-]+)\/(?:\)|\s)/g)) {
      const l = byUrl.get(`${SITE}/logos/${cat}/${slug}`);
      const file = l && (l.svgUrl || l.pngUrl);
      if (!l || !file || file.includes('placeholder') || seen.has(l.url)) continue;
      if (!mentioned(l.name, `${p.title} ${p.description}`)) continue; // ссылка в тексте ≠ тема статьи: берём только названное в заголовке/описании
      seen.add(l.url); picked.push({ name: l.name, file: path.join(ROOT, new URL(file).pathname) });
      if (picked.length >= MAX_LOGOS) break;
    }
    const tags = clean(p.tags).split(',').map((t) => t.trim()).filter(Boolean);
    const title = clean(p.title), desc = clean(p.description);
    const campaign = 'blog-' + p.slug;
    const hash = tags.map((t) => '#' + t.replace(/[^\p{L}\p{N}]/gu, '')).join(' ');
    return {
      slug: p.slug, date: p.date, title, tags, logos: picked,
      pinTitle: clip(title, 100),
      pinDesc: clip(`${desc} Читайте в блоге Trace Logos. ${hash} #логотипы #дизайн #брендинг`, 500),
      link: `${SITE}/blog/${p.slug}/?utm_source=pinterest&utm_medium=organic&utm_campaign=${encodeURIComponent(campaign.slice(0, 60))}`,
      lede: clip(desc, 170),
    };
  });
}

const TEMPLATE = (fontsDir, brand) => `<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>
@font-face{font-family:Inter;font-weight:100 900;src:url(file://${fontsDir}/inter-cyrillic.woff2) format('woff2');unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}
@font-face{font-family:Inter;font-weight:100 900;src:url(file://${fontsDir}/inter-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1000px;height:1500px;overflow:hidden;position:relative;font-family:Inter,sans-serif;color:#fff;-webkit-font-smoothing:antialiased;
 background:radial-gradient(ellipse 700px 520px at 85% 8%,rgba(138,107,255,.38),transparent 70%),radial-gradient(ellipse 800px 600px at 10% 98%,rgba(138,107,255,.20),transparent 70%),#0e0d12}
.eyebrow{position:absolute;left:100px;top:96px;display:flex;align-items:center;gap:14px;font-size:27px;font-weight:600;letter-spacing:.02em;color:#a58cff}
.eyebrow i{width:46px;height:3px;background:#a58cff;border-radius:2px;display:block}
#title{position:absolute;left:100px;right:100px;top:168px;font-weight:800;letter-spacing:-.035em;line-height:1.06;max-height:660px;overflow:hidden}
#lede{position:absolute;left:100px;right:100px;font-size:36px;line-height:1.38;font-weight:500;color:#b9b6c6;letter-spacing:-.01em;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:4;overflow:hidden}
#visual{position:absolute;left:100px;right:100px;bottom:150px;display:flex;gap:18px;flex-wrap:wrap}
#visual img{display:block;border-radius:24%;box-shadow:0 14px 34px -10px rgba(0,0,0,.65),0 0 0 1px rgba(255,255,255,.08);background:#fff}
#visual .tag{font-size:30px;font-weight:600;color:#d9d6e6;padding:14px 26px;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.10)}
.foot{position:absolute;left:100px;right:100px;bottom:46px;display:flex;align-items:center;justify-content:center;gap:14px;font-size:29px;font-weight:700;letter-spacing:-.02em}
.foot img{width:48px;height:48px;border-radius:12px}.foot i{font-style:normal;color:#a58cff}
</style></head><body>
<div class="eyebrow"><span id="eyebrow"></span><i></i></div>
<div id="title"></div><div id="lede"></div><div id="visual"></div>
<div class="foot"><img src="file://${brand}"><span>Больше статей на trace-logos<i>.ru/blog</i></span></div>
</body></html>`;

async function renderAll(plan) {
  const puppeteer = require('puppeteer');
  const fontsDir = path.join(ROOT, 'assets', 'fonts');
  const brand = path.join(ROOT, 'assets', 'logos', 'svgs', 'trace-logos.svg');
  fs.mkdirSync(OUT, { recursive: true });
  const tpl = path.join(OUT, '_template.html');
  fs.writeFileSync(tpl, TEMPLATE(fontsDir, brand));
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--allow-file-access-from-files'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 1500, deviceScaleFactor: 1 });
    page.on('pageerror', (e) => console.error('PAGEERR', e.message));
    await page.goto('file://' + tpl);
    let n = 0;
    for (const p of plan) {
      await page.evaluate(async (d) => {
        const $ = (id) => document.getElementById(id);
        $('eyebrow').textContent = (d.tags[0] || 'Блог').toUpperCase() + ' · БЛОГ';
        const t = $('title'); t.textContent = d.title;
        let size = 96; // самый крупный кегль, при котором заголовок помещается в 660px
        for (; size > 52; size -= 2) { t.style.fontSize = size + 'px'; if (t.scrollHeight <= 660) break; }
        t.style.fontSize = size + 'px'; t.style.letterSpacing = (-0.035 * size).toFixed(2) + 'px';
        const lede = $('lede'); lede.textContent = d.lede;
        const v = $('visual'); v.textContent = '';
        if (d.logos.length) {
          const tile = Math.min(150, Math.floor((800 - 18 * (d.logos.length - 1)) / d.logos.length));
          for (const l of d.logos) { const img = new Image(); img.src = 'file://' + l.file; img.width = img.height = tile; img.style.objectFit = 'contain'; v.append(img); }
          await Promise.all([...v.children].map((i) => i.decode().catch(() => {})));
        } else {
          d.tags.slice(0, 3).forEach((tag) => { const s = document.createElement('span'); s.className = 'tag'; s.textContent = tag; v.append(s); });
        }
        await document.fonts.ready;
        // описание — сразу под заголовком, но не ниже блока визуала
        lede.style.top = (t.offsetTop + Math.min(t.scrollHeight, 660) + 36) + 'px';
      }, p);
      await page.screenshot({ path: path.join(OUT, `${String(++n).padStart(3, '0')}-${p.slug}.png`) });
      if (n % 20 === 0) console.log(`  ${n}/${plan.length}`);
    }
  } finally { await browser.close(); fs.rmSync(tpl, { force: true }); }
}

function writeTexts(plan) {
  const out = [`# Pinterest-пины под статьи блога: ${plan.length} шт.\n`, 'Файл = `NNN-<slug>.png`; новые статьи сверху. Только опубликованные (date ≤ ' + today + ').\n'];
  plan.forEach((p, i) => {
    const n = String(i + 1).padStart(3, '0');
    out.push(`## ${n}. ${p.title}\n\nФайл: \`${n}-${p.slug}.png\`\n\n**Название:** ${p.pinTitle}\n\n**Описание:** ${p.pinDesc}\n\n**Ссылка:** ${p.link}\n`);
  });
  fs.writeFileSync(path.join(OUT, 'texts.md'), out.join('\n'));
}

(async () => {
  let plan = buildPlan();
  if (CHECK_LIVE) {
    const ok = [];
    for (const p of plan) {
      const r = await fetch(`${SITE}/blog/${p.slug}/`, { method: 'HEAD' }).catch(() => null);
      if (r && r.status === 200) ok.push(p); else console.warn(`  ⚠ не отвечает 200 на проде, пропуск: ${p.slug} (${r ? r.status : 'нет ответа'})`);
    }
    plan = ok;
  }
  console.log(`статей: ${plan.length} (с логотипами: ${plan.filter((p) => p.logos.length).length}, с тегами: ${plan.filter((p) => !p.logos.length).length})`);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'plan.json'), JSON.stringify(plan, null, 2));
  if (PLAN_ONLY) return;
  await renderAll(plan);
  writeTexts(plan);
  console.log(`готово: ${OUT}`);
})().catch((e) => { console.error(e); process.exit(1); });
