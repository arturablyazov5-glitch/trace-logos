'use strict';

/**
 * Движок русской типографики — правила расстановки НБСП, тире, кавычек,
 * многоточия и т. п. как ЧИСТЫЕ строковые функции, без единой зависимости от
 * Figma API.
 *
 * ЭТО ДУБЛИКАТ `figna-plagins/Trace Typograf/code.js`, а не общий модуль —
 * плагин выполняется в песочнице Figma без доступа к файловой системе и без
 * поддержки `require()`/относительных импортов, поэтому вынести правила в
 * единственный источник истины и подключать его из обоих мест нельзя. Любое
 * изменение правила здесь надо вручную повторить в code.js плагина, и наоборот.
 *
 * Копия НАМЕРЕННО не включает часть плагина, завязанную на Figma-узлы
 * (сплошной дифф символов, setRangeListOptions, setRangeTextDecoration,
 * загрузку шрифтов) — это специфика редактирования текстовых слоёв в Figma,
 * не применимая к правке файлов на диске.
 */

const NBSP = ' ';
const EM_DASH = '—';
const EN_DASH = '–';
const ELLIPSIS = '…';
const NON_BREAKING_HYPHEN = '‑';

const LETTER_CLASS = 'A-Za-zА-ЯЁа-яё';
const NOT_LETTER = `[^${LETTER_CLASS}]`;
const LETTER_RE = new RegExp(`[${LETTER_CLASS}]`);
const WORD_START_RE = new RegExp(`[${LETTER_CLASS}0-9]`);

const PREP_WORDS = new Set([
  'а', 'и', 'в', 'к', 'о', 'с', 'у', 'я',
  'но', 'да', 'из', 'за', 'на', 'до', 'по', 'от', 'во', 'со', 'ко', 'об', 'ни', 'не',
  'что', 'кто', 'как', 'или', 'для', 'при', 'про', 'без', 'над', 'под', 'чем', 'где', 'то', 'уж', 'уже', 'через', 'чтобы', 'чтоб',
  'это', 'эти', 'эта', 'этот', 'весь', 'вся', 'все', 'всех',
  'который', 'которая', 'которое', 'которые',
]);

const PARTICLE_WORDS = new Set(['ли', 'бы', 'же', 'ж', 'б']);

const COMPOUND_CONJUNCTIONS = ['так как'];

const UNITS = [
  'мм', 'см', 'дм', 'км', 'кг', 'шт', 'руб', 'коп', 'млн', 'млрд', 'тыс', 'чел', 'эт', 'кв', 'куб', 'л', 'м', 'г',
  'лет', 'года', 'год', 'году', 'годов', 'годах', 'годам', 'годами',
  'месяц', 'месяца', 'месяцев', 'месяцах', 'месяцам',
  'неделя', 'недели', 'недель', 'день', 'дня', 'дней', 'час', 'часа', 'часов', 'минута', 'минуты', 'минут',
  'место', 'места', 'мест', 'человек', 'штук', 'раз', 'раза',
  'рубль', 'рубля', 'рублей',
  'параметр', 'параметра', 'параметру', 'параметром', 'параметре',
  'параметры', 'параметров', 'параметрам', 'параметрами', 'параметрах',
];

function fixEllipsis(text) {
  return text.replace(/\.{3,}/g, ELLIPSIS);
}

function fixSpaces(text) {
  return text
    .replace(/[​‎‏﻿]/g, '')
    .replace(/\t/g, ' ')
    .replace(/[  ]{2,}/g, ' ')
    .replace(/[  ]+([,.:;!?…\]])/g, '$1')
    .replace(/\[[  ]+/g, '[')
    .replace(/[ \t ]+$/gm, '')
    .replace(/^[ \t ]+/, '');
}

const EMOJI_RELATED = '\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u{FE0F}\\u{FE0E}\\u{200D}\\u{1F3FB}-\\u{1F3FF}\\u{20E3}';
const EMOJI_GAP_RE = new RegExp(`(?<=[^\\s${EMOJI_RELATED}])(\\p{Extended_Pictographic}|\\p{Regional_Indicator})`, 'gu');

function fixEmojiSpacing(text) {
  return text.replace(EMOJI_GAP_RE, `${NBSP}$1`);
}

// Два исключения ниже — см. тот же комментарий в code.js плагина: URL
// "://" и "цифра:цифра" (соотношения сторон, тайминги) матчатся тем же
// паттерном как эмотиконы ":/" и ":3" соответственно. Добавлены в колбэке
// replace, а не в самом регэкспе, — обе проверки смотрят НАРУЖУ совпадения
// (символ после для URL, символ перед для диапазона).
const EMOTICON_RE = /(?<=\S)([:;]-?[)(DPp3|\\/Oo])(?![A-Za-zА-ЯЁа-яё0-9])/g;

