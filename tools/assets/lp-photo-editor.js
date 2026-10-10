(function () {
  'use strict';
  var object = document.querySelector('.pe-demo-object');
  var status = document.getElementById('pe-demo-status');
  var image = object.querySelector('img');
  var horizontal = false;
  var vertical = false;
  document.querySelectorAll('[data-pe-action]').forEach(function (button) {
    button.addEventListener('click', function () {
      var action = button.dataset.peAction;
      if (action === 'crop') {
        object.classList.add('is-cropped');
        status.textContent = 'Прозрачные поля убраны. Рамка подогнана под объект.';
      } else if (action === 'restore' || action === 'reset') {
        object.classList.remove('is-cropped');
        if (action === 'reset') { horizontal = false; vertical = false; }
        status.textContent = action === 'reset' ? 'Выделено изображение с прозрачными полями' : 'Восстановлены размер и пропорции исходного изображения.';
      } else if (action === 'h') {
        horizontal = !horizontal;
        status.textContent = horizontal ? 'Изображение отражено по горизонтали.' : 'Горизонтальное отражение отменено.';
      } else if (action === 'v') {
        vertical = !vertical;
        status.textContent = vertical ? 'Изображение отражено по вертикали.' : 'Вертикальное отражение отменено.';
      }
      image.style.transform = (object.classList.contains('is-cropped') ? 'translate(-6%, -8%) ' : '') + 'scale(' + (horizontal ? -1 : 1) + ', ' + (vertical ? -1 : 1) + ')';
      document.querySelector('[data-pe-action="h"]').setAttribute('aria-pressed', String(horizontal));
      document.querySelector('[data-pe-action="v"]').setAttribute('aria-pressed', String(vertical));
    });
  });
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('pe-reveal'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.pe-section').forEach(function (section) { observer.observe(section); });
  }
})();
