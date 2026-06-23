class SectionNav extends HTMLElement {
  connectedCallback() {
    const base  = this.getAttribute('base') ?? '../';
    const isEn  = location.pathname.startsWith('/en/');
    const lang  = (typeof window.__LANG__ === 'string' ? window.__LANG__ : (isEn ? 'en' : 'ru'));
    const current = ['logos', 'icons', 'emoji'].find(k => location.pathname.includes('/' + k)) ?? 'logos';

    const links = [
      { key: 'logos', ru: 'Лого',   en: 'Logos',  href: isEn ? '/en/logos/' : base + 'logos/' },
      { key: 'icons', ru: 'Иконки', en: 'Icons',  href: isEn ? '/en/icons/' : base + 'icons/' },
      { key: 'emoji', ru: 'Эмодзи', en: 'Emoji',  href: isEn ? '/en/emoji/' : base + 'emoji/' },
    ];

    this.innerHTML = links.map(({ key, ru, en, href }) =>
      `<a href="${href}"${key === current ? ' class="active"' : ''}>${lang === 'en' ? en : ru}</a>`
    ).join('');
  }
}

customElements.define('section-nav', SectionNav);
