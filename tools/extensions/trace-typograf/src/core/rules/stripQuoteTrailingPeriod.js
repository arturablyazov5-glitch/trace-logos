// Точка перед закрывающей «ёлочкой» внутри цитаты убирается («Текст.» →
// «Текст»), если это не сокращение и не многоточие.
function stripQuoteTrailingPeriod(text) {
  return text.replace(/«([^«»]*)»/g, (m, inner) => {
    if (inner.endsWith('.') && !inner.endsWith('..') && !endsWithAbbreviation(inner)) {
      return `«${inner.slice(0, -1)}»`;
    }
    return m;
  });
}
