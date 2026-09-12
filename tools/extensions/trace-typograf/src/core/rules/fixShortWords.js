// Однобуквенные/двухбуквенные предлоги и союзы («в», «на», «и»…) не остаются
// в конце строки одни — НБСП после предлога перед следующим словом, НБСП
// перед частицей («ли», «бы», «же»…), приклеенной к предыдущему слову.
const PREP_WORDS = new Set([
  'а', 'и', 'в', 'к', 'о', 'с', 'у', 'я',
  'но', 'да', 'из', 'за', 'на', 'до', 'по', 'от', 'во', 'со', 'ко', 'об', 'ни', 'не',
  'что', 'кто', 'как', 'или', 'для', 'при', 'про', 'без', 'над', 'под', 'чем', 'где', 'то', 'уж', 'уже', 'через', 'чтобы', 'чтоб',
  'это', 'эти', 'эта', 'этот', 'весь', 'вся', 'все', 'всех',
  'который', 'которая', 'которое', 'которые',
]);

const PARTICLE_WORDS = new Set(['ли', 'бы', 'же', 'ж', 'б']);

function fixShortWords(text) {
  const tokens = text.match(new RegExp(`[${LETTER_CLASS}0-9]+|[^${LETTER_CLASS}0-9]+`, 'g'));
  if (!tokens) return text;

  const spaceAtStart = (gap) => gap[0] === ' ' && gap.indexOf(' ', 1) === -1;
  const spaceAtEnd = (gap) => gap[gap.length - 1] === ' ' && gap.lastIndexOf(' ', gap.length - 2) === -1;

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];
    if (!new RegExp(`^[${LETTER_CLASS}]+$`).test(word)) continue;
    const lower = word.toLowerCase();

    if (PREP_WORDS.has(lower)) {
      const gap = tokens[i + 1];
      const next = tokens[i + 2];
      if (gap && spaceAtStart(gap) && next && WORD_START_RE.test(next[0])) {
        tokens[i + 1] = NBSP + gap.slice(1);
      }
    }
    if (PARTICLE_WORDS.has(lower)) {
      const gap = tokens[i - 1];
      const prev = tokens[i - 2];
      if (gap && spaceAtEnd(gap) && prev && WORD_START_RE.test(prev[prev.length - 1])) {
        tokens[i - 1] = gap.slice(0, -1) + NBSP;
      }
    }
  }
  return tokens.join('');
}
