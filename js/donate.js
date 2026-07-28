// ─────────────────────────────────────────────────────────────────────────────
// donate.js — fundraiser modal shown after the 1st export, then every 3rd after that.
//
// Listens for the `tl:export` DOM event that utils.trackExport() fires on every
// successful download/copy (SVG, PNG, ZIP, ICO, ICNS — catalog and SEO pages
// alike). That event is the one place every export path already funnels through,
// so this module needs no hooks in main.js / seo-page.js / export.js / icns.js.
//
// Markup and stylesheet are created on demand — nothing to add to the ~15k
// generated HTML pages. Same approach as icns.js.
// ─────────────────────────────────────────────────────────────────────────────
import { t, getLang } from './i18n.js';
// Side-effect import: registers <support-btn> so the modal can reuse the exact
// same button (components/support-btn.js) instead of building its own.
import '../components/support-btn.js';

// Single source of truth for the payment link (also used by the ticker,
// components/donate-ticker.js). NOTE: components/support-btn.js still carries
// its own copy of this URL — keep them in sync until it's unified.
const LAVA_URL = 'https://app.lava.top/products/6f3c8efd-27c3-41a8-acb1-559b83ea3b46/d9261f0e-d716-418c-b91d-764e83f1c01c?currency=';

export function supportUrl() {
  return LAVA_URL + (getLang() === 'ru' ? 'RUB' : 'USD');
}

// Show on the 1st export, then the 4th, 7th… — an early nudge for a first-time
// visitor, then the same every-3rd cadence for regulars.
const EVERY_NTH = 3;
const KEY_COUNT  = 'tl_donate_count';
const KEY_THANKS = 'tl_donate_thanks';   // epoch ms; set only when someone actually
                                         // went to the payment page. Closing/"not now"
                                         // does NOT set this — the modal keeps showing
                                         // on the normal cadence until someone donates.
const SNOOZE_AFTER_DONATE = 3 * 24 * 60 * 60 * 1000;  // clicked "support" → 3 days

