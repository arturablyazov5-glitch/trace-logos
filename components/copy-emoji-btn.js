class CopyEmojiBtn extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <button class="btn btn-primary hidden" id="btn-copy-emoji">
        <span id="btn-copy-emoji-char" style="font-size:15px;line-height:1"></span>
        <span>Скопировать символ</span>
      </button>
    `;
  }
}

customElements.define('copy-emoji-btn', CopyEmojiBtn);
