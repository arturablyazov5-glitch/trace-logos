// Тире: "цифра-цифра" → неразрывный дефис, " - "/одиночное "—" между словами
// → длинное тире с НБСП слева, дефис в начале строки-пункта → длинное тире,
// дефис между буквой/цифрой без пробелов (веб-сайт) → неразрывный дефис.
const DASH_LIKE = '\\-–—−‒―';

function fixDashes(text) {
  return text
    .replace(new RegExp(`(\\d)\\s*[${DASH_LIKE}]\\s*(\\d)`, 'g'), `$1${NON_BREAKING_HYPHEN}$2`)
    .replace(/(\S)\s+--?\s+(?=\S)/g, `$1${NBSP}${EM_DASH} `)
    .replace(/(\S)\s*—\s*(?=\S)/g, `$1${NBSP}${EM_DASH} `)
    .replace(/^([ \t]*)-[ ]+(?=\S)/gm, `$1${EM_DASH} `)
    .replace(new RegExp(`([${LETTER_CLASS}0-9])-(?=[${LETTER_CLASS}0-9])`, 'g'), `$1${NON_BREAKING_HYPHEN}`);
}
