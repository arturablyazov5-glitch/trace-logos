// Составной союз «так как» не рвётся переносом строки — НБСП между словами.
const COMPOUND_CONJUNCTIONS = ['так как'];

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
