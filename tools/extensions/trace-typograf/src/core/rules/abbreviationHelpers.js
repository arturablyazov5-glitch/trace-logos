// Список «хвостов» сокращений (без точки) + проверка "строка заканчивается
// на сокращение с точкой" — нужны stripQuoteTrailingPeriod.js, чтобы не
// спутать точку сокращения ("см.", "т.д.") с точкой конца предложения.
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
