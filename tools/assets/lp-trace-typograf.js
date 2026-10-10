/* Fixed before/after illustration, not a second copy of the Typograf engine. */
(function () {
  'use strict';
  var example = document.getElementById('tt-demo-text');
  var buttons = document.querySelectorAll('[data-tt-state]');
  if (example) {
    var after = example.innerHTML;
    var before = '<p>Приходите на выставку "Форма" - в субботу.</p><p>Вход - 500 ₽. До встречи...</p>';
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var showAfter = button.getAttribute('data-tt-state') === 'after';
        example.innerHTML = showAfter ? after : before;
        buttons.forEach(function (item) {
          item.setAttribute('aria-pressed', item === button ? 'true' : 'false');
        });
      });
    });
  }
})();
