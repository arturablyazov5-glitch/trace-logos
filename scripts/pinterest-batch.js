#!/usr/bin/env node
/**
 * Пакетная генерация Pinterest-пинов 1000×1500 (тот же рендер, что во вкладке «Pinterest» админки).
 *
 *   node scripts/pinterest-batch.js                      # логотипы: все категории и экосистемы → dist/pinterest/batch/
 *   node scripts/pinterest-batch.js --kinds emoji        # эмодзи Apple (admin/pin-emoji-themes.json) → dist/pinterest/emoji/
 *   node scripts/pinterest-batch.js --plan-only          # только план и счётчики, без рендера
 *
 * Покрытие полное: каждая категория и каждая экосистема каталога попадает хотя бы в один пин, все логотипы
 * (SVG раньше PNG, внутри — по скачиваниям) по 12 в пине; последний пин группы добивается лучшими
 * логотипами группы — пересечения между пинами допустимы. У малой категории/экосистемы (меньше 12 логотипов)
 * свой пин из всех её логотипов — генератор раскладывает их крупнее. Если в пине есть PNG, заголовок честно говорит «SVG и PNG».
 * Набор самодостаточный: включает и темы, для которых первая партия (26 пинов) уже делала пин вручную.
 * Рендер — страница /admin/ через PinGen.renderPlan(): один движок отрисовки на всё.
 * Автономный инструмент по требованию (в build-all не входит, dist/ в .gitignore).
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://trace-logos.ru';
const PORT = process.env.PIN_PORT || 3011;
const args = process.argv.slice(2);
const PLAN_ONLY = args.includes('--plan-only');
const KINDS = args.includes('--kinds') ? args[args.indexOf('--kinds') + 1].split(',') : ['cat', 'eco'];
const OUT = path.join(ROOT, 'dist', 'pinterest', KINDS.length === 1 && KINDS[0] === 'emoji' ? 'emoji' : 'batch');

const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const slugOf = (url) => String(url).replace(/^.*\/logos\//, '').replace(/\/+$/, '');
const clip = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…');
const ecosOf = (l) => [].concat(l.ecosystem || []);

// Подпись «экосистемы <имя>» по умолчанию; исключения, где так звучит неестественно.
const ECO_LINE2 = { artlebedev: 'студии Артемия Лебедева', 'yandex-ai': 'ИИ-помощников Яндекса' };
// У категории нет gen в category-seo.json
const CAT_GEN = { 'gas-stations': 'заправок' };

/** Группы по 12; последняя (если в ней хотя бы 6 логотипов) добивается лучшими логотипами группы — пересечения допустимы.
 *  Меньше 12 в группе — один пин из всех её логотипов (генератор раскладывает их крупнее, по центру). */
function packChunks(list) {
  if (list.length < 12) return list.length ? [list] : [];
  const out = [];
  for (let i = 0; i < list.length; i += 12) {
    const c = list.slice(i, i + 12);
    if (i && c.length < 6) break; // хвост из 1–5 логотипов + добор был бы почти копией первого пина
    for (const x of list) { if (c.length >= 12) break; if (!c.includes(x)) c.push(x); }
    out.push(c);
  }
  return out;
}

