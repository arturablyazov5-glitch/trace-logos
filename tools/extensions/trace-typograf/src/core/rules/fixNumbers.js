// НБСП вокруг чисел: №/#/§ + число, число + % / ₽ / € / единица измерения,
// число + буква, "=", "÷", разрядность больших чисел (1 000 000).
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

const CURRENCY_SIGNS = '₽|\\$|€|£';
const CURRENCY_CLASS = '₽\\$€£';

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
  // Негативный lookbehind на "#" + hex-символы: иначе цифры внутри цветового
  // кода читаются как число и разбиваются разрядом (#E30611 → "#E30 611").
  out = out.replace(/(?<!#[0-9A-Fa-f]{0,5})\d{1,3}(?: \d{3})+/g, (m) => m.replace(/ /g, NBSP));
  out = out.replace(/(?<!#[0-9A-Fa-f]{0,5})\d{5,}/g, (m) => (m[0] === '0' ? m : m.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)));
  return out;
}
