// Движок русской типографики — общие константы, на которые ссылаются
// остальные файлы src/core/rules/*.js. Портировано 1:1 из
// scripts/lib/typograf.js основного репозитория trace-logos (та же самая
// "чистая" копия правил, без зависимости от Figma API, которую CLAUDE.md
// проекта называет источником для переиспользования вне плагина).
//
// Файл должен подключаться ПЕРВЫМ при сборке (см. build/build.js) — все
// остальные rules/*.js читают эти имена как обычные глобальные переменные
// (сборка склеивает файлы в один <script>, отдельных модулей тут нет).

const NBSP = ' ';
const EM_DASH = '—';
const EN_DASH = '–';
const ELLIPSIS = '…';
const NON_BREAKING_HYPHEN = '‑';

const LETTER_CLASS = 'A-Za-zА-ЯЁа-яё';
const NOT_LETTER = `[^${LETTER_CLASS}]`;
const LETTER_RE = new RegExp(`[${LETTER_CLASS}]`);
const WORD_START_RE = new RegExp(`[${LETTER_CLASS}0-9]`);

const ADDRESS_PREFIX_ABBR = ['г', 'ул', 'пр-т', 'просп', 'пер', 'пос', 'д', 'кв', 'стр', 'корп', 'с'];

const DEFAULT_OPTS = { nbsp: true, dashes: true, quotes: true, ellipsis: true, spaces: true };

// URL и "цифра:цифра" (тайминги/пропорции) — фрагменты, которые нельзя
// пускать через typografize как есть: паттерн эмотикона ":)"/":3" матчает
// "://" и "18:30" и портит их. typografizeProtected.js прячет такие
// фрагменты за плейсхолдером на время обработки и восстанавливает после.
const URL_RE = /\bhttps?:\/\/[^\s"'<>)\]]+/g;
const RATIO_TIME_RE = /\d{1,4}:\d{1,4}/g;

// U+E000/U+E001 — Private Use Area, гарантированно не встречаются в обычном
// тексте страницы и не попадают ни под одно правило typografize.
const PLACEHOLDER_OPEN = '';
const PLACEHOLDER_CLOSE = '';
const PLACEHOLDER_RE = new RegExp(`${PLACEHOLDER_OPEN}(\\d+)${PLACEHOLDER_CLOSE}`, 'g');
