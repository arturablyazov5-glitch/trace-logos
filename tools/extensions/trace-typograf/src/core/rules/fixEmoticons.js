// Ставит НБСП перед смайликом вида ":)" / ";-D" и т. п.
// Два исключения смотрят НАРУЖУ совпадения: "://" (URL) и "цифра:цифра"
// (пропорции/тайминги) матчатся тем же паттерном, что ":/" и ":3" —
// исключаются здесь же, чтобы не зависеть от порядка вызова с protectUrls.
const EMOTICON_RE = /(?<=\S)([:;]-?[)(DPp3|\\/Oo])(?![A-Za-zА-ЯЁа-яё0-9])/g;

function fixEmoticons(text) {
  return text.replace(EMOTICON_RE, (m, _face, offset, str) => {
    if (m.endsWith('/') && str[offset + m.length] === '/') return m;
    if (m.endsWith('3') && /\d/.test(str[offset - 1] || '')) return m;
    return NBSP + m;
  });
}
