(function () {
  'use strict';
  var buttons = document.querySelectorAll('[data-pdf-mode]');
  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      var raster = button.dataset.pdfMode === 'raster';
      buttons.forEach(function (item) { item.setAttribute('aria-pressed', String(item === button)); });
      document.getElementById('pdf-density').hidden = !raster;
      document.getElementById('pdf-mode-hint').textContent = raster ? 'PNG-заливка фрейма. Вид страницы без разбора на элементы.' : 'Редактируемые контуры. Текст — в кривых.';
      document.getElementById('pdf-canvas-mode').textContent = raster ? 'Фреймы с PNG-заливкой' : 'Векторные фреймы';
      document.getElementById('pdf-canvas-caption').textContent = raster ? 'Плотность меняет разрешение PNG, но не размер фрейма.' : 'Выберите контур и измените его форму или цвет.';
      document.querySelector('.pdf-canvas').classList.toggle('pdf-raster', raster);
    });
  });
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { entry.target.classList.remove('pdf-pending'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.05 });
  document.querySelectorAll('.pdf-section').forEach(function (section) {
    if (section.getBoundingClientRect().top > window.innerHeight) {
      section.classList.add('pdf-reveal', 'pdf-pending'); observer.observe(section);
    }
  });
})();
