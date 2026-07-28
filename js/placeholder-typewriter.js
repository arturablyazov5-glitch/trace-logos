// ─────────────────────────────────────────────────────────────────────────────
// placeholder-typewriter.js — общий движок для «живого» плейсхолдера: печатает
// и стирает по буквам примеры запросов из массива шаблонов, {name} подставляется
// случайным реальным названием. Пауза на фокусе/непустом значении — не мешает
// вводу. Уважает prefers-reduced-motion.
//
// Используется в header-search.js (#seo-search) и search-placeholder.js
// (#search — живой фильтр каталога) — чтобы не дублировать анимацию дважды.
// ─────────────────────────────────────────────────────────────────────────────

// input: HTMLInputElement
// templates: string[] — шаблоны с необязательным {name}
// getNames: () => Promise<string[]> — резолвится списком реальных названий
export function initPlaceholderTypewriter(input, templates, getNames) {
  if (!input) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const STATIC = input.getAttribute('placeholder') || '';
  let names = [];
  Promise.resolve(getNames()).then(list => { names = list || []; });

  // Тасуем колоду шаблонов и раздаём по одному — фразы не повторяются подряд,
  // но порядок каждый раз случайный (shuffle-bag, не i.i.d. random).
  let bag = [];
  function refillBag() {
    bag = templates.slice();
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }

  function nextPhrase() {
    if (!bag.length) refillBag();
    const t = bag.shift();
    if (!t.includes('{name}')) return t;
    if (!names.length) return null;
    return t.replace('{name}', names[Math.floor(Math.random() * names.length)]);
  }

  let timer = 0;

  function typeText(text, cb) {
    let i = 0;
    (function step() {
      input.setAttribute('placeholder', text.slice(0, i));
      i++;
      timer = i <= text.length ? setTimeout(step, 42 + Math.random() * 30) : setTimeout(cb, 1500);
    })();
  }

  function eraseText(text, cb) {
    let i = text.length;
    (function step() {
      input.setAttribute('placeholder', text.slice(0, i));
      i--;
      timer = i >= 0 ? setTimeout(step, 22 + Math.random() * 18) : setTimeout(cb, 260);
    })();
  }

  function loop() {
    const phrase = nextPhrase();
    if (!phrase) { timer = setTimeout(loop, 400); return; }
    typeText(phrase, () => eraseText(phrase, loop));
  }

  input.addEventListener('focus', () => {
    clearTimeout(timer);
    input.setAttribute('placeholder', STATIC);
  });
  input.addEventListener('blur', () => {
    if (!input.value) { clearTimeout(timer); timer = setTimeout(() => eraseText(STATIC, loop), 500); }
  });

  timer = setTimeout(() => eraseText(STATIC, loop), 3200);
}
