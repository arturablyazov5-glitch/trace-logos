const _siteBase = (() => {
  const src = document.currentScript?.src || '';
  return src.replace(/components\/[^/]*$/, '') || '/';
})();

class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.render('загрузка...');
    if (typeof window.__logosReadyCount === 'number') {
      this.render(this.iconCountText(window.__logosReadyCount));
    } else {
      const handler = (e) => {
        this.render(this.iconCountText(e.detail));
        document.removeEventListener('logos-count-ready', handler);
      };
      document.addEventListener('logos-count-ready', handler);
    }
  }

  iconCountText(count) {
    const section = location.pathname.split('/').filter(Boolean)[0] ?? 'logos';
    if (section === 'emoji') return `${count} эмодзи`;
    if (section === 'logos') {
      const mod100 = Math.abs(count) % 100;
      const mod10 = mod100 % 10;
      if (mod100 >= 11 && mod100 <= 14) return `${count} логотипов`;
      if (mod10 === 1) return `${count} логотип`;
      if (mod10 >= 2 && mod10 <= 4) return `${count} логотипа`;
      return `${count} логотипов`;
    }
    const mod100 = Math.abs(count) % 100;
    const mod10 = mod100 % 10;
    if (mod100 >= 11 && mod100 <= 14) return `${count} иконок`;
    if (mod10 === 1) return `${count} иконка`;
    if (mod10 >= 2 && mod10 <= 4) return `${count} иконки`;
    return `${count} иконок`;
  }

  render(subtitle) {
    const variant = this.getAttribute('variant') || 'topbar';
    const isSidebar = variant === 'sidebar';
    const isBrand = variant === 'brand';
    const rootClass = isSidebar ? 'sidebar-header' : 'topbar';
    const backLink = isSidebar ? '' : `<a class="back-link" href="${_siteBase}">← Вернуться в каталог</a>`;
    const brand = `
      <a class="brand" href="${_siteBase}" aria-label="Trace Logo's, на главную">
        <span class="sidebar-logo">
          <img src="${_siteBase}assets/brand/logo.svg" alt="" width="32" height="32">
        </span>
        <span class="sidebar-header-text">
          <span class="sidebar-header-row">
            <span class="sidebar-header-name">Trace Logo's</span>
            <span class="sidebar-header-badge">Beta</span>
          </span>
          <span class="sidebar-header-sub">${subtitle}</span>
        </span>
      </a>
    `;

    this.shadowRoot.innerHTML = `
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :host { display: block; }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          height: 57px;
          padding: 0 18px;
          border-bottom: 1px solid #222;
          background: #161616;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 57px;
          min-height: 57px;
          padding: 0 12px;
          border-bottom: 1px solid #222;
          background: #161616;
          overflow: hidden;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          color: #fff;
          text-decoration: none;
        }

        .sidebar-logo {
          width: 32px;
          height: 32px;
          min-width: 32px;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sidebar-logo img { width: 100%; height: 100%; display: block; object-fit: cover; }

        .sidebar-header-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }

        .sidebar-header-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .sidebar-header-name {
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
        }

        .sidebar-header-badge {
          font-size: 10px;
          font-weight: 600;
          color: #888;
          background: #222;
          border-radius: 16px;
          padding: 3px 6px;
          white-space: nowrap;
        }

        .sidebar-header-sub {
          font-size: 11px;
          color: #555;
          white-space: nowrap;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 34px;
          padding: 0 12px;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          color: #ddd;
          background: #1e1e1e;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 13px;
          text-decoration: none;
          white-space: nowrap;
        }

        .back-link:hover {
          border-color: #444;
          color: #fff;
          background: #242424;
        }

        @media (max-width: 820px) {
          .topbar { padding: 0 12px; }
        }
      </style>

      ${isBrand ? brand : `<nav class="${rootClass}" aria-label="Навигация">${brand}${backLink}</nav>`}
    `;
  }
}

customElements.define('site-header', SiteHeader);
