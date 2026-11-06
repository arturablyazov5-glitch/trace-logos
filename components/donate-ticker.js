// ─────────────────────────────────────────────────────────────────────────────
// donate-ticker.js — marquee bar under the site header asking for hosting money.
//
// A module (not a classic script like the other components/) so it can share the
// payment URL with js/donate.js and read labels from the normal i18n dictionary.
//
// Placement is per layout — see templates/partials/nav-header.html (all generated
// pages), index.html (home) and logos|emoji/index.html (catalog, inside .center).
// ─────────────────────────────────────────────────────────────────────────────
import { t } from '../js/i18n.js';
import { supportUrl, ensureStyles } from '../js/donate.js';

const ICON_SERVER = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6 6h.01M6 18h.01"/></svg>';

// Sticky content below the bar (e.g. .logo-side in seo-page.css,
// .blog-sidebar in blog.css) reads this instead of hardcoding its height.
const TICKER_HEIGHT = '34px';   // must match .dn-ticker's height in css/donate.css

class DonateTicker extends HTMLElement {
  async connectedCallback() {
    // Build and measure the track only after its layout rules are available.
    const stylesheet = ensureStyles();
    if (!stylesheet.sheet) {
      const loaded = await new Promise(resolve => {
        stylesheet.addEventListener('load', () => resolve(true), { once: true });
        stylesheet.addEventListener('error', () => resolve(false), { once: true });
      });
      if (!loaded || !this.isConnected) return;
    }
    if (this.firstElementChild) return;

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
      </div>
    `;

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
