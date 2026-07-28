// ─────────────────────────────────────────────────────────────────────────────
// donate-ticker.js — marquee bar under the site header asking for hosting money.
//
// A module (not a classic script like the other components/) so it can share the
// payment URL and the snooze state with js/donate.js instead of re-hardcoding
// them, and read labels from the normal i18n dictionary.
//
// Placement is per layout — see templates/partials/nav-header.html (all generated
// pages), index.html (home) and logos|emoji/index.html (catalog, inside .center).
// ─────────────────────────────────────────────────────────────────────────────
import { t } from '../js/i18n.js';
import { supportUrl, ensureStyles, hasDonated, markDonated } from '../js/donate.js';

// Closing the bar (the × button) is intentionally NOT persisted anywhere —
// it comes back on the very next page load/refresh. Only markDonated()
// (going to the payment page, shared with the modal) snoozes it for real.

const ICON_SERVER = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6 6h.01M6 18h.01"/></svg>';

// The bar can appear/disappear at runtime (dismissed, already donated…), so
// anything sticky below it (e.g. .logo-side in seo-page.css, .blog-sidebar in
// blog.css) reads this instead of hardcoding the ticker's height — it's 0px
// whenever the ticker doesn't render, no separate "ticker was removed" case.
const TICKER_HEIGHT = '34px';   // must match .dn-ticker's height in css/donate.css

class DonateTicker extends HTMLElement {
  connectedCallback() {
    // Only the visitor having gone to the payment page hides this bar; a
    // dismissal via the × button does not persist (see note above).
    if (hasDonated()) { this.remove(); return; }

    ensureStyles();

    // The message repeats N times back-to-back; the track scrolls by exactly
    // one copy's width (-100/N%), so the next copy is already in place when
    // the previous one leaves the viewport. N is computed at runtime (see
    // fillTrack below) — a fixed count (e.g. 2) leaves a blank gap on any
    // screen wide enough that 2 copies don't fill the bar.
    const item = `
      <span class="dn-ticker-item">
        ${ICON_SERVER}
        <span>${t('tickerText')}</span>
        <a class="dn-ticker-cta" href="${supportUrl()}" target="_blank" rel="noopener noreferrer">${t('tickerCta')}</a>
      </span>
    `;

    this.innerHTML = `
      <div class="dn-ticker">
        <div class="dn-ticker-viewport">
          <div class="dn-ticker-track">${item}${item}</div>
        </div>
        <button type="button" class="dn-ticker-close" aria-label="${t('tickerCloseAria')}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
    `;

    // Delegated so it keeps working after fillTrack() replaces the track's
    // innerHTML (re-attaching a listener per copy would leak on every resize).
    this.addEventListener('click', e => {
      if (e.target.closest('.dn-ticker-cta')) markDonated();
      if (e.target.closest('.dn-ticker-close')) {
        document.documentElement.style.removeProperty('--tl-ticker-h');
        this.remove();
      }
    });

    const viewport = this.querySelector('.dn-ticker-viewport');
    const track = this.querySelector('.dn-ticker-track');

    // Keep the track at least one full viewport-width longer than what's
    // visible, so the loop point never scrolls into view as blank space.
    const fillTrack = () => {
      const oneItem = track.querySelector('.dn-ticker-item');
      const itemWidth = oneItem?.getBoundingClientRect().width;
      const viewportWidth = viewport.getBoundingClientRect().width;
      if (!itemWidth || !viewportWidth) return;
      const copies = Math.max(2, Math.ceil(viewportWidth / itemWidth) + 1);
      if (track.children.length === copies) return;
      track.innerHTML = item.repeat(copies);
      track.style.setProperty('--dn-ticker-shift', `${-100 / copies}%`);
    };

    fillTrack();
    document.fonts?.ready?.then(fillTrack);
    new ResizeObserver(fillTrack).observe(viewport);

    document.documentElement.style.setProperty('--tl-ticker-h', TICKER_HEIGHT);
  }
}

customElements.define('donate-ticker', DonateTicker);
