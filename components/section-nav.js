class SectionNav extends HTMLElement {
  connectedCallback() {
    const current = location.pathname.split('/').filter(Boolean)[0] ?? 'logos';

    const links = [
      { key: 'logos', label: 'Лого',   href: '/logos/' },
      { key: 'icons', label: 'Иконки', href: '/icons/' },
      { key: 'emoji', label: 'Эмодзи', href: '/emoji/' },
    ];

    this.innerHTML = links.map(({ key, label, href }) =>
      `<a href="${href}"${key === current ? ' class="active"' : ''}>${label}</a>`
    ).join('');
  }
}

customElements.define('section-nav', SectionNav);