function fixEmoticons(text) {
  return text.replace(EMOTICON_RE, (m, _face, offset, str) => {
    if (m.endsWith('/') && str[offset + m.length] === '/') return m;
    if (m.endsWith('3') && /\d/.test(str[offset - 1] || '')) return m;
    return NBSP + m;
  });
}

const DASH_LIKE = '\\-–—−‒―';

function fixDashes(text) {
  return text
    .replace(new RegExp(`(\\d)\\s*[${DASH_LIKE}]\\s*(\\d)`, 'g'), `$1${NON_BREAKING_HYPHEN}$2`)
    .replace(/(\S)\s+--?\s+(?=\S)/g, `$1${NBSP}${EM_DASH} `)
    .replace(/(\S)\s*—\s*(?=\S)/g, `$1${NBSP}${EM_DASH} `)
    .replace(/^([ \t]*)-[ ]+(?=\S)/gm, `$1${EM_DASH} `)
    .replace(new RegExp(`([${LETTER_CLASS}0-9])-(?=[${LETTER_CLASS}0-9])`, 'g'), `$1${NON_BREAKING_HYPHEN}`);
}

function fixQuotes(text) {
  let out = text.replace(/[“”]/g, (m) => (m === '“' ? '«' : '»'));
  let open = true;
  out = out.replace(/"/g, () => {
    const ch = open ? '«' : '»';
    open = !open;
    return ch;
  });
  return out;
}

function fixAbbreviations(text) {
  const rules = [
    [new RegExp(`(^|${NOT_LETTER})[тТ]\\.[  ]*д\\.`, 'g'), `$1т.${NBSP}д.`],
    [new RegExp(`(^|${NOT_LETTER})[тТ]\\.[  ]*п\\.`, 'g'), `$1т.${NBSP}п.`],
    [new RegExp(`(^|${NOT_LETTER})[тТ]\\.[  ]*е\\.`, 'g'), `$1т.${NBSP}е.`],
    [new RegExp(`(^|${NOT_LETTER})[тТ]\\.[  ]*к\\.`, 'g'), `$1т.${NBSP}к.`],
    [new RegExp(`(^|${NOT_LETTER})[иИ][ ]+др\\.`, 'g'), `$1и${NBSP}др.`],
    [new RegExp(`(^|${NOT_LETTER})([Сс]м\\.)[ ]`, 'g'), `$1$2${NBSP}`],
    [new RegExp(`(^|${NOT_LETTER})([Нн]апр\\.)[ ]`, 'g'), `$1$2${NBSP}`],
  ];
  let out = text;
  for (const [re, rep] of rules) out = out.replace(re, rep);
  return out;
}

const ADDRESS_PREFIX_ABBR = ['г', 'ул', 'пр-т', 'просп', 'пер', 'пос', 'д', 'кв', 'стр', 'корп', 'с'];

function fixAddressAbbreviations(text) {
  let out = text;
  const alt = ADDRESS_PREFIX_ABBR.slice().sort((a, b) => b.length - a.length).join('|');
  out = out.replace(new RegExp(`(^|${NOT_LETTER})(${alt})\\.[ ](?=\\d|[А-ЯЁ])`, 'g'), (_m, p1, abbr) => `${p1}${abbr}.${NBSP}`);
  out = out.replace(/(\S)[ ](обл\.|р-н)/g, `$1${NBSP}$2`);
  return out;
}

const CURRENCY_SIGNS = '₽|\\$|€|£';
const CURRENCY_CLASS = '₽\\$€£';

function fixPhone(text) {
  const PHONE_RE = new RegExp(`(?<![\\d${LETTER_CLASS}])(?:\\+?7|8)(?:[ ${NBSP}\\-${NON_BREAKING_HYPHEN}()]*\\d){10}(?![\\d${LETTER_CLASS}])`, 'g');
  return text.replace(PHONE_RE, (m) => {
    const digits = m.replace(/\D/g, '').slice(-10);
    const area = digits.slice(0, 3);
    const p1 = digits.slice(3, 6);
    const p2 = digits.slice(6, 8);
    const p3 = digits.slice(8, 10);
    return `+7${NBSP}(${area})${NBSP}${p1}-${p2}-${p3}`;
  });
}

