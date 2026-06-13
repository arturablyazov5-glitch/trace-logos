const _BASE = 'https://trace-logos.ru';

class SidebarContact extends HTMLElement {
  connectedCallback() {
    const section = ['emoji', 'icons', 'logos'].find(k => location.pathname.includes('/' + k)) ?? 'logos';
    const dataUrl = section === 'emoji' ? `${_BASE}/emoji-index.json` : `${_BASE}/logos-index.json`;
    const dataLabel = section === 'emoji' ? 'emoji-index.json' : 'logos-index.json';

    this.innerHTML = `
      <div class="sidebar-label">Поддержка</div>
      <a href="https://t.me/mansurov_rafael" target="_blank" rel="noopener">@mansurov_rafael</a>
      <div class="sidebar-label" style="margin-top:14px">For AI</div>
      <a href="${_BASE}/llms.txt" target="_blank" rel="noopener">llms.txt</a>
      <a href="${dataUrl}" target="_blank" rel="noopener">${dataLabel}</a>
    `;
  }
}

customElements.define('sidebar-contact', SidebarContact);
