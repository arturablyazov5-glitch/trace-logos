#!/usr/bin/env node
/**
 * Generates the contributors wall:
 *   credits/index.html     (RU)
 *   en/credits/index.html  (EN)
 *
 * Source of truth:
 *   credits.json                — entries (type, email, logo path, date, count)
 *   logos.json                  — built logo list (name + url for `logo` paths)
 *   templates/credits-page.html
 *
 * Each entry becomes one paper sticker pinned to a wall. The markup is baked at
 * build time (crawlers see real text and real links); js/credits-wall.js only
 * scatters the already-rendered stickers into their pinned positions.
 *
 * Everything visual that must stay stable between builds (tilt, paper shade,
 * sticker width) is derived from a hash of the entry id — NOT from Math.random —
 * so re-running the build produces byte-identical HTML and no git churn.
 *
 * Run AFTER build-api-json.js (needs a fresh logos.json).
 *
 * Usage:
 *   node scripts/build-credits.js
 *   node scripts/build-credits.js --dry-run
 */

const fs   = require('fs');
const path = require('path');
const { loadTemplate } = require('./lib/render');
const { loadDict, bakeI18n, makePathsAbsolute, hreflangBlock } = require('./lib/en-transform');

const BASE_URL = 'https://trace-logos.ru';
const ROOT     = path.resolve(__dirname, '..');
const DRY_RUN  = process.argv.includes('--dry-run');
const REL      = '../';

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Deterministic 32-bit hash — the "randomness" of the wall has to survive a
// rebuild unchanged, otherwise every `npm run build` rewrites the whole page.
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
const pick = (id, salt, arr) => arr[hash(id + '|' + salt) % arr.length];
const range = (id, salt, min, max) => min + (hash(id + '|' + salt) % (max - min + 1));

// Paper shades — desaturated office stock, all readable with dark ink.
const PAPERS = ['a', 'b', 'c', 'd', 'e', 'f'];
// Pin heads — metal + coloured plastic pushpins.
const PINS   = ['steel', 'red', 'blue', 'amber', 'green', 'brass'];

const MONTHS_RU = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatDate(iso, lang) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return '';
  const [, y, mo, d] = m;
  const day = Number(d);
  return lang === 'en'
    ? `${MONTHS_EN[Number(mo) - 1]} ${day}, ${y}`
    : `${day} ${MONTHS_RU[Number(mo) - 1]} ${y} г.`;
}

const BADGES = {
  logo:     { ru: 'Лого',          en: 'Logo'      },
  outdated: { ru: 'Ошибка',        en: 'Fix'       },
  donate:   { ru: 'Донат',         en: 'Donation'  },
  big:      { ru: 'Большой вклад', en: 'Big one'   },
  custom:   { ru: 'Спасибо',       en: 'Thanks'    },
};

// Russian plural for «логотип» — 47 логотипов / 2 логотипа / 21 логотип.
function pluralRu(n, one, few, many) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

// logos.json перечисляет и логотипы без собственной страницы (comingSoon) —
// ссылка на такой стикер была бы 404. Индексируем только те, у которых страница
// реально собрана, причём в ОБОИХ языках: стикер печётся и в /en/.
function loadLogoIndex() {
  const logos = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos.json'), 'utf8')).logos;
  const byPath = new Map();
  for (const l of logos) {
    const rel = l.url.replace(BASE_URL + '/logos/', '').replace(/\/$/, '');
    const ru = fs.existsSync(path.join(ROOT, 'logos', rel, 'index.html'));
    const en = fs.existsSync(path.join(ROOT, 'en', 'logos', rel, 'index.html'));
    if (ru && en) byPath.set(rel, l);
  }
  return byPath;
}

// The deed line. `logo` entries link the brand name straight to its page — the
// link is the point of the sticker, not decoration.
function deedHtml(entry, logo, lang) {
  const en = lang === 'en';
  if (entry.text || entry.text_en) return esc(en ? (entry.text_en || entry.text) : entry.text);

  const brand = logo
    ? `<a class="cw-note-link" href="${en ? '/en/' : REL}logos/${esc(entry.logo)}/">${esc(logo.name)}</a>`
    : esc(entry.logo || '');

  switch (entry.type) {
    case 'logo':
      return en ? `Suggested the ${brand} logo` : `Предложил логотип ${brand}`;
    case 'outdated':
      return en ? `Reported an outdated ${brand} logo` : `Сообщил об устаревшем логотипе ${brand}`;
    case 'donate':
      return en ? 'Supported the project with a donation' : 'Поддержал проект донатом';
    case 'big': {
      const n = Number(entry.count) || 0;
      return en
        ? `Added ${n} ${n === 1 ? 'logo' : 'logos'}`
        : `Добавил ${n} ${pluralRu(n, 'логотип', 'логотипа', 'логотипов')}`;
    }
    default:
      return '';
  }
}