function fixNumbers(text) {
  let out = text;
  out = out.replace(/№[^\S\n]+(?=\d)/g, '№');
  out = out.replace(/#[^\S\n]+(?=\d)/g, '#');
  out = out.replace(/§[^\S\n]+(?=\d)/g, '§');
  out = out.replace(/(\d)[^\S\n]+%/g, '$1%');
  out = out.replace(/(\d)[^\S\n]?р\.(?![A-Za-zА-ЯЁа-яё])/g, `$1${NBSP}₽`);
  out = out.replace(new RegExp(`(\\d)[^\\S\\n]?евро(?![${LETTER_CLASS}])`, 'gi'), `$1${NBSP}€`);
  out = out.replace(new RegExp(`(\\d)[^\\S\\n]?(${CURRENCY_SIGNS})`, 'g'), `$1${NBSP}$2`);
  out = out.replace(new RegExp(`(${CURRENCY_SIGNS})[^\\S\\n]+(?=\\d)`, 'g'), '$1');
  out = out.replace(new RegExp(`(\\d)[^\\S\\n]?(г\\.|гг\\.|в\\.|вв\\.)(?![${LETTER_CLASS}])`, 'g'), `$1${NBSP}$2`);
  const unitsAlt = UNITS.slice().sort((a, b) => b.length - a.length).join('|');
  out = out.replace(new RegExp(`(\\d)[^\\S\\n]?(${unitsAlt})(?![${LETTER_CLASS}])`, 'g'), `$1${NBSP}$2`);
  out = out.replace(new RegExp(`(\\d)[^\\S\\n](?=[${LETTER_CLASS}])`, 'g'), `$1${NBSP}`);
  out = out.replace(new RegExp(`([\\d${CURRENCY_CLASS}])[^\\S\\n]*\\+[^\\S\\n]*(?=[\\d${CURRENCY_CLASS}])`, 'g'), `$1${NBSP}+${NBSP}`);
  out = out.replace(/(\S)[^\S\n]*=[^\S\n]*(?=\S)/g, (m, prev, offset, str) => {
    if (/[<>=!]/.test(prev)) return m;
    if (str[offset + m.length] === '=') return m;
    return `${prev}${NBSP}=${NBSP}`;
  });
  out = out.replace(/(\S)[^\S\n]*÷[^\S\n]*(?=\S)/g, `$1${NBSP}÷${NBSP}`);
  out = out.replace(/\d{1,3}(?: \d{3})+/g, (m) => m.replace(/ /g, NBSP));
  out = out.replace(/\d{5,}/g, (m) => (m[0] === '0' ? m : m.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)));
  return out;
}

const ID_LABEL_ALT = 'ИНН|ОГРНИП|ОГРН|КПП|СНИЛС|Адрес';
const ID_DIGITS_RE = new RegExp(`(?<=(?:${ID_LABEL_ALT})[:\\s]{0,4})\\d(?:[ ${NBSP}]?\\d){3,}`, 'giu');
const POSTAL_INDEX_RE = new RegExp(`(^|\\n)(\\d[ ${NBSP}]?\\d[ ${NBSP}]?\\d[ ${NBSP}]?\\d[ ${NBSP}]?\\d[ ${NBSP}]?\\d)(?=,)`, 'gu');

function fixIdCodes(text) {
  let out = text.replace(ID_DIGITS_RE, (m) => m.replace(new RegExp(`[ ${NBSP}]`, 'g'), ''));
  out = out.replace(POSTAL_INDEX_RE, (m, pre, digits) => pre + digits.replace(new RegExp(`[ ${NBSP}]`, 'g'), ''));
  return out;
}

function fixInitials(text) {
  let out = text;
  out = out.replace(new RegExp(`(^|${NOT_LETTER})([А-ЯЁ])\\.[ ]+([А-ЯЁ])\\.[ ]+(?=[А-ЯЁ][а-яё])`, 'gu'),
    (_m, p1, a, b) => `${p1}${a}.${NBSP}${b}.${NBSP}`);
  out = out.replace(new RegExp(`(^|${NOT_LETTER})([А-ЯЁ])\\.[ ]+(?=[А-ЯЁ][а-яё]{2,})`, 'gu'),
    (_m, p1, a) => `${p1}${a}.${NBSP}`);
  return out;
}

