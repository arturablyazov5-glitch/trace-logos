/* ──────────────────────────────────────────────────────────────────────────
   hero-shuffle.js — циклически меняет две инлайн-иконки в заголовке героя
   (логотип + эмодзи) на случайные из каталога, с анимацией флипа.
   Одна забота: «живой» заголовок главной. Данные — logos.json / emoji.json.
   ────────────────────────────────────────────────────────────────────────── */

const SWAP_MS = 2600;     // интервал между сменами одной иконки
const STAGGER_MS = 1300;  // сдвиг фаз логотипа и эмодзи, чтобы не флипали разом
const FLIP_MS = 300;      // длительность половины флипа (уход / приход)
const POOL_LIMIT = 18;    // сколько разных иконок набираем за сессию, дальше только они
const MAX_FLIPS = 500;    // жёсткий потолок флипов — страховка от аномально долгой сессии

const pickDifferent = (arr, current) => {
  if (arr.length < 2) return arr[0];
  let v;
  do { v = arr[(Math.random() * arr.length) | 0]; } while (v === current);
  return v;
};

const PROD_ORIGIN = 'https://trace-logos.ru';
const IS_EN = /^\/en\//.test(location.pathname);
const toRelSrc = (src) =>
  src.startsWith(PROD_ORIGIN) ? src.slice(PROD_ORIGIN.length) : src;
const toLocalUrl = (url) => {
  let rel = url.startsWith(PROD_ORIGIN) ? url.slice(PROD_ORIGIN.length) : url;
  if (IS_EN && !rel.startsWith('/en/')) rel = '/en' + rel;
  return rel;
};

const preload = (src) => new Promise((res) => {
  const img = new Image();
  img.onload = () => res(true);
  img.onerror = () => res(false);
  img.src = src;
});

// The hero flips a new random logo/emoji every couple seconds — using the
// full-res PNG (some catalog logos are 500KB–2MB) would mean a steady drip
// of megabytes for a 24–52px icon. Guess the WebP grid preview path (mirrors
// .../pngs/<path>.png → .../previews/<path>.webp) and fall back to the real
// PNG if that guess 404s (e.g. preview not yet generated for a new logo).
const lightGuess = (url) => url.replace('/pngs/', '/previews/').replace(/\.png(\?|$)/i, '.webp$1');

function flipTo(el, nextSrc) {
  const out = el.animate(
    [{ transform: 'perspective(220px) rotateX(0deg) scale(1)', opacity: 1 },
     { transform: 'perspective(220px) rotateX(90deg) scale(0.7)', opacity: 0 }],
    { duration: FLIP_MS, easing: 'cubic-bezier(.55,0,.45,1)', fill: 'forwards' },
  );
  out.onfinish = () => {
    el.src = nextSrc;
    el.animate(
      [{ transform: 'perspective(220px) rotateX(-90deg) scale(0.7)', opacity: 0 },
       { transform: 'perspective(220px) rotateX(0deg) scale(1)', opacity: 1 }],
      { duration: FLIP_MS, easing: 'cubic-bezier(.55,0,.45,1)', fill: 'forwards' },
    );
  };
}

