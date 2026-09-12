// «т.д.», «т.п.», «т.е.», «т.к.», «и др.», «см.», «напр.» — нормализует
// пробелы вокруг точек внутри сокращения и НБСП после него.
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
