// «А. С. Пушкин» / «А. Пушкин» — НБСП после инициала(ов) перед фамилией.
function fixInitials(text) {
  let out = text;
  out = out.replace(new RegExp(`(^|${NOT_LETTER})([А-ЯЁ])\\.[ ]+([А-ЯЁ])\\.[ ]+(?=[А-ЯЁ][а-яё])`, 'gu'),
    (_m, p1, a, b) => `${p1}${a}.${NBSP}${b}.${NBSP}`);
  out = out.replace(new RegExp(`(^|${NOT_LETTER})([А-ЯЁ])\\.[ ]+(?=[А-ЯЁ][а-яё]{2,})`, 'gu'),
    (_m, p1, a) => `${p1}${a}.${NBSP}`);
  return out;
}
