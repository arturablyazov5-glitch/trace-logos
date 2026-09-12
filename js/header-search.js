// ─────────────────────────────────────────────────────────────────────────────
// header-search.js — единый живой поиск в шапке статичных страниц
// (SEO лого/эмодзи, категории эмодзи, подборки, блог).
// Самоинициализируется по разметке #seo-search-form. Охват задаётся атрибутом
// data-scope на форме: "logos" — только логотипы, "all" — логотипы + эмодзи.
// Путь к данным берётся из data-base (= {{REL}}, относительный путь до корня).
// Один источник правды: ту же разметку/стили использует и лого-SEO, а разбор
// запроса и подсчёт релевантности (стоп-слова, RU↔EN раскладка, fuzzy) — тот
// же движок из search.js, что фильтрует сетку каталога.
// ─────────────────────────────────────────────────────────────────────────────
import { highlight, escapeHtml, trackSearchQuery, flushSearchQuery } from './utils.js';
import { tokenizeQuery, scoreQuery } from './search.js';
import { initPlaceholderTypewriter } from './placeholder-typewriter.js';
import './search-shortcut.js';

const form = document.getElementById('seo-search-form');
const input = document.getElementById('seo-search');
const dropdown = document.getElementById('seo-search-dropdown');

if (form && input && dropdown) {
  const BASE = form.dataset.base || '';
  const SCOPE = form.dataset.scope || 'all';          // "logos" | "emoji" | "all"
  const WITH_LOGOS = SCOPE !== 'emoji';
  const WITH_EMOJI = SCOPE !== 'logos';
  const IS_EN = window.__LANG__ === 'en';
  const MAX = 8;
  const enUrl = url => (IS_EN && url) ? '/en' + url.replace('https://trace-logos.ru', '') : url.replace('https://trace-logos.ru', '') || url;

  let data = null;
  let loadPromise = null;
  let current = [];
  let activeIdx = -1;
  let debTimer = 0;

  async function loadData() {
    if (data) return data;
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      const reqs = [
        WITH_LOGOS
          ? fetch(BASE + 'logos.json').then(r => r.json()).catch(() => ({ logos: [] }))
          : Promise.resolve({ logos: [] }),
        WITH_EMOJI
          ? fetch(BASE + 'emoji.json').then(r => r.json()).catch(() => ({ emoji: [] }))
          : Promise.resolve({ emoji: [] }),
      ];
      const [lr, er] = await Promise.all(reqs);
      const logos = (lr.logos || []).filter(l => !l.comingSoon).map(l => ({
        type: 'logo',
        name: IS_EN ? (l.name_en || l.name) : l.name,
        url: enUrl(l.url),
        img: l.svgUrl || l.pngUrl || '',
        search: (l.name + ' ' + (l.name_en || '') + ' ' + (l.tags || '')).toLowerCase(),
      }));
      const emoji = (er.emoji || []).map(e => {
        const ch = (e.tags || '').trim().split(/\s+/)[0] || '';
        return {
          type: 'emoji',
          name: IS_EN ? (e.name_en || e.name) : e.name,
          char: ch,
          url: enUrl(e.url) || (BASE + 'emoji/?q=' + encodeURIComponent(e.name)),
          search: (e.name + ' ' + (e.name_en || '') + ' ' + (e.tags || '')).toLowerCase(),
        };
      });
      data = { logos, emoji };
      return data;
    })();
    return loadPromise;
  }

  function rank(items, words) {
    const out = [];
    for (const it of items) {
      const nameLow = it.name.toLowerCase().replace(/-/g, '');
      const score = scoreQuery(words, it.search, nameLow);
      if (score > 0) out.push([score, it]);
    }
    out.sort((a, b) => b[0] - a[0]);
    return out.map(p => p[1]);
  }

  function itemHtml(it, idx, rawWords) {
    const thumb = it.type === 'logo'
      ? `<span class="sd-thumb"><img src="${escapeHtml(it.img)}" alt="${escapeHtml(it.name)}" loading="lazy"></span>`
      : `<span class="sd-thumb emoji">${escapeHtml(it.char)}</span>`;
    return `<a class="sd-item" role="option" data-idx="${idx}" href="${escapeHtml(it.url)}">
      ${thumb}
      <span class="sd-name">${highlight(it.name, rawWords)}</span>
    </a>`;
  }

  function renderResults(logos, emoji, rawWords) {
    current = [...logos, ...emoji];
    activeIdx = -1;
    if (!current.length) {
      dropdown.innerHTML = '<div class="sd-empty">Ничего не найдено</div>';
      dropdown.classList.add('open');
      input.setAttribute('aria-expanded', 'true');
      return;
    }
    const grouped = WITH_EMOJI && logos.length && emoji.length;
    let html = '';
    let idx = 0;
    if (grouped) html += '<div class="sd-group-label">Логотипы</div>';
    for (const it of logos) html += itemHtml(it, idx++, rawWords);
    if (emoji.length) {
      if (grouped) html += '<div class="sd-group-label">Эмодзи</div>';
      for (const it of emoji) html += itemHtml(it, idx++, rawWords);
    }
    dropdown.innerHTML = html;
    dropdown.classList.add('open');
    input.setAttribute('aria-expanded', 'true');
  }

  function close() {
    dropdown.classList.remove('open');
    dropdown.innerHTML = '';
    input.setAttribute('aria-expanded', 'false');
    current = [];
    activeIdx = -1;
  }

  async function runSearch() {
    const raw = input.value.trim();
    const { words, rawWords } = tokenizeQuery(raw);
    if (!words.length) { trackSearchQuery('', 0); close(); return; }
    const d = await loadData();
    if (input.value.trim() !== raw) return;
    const logosAll = rank(d.logos, words);
    const emojiAll = WITH_EMOJI ? rank(d.emoji, words) : [];
    // Считаем до среза MAX: в статистику должно уходить реальное число
    // совпадений, а не размер выпадашки.
    trackSearchQuery(raw, logosAll.length + emojiAll.length);
    renderResults(logosAll.slice(0, MAX), emojiAll.slice(0, MAX), rawWords);
  }

  function setActive(i) {
    const items = dropdown.querySelectorAll('.sd-item');
    if (!items.length) return;
    activeIdx = (i + items.length) % items.length;
    items.forEach((el, k) => el.classList.toggle('active', k === activeIdx));
    items[activeIdx].scrollIntoView({ block: 'nearest' });
  }

  input.addEventListener('focus', () => { loadData(); if (input.value.trim()) runSearch(); });
  input.addEventListener('input', () => { clearTimeout(debTimer); debTimer = setTimeout(runSearch, 110); });
  input.addEventListener('keydown', e => {
    if (!dropdown.classList.contains('open')) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIdx + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIdx - 1); }
    else if (e.key === 'Enter') {
      if (activeIdx >= 0 && current[activeIdx]) { e.preventDefault(); location.href = current[activeIdx].url; }
    } else if (e.key === 'Escape') { close(); }
  });

  // В отличие от каталога, отсюда уходят со страницы: клик по подсказке ведёт
  // на страницу логотипа. Таймер отстоя (1.2 с) может не успеть — дописываем
  // запрос принудительно, fetch в trackSearchQuery идёт с keepalive.
  input.addEventListener('blur', flushSearchQuery);
  window.addEventListener('pagehide', flushSearchQuery);

  form.addEventListener('submit', e => {
    if (!input.value.trim()) { e.preventDefault(); return; }
    e.preventDefault();
    if (activeIdx >= 0 && current[activeIdx]) {
      location.href = current[activeIdx].url;
    } else {
      location.href = form.getAttribute('action') + '?q=' + encodeURIComponent(input.value.trim());
    }
  });

  document.addEventListener('click', e => { if (!form.contains(e.target)) close(); });

  // ── Живой плейсхолдер: печатает и стирает примеры запросов (движок в
  // placeholder-typewriter.js — общий с search-placeholder.js). Реальные
  // названия логотипов берутся из уже загруженных данных поиска.
  const HEADER_TEMPLATES = IS_EN ? [
    'Logo {name} download SVG',
    '{name} icon ICO',
    '{name} SVG and PNG',
    'Download {name} logo',
    'Emoji 🔥',
    'Emoji 😂',
    'Emoji 😀',
    'Grinning face emoji',
    'Download logo {name}',
    '{name} in vector, free',
  ] : [
    'Лого {name} скачать SVG',
    'Значок {name} ICO',
    '{name} SVG и PNG',
    '{name} логотип скачать',
    'Эмодзи 🔥',
    'Эмодзи 😂',
    'Эмодзи 😀',
    'Улыбается эмодзи',
    'Скачать логотип {name}',
    '{name} в векторе бесплатно',
  ];
  initPlaceholderTypewriter(input, HEADER_TEMPLATES, () =>
    loadData().then(d => (d.logos || []).map(l => l.name).filter(Boolean))
  );
}
