// Фичи библиотеки блоков (модалка добавления блока):
//  1. Порядок в разделе «Другое» — часто используемые шаблоны поднимаются
//     в самый верх: T123 «HTML-код», T173 «Якорная ссылка», T213
//     «Alias-блок», T178 (по просьбе пользователя). Остальные карточки
//     остаются в родном порядке (updateLibraryOrder).
//  2. Раздел «FAQ» — блоки SV501/SV502/SV503 вынесены из «Услуги» в
//     собственный раздел под «Услугами» (updateLibraryFaqSection).
//
// DOM библиотеки: раздел = .tp-library__tpls-list-body, внутри
// .tp-library__tpls-list-body__container, чьи дети — .tp-library__tpl-body
// (по одной карточке; код шаблона — текст .tp-library__tpl-cod). Для (1)
// раздел не вычисляем по id (#tplslist12 может меняться) — просто ищем
// контейнер, в котором есть все нужные карточки. Держится периодическим
// проходом (на tick): библиотека перерисовывается при открытии.

const LIBRARY_TOP_CODES = ['T123', 'T173', 'T213', 'T178', 'T1093'];

// Панель карточек библиотеки по умолчанию свёрнута в одну колонку; стрелка
// справа от списка категорий (.tp-library-rightside__expand-btn) раскрывает
// её на 3 колонки (класс _expanded на контейнере). Tilda это состояние нигде
// не сохраняет — держим раскрытым сами (по просьбе пользователя): пока
// библиотека открыта, каждый tick докликиваем стрелку, если панель свёрнута.
// Кликаем родную кнопку (а не вешаем класс руками), чтобы внутреннее
// состояние Tilda не разошлось с DOM. Guard на tp-library_rightsideopened
// обязателен: клик по кнопке при закрытой панели переключает состояние вслепую.
export function updateLibraryExpanded() {
  const lib = document.querySelector('.tp-library.tp-library_rightsideopened');
  if (!lib) return;
  const cont = lib.querySelector('.tp-library-rightside__container');
  if (!cont || cont.classList.contains('tp-library-rightside__container_expanded')) return;
  const btn = lib.querySelector('.tp-library-rightside__expand-btn');
  if (btn) btn.click();
}

// Раздел строится один раз при инициализации редактора (tp__library__init)
// и переживает открытие/закрытие модалки без перерисовки — но полностью
// пересобирается через tp__library__reinit() (например, после операций с
// избранным), поэтому держим идемпотентным тиком, а не разовой вставкой.
// Клик по разделу — тот же нативный tp__library__openCategory(), что и у
// остальных категорий: он ищет панель по #tplslist${data-library-type-id}
// generically, никакого whitelist'а внутри Tilda нет — проверено вживую
// в консоли редактора.
const FAQ_SOURCE_TYPE_ID = '39'; // «Услуги»
const FAQ_CODES = ['SV501', 'SV502', 'SV503'];
const FAQ_TYPE_ID = 'faq';

export function updateLibraryFaqSection() {
  const uslugi = document.querySelector(
    `.tp-library__type-body[data-library-type-id="${FAQ_SOURCE_TYPE_ID}"]`
  );
  const srcPanel = document.querySelector(`#tplslist${FAQ_SOURCE_TYPE_ID}`);
  if (!uslugi || !srcPanel) return;

  let faqItem = document.querySelector(`.tp-library__type-body[data-library-type-id="${FAQ_TYPE_ID}"]`);
  let panel = document.querySelector(`#tplslist${FAQ_TYPE_ID}`);

  if (!faqItem || !panel) {
    faqItem = uslugi.cloneNode(true);
    faqItem.setAttribute('data-library-type-id', FAQ_TYPE_ID);
    faqItem.classList.remove('tp-library__type-body_active');
    const title = faqItem.querySelector('.tp-library__type-title');
    if (title) title.textContent = 'FAQ';
    uslugi.insertAdjacentElement('afterend', faqItem);
    faqItem.addEventListener('click', () => window.tp__library__openCategory(faqItem));

    panel = srcPanel.cloneNode(false);
    panel.id = `tplslist${FAQ_TYPE_ID}`;
    panel.setAttribute('data-tpls-for-type', FAQ_TYPE_ID);
    panel.classList.remove('tp-library__tpls-list-body_active', 'tp-library__tpls-list-body_visible');
    const closeIcon = srcPanel.querySelector('.tp-library__tpls-list-body-close');
    if (closeIcon) panel.appendChild(closeIcon.cloneNode(true));
    const container = document.createElement('div');
    container.className = 'tp-library__tpls-list-body__container';
    panel.appendChild(container);
    srcPanel.insertAdjacentElement('afterend', panel);
  }

  // Карточки могли вернуться в «Услуги» после частичной перерисовки —
  // переносим на каждом проходе, а не только при первом создании раздела.
  const container = panel.querySelector('.tp-library__tpls-list-body__container');
  if (!container) return;
  srcPanel.querySelectorAll('.tp-library__tpl-cod').forEach((codeEl) => {
    if (!FAQ_CODES.includes(codeEl.textContent.trim())) return;
    const card = codeEl.closest('.tp-library__tpl-body');
    if (card) container.appendChild(card);
  });
}

export function updateLibraryOrder() {
  document.querySelectorAll('.tp-library__tpls-list-body__container').forEach((cont) => {
    const bodies = [...cont.children];
    const byCod = new Map();
    bodies.forEach((b) => {
      const cod = b.querySelector('.tp-library__tpl-cod');
      if (cod) byCod.set(cod.textContent.trim(), b);
    });
    // Не тот раздел (или карточки ещё не отрисованы) — не трогаем.
    if (!LIBRARY_TOP_CODES.every((c) => byCod.has(c))) return;
    // Уже в нужном порядке — выходим, чтобы не дёргать DOM каждый tick.
    if (LIBRARY_TOP_CODES.every((c, i) => bodies[i] === byCod.get(c))) return;
    for (let i = LIBRARY_TOP_CODES.length - 1; i >= 0; i--) {
      cont.insertBefore(byCod.get(LIBRARY_TOP_CODES[i]), cont.firstChild);
    }
  });
}
