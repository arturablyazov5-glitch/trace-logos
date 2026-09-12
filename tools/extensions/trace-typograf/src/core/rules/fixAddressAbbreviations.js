// «г.», «ул.», «кв.» и т. п. перед адресной частью, «обл.»/«р-н» — НБСП
// вместо обычного пробела после сокращения.
function fixAddressAbbreviations(text) {
  let out = text;
  const alt = ADDRESS_PREFIX_ABBR.slice().sort((a, b) => b.length - a.length).join('|');
  out = out.replace(new RegExp(`(^|${NOT_LETTER})(${alt})\\.[ ](?=\\d|[А-ЯЁ])`, 'g'), (_m, p1, abbr) => `${p1}${abbr}.${NBSP}`);
  out = out.replace(/(\S)[ ](обл\.|р-н)/g, `$1${NBSP}$2`);
  return out;
}
