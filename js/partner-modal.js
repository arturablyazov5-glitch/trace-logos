// Partnership prompt. The embed-copy caller owns the display cadence.
import { t, getLang } from './i18n.js';
import { ensureStyles } from './donate.js';
import { VISUAL_PARTNER } from './partner-visual.js';

const BADGE_URL = 'https://trace-logos.ru/assets/partnership/badge-dark.svg';
const PARTNER_URL = 'https://trace-logos.ru/?utm_source=your-service';
let overlay = null;
let lastFocused = null;
let copyTimer = null;

export function markPartnerDone() {
  try { sessionStorage.setItem('tl_partner_done', '1'); } catch { /* storage unavailable */ }
}

function ensurePartnerStyles() {
  ensureStyles();
  for (const [marker, path] of [
    ['data-partner-css', '../css/partner.css'],
    ['data-partner-visual-css', '../css/partner-visual.css'],
  ]) {
    if (marker === 'data-partner-visual-css' && !window.matchMedia('(min-width: 641px)').matches) continue;
    if (document.querySelector(`link[${marker}]`)) continue;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL(path, import.meta.url).href;
    link.setAttribute(marker, '1');
    document.head.appendChild(link);
  }
}

function resetCopy() {
  clearTimeout(copyTimer);
  const button = overlay.querySelector('.pt-copy');
  button.disabled = false;
  button.textContent = t('partnerCopy');
}

function buildDom() {
  overlay = document.createElement('div');
  overlay.className = 'dn-overlay pt-overlay';
  overlay.innerHTML = `
    <div class="dn-modal dn-modal--split pt-modal" role="dialog" aria-modal="true" aria-labelledby="pt-title" aria-describedby="pt-description" tabindex="-1">
      <button type="button" class="dn-close" aria-label="${t('partnerCloseAria')}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div class="dn-visual pt-visual" aria-hidden="true">${VISUAL_PARTNER}</div>
      <div class="dn-body pt-body">
        <div class="dn-head">
          <h2 class="dn-title" id="pt-title">${t('partnerTitle')}</h2>
          <p class="dn-text" id="pt-description"><span>${t('partnerText')}</span><span>${t('partnerRequest')}</span></p>
        </div>
        <div class="pt-preview"><img src="${BADGE_URL}" alt="${t('partnerBadgeAlt')}" width="199" height="63"></div>
        <div class="pt-actions">
          <button type="button" class="dn-btn pt-copy" aria-live="polite">${t('partnerCopy')}</button>
          <div class="pt-secondary">
            <a class="pt-terms" href="${getLang() === 'ru' ? '/partnership/' : '/en/partnership/'}" target="_blank" rel="noopener noreferrer">${t('partnerTerms')}</a>
            <button type="button" class="pt-later">${t('partnerLater')}</button>
          </div>
        </div>
      </div>
    </div>
  `;
  const alt = t('partnerBadgeAlt').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const embedCode = `<a href="${PARTNER_URL}">\n  <img src="${BADGE_URL}" alt="${alt}" width="199" height="63">\n</a>`;
  overlay.querySelector('.pt-copy').addEventListener('click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await navigator.clipboard.writeText(embedCode);
      markPartnerDone();
      button.textContent = t('partnerCopied');
    } catch {
      button.textContent = t('partnerCopyError');
      button.disabled = false;
    }
    clearTimeout(copyTimer);
    copyTimer = setTimeout(resetCopy, 2000);
  });
  overlay.querySelector('.dn-close').addEventListener('click', close);
  overlay.querySelector('.pt-later').addEventListener('click', close);
  overlay.querySelector('.pt-terms').addEventListener('click', () => {
    markPartnerDone();
    close();
  });
  overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
  document.body.appendChild(overlay);
  window.matchMedia('(min-width: 641px)').addEventListener('change', event => {
    if (event.matches && overlay.classList.contains('open')) ensurePartnerStyles();
  });
}

function onKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault();
    close();
  } else if (event.key === 'Tab') {
    const controls = [...overlay.querySelectorAll('a[href], button:not(:disabled)')];
    const first = controls[0];
    const last = controls[controls.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === overlay.querySelector('.pt-modal'))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}

export function openPartnerModal() {
  ensurePartnerStyles();
  if (!overlay) buildDom();
  if (overlay.classList.contains('open')) return;
  lastFocused = document.activeElement;
  resetCopy();
  overlay.classList.add('open');
  document.addEventListener('keydown', onKeydown);
  overlay.querySelector('.pt-modal').focus();
}

function close() {
  if (!overlay) return;
  overlay.classList.remove('open');
  document.removeEventListener('keydown', onKeydown);
  resetCopy();
  if (lastFocused?.isConnected) lastFocused.focus();
  lastFocused = null;
}
