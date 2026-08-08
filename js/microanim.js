/**
 * microanim.js — микроанимации каталога /logos
 *
 * Откат: удалить строку `import { initSidebarIndicator } from './microanim.js'` в main.js
 *        и строку с microanim.css в logos/index.html
 */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Sidebar sliding indicator ────────────────────────────────────────────────
   Фон активного nav-item плавно скользит к следующему при смене категории.   */
// Module-scope so syncSidebarIndicator() (called from main.js after any
// programmatic active-item change) can move the same pill the click handler
// below animates — both must drive one shared element, not a per-call one.
let _aside = null;
let _pill = null;

function moveTo(navItem, instant) {
  const asideRect = _aside.getBoundingClientRect();
  const itemRect = navItem.getBoundingClientRect();
  const top = itemRect.top - asideRect.top + _aside.scrollTop;
  if (instant) _pill.style.transition = 'none';
  _pill.style.top = top + 'px';
  _pill.style.height = itemRect.height + 'px';
  _pill.style.opacity = '1';
  if (instant) requestAnimationFrame(() => { _pill.style.transition = ''; });
}

export function initSidebarIndicator() {
  if (REDUCED) return;
  _aside = document.querySelector('aside');
  if (!_aside) return;

  _pill = document.createElement('div');
  _pill.className = 'nav-indicator-pill';
  _pill.style.cssText = 'position:absolute;pointer-events:none;opacity:0;left:0;right:0;top:0;height:32px;';
  _aside.insertBefore(_pill, _aside.firstChild);

  syncSidebarIndicator(true);

  _aside.addEventListener('click', e => {
    const navItem = e.target.closest('.nav-item');
    if (navItem) moveTo(navItem, false);
  });
}

// Repositions the pill onto whichever .nav-item currently carries `.active`.
// The click listener above only fires for a direct sidebar click — a
// programmatic activation (setActive/setActiveEcosystem called from a URL
// param on load, a format-filter change, or an ecosystem cross-link) changes
// the `.active` class without ever clicking the sidebar, and the plain CSS
// highlight is deliberately zeroed out in css/microanim.css so the pill is
// the only visible indicator. Without this, the pill stays wherever it was
// last put by a click (e.g. the default "Все" position on a fresh load) even
// though the correct item now carries `.active` in the DOM.
export function syncSidebarIndicator(instant = false) {
  if (REDUCED || !_aside) return;
  const active = _aside.querySelector('.nav-item.active');
  if (active) moveTo(active, instant);
}
