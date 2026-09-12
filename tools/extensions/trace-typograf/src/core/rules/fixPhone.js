// Российский телефон в любом написании → "+7 (XXX) XXX-XX-XX" с НБСП после "+7".
function fixPhone(text) {
  const PHONE_RE = new RegExp(`(?<![\\d${LETTER_CLASS}])(?:\\+?7|8)(?:[ ${NBSP}\\-${NON_BREAKING_HYPHEN}()]*\\d){10}(?![\\d${LETTER_CLASS}])`, 'g');
  return text.replace(PHONE_RE, (m) => {
    const digits = m.replace(/\D/g, '').slice(-10);
    const area = digits.slice(0, 3);
    const p1 = digits.slice(3, 6);
    const p2 = digits.slice(6, 8);
    const p3 = digits.slice(8, 10);
    return `+7${NBSP}(${area})${NBSP}${p1}-${p2}-${p3}`;
  });
}
