class SectionNav extends HTMLElement {
  connectedCallback() {
    const base    = this.getAttribute('base') ?? '../';
    const current = ['logos', 'icons', 'emoji'].find(k => location.pathname.includes('/' + k)) ?? 'logos';

    const links = [
      { key: 'logos', label: 'Лого',   href: base + 'logos/' },
      { key: 'icons', label: 'Иконки', href: base + 'icons/' },
      { key: 'emoji', label: 'Эмодзи', href: base + 'emoji/' },
    ];

    this.innerHTML = links.map(({ key, label, href }) =>
      `<a href="${href}"${key === current ? ' class="active"' : ''}>${label}</a>`
    ).join('');
  }
}

customElements.define('section-nav', SectionNav);