function buildPlan() {
  const all = readJson('logos.json').logos.filter((l) => (l.svgUrl || l.pngUrl) && !(l.svgUrl || l.pngUrl).includes('placeholder'));
  const dl = new Map(Object.entries(readJson('logos/download-stats.json').downloads)
    .map(([k, v]) => [k.split('/').slice(1).join('/').toLowerCase(), v]));
  const downloads = (l) => dl.get(slugOf(l.url)) || 0;
  // SVG раньше PNG, внутри — по скачиваниям, потом по имени
  const rank = (a, b) => (!!b.svgUrl - !!a.svgUrl) || downloads(b) - downloads(a) || a.name.localeCompare(b.name, 'ru');
  const uniq = (list) => { const seen = new Set(); return list.filter((l) => (seen.has(l.url) ? false : seen.add(l.url))); };
  const seo = readJson('logos/category-seo.json');
  const ecosystems = readJson('logos/ecosystems.json');
  const picked = [];

  const addGroup = (kind, id, pool, { gen, line2, link, skipFirst, tag }) => {
    packChunks(uniq(pool).sort(rank)).forEach((items, i) => {
      if (i === 0 && skipFirst) return;
      const part = i ? ` · ч. ${i + 1}` : '';
      picked.push({ kind, id: `${kind}-${id}-${i + 1}`, line1: i ? 'Ещё логотипы' : 'Логотипы', line2: line2 + part,
        h1: `${i ? 'Ещё логотипы' : 'Логотипы'} ${line2}${i ? ', часть ' + (i + 1) : ''}`, subj: 'логотипов ' + gen, link, tag, items });
    });
  };

  if (KINDS.includes('cat')) {
    const cats = new Map();
    all.forEach((l) => { if (!cats.has(l.categorySlug)) cats.set(l.categorySlug, { name: l.categoryName, list: [] }); cats.get(l.categorySlug).list.push(l); });
    for (const [slug, c] of cats) {
      const gen = CAT_GEN[slug] || (seo[slug] || {}).gen || c.name.toLowerCase();
      addGroup('cat', slug, c.list, { gen, line2: gen, link: `${SITE}/logos/${slug}/`, skipFirst: false, tag: '#каталог' });
    }
  }
  if (KINDS.includes('eco')) {
    for (const [key, e] of Object.entries(ecosystems)) {
      const pool = all.filter((l) => ecosOf(l).includes(key));
      const line2 = ECO_LINE2[key] || 'экосистемы ' + e.ru;
      addGroup('eco', key, pool, { gen: line2, line2, link: `${SITE}/logos/ecosystem/${key}/`,
        skipFirst: false, tag: '#' + e.ru.replace(/[^\p{L}\p{N}]/gu, '') });
    }
  }

  // эмодзи Apple: 20 на тему, состав — admin/pin-emoji-themes.json (общий с генератором в админке)
  if (KINDS.includes('emoji')) {
    const emoji = readJson('emoji.json').emoji.filter((e) => e.pngUrl);
    const byName = new Map(emoji.map((e) => [e.name_en, e]));
    for (const t of readJson('admin/pin-emoji-themes.json').themes) {
      const items = t.names.map((n) => byName.get(n)).filter(Boolean);
      const chars = (n) => items.slice(0, n).map((e) => String(e.tags).split(' ')[0]).join(' ');
      picked.push({ kind: 'emoji', id: `emoji-${t.id}`, mode: 'emoji', line1: 'Эмодзи Apple', line2: t.title,
        title: `Эмодзи Apple — ${t.title}: ${chars(6)} — PNG`,
        desc: `Коллекция эмодзи Apple: ${t.title} ${chars(8)}. Скачивайте бесплатно в PNG, копируйте и вставляйте в дизайн, соцсети и мессенджеры. Эмодзи Apple, Google и Microsoft — на trace-logos.ru. #эмодзи #emoji #смайлики #apple #дизайн #соцсети`,
        link: `${SITE}/emoji/${items[0].url.split('/')[4]}/`, items });
    }
  }

  const used = new Set();
  const plan = picked.map((p) => {
    const campaign = p.id.toLowerCase();
    if (used.has(campaign)) throw new Error('дубль utm_campaign: ' + campaign);
    used.add(campaign);
    const link = `${p.link}?utm_source=pinterest&utm_medium=organic&utm_campaign=${campaign}`;
    const items = p.items.map((l) => ({ url: l.url, label: l.name }));
    if (p.mode === 'emoji') return { id: p.id, mode: 'emoji', campaign, line1: p.line1, line2: p.line2, title: p.title, desc: p.desc, link, items };
    const hasPng = p.items.some((l) => !l.svgUrl);
    const fmt = hasPng ? 'SVG и PNG' : 'SVG';
    const names = p.items.map((l) => l.name);
    let title = '', n = 4;
    for (; n > 0; n--) { title = `${p.h1}: ${names.slice(0, n).join(', ')} — ${fmt}`; if (title.length <= 100) break; }
    if (n === 0) title = clip(`${p.h1} — ${fmt}`, 100);
    const desc = `Коллекция ${p.subj} в ${hasPng ? 'SVG и PNG' : 'векторном SVG'}: ${names.slice(0, 6).join(', ')} и другие. Скачивайте бесплатно, меняйте цвета и экспортируйте в Figma. Для интерфейсов, презентаций и макетов. #логотипы ${p.tag} #дизайн #${hasPng ? 'SVG #PNG' : 'SVG'} #брендинг #UIдизайн`;
    return { id: p.id, campaign, line1: `${p.line1} в ${fmt}`, line2: p.line2, title, desc, link, items, hasPng };
  });
  const covered = new Set(plan.flatMap((p) => p.items.map((i) => i.url)));
  return { plan, covered: covered.size, totalLogos: all.length };
}