// Private-mode Safari throws on localStorage; degrade to "just never nag".
function read(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function write(key, val) {
  try { localStorage.setItem(key, val); } catch { /* storage unavailable */ }
}

// The 3-day quiet period lives in sessionStorage, not localStorage, so it
// clears when the tab/window closes instead of following the visitor forever.
function sessionRead(key) {
  try { return sessionStorage.getItem(key); } catch { return null; }
}
function sessionWrite(key, val) {
  try { sessionStorage.setItem(key, val); } catch { /* storage unavailable */ }
}

function activeUntil(key, readFn = read) {
  const until = Number(readFn(key));
  return Number.isFinite(until) && until > Date.now();
}

// True once the visitor has opened the payment page — the whole fundraiser
// (modal AND ticker) goes quiet for them. Don't keep asking someone who paid.
export function hasDonated() { return activeUntil(KEY_THANKS, sessionRead); }

// Single writer for the flag — called from both CTAs (this modal and the ticker).
export function markDonated() {
  sessionWrite(KEY_THANKS, String(Date.now() + SNOOZE_AFTER_DONATE));
}

export function ensureStyles() {
  if (!document.querySelector('link[data-support-btn-css]')) {
    const supportLink = document.createElement('link');
    supportLink.rel = 'stylesheet';
    supportLink.href = new URL('../css/support-btn.css', import.meta.url).href;
    supportLink.dataset.supportBtnCss = '1';
    document.head.appendChild(supportLink);
  }
  if (document.querySelector('link[data-donate-css]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('../css/donate.css', import.meta.url).href;
  link.dataset.donateCss = '1';
  document.head.appendChild(link);
}

// Illustrates "hosting limits about to run out": a server rack piping into a
// graduated glass capsule whose level sits just under the top mark (purple →
// orange → red), with a pulsing warning badge. Purely decorative (aria-hidden)
// — the only quantity it states is mirrored by donateVisualPct/Caption.
//
// Geometry notes (so the numbers aren't magic): the capsule's inner column runs
// y 98.5 → 197.5, i.e. 99 units = 100%. The fill is 93 units tall starting at
// y 104.5, which is the 94% the caption claims. The graduation ticks are placed
// at y = 197.5 − 0.99·p for p ∈ {12.5, 25 … 87.5}, long ones on the quarters.
const VISUAL_GAUGE = `
  <svg class="dn-gauge" width="168" height="210" viewBox="0 0 168 210" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="dn-g-fill" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="#8a6bff"/>
        <stop offset="45%" stop-color="#ff9a3c"/>
        <stop offset="100%" stop-color="#ff4d4d"/>
      </linearGradient>
      <linearGradient id="dn-g-glass" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#fff" stop-opacity=".18"/>
        <stop offset="38%" stop-color="#fff" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity=".22"/>
      </linearGradient>
      <linearGradient id="dn-g-shine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#fff" stop-opacity="0"/>
        <stop offset="50%" stop-color="#fff" stop-opacity=".38"/>
        <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="dn-g-rack" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2c2c35"/>
        <stop offset="100%" stop-color="#1e1e26"/>
      </linearGradient>
      <radialGradient id="dn-g-glow">
        <stop offset="0%" stop-color="#ff5c4d" stop-opacity=".45"/>
        <stop offset="100%" stop-color="#ff5c4d" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="dn-g-shadow">
        <stop offset="0%" stop-color="#000" stop-opacity=".5"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <pattern id="dn-g-dots" width="14" height="14" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="1.5" r="1" fill="#8a6bff" fill-opacity=".13"/>
      </pattern>
      <clipPath id="dn-g-clip"><rect x="62.5" y="98.5" width="35" height="99" rx="17.5"/></clipPath>
    </defs>

    <rect width="168" height="210" fill="url(#dn-g-dots)"/>
    <ellipse cx="80" cy="116" rx="66" ry="50" fill="url(#dn-g-glow)"/>
    <ellipse cx="80" cy="203" rx="32" ry="6" fill="url(#dn-g-shadow)"/>

    <circle class="dn-p dn-p1" cx="26" cy="122" r="2" fill="#8a6bff" fill-opacity=".5"/>
    <circle class="dn-p dn-p2" cx="142" cy="152" r="2.6" fill="#8a6bff" fill-opacity=".32"/>
    <circle class="dn-p dn-p3" cx="136" cy="84" r="1.8" fill="#ff9a3c" fill-opacity=".42"/>
    <circle class="dn-p dn-p4" cx="22" cy="172" r="1.6" fill="#8a6bff" fill-opacity=".3"/>

    <g stroke="#35353f" stroke-width="3" stroke-linecap="round">
      <path d="M70 74C70 88 76 88 76 102"/>
      <path d="M98 74C98 88 92 88 92 102"/>
    </g>

    <g>
      <rect x="42" y="8" width="84" height="20" rx="5" fill="url(#dn-g-rack)" stroke="#3b3b46"/>
      <circle class="dn-led dn-led1" cx="52" cy="18" r="2.6" fill="#8a6bff"/>
      <rect x="60" y="13.5" width="24" height="3" rx="1.5" fill="#36363f"/>
      <rect x="60" y="20" width="14" height="3" rx="1.5" fill="#2e2e37"/>
      <g fill="#2a2a33">
        <rect x="94" y="13" width="2.5" height="10" rx="1.25"/>
        <rect x="99" y="13" width="2.5" height="10" rx="1.25"/>
        <rect x="104" y="13" width="2.5" height="10" rx="1.25"/>
        <rect x="109" y="13" width="2.5" height="10" rx="1.25"/>
        <rect x="114" y="13" width="2.5" height="10" rx="1.25"/>
        <rect x="119" y="13" width="2.5" height="10" rx="1.25"/>
      </g>
    </g>
    <g>
      <rect x="42" y="31" width="84" height="20" rx="5" fill="url(#dn-g-rack)" stroke="#3b3b46"/>
      <circle class="dn-led dn-led2" cx="52" cy="41" r="2.6" fill="#ff9a3c"/>
      <rect x="60" y="36.5" width="20" height="3" rx="1.5" fill="#36363f"/>
      <rect x="60" y="43" width="27" height="3" rx="1.5" fill="#2e2e37"/>
      <g fill="#2a2a33">
        <rect x="94" y="36" width="2.5" height="10" rx="1.25"/>
        <rect x="99" y="36" width="2.5" height="10" rx="1.25"/>
        <rect x="104" y="36" width="2.5" height="10" rx="1.25"/>
        <rect x="109" y="36" width="2.5" height="10" rx="1.25"/>
        <rect x="114" y="36" width="2.5" height="10" rx="1.25"/>
        <rect x="119" y="36" width="2.5" height="10" rx="1.25"/>
      </g>
    </g>
    <g>
      <rect x="42" y="54" width="84" height="20" rx="5" fill="url(#dn-g-rack)" stroke="#3b3b46"/>
      <circle class="dn-led dn-led3" cx="52" cy="64" r="2.6" fill="#ff4d4d"/>
      <rect x="60" y="59.5" width="27" height="3" rx="1.5" fill="#36363f"/>
      <rect x="60" y="66" width="17" height="3" rx="1.5" fill="#2e2e37"/>
      <g fill="#2a2a33">
        <rect x="94" y="59" width="2.5" height="10" rx="1.25"/>
        <rect x="99" y="59" width="2.5" height="10" rx="1.25"/>
        <rect x="104" y="59" width="2.5" height="10" rx="1.25"/>
        <rect x="109" y="59" width="2.5" height="10" rx="1.25"/>
        <rect x="114" y="59" width="2.5" height="10" rx="1.25"/>
        <rect x="119" y="59" width="2.5" height="10" rx="1.25"/>
      </g>
    </g>

    <rect x="60" y="96" width="40" height="104" rx="20" fill="#1b1b21" stroke="#33333d" stroke-width="2"/>

    <g clip-path="url(#dn-g-clip)">
      <rect class="dn-gauge-fill" x="62.5" y="104.5" width="35" height="93" fill="url(#dn-g-fill)"/>
      <rect class="dn-gauge-meniscus" x="62.5" y="104.5" width="35" height="2.5" fill="#fff" fill-opacity=".45"/>
      <circle class="dn-bub dn-bub1" cx="72" cy="182" r="2.4" fill="#fff" fill-opacity=".3"/>
      <circle class="dn-bub dn-bub2" cx="86" cy="190" r="1.8" fill="#fff" fill-opacity=".26"/>
      <circle class="dn-bub dn-bub3" cx="79" cy="176" r="1.4" fill="#fff" fill-opacity=".22"/>
      <g stroke="#fff" stroke-opacity=".25" stroke-width="1.5" stroke-linecap="round">
        <path d="M64 185.1h6"/>
        <path d="M64 172.75h10"/>
        <path d="M64 160.4h6"/>
        <path d="M64 148h10"/>
        <path d="M64 135.6h6"/>
        <path d="M64 123.25h10"/>
        <path d="M64 110.9h6"/>
      </g>
      <rect class="dn-shimmer" x="52" y="98.5" width="14" height="99" fill="url(#dn-g-shine)"/>
    </g>
    <rect x="62.5" y="98.5" width="35" height="99" rx="17.5" fill="url(#dn-g-glass)"/>

    <circle class="dn-gauge-pulse" cx="101" cy="101" r="8.5" fill="#ff4d4d"/>
    <circle cx="101" cy="101" r="8.5" fill="#ff4d4d" stroke="#1a1725" stroke-width="2.5"/>
    <rect x="100" y="96.5" width="2" height="5.5" rx="1" fill="#fff"/>
    <circle cx="101" cy="104.6" r="1.2" fill="#fff"/>
  </svg>
`;

let overlay = null;
let lastFocused = null;

function buildDom() {
  overlay = document.createElement('div');
  overlay.className = 'dn-overlay';
  overlay.innerHTML = `
    <div class="dn-modal dn-modal--split" role="dialog" aria-modal="true" aria-labelledby="dn-title" tabindex="-1">
      <button type="button" class="dn-close" aria-label="${t('donateCloseAria')}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div class="dn-visual" aria-hidden="true">
        ${VISUAL_GAUGE}
        <div class="dn-visual-caption"><b>${t('donateVisualPct')}</b><span>${t('donateVisualCaption')}</span></div>
      </div>
      <div class="dn-body">
        <div class="dn-head">
          <h2 class="dn-title" id="dn-title">${t('donateTitle')}</h2>
          <p class="dn-text">${t('donateText')}</p>
        </div>
        <div class="dn-actions">
          <support-btn label="${t('donateCta')}"></support-btn>
          <button type="button" class="dn-btn dn-btn-ghost">${t('donateLater')}</button>
        </div>
      </div>
    </div>
  `;

  overlay.querySelector('.dn-close').addEventListener('click', close);
  overlay.querySelector('.dn-btn-ghost').addEventListener('click', close);
  // Donated (or at least went to the payment page) — back off for a few days.
  // <support-btn> renders its own inner .btn-support link synchronously on
  // connect (it's already `customElements.define`d by the time we appendChild
  // below), so it exists to query right after.
  overlay.querySelector('support-btn').addEventListener('click', () => {
    markDonated();
    close();
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  document.body.appendChild(overlay);
}

function onKeydown(e) {
  if (e.key === 'Escape') close();
}

export function openDonateModal() {
  ensureStyles();
  if (!overlay) buildDom();
  lastFocused = document.activeElement;
  overlay.classList.add('open');
  document.addEventListener('keydown', onKeydown);
  // Focus the dialog itself, not the payment link — a reflexive Enter after the
  // modal pops up should do nothing, not send the visitor to a checkout page.
  overlay.querySelector('.dn-modal')?.focus();
}

// Closing (crest, "not now", backdrop, Esc) does NOT snooze anything — the
// modal keeps showing on the normal cadence. Only markDonated() goes quiet.
function close() {
  if (!overlay) return;
  overlay.classList.remove('open');
  document.removeEventListener('keydown', onKeydown);
  if (lastFocused?.isConnected) lastFocused.focus();
  lastFocused = null;
}

document.addEventListener('tl:export', () => {
  if (hasDonated()) return;
  const next = (Number(read(KEY_COUNT)) || 0) + 1;
  write(KEY_COUNT, String(next));
  if ((next - 1) % EVERY_NTH !== 0) return;
  // Let the browser's own download/copy feedback land first.
  setTimeout(openDonateModal, 700);
});
