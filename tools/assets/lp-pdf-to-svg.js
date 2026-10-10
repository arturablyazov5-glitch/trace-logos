(function () {
  'use strict';
  var EN = document.documentElement.lang === 'en';
  var T = EN ? {
    hintRaster: 'PNG fill of the frame. Not split into elements.', hintVector: 'Editable paths. Text is converted to curves.',
    demo: 'Import demo · every page becomes a frame',
    vec1: 'Vector takes up ', vec2: ' percent',
    labels: ['Drop a PDF into the panel', 'Choose pages and mode', 'The pages appear side by side on the canvas']
  } : {
    hintRaster: 'PNG-заливка фрейма. Без разбора на элементы.', hintVector: 'Редактируемые контуры. Текст — в кривых.',
    demo: 'Демо импорта · каждая страница станет фреймом',
    vec1: 'Вектор занимает ', vec2: ' процентов',
    labels: ['Перетащите PDF в панель', 'Выберите страницы и режим', 'Страницы появились рядом на холсте']
  };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var editor = document.querySelector('.pdf-editor');
  var modes = document.querySelectorAll('[data-pdf-mode]');
  modes.forEach(function (button) {
    button.addEventListener('click', function () {
      var raster = button.dataset.pdfMode === 'raster';
      modes.forEach(function (item) { item.setAttribute('aria-pressed', String(item === button)); });
      editor.classList.toggle('pdf-raster', raster);
      document.getElementById('pdf-density').hidden = !raster;
      document.getElementById('pdf-mode-hint').textContent = raster ? T.hintRaster : T.hintVector;
    });
  });
  document.getElementById('pdf-demo-import').addEventListener('click', function () {
    editor.classList.remove('pdf-importing');
    void editor.offsetWidth;
    editor.classList.add('pdf-importing');
    document.getElementById('pdf-demo-status').textContent = T.demo;
  });
  var wipe = document.getElementById('pdf-wipe');
  var range = document.getElementById('pdf-wipe-range');
  function updateWipe() {
    wipe.style.setProperty('--pdf-split', range.value + '%');
    range.setAttribute('aria-valuetext', T.vec1 + (100 - Number(range.value)) + T.vec2);
  }
  range.addEventListener('input', updateWipe);
  // Native range supports keyboard; pointer tracking makes the whole visual draggable.
  range.addEventListener('pointerdown', function (event) {
    range.setPointerCapture(event.pointerId);
    function move(e) {
      var rect = wipe.getBoundingClientRect();
      range.value = Math.max(5, Math.min(95, Math.round((e.clientX - rect.left) / rect.width * 100)));
      updateWipe();
    }
    move(event);
    range.addEventListener('pointermove', move);
    function stop() { range.removeEventListener('pointermove', move); range.removeEventListener('pointerup', stop); range.removeEventListener('pointercancel', stop); }
    range.addEventListener('pointerup', stop); range.addEventListener('pointercancel', stop);
  });
  if (!('IntersectionObserver' in window)) return;
  var scene = document.querySelector('.pdf-story-scene');
  var labels = T.labels;
  var stepObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      scene.dataset.stage = entry.target.dataset.pdfStep;
      scene.querySelector('.pdf-scene-state').textContent = labels[Number(entry.target.dataset.pdfStep)];
    });
  }, { rootMargin: '-30% 0px -40% 0px', threshold: 0 });
  document.querySelectorAll('[data-pdf-step]').forEach(function (step) { stepObserver.observe(step); });
  if (reduced) return;
  var reveal = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { entry.target.classList.remove('pdf-pending'); reveal.unobserve(entry.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.pdf-reveal').forEach(function (item) {
    if (item.getBoundingClientRect().top > window.innerHeight) { item.classList.add('pdf-pending'); reveal.observe(item); }
  });
})();