function fixShortWords(text) {
  const tokens = text.match(new RegExp(`[${LETTER_CLASS}0-9]+|[^${LETTER_CLASS}0-9]+`, 'g'));
  if (!tokens) return text;

  const spaceAtStart = (gap) => gap[0] === ' ' && gap.indexOf(' ', 1) === -1;
  const spaceAtEnd = (gap) => gap[gap.length - 1] === ' ' && gap.lastIndexOf(' ', gap.length - 2) === -1;

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];
    if (!new RegExp(`^[${LETTER_CLASS}]+$`).test(word)) continue;
    const lower = word.toLowerCase();

    if (PREP_WORDS.has(lower)) {
      const gap = tokens[i + 1];
      const next = tokens[i + 2];
      if (gap && spaceAtStart(gap) && next && WORD_START_RE.test(next[0])) {
        tokens[i + 1] = NBSP + gap.slice(1);
      }
    }
    if (PARTICLE_WORDS.has(lower)) {
      const gap = tokens[i - 1];
      const prev = tokens[i - 2];
      if (gap && spaceAtEnd(gap) && prev && WORD_START_RE.test(prev[prev.length - 1])) {
        tokens[i - 1] = gap.slice(0, -1) + NBSP;
      }
    }
  }
  return tokens.join('');
}

function fixCompoundConjunctions(text) {
  const tokens = text.match(new RegExp(`[${LETTER_CLASS}0-9]+|[^${LETTER_CLASS}0-9]+`, 'g'));
  if (!tokens) return text;

  const spaceAtStart = (gap) => gap[0] === ' ' && gap.indexOf(' ', 1) === -1;

  for (const phrase of COMPOUND_CONJUNCTIONS) {
    const words = phrase.split(' ');
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].toLowerCase() !== words[0]) continue;
      let ok = true;
      for (let w = 1; w < words.length; w++) {
        const gap = tokens[i + 2 * (w - 1) + 1];
        const word = tokens[i + 2 * w];
        if (!gap || !spaceAtStart(gap) || !word || word.toLowerCase() !== words[w]) { ok = false; break; }
      }
      if (!ok) continue;
      for (let w = 1; w < words.length; w++) {
        const gapIdx = i + 2 * (w - 1) + 1;
        tokens[gapIdx] = NBSP + tokens[gapIdx].slice(1);
      }
    }
  }
  return tokens.join('');
}

const DEFAULT_OPTS = { nbsp: true, dashes: true, quotes: true, ellipsis: true, spaces: true };

function typografize(text, opts) {
  const o = Object.assign({}, DEFAULT_OPTS, opts);
  let out = text;
  if (o.ellipsis) out = fixEllipsis(out);
  if (o.dashes) out = fixDashes(out);
  if (o.quotes) { out = fixQuotes(out); out = stripQuoteTrailingPeriod(out); }
  if (o.spaces) { out = fixSpaces(out); out = fixEmojiSpacing(out); out = fixEmoticons(out); }
  if (o.nbsp) {
    out = fixPhone(out);
    out = fixAbbreviations(out);
    out = fixAddressAbbreviations(out);
    out = fixNumbers(out);
    out = fixIdCodes(out);
    out = fixInitials(out);
    out = fixShortWords(out);
    out = fixCompoundConjunctions(out);
  }
  return out;
}

const ABBREV_TAIL_WORDS = new Set([
  'д', 'п', 'е', 'к', 'др', 'пр', 'проч', 'см', 'напр', 'г', 'гг', 'в', 'вв',
  ...ADDRESS_PREFIX_ABBR,
]);

function endsWithAbbreviation(str) {
  const m = new RegExp(`[${LETTER_CLASS}]+\\.$`).exec(str);
  if (!m) return false;
  const word = m[0].slice(0, -1);
  if (word.length === 1 && LETTER_RE.test(word) && word === word.toUpperCase()) return true;
  return ABBREV_TAIL_WORDS.has(word.toLowerCase());
}

function stripQuoteTrailingPeriod(text) {
  return text.replace(/«([^«»]*)»/g, (m, inner) => {
    if (inner.endsWith('.') && !inner.endsWith('..') && !endsWithAbbreviation(inner)) {
      return `«${inner.slice(0, -1)}»`;
    }
    return m;
  });
}

