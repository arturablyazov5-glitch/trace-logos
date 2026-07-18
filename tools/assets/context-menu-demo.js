(function () {
  'use strict';

  var DEMO_HTML =
    '<div class="ctxd">' +
      '<div class="ctxd-scene">' +
        '<div class="ctxd-menu ctxd-main">' +
          '<div class="ctxd-item"><span class="ctxd-ico"><i data-lucide="square-arrow-out-up-right"></i></span>Открыть</div>' +
          '<div class="ctxd-sep"></div>' +
          '<div class="ctxd-item"><span class="ctxd-ico"><i data-lucide="trash-2"></i></span>Переместить в Корзину</div>' +
          '<div class="ctxd-sep"></div>' +
          '<div class="ctxd-item"><span class="ctxd-ico"><i data-lucide="info"></i></span>Свойства</div>' +
          '<div class="ctxd-item"><span class="ctxd-ico"><i data-lucide="pencil"></i></span>Переименовать</div>' +
          '<div class="ctxd-item"><span class="ctxd-ico"><i data-lucide="archive"></i></span>Сжать файл</div>' +
          '<div class="ctxd-item"><span class="ctxd-ico"><i data-lucide="copy"></i></span>Дублировать</div>' +
          '<div class="ctxd-item"><span class="ctxd-ico"><i data-lucide="eye"></i></span>Быстрый просмотр</div>' +
          '<div class="ctxd-sep"></div>' +
          '<div class="ctxd-item"><span class="ctxd-ico"><i data-lucide="clipboard"></i></span>Скопировать</div>' +
          '<div class="ctxd-item"><span class="ctxd-ico"><i data-lucide="share-2"></i></span>Поделиться...</div>' +
          '<div class="ctxd-sep"></div>' +
          '<div class="ctxd-tags">' +
            '<div class="ctxd-dot" style="background:#ff5c5c"></div>' +
            '<div class="ctxd-dot" style="background:#ff9f0a"></div>' +
            '<div class="ctxd-dot" style="background:#ffd60a"></div>' +
            '<div class="ctxd-dot" style="background:#30d158"></div>' +
            '<div class="ctxd-dot" style="background:#0a84ff"></div>' +
            '<div class="ctxd-dot" style="background:#bf5af2"></div>' +
            '<div class="ctxd-dot" style="background:#98989d"></div>' +
          '</div>' +
          '<div class="ctxd-item"><span class="ctxd-ico"><i data-lucide="tag"></i></span>Теги...</div>' +
          '<div class="ctxd-sep"></div>' +
          '<div class="ctxd-item ctxd-anim1"><span class="ctxd-ico"><i data-lucide="zap"></i></span>Быстрые действия<span class="ctxd-chev">›</span></div>' +
        '</div>' +
        '<div class="ctxd-menu ctxd-sub">' +
          '<div class="ctxd-item"><span class="ctxd-ico"><i data-lucide="rotate-ccw"></i></span>Повернуть влево</div>' +
          '<div class="ctxd-item"><span class="ctxd-ico"><i data-lucide="highlighter"></i></span>Разметить</div>' +
          '<div class="ctxd-item"><span class="ctxd-ico"><i data-lucide="file-text"></i></span>Создать PDF</div>' +
          '<div class="ctxd-item"><span class="ctxd-ico"><i data-lucide="image"></i></span>Преобразовать изображение</div>' +
          '<div class="ctxd-item"><span class="ctxd-ico"><i data-lucide="eraser"></i></span>Удалить фон</div>' +
          '<div class="ctxd-item ctxd-anim2"><span class="ctxd-ico"><i data-lucide="image-down"></i></span><span class="ctxd-action-label"></span></div>' +
          '<div class="ctxd-sep"></div>' +
          '<div class="ctxd-item ctxd-muted"><span class="ctxd-ico"><i data-lucide="settings-2"></i></span>Настроить...</div>' +
        '</div>' +
        '<div class="ctxd-ann ctxd-ann1">Открываем «Быстрые<br>действия» →</div>' +
        '<div class="ctxd-ann ctxd-ann2"></div>' +
      '</div>' +
      '<div class="ctxd-cur">' +
        '<svg width="20" height="22" viewBox="-1 -1 13 14" fill="none">' +
          '<path d="M10.3078 3.50996L1.36136 0.0690367C0.55262 -0.242018 -0.242018 0.552618 0.0690365 1.36136L3.60753 10.5614C3.9485 11.448 5.21732 11.4044 5.49665 10.4965L6.63388 6.80056C6.73686 6.46587 7.00741 6.20943 7.34712 6.1245L10.1913 5.41345C11.1391 5.1765 11.2196 3.86068 10.3078 3.50996Z" fill="#14b8a6" stroke="white" stroke-width="0.9" stroke-linejoin="round" stroke-linecap="round"/>' +
        '</svg>' +
        '<div class="ctxd-cur-label"></div>' +
      '</div>' +
      '<div class="ctxd-done">' +
        '<div class="ctxd-done-row">' +
          '<span class="ctxd-done-badge">' +
            '<i data-lucide="check" aria-hidden="true"></i>' +
          '</span>' +
          'Готово' +
        '</div>' +
        '<div class="ctxd-sep-done"></div>' +
        '<div class="ctxd-done-sub"></div>' +
      '</div>' +
    '</div>';

  function paintLucideIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function bindCursorDemo(cursorDemoRoot) {
    var cursorNameBadge = cursorDemoRoot.querySelector('.ctxd-cur-label');
    var cursorAnimEl = cursorDemoRoot.querySelector('.ctxd-cur');
    var cursorCycleCount = 1;
    var cursorMessageIndex = 0;

    function setRandomCursorName() {
      if (!cursorNameBadge) return;
      var source = Array.isArray(window.CONTEXT_MENU_DEMO_NAMES) ? window.CONTEXT_MENU_DEMO_NAMES : [];
      var palette = Array.isArray(window.CONTEXT_MENU_DEMO_CURSOR_COLORS) ? window.CONTEXT_MENU_DEMO_CURSOR_COLORS : [];
      var messages = Array.isArray(window.CONTEXT_MENU_DEMO_MESSAGES) ? window.CONTEXT_MENU_DEMO_MESSAGES : [];
      var shouldShowMessage =
        cursorCycleCount > 0 &&
        cursorCycleCount % 3 === 0 &&
        cursorMessageIndex < messages.length;
      if (shouldShowMessage) {
        cursorNameBadge.textContent = messages[cursorMessageIndex];
        cursorNameBadge.classList.add('is-message');
        cursorMessageIndex += 1;
      } else if (source.length) {
        var idx = Math.floor(Math.random() * source.length);
        cursorNameBadge.textContent = source[idx];
        cursorNameBadge.classList.remove('is-message');
      }
      if (palette.length) {
        var colorIdx = Math.floor(Math.random() * palette.length);
        cursorDemoRoot.style.setProperty('--cursor-accent', palette[colorIdx]);
      }
    }

    setRandomCursorName();
    if (cursorAnimEl) {
      cursorAnimEl.addEventListener('animationiteration', function (e) {
        if (e.animationName !== 'ctxd-cur') return;
        cursorCycleCount += 1;
        setRandomCursorName();
      });
    }

    if ('IntersectionObserver' in window) {
      var isInViewport = true;
      var isDocVisible = !document.hidden;
      var isWindowFocused = document.hasFocus();
      function syncDemoPauseState() {
        var shouldPause = !(isInViewport && isDocVisible && isWindowFocused);
        cursorDemoRoot.classList.toggle('is-paused', shouldPause);
      }
      var demoObserver = new IntersectionObserver(function (entries) {
        var entry = entries[0];
        if (!entry) return;
        isInViewport = !!entry.isIntersecting;
        syncDemoPauseState();
      }, { threshold: 0.04 });
      demoObserver.observe(cursorDemoRoot);
      document.addEventListener('visibilitychange', function () {
        isDocVisible = !document.hidden;
        syncDemoPauseState();
      });
      window.addEventListener('focus', function () {
        isWindowFocused = true;
        syncDemoPauseState();
      });
      window.addEventListener('blur', function () {
        isWindowFocused = false;
        syncDemoPauseState();
      });
      syncDemoPauseState();
    }
  }

  function initContextMenuDemo(host) {
    if (!host || host.getAttribute('data-context-menu-demo') == null) return;
    if (host.getAttribute('data-context-menu-demo-initialized') === '1') return;
    host.setAttribute('data-context-menu-demo-initialized', '1');

    var label = (host.getAttribute('data-action-label') || 'Convert to WebP').trim();
    var doneSub = (host.getAttribute('data-done-sub') || '').trim();
    if (!doneSub) {
      doneSub = 'Файлы сконвертированы и сохранены рядом с оригиналами';
    }

    host.innerHTML = DEMO_HTML;

    var root = host.querySelector('.ctxd');
    if (!root) return;

    var actionEl = root.querySelector('.ctxd-action-label');
    var ann2 = root.querySelector('.ctxd-ann2');
    var doneEl = root.querySelector('.ctxd-done-sub');
    if (actionEl) actionEl.textContent = label;
    if (ann2) ann2.textContent = 'Выбираем «' + label + '»';
    if (doneEl) doneEl.textContent = doneSub;

    bindCursorDemo(root);
    paintLucideIcons();
    window.addEventListener('load', paintLucideIcons, { once: true });
  }

  function initAllContextMenuDemos() {
    document.querySelectorAll('[data-context-menu-demo]').forEach(function (el) {
      initContextMenuDemo(el);
    });
  }

  window.initContextMenuDemo = initContextMenuDemo;
  window.initAllContextMenuDemos = initAllContextMenuDemos;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllContextMenuDemos);
  } else {
    initAllContextMenuDemos();
  }
})();
