/**
 * microanim.js — микроанимации каталога /logos
 *
 * Откат: удалить строку `import { initSidebarIndicator } from './microanim.js'` в main.js
 *        и строку с microanim.css в logos/index.html
 */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Sidebar sliding indicator ────────────────────────────────────────────────
   Фон активного nav-item плавно скользит к следующему при смене категории.   */
export function initSidebarIndicator() {
  if (REDUCED) return;
  const aside = document.querySelector('aside');
  if (!aside) return;

  const pill = document.createElement('div');
  pill.className = 'nav-indicator-pill';
  pill.style.cssText = 'position:absolute;pointer-events:none;opacity:0;left:0;right:0;top:0;height:32px;';
  aside.insertBefore(pill, aside.firstChild);

  function moveTo(navItem, instant) {
    const asideRect = aside.getBoundingClientRect();
    const itemRect = navItem.getBoundingClientRect();
    const top = itemRect.top - asideRect.top + aside.scrollTop;
    if (instant) pill.style.transition = 'none';
    pill.style.top = top + 'px';
    pill.style.height = itemRect.height + 'px';
    pill.style.opacity = '1';
    if (instant) requestAnimationFrame(() => { pill.style.transition = ''; });
  }

  const initial = aside.querySelector('.nav-item.active');
  if (initial) moveTo(initial, true);

  aside.addEventListener('click', e => {
    const navItem = e.target.closest('.nav-item');
    if (navItem) moveTo(navItem, false);
  });
}