function buildNote(entry, logoIndex, lang, index) {
  const id    = entry.id || `${entry.type}-${index}`;
  const logo  = entry.logo ? logoIndex.get(entry.logo) : null;
  if (entry.logo && !logo) {
    throw new Error(
      `credits.json: запись "${id}" ссылается на "${entry.logo}" — такой страницы нет ` +
      `(опечатка в пути, либо логотип помечен comingSoon и страницы у него не существует)`);
  }
  const badge = (BADGES[entry.type] || BADGES.custom)[lang === 'en' ? 'en' : 'ru'];
  const date  = formatDate(entry.date, lang);
  const big   = entry.type === 'big';

  // Tilt/paper/pin/width are per-entry constants, not per-render randomness.
  const tilt  = (range(id, 'tilt', -46, 46) / 10).toFixed(1);   // −4.6°…+4.6°
  const paper = pick(id, 'paper', PAPERS);
  const pin   = big ? 'brass' : pick(id, 'pin', PINS);
  const width = big ? range(id, 'w', 252, 288) : range(id, 'w', 208, 254);
  const pinX  = range(id, 'pinx', 38, 62);                      // % of sticker width

  const dateHtml = date ? `\n        <time class="cw-note-date" datetime="${esc(entry.date)}">${date}</time>` : '';

  return `      <article class="cw-note cw-note--${esc(entry.type)} cw-paper-${paper}${big ? ' is-big' : ''}"
        style="--tilt:${tilt}deg;--w:${width}px;--pin-x:${pinX}%">
        <span class="cw-pin cw-pin--${pin}" aria-hidden="true"><i class="cw-pin-head"></i><i class="cw-pin-needle"></i></span>
        <span class="cw-note-badge">${esc(badge)}</span>
        <span class="cw-note-email">${esc(entry.name || entry.email)}</span>
        <p class="cw-note-deed">${deedHtml(entry, logo, lang)}</p>${dateHtml}
        <span class="cw-note-curl" aria-hidden="true"></span>
      </article>`;
}

// z-index стикера = его позиция в DOM (js/credits-wall.js), поэтому порядок
// здесь — это порядок «кто лежит сверху». Сортируем по дате по возрастанию:
// самая свежая благодарность оказывается последней и физически ложится поверх.
// Записи без даты уходят в самый низ стопки.
function sortEntries(entries) {
  return entries
    .map((e, i) => ({ e, i }))
    .sort((a, b) => (a.e.date || '').localeCompare(b.e.date || '') || a.i - b.i)
    .map(x => x.e);
}

function buildJsonLd(entries, url, lang) {
  const en = lang === 'en';
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: "Trace Logo's", item: `${BASE_URL}/` },
          {
            '@type': 'ListItem', position: 2,
            name: en ? 'People keeping the catalog alive' : 'Люди, благодаря которым каталог жив',
            item: url,
          },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: en ? 'People keeping the catalog alive' : 'Люди, благодаря которым каталог жив',
        description: en
          ? 'Everyone who suggested a logo, reported an outdated one or supported Trace Logo’s with a donation.'
          : 'Все, кто предложил логотип, сообщил об устаревшем или поддержал Trace Logo’s донатом.',
        url,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: entries.length,
        },
      },
    ],
  }, null, 2);
}

function renderTemplate(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (full, k) => {
    if (!(k in vars)) { console.warn(`Unknown placeholder {{${k}}}`); return ''; }
    return vars[k];
  });
}

