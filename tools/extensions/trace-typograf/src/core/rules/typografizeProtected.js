// Прогоняет typografize, временно маскируя фрагменты, которые regex'ы из
// protectRegexes находят в тексте (совпадение целиком заменяется PUA-
// плейсхолдером, после обработки восстанавливается один в один). В
// расширении используется с [URL_RE, RATIO_TIME_RE] — см. applyTypografToElement.js.
//
// Порядок regex'ов важен: крупные/структурные фрагменты — раньше мелких,
// которые могут оказаться у них внутри. Восстановление — циклом, а не одним
// проходом (см. комментарий в scripts/lib/typograf.js основного репозитория —
// зеркало той же защиты от вложенных плейсхолдеров).
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
  for (let i = 0; i <= placeholders.length && out.includes(PLACEHOLDER_OPEN); i++) {
    out = out.replace(PLACEHOLDER_RE, (_m, idx) => placeholders[Number(idx)]);
  }
  return out;
}
