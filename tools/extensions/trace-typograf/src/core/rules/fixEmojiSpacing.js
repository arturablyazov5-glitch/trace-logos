// Ставит НБСП перед эмодзи, если тот приклеен к тексту без пробела.
const EMOJI_RELATED = '\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u{FE0F}\\u{FE0E}\\u{200D}\\u{1F3FB}-\\u{1F3FF}\\u{20E3}';
const EMOJI_GAP_RE = new RegExp(`(?<=[^\\s${EMOJI_RELATED}])(\\p{Extended_Pictographic}|\\p{Regional_Indicator})`, 'gu');

function fixEmojiSpacing(text) {
  return text.replace(EMOJI_GAP_RE, `${NBSP}$1`);
}