function applyEnChrome(html) {
  html = makePathsAbsolute(html, 'credits/index.html');
  html = html.replace(/<html(\s+lang="[^"]*")?(\s*)>/, (m, _l, sp) => `<html lang="en"${sp || ' '}>`);
  html = html.replace('<meta charset="UTF-8">', `<meta charset="UTF-8">\n  <script>window.__LANG__='en';</script>`);
  html = html.replace(/content="ru_RU"/, 'content="en_US"');
  return html;
}

function countLine(entries, lang) {
  const n = entries.length;
  if (lang === 'en') return `${n} ${n === 1 ? 'sticker' : 'stickers'} on the wall so far. Room for plenty more.`;
  return `Пока на стене ${n} ${pluralRu(n, 'стикер', 'стикера', 'стикеров')}. Место есть.`;
}

function main() {
  const TEMPLATE  = loadTemplate(path.join(ROOT, 'templates', 'credits-page.html'));
  const EN        = loadDict().en;
  const entries   = sortEntries(JSON.parse(fs.readFileSync(path.join(ROOT, 'credits.json'), 'utf8')).entries || []);
  const logoIndex = loadLogoIndex();

  const urlRu = `${BASE_URL}/credits/`;
  const urlEn = `${BASE_URL}/en/credits/`;

  if (DRY_RUN) {
    entries.forEach((e, i) => buildNote(e, logoIndex, 'ru', i));   // validates logo paths
    console.log(`credits/index.html     (${entries.length} stickers)`);
    console.log(`en/credits/index.html  (${entries.length} stickers)`);
    console.log('\nDry run complete.');
    return;
  }

  // ── RU ──
  const htmlRu = renderTemplate(TEMPLATE, {
    REL, HOME_REL: REL,
    TITLE: "Люди, благодаря которым каталог жив · Trace Logo's",
    META_DESC: 'Стена благодарностей Trace Logo’s: все, кто предложил новый логотип, сообщил об устаревшем или поддержал проект донатом.',
    OG_TITLE: 'Люди, благодаря которым каталог жив',
    CANONICAL_URL: urlRu,
    HREFLANG_TAGS: hreflangBlock(urlRu, urlEn),
    JSON_LD: buildJsonLd(entries, urlRu, 'ru'),
    BREADCRUMB: 'Люди, благодаря которым каталог жив',
    H1: 'Люди, благодаря которым каталог жив',
    LEAD: 'Каталог растёт не сам по себе. Кто-то присылает логотип, которого не хватало, кто-то замечает, что бренд полгода назад сменил знак, кто-то просто оплачивает хостинг. Стена — про них.',
    COUNT_LINE: countLine(entries, 'ru'),
    WALL_ARIA: 'Стена с благодарностями',
    NOTES: entries.length
      ? entries.map((e, i) => buildNote(e, logoIndex, 'ru', i)).join('\n')
      : '      <p class="cw-empty">Стена пока пустая. Первый стикер может быть вашим.</p>',
    HOW_TITLE: 'Как попасть на стену',
    BADGE_LOGO: BADGES.logo.ru,
    BADGE_OUTDATED: BADGES.outdated.ru,
    BADGE_DONATE: BADGES.donate.ru,
    BADGE_BIG: BADGES.big.ru,
    HOW_LOGO: 'Прислать логотип, которого нет в каталоге, через форму «Предложить логотип».',
    HOW_OUTDATED: 'Написать, что бренд сменил знак, а у нас лежит старый.',
    HOW_DONATE: 'Оплатить кусок хостинга через кнопку поддержки.',
    HOW_BIG: 'Прислать сразу пачку логотипов — такой стикер висит крупнее остальных.',
    HOW_NOTE: 'Стикер появляется после того, как логотип попадает в каталог. Если не хотите видеть свою почту на стене — напишите, уберём или заменим на ник.',
    CTA_TITLE: 'Не нашли нужный логотип?',
    CTA_SUB: 'Предложите его — и заберите свой стикер',
    CTA_LINK: 'Открыть каталог',
  });

  fs.mkdirSync(path.join(ROOT, 'credits'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'credits', 'index.html'), htmlRu, 'utf8');

  // ── EN ──
  let htmlEn = renderTemplate(TEMPLATE, {
    REL, HOME_REL: '/en/',
    TITLE: "People keeping the catalog alive · Trace Logo's",
    META_DESC: 'The Trace Logo’s thank-you wall: everyone who suggested a new logo, reported an outdated one or chipped in for hosting.',
    OG_TITLE: 'People keeping the catalog alive',
    CANONICAL_URL: urlEn,
    HREFLANG_TAGS: hreflangBlock(urlRu, urlEn),
    JSON_LD: buildJsonLd(entries, urlEn, 'en'),
    BREADCRUMB: 'People keeping the catalog alive',
    H1: 'People keeping the catalog alive',
    LEAD: 'The catalog does not grow on its own. Someone sends in a logo that was missing, someone notices a brand changed its mark six months ago, someone just pays for the hosting. This wall is about them.',
    COUNT_LINE: countLine(entries, 'en'),
    WALL_ARIA: 'Thank-you wall',
    NOTES: entries.length
      ? entries.map((e, i) => buildNote(e, logoIndex, 'en', i)).join('\n')
      : '      <p class="cw-empty">The wall is empty so far. The first sticker could be yours.</p>',
    HOW_TITLE: 'How to get on the wall',
    BADGE_LOGO: BADGES.logo.en,
    BADGE_OUTDATED: BADGES.outdated.en,
    BADGE_DONATE: BADGES.donate.en,
    BADGE_BIG: BADGES.big.en,
    HOW_LOGO: 'Send a logo the catalog is missing via the “Suggest a logo” form.',
    HOW_OUTDATED: 'Tell us a brand changed its mark and we are still showing the old one.',
    HOW_DONATE: 'Cover a slice of the hosting bill through the support button.',
    HOW_BIG: 'Send a whole batch of logos at once — that sticker hangs bigger than the rest.',
    HOW_NOTE: 'A sticker goes up once the logo lands in the catalog. If you would rather not see your email here, write to us and we will remove it or swap it for a nickname.',
    CTA_TITLE: 'Missing a logo?',
    CTA_SUB: 'Suggest it — and claim your sticker',
    CTA_LINK: 'Open catalog',
  });
  htmlEn = bakeI18n(htmlEn, EN);
  htmlEn = applyEnChrome(htmlEn);

  fs.mkdirSync(path.join(ROOT, 'en', 'credits'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'en', 'credits', 'index.html'), htmlEn, 'utf8');

  console.log(`✓ Credits wall: ${entries.length} stickers (RU + EN)`);
}

main();
