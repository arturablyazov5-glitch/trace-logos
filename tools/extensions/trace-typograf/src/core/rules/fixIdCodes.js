// ИНН/ОГРН/КПП/СНИЛС и почтовый индекс перед запятой — убирает пробелы
// внутри последовательности цифр (реквизиты не разбиваются НБСП-разрядами).
const ID_LABEL_ALT = 'ИНН|ОГРНИП|ОГРН|КПП|СНИЛС|Адрес';
const ID_DIGITS_RE = new RegExp(`(?<=(?:${ID_LABEL_ALT})[:\\s]{0,4})\\d(?:[ ${NBSP}]?\\d){3,}`, 'giu');
const POSTAL_INDEX_RE = new RegExp(`(^|\\n)(\\d[ ${NBSP}]?\\d[ ${NBSP}]?\\d[ ${NBSP}]?\\d[ ${NBSP}]?\\d[ ${NBSP}]?\\d)(?=,)`, 'gu');

function fixIdCodes(text) {
  let out = text.replace(ID_DIGITS_RE, (m) => m.replace(new RegExp(`[ ${NBSP}]`, 'g'), ''));
  out = out.replace(POSTAL_INDEX_RE, (m, pre, digits) => pre + digits.replace(new RegExp(`[ ${NBSP}]`, 'g'), ''));
  return out;
}
