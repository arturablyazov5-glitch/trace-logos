// ─────────────────────────────────────────────────────────────────────────────
// header-search.js — единый живой поиск в шапке статичных страниц
// (SEO лого/эмодзи, категории эмодзи, подборки, блог).
// Самоинициализируется по разметке #seo-search-form. Охват задаётся атрибутом
// data-scope на форме: "logos" — только логотипы, "all" — логотипы + эмодзи.
// Путь к данным берётся из data-base (= {{REL}}, относительный путь до корня).
// Один источник правды: ту же разметку/стили использует и лого-SEO.
// ─────────────────────────────────────────────────────────────────────────────
import { switchLayout, highlight, escapeHtml, fuzzyMatchToken } from './utils.js';
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
  const norm = s => (s || '').toLowerCase().replace(/ё/g, 'е');
  const enUrl = url => (IS_EN && url) ? '/en' + url.replace('https://trace-logos.ru', '') : url.replace('https://trace-logos.ru', '') || url;

  let data = null;
  let loadPromise = null;
  let current = [];
  let activeIdx = -1;
  let debTimer = 0;

  function isExactMatch(word, hay) {
    if (hay.includes(word)) return true;
    const alt = switchLayout(word);
    return alt !== word && hay.includes(alt);
  }

  function matchWord(word, hay) {
    if (isExactMatch(word, hay)) return true;
    if (word.length < 3) return false;
    const alt = switchLayout(word);
    const tokens = hay.split(/\s+/);
    for (const t of tokens) {
      if (fuzzyMatchToken(word, t) > 0) return true;
      if (alt !== word && fuzzyMatchToken(alt, t) > 0) return true;
    }
    return false;
  }

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
        search: norm(l.name + ' ' + (l.name_en || '') + ' ' + (l.tags || '')),
      }));
      const emoji = (er.emoji || []).map(e => {
        const ch = (e.tags || '').trim().split(/\s+/)[0] || '';
        return {
          type: 'emoji',
          name: IS_EN ? (e.name_en || e.name) : e.name,
          char: ch,
          url: enUrl(e.url) || (BASE + 'emoji/?q=' + encodeURIComponent(e.name)),
          search: norm(e.name + ' ' + (e.name_en || '') + ' ' + (e.tags || '')),
        };
      });
      data = { logos, emoji };
      return data;
    })();
    return loadPromise;
  }

  function rank(items, words, raw) {
    const out = [];
    for (const it of items) {
      if (!words.every(w => matchWord(w, it.search))) continue;
      const nm = norm(it.name);
      let score = -nm.length * 0.1;
      if (nm === raw) score += 120;
      if (nm.startsWith(words[0])) score += 80;
      if (nm.split(/\s+/).some(t => t.startsWith(words[0]))) score += 30;
      const fuzzyCount = words.filter(w => !isExactMatch(w, it.search)).length;
      if (fuzzyCount > 0) score -= 40 * fuzzyCount;
      out.push([score, it]);
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
    const n = norm(raw);
    const words = n.replace(/-/g, ' ').split(/\s+/).filter(Boolean);
    if (!words.length) { close(); return; }
    const d = await loadData();
    if (input.value.trim() !== raw) return;
    const rawWords = raw.split(/\s+/).filter(Boolean);
    const logos = rank(d.logos, words, n).slice(0, MAX);
    const emoji = WITH_EMOJI ? rank(d.emoji, words, n).slice(0, MAX) : [];
    renderResults(logos, emoji, rawWords);
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
}
