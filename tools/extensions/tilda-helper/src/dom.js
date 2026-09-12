// Общие DOM-хелперы, которыми пользуются обе фичи.

// Блоки страницы — div.r с id="recXXXXXXXXXX". Обычно класс «r t-rec», но
// у некоторых типов (например меню ME100) — только «r», поэтому селектор по
// одному .r, а от мусора защищает проверка id.
export function getAllRecs() {
  const out = [];
  document.querySelectorAll('.r').forEach((r) => {
    if (/^rec\d+$/.test(r.id)) out.push(r);
  });
  return out;
}

// Обёртка записи в общем списке — div#recordXXXXXXXXXX (НЕ .r.t-rec — это
// содержимое ВНУТРИ обёртки), порядок этих div и есть порядок публикации
// (см. tp__saveRecordsSort).
export function getRecordWrapper(fullId) {
  return document.getElementById('record' + fullId.replace('rec', ''));
}

// Код типа блока — data-record-cod на обёртке #recordXXXX. Alias-блок
// (ссылка на блок с другой страницы) не имеет data-record-cod на своей
// обёртке — тип оригинала лежит в data-alias-record-type, читаем его как
// fallback, чтобы правила по типу блока (blocktypes.js, badges.js)
// одинаково работали и для алиасов.
export function getRecordCod(wrapper) {
  if (!wrapper) return null;
  return wrapper.getAttribute('data-record-cod') || wrapper.getAttribute('data-alias-record-type');
}

// Блоки типа T123 «HTML-код» — единственные, чей textContent нам вообще
// интересен (CSS/JS-текст, z-index carrier'ы). Фильтруем по коду типа — это
// O(1) на блок, без чтения textContent.
export function isT123Wrapper(wrapper) {
  return getRecordCod(wrapper) === 'T123';
}

export function getT123Recs() {
  return getAllRecs().filter((r) => isT123Wrapper(getRecordWrapper(r.id)));
}

// Блоки T868 (pop-up) — тот же плейсхолдер-каркас в канвасе, что и у T123
// (.tmod__header / .tmod__cards pre), поэтому кнопка «Скопировать»
// (copycode.js) переиспользуется. Плюс своя кнопка «Открыть» (там же).
export function getT868Recs() {
  return getAllRecs().filter((r) => getRecordCod(getRecordWrapper(r.id)) === 'T868');
}

// Сопоставление панель↔блок — только по геометрии: top панели совпадает
// с top блока с точностью до долей пикселя. Панель Tilda выровнена по
// обёртке #record<id>, а не по .r.t-rec — у некоторых типов (например меню
// ME100C) rec смещён внутри обёртки на десяток пикселей, поэтому сравниваем
// с top обоих.
export function findRecForPanel(panel, recs) {
  const panelTop = panel.getBoundingClientRect().top;
  let best = null;
  let bestDist = 3; // панель и блок совпадают по top почти точно
  for (const rec of recs) {
    let d = Math.abs(rec.getBoundingClientRect().top - panelTop);
    const wrapper = getRecordWrapper(rec.id);
    if (wrapper) {
      d = Math.min(d, Math.abs(wrapper.getBoundingClientRect().top - panelTop));
    }
    if (d < bestDist) {
      bestDist = d;
      best = rec;
    }
  }
  return best;
}

export function waitFor(checkFn, timeout, interval) {
  timeout = timeout || 4000;
  interval = interval || 100;
  return new Promise((resolve) => {
    const start = Date.now();
    (function poll() {
      const result = checkFn();
      if (result) return resolve(result);
      if (Date.now() - start > timeout) return resolve(null);
      setTimeout(poll, interval);
    })();
  });
}

export function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  ta.remove();
  done();
}
