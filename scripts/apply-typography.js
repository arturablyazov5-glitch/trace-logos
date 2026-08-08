#!/usr/bin/env node
/**
 * Авто-фикс русской типографики по текстовым источникам сайта — НБСП, тире,
 * кавычки-ёлочки, многоточие, форматирование телефонов/сумм — тем же
 * движком, что и Figma-плагин «Trace Typograf» (см. scripts/lib/typograf.js,
 * дубликат `figna-plagins/Trace Typograf/code.js`, синхронизируется вручную).
 *
 * Правит ИСХОДНИКИ (JSON/Markdown), не сгенерённые страницы — как и всё
 * остальное в build-all.js, генерённый HTML — производная, а не место фикса
 * (см. CLAUDE.md «Debugging & Fix Philosophy»).
 *
 * Обрабатываемые источники — ТОЛЬКО русский текст, никогда `_en`-поля или
 * английскую половину поста: «ёлочки»/неразрывный дефис/НБСП для предлогов —
 * правила русской типографики, английской прозе они не подходят (см. историю
 * бага в processBlogPost/FRONTMATTER_TEXT_KEYS).
 *   - blog/posts/*.md          — фронтматтер (title/description, БЕЗ _en) и
 *     русская половина тела статьи, до "---EN---" (с защитой блоков кода,
 *     инлайн-кода, HTML-тегов, `:::widget`, URL, маркеров списков,
 *     разделителей таблиц, "цифра:цифра")
 *   - logos/categories/*.json  — item.about, item.desc, variants[].label
 *   - logos/labels.json        — {key}.label
 *   - logos/category-seo.json  — per-category intro, title/h1
 *   - collections.json         — title/h1/lead, intro[] (по элементу)
 *   - js/i18n-dict-ru.js       — построчно, только простые '...'-литералы
 *     (см. processI18nDict) — русский словарь; js/i18n-dict-en.js не трогаем
 *
 * НЕ трогает: name/tags/figma/file/ecosystem/alt_name (идентификаторы и
 * данные для поиска — НБСП в tags сломал бы токенизацию поиска, дефис в
 * name может использоваться для точных сравнений в других данных).
 *
 * Usage:
 *   node scripts/apply-typography.js            # правит файлы на диске
 *   node scripts/apply-typography.js --dry-run  # только считает, что изменилось
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  typografizeProtected,
  stripSingleSentenceTrailingPeriod,
} = require('./lib/typograf');

const ROOT = path.resolve(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');

let filesChanged = 0;
let fieldsChanged = 0;

function writeFileIfChanged(rel, originalText, newText) {
  if (originalText === newText) return false;
  filesChanged++;
  if (!DRY_RUN) fs.writeFileSync(path.join(ROOT, rel), newText, 'utf8');
  return true;
}

// Голый URL в тексте — защищается ВЕЗДЕ (не только в блоге): fixEmoticons
// матчит "://" как эмотикон ":/" (лукбехайнд требует непробельный символ
// перед двоеточием — в "https://" это "s" — а лукахед не букву/цифру — а это
// вторая "/"), вставляя туда пробел ("https://brand.com" → "https ://brand.com").
// Инцидент: без этой защиты правка сломала пример ссылки в js/i18n-dict-ru.js
// (suggestErrorBadUrl) и попала бы в любое about/desc с голым URL в тексте.
const URL_RE = /\bhttps?:\/\/[^\s"'<>)\]]+/g;

// "цифра:цифра" — тайминги (18:30), соотношения сторон (4:3), версии — тот
// же EMOTICON_RE ловит хвост ":3"/":)" как эмотикон-лицо (класс символов
// включает цифру "3" и скобки), вставляя пробел прямо в число: "4:3)" →
// "4 :3)". Защищаем на всякий случай — сейчас таких пар в данных нет, но
// новый пост про соотношение сторон появится рано или поздно.
const RATIO_TIME_RE = /\d{1,4}:\d{1,4}/g;

// Однострочная проза (заголовки, описания, короткие лейблы) — полный набор
// правил + снятие финальной точки у самостоятельного одного предложения.
function typoLine(str) {
  if (typeof str !== 'string' || !str) return str;
  const out = stripSingleSentenceTrailingPeriod(typografizeProtected(str, {}, [URL_RE, RATIO_TIME_RE]));
  if (out !== str) fieldsChanged++;
  return out;
}

// Многострочная/HTML-проза (about/desc/intro) — та же типографика, но с
// защитой HTML-тегов: about/desc хранят инлайн-разметку вида
// `<a href="...">текст</a>`, и fixQuotes без защиты перепутал бы кавычки
// внутри href с кавычками из текста, поломав атрибут.
const HTML_TAG_RE = /<[^>]+>/g;

function typoHtmlProse(str) {
  if (typeof str !== 'string' || !str) return str;
  // HTML_TAG_RE ПЕРВЫМ: URL внутри about/desc почти всегда сидит в href
  // тега (<a href="https://...">). Если бы URL_RE замаскировал его раньше
  // тега, HTML_TAG_RE потом замаскировал бы уже замаскированный URL ВНУТРИ
  // себя — вложенный плейсхолдер, который однопроходный restore не
  // разворачивает (см. typografizeProtected). Реальный инцидент 2026-07-31:
  // ссылка secrets.tbank.ru в about "T-Бизнес Секреты" улетела на страницу
  // как href="0" — нераспакованный токен вместо URL.
  const out = typografizeProtected(str, {}, [HTML_TAG_RE, URL_RE, RATIO_TIME_RE]);
  if (out !== str) fieldsChanged++;
  return out;
}

// ── logos/categories/*.json ──────────────────────────────────────────────

function processCategories() {
  const dir = path.join(ROOT, 'logos/categories');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const rel = `logos/categories/${file}`;
    const raw = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data.items)) continue;
    for (const item of data.items) {
      if (typeof item.about === 'string') item.about = typoHtmlProse(item.about);
      if (typeof item.desc === 'string') item.desc = typoLine(item.desc);
      if (Array.isArray(item.variants)) {
        for (const v of item.variants) {
          if (typeof v.label === 'string') v.label = typoLine(v.label);
        }
      }
    }
    const out = JSON.stringify(data, null, 2) + '\n';
    writeFileIfChanged(rel, raw, out);
  }
}

// ── logos/labels.json ────────────────────────────────────────────────────

function processLabels() {
  const rel = 'logos/labels.json';
  const raw = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const data = JSON.parse(raw);
  for (const key of Object.keys(data)) {
    if (typeof data[key].label === 'string') data[key].label = typoLine(data[key].label);
  }
  const out = JSON.stringify(data, null, 2) + '\n';
  writeFileIfChanged(rel, raw, out);
}

// ── logos/category-seo.json ──────────────────────────────────────────────

function processCategorySeo() {
  const rel = 'logos/category-seo.json';
  const raw = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const data = JSON.parse(raw);
  for (const key of Object.keys(data)) {
    if (key === '_comment') continue;
    const entry = data[key];
    if (typeof entry.title === 'string') entry.title = typoLine(entry.title);
    if (typeof entry.h1 === 'string') entry.h1 = typoLine(entry.h1);
    if (typeof entry.intro === 'string') entry.intro = typoHtmlProse(entry.intro);
  }
  const out = JSON.stringify(data, null, 2) + '\n';
  writeFileIfChanged(rel, raw, out);
}

// ── collections.json ─────────────────────────────────────────────────────

function processCollections() {
  const rel = 'collections.json';
  const raw = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const data = JSON.parse(raw);
  for (const c of data.collections || []) {
    if (typeof c.title === 'string') c.title = typoLine(c.title);
    if (typeof c.h1 === 'string') c.h1 = typoLine(c.h1);
    if (typeof c.lead === 'string') c.lead = typoLine(c.lead);
    if (Array.isArray(c.intro)) {
      c.intro = c.intro.map((p) => (typeof p === 'string' ? typoHtmlProse(p) : p));
    }
  }
  const out = JSON.stringify(data, null, 2) + '\n';
  writeFileIfChanged(rel, raw, out);
}

// ── blog/posts/*.md ───────────────────────────────────────────────────────

// Защищённые зоны тела поста, в порядке от крупных/структурных к мелким —
// см. комментарий у typografizeProtected в scripts/lib/typograf.js.
const BLOG_PROTECT = [
  /```[\s\S]*?```/g,                          // fenced code blocks
  /^:::widget[ \t]+[\w-]+[ \t]*\n[\s\S]*?\n:::[ \t]*$/gm, // :::widget NAME … ::: — тело это ДАННЫЕ (пути в каталоге), не проза
  /`[^`\n]*`/g,                                // inline code
  /<[^>]+>/g,                                  // HTML-теги
  /\]\([^)]*\)/g,                              // URL-часть markdown-ссылки "](url)"
  URL_RE,                                      // голый URL вне markdown-ссылки/кода — см. комментарий у URL_RE выше
  RATIO_TIME_RE,                               // "4:3", "18:30" — см. комментарий у RATIO_TIME_RE выше
  /\{\{[^}]*\}\}/g,                            // {{stat:...}}, {{READ_TIME}}
  /^[ \t]*#{1,6}[ \t]+/gm,                     // маркер markdown-заголовка ("### ") — иначе fixNumbers() в typograf.js съедает пробел перед заголовком, начинающимся с цифры ("### 1." → "###1.")
  /^[ \t]*(?:[-*+]|\d+[.)])[ \t]+/gm,           // маркер списка в начале строки
  /^[ \t]*\|?[ \t:|-]*-[ \t:|-]*\|[ \t:|-]*$/gm, // строка-разделитель markdown-таблицы
];

// Только РУССКИЕ поля — title_en/description_en это английский текст:
// «ёлочки»/неразрывный дефис/НБСП-правила для русских предлогов ему не
// подходят (см. инцидент: первый прогон случайно испортил EN-половину
// двуязычных постов, конвертировав en dash в диапазонах и прямые кавычки
// в «ёлочки» прямо в английской прозе).
const FRONTMATTER_TEXT_KEYS = ['title', 'description'];

function processBlogPost(rel) {
  const raw = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const m = raw.match(/^(---\n)([\s\S]*?)(\n---\n?)([\s\S]*)$/);
  if (!m) return; // без фронтматтера — не наш формат, пропускаем нетронутым

  const [, open, fmBody, close, rest] = m;
  const fmLines = fmBody.split('\n').map((line) => {
    const i = line.indexOf(':');
    if (i === -1) return line;
    const key = line.slice(0, i).trim();
    if (!FRONTMATTER_TEXT_KEYS.includes(key)) return line;
    const value = line.slice(i + 1).trim();
    const newValue = typoLine(value);
    if (newValue === value) return line;
    return `${line.slice(0, i)}: ${newValue}`;
  });
  const newFmBody = fmLines.join('\n');

  // Тело поста может содержать RU и EN версии, разделённые "\n---EN---\n"
  // (см. parseFrontmatter в build-blog.js). Русская типографика применяется
  // ТОЛЬКО к русской половине — английская остаётся байт-в-байт нетронутой.
  const EN_SPLIT = '\n---EN---\n';
  const splitIdx = rest.indexOf(EN_SPLIT);
  const ruPart = splitIdx === -1 ? rest : rest.slice(0, splitIdx);
  const enPart = splitIdx === -1 ? '' : rest.slice(splitIdx);
  const newRest = typografizeProtected(ruPart, {}, BLOG_PROTECT) + enPart;

  const out = open + newFmBody + close + newRest;
  writeFileIfChanged(rel, raw, out);
}

function processBlog() {
  const dir = path.join(ROOT, 'blog/posts');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  for (const file of files) processBlogPost(`blog/posts/${file}`);
}

// ── js/i18n-dict-ru.js ────────────────────────────────────────────────────

// Только простые однострочные литералы 'значение' на своей строке — та же
// осторожность, что и everywhere else в файле: словарь грузится в рантайме
// на КАЖДОЙ странице сайта, поломанный синтаксис здесь роняет весь JS.
// Строки со стрелочными функциями (`n => \`...\``), шаблонными литералами
// или что-то ещё нестандартное — пропускаются нетронутыми, не пытаемся их
// парсить. После правки файл валидируется node --check; если результат не
// компилируется, изменения для ЭТОГО файла откатываются целиком.
const I18N_LINE_RE = /^(\s*(?:'[^']*'|[A-Za-z0-9_$]+)\s*:\s*)'((?:[^'\\]|\\.)*)'(\s*,?\s*)$/;

function processI18nDict() {
  const rel = 'js/i18n-dict-ru.js';
  const abs = path.join(ROOT, rel);
  const raw = fs.readFileSync(abs, 'utf8');
  const lines = raw.split('\n').map((line) => {
    const m = line.match(I18N_LINE_RE);
    if (!m) return line;
    const [, prefix, value, suffix] = m;
    const newValue = typografizeProtected(value, {}, [URL_RE, RATIO_TIME_RE]);
    if (newValue === value) return line;
    fieldsChanged++;
    return `${prefix}'${newValue}'${suffix}`;
  });
  const out = lines.join('\n');
  if (out === raw) return;

  if (!DRY_RUN) {
    const tmp = abs + '.typograf-tmp.mjs';
    fs.writeFileSync(tmp, out, 'utf8');
    try {
      execFileSync('node', ['--check', tmp], { stdio: 'pipe' });
    } catch (e) {
      fs.unlinkSync(tmp);
      console.error(`  ⚠ js/i18n-dict-ru.js: правка не прошла node --check, откатываю — ${e.message.split('\n')[0]}`);
      return;
    }
    fs.unlinkSync(tmp);
    fs.writeFileSync(abs, out, 'utf8');
  }
  filesChanged++;
}

function main() {
  processCategories();
  processLabels();
  processCategorySeo();
  processCollections();
  processBlog();
  processI18nDict();

  console.log(`Типографика${DRY_RUN ? ' (dry-run)' : ''}: файлов изменено ${filesChanged}, полей поправлено ${fieldsChanged}`);
}

main();
