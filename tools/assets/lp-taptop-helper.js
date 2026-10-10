(function () {
  'use strict';
  var EN = document.documentElement.lang === 'en';
  var T = EN
    ? {
        layers: function (n) { return n + (n === 1 ? ' layer' : ' layers') + ' selected'; },
        deleted: 'Selected layers deleted in the demo. “Reset demo” restores the layout.',
        stages: ['Selected and copied to the clipboard', 'Clipboard kept while you switch pages', 'Layers pasted onto the “About” page'],
        demo: ' · demo',
        published: 'Published ✓', allDone: 'All demo pages published', again: 'Run demo again ',
        publishing: 'Publishing…', publishingPage: function (name) { return 'Publishing “' + name + '” · demo'; },
        waiting: 'Waiting',
        copied: 'Copied. Paste the address into the Chrome address bar.', manual: 'Copy the address manually: chrome://extensions'
      }
    : {
        layers: function (n) { return 'Выбрано ' + n + (n === 1 ? ' слой' : n === 0 ? ' слоёв' : ' слоя'); },
        deleted: 'Выбранные слои удалены в демо. «Вернуть демо» восстановит схему.',
        stages: ['Выбрано и скопировано в буфер', 'Буфер сохранён при переходе', 'Слои вставлены на страницу «О студии»'],
        demo: ' · демо',
        published: 'Опубликована ✓', allDone: 'Все страницы демо опубликованы', again: 'Повторить демо ',
        publishing: 'Публикую…', publishingPage: function (name) { return 'Публикую «' + name + '» · демо'; },
        waiting: 'Ожидает',
        copied: 'Скопировано. Вставьте адрес в адресную строку Chrome.', manual: 'Скопируйте адрес вручную: chrome://extensions'
      };
  var root = document.querySelector('.th-main');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var layers = Array.from(root.querySelectorAll('[data-layer]'));
  var objects = Array.from(root.querySelectorAll('[data-object]'));
  var count = document.getElementById('th-selected-count');
  var layerStatus = document.getElementById('th-layer-status');
  function selection() {
    var n = layers.filter(function (button) { return button.getAttribute('aria-pressed') === 'true'; }).length;
    count.textContent = n;
    layerStatus.textContent = T.layers(n);
    objects.forEach(function (object) {
      var button = layers.find(function (el) { return el.dataset.layer === object.dataset.object; });
      object.classList.toggle('th-picked', button.getAttribute('aria-pressed') === 'true');
    });
  }
  layers.forEach(function (button) {
    button.addEventListener('click', function () {
      var object = objects.find(function (el) { return el.dataset.object === button.dataset.layer; });
      object.classList.remove('th-deleted');
      button.setAttribute('aria-pressed', button.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      selection();
    });
  });
  document.getElementById('th-delete').addEventListener('click', function () {
    layers.forEach(function (button) {
      if (button.getAttribute('aria-pressed') !== 'true') return;
      objects.find(function (el) { return el.dataset.object === button.dataset.layer; }).classList.add('th-deleted');
      button.setAttribute('aria-pressed', 'false');
    });
    selection();
    layerStatus.textContent = T.deleted;
  });
  document.getElementById('th-restore').addEventListener('click', function () {
    layers.forEach(function (button) { button.setAttribute('aria-pressed', button.dataset.layer === 'content' ? 'false' : 'true'); });
    objects.forEach(function (object) { object.classList.remove('th-deleted'); });
    selection();
  });
  var transfer = root.querySelector('.th-transfer-visual');
  var transferStatus = document.getElementById('th-transfer-status');
  var stage = 0;
  var runningTransfer = false;
  var descriptions = T.stages;
  function setStage(value) {
    stage = value;
    transfer.dataset.transferStage = value;
    document.getElementById('th-transfer-key').textContent = value === 2 ? '⌘ V' : value === 1 ? '→' : '⌘ C';
    transferStatus.textContent = descriptions[value] + T.demo;
  }
  document.getElementById('th-transfer-run').addEventListener('click', function () {
    setStage((stage + 1) % 3);
    runningTransfer = true;
    window.setTimeout(function () { runningTransfer = false; }, 1400);
  });
  if ('IntersectionObserver' in window) {
    var storyObserver = new IntersectionObserver(function (entries) {
      if (runningTransfer || window.innerWidth <= 600) return;
      var beats = Array.from(root.querySelectorAll('.th-story-beat'));
      var nearest = beats.reduce(function (best, beat) {
        var rect = beat.getBoundingClientRect();
        var distance = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2);
        return !best || distance < best.distance ? { beat: beat, distance: distance } : best;
      }, null);
      if (nearest) setStage(Number(nearest.beat.dataset.stage));
    }, { rootMargin: '-25% 0px -25% 0px', threshold: [0, 0.2, 0.5] });
    root.querySelectorAll('.th-story-beat').forEach(function (el) { storyObserver.observe(el); });
    if (!reduced.matches) {
      root.classList.add('th-motion');
      var reveal = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.classList.add('th-visible'); reveal.unobserve(entry.target); } });
      }, { threshold: 0.06 });
      root.querySelectorAll('[data-reveal]').forEach(function (el) { reveal.observe(el); });
    }
  }
  var publishButton = document.getElementById('th-publish-run');
  var publishPages = Array.from(root.querySelectorAll('[data-publish-page]'));
  var publishing = false;
  var timer;
  function publishStep(index) {
    if (index > 0) {
      var previous = publishPages[index - 1];
      previous.className = 'th-published';
      previous.querySelector('i').textContent = T.published;
    }
    document.getElementById('th-publish-count').textContent = index;
    document.getElementById('th-publish-fill').style.width = (index / 3 * 100) + '%';
    if (index === 3) {
      document.getElementById('th-publish-status').textContent = T.allDone;
      publishing = false;
      publishButton.disabled = false;
      publishButton.firstChild.textContent = T.again;
      return;
    }
    publishPages[index].className = 'th-publishing-now';
    publishPages[index].querySelector('i').textContent = T.publishing;
    document.getElementById('th-publish-status').textContent = T.publishingPage(publishPages[index].querySelector('span').textContent);
    timer = window.setTimeout(function () { publishStep(index + 1); }, reduced.matches ? 0 : 1100);
  }
  publishButton.addEventListener('click', function () {
    if (publishing) return;
    publishing = true;
    publishButton.disabled = true;
    publishPages.forEach(function (page) { page.className = ''; page.querySelector('i').textContent = T.waiting; });
    publishStep(0);
  });
  window.addEventListener('pagehide', function () { window.clearTimeout(timer); });
  document.getElementById('th-chrome-url').addEventListener('click', async function () {
    var status = document.getElementById('th-copy-status');
    try { await navigator.clipboard.writeText('chrome://extensions'); status.textContent = T.copied; }
    catch (error) { status.textContent = T.manual; }
  });
})();
