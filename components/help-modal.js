// ─────────────────────────────────────────────────────────────────────────────
// <help-modal> — модалка «Помочь с иконкой» (один источник правды).
// Рантайм-компонент без shadow DOM: разметка в light DOM, поэтому help.js
// продолжает находить элементы через document.getElementById.
// Одно мульти-поле: до 5 SVG-файлов за раз.
// ─────────────────────────────────────────────────────────────────────────────
class HelpModal extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
<div class="suggest-overlay" id="help-overlay">
  <div class="suggest-modal" role="dialog" aria-modal="true" aria-labelledby="help-title">
    <button class="suggest-close" id="help-close" aria-label="Закрыть">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
        <path d="M18 6 6 18M6 6l12 12"/>
      </svg>
    </button>
    <div class="suggest-modal-header">
      <div id="help-modal-titles">
        <div class="suggest-modal-title" id="help-title">Помочь с иконкой</div>
        <div class="suggest-modal-sub">Вы помогаете автору. Загрузите SVG для <strong id="help-icon-name"></strong></div>
      </div>
    </div>
    <form id="help-form" class="suggest-fields" style="margin-top:4px">
      <div class="suggest-field">
        <label class="suggest-label">SVG-файлы <span style="color:#e06060">*</span> <span style="color:#555">— до 5 штук (favicon, full и др.)</span></label>
        <label class="suggest-file-label" id="help-file-label" for="help-file-input">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span id="help-file-name">Выбрать SVG-файлы</span>
          <input type="file" accept=".svg,image/svg+xml" id="help-file-input" class="suggest-file-input" multiple>
        </label>
        <div class="help-file-chips" id="help-file-chips"></div>
      </div>
      <p id="help-error" style="display:none;color:#e06060;font-size:13px;margin:0 0 4px"></p>
      <button type="submit" class="suggest-submit">Отправить</button>
    </form>
    <div class="suggest-success" id="help-success">
      <svg class="t-form-success-popup__content-icon"
           xmlns="http://www.w3.org/2000/svg" width="41" height="41" fill="none" viewBox="0 0 210 210">
        <path class="t-form-success-popup__content-icon-background"
              d="M 86.0696 10.2777 C 97.7443 -0.973851 116.104 -0.973851 127.779 10.2777 C 133.881 16.1585 142.136 19.1954 150.551 18.6547 C 166.65 17.6203 180.714 29.5482 182.502 45.7521 C 183.436 54.2214 187.829 61.9111 194.619 66.9636 C 207.609 76.6302 210.798 94.9049 201.862 108.479 C 197.191 115.574 195.665 124.318 197.653 132.6 C 201.457 148.445 192.277 164.515 176.799 169.108 C 168.709 171.509 161.979 177.216 158.235 184.852 C 151.072 199.461 133.819 205.807 119.041 199.27 C 111.317 195.853 102.532 195.853 94.8075 199.27 C 80.0294 205.807 62.7766 199.461 55.6135 184.852 C 51.8695 177.216 45.1396 171.509 37.0495 169.108 C 21.5714 164.515 12.3913 148.445 16.1948 132.6 C 18.1828 124.318 16.6573 115.574 11.9867 108.479 C 3.05084 94.9049 6.23902 76.6302 19.2295 66.9636 C 26.0194 61.9111 30.4119 54.2214 31.3462 45.7521 C 33.1339 29.5482 47.1984 17.6203 63.2976 18.6547 C 71.7122 19.1954 79.9676 16.1585 86.0696 10.2777 Z"
              fill="#30C546"></path>
        <path class="t-form-success-popup__content-icon-check"
              d="M 66.7645 107.258 L 90.6617 129.843 L 143.235 80.157"
              stroke="white" stroke-width="14.7059" stroke-linecap="round" stroke-linejoin="round" fill="none" pathLength="1"></path>
      </svg>
      <div class="suggest-success-title">Спасибо!</div>
    </div>
  </div>
</div>`;
  }
}
customElements.define('help-modal', HelpModal);
