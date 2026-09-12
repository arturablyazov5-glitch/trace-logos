// Оркестратор: прогоняет текст через все правила выше по фиксированному
// порядку. opts переопределяет DEFAULT_OPTS (какие группы правил включены).
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
