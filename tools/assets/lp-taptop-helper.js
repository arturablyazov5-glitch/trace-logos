(function () {
  'use strict';
  var layers = Array.from(document.querySelectorAll('.th-demo-layer'));
  var clipboard = [];
  var destination = document.getElementById('th-destination');
  var status = document.getElementById('th-demo-status');
  var copy = document.getElementById('th-copy');
  var paste = document.getElementById('th-paste');
  function selected() { return layers.filter(function (el) { return el.getAttribute('aria-pressed') === 'true'; }); }
  function word(n) { return n === 1 ? 'слой' : 'слоя'; }
  layers.forEach(function (el) {
    el.addEventListener('click', function () {
      el.setAttribute('aria-pressed', el.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      var n = selected().length;
      copy.disabled = n === 0;
      status.textContent = n ? 'Выбрано ' + n + ' ' + word(n) + '. Можно копировать.' : 'Выберите хотя бы один слой.';
    });
  });
  copy.addEventListener('click', function () {
    clipboard = selected().map(function (el) { return el.dataset.layer; });
    paste.disabled = clipboard.length === 0;
    status.textContent = 'В буфере ' + clipboard.length + ' ' + word(clipboard.length) + '. Вставьте на страницу «О нас».';
  });
  paste.addEventListener('click', function () {
    if (!clipboard.length) return;
    destination.replaceChildren();
    clipboard.forEach(function (name) {
      var row = document.createElement('div');
      row.className = 'th-pasted-layer';
      row.textContent = '✓  ' + name;
      destination.appendChild(row);
    });
    status.textContent = 'На странице «О нас» появились выбранные слои. Это демонстрация переноса.';
  });
  document.getElementById('th-reset').addEventListener('click', function () {
    clipboard = [];
    layers.forEach(function (el) { el.setAttribute('aria-pressed', el.dataset.layer === 'Контент' ? 'false' : 'true'); });
    destination.replaceChildren();
    var empty = document.createElement('p');
    empty.textContent = 'Здесь появятся скопированные слои';
    destination.appendChild(empty);
    copy.disabled = false;
    paste.disabled = true;
    status.textContent = 'Выбрано 3 слоя. Можно копировать.';
  });
  document.getElementById('th-chrome-url').addEventListener('click', async function () {
    var note = document.getElementById('th-copy-status');
    try {
      await navigator.clipboard.writeText('chrome://extensions');
      note.textContent = 'Адрес скопирован. Вставьте его в адресную строку Chrome.';
    } catch (e) {
      note.textContent = 'Выделите и скопируйте адрес вручную: chrome://extensions';
    }
  });
})();
