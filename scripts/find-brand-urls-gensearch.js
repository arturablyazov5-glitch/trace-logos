#!/usr/bin/env node
/**
 * Ищет официальную страницу брендбука/гайдлайна/логотипов для каждого логотипа
 * через Yandex GenSearch API (второй аккаунт AI Studio, YANDEX_AI_API_KEY_2).
 * Ничего не пишет в logos/categories/*.json — только собирает отчёт
 * brand-url-gensearch-report.json для ручной проверки перед применением.
 *
 * node scripts/find-brand-urls-gensearch.js [--limit N] [--start N] [--only "Имя"]
 */
const fs = require('fs');
const path = require('path');
const { loadEnv } = require('./lib/load-env');

loadEnv();

const ROOT = path.resolve(__dirname, '..');
const CATS_DIR = path.join(ROOT, 'logos/categories');
const OUT_FILE = path.join(ROOT, 'brand-url-gensearch-report.json');

const API_KEY = process.env.YANDEX_AI_API_KEY_2;
const FOLDER_ID = process.env.YANDEX_FOLDER_ID_2;

if (!API_KEY || !FOLDER_ID) {
  console.error('В .env нет YANDEX_AI_API_KEY_2 / YANDEX_FOLDER_ID_2');
  process.exit(1);
}

const argv = process.argv.slice(2);
const argVal = (flag, def) => {
  const i = argv.indexOf(flag);
  return i === -1 ? def : argv[i + 1];
};
const LIMIT = parseInt(argVal('--limit', 'Infinity'), 10) || Infinity;
const START = parseInt(argVal('--start', '0'), 10) || 0;
const ONLY_NAME = argVal('--only', null);

function loadItems() {
  const files = fs.readdirSync(CATS_DIR).filter((f) => f.endsWith('.json'));
  const items = [];
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(CATS_DIR, f), 'utf8'));
    const arr = Array.isArray(data) ? data : data.items || [];
    for (const it of arr) {
      if (it.comingSoon) continue;
      items.push({ category: f, name: it.name, figma: it.figma, brandUrl: it.brandUrl || null });
    }
  }
  return items;
}

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

// Ссылка уже похожа на выделенную страницу брендбука/press-кита (не голый
// корень домена) — не гонять через GenSearch: модель путает соседние домены
// на известных брендах (проверено на Сбере — предложила sber-bank.by вместо
// верного brand.sber.ru), а корневой домен и так надёжнее пере-искать.
const BRAND_PATH_HINT = /brand|press|logo|trademark|newsroom|media-?kit|guidelines|resources|assets/i;
function looksLikeBrandPage(url) {
  if (!url) return false;
  let u;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  const bareRoot = u.pathname === '/' || u.pathname === '';
  if (!bareRoot) return true;
  return BRAND_PATH_HINT.test(u.host);
}

async function genSearch(query, host) {
  const body = {
    messages: [{ content: query, role: 'ROLE_USER' }],
    folderId: FOLDER_ID,
    fixMisspell: true,
  };
  if (host) body.host = { host: [host] };

  const res = await fetch('https://searchapi.api.cloud.yandex.net/v2/gen/search', {
    method: 'POST',
    headers: {
      Authorization: `Api-Key ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
  }

  const text = await res.text();

  // Ответ приходит либо как JSON-массив чанков `[{...}, {...}]`,
  // либо (реже) построчным NDJSON — обрабатываем оба варианта.
  let chunks;
  try {
    const parsed = JSON.parse(text);
    chunks = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    chunks = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }

  let lastMessage = '';
  let sources = [];
  for (const obj of chunks) {
    const result = obj.result || obj;
    if (result.message && result.message.content) lastMessage = result.message.content;
    if (result.sources && result.sources.length) sources = result.sources;
  }
  return { message: lastMessage, sources };
}

async function main() {
  const items = loadItems();
  let slice = ONLY_NAME ? items.filter((it) => it.name === ONLY_NAME) : items.slice(START, START + LIMIT);

  console.log(`Всего логотипов: ${items.length}, обрабатываем ${slice.length}${ONLY_NAME ? ` (только «${ONLY_NAME}»)` : ` (с #${START})`}`);

  let report = [];
  if (fs.existsSync(OUT_FILE)) {
    report = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  }
  const done = new Set(report.map((r) => r.category + '::' + r.name));

  for (let i = 0; i < slice.length; i++) {
    const item = slice[i];
    const key = item.category + '::' + item.name;
    if (done.has(key)) {
      continue;
    }

    if (looksLikeBrandPage(item.brandUrl)) {
      report.push({
        category: item.category,
        name: item.name,
        figma: item.figma,
        currentBrandUrl: item.brandUrl,
        skipped: true,
        reason: 'уже похоже на страницу брендбука/press-кита, не голый домен',
      });
      console.log(`[${i + 1}/${slice.length}] ${item.name} → пропущено (уже брендбук/press-кит)`);
      fs.writeFileSync(OUT_FILE, JSON.stringify(report, null, 2));
      continue;
    }

    const host = hostOf(item.brandUrl);
    const query = `Найди официальную страницу брендбука, гайдлайна по бренду, press kit или страницу с логотипами компании «${item.name}»${host ? ` (сайт ${host})` : ''}. Нужна именно страница brand guidelines / brand assets / press kit / логотипов для скачивания, а не главная страница сайта. Если такой страницы точно нет — дай ссылку на официальный сайт компании.`;

    try {
      const result = await genSearch(query, host);
      report.push({
        category: item.category,
        name: item.name,
        figma: item.figma,
        currentBrandUrl: item.brandUrl,
        answer: result.message,
        sources: result.sources,
      });
      console.log(`[${i + 1}/${slice.length}] ${item.name} → ${result.sources.length} источников`);
    } catch (e) {
      report.push({
        category: item.category,
        name: item.name,
        figma: item.figma,
        currentBrandUrl: item.brandUrl,
        error: e.message,
      });
      console.error(`[${i + 1}/${slice.length}] ${item.name} ОШИБКА: ${e.message}`);
    }

    fs.writeFileSync(OUT_FILE, JSON.stringify(report, null, 2));
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`Готово. Отчёт: ${path.relative(ROOT, OUT_FILE)}`);
}

main();
