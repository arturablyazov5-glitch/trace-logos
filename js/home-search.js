// ─────────────────────────────────────────────────────────────────────────────
// home-search.js — единый живой поиск на главной (логотипы + эмодзи).
// Прогрессивное улучшение: без JS форма уходит на /logos/?q=… (см. index.html).
// Разбор запроса и подсчёт релевантности (стоп-слова, RU↔EN раскладка, fuzzy) —
// общий движок из search.js (тот же, что фильтрует сетку каталога), чтобы
// поведение поиска не расходилось между страницами.
// ─────────────────────────────────────────────────────────────────────────────
import { highlight, escapeHtml, trackSearchQuery, flushSearchQuery } from './utils.js';
import { tokenizeQuery, scoreQuery } from './search.js';
import './search-shortcut.js';

const MAX_PER_GROUP = 6;

let container, form, input, dropdown, combobox;
let data = null;            // { logos:[], emoji:[] }
let loadingPromise = null;
let current = [];           // плоский список отображаемых результатов (для клавиатуры)
let activeIdx = -1;
let debTimer = 0;

async function loadData() {
  if (data) return data;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    const [lr, er] = await Promise.all([
      fetch('logos.json').then(r => r.json()).catch(() => ({ logos: [] })),
      fetch('emoji.json').then(r => r.json()).catch(() => ({ emoji: [] })),
    ]);
    const logos = (lr.logos || []).filter(l => !l.comingSoon).map(l => ({
      type: 'logo',
      name: l.name,
      url: l.url,
      img: l.svgUrl || l.pngUrl || '',
      search: (l.name + ' ' + (l.tags || '')).toLowerCase(),
    }));
    const emoji = (er.emoji || []).map(e => {
      const ch = (e.tags || '').trim().split(/\s+/)[0] || '';
      return {
        type: 'emoji',
        name: e.name,
        char: ch,
        url: e.url || ('emoji/?q=' + encodeURIComponent(e.name)),
        search: (e.name + ' ' + (e.tags || '')).toLowerCase(),
      };
    });
    data = { logos, emoji };
    return data;
  })();
  return loadingPromise;
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
    ? `<span class="sd-thumb"><img src="${it.img}" alt="${escapeHtml(it.name)}" loading="lazy"></span>`
    : `<span class="sd-thumb emoji">${escapeHtml(it.char)}</span>`;
  const label = it.type === 'logo' ? 'Логотип' : 'Эмодзи';
  return `<a class="sd-item" role="option" data-idx="${idx}" href="${it.url}">
    ${thumb}
    <span class="sd-name">${highlight(it.name, rawWords)}</span>
    <span class="sd-type">${label}</span>
  </a>`;
}

function renderResults(logos, emoji, rawWords) {
  current = [...logos, ...emoji];
  activeIdx = -1;
  if (!current.length) {
    dropdown.innerHTML = '<div class="sd-empty">Ничего не найдено</div>';
    dropdown.classList.add('open');
    combobox.setAttribute('aria-expanded', 'true');
    return;
  }
  let html = '';
  let idx = 0;
  if (logos.length) {
    html += '<div class="sd-group-label">Логотипы</div>';
    for (const it of logos) html += itemHtml(it, idx++, rawWords);
  }
  if (emoji.length) {
    html += '<div class="sd-group-label">Эмодзи</div>';
    for (const it of emoji) html += itemHtml(it, idx++, rawWords);
  }
  dropdown.innerHTML = html;
  dropdown.classList.add('open');
  input.setAttribute('aria-expanded', 'true');
}

function close() {
  dropdown.classList.remove('open');
  dropdown.innerHTML = '';
  combobox.setAttribute('aria-expanded', 'false');
  current = [];
  activeIdx = -1;
}

async function runSearch() {
  const raw = input.value.trim();
  const { words, rawWords } = tokenizeQuery(raw);
  if (!words.length) { trackSearchQuery('', 0); close(); return; }
  const d = await loadData();
  if (input.value.trim() !== raw) return; // устарело
  const logosAll = rank(d.logos, words);
  const emojiAll = rank(d.emoji, words);
  // Считаем до среза MAX_PER_GROUP: в статистику должно уходить реальное число
  // совпадений, а не размер выпадашки.
  trackSearchQuery(raw, logosAll.length + emojiAll.length);
  renderResults(logosAll.slice(0, MAX_PER_GROUP), emojiAll.slice(0, MAX_PER_GROUP), rawWords);
}

function setActive(i) {
  const items = dropdown.querySelectorAll('.sd-item');
  if (!items.length) return;
  activeIdx = (i + items.length) % items.length;
  items.forEach((el, k) => el.classList.toggle('active', k === activeIdx));
  items[activeIdx].scrollIntoView({ block: 'nearest' });
}

function onKeydown(e) {
  if (!dropdown.classList.contains('open')) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIdx + 1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIdx - 1); }
  else if (e.key === 'Enter') {
    if (activeIdx >= 0 && current[activeIdx]) { e.preventDefault(); location.href = current[activeIdx].url; }
  } else if (e.key === 'Escape') { close(); }
}

export function initHomeSearch() {
  container = document.querySelector('.home-search');
  if (!container) return;
  form = container.querySelector('.search-form');
  combobox = container.querySelector('.search-field');
  input = container.querySelector('.search-input');
  dropdown = container.querySelector('.search-dropdown');
  if (!form || !input || !dropdown) return;

  input.addEventListener('focus', () => { loadData(); if (input.value.trim()) runSearch(); }, { once: false });
  input.addEventListener('input', () => { clearTimeout(debTimer); debTimer = setTimeout(runSearch, 110); });
  input.addEventListener('keydown', onKeydown);
  // Отсюда уходят со страницы: клик по подсказке ведёт на страницу логотипа.
  // Таймер отстоя (1.2 с) может не успеть — дописываем принудительно,
  // fetch в trackSearchQuery идёт с keepalive.
  input.addEventListener('blur', flushSearchQuery);
  window.addEventListener('pagehide', flushSearchQuery);
  form.addEventListener('submit', e => { if (!input.value.trim()) e.preventDefault(); });
  document.addEventListener('click', e => { if (!container.contains(e.target)) close(); });
}
