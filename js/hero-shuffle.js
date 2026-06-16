/* ──────────────────────────────────────────────────────────────────────────
   hero-shuffle.js — циклически меняет две инлайн-иконки в заголовке героя
   (логотип + эмодзи) на случайные из каталога, с анимацией флипа.
   Одна забота: «живой» заголовок главной. Данные — logos.json / emoji.json.
   ────────────────────────────────────────────────────────────────────────── */

const SWAP_MS = 2600;     // интервал между сменами одной иконки
const STAGGER_MS = 1300;  // сдвиг фаз логотипа и эмодзи, чтобы не флипали разом
const FLIP_MS = 300;      // длительность половины флипа (уход / приход)

const pickDifferent = (arr, current) => {
  if (arr.length < 2) return arr[0];
  let v;
  do { v = arr[(Math.random() * arr.length) | 0]; } while (v === current);
  return v;
};

const preload = (src) => new Promise((res) => {
  const img = new Image();
  img.onload = img.onerror = () => res();
  img.src = src;
});

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

function cycle(el, linkEl, pool, delay) {
  let current = { src: el.getAttribute('src'), url: linkEl.getAttribute('href') };
  setTimeout(() => {
    setInterval(async () => {
      if (document.hidden) return;
      const next = pickDifferent(pool, current);
      if (!next || next === current) return;
      await preload(next.src);
      flipTo(el, next.src);
      linkEl.setAttribute('href', next.url);
      current = next;
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
      .map((l) => ({ src: l.pngUrl, url: l.url }));
    emoji = (er.emoji || [])
      .filter((e) => e.pngUrl && e.url)
      .map((e) => ({ src: e.pngUrl, url: e.url }));
  } catch {
    return; // нет данных — оставляем стартовые иконки как есть
  }
  if (!logos.length || !emoji.length) return;

  if (reduced) {
    const nextLogo = pickDifferent(logos, { src: logoEl.getAttribute('src') });
    logoEl.src = nextLogo.src;
    if (logoLinkEl) logoLinkEl.setAttribute('href', nextLogo.url);
    const nextEmoji = pickDifferent(emoji, { src: emojiEl.getAttribute('src') });
    emojiEl.src = nextEmoji.src;
    if (emojiLinkEl) emojiLinkEl.setAttribute('href', nextEmoji.url);
    return;
  }

  cycle(logoEl, logoLinkEl, logos, 0);
  cycle(emojiEl, emojiLinkEl, emoji, STAGGER_MS);
}
