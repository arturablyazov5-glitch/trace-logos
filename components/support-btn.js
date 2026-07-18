const SUPPORT_BASE_URL = 'https://app.lava.top/products/6f3c8efd-27c3-41a8-acb1-559b83ea3b46/d9261f0e-d716-418c-b91d-764e83f1c01c?currency=';
const SUPPORT_LABELS = { ru: 'Поблагодарить автора', en: 'Support the author' };

class SupportBtn extends HTMLElement {
  connectedCallback() {
    const lang = (typeof window.__LANG__ === 'string' ? window.__LANG__ : null)
      || (location.pathname.startsWith('/en/') ? 'en' : 'ru');
    const label = SUPPORT_LABELS[lang] ?? SUPPORT_LABELS.ru;
    const currency = lang === 'en' ? 'USD' : 'RUB';
    this.innerHTML = `
      <a class="btn-support" href="${SUPPORT_BASE_URL}${currency}" target="_blank" rel="noopener noreferrer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        ${label}
      </a>
    `;
  }
}

customElements.define('support-btn', SupportBtn);
