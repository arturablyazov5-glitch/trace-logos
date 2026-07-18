/**
 * 1) Оверлей «замок + кнопка оплаты»: <div data-paywall data-paywall-config="KEY" …></div>
 * 2) Кнопки «Копировать» + основная в тулбаре code-block:
 *    <div class="code-toolbar-right" data-paywall-toolbar …></div>
 * 3) Заглушка вместо «кода» под paywall (Windows install, macOS .workflow и т.п.):
 *    <pre class="preview-readonly paywall-decoy-pre" data-paywall-decoy-pre
 *         data-paywall-decoy-config="KEY"></pre>
 *    KEY — то же поле APP_CONFIG, что у соседнего data-paywall (ссылка в тексте ведёт туда).
 * Остальное: «Копировать» в тулбаре тоже открывает URL из APP_CONFIG.
 *
 * Иконки — Lucide (<i data-lucide>), как на остальных страницах. Скрипт грузится
 * с defer и на onload вызывает createIcons(); до этого в DOM лежат плейсхолдеры <i>.
 */
(function (global) {
  'use strict';

  var DEFAULT_LABEL = 'Купить за\u00a0100 ₽';

  var LUCIDE_TOOLBAR_ICON_STYLE = 'width:13px;height:13px;stroke-width:2';

  function lucideIcon(name, style, className) {
    var i = document.createElement('i');
    i.setAttribute('data-lucide', name);
    i.setAttribute('aria-hidden', 'true');
    if (style) i.setAttribute('style', style);
    if (className) i.className = className;
    return i;
  }

  function paintPaywallLucideIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  /** Общий текст под размытием вместо фейкового превью скрипта / workflow; ссылка в конце из APP_CONFIG. */
  var PAYWALL_DECOY_STORY_BEFORE_LINK =
    'Драсте. Ты чего сюда залез? Висит же замочек)) Это не случайность — сюда специально не кладут настоящий код, иначе замок был бы просто декором. Разглядывать через блюр тоже можно, но это уже спорт не из олимпийской программы. А если так так сильно хочется — тыкни на кнопку выше и получи скрипт.\n\n' +
    'Вообще на самом деле скрипт огонь. Помогает в работе мне каждый день. Тебе я уверен тоже спасет часы жизни и нервов. Та и цена совсем символическая. 100 рублей всего то. Жалко что-ли) Так еще ты сможешь сам доработать его под свои задачи. Круто же? Не используются какие-то супер сложные механики, весь код легко читаемый — разберется любой. Скачай и пользуйся сколько хочешь без интернета.\n\n' +
    'Все, давай. Обнял, приподнял. ';

  function safeId(raw) {
    if (!raw) return '';
    var s = String(raw).trim();
    if (!/^[a-zA-Z][\w-]*$/.test(s)) return '';
    return s;
  }

  function openPaywallUrl(url) {
    var win = window.open(url, '_blank', 'noopener,noreferrer');
    if (win) win.opener = null;
  }

  function initPaywallDecoyPres() {
    if (typeof APP_CONFIG === 'undefined') return;

    var nodes = document.querySelectorAll('pre[data-paywall-decoy-pre]:not([data-paywall-decoy-done])');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var key = el.getAttribute('data-paywall-decoy-config');
      if (!key || !Object.prototype.hasOwnProperty.call(APP_CONFIG, key)) continue;
      var url = APP_CONFIG[key];
      if (typeof url !== 'string' || !url) continue;

      el.setAttribute('data-paywall-decoy-done', '1');
      el.setAttribute('aria-hidden', 'true');
      el.textContent = '';

      el.appendChild(document.createTextNode(PAYWALL_DECOY_STORY_BEFORE_LINK));

      var a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'paywall-decoy-cta';
      a.textContent = 'Купить скрипт за 100 ₽';
      el.appendChild(a);

      el.appendChild(document.createTextNode('.'));
    }
  }

  function initPaywallToolbars() {
    if (typeof APP_CONFIG === 'undefined') return;

    var nodes = document.querySelectorAll('[data-paywall-toolbar]:not([data-paywall-toolbar-done])');
    for (let i = 0; i < nodes.length; i++) {
      let el = nodes[i];
      let key = el.getAttribute('data-paywall-config');
      if (!key || !Object.prototype.hasOwnProperty.call(APP_CONFIG, key)) continue;
      let url = APP_CONFIG[key];
      if (typeof url !== 'string' || !url) continue;

      var mode = (el.getAttribute('data-paywall-primary') || 'disabled').trim().toLowerCase();
      if (mode !== 'disabled' && mode !== 'open' && mode !== 'link') mode = 'disabled';

      var primaryLabel = el.getAttribute('data-paywall-primary-label');
      if (primaryLabel == null || primaryLabel === '') {
        primaryLabel = mode === 'open' ? 'Скачать' : 'Скачать .workflow';
      }

      el.setAttribute('data-paywall-toolbar-done', '1');
      el.textContent = '';

      var copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'btn btn-ghost';
      copyBtn.setAttribute('aria-label', 'Копировать');
      copyBtn.appendChild(lucideIcon('copy', LUCIDE_TOOLBAR_ICON_STYLE));
      copyBtn.appendChild(document.createTextNode(' Копировать'));
      copyBtn.addEventListener('click', function () {
        openPaywallUrl(url);
      });
      el.appendChild(copyBtn);

      var primaryEl;
      if (mode === 'disabled') {
        primaryEl = document.createElement('a');
        primaryEl.className = 'btn btn-primary';
        primaryEl.href = '#';
        primaryEl.setAttribute('aria-disabled', 'true');
        primaryEl.appendChild(lucideIcon('download', LUCIDE_TOOLBAR_ICON_STYLE));
        primaryEl.appendChild(document.createTextNode(' ' + primaryLabel));
        primaryEl.addEventListener('click', function (e) {
          e.preventDefault();
          return false;
        });
      } else if (mode === 'open') {
        primaryEl = document.createElement('button');
        primaryEl.type = 'button';
        primaryEl.className = 'btn btn-primary';
        primaryEl.appendChild(lucideIcon('download', LUCIDE_TOOLBAR_ICON_STYLE));
        primaryEl.appendChild(document.createTextNode(' ' + primaryLabel));
        primaryEl.addEventListener('click', function () {
          openPaywallUrl(url);
        });
      } else {
        primaryEl = document.createElement('a');
        primaryEl.className = 'btn btn-primary';
        primaryEl.href = url;
        primaryEl.target = '_blank';
        primaryEl.rel = 'noopener noreferrer';
        primaryEl.appendChild(lucideIcon('download', LUCIDE_TOOLBAR_ICON_STYLE));
        primaryEl.appendChild(document.createTextNode(' ' + primaryLabel));
        var pid = safeId(el.getAttribute('data-paywall-primary-id'));
        if (pid) primaryEl.id = pid;
      }
      el.appendChild(primaryEl);
    }
  }

  function initPaywallBlocks() {
    if (typeof APP_CONFIG === 'undefined') return;

    var nodes = document.querySelectorAll('[data-paywall]:not([data-paywall-rendered])');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var key = el.getAttribute('data-paywall-config');
      if (!key || !Object.prototype.hasOwnProperty.call(APP_CONFIG, key)) continue;
      var url = APP_CONFIG[key];
      if (typeof url !== 'string' || !url) continue;

      var sectionId = safeId(el.getAttribute('data-paywall-section-id'));
      var ctaId = safeId(el.getAttribute('data-paywall-cta-id'));
      var labelAttr = el.getAttribute('data-paywall-label');
      var label = labelAttr != null && labelAttr !== '' ? labelAttr : DEFAULT_LABEL;

      el.setAttribute('data-paywall-rendered', '1');

      var overlay = document.createElement('div');
      overlay.className = 'paywall-overlay';
      overlay.style.display = 'flex';
      if (sectionId) overlay.id = sectionId;

      overlay.appendChild(
        lucideIcon(
          'lock',
          'width:32px;height:32px;color:rgba(255,255,255,0.85);stroke-width:1.8',
          'paywall-lock-icon'
        )
      );

      var a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'btn btn-primary paywall-cta';
      if (ctaId) a.id = ctaId;
      a.textContent = label;
      overlay.appendChild(a);

      el.parentNode.replaceChild(overlay, el);
    }
  }

  function bootPaywall() {
    initPaywallDecoyPres();
    initPaywallToolbars();
    initPaywallBlocks();
    paintPaywallLucideIcons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootPaywall);
  } else {
    bootPaywall();
  }

  global.initPaywallDecoyPres = initPaywallDecoyPres;
  global.initPaywallToolbars = initPaywallToolbars;
  global.initPaywallBlocks = initPaywallBlocks;
  global.bootPaywall = bootPaywall;
})(typeof window !== 'undefined' ? window : this);