const CLOSING_PUNCT_RE = /["'»)\]”’]/;

function isAbbreviationWord(word) {
  if (!word) return false;
  if (word.length === 1 && LETTER_RE.test(word) && word === word.toUpperCase()) return true;
  return ABBREV_TAIL_WORDS.has(word.toLowerCase());
}

function isSentenceEndingPeriod(str, idx) {
  if (str[idx - 1] === '.' || str[idx + 1] === '.') return false;
  if (/\d/.test(str[idx - 1] || '') && /\d/.test(str[idx + 1] || '')) return false;

  let j = idx - 1;
  while (j >= 0 && CLOSING_PUNCT_RE.test(str[j])) j--;
  const wordEnd = j + 1;
  while (j >= 0 && LETTER_RE.test(str[j])) j--;
  const word = str.slice(j + 1, wordEnd);

  return !isAbbreviationWord(word);
}

// Точка в конце убирается, если ВЕСЬ текст: (а) один абзац без переноса
// строки, (б) содержит ровно одно предложение. См. комментарий в code.js
// плагина — то же самое решение для коротких карточек-утверждений.
function stripSingleSentenceTrailingPeriod(text) {
  if (text.includes('\n')) return text;
  if (!text.endsWith('.') || text.endsWith('..')) return text;
  if (endsWithAbbreviation(text)) return text;

  const body = text.slice(0, -1);
  if (/[!?]/.test(body)) return text;

  for (let i = 0; i < body.length; i++) {
    if (body[i] === '.' && isSentenceEndingPeriod(body, i)) return text;
  }

  return body;
}

// U+E000/U+E001 — Private Use Area, гарантированно не встречаются в обычном
// тексте и не входят ни в один класс (буква/цифра/пунктуация), который
// трогают правила typografize выше. Токен вида "<индекс>"
// проходит через весь конвейер непрозрачной пломбой: не путается с
// настоящими цифрами текста (иначе группировка разрядов в fixNumbers могла
// бы схватить индекс плейсхолдера как часть числа) и не служит границей
// слова ни для одного НБСП-правила.
const PLACEHOLDER_OPEN = '';
const PLACEHOLDER_CLOSE = '';
const PLACEHOLDER_RE = new RegExp(`${PLACEHOLDER_OPEN}(\\d+)${PLACEHOLDER_CLOSE}`, 'g');

/**
 * Прогоняет typografize по тексту, защищая от правки фрагменты, найденные
 * regex'ами из protectRegexes (совпавший кусок целиком заменяется токеном
 * из PUA, после обработки восстанавливается один в один). Нужно там, где в
 * прозе вперемешку встречается синтаксис/разметка, которую типографские
 * правила легко ломают молча — HTML-атрибуты с кавычками, ссылки,
 * инлайн-код, маркеры списков.
 *
 * Порядок regex'ов в protectRegexes важен: применяются последовательно,
 * поэтому более крупные/структурные фрагменты (блоки кода, целые виджеты,
 * HTML-теги целиком) должны идти РАНЬШЕ мелких, которые могут оказаться у
 * них ВНУТРИ (URL в href, инлайн-код) — иначе меньший фрагмент замаскируется
 * первым, а более поздний regex, матчащий более крупный охватывающий кусок,
 * замаскирует уже вставленный туда токен-пломбу ВМЕСТЕ с ним, породив
 * вложенный плейсхолдер.
 *
 * Восстановление — ЦИКЛОМ, а не одним проходом: даже при правильном порядке
 * вложенность может возникнуть (два regex'а из списка неожиданно
 * пересеклись), а один проход replace() не разворачивает плейсхолдер,
 * оказавшийся ВНУТРИ текста другого плейсхолдера — вложенный токен остаётся
 * в выводе как есть, потому что replace() не пересканирует то, что сам же
 * подставил. Инцидент 2026-07-31: URL внутри href замаскировался раньше
 * охватывающего тега → в about-тексте на сайт улетел буквальный
 * "href="0"" — токен вместо ссылки, страница получила битую ссылку.
 * Индексы плейсхолдеров строго убывают с глубиной вложенности, поэтому цикл
 * гарантированно завершается не более чем за placeholders.length проходов;
 * +1 — на случай, если восстановленный текст сам случайно похож на токен.
 */
function typografizeProtected(text, opts, protectRegexes) {
  const placeholders = [];
  let masked = text;
  for (const re of protectRegexes) {
    masked = masked.replace(re, (m) => {
      const token = `${PLACEHOLDER_OPEN}${placeholders.length}${PLACEHOLDER_CLOSE}`;
      placeholders.push(m);
      return token;
    });
  }
  let out = typografize(masked, opts);
  // out.includes(...), не PLACEHOLDER_RE.test(out): test() на regex с флагом
  // 'g' хранит lastIndex между вызовами и на втором проходе искал бы не с
  // начала строки — на урезанном после replace() тексте это давало бы
  // ложноотрицательный результат и выход из цикла с недораспакованным
  // плейсхолдером ещё внутри.
  for (let i = 0; i <= placeholders.length && out.includes(PLACEHOLDER_OPEN); i++) {
    out = out.replace(PLACEHOLDER_RE, (_m, idx) => placeholders[Number(idx)]);
  }
  return out;
}

module.exports = {
  NBSP,
  EM_DASH,
  EN_DASH,
  ELLIPSIS,
  NON_BREAKING_HYPHEN,
  DEFAULT_OPTS,
  typografize,
  typografizeProtected,
  stripSingleSentenceTrailingPeriod,
  fixQuotes,
};