function cycle(el, linkEl, catalog, delay, isActive) {
  let current = { src: el.getAttribute('src'), url: linkEl.getAttribute('href') };
  // Пул набирается лениво, по одной иконке за флип — никакого прогрева заранее
  // (зашёл-и-сразу-ушёл посетитель не должен оплачивать сетью чужую анимацию).
  // Как только в пуле накопилось POOL_LIMIT разных иконок, дальше флипаем
  // только по нему: те же URL уже лежат в 30-дневном immutable-кэше браузера
  // (см. vercel.json), повторный показ не бьёт по Edge Requests вообще —
  // сессия хоть сутки открыта, новых запросов в сеть после набора пула нет.
  const pool = [];
  let flips = 0;
  setTimeout(() => {
    const id = setInterval(async () => {
      // Вкладка неактивна (document.hidden) ИЛИ .hero вне вьюпорта — не
      // тратим анимацию (rAF/композитинг) и сетевой префетч на то, что
      // никто не видит. isActive() пересчитывается на каждый тик, а не
      // фиксируется один раз — оба состояния меняются в любой момент
      // (свитч вкладки, скролл), setInterval продолжает тикать вхолостую
      // (дешевле и надёжнее, чем start/stop таймера с учётом дрейфа фаз
      // logo/emoji), но сам флип и его preload-фетч пропускаются целиком.
      if (!isActive()) return;
      if (flips >= MAX_FLIPS) { clearInterval(id); return; }
      const source = pool.length < POOL_LIMIT ? catalog : pool;
      const next = pickDifferent(source, current);
      if (!next || next === current) return;
      let src = toRelSrc(next.src);
      const ok = await preload(src);
      if (!ok) src = toRelSrc(next.fallback);
      flipTo(el, src);
      linkEl.setAttribute('href', next.url);
      current = next;
      flips++;
      if (pool.length < POOL_LIMIT && !pool.includes(next)) pool.push(next);
    }, SWAP_MS);
  }, delay);
}

export async function initHeroShuffle() {
  const logoEl = document.getElementById('hero-img-logo');
  const emojiEl = document.getElementById('hero-img-emoji');
  if (!logoEl || !emojiEl) return;

  const logoLinkEl = logoEl.closest('a');
  const emojiLinkEl = emojiEl.closest('a');

  // Уважаем «уменьшить движение» — просто покажем один случайный кадр и выйдем.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let logos, emoji;
  try {
    const [lr, er] = await Promise.all([
      fetch('logos.json').then((r) => r.json()),
      fetch('emoji.json').then((r) => r.json()),
    ]);
    logos = (lr.logos || [])
      .filter((l) => !l.comingSoon && l.pngUrl && l.url)
      .map((l) => ({ src: lightGuess(l.pngUrl), fallback: l.pngUrl, url: toLocalUrl(l.url) }));
    emoji = (er.emoji || [])
      .filter((e) => e.pngUrl && e.url)
      .map((e) => ({ src: lightGuess(e.pngUrl), fallback: e.pngUrl, url: toLocalUrl(e.url) }));
  } catch {
    return; // нет данных — оставляем стартовые иконки как есть
  }
  if (!logos.length || !emoji.length) return;

  if (reduced) {
    const nextLogo = pickDifferent(logos, { src: logoEl.getAttribute('src') });
    logoEl.onerror = () => { logoEl.onerror = null; logoEl.src = nextLogo.fallback; };
    logoEl.src = nextLogo.src;
    if (logoLinkEl) logoLinkEl.setAttribute('href', nextLogo.url);
    const nextEmoji = pickDifferent(emoji, { src: emojiEl.getAttribute('src') });
    emojiEl.onerror = () => { emojiEl.onerror = null; emojiEl.src = nextEmoji.fallback; };
    emojiEl.src = nextEmoji.src;
    if (emojiLinkEl) emojiLinkEl.setAttribute('href', nextEmoji.url);
    return;
  }

  // .hero — первый блок главной, где живут обе иконки. IntersectionObserver
  // вместо scroll-листенера: событийный, не считает геометрию на каждый кадр
  // скролла. threshold: 0 — «хотя бы 1px виден» достаточно, чтобы не резать
  // анимацию из-за пограничного кадра на границе вьюпорта.
  const heroEl = logoEl.closest('.hero');
  let heroVisible = true; // до первого колбэка наблюдателя считаем видимым — не гасим анимацию на старте
  if (heroEl && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => { heroVisible = entries[entries.length - 1].isIntersecting; },
      { threshold: 0 },
    ).observe(heroEl);
  }
  const isActive = () => !document.hidden && heroVisible;

  cycle(logoEl, logoLinkEl, logos, 0, isActive);
  cycle(emojiEl, emojiLinkEl, emoji, STAGGER_MS, isActive);
}
