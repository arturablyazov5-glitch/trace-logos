const BASE = 'https://rafael-mansurov.github.io/trace-logos';

class AiFooter extends HTMLElement {
  connectedCallback() {
    const section = ['emoji', 'icons', 'logos'].find(k => location.pathname.includes('/' + k)) ?? 'logos';
    const dataUrl = section === 'emoji'
      ? `${BASE}/emoji-index.json`
      : `${BASE}/logos-index.json`;
    const dataLabel = section === 'emoji' ? 'emoji-index.json' : 'logos-index.json';

    this.style.cssText = 'display:block;text-align:center;padding:20px 24px;font-size:12px;color:var(--text-4);border-top:1px solid var(--line)';
    this.innerHTML = `For AI agents: <a href="${BASE}/llms.txt" style="color:var(--text-4)">llms.txt</a> · <a href="${dataUrl}" style="color:var(--text-4)">${dataLabel}</a>`;
  }
}

customElements.define('ai-footer', AiFooter);
