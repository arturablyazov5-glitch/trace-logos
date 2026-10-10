(function () {
  'use strict';
  var EN = document.documentElement.lang === 'en';
  var T = EN ? {
    before: '% before, ', after: '% after',
    restore: 'Original proportions restored', horizontal: 'Pixels flipped horizontally', vertical: 'Pixels flipped vertically',
    pngNote: 'ORIGINAL PIXELS / ONE IMAGE', webpNote: 'AS ON THE CANVAS'
  } : {
    before: '% до, ', after: '% после',
    restore: 'Исходные пропорции восстановлены', horizontal: 'Пиксели отражены по горизонтали', vertical: 'Пиксели отражены по вертикали',
    pngNote: 'ИСХОДНЫЕ ПИКСЕЛИ / ОДНО ФОТО', webpNote: 'КАК НА ХОЛСТЕ'
  };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var compare = document.querySelector('.pe-compare');
  var range = document.getElementById('pe-compare-range');
  range.addEventListener('input', function () {
    compare.style.setProperty('--split', range.value + '%');
    range.setAttribute('aria-valuetext', range.value + T.before + (100 - Number(range.value)) + T.after);
  });

  var stage = document.querySelector('.pe-story-stage');
  var states = {
    restore: { label: T.restore, glyph: '↶' },
    horizontal: { label: T.horizontal, glyph: '↔' },
    vertical: { label: T.vertical, glyph: '↕' }
  };
  function showScene(name) {
    if (!states[name]) return;
    stage.dataset.scene = name;
    stage.querySelector('.pe-scene-state').textContent = states[name].label;
    stage.querySelector('.pe-scene-glyph').textContent = states[name].glyph;
    document.querySelectorAll('[data-scene-select]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.sceneSelect === name));
    });
  }
  document.querySelectorAll('[data-scene-select]').forEach(function (button) {
    button.addEventListener('click', function () { showScene(button.dataset.sceneSelect); });
  });

  var sculpture = document.querySelector('.pe-export-sculpture');
  document.querySelectorAll('[data-export-view]').forEach(function (button) {
    button.addEventListener('click', function () {
      var png = button.dataset.exportView === 'png';
      sculpture.classList.toggle('is-png', png);
      sculpture.querySelector('.pe-file-front strong').textContent = png ? '.png' : '.webp';
      sculpture.querySelector('.pe-file-front small').textContent = png ? T.pngNote : T.webpNote;
      document.querySelectorAll('[data-export-view]').forEach(function (item) {
        item.setAttribute('aria-pressed', String(item === button));
      });
    });
  });

  if ('IntersectionObserver' in window) {
    var scenes = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && window.innerWidth > 600) showScene(entry.target.dataset.sceneStep);
      });
    }, { rootMargin: '-35% 0px -35% 0px', threshold: 0 });
    document.querySelectorAll('[data-scene-step]').forEach(function (beat) { scenes.observe(beat); });
    if (!reduceMotion.matches) {
      document.documentElement.classList.add('pe-ready');
      var reveals = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add('is-visible'); reveals.unobserve(entry.target); }
        });
      }, { rootMargin: '0px 0px 60px 0px', threshold: 0 });
      document.querySelectorAll('.pe-reveal').forEach(function (section) { reveals.observe(section); });
    }
  }
})();
