'use strict';

/**
 * Node-обёртка над движком русской типографики.
 *
 * ПРАВИЛА ЖИВУТ НЕ ЗДЕСЬ. Единственный источник —
 * `tools/figma-plugins/_shared/typograf-rules.js`; оттуда же они дословно
 * запекаются в `tools/figma-plugins/typograf/code.js` (плагин Figma не умеет
 * require(), см. `scripts/build-figma-typograf.js`). Этот файл нужен только
 * чтобы у Node-скриптов остался прежний путь импорта — `require('./lib/typograf')`
 * — и чтобы место расположения правил можно было менять, не трогая
 * `apply-typography.js`.
 *
 * До 2026-08-19 здесь лежала вторая, ручная копия правил. Она отстала от
 * плагина на «кв. м. → м²», «10 градусов → 10°», НБСП после «рис./табл./гл.»
 * и «10+ шт» — расхождение накопилось молча, потому что синхронность держалась
 * на памяти человека. Теперь за неё отвечает `scripts/test-typograf-sync.js`.
 *
 * Функции, завязанные на узлы Figma (setRangeListOptions, подчёркивание,
 * загрузка шрифтов, посимвольный дифф), в источник не входят и сюда не
 * попадают — к правке файлов на диске они неприменимы.
 */

const rules = require('../../tools/figma-plugins/_shared/typograf-rules.js');

// Сайт гоняется пресетом CONTENT_OPTS, а не DEFAULT_OPTS плагина: три
// правила («заглавная после : «», пробел после «(», апостроф → ’) на прозе
// каталога и блога портят текст или переделывают его так, что это должно быть
// отдельным решением. Разница описана в самом источнике, рядом с пресетом.
// Вызывающие скрипты передают частичный opts (обычно {}), поэтому пресет
// подмешивается здесь — иначе они получили бы фигмовские умолчания.
const withPreset = (opts) => Object.assign({}, rules.CONTENT_OPTS, opts);

module.exports = {
  NBSP: rules.NBSP,
  EM_DASH: rules.EM_DASH,
  EN_DASH: rules.EN_DASH,
  ELLIPSIS: rules.ELLIPSIS,
  NON_BREAKING_HYPHEN: rules.NON_BREAKING_HYPHEN,
  DEFAULT_OPTS: rules.CONTENT_OPTS,
  typografize: (text, opts) => rules.typografize(text, withPreset(opts)),
  typografizeProtected: (text, opts, protectRegexes) => rules.typografizeProtected(text, withPreset(opts), protectRegexes),
  stripSingleSentenceTrailingPeriod: rules.stripSingleSentenceTrailingPeriod,
  fixQuotes: rules.fixQuotes,
};
