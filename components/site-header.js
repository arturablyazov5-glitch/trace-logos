class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.render('загрузка...');
    this.updateCount();
  }

  async updateCount() {
    try {
      const response = await fetch('/logos.json');
      const groups = await response.json();
      const count = groups.reduce((sum, group) => sum + (group.items?.length || 0), 0);
      this.render(this.iconCountText(count));
    } catch {
      this.render('каталог иконок');
    }
  }

  iconCountText(count) {
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
    const backLink = isSidebar ? '' : '<a class="back-link" href="/">← Вернуться в каталог</a>';
    const brand = `
      <a class="brand" href="/" aria-label="Icons, на главную">
        <span class="sidebar-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.9844 2.13613C12.4512 1.60535 14 2.69196 14 4.25188V4.42892L7.47401 6.79038C5.98917 7.32768 5 8.73756 5 10.3166V15.8704C3.5378 16.3879 2 15.3035 2 13.7491V7.6674C2 6.29888 2.85728 5.07698 4.14414 4.61132L10.9844 2.13613ZM14.9844 5.1362C16.4512 4.60541 18 5.69202 18 7.25194V7.42896L11.1441 9.90979C9.85728 10.3754 9 11.5973 9 12.9659V18.8705C7.5378 19.388 6 18.3035 6 16.7491V10.3167C6 9.15868 6.72539 8.12477 7.81427 7.73075L14.9844 5.1362ZM18.9844 8.13618C20.4512 7.60539 22 8.692 22 10.2519V17.0352C22 17.9826 21.4065 18.8286 20.5156 19.1509L13.0156 21.8649C11.5488 22.3956 10 21.309 10 19.7491V12.9658C10 12.0184 10.5935 11.1725 11.4844 10.8501L18.9844 8.13618Z" fill="#111"/>
          </svg>
        </span>
        <span class="sidebar-header-text">
          <span class="sidebar-header-row">
            <span class="sidebar-header-name">Icons</span>
            <span class="sidebar-header-badge">Beta</span>
          </span>
          <span class="sidebar-header-sub">${subtitle}</span>
        </span>
      </a>
    `;

    this.shadowRoot.innerHTML = `
      <style>
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
          background: #fff;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sidebar-logo svg { display: block; }

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
          border-radius: 5px;
          padding: 1px 6px;
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
