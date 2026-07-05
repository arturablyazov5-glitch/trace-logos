// ─────────────────────────────────────────────────────────────────────────────
// render.js — build-time partials (единый источник правды для статичных шаблонов).
//
// Раскрывает includes ВО ВРЕМЯ ГЕНЕРАЦИИ: {{> name key='value' ...}} заменяется
// телом templates/partials/name.html, в котором {{key}} подставляются переданными
// значениями. Все прочие плейсхолдеры ({{REL}}, {{META_DESC}}, …) остаются нетронуты
// и резолвятся обычным per-page replace в билд-скрипте.
//
// Итог: в готовую страницу запекается статический HTML — поисковик видит обычную
// разметку, рантайм-зависимости нет, а правка одна (в партиале).
//
// Ограничение синтаксиса: значения аргументов — в одинарных кавычках и НЕ содержат
// фигурных скобок. Поэтому путь к корню держит сам партиал ({{REL}}), а параметром
// принимается только суффикс (напр. search_action='logos/').
// ─────────────────────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');

const PARTIALS_DIR = path.join(__dirname, '..', '..', 'templates', 'partials');

function expandIncludes(str) {
  return str.replace(/\{\{>\s*([\w-]+)\s*([^}]*?)\s*\}\}/g, (_, name, argStr) => {
    let body = fs.readFileSync(path.join(PARTIALS_DIR, name + '.html'), 'utf8');
    const args = {};
    const re = /([\w-]+)='([^']*)'/g;
    let m;
    while ((m = re.exec(argStr)) !== null) args[m[1]] = m[2];
    // Подставляем только переданные параметры; остальные {{KEY}} оставляем как есть.
    body = body.replace(/\{\{([\w-]+)\}\}/g, (full, k) => (k in args ? args[k] : full));
    return expandIncludes(body); // поддержка вложенных партиалов
  });
}

function loadTemplate(absPath) {
  return expandIncludes(fs.readFileSync(absPath, 'utf8'));
}

module.exports = { loadTemplate, expandIncludes };
