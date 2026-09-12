// Фича «Zero-блок: язык по умолчанию — английский».
//
// Редактор Zero-блока (T396) открывается как iframe СВОЕЙ страницы
// tilda.ru/zero/?recordid=…&pageid=… внутри /page/-редактора (не тот же
// документ/world, поэтому content-script матчится на zero/ отдельным
// entry в manifest.json с all_frames:true).
//
// Дропдаун языка не виден сразу: правая панель по умолчанию — настройки
// артборда (без языка), внутри неё секция «Настройки Zero Block» с кнопкой
// «Открыть» (class .sui-btn-grid-open) — только после клика по ней
// появляется вторая панель с дропдауном языка (виджет «sui-panel», не React):
// <select name="language"><option value="">Default</option>
//   <option value="EN">English</option><option value="RU">Русский</option></select>
// Задача пользователя — English сразу при заходе в Zero-блок, без ручного
// клика по «Открыть». Поэтому автоматически кликаем эту кнопку (синтетический
// .click() — тот же приём уже используется для кнопки добавления блока в
// библиотеке, см. tilda-editor-dom), а на появившемся дропдауне ставим
// English и дёргаем change — точно как ручной выбор в UI (Tilda сама
// применяет смену языка), не лезем в их внутреннее состояние напрямую.
//
// Дальше пользователю не мешаем: каждую кнопку/select обрабатываем РОВНО
// ОДИН РАЗ (WeakSet) — иначе на каждом тике откатывали бы ручной выбор
// пользователя (закрытую панель / другой язык) обратно.
//
// Не кликаем зря: если интерфейс Tilda уже на английском, кнопка называется
// «Open» (не «Открыть») — по решению пользователя это сигнал, что язык блока
// и так по умолчанию English, разворачивать панель незачем.
//
// После смены языка Tilda сама показывает штатный диалог-подтверждение
// перезагрузки (#confirm-dialog-with-promise, универсальный для разных типов
// изменений — не только языка): «Пожалуйста, перезагрузите страницу для
// применения изменений. Перезагрузить сейчас?». Кнопки НЕ трогаем (решение
// перезагружать — за пользователем), только ДОПИСЫВАЕМ в текст пояснение,
// что сработала автосмена языка — иначе человек не поймёт, откуда вдруг
// взялся этот диалог, если сам ничего не менял. Аннотируем ТОЛЬКО если
// диалог появился вскоре после НАШЕЙ смены языка (pendingLanguageReloadNotice
// с TTL) — если он всплыл по другой причине (юзер сам что-то поменял), текст
// не трогаем.

const OPEN_ZERO_BLOCK_PREFS_BTN_SELECTOR = '.sui-btn-grid-open';
const LANGUAGE_SELECT_SELECTOR = 'select[name="language"]';
const DEFAULT_LANG = 'EN';

const RELOAD_DIALOG_CONTENT_SELECTOR = '#confirm-dialog-with-promise .tn-dialog-popup__content';
const LANGUAGE_RELOAD_NOTE = 'Tilda Helper автоматически поставил язык блока — English. ';
const RELOAD_NOTICE_TTL_MS = 5000;

const handledOpenButtons = new WeakSet();
const handledSelects = new WeakSet();
let languageReloadNoticeExpiresAt = 0;

function autoOpenZeroBlockPreferences() {
  document.querySelectorAll(OPEN_ZERO_BLOCK_PREFS_BTN_SELECTOR).forEach((btn) => {
    if (handledOpenButtons.has(btn)) return;
    handledOpenButtons.add(btn);
    if (btn.textContent.trim().toLowerCase() === 'open') return;
    btn.click();
  });
}

function enforceDefaultLanguage() {
  document.querySelectorAll(LANGUAGE_SELECT_SELECTOR).forEach((select) => {
    if (handledSelects.has(select)) return;
    handledSelects.add(select);

    if (select.value === DEFAULT_LANG) return;
    if (!select.querySelector('option[value="' + DEFAULT_LANG + '"]')) return;

    select.value = DEFAULT_LANG;
    // 'input' на случай слушателей на этом событии, 'change' — основной сигнал
    // для sui-панели (не React, обычные DOM-слушатели, native assignment
    // достаточен без трюка с прототипным сеттером).
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    languageReloadNoticeExpiresAt = Date.now() + RELOAD_NOTICE_TTL_MS;
  });
}

function annotateReloadDialogIfPending() {
  if (Date.now() > languageReloadNoticeExpiresAt) return;
  const content = document.querySelector(RELOAD_DIALOG_CONTENT_SELECTOR);
  if (!content || content.dataset.thAnnotated) return;
  content.dataset.thAnnotated = '1';
  content.textContent = LANGUAGE_RELOAD_NOTE + content.textContent.trim();
  languageReloadNoticeExpiresAt = 0; // разово — не переписывать при следующих тиках
}

export function runZeroBlockAutomations() {
  autoOpenZeroBlockPreferences();
  enforceDefaultLanguage();
  annotateReloadDialogIfPending();
}
