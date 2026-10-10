(function () {
  'use strict';
  var demo = document.querySelector('.ss-demo');
  if (demo) {
    var filters = demo.querySelectorAll('[data-filter]');
    var rows = demo.querySelectorAll('.ss-result');
    filters.forEach(function (button) {
      button.addEventListener('click', function () {
        var category = button.dataset.filter;
        filters.forEach(function (filter) { filter.setAttribute('aria-pressed', String(filter === button)); });
        rows.forEach(function (row) { row.hidden = category !== 'all' && row.dataset.cat !== category; });
      });
    });
    rows.forEach(function (row) {
      row.setAttribute('aria-pressed', 'false');
      row.addEventListener('click', function () {
        demo.querySelectorAll('[data-layer]').forEach(function (layer) { layer.classList.toggle('is-selected', layer.dataset.layer === row.dataset.target); });
        rows.forEach(function (item) { item.setAttribute('aria-pressed', String(item === row)); });
        document.getElementById('ss-demo-status').textContent = 'В примере выделен слой «' + row.querySelector('b').textContent + '». В Figma к нему перейдёт камера.';
      });
    });
  }
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('ss-entered'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.ss .section h2, .ss .ext-blocked, .ss .ext-step').forEach(function (section) {
      section.classList.add('ss-reveal');
      observer.observe(section);
    });
  }
})();
