import { BADGE_CLASS, CLASS_BADGE_CLASS, CODE_BADGE_CLASS } from './constants.js';
import { ZINDEX_ICON_DATA_URL, ATTR_ICON_DATA_URL } from './icons.js';

// Один <style> на всё расширение: бейджи ID/класса, иконочная верхняя панель,
// скрытие лишних кнопок у T123/carrier и синий фон carrier-блока в канвасе.
export function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .${BADGE_CLASS} .th-block-id-icon,
    .${CLASS_BADGE_CLASS} .th-block-class-icon,
    .${CODE_BADGE_CLASS} .th-block-code-icon {
      display: flex !important;
      align-items: center;
      justify-content: center;
    }
    .th-icon-only {
      display: flex !important;
      align-items: center;
      justify-content: center;
    }
    /* Кнопка «Опубликовать» — единственная в топбаре с текстом рядом с иконкой. */
    .th-icon-text {
      display: flex !important;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .th-icon-text__label {
      white-space: nowrap;
    }
    /* .dropdown-toggle рисует каретку через ::after (CSS-треугольник border-трюком) —
       это не часть innerHTML, поэтому убирается только так. */
    .th-icon-only.dropdown-toggle::after {
      display: none !important;
    }
    /* .t-button__text у нативных строк .pe-properties__items резервирует слот
       14×14 под иконку через ::before (пустой по умолчанию, картинка задаётся
       модификатором вида .pe-properties__css-class .t-button__text::before) —
       подключаемся к тому же слоту, чтобы не плодить лишний flex-элемент
       (отдельный <span> с иконкой сдвигал бы текст на этот же слот + свой gap). */
    .th-zindex-toggle-btn .t-button__text::before {
      background-image: ${ZINDEX_ICON_DATA_URL};
    }
    .th-attr-toggle-btn .t-button__text::before {
      background-image: ${ATTR_ICON_DATA_URL};
    }
    /* Раскрывающаяся панель атрибута — два поля («имя» и «значение») в ряд. */
    .th-attr-wrapper .th-attr-fields {
      display: flex;
      gap: 8px;
    }
    .th-attr-wrapper .th-attr-fields .pe-form-group {
      flex: 1 1 0;
      min-width: 0;
    }
    /* У ЛЮБОГО блока T123 («HTML-код») кнопка «Настройки» бесполезна — там
       нечего настраивать, кроме кода, который и так открывается кликом по
       блоку (плюс T173, по просьбе пользователя). Прячем ТОЛЬКО саму кнопку
       (не всю группу — в ней рядом лежит «Контент», которую трогать не
       нужно), не только у carrier'ов z-index. */
    .th-hide-settings-panel .tp-record-ui__group > button:has(.tp-record-ui__icon_settings) {
      display: none !important;
    }
    /* Левая рамка/скругление группы висят на :first-child — если «Настройки»
       была первой кнопкой в группе, после её скрытия рамка слева у соседней
       видимой кнопки (например «Контент») пропадает. Рисуем её сами. */
    .th-hide-settings-panel .tp-record-ui__group > button:has(.tp-record-ui__icon_settings):first-child
      + button {
      border-left: 1px solid rgb(204, 204, 204) !important;
      border-radius: 3px !important;
    }
    /* Переключатель типа блока («T123 ▾») — своя отдельная группа
       .tp-record-ui__group_tpl, не пересекается с остальными кнопками панели,
       поэтому прячем группу целиком (без доп. правил на рамки/скругления,
       как для th-carrier-panel выше). */
    .th-hide-settings-panel .tp-record-ui__group_tpl {
      display: none !important;
    }
    /* Панель carrier-блока T123 (им управляет поле z-index в сайдбаре, руками
       трогать не нужно) — прячем всё, кроме родной кнопки «Удалить»:
       переключатель типа блока («T123 ▾»), настройки/редактирование, порядок
       (вверх/вниз), дублировать, скрыть и меню «⋮». */
    .th-carrier-panel .tp-record-ui__group_tpl,
    .th-carrier-panel .tp-record-ui__group:has(.tp-record-ui__icon_settings),
    .th-carrier-panel .tp-record-ui__group:has(.tp-record-ui__icon_up) {
      display: none !important;
    }
    /* «Удалить» сидит в одной группе с «Дублировать», «Скрыть» и меню «⋮» —
       группу целиком оставляем, а прячем в ней все кнопки, КРОМЕ удаления. */
    .th-carrier-panel .tp-record-ui__container_top.tp-record-ui__container_right
      .tp-record-ui__group_borders
      > button:not(:has(.tp-record-ui__icon_delete)) {
      display: none !important;
    }
    /* Родная левая рамка и скругление группы висят на :first-child (кнопка
       «Дублировать»), а не на самой видимой кнопке — при её скрытии рамка
       слева у «Удалить» пропадает. Раз «Удалить» теперь визуально первая
       (и единственная) в группе — рисуем ей рамку/скругление сами, 1:1 с
       тем, что computed-style показывает у родного first-child. */
    .th-carrier-panel .tp-record-ui__container_top.tp-record-ui__container_right
      .tp-record-ui__group_borders
      > button:has(.tp-record-ui__icon_delete) {
      border-left: 1px solid rgb(204, 204, 204) !important;
      border-radius: 3px !important;
    }
    /* У блоков T178/T228 кнопка «Контент» не нужна (по просьбе пользователя) —
       прячем только её, соседей в группе (например «Настройки») не трогаем. */
    .th-hide-content-panel .tp-record-ui__group > button:has(.tp-record-ui__icon_content) {
      display: none !important;
    }
    /* В этой группе «Контент» идёт ПОСЛЕДНИМ (после «Настройки»), а не первым
       (в отличие от th-hide-settings-panel выше, там порядок обратный). Правая рамка/
       скругление группы висят на :last-child — после скрытия «Контент» они
       пропадают у «Настройки», которая теперь становится последней видимой
       кнопкой. Рисуем рамку/скругление ей самой: находим кнопку, у которой
       следующий сосед — скрытая «Контент». */
    .th-hide-content-panel .tp-record-ui__group > button:has(+ button .tp-record-ui__icon_content) {
      border-right: 1px solid rgb(204, 204, 204) !important;
      border-radius: 3px !important;
    }

    /* Хлебная крошка «Мои сайты» в шапке редактора — оставляем только иконку
       домика, текст лишний (по просьбе пользователя). Селектор специально
       ограничен .tp-menu__dashboard, чтобы не задеть текст остальных
       крошек (название проекта/страницы). */
    .tp-menu__dashboard .tp-menu__item__text {
      display: none !important;
    }

    /* Косметика канваса редактора (по просьбе пользователя): скруглённые
       углы у обёртки хедера/футера страницы и у карточек-плейсхолдеров
       блоков (.tmod — то же, что и carrier T123, но правило общее для
       ВСЕХ блоков, не только carrier'ов). */
    .headerfooterpagearea__wrapper {
      border-radius: 12px;
    }
    .tmod {
      border-radius: 20px;
      padding: 15px;
    }
    .tmod__card {
      border-radius: 8px;
    }
    .tn-atom.tn-atom__html {
      border-radius: 16px !important;
      overflow: hidden;
    }
    .td-popup-window {
      border-radius: 20px !important;
      overflow: hidden;
    }

    /* Кнопка «Скопировать» в шапке плейсхолдера T123 (copycode.js) и
       «Открыть» у pop-up блоков (popupopen.js) — справа от родного текста:
       .tmod__header уже flex, прижимаем кнопку к правому краю через
       margin-left:auto. */
    .th-t123-copy-btn,
    .th-popup-open-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-left: auto;
      flex: 0 0 auto;
      align-self: center;
      padding: 8px 14px;
      border: none;
      border-radius: 100px;
      background: rgba(0, 0, 0, 0.06);
      color: rgba(0, 0, 0, 0.75);
      font-size: 12px;
      font-weight: 500;
      line-height: 1;
      cursor: pointer;
      outline: none !important;
      transition: background-color 0.15s ease, color 0.15s ease;
    }
    .th-t123-copy-btn[hidden],
    .th-popup-open-btn[hidden] {
      display: none;
    }
    .th-t123-copy-btn:hover,
    .th-popup-open-btn:hover {
      background: rgba(0, 0, 0, 0.12);
    }
    /* Гасим дефолтную фокус-обводку браузера после клика. */
    .th-t123-copy-btn:focus,
    .th-t123-copy-btn:focus-visible,
    .th-t123-copy-btn:active,
    .th-popup-open-btn:focus,
    .th-popup-open-btn:focus-visible,
    .th-popup-open-btn:active {
      outline: none !important;
      box-shadow: none !important;
    }
    .th-t123-copy-btn[data-copied] {
      background: #2a9e46;
      color: #fff;
    }
    /* У якорного блока (anchorcopy.js) плейсхолдер синий (#edf8ff), а не
       зелёный, как у T123 — состояние «Скопировано» тоже делаем синим. */
    .th-anchor-copy-btn[data-copied] {
      background: #2a7de1;
    }
    .th-t123-copy-btn .th-t123-copy-icon,
    .th-popup-open-btn .th-popup-open-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    /* В мобильном режиме канваса плейсхолдер узкий — родной текст шапки
       сжимается в столбик, а кнопка липнет сбоку. Меряем ширину самого
       плейсхолдера (container query), а не окна: в узкой шапке кнопка
       переносится на свою строку под текстом. */
    .tmod {
      container-type: inline-size;
    }
    @container (max-width: 520px) {
      .tmod__header {
        flex-wrap: wrap;
      }
      /* Переноситься должна только кнопка: текст сжимается на месте,
         оставаясь в одной строке с иконкой. */
      .tmod__header .tmod__text {
        flex: 1 1 0;
        min-width: 0;
      }
      .th-t123-copy-btn,
      .th-popup-open-btn {
        flex-basis: 100%;
        margin-left: 0;
        justify-content: center;
      }
    }
    /* Библиотека блоков всегда раскрыта на 3 колонки (library.js) — стрелка
       сворачивания больше не нужна, прячем, чтобы панель нельзя было
       свернуть обратно (расширение всё равно раскроет её через tick). */
    .tp-library-rightside__expand-btn {
      display: none !important;
    }

    /* Фон carrier-блока в канвасе — свой синий оттенок вместо родного
       зелёного (#eeffed), чтобы визуально отличать служебный блок от
       обычных T123. */
    .th-carrier-block .tmod {
      background-color: #eaf2ff !important;
    }

    /* В настройках блока корзины (T100/st100) поле paymentstat тащит
       родной pe-hint с описанием того, как отправка корзины отражается
       в аналитике (просмотр /submitted//payment/, FB pixel Lead/
       InitiateCheckout) — по просьбе пользователя текст лишний. */
    .pe-form-group[data-tpl-field="paymentstat"] .pe-hint {
      display: none !important;
    }

    /* В канвасе редактора блок корзины (st100) в превью-режиме рисует
       родную инфобоксу-подсказку («Это блок с корзиной...» + ссылка на
       справочный центр) прямо в списке блоков — по просьбе пользователя
       текст лишний. */
    .t706__previewmode-infobox {
      display: none !important;
    }
    /* Тот же блок корзины — паддинг сверху 50px (по просьбе пользователя;
       родной инлайн-стиль задаёт только padding снизу). */
    .t706.t706_previewmode {
      padding-top: 50px !important;
    }

    /* Модалка «HTML → Zero Block» (zeroimport.js). */
    #th-zi-modal {
      position: fixed;
      inset: 0;
      z-index: 100000;
      background: rgba(0, 0, 0, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #th-zi-modal .th-zi-dialog {
      background: #fff;
      border-radius: 10px;
      width: 720px;
      max-width: calc(100vw - 40px);
      max-height: calc(100vh - 60px);
      display: flex;
      flex-direction: column;
      padding: 20px;
      font-family: Arial, sans-serif;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
    }
    #th-zi-modal .th-zi-title {
      font-size: 18px;
      font-weight: 700;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    #th-zi-modal .th-zi-close {
      border: 0;
      background: none;
      font-size: 24px;
      line-height: 1;
      cursor: pointer;
      padding: 0 4px;
    }
    #th-zi-modal .th-zi-hint {
      font-size: 12px;
      color: #666;
      margin-bottom: 12px;
      line-height: 1.4;
    }
    #th-zi-modal .th-zi-source {
      flex: 1;
      min-height: 320px;
      resize: vertical;
      font: 12px/1.5 Menlo, Consolas, monospace;
      border: 1px solid #d5d5d5;
      border-radius: 6px;
      padding: 10px;
      outline: none;
    }
    #th-zi-modal .th-zi-source:focus {
      border-color: #639af9;
    }
    #th-zi-modal .th-zi-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 14px;
      margin-top: 14px;
    }
    #th-zi-modal .th-zi-status {
      font-size: 12px;
      color: #2a9e46;
      flex: 1;
    }
    #th-zi-modal .th-zi-status_error {
      color: #d43f3f;
    }
    #th-zi-modal .th-zi-run {
      background: #000;
      color: #fff;
      border: 0;
      border-radius: 6px;
      padding: 10px 18px;
      font-size: 13px;
      cursor: pointer;
    }
    #th-zi-modal .th-zi-run[disabled] {
      opacity: 0.5;
      cursor: default;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}
