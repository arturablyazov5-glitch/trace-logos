const SUPPORT_BASE_URL = 'https://app.lava.top/products/6f3c8efd-27c3-41a8-acb1-559b83ea3b46/d9261f0e-d716-418c-b91d-764e83f1c01c?currency=';
const SUPPORT_LABELS = { ru: 'Поблагодарить автора', en: 'Support the author', es: 'Apoyar al autor' };

class SupportBtn extends HTMLElement {
  connectedCallback() {
    const lang = (typeof window.__LANG__ === 'string' ? window.__LANG__ : null)
      || (['en', 'es'].includes(location.pathname.split('/').filter(Boolean)[0])
        ? location.pathname.split('/').filter(Boolean)[0]
        : 'ru')
      || 'ru';
    const label = this.getAttribute('label') || SUPPORT_LABELS[lang] || SUPPORT_LABELS.ru;
    const currency = lang === 'ru' ? 'RUB' : 'USD';
    this.innerHTML = `
      <a class="btn-support" href="${SUPPORT_BASE_URL}${currency}" target="_blank" rel="noopener noreferrer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        ${label}
      </a>
    `;
  }
}

// Loaded two ways on different pages: a classic <script defer> tag (most
// generated pages) and a plain side-effect `import` from js/donate.js (the
// modal reuses this component, see donate.js buildDom()) — the guard is
// because either one might already have run by the time the other loads.
if (!customElements.get('support-btn')) customElements.define('support-btn', SupportBtn);
