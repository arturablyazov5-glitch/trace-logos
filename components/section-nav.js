class SectionNav extends HTMLElement {
  connectedCallback() {
    const base  = this.getAttribute('base') ?? '../';
    const pathLang = location.pathname.split('/').filter(Boolean)[0];
    const lang  = (typeof window.__LANG__ === 'string' ? window.__LANG__ : null)
      || (['en', 'es'].includes(pathLang) ? pathLang : 'ru');
    const prefix = lang === 'ru' ? '' : `/${lang}`;
    const current = ['logos', 'icons', 'emoji'].find(k => location.pathname.includes('/' + k)) ?? 'logos';

    const links = [
      { key: 'logos', ru: 'Лого',   en: 'Logos', es: 'Logos',  href: prefix ? `${prefix}/logos/` : base + 'logos/' },
      { key: 'icons', ru: 'Иконки', en: 'Icons', es: 'Iconos', href: prefix ? `${prefix}/icons/` : base + 'icons/' },
      { key: 'emoji', ru: 'Эмодзи', en: 'Emoji', es: 'Emoji',  href: prefix ? `${prefix}/emoji/` : base + 'emoji/' },
    ];

    this.innerHTML = links.map(({ key, ru, en, es, href }) =>
      `<a href="${href}"${key === current ? ' class="active"' : ''}>${({ en, es })[lang] ?? ru}</a>`
    ).join('');
  }
}

customElements.define('section-nav', SectionNav);
