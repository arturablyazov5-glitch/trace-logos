(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EN = document.documentElement.lang === 'en';
  var T = EN ? {
    scanning: 'Scanning the demo selection…', found: 'External styles and tokens found. Click a layer.',
    picked: function (n) { return 'Layer “' + n + '” is selected in the example.'; },
    scenes: { title: ['Hero', 'Text → Heading / Large'], surface: ['Content', 'Fill → Surface / Primary'], button: ['Actions', 'Token → color / accent'] },
    stageLabel: 'Layer example: '
  } : {
    scanning: 'Проверяем демонстрационное выделение…', found: 'Внешние стили и токены найдены. Нажмите на слой.',
    picked: function (n) { return 'В примере выделен слой «' + n + '».'; },
    scenes: { title: ['Hero', 'Текст → Heading / Large'], surface: ['Content', 'Цвет → Surface / Primary'], button: ['Actions', 'Токен → color / accent'] },
    stageLabel: 'Пример слоя: '
  };
  var demo = document.getElementById('ss-scan-demo');
  var scanButton = demo.querySelector('.ss-scan-action');
  var status = demo.querySelector('.ss-plugin-status');
  var rows = demo.querySelectorAll('.ss-result');
  var filters = demo.querySelectorAll('[data-filter]');
  var scanTimer;
  function scan() {
    clearTimeout(scanTimer);
    scanButton.disabled = true;
    demo.classList.remove('is-scanned');
    demo.classList.add('is-scanning');
    status.textContent = T.scanning;
    scanTimer = setTimeout(function () {
      demo.classList.remove('is-scanning');
      demo.classList.add('is-scanned');
      scanButton.disabled = false;
      status.textContent = T.found;
    }, reduced ? 0 : 1400);
  }
  scanButton.addEventListener('click', scan);
  rows.forEach(function (row) {
    row.setAttribute('aria-pressed', 'false');
    row.addEventListener('click', function () {
      demo.querySelectorAll('[data-node]').forEach(function (node) { node.classList.toggle('is-selected', node.dataset.node === row.dataset.target); });
      rows.forEach(function (item) { item.setAttribute('aria-pressed', String(item === row)); });
      status.textContent = T.picked(row.querySelector('b').textContent);
    });
  });
  filters.forEach(function (filter) {
    filter.addEventListener('click', function () {
      filters.forEach(function (item) { item.setAttribute('aria-pressed', String(item === filter)); });
      rows.forEach(function (row) { row.hidden = filter.dataset.filter !== 'all' && row.dataset.cat !== filter.dataset.filter; });
    });
  });
  var comparison = document.querySelector('.ss-drag-demo');
  comparison.querySelector('input').addEventListener('input', function () { comparison.style.setProperty('--ss-split', this.value + '%'); });
  var stage = document.querySelector('.ss-layer-stage');
  var scenes = T.scenes;
  function setStage(element, name) {
    element.querySelectorAll('[data-stage]').forEach(function (node) { node.classList.toggle('is-active', node.dataset.stage === name); });
    element.querySelector('.ss-stage-annotation').textContent = scenes[name][1];
    element.querySelector('#ss-stage-path, .ss-stage-path').textContent = scenes[name][0];
  }
  document.querySelectorAll('[data-scene]').forEach(function (scene) {
    var copy = stage.cloneNode(true);
    var path = copy.querySelector('#ss-stage-path');
    path.removeAttribute('id'); path.className = 'ss-stage-path';
    copy.querySelector('.ss-stage-annotation').removeAttribute('aria-live');
    setStage(copy, scene.dataset.scene);
    var mobile = document.createElement('div'); mobile.className = 'ss-mobile-stage'; mobile.setAttribute('aria-label', T.stageLabel + scenes[scene.dataset.scene][1]);
    mobile.appendChild(copy); scene.appendChild(mobile);
  });
  if ('IntersectionObserver' in window) {
    var sceneObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) setStage(stage, entry.target.dataset.scene); });
    }, { rootMargin: '-20% 0px -35% 0px', threshold: 0 });
    document.querySelectorAll('[data-scene]').forEach(function (scene) { sceneObserver.observe(scene); });
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (!reduced) entry.target.classList.add('ss-revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .1 });
    document.querySelectorAll('.ss h2, .ss-drag-demo, .ss-folder-scene').forEach(function (node) { revealObserver.observe(node); });
    var demoObserver = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) { scan(); demoObserver.disconnect(); }
    }, { threshold: .2 });
    demoObserver.observe(demo);
  } else { scan(); }
})();