// ── Рендер через админку ────────────────────────────────────────────────
function startServer() {
  return new Promise((resolve, reject) => {
    const p = spawn('node', ['server.js'], { cwd: ROOT, env: { ...process.env, PORT } });
    p.stdout.on('data', () => resolve(p));
    p.on('error', reject);
    setTimeout(() => resolve(p), 1500);
  });
}

async function renderAll(plan) {
  const puppeteer = require('puppeteer');
  const server = await startServer();
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    page.on('pageerror', (e) => console.error('PAGEERR', e.message));
    await page.goto(`http://localhost:${PORT}/admin/`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => { localStorage.removeItem('tl_pin_draft'); document.getElementById('gate').style.display = 'none'; document.getElementById('app').classList.add('ready'); document.querySelector('[data-tab=pinterest]').click(); });
    await page.waitForFunction(() => document.getElementById('pg-collection').options.length > 1);
    fs.mkdirSync(OUT, { recursive: true });
    let i = 0;
    for (const p of plan) {
      const r = await page.evaluate((x) => PinGen.renderPlan(x), p);
      if (r.missing.length) console.warn(`  ⚠ ${p.id}: не найдено в каталоге — ${r.missing.join(', ')}`);
      fs.writeFileSync(path.join(OUT, `${String(++i).padStart(3, '0')}-${p.campaign}.png`), Buffer.from(r.png.split(',')[1], 'base64'));
      if (i % 20 === 0) console.log(`  ${i}/${plan.length}`);
    }
  } finally { await browser.close(); server.kill(); }
}

function writeTexts(plan) {
  const out = [`# Pinterest-пины: ${plan.length} шт.\n`, 'Файл = `NNN-<utm_campaign>.png` в этой же папке; номер совпадает с разделом.\n'];
  plan.forEach((p, i) => {
    const n = String(i + 1).padStart(3, '0');
    out.push(`## ${n}. ${p.line1} ${p.line2}\n\nФайл: \`${n}-${p.campaign}.png\`\n\n**Название:** ${p.title}\n\n**Описание:** ${p.desc}\n\n**Ссылка:** ${p.link}\n`);
  });
  fs.writeFileSync(path.join(OUT, 'texts.md'), out.join('\n'));
}

(async () => {
  const { plan, covered, totalLogos } = buildPlan();
  const bykind = {}; plan.forEach((p) => { const k = p.id.split('-')[0]; bykind[k] = (bykind[k] || 0) + 1; });
  console.log(`в плане: ${plan.length} пинов ${JSON.stringify(bykind)}; PNG в составе у ${plan.filter((p) => p.hasPng).length}`);
  if (!KINDS.includes('emoji')) console.log(`покрыто логотипов: ${covered} из ${totalLogos}`);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'plan.json'), JSON.stringify(plan, null, 2));
  if (PLAN_ONLY) return;
  await renderAll(plan);
  writeTexts(plan);
  console.log(`готово: ${OUT}`);
})().catch((e) => { console.error(e); process.exit(1); });
