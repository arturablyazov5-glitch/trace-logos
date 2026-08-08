#!/usr/bin/env node
/**
 * Факт-чек статей блога через Yandex GenSearch API (второй аккаунт AI Studio,
 * YANDEX_AI_API_KEY_2/YANDEX_FOLDER_ID_2) — модель ищет в интернете и отвечает
 * со ссылками на источники, проверяя устарела ли информация к 2026 году.
 * Ничего не пишет в blog/posts/*.md — только собирает отчёт для ручной проверки.
 *
 * node scripts/factcheck-blog-gensearch.js [--limit N] [--only "slug"] [--slugs a,b,c]
 */
const fs = require('fs');
const path = require('path');
const { loadEnv } = require('./lib/load-env');

loadEnv();

const ROOT = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'blog/posts');
const OUT_FILE = path.join(ROOT, 'ai-studio-checks/blog-factcheck.csv');

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
const ONLY = argVal('--only', null);
const SLUGS = argVal('--slugs', null);

const GEN_SEARCH_URL = 'https://searchapi.api.cloud.yandex.net/v2/gen/search';
const PRICE_PER_REQUEST_RUB = 5.08; // тариф Generative Search, синхронные запросы

function parsePost(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) return null;
  const fm = {};
  for (const line of fmMatch[1].split('\n')) {
    const m = line.match(/^([a-z_]+):\s*(.*)$/i);
    if (m) fm[m[1]] = m[2].trim();
  }
  const body = fmMatch[2].split('---EN---')[0].trim();
  return { slug: fm.slug || path.basename(file, '.md'), title: fm.title || '', date: fm.date || '', body };
}

function loadPosts() {
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
  const posts = files.map((f) => parsePost(path.join(POSTS_DIR, f))).filter(Boolean);
  if (ONLY) return posts.filter((p) => p.slug === ONLY);
  if (SLUGS) {
    const wanted = new Set(SLUGS.split(',').map((s) => s.trim()));
    return posts.filter((p) => wanted.has(p.slug));
  }
  return posts;
}

const PROMPT = (title, date, body) => `Ты дотошный факт-чекер. Ниже статья про логотипы и брендинг "${title}" \
с сайта-каталога логотипов (опубликована/запланирована на ${date}). Найди в интернете актуальную информацию о \
брендах и фактах, упомянутых в статье, и:
1) Укажи, есть ли в тексте фактические неточности или устаревшие данные (конкретные даты, цифры, статусы брендов, \
кто чем владеет, ребрендинги — не придирайся к стилю).
2) Дай 1-3 свежих факта о брендах из статьи, которых в тексте нет (ребрендинги, изменения статуса после публикации \
и т.п. — только то, что подтверждается источниками).
Отвечай кратко и по делу, двумя абзацами: "Неточности:" и "Новые факты:". Если неточностей нет — напиши \
"Неточностей не найдено".

Текст статьи:
${body}`;

function splitJsonObjects(text) {
  const out = [];
  let depth = 0, start = -1, inStr = false, esc = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === '{') { if (depth === 0) start = i; depth++; }
    else if (c === '}') {
      depth--;
      if (depth === 0 && start >= 0) {
        try { out.push(JSON.parse(text.slice(start, i + 1))); } catch { /* skip malformed chunk */ }
        start = -1;
      }
    }
  }
  return out;
}

async function factCheck(post) {
  const body = {
    messages: [{ content: PROMPT(post.title, post.date, post.body), role: 'ROLE_USER' }],
    folderId: FOLDER_ID,
    getPartialResults: false,
  };

  const res = await fetch(GEN_SEARCH_URL, {
    method: 'POST',
    headers: { Authorization: `Api-Key ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  const raw = await res.text();
  const chunks = splitJsonObjects(raw);
  if (!chunks.length) throw new Error('Пустой ответ от Generative Search API');

  const last = chunks[chunks.length - 1];
  const answer = last.message?.content ?? '';
  const sources = (last.sources || []).map((s) => `${s.url}${s.title ? ` (${s.title})` : ''}`);
  const searchQueries = (last.searchQueries || []).map((q) => q.text);
  return { answer, sources, searchQueries, isAnswerRejected: !!last.isAnswerRejected };
}

function csvEscape(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  const posts = loadPosts().slice(0, LIMIT);
  console.log(`Всего постов: ${posts.length}, стоимость ~${(posts.length * PRICE_PER_REQUEST_RUB).toFixed(2)}₽`);

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });

  let existingRows = [];
  let doneSlug = new Set();
  if (fs.existsSync(OUT_FILE)) {
    const text = fs.readFileSync(OUT_FILE, 'utf8');
    existingRows = text.split('\n').filter(Boolean);
    for (const line of existingRows.slice(1)) {
      const slug = line.split(',')[0].replace(/^"|"$/g, '');
      doneSlug.add(slug);
    }
  } else {
    existingRows = ['Slug,Заголовок,Дата,Ответ,Источники,Поисковые запросы,Ошибка'];
  }

  let billed = 0;
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    if (doneSlug.has(post.slug)) continue;

    try {
      const r = await factCheck(post);
      existingRows.push([
        post.slug, post.title, post.date, r.answer,
        r.sources.join(' | '), r.searchQueries.join(' | '), '',
      ].map(csvEscape).join(','));
      billed++;
      console.log(`[${i + 1}/${posts.length}] ${post.slug} → ${r.sources.length} источников`);
    } catch (e) {
      existingRows.push([post.slug, post.title, post.date, '', '', '', e.message].map(csvEscape).join(','));
      console.error(`[${i + 1}/${posts.length}] ${post.slug} ОШИБКА: ${e.message}`);
    }

    fs.writeFileSync(OUT_FILE, existingRows.join('\n') + '\n');
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`Готово. Оплачено запросов: ${billed} (~${(billed * PRICE_PER_REQUEST_RUB).toFixed(2)}₽). Отчёт: ${path.relative(ROOT, OUT_FILE)}`);
}

main();
