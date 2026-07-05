// FLIP-style reflow animation for card grids. Used only when the format
// filter (SVG/PNG) changes — regular search/nav stays instant.

const DURATION = 260;
const EASE = 'cubic-bezier(.4,.7,.2,1)';

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

// Runs `mutate` (which must synchronously toggle `.hidden` on section.cards
// and, if section.mounted, replaceChildren with the new visible set) wrapped
// in a FLIP animation: staying cards glide to their new slot, entering cards
// fade+scale in, leaving cards fade+scale out via a detached ghost clone
// (real nodes are removed by `mutate` itself, so layout reflows naturally).
export function animateSectionReflow(section, mutate) {
  if (!section.mounted || prefersReducedMotion()) { mutate(); return; }

  const before = new Map();
  section.cards.forEach(card => {
    if (!card.classList.contains('hidden')) before.set(card, card.getBoundingClientRect());
  });

  mutate();

  const after = new Map();
  section.cards.forEach(card => {
    if (!card.classList.contains('hidden')) after.set(card, card.getBoundingClientRect());
  });

  before.forEach((rect, card) => {
    if (after.has(card)) return;
    const ghost = card.cloneNode(true);
    ghost.classList.remove('hidden');
    Object.assign(ghost.style, {
      position: 'fixed', left: rect.left + 'px', top: rect.top + 'px',
      width: rect.width + 'px', height: rect.height + 'px', margin: '0',
      pointerEvents: 'none', zIndex: '5',
      transition: `opacity ${DURATION}ms ease, transform ${DURATION}ms ${EASE}`,
    });
    document.body.appendChild(ghost);
    requestAnimationFrame(() => {
      ghost.style.opacity = '0';
      ghost.style.transform = 'scale(.9)';
    });
    setTimeout(() => ghost.remove(), DURATION + 30);
  });

  after.forEach((rect, card) => {
    const prev = before.get(card);
    if (!prev) return;
    const dx = prev.left - rect.left;
    const dy = prev.top - rect.top;
    if (!dx && !dy) return;
    card.style.transition = 'none';
    card.style.transform = `translate(${dx}px, ${dy}px)`;
    requestAnimationFrame(() => {
      card.style.transition = `transform ${DURATION}ms ${EASE}`;
      card.style.transform = '';
    });
    card.addEventListener('transitionend', () => { card.style.transition = ''; }, { once: true });
  });

  after.forEach((rect, card) => {
    if (before.has(card)) return;
    card.style.transition = 'none';
    card.style.opacity = '0';
    card.style.transform = 'scale(.92)';
    requestAnimationFrame(() => {
      card.style.transition = `opacity ${DURATION}ms ease, transform ${DURATION}ms ${EASE}`;
      card.style.opacity = '';
      card.style.transform = '';
    });
    card.addEventListener('transitionend', () => { card.style.transition = ''; }, { once: true });
  });
}
