(() => {
  // src/constants.js
  var BADGE_CLASS = "th-block-id-badge";
  var CLASS_BADGE_CLASS = "th-block-class-badge";
  var CODE_BADGE_CLASS = "th-block-code-badge";
  var COPIED_TEXT = "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E";
  var CARRIER_MARKER_PREFIX = "th-zi:";
  var ATTR_MARKER_PREFIX = "th-attr:";
  function isCarrierText(text) {
    return text.includes(CARRIER_MARKER_PREFIX) || text.includes(ATTR_MARKER_PREFIX);
  }
  var ZINDEX_TOGGLE_CLASS = "th-zindex-toggle-btn";
  var ZINDEX_WRAPPER_CLASS = "th-zindex-wrapper";
  var ATTR_TOGGLE_CLASS = "th-attr-toggle-btn";
  var ATTR_WRAPPER_CLASS = "th-attr-wrapper";
  var T123_TPLID = "131";
  var T396_TPLID = "396";
  var LIVE_CSS_ZINDEX_ID = "th-live-css-zindex";
  var LIVE_CSS_BLOCK_PREFIX = "th-live-css-";
  var CARRIER_PLACEHOLDER_TEXT = "\u0421\u043B\u0443\u0436\u0435\u0431\u043D\u044B\u0439 \u0431\u043B\u043E\u043A Tilda Helper. \u0417\u0430\u0434\u0430\u0451\u0442 z\u2011index \u0438\u043B\u0438 \u0430\u0442\u0440\u0438\u0431\u0443\u0442 \u0431\u043B\u043E\u043A\u0443 \u0432\u044B\u0448\u0435. \u0423\u043F\u0440\u0430\u0432\u043B\u044F\u0439\u0442\u0435 \u0438\u043C \u0447\u0435\u0440\u0435\u0437 \u043F\u043E\u043B\u044F \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445 \u0442\u043E\u0433\u043E \u0431\u043B\u043E\u043A\u0430";

  // src/icons.js
  var COPY_ICON_SVG = `
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  `;
  var CLASS_ICON_SVG = COPY_ICON_SVG;
  var CODE_ICON_SVG = `
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
    </svg>
  `;
  var EYE_ICON_SVG = `
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  `;
  var PUBLISH_ICON_SVG = `
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
      <polyline points="16 16 12 12 8 16"></polyline>
      <line x1="12" y1="12" x2="12" y2="21"></line>
    </svg>
  `;
  var SETTINGS_ICON_SVG = `
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  `;
  var MORE_ICON_SVG = `
    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" stroke="none">
      <circle cx="12" cy="5" r="1.6"></circle>
      <circle cx="12" cy="12" r="1.6"></circle>
      <circle cx="12" cy="19" r="1.6"></circle>
    </svg>
  `;
  var MULTIPREVIEW_ICON_SVG = `
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"
         stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="1.5" y="4" width="12" height="9" rx="1"></rect>
      <rect x="15" y="6.5" width="7.5" height="13.5" rx="1"></rect>
      <line x1="4.5" y1="16" x2="10.5" y2="16"></line>
    </svg>
  `;
  var ZINDEX_ICON_DATA_URL = 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>'
  ) + '")';
  var ATTR_ICON_DATA_URL = 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>'
  ) + '")';

  // src/styles.js
  function injectStyles() {
    const style = document.createElement("style");
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
    /* \u041A\u043D\u043E\u043F\u043A\u0430 \xAB\u041E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u0442\u044C\xBB \u2014 \u0435\u0434\u0438\u043D\u0441\u0442\u0432\u0435\u043D\u043D\u0430\u044F \u0432 \u0442\u043E\u043F\u0431\u0430\u0440\u0435 \u0441 \u0442\u0435\u043A\u0441\u0442\u043E\u043C \u0440\u044F\u0434\u043E\u043C \u0441 \u0438\u043A\u043E\u043D\u043A\u043E\u0439. */
    .th-icon-text {
      display: flex !important;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .th-icon-text__label {
      white-space: nowrap;
    }
    /* .dropdown-toggle \u0440\u0438\u0441\u0443\u0435\u0442 \u043A\u0430\u0440\u0435\u0442\u043A\u0443 \u0447\u0435\u0440\u0435\u0437 ::after (CSS-\u0442\u0440\u0435\u0443\u0433\u043E\u043B\u044C\u043D\u0438\u043A border-\u0442\u0440\u044E\u043A\u043E\u043C) \u2014
       \u044D\u0442\u043E \u043D\u0435 \u0447\u0430\u0441\u0442\u044C innerHTML, \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u0443\u0431\u0438\u0440\u0430\u0435\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0442\u0430\u043A. */
    .th-icon-only.dropdown-toggle::after {
      display: none !important;
    }
    /* .t-button__text \u0443 \u043D\u0430\u0442\u0438\u0432\u043D\u044B\u0445 \u0441\u0442\u0440\u043E\u043A .pe-properties__items \u0440\u0435\u0437\u0435\u0440\u0432\u0438\u0440\u0443\u0435\u0442 \u0441\u043B\u043E\u0442
       14\xD714 \u043F\u043E\u0434 \u0438\u043A\u043E\u043D\u043A\u0443 \u0447\u0435\u0440\u0435\u0437 ::before (\u043F\u0443\u0441\u0442\u043E\u0439 \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E, \u043A\u0430\u0440\u0442\u0438\u043D\u043A\u0430 \u0437\u0430\u0434\u0430\u0451\u0442\u0441\u044F
       \u043C\u043E\u0434\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440\u043E\u043C \u0432\u0438\u0434\u0430 .pe-properties__css-class .t-button__text::before) \u2014
       \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0430\u0435\u043C\u0441\u044F \u043A \u0442\u043E\u043C\u0443 \u0436\u0435 \u0441\u043B\u043E\u0442\u0443, \u0447\u0442\u043E\u0431\u044B \u043D\u0435 \u043F\u043B\u043E\u0434\u0438\u0442\u044C \u043B\u0438\u0448\u043D\u0438\u0439 flex-\u044D\u043B\u0435\u043C\u0435\u043D\u0442
       (\u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0439 <span> \u0441 \u0438\u043A\u043E\u043D\u043A\u043E\u0439 \u0441\u0434\u0432\u0438\u0433\u0430\u043B \u0431\u044B \u0442\u0435\u043A\u0441\u0442 \u043D\u0430 \u044D\u0442\u043E\u0442 \u0436\u0435 \u0441\u043B\u043E\u0442 + \u0441\u0432\u043E\u0439 gap). */
    .th-zindex-toggle-btn .t-button__text::before {
      background-image: ${ZINDEX_ICON_DATA_URL};
    }
    .th-attr-toggle-btn .t-button__text::before {
      background-image: ${ATTR_ICON_DATA_URL};
    }
    /* \u0420\u0430\u0441\u043A\u0440\u044B\u0432\u0430\u044E\u0449\u0430\u044F\u0441\u044F \u043F\u0430\u043D\u0435\u043B\u044C \u0430\u0442\u0440\u0438\u0431\u0443\u0442\u0430 \u2014 \u0434\u0432\u0430 \u043F\u043E\u043B\u044F (\xAB\u0438\u043C\u044F\xBB \u0438 \xAB\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435\xBB) \u0432 \u0440\u044F\u0434. */
    .th-attr-wrapper .th-attr-fields {
      display: flex;
      gap: 8px;
    }
    .th-attr-wrapper .th-attr-fields .pe-form-group {
      flex: 1 1 0;
      min-width: 0;
    }
    /* \u0423 \u041B\u042E\u0411\u041E\u0413\u041E \u0431\u043B\u043E\u043A\u0430 T123 (\xABHTML-\u043A\u043E\u0434\xBB) \u043A\u043D\u043E\u043F\u043A\u0430 \xAB\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438\xBB \u0431\u0435\u0441\u043F\u043E\u043B\u0435\u0437\u043D\u0430 \u2014 \u0442\u0430\u043C
       \u043D\u0435\u0447\u0435\u0433\u043E \u043D\u0430\u0441\u0442\u0440\u0430\u0438\u0432\u0430\u0442\u044C, \u043A\u0440\u043E\u043C\u0435 \u043A\u043E\u0434\u0430, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u0438 \u0442\u0430\u043A \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043A\u043B\u0438\u043A\u043E\u043C \u043F\u043E
       \u0431\u043B\u043E\u043A\u0443 (\u043F\u043B\u044E\u0441 T173, \u043F\u043E \u043F\u0440\u043E\u0441\u044C\u0431\u0435 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F). \u041F\u0440\u044F\u0447\u0435\u043C \u0422\u041E\u041B\u042C\u041A\u041E \u0441\u0430\u043C\u0443 \u043A\u043D\u043E\u043F\u043A\u0443
       (\u043D\u0435 \u0432\u0441\u044E \u0433\u0440\u0443\u043F\u043F\u0443 \u2014 \u0432 \u043D\u0435\u0439 \u0440\u044F\u0434\u043E\u043C \u043B\u0435\u0436\u0438\u0442 \xAB\u041A\u043E\u043D\u0442\u0435\u043D\u0442\xBB, \u043A\u043E\u0442\u043E\u0440\u0443\u044E \u0442\u0440\u043E\u0433\u0430\u0442\u044C \u043D\u0435
       \u043D\u0443\u0436\u043D\u043E), \u043D\u0435 \u0442\u043E\u043B\u044C\u043A\u043E \u0443 carrier'\u043E\u0432 z-index. */
    .th-hide-settings-panel .tp-record-ui__group > button:has(.tp-record-ui__icon_settings) {
      display: none !important;
    }
    /* \u041B\u0435\u0432\u0430\u044F \u0440\u0430\u043C\u043A\u0430/\u0441\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u0435 \u0433\u0440\u0443\u043F\u043F\u044B \u0432\u0438\u0441\u044F\u0442 \u043D\u0430 :first-child \u2014 \u0435\u0441\u043B\u0438 \xAB\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438\xBB
       \u0431\u044B\u043B\u0430 \u043F\u0435\u0440\u0432\u043E\u0439 \u043A\u043D\u043E\u043F\u043A\u043E\u0439 \u0432 \u0433\u0440\u0443\u043F\u043F\u0435, \u043F\u043E\u0441\u043B\u0435 \u0435\u0451 \u0441\u043A\u0440\u044B\u0442\u0438\u044F \u0440\u0430\u043C\u043A\u0430 \u0441\u043B\u0435\u0432\u0430 \u0443 \u0441\u043E\u0441\u0435\u0434\u043D\u0435\u0439
       \u0432\u0438\u0434\u0438\u043C\u043E\u0439 \u043A\u043D\u043E\u043F\u043A\u0438 (\u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 \xAB\u041A\u043E\u043D\u0442\u0435\u043D\u0442\xBB) \u043F\u0440\u043E\u043F\u0430\u0434\u0430\u0435\u0442. \u0420\u0438\u0441\u0443\u0435\u043C \u0435\u0451 \u0441\u0430\u043C\u0438. */
    .th-hide-settings-panel .tp-record-ui__group > button:has(.tp-record-ui__icon_settings):first-child
      + button {
      border-left: 1px solid rgb(204, 204, 204) !important;
      border-radius: 3px !important;
    }
    /* \u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0442\u0435\u043B\u044C \u0442\u0438\u043F\u0430 \u0431\u043B\u043E\u043A\u0430 (\xABT123 \u25BE\xBB) \u2014 \u0441\u0432\u043E\u044F \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u0430\u044F \u0433\u0440\u0443\u043F\u043F\u0430
       .tp-record-ui__group_tpl, \u043D\u0435 \u043F\u0435\u0440\u0435\u0441\u0435\u043A\u0430\u0435\u0442\u0441\u044F \u0441 \u043E\u0441\u0442\u0430\u043B\u044C\u043D\u044B\u043C\u0438 \u043A\u043D\u043E\u043F\u043A\u0430\u043C\u0438 \u043F\u0430\u043D\u0435\u043B\u0438,
       \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u043F\u0440\u044F\u0447\u0435\u043C \u0433\u0440\u0443\u043F\u043F\u0443 \u0446\u0435\u043B\u0438\u043A\u043E\u043C (\u0431\u0435\u0437 \u0434\u043E\u043F. \u043F\u0440\u0430\u0432\u0438\u043B \u043D\u0430 \u0440\u0430\u043C\u043A\u0438/\u0441\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u044F,
       \u043A\u0430\u043A \u0434\u043B\u044F th-carrier-panel \u0432\u044B\u0448\u0435). */
    .th-hide-settings-panel .tp-record-ui__group_tpl {
      display: none !important;
    }
    /* \u041F\u0430\u043D\u0435\u043B\u044C carrier-\u0431\u043B\u043E\u043A\u0430 T123 (\u0438\u043C \u0443\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442 \u043F\u043E\u043B\u0435 z-index \u0432 \u0441\u0430\u0439\u0434\u0431\u0430\u0440\u0435, \u0440\u0443\u043A\u0430\u043C\u0438
       \u0442\u0440\u043E\u0433\u0430\u0442\u044C \u043D\u0435 \u043D\u0443\u0436\u043D\u043E) \u2014 \u043F\u0440\u044F\u0447\u0435\u043C \u0432\u0441\u0451, \u043A\u0440\u043E\u043C\u0435 \u0440\u043E\u0434\u043D\u043E\u0439 \u043A\u043D\u043E\u043F\u043A\u0438 \xAB\u0423\u0434\u0430\u043B\u0438\u0442\u044C\xBB:
       \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0442\u0435\u043B\u044C \u0442\u0438\u043F\u0430 \u0431\u043B\u043E\u043A\u0430 (\xABT123 \u25BE\xBB), \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438/\u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435, \u043F\u043E\u0440\u044F\u0434\u043E\u043A
       (\u0432\u0432\u0435\u0440\u0445/\u0432\u043D\u0438\u0437), \u0434\u0443\u0431\u043B\u0438\u0440\u043E\u0432\u0430\u0442\u044C, \u0441\u043A\u0440\u044B\u0442\u044C \u0438 \u043C\u0435\u043D\u044E \xAB\u22EE\xBB. */
    .th-carrier-panel .tp-record-ui__group_tpl,
    .th-carrier-panel .tp-record-ui__group:has(.tp-record-ui__icon_settings),
    .th-carrier-panel .tp-record-ui__group:has(.tp-record-ui__icon_up) {
      display: none !important;
    }
    /* \xAB\u0423\u0434\u0430\u043B\u0438\u0442\u044C\xBB \u0441\u0438\u0434\u0438\u0442 \u0432 \u043E\u0434\u043D\u043E\u0439 \u0433\u0440\u0443\u043F\u043F\u0435 \u0441 \xAB\u0414\u0443\u0431\u043B\u0438\u0440\u043E\u0432\u0430\u0442\u044C\xBB, \xAB\u0421\u043A\u0440\u044B\u0442\u044C\xBB \u0438 \u043C\u0435\u043D\u044E \xAB\u22EE\xBB \u2014
       \u0433\u0440\u0443\u043F\u043F\u0443 \u0446\u0435\u043B\u0438\u043A\u043E\u043C \u043E\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u043C, \u0430 \u043F\u0440\u044F\u0447\u0435\u043C \u0432 \u043D\u0435\u0439 \u0432\u0441\u0435 \u043A\u043D\u043E\u043F\u043A\u0438, \u041A\u0420\u041E\u041C\u0415 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F. */
    .th-carrier-panel .tp-record-ui__container_top.tp-record-ui__container_right
      .tp-record-ui__group_borders
      > button:not(:has(.tp-record-ui__icon_delete)) {
      display: none !important;
    }
    /* \u0420\u043E\u0434\u043D\u0430\u044F \u043B\u0435\u0432\u0430\u044F \u0440\u0430\u043C\u043A\u0430 \u0438 \u0441\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u0435 \u0433\u0440\u0443\u043F\u043F\u044B \u0432\u0438\u0441\u044F\u0442 \u043D\u0430 :first-child (\u043A\u043D\u043E\u043F\u043A\u0430
       \xAB\u0414\u0443\u0431\u043B\u0438\u0440\u043E\u0432\u0430\u0442\u044C\xBB), \u0430 \u043D\u0435 \u043D\u0430 \u0441\u0430\u043C\u043E\u0439 \u0432\u0438\u0434\u0438\u043C\u043E\u0439 \u043A\u043D\u043E\u043F\u043A\u0435 \u2014 \u043F\u0440\u0438 \u0435\u0451 \u0441\u043A\u0440\u044B\u0442\u0438\u0438 \u0440\u0430\u043C\u043A\u0430
       \u0441\u043B\u0435\u0432\u0430 \u0443 \xAB\u0423\u0434\u0430\u043B\u0438\u0442\u044C\xBB \u043F\u0440\u043E\u043F\u0430\u0434\u0430\u0435\u0442. \u0420\u0430\u0437 \xAB\u0423\u0434\u0430\u043B\u0438\u0442\u044C\xBB \u0442\u0435\u043F\u0435\u0440\u044C \u0432\u0438\u0437\u0443\u0430\u043B\u044C\u043D\u043E \u043F\u0435\u0440\u0432\u0430\u044F
       (\u0438 \u0435\u0434\u0438\u043D\u0441\u0442\u0432\u0435\u043D\u043D\u0430\u044F) \u0432 \u0433\u0440\u0443\u043F\u043F\u0435 \u2014 \u0440\u0438\u0441\u0443\u0435\u043C \u0435\u0439 \u0440\u0430\u043C\u043A\u0443/\u0441\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u0435 \u0441\u0430\u043C\u0438, 1:1 \u0441
       \u0442\u0435\u043C, \u0447\u0442\u043E computed-style \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u0443 \u0440\u043E\u0434\u043D\u043E\u0433\u043E first-child. */
    .th-carrier-panel .tp-record-ui__container_top.tp-record-ui__container_right
      .tp-record-ui__group_borders
      > button:has(.tp-record-ui__icon_delete) {
      border-left: 1px solid rgb(204, 204, 204) !important;
      border-radius: 3px !important;
    }
    /* \u0423 \u0431\u043B\u043E\u043A\u043E\u0432 T178/T228 \u043A\u043D\u043E\u043F\u043A\u0430 \xAB\u041A\u043E\u043D\u0442\u0435\u043D\u0442\xBB \u043D\u0435 \u043D\u0443\u0436\u043D\u0430 (\u043F\u043E \u043F\u0440\u043E\u0441\u044C\u0431\u0435 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F) \u2014
       \u043F\u0440\u044F\u0447\u0435\u043C \u0442\u043E\u043B\u044C\u043A\u043E \u0435\u0451, \u0441\u043E\u0441\u0435\u0434\u0435\u0439 \u0432 \u0433\u0440\u0443\u043F\u043F\u0435 (\u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 \xAB\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438\xBB) \u043D\u0435 \u0442\u0440\u043E\u0433\u0430\u0435\u043C. */
    .th-hide-content-panel .tp-record-ui__group > button:has(.tp-record-ui__icon_content) {
      display: none !important;
    }
    /* \u0412 \u044D\u0442\u043E\u0439 \u0433\u0440\u0443\u043F\u043F\u0435 \xAB\u041A\u043E\u043D\u0442\u0435\u043D\u0442\xBB \u0438\u0434\u0451\u0442 \u041F\u041E\u0421\u041B\u0415\u0414\u041D\u0418\u041C (\u043F\u043E\u0441\u043B\u0435 \xAB\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438\xBB), \u0430 \u043D\u0435 \u043F\u0435\u0440\u0432\u044B\u043C
       (\u0432 \u043E\u0442\u043B\u0438\u0447\u0438\u0435 \u043E\u0442 th-hide-settings-panel \u0432\u044B\u0448\u0435, \u0442\u0430\u043C \u043F\u043E\u0440\u044F\u0434\u043E\u043A \u043E\u0431\u0440\u0430\u0442\u043D\u044B\u0439). \u041F\u0440\u0430\u0432\u0430\u044F \u0440\u0430\u043C\u043A\u0430/
       \u0441\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u0435 \u0433\u0440\u0443\u043F\u043F\u044B \u0432\u0438\u0441\u044F\u0442 \u043D\u0430 :last-child \u2014 \u043F\u043E\u0441\u043B\u0435 \u0441\u043A\u0440\u044B\u0442\u0438\u044F \xAB\u041A\u043E\u043D\u0442\u0435\u043D\u0442\xBB \u043E\u043D\u0438
       \u043F\u0440\u043E\u043F\u0430\u0434\u0430\u044E\u0442 \u0443 \xAB\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438\xBB, \u043A\u043E\u0442\u043E\u0440\u0430\u044F \u0442\u0435\u043F\u0435\u0440\u044C \u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0441\u044F \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0439 \u0432\u0438\u0434\u0438\u043C\u043E\u0439
       \u043A\u043D\u043E\u043F\u043A\u043E\u0439. \u0420\u0438\u0441\u0443\u0435\u043C \u0440\u0430\u043C\u043A\u0443/\u0441\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u0435 \u0435\u0439 \u0441\u0430\u043C\u043E\u0439: \u043D\u0430\u0445\u043E\u0434\u0438\u043C \u043A\u043D\u043E\u043F\u043A\u0443, \u0443 \u043A\u043E\u0442\u043E\u0440\u043E\u0439
       \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u0441\u043E\u0441\u0435\u0434 \u2014 \u0441\u043A\u0440\u044B\u0442\u0430\u044F \xAB\u041A\u043E\u043D\u0442\u0435\u043D\u0442\xBB. */
    .th-hide-content-panel .tp-record-ui__group > button:has(+ button .tp-record-ui__icon_content) {
      border-right: 1px solid rgb(204, 204, 204) !important;
      border-radius: 3px !important;
    }

    /* \u0425\u043B\u0435\u0431\u043D\u0430\u044F \u043A\u0440\u043E\u0448\u043A\u0430 \xAB\u041C\u043E\u0438 \u0441\u0430\u0439\u0442\u044B\xBB \u0432 \u0448\u0430\u043F\u043A\u0435 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0430 \u2014 \u043E\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u043C \u0442\u043E\u043B\u044C\u043A\u043E \u0438\u043A\u043E\u043D\u043A\u0443
       \u0434\u043E\u043C\u0438\u043A\u0430, \u0442\u0435\u043A\u0441\u0442 \u043B\u0438\u0448\u043D\u0438\u0439 (\u043F\u043E \u043F\u0440\u043E\u0441\u044C\u0431\u0435 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F). \u0421\u0435\u043B\u0435\u043A\u0442\u043E\u0440 \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u044C\u043D\u043E
       \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D .tp-menu__dashboard, \u0447\u0442\u043E\u0431\u044B \u043D\u0435 \u0437\u0430\u0434\u0435\u0442\u044C \u0442\u0435\u043A\u0441\u0442 \u043E\u0441\u0442\u0430\u043B\u044C\u043D\u044B\u0445
       \u043A\u0440\u043E\u0448\u0435\u043A (\u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043F\u0440\u043E\u0435\u043A\u0442\u0430/\u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B). */
    .tp-menu__dashboard .tp-menu__item__text {
      display: none !important;
    }

    /* \u041A\u043E\u0441\u043C\u0435\u0442\u0438\u043A\u0430 \u043A\u0430\u043D\u0432\u0430\u0441\u0430 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0430 (\u043F\u043E \u043F\u0440\u043E\u0441\u044C\u0431\u0435 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F): \u0441\u043A\u0440\u0443\u0433\u043B\u0451\u043D\u043D\u044B\u0435
       \u0443\u0433\u043B\u044B \u0443 \u043E\u0431\u0451\u0440\u0442\u043A\u0438 \u0445\u0435\u0434\u0435\u0440\u0430/\u0444\u0443\u0442\u0435\u0440\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u0438 \u0443 \u043A\u0430\u0440\u0442\u043E\u0447\u0435\u043A-\u043F\u043B\u0435\u0439\u0441\u0445\u043E\u043B\u0434\u0435\u0440\u043E\u0432
       \u0431\u043B\u043E\u043A\u043E\u0432 (.tmod \u2014 \u0442\u043E \u0436\u0435, \u0447\u0442\u043E \u0438 carrier T123, \u043D\u043E \u043F\u0440\u0430\u0432\u0438\u043B\u043E \u043E\u0431\u0449\u0435\u0435 \u0434\u043B\u044F
       \u0412\u0421\u0415\u0425 \u0431\u043B\u043E\u043A\u043E\u0432, \u043D\u0435 \u0442\u043E\u043B\u044C\u043A\u043E carrier'\u043E\u0432). */
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

    /* \u041A\u043D\u043E\u043F\u043A\u0430 \xAB\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C\xBB \u0432 \u0448\u0430\u043F\u043A\u0435 \u043F\u043B\u0435\u0439\u0441\u0445\u043E\u043B\u0434\u0435\u0440\u0430 T123 (copycode.js) \u0438
       \xAB\u041E\u0442\u043A\u0440\u044B\u0442\u044C\xBB \u0443 pop-up \u0431\u043B\u043E\u043A\u043E\u0432 (popupopen.js) \u2014 \u0441\u043F\u0440\u0430\u0432\u0430 \u043E\u0442 \u0440\u043E\u0434\u043D\u043E\u0433\u043E \u0442\u0435\u043A\u0441\u0442\u0430:
       .tmod__header \u0443\u0436\u0435 flex, \u043F\u0440\u0438\u0436\u0438\u043C\u0430\u0435\u043C \u043A\u043D\u043E\u043F\u043A\u0443 \u043A \u043F\u0440\u0430\u0432\u043E\u043C\u0443 \u043A\u0440\u0430\u044E \u0447\u0435\u0440\u0435\u0437
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
    /* \u0413\u0430\u0441\u0438\u043C \u0434\u0435\u0444\u043E\u043B\u0442\u043D\u0443\u044E \u0444\u043E\u043A\u0443\u0441-\u043E\u0431\u0432\u043E\u0434\u043A\u0443 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0430 \u043F\u043E\u0441\u043B\u0435 \u043A\u043B\u0438\u043A\u0430. */
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
    /* \u0423 \u044F\u043A\u043E\u0440\u043D\u043E\u0433\u043E \u0431\u043B\u043E\u043A\u0430 (anchorcopy.js) \u043F\u043B\u0435\u0439\u0441\u0445\u043E\u043B\u0434\u0435\u0440 \u0441\u0438\u043D\u0438\u0439 (#edf8ff), \u0430 \u043D\u0435
       \u0437\u0435\u043B\u0451\u043D\u044B\u0439, \u043A\u0430\u043A \u0443 T123 \u2014 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \xAB\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E\xBB \u0442\u043E\u0436\u0435 \u0434\u0435\u043B\u0430\u0435\u043C \u0441\u0438\u043D\u0438\u043C. */
    .th-anchor-copy-btn[data-copied] {
      background: #2a7de1;
    }
    .th-t123-copy-btn .th-t123-copy-icon,
    .th-popup-open-btn .th-popup-open-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    /* \u0412 \u043C\u043E\u0431\u0438\u043B\u044C\u043D\u043E\u043C \u0440\u0435\u0436\u0438\u043C\u0435 \u043A\u0430\u043D\u0432\u0430\u0441\u0430 \u043F\u043B\u0435\u0439\u0441\u0445\u043E\u043B\u0434\u0435\u0440 \u0443\u0437\u043A\u0438\u0439 \u2014 \u0440\u043E\u0434\u043D\u043E\u0439 \u0442\u0435\u043A\u0441\u0442 \u0448\u0430\u043F\u043A\u0438
       \u0441\u0436\u0438\u043C\u0430\u0435\u0442\u0441\u044F \u0432 \u0441\u0442\u043E\u043B\u0431\u0438\u043A, \u0430 \u043A\u043D\u043E\u043F\u043A\u0430 \u043B\u0438\u043F\u043D\u0435\u0442 \u0441\u0431\u043E\u043A\u0443. \u041C\u0435\u0440\u044F\u0435\u043C \u0448\u0438\u0440\u0438\u043D\u0443 \u0441\u0430\u043C\u043E\u0433\u043E
       \u043F\u043B\u0435\u0439\u0441\u0445\u043E\u043B\u0434\u0435\u0440\u0430 (container query), \u0430 \u043D\u0435 \u043E\u043A\u043D\u0430: \u0432 \u0443\u0437\u043A\u043E\u0439 \u0448\u0430\u043F\u043A\u0435 \u043A\u043D\u043E\u043F\u043A\u0430
       \u043F\u0435\u0440\u0435\u043D\u043E\u0441\u0438\u0442\u0441\u044F \u043D\u0430 \u0441\u0432\u043E\u044E \u0441\u0442\u0440\u043E\u043A\u0443 \u043F\u043E\u0434 \u0442\u0435\u043A\u0441\u0442\u043E\u043C. */
    .tmod {
      container-type: inline-size;
    }
    @container (max-width: 520px) {
      .tmod__header {
        flex-wrap: wrap;
      }
      /* \u041F\u0435\u0440\u0435\u043D\u043E\u0441\u0438\u0442\u044C\u0441\u044F \u0434\u043E\u043B\u0436\u043D\u0430 \u0442\u043E\u043B\u044C\u043A\u043E \u043A\u043D\u043E\u043F\u043A\u0430: \u0442\u0435\u043A\u0441\u0442 \u0441\u0436\u0438\u043C\u0430\u0435\u0442\u0441\u044F \u043D\u0430 \u043C\u0435\u0441\u0442\u0435,
         \u043E\u0441\u0442\u0430\u0432\u0430\u044F\u0441\u044C \u0432 \u043E\u0434\u043D\u043E\u0439 \u0441\u0442\u0440\u043E\u043A\u0435 \u0441 \u0438\u043A\u043E\u043D\u043A\u043E\u0439. */
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
    /* \u0411\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430 \u0431\u043B\u043E\u043A\u043E\u0432 \u0432\u0441\u0435\u0433\u0434\u0430 \u0440\u0430\u0441\u043A\u0440\u044B\u0442\u0430 \u043D\u0430 3 \u043A\u043E\u043B\u043E\u043D\u043A\u0438 (library.js) \u2014 \u0441\u0442\u0440\u0435\u043B\u043A\u0430
       \u0441\u0432\u043E\u0440\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u044F \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0435 \u043D\u0443\u0436\u043D\u0430, \u043F\u0440\u044F\u0447\u0435\u043C, \u0447\u0442\u043E\u0431\u044B \u043F\u0430\u043D\u0435\u043B\u044C \u043D\u0435\u043B\u044C\u0437\u044F \u0431\u044B\u043B\u043E
       \u0441\u0432\u0435\u0440\u043D\u0443\u0442\u044C \u043E\u0431\u0440\u0430\u0442\u043D\u043E (\u0440\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u0438\u0435 \u0432\u0441\u0451 \u0440\u0430\u0432\u043D\u043E \u0440\u0430\u0441\u043A\u0440\u043E\u0435\u0442 \u0435\u0451 \u0447\u0435\u0440\u0435\u0437 tick). */
    .tp-library-rightside__expand-btn {
      display: none !important;
    }

    /* \u0424\u043E\u043D carrier-\u0431\u043B\u043E\u043A\u0430 \u0432 \u043A\u0430\u043D\u0432\u0430\u0441\u0435 \u2014 \u0441\u0432\u043E\u0439 \u0441\u0438\u043D\u0438\u0439 \u043E\u0442\u0442\u0435\u043D\u043E\u043A \u0432\u043C\u0435\u0441\u0442\u043E \u0440\u043E\u0434\u043D\u043E\u0433\u043E
       \u0437\u0435\u043B\u0451\u043D\u043E\u0433\u043E (#eeffed), \u0447\u0442\u043E\u0431\u044B \u0432\u0438\u0437\u0443\u0430\u043B\u044C\u043D\u043E \u043E\u0442\u043B\u0438\u0447\u0430\u0442\u044C \u0441\u043B\u0443\u0436\u0435\u0431\u043D\u044B\u0439 \u0431\u043B\u043E\u043A \u043E\u0442
       \u043E\u0431\u044B\u0447\u043D\u044B\u0445 T123. */
    .th-carrier-block .tmod {
      background-color: #eaf2ff !important;
    }

    /* \u0412 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445 \u0431\u043B\u043E\u043A\u0430 \u043A\u043E\u0440\u0437\u0438\u043D\u044B (T100/st100) \u043F\u043E\u043B\u0435 paymentstat \u0442\u0430\u0449\u0438\u0442
       \u0440\u043E\u0434\u043D\u043E\u0439 pe-hint \u0441 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435\u043C \u0442\u043E\u0433\u043E, \u043A\u0430\u043A \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0430 \u043A\u043E\u0440\u0437\u0438\u043D\u044B \u043E\u0442\u0440\u0430\u0436\u0430\u0435\u0442\u0441\u044F
       \u0432 \u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0435 (\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 /submitted//payment/, FB pixel Lead/
       InitiateCheckout) \u2014 \u043F\u043E \u043F\u0440\u043E\u0441\u044C\u0431\u0435 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F \u0442\u0435\u043A\u0441\u0442 \u043B\u0438\u0448\u043D\u0438\u0439. */
    .pe-form-group[data-tpl-field="paymentstat"] .pe-hint {
      display: none !important;
    }

    /* \u0412 \u043A\u0430\u043D\u0432\u0430\u0441\u0435 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0430 \u0431\u043B\u043E\u043A \u043A\u043E\u0440\u0437\u0438\u043D\u044B (st100) \u0432 \u043F\u0440\u0435\u0432\u044C\u044E-\u0440\u0435\u0436\u0438\u043C\u0435 \u0440\u0438\u0441\u0443\u0435\u0442
       \u0440\u043E\u0434\u043D\u0443\u044E \u0438\u043D\u0444\u043E\u0431\u043E\u043A\u0441\u0443-\u043F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0443 (\xAB\u042D\u0442\u043E \u0431\u043B\u043E\u043A \u0441 \u043A\u043E\u0440\u0437\u0438\u043D\u043E\u0439...\xBB + \u0441\u0441\u044B\u043B\u043A\u0430 \u043D\u0430
       \u0441\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u044B\u0439 \u0446\u0435\u043D\u0442\u0440) \u043F\u0440\u044F\u043C\u043E \u0432 \u0441\u043F\u0438\u0441\u043A\u0435 \u0431\u043B\u043E\u043A\u043E\u0432 \u2014 \u043F\u043E \u043F\u0440\u043E\u0441\u044C\u0431\u0435 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F
       \u0442\u0435\u043A\u0441\u0442 \u043B\u0438\u0448\u043D\u0438\u0439. */
    .t706__previewmode-infobox {
      display: none !important;
    }
    /* \u0422\u043E\u0442 \u0436\u0435 \u0431\u043B\u043E\u043A \u043A\u043E\u0440\u0437\u0438\u043D\u044B \u2014 \u043F\u0430\u0434\u0434\u0438\u043D\u0433 \u0441\u0432\u0435\u0440\u0445\u0443 50px (\u043F\u043E \u043F\u0440\u043E\u0441\u044C\u0431\u0435 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F;
       \u0440\u043E\u0434\u043D\u043E\u0439 \u0438\u043D\u043B\u0430\u0439\u043D-\u0441\u0442\u0438\u043B\u044C \u0437\u0430\u0434\u0430\u0451\u0442 \u0442\u043E\u043B\u044C\u043A\u043E padding \u0441\u043D\u0438\u0437\u0443). */
    .t706.t706_previewmode {
      padding-top: 50px !important;
    }

    /* \u041C\u043E\u0434\u0430\u043B\u043A\u0430 \xABHTML \u2192 Zero Block\xBB (zeroimport.js). */
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

  // src/dom.js
  function getAllRecs() {
    const out = [];
    document.querySelectorAll(".r").forEach((r) => {
      if (/^rec\d+$/.test(r.id)) out.push(r);
    });
    return out;
  }
  function getRecordWrapper(fullId) {
    return document.getElementById("record" + fullId.replace("rec", ""));
  }
  function getRecordCod(wrapper) {
    if (!wrapper) return null;
    return wrapper.getAttribute("data-record-cod") || wrapper.getAttribute("data-alias-record-type");
  }
  function isT123Wrapper(wrapper) {
    return getRecordCod(wrapper) === "T123";
  }
  function getT123Recs() {
    return getAllRecs().filter((r) => isT123Wrapper(getRecordWrapper(r.id)));
  }
  function getT868Recs() {
    return getAllRecs().filter((r) => getRecordCod(getRecordWrapper(r.id)) === "T868");
  }
  function findRecForPanel(panel, recs) {
    const panelTop = panel.getBoundingClientRect().top;
    let best = null;
    let bestDist = 3;
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
  function waitFor(checkFn, timeout, interval) {
    timeout = timeout || 4e3;
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
  function fallbackCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch (e) {
    }
    ta.remove();
    done();
  }

  // src/blocktypes.js
  var HIDE_CONTENT_CODES = ["T178", "T228", "DV11", "DV01"];
  var HIDE_SETTINGS_CODES = ["T173", "T809", "T223"];
  var HIDE_CODE_BADGE_CODES = ["T173", "T809", "T178", "T228", "DV11", "T218", "T223", "T868"];
  function applyBlockTypePanelClasses(panel, rec, wrapper) {
    const isCarrier = isT123Wrapper(wrapper) && isCarrierText(rec.textContent);
    panel.classList.toggle("th-carrier-panel", isCarrier);
    rec.classList.toggle("th-carrier-block", isCarrier);
    const cod = getRecordCod(wrapper);
    const isAlias = !!(wrapper && wrapper.hasAttribute("data-alias-record-type"));
    const hideSettings = isT123Wrapper(wrapper) || HIDE_SETTINGS_CODES.includes(cod) || isAlias;
    panel.classList.toggle("th-hide-settings-panel", hideSettings);
    const hideContent = HIDE_CONTENT_CODES.includes(cod);
    panel.classList.toggle("th-hide-content-panel", hideContent);
    return isCarrier;
  }
  var HIDDEN_TPL_FIELDS_BY_CODE = {
    DV11: ["margintop", "animationoff", "screenmax"],
    T228: ["margintop", "animationoff", "screenmax"],
    T218: ["margintop", "animationoff", "screenmax"]
  };
  var ALL_HIDEABLE_TPL_FIELDS = ["margintop", "animationoff", "screenmax", "blockbackground"];
  function updateHiddenSidebarFields() {
    const form = document.querySelector(".pe-settings-form[data-rec-id]");
    if (!form) return;
    const body = form.querySelector(".edrec__wrapper.panel-body");
    if (!body) return;
    const wrapper = getRecordWrapper("rec" + form.dataset.recId);
    const cod = getRecordCod(wrapper);
    const fieldsToHide = HIDDEN_TPL_FIELDS_BY_CODE[cod] || [];
    ALL_HIDEABLE_TPL_FIELDS.forEach((field) => {
      const group = body.querySelector('.pe-form-group[data-tpl-field="' + field + '"]');
      if (group) group.style.display = fieldsToHide.includes(field) ? "none" : "";
    });
  }

  // src/badges.js
  function updateTopToolbar() {
    const previewLi = document.querySelector(".tp-menu__navbar__item_preview");
    if (previewLi && previewLi.style.display !== "none") {
      previewLi.style.display = "none";
    }
    updateUndoRedoVisibility("undo");
    updateUndoRedoVisibility("redo");
    const publishBtn = document.getElementById("page_menu_publishlink");
    if (publishBtn && !publishBtn.dataset.thIcon) {
      publishBtn.dataset.thIcon = "1";
      publishBtn.classList.add("th-icon-text");
      publishBtn.title = "\u041E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u0442\u044C";
      publishBtn.setAttribute("aria-label", "\u041E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u0442\u044C");
      publishBtn.innerHTML = PUBLISH_ICON_SVG + '<span class="th-icon-text__label">\u041E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u0442\u044C</span>';
    }
    const settingsBtn = document.querySelector('button[data-action="settings"]');
    if (settingsBtn && !settingsBtn.dataset.thIcon) {
      settingsBtn.dataset.thIcon = "1";
      settingsBtn.classList.add("th-icon-only");
      settingsBtn.title = "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438";
      settingsBtn.setAttribute("aria-label", "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438");
      settingsBtn.innerHTML = SETTINGS_ICON_SVG;
    }
    const moreBtn = document.querySelector('button[data-action="dropdown"]');
    if (moreBtn && !moreBtn.dataset.thIcon) {
      moreBtn.dataset.thIcon = "1";
      moreBtn.classList.add("th-icon-only");
      moreBtn.title = "\u0415\u0449\u0435";
      moreBtn.setAttribute("aria-label", "\u0415\u0449\u0435");
      moreBtn.innerHTML = MORE_ICON_SVG;
    }
  }
  function updateUndoRedoVisibility(action) {
    const li = document.querySelector(".tp-menu__navbar__item_" + action);
    if (!li) return;
    const btn = li.querySelector('button[data-action="' + action + '"]');
    const disabled = !btn || btn.disabled;
    li.style.display = disabled ? "none" : "";
  }
  function onBadgeClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const badge = e.currentTarget;
    const textSpan = badge.querySelector(".tp-record-ui__button-text");
    const text = "#" + badge.dataset.rec;
    const done = () => {
      badge.dataset.copied = "1";
      textSpan.textContent = COPIED_TEXT;
      setTimeout(() => {
        delete badge.dataset.copied;
        textSpan.textContent = "#" + badge.dataset.rec;
      }, 1200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }
  function onClassBadgeClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const badge = e.currentTarget;
    const textSpan = badge.querySelector(".tp-record-ui__button-text");
    const text = badge.dataset.cls;
    const done = () => {
      badge.dataset.copied = "1";
      textSpan.textContent = COPIED_TEXT;
      setTimeout(() => {
        delete badge.dataset.copied;
        textSpan.textContent = badge.dataset.cls;
      }, 1200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }
  function onCodeBadgeClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const badge = e.currentTarget;
    const textSpan = badge.querySelector(".tp-record-ui__button-text");
    const rec = document.getElementById(badge.dataset.rec);
    const wrapper = getRecordWrapper(badge.dataset.rec);
    const source = wrapper || rec;
    if (!source) return;
    const text = source.outerHTML;
    const done = () => {
      badge.dataset.copied = "1";
      textSpan.textContent = COPIED_TEXT;
      setTimeout(() => {
        delete badge.dataset.copied;
        textSpan.textContent = "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043A\u043E\u0434";
      }, 1200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }
  function updateBadges() {
    const panels = document.querySelectorAll(".tp-record-ui");
    if (!panels.length) return;
    const recs = getAllRecs();
    if (!recs.length) return;
    panels.forEach((panel) => {
      const rec = findRecForPanel(panel, recs);
      if (!rec) return;
      const wrapper = getRecordWrapper(rec.id);
      const isCarrier = applyBlockTypePanelClasses(panel, rec, wrapper);
      const row = panel.querySelector(".tp-record-ui__container_top .tp-record-ui__row");
      if (!row) return;
      let badge = row.querySelector("." + BADGE_CLASS);
      let textSpan;
      if (!badge) {
        const group = document.createElement("div");
        group.className = "tp-record-ui__group";
        badge = document.createElement("button");
        badge.type = "button";
        badge.className = "tp-record-ui__button tp-record-ui__button_white " + BADGE_CLASS;
        badge.title = "ID \u0431\u043B\u043E\u043A\u0430 \u2014 \u043A\u043B\u0438\u043A, \u0447\u0442\u043E\u0431\u044B \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C";
        const icon = document.createElement("span");
        icon.className = "tp-record-ui__icon th-block-id-icon";
        icon.innerHTML = COPY_ICON_SVG;
        textSpan = document.createElement("span");
        textSpan.className = "tp-record-ui__button-text";
        badge.appendChild(icon);
        badge.appendChild(textSpan);
        badge.addEventListener("click", onBadgeClick);
        group.appendChild(badge);
        row.appendChild(group);
      } else {
        textSpan = badge.querySelector(".tp-record-ui__button-text");
      }
      if (badge.dataset.rec !== rec.id && !badge.dataset.copied) {
        badge.dataset.rec = rec.id;
        textSpan.textContent = "#" + rec.id;
      }
      const customClass = wrapper && wrapper.getAttribute("data-custom-class");
      let classBadge = row.querySelector("." + CLASS_BADGE_CLASS);
      if (customClass) {
        if (!classBadge) {
          const classGroup = document.createElement("div");
          classGroup.className = "tp-record-ui__group";
          classBadge = document.createElement("button");
          classBadge.type = "button";
          classBadge.className = "tp-record-ui__button tp-record-ui__button_white " + CLASS_BADGE_CLASS;
          classBadge.title = "CSS \u043A\u043B\u0430\u0441\u0441 \u0431\u043B\u043E\u043A\u0430 \u2014 \u043A\u043B\u0438\u043A, \u0447\u0442\u043E\u0431\u044B \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C";
          const classIcon = document.createElement("span");
          classIcon.className = "tp-record-ui__icon th-block-class-icon";
          classIcon.innerHTML = CLASS_ICON_SVG;
          const classTextSpan2 = document.createElement("span");
          classTextSpan2.className = "tp-record-ui__button-text";
          classBadge.appendChild(classIcon);
          classBadge.appendChild(classTextSpan2);
          classBadge.addEventListener("click", onClassBadgeClick);
          classGroup.appendChild(classBadge);
          row.appendChild(classGroup);
        }
        const classTextSpan = classBadge.querySelector(".tp-record-ui__button-text");
        if (classBadge.dataset.cls !== customClass && !classBadge.dataset.copied) {
          classBadge.dataset.cls = customClass;
          classTextSpan.textContent = customClass;
        }
      } else if (classBadge) {
        classBadge.closest(".tp-record-ui__group").remove();
      }
      const cod = getRecordCod(wrapper);
      const hideCodeBadge = isT123Wrapper(wrapper) || HIDE_CODE_BADGE_CODES.includes(cod);
      let codeBadge = row.querySelector("." + CODE_BADGE_CLASS);
      if (!hideCodeBadge) {
        if (!codeBadge) {
          const codeGroup = document.createElement("div");
          codeGroup.className = "tp-record-ui__group";
          codeBadge = document.createElement("button");
          codeBadge.type = "button";
          codeBadge.className = "tp-record-ui__button tp-record-ui__button_white " + CODE_BADGE_CLASS;
          codeBadge.title = "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0432\u0435\u0441\u044C HTML \u0431\u043B\u043E\u043A\u0430 \u0441\u043E \u0441\u0442\u0438\u043B\u044F\u043C\u0438";
          const codeIcon = document.createElement("span");
          codeIcon.className = "tp-record-ui__icon th-block-code-icon";
          codeIcon.innerHTML = CODE_ICON_SVG;
          const codeTextSpan = document.createElement("span");
          codeTextSpan.className = "tp-record-ui__button-text";
          codeTextSpan.textContent = "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043A\u043E\u0434";
          codeBadge.appendChild(codeIcon);
          codeBadge.appendChild(codeTextSpan);
          codeBadge.addEventListener("click", onCodeBadgeClick);
          codeGroup.appendChild(codeBadge);
          row.appendChild(codeGroup);
        }
        codeBadge.dataset.rec = rec.id;
      } else if (codeBadge) {
        codeBadge.closest(".tp-record-ui__group").remove();
      }
      if (isCarrier) updateCarrierPlaceholderText(rec);
    });
  }
  function updateCarrierPlaceholderText(rec) {
    const holder = rec.querySelector(".tmod__text");
    if (!holder || holder.dataset.thPlaceholderSet) return;
    const leaf = holder.querySelector("div");
    if (!leaf) return;
    leaf.textContent = CARRIER_PLACEHOLDER_TEXT;
    holder.dataset.thPlaceholderSet = "1";
  }

  // src/carrier.js
  function getCurrentZIndexMap() {
    const map = /* @__PURE__ */ new Map();
    getT123Recs().forEach((r) => {
      const t = r.textContent;
      if (!t.includes(CARRIER_MARKER_PREFIX)) return;
      const blockRe = /#rec(\d+)\s*\{([^}]*)\}/g;
      let m;
      while (m = blockRe.exec(t)) {
        const z = m[2].match(/z-index\s*:\s*(-?\d+)/);
        if (z) map.set(m[1], z[1]);
      }
    });
    return map;
  }
  function getCurrentAttrMap() {
    const map = /* @__PURE__ */ new Map();
    getT123Recs().forEach((r) => {
      const t = r.textContent;
      if (!t.includes(ATTR_MARKER_PREFIX)) return;
      const m = t.match(/th-attr:rec(\d+)\s+enc:(\S+)\s+\*\//);
      if (!m) return;
      try {
        const p = JSON.parse(decodeURIComponent(m[2]));
        if (p && typeof p.name === "string" && p.name !== "") {
          map.set(m[1], { name: p.name, value: p.value == null ? "" : String(p.value) });
        }
      } catch (e) {
      }
    });
    return map;
  }
  var zIndexOverrides = /* @__PURE__ */ new Map();
  var attrOverrides = /* @__PURE__ */ new Map();
  function getEffectiveZIndexMap() {
    const map = getCurrentZIndexMap();
    zIndexOverrides.forEach((val, id) => {
      if (val === null) map.delete(id);
      else map.set(id, val);
    });
    return map;
  }
  function getEffectiveAttrMap() {
    const map = getCurrentAttrMap();
    attrOverrides.forEach((val, id) => {
      if (val === null) map.delete(id);
      else map.set(id, val);
    });
    return map;
  }
  function setZIndexOverride(numericId, val) {
    zIndexOverrides.set(numericId, val);
  }
  function setAttrOverride(numericId, info) {
    attrOverrides.set(numericId, info);
  }
  function sameInfo(a, b) {
    if (a === b) return true;
    if (!a || !b) return false;
    return a.name === b.name && a.value === b.value;
  }
  function buildStyleSection(targetFullId, zVal) {
    if (zVal == null) return "";
    return "<style>\n/* " + CARRIER_MARKER_PREFIX + targetFullId + " */\n#" + targetFullId + "{position:relative;z-index:" + zVal + " !important;overflow:visible !important;}\n</style>";
  }
  function buildScriptSection(targetFullId, info) {
    if (!info) return "";
    const enc = encodeURIComponent(JSON.stringify({ name: info.name, value: info.value }));
    const nameJs = JSON.stringify(info.name);
    const valueJs = JSON.stringify(info.value);
    return "<script>\n/* " + ATTR_MARKER_PREFIX + targetFullId + " enc:" + enc + " */\n(function(){try{var e=document.getElementById(" + JSON.stringify(targetFullId) + ");if(e){e.setAttribute(" + nameJs + "," + valueJs + ");}}catch(x){}})();\n<\/script>";
  }
  function buildCarrierContent(targetFullId, zVal, info) {
    return [buildStyleSection(targetFullId, zVal), buildScriptSection(targetFullId, info)].filter(Boolean).join("\n");
  }
  function findAllCarriersFor(targetFullId) {
    return getT123Recs().filter((r) => {
      const t = r.textContent;
      return t.includes(CARRIER_MARKER_PREFIX + targetFullId) || t.includes(ATTR_MARKER_PREFIX + targetFullId);
    });
  }
  function delRecord(rec) {
    if (rec && typeof window.tp__delRecord === "function") {
      window.tp__delRecord(rec.id.replace("rec", ""));
    }
  }
  async function createCarrierUnder(targetFullId) {
    if (typeof window.tp__addRecord !== "function") return null;
    const numericId = targetFullId.replace("rec", "");
    const before = new Set(getAllRecs().map((r) => r.id));
    window.tp__addRecord(T123_TPLID, numericId, "");
    return waitFor(() => getAllRecs().find((r) => !before.has(r.id)) || null);
  }
  function saveCarrierCode(numericId, html) {
    if (typeof window.tp__saveOnlyOneFieldInRecord !== "function") {
      alert("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C: \u0444\u0443\u043D\u043A\u0446\u0438\u044F \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F Tilda \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430.");
      return;
    }
    const sx = window.scrollX;
    const sy = window.scrollY;
    window.tp__saveOnlyOneFieldInRecord(numericId, "code", "code", html);
    [400, 900].forEach((t) => setTimeout(() => window.scrollTo(sx, sy), t));
  }
  var saving = false;
  var pending = /* @__PURE__ */ new Set();
  function commitBlock(numericId) {
    pending.add(numericId);
    drainSaves();
  }
  async function drainSaves() {
    if (saving) return;
    saving = true;
    try {
      while (pending.size) {
        const numericId = pending.values().next().value;
        pending.delete(numericId);
        await doSaveForBlock(numericId);
      }
    } finally {
      saving = false;
    }
  }
  async function doSaveForBlock(numericId) {
    const targetFullId = "rec" + numericId;
    const zEff = getEffectiveZIndexMap();
    const attrEff = getEffectiveAttrMap();
    const zVal = zEff.has(numericId) ? zEff.get(numericId) : null;
    const info = attrEff.has(numericId) ? attrEff.get(numericId) : null;
    const carriers = findAllCarriersFor(targetFullId);
    if (zVal == null && info == null) {
      carriers.forEach(delRecord);
    } else {
      let carrier = carriers[0];
      if (!carrier) {
        carrier = await createCarrierUnder(targetFullId);
        if (!carrier) {
          alert(
            "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u0441\u043B\u0443\u0436\u0435\u0431\u043D\u044B\u0439 \u0431\u043B\u043E\u043A \u043F\u043E\u0434 \u044D\u0442\u0438\u043C \u0431\u043B\u043E\u043A\u043E\u043C.\n\u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u0432\u0440\u0443\u0447\u043D\u0443\u044E \u0431\u043B\u043E\u043A \xABT123 HTML-\u043A\u043E\u0434\xBB \u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u043F\u043E\u043F\u044B\u0442\u043A\u0443."
          );
          return;
        }
      } else {
        carriers.slice(1).forEach(delRecord);
      }
      saveCarrierCode(carrier.id.replace("rec", ""), buildCarrierContent(targetFullId, zVal, info));
    }
    setTimeout(() => {
      if (zIndexOverrides.get(numericId) === zVal) zIndexOverrides.delete(numericId);
      if (sameInfo(attrOverrides.get(numericId), info)) attrOverrides.delete(numericId);
    }, 1500);
  }

  // src/zeroindex.js
  var cache = /* @__PURE__ */ new Map();
  function isZeroBlock(numericId) {
    return getRecordCod(getRecordWrapper("rec" + numericId)) === "T396";
  }
  function readZeroZIndex(numericId) {
    const shared = window.__thZeroZI;
    if (shared && Object.prototype.hasOwnProperty.call(shared, numericId)) {
      const v = shared[numericId];
      return v == null || v === "" ? null : String(v);
    }
    if (cache.has(numericId)) return cache.get(numericId);
    return null;
  }
  var fetchedFromServer = /* @__PURE__ */ new Set();
  function prefillZeroZIndex(numericId, onValue) {
    if (readZeroZIndex(numericId) != null) return;
    if (cache.has(numericId)) return;
    if (fetchedFromServer.has(numericId)) return;
    if (!window.pageid) return;
    fetchedFromServer.add(numericId);
    const fd = new FormData();
    fd.append("comm", "getzerocode");
    fd.append("pageid", String(window.pageid));
    fd.append("recordid", String(numericId));
    fetch("/zero/get/", { method: "POST", body: fd, credentials: "include" }).then((r) => r.text()).then((t) => {
      let d = null;
      try {
        d = JSON.parse(t);
      } catch (e) {
      }
      if (!d) return;
      const v = d.ab_poszindex ? String(d.ab_poszindex) : null;
      if (!cache.has(numericId)) cache.set(numericId, v);
      if (v != null && typeof onValue === "function") onValue(v);
    }).catch(() => {
      fetchedFromServer.delete(numericId);
    });
  }
  function syncZeroZIndexToParent() {
    try {
      if (typeof window.allelems__getJsonData !== "function") return;
      const ab = document.querySelector(".tn-artboard");
      if (!ab) return;
      const recid = ab.getAttribute("data-record-id");
      if (!recid) return;
      const d = window.allelems__getJsonData();
      if (!d || !d.ab_height) return;
      const parent = window.parent || window;
      const store = parent.__thZeroZI = parent.__thZeroZI || {};
      store[recid] = d.ab_poszindex ? String(d.ab_poszindex) : null;
    } catch (e) {
    }
  }
  var elemCount = (d) => Object.keys(d).filter((k) => /^\d+$/.test(k)).length;
  function apiReady(w) {
    return w && typeof w.ab__setFieldValue === "function" && typeof w.ab__saveToDataBase === "function" && typeof w.allelems__getJsonData === "function" && typeof w.ab__getFieldValue === "function";
  }
  async function waitZeroHydrated() {
    const started = Date.now();
    let lastSig = null;
    let stable = 0;
    while (Date.now() - started < 25e3) {
      const f = document.querySelector(".t396__iframe");
      const w = f && f.contentWindow;
      if (apiReady(w)) {
        let d = null;
        try {
          d = w.allelems__getJsonData();
        } catch (e) {
          d = null;
        }
        if (d && d.ab_height) {
          const sig = elemCount(d) + ":" + d.ab_height;
          if (sig === lastSig) {
            stable += 1;
            if (stable >= 2) return { w, count: elemCount(d) };
          } else {
            lastSig = sig;
            stable = 0;
          }
        }
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    return null;
  }
  var writing = false;
  var writeQueue = [];
  function enqueueWrite(numericId, val) {
    cache.set(numericId, val === "" ? null : val);
    writeQueue.push({ numericId, val });
    drainWrites();
  }
  async function drainWrites() {
    if (writing) return;
    writing = true;
    try {
      while (writeQueue.length) {
        const item = writeQueue.shift();
        const later = writeQueue.filter((q) => q.numericId === item.numericId);
        const eff = later.length ? later[later.length - 1] : item;
        for (let i = writeQueue.length - 1; i >= 0; i--) {
          if (writeQueue[i].numericId === item.numericId) writeQueue.splice(i, 1);
        }
        await applyZeroZIndex(eff.numericId, eff.val);
      }
    } finally {
      writing = false;
    }
  }
  async function applyZeroZIndex(numericId, val) {
    if (typeof window.tp__openZero !== "function") {
      alert("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C z-index Zero-\u0431\u043B\u043E\u043A\u0430: \u0444\u0443\u043D\u043A\u0446\u0438\u044F Tilda tp__openZero \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430.");
      return;
    }
    const sx = window.scrollX;
    const sy = window.scrollY;
    window.tp__openZero(numericId, true);
    const ready = await waitZeroHydrated();
    if (!ready) {
      if (typeof window.tp__closeZero === "function") window.tp__closeZero();
      [300, 800].forEach((t) => setTimeout(() => window.scrollTo(sx, sy), t));
      alert("Zero-\u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u043D\u0435 \u0434\u043E\u0433\u0440\u0443\u0437\u0438\u043B\u0441\u044F \u2014 z-index \u043D\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D. \u041A\u043E\u043D\u0442\u0435\u043D\u0442 \u0431\u043B\u043E\u043A\u0430 \u041D\u0415 \u0442\u0440\u043E\u043D\u0443\u0442.");
      return;
    }
    const fw = ready.w;
    const hydratedCount = ready.count;
    try {
      const wantOvrflw = val == null || val === "" ? "" : "visible";
      const wantPos = val == null || val === "" ? "" : String(val);
      const ab = fw.document.querySelector(".tn-artboard");
      if (!ab) throw new Error("\u0430\u0440\u0442\u0431\u043E\u0440\u0434 Zero-\u0431\u043B\u043E\u043A\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D");
      fw.ab__setFieldValue(ab, "ovrflw", wantOvrflw);
      fw.ab__setFieldValue(ab, "poszindex", wantPos);
      const d = fw.allelems__getJsonData();
      const ok = String(d.ab_ovrflw || "") === wantOvrflw && String(d.ab_poszindex || "") === wantPos && !!d.ab_height && elemCount(d) === hydratedCount;
      if (!ok) {
        throw new Error(
          "\u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0446\u0435\u043B\u043E\u0441\u0442\u043D\u043E\u0441\u0442\u0438 \u043F\u0435\u0440\u0435\u0434 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435\u043C \u043D\u0435 \u043F\u0440\u043E\u0448\u043B\u0430 (\u0430\u0440\u0442\u0431\u043E\u0440\u0434 \u043D\u0435\u043F\u043E\u043B\u043D\u044B\u0439) \u2014 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u043E\u0442\u043C\u0435\u043D\u0435\u043D\u043E, \u043A\u043E\u043D\u0442\u0435\u043D\u0442 \u043D\u0435 \u0442\u0440\u043E\u043D\u0443\u0442"
        );
      }
      await fw.ab__saveToDataBase();
      await new Promise((r) => setTimeout(r, 600));
    } catch (e) {
      console.warn("[Tilda Helper] \u0437\u0430\u043F\u0438\u0441\u044C z-index \u0432 Zero-\u0431\u043B\u043E\u043A \u043D\u0435 \u0443\u0434\u0430\u043B\u0430\u0441\u044C:", e);
    } finally {
      if (typeof window.tp__closeZero === "function") window.tp__closeZero();
      [300, 800].forEach((t) => setTimeout(() => window.scrollTo(sx, sy), t));
    }
  }
  function writeZeroZIndex(numericId, val) {
    enqueueWrite(numericId, val);
  }

  // src/zindex.js
  var ZINDEX_UNSUPPORTED_CODES = ["T1093"];
  function zIndexUnsupported(recId) {
    return ZINDEX_UNSUPPORTED_CODES.includes(getRecordCod(getRecordWrapper("rec" + recId)));
  }
  function buildZIndexCss(map) {
    let css = "";
    map.forEach((val, recId) => {
      css += "#rec" + recId + "{position:relative;z-index:" + val + " !important;overflow:visible !important;}\n";
    });
    return css;
  }
  function getOrCreateStyleEl(id) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("style");
      el.id = id;
      document.head.appendChild(el);
    }
    return el;
  }
  function applyLiveCssPreview(zIndexMap) {
    const zEl = getOrCreateStyleEl(LIVE_CSS_ZINDEX_ID);
    const zCss = buildZIndexCss(zIndexMap);
    if (zEl.textContent !== zCss) zEl.textContent = zCss;
    const seen = /* @__PURE__ */ new Set();
    getT123Recs().forEach((r) => {
      if (isCarrierText(r.textContent)) return;
      const t = r.textContent;
      if (!t.includes("<style")) return;
      if (t.includes("<script")) return;
      let css = "";
      const re = /<style[^>]*>([\s\S]*?)<\/style>/gi;
      let m;
      while (m = re.exec(t)) css += m[1] + "\n";
      if (!css) return;
      const id = LIVE_CSS_BLOCK_PREFIX + r.id;
      seen.add(id);
      const el = getOrCreateStyleEl(id);
      if (el.textContent !== css) el.textContent = css;
    });
    document.querySelectorAll('style[id^="' + LIVE_CSS_BLOCK_PREFIX + '"]').forEach((el) => {
      if (!seen.has(el.id)) el.remove();
    });
  }
  var carrierMisplacedTicks = /* @__PURE__ */ new Map();
  function reorderMisplacedCarriers() {
    const canonicalByTarget = /* @__PURE__ */ new Map();
    getT123Recs().forEach((carrierRec) => {
      const m = carrierRec.textContent.match(/th-(?:zi|attr):(rec\d+)/);
      if (!m) return;
      if (!canonicalByTarget.has(m[1])) canonicalByTarget.set(m[1], carrierRec);
    });
    canonicalByTarget.forEach((carrierRec, targetFullId) => {
      const targetWrapper = getRecordWrapper(targetFullId);
      const carrierWrapper = getRecordWrapper(carrierRec.id);
      if (!targetWrapper || !carrierWrapper || targetWrapper.nextElementSibling === carrierWrapper) {
        carrierMisplacedTicks.delete(carrierRec.id);
        return;
      }
      const ticks = (carrierMisplacedTicks.get(carrierRec.id) || 0) + 1;
      carrierMisplacedTicks.set(carrierRec.id, ticks);
      if (ticks < 2) return;
      targetWrapper.parentNode.insertBefore(carrierWrapper, targetWrapper.nextSibling);
      carrierMisplacedTicks.delete(carrierRec.id);
      if (typeof window.tp__saveRecordsSort === "function") window.tp__saveRecordsSort();
    });
  }
  function isCarrierRecordWrapper(wrapper) {
    if (!isT123Wrapper(wrapper)) return false;
    const rec = document.getElementById(wrapper.id.replace(/^record/, "rec"));
    return !!(rec && isCarrierText(rec.textContent));
  }
  function reorderUnitFor(wrapper) {
    const next = wrapper.nextElementSibling;
    return isCarrierRecordWrapper(next) ? [wrapper, next] : [wrapper];
  }
  function moveRecordUnit(numericId, direction) {
    const wrapper = getRecordWrapper("rec" + numericId);
    if (!wrapper || isCarrierRecordWrapper(wrapper)) return false;
    const unit = reorderUnitFor(wrapper);
    if (direction === "down") {
      const tail = unit[unit.length - 1];
      const neighborHead = tail.nextElementSibling;
      if (!neighborHead || !neighborHead.getAttribute("recordid")) return false;
      const neighborUnit = reorderUnitFor(neighborHead);
      let anchor = neighborUnit[neighborUnit.length - 1];
      unit.forEach((el) => {
        anchor.insertAdjacentElement("afterend", el);
        anchor = el;
      });
    } else {
      let neighborHead = unit[0].previousElementSibling;
      if (!neighborHead || !neighborHead.getAttribute("recordid")) return false;
      if (isCarrierRecordWrapper(neighborHead)) {
        neighborHead = neighborHead.previousElementSibling;
        if (!neighborHead || !neighborHead.getAttribute("recordid")) return false;
      }
      unit.forEach((el) => neighborHead.insertAdjacentElement("beforebegin", el));
    }
    return true;
  }
  var reorderPatched = false;
  function ensureReorderPatched() {
    if (reorderPatched) return;
    if (typeof window.tp__upRecord !== "function" || typeof window.tp__downRecord !== "function") return;
    const nativeUp = window.tp__upRecord;
    const nativeDown = window.tp__downRecord;
    function afterMove(numericId) {
      if (window.tp_view && typeof window.tp_view.updateStyles === "function") window.tp_view.updateStyles();
      if (typeof window.tp__scrollToRecord === "function") window.tp__scrollToRecord(numericId);
      window.clearTimeout(window.autosavesort_timer);
      window.autosavesort_timer = window.setTimeout(window.tp__saveRecordsSort, 4e3);
    }
    window.tp__upRecord = function(numericId) {
      if (moveRecordUnit(numericId, "up")) return afterMove(numericId);
      return nativeUp.apply(this, arguments);
    };
    window.tp__downRecord = function(numericId) {
      if (moveRecordUnit(numericId, "down")) return afterMove(numericId);
      return nativeDown.apply(this, arguments);
    };
    reorderPatched = true;
  }
  function parseVal(input) {
    const raw = input.value.trim();
    return raw === "" ? null : raw;
  }
  function onZIndexInput(numericId, input) {
    const wrapper = input.closest("." + ZINDEX_WRAPPER_CLASS);
    if (wrapper) wrapper.dataset.userOpened = "1";
    setZIndexOverride(numericId, parseVal(input));
    applyLiveCssPreview(getEffectiveZIndexMap());
  }
  function commitZIndex(numericId, input) {
    const val = parseVal(input);
    if (isZeroBlock(numericId)) {
      writeZeroZIndex(numericId, val);
      if (val === null) setZIndexOverride(numericId, null);
      return;
    }
    setZIndexOverride(numericId, val);
    commitBlock(numericId);
  }
  function renderZIndexState(recId, toggle, wrapper) {
    if (zIndexUnsupported(recId)) {
      toggle.style.display = "none";
      wrapper.style.display = "none";
      return;
    }
    const hasZero = isZeroBlock(recId) && readZeroZIndex(recId) != null;
    const isOpen = getEffectiveZIndexMap().has(recId) || hasZero || wrapper.dataset.userOpened === "1";
    toggle.style.display = isOpen ? "none" : "";
    wrapper.style.display = isOpen ? "" : "none";
  }
  function updateZIndexSidebarField() {
    const form = document.querySelector(".pe-settings-form[data-rec-id]");
    if (!form) return;
    const recId = form.dataset.recId;
    const body = form.querySelector(".edrec__wrapper.panel-body");
    if (!body) return;
    const properties = body.querySelector(".pe-properties");
    const itemsList = properties && properties.querySelector(".pe-properties__items");
    if (!itemsList) return;
    let toggle = itemsList.querySelector("." + ZINDEX_TOGGLE_CLASS);
    if (!toggle) {
      toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "t-button pe-properties__item " + ZINDEX_TOGGLE_CLASS;
      toggle.innerHTML = '<span class="t-button__text">\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C Z-index</span>';
      itemsList.insertBefore(toggle, itemsList.firstChild);
    } else if (toggle !== itemsList.firstChild) {
      itemsList.insertBefore(toggle, itemsList.firstChild);
    }
    let wrapper = properties.querySelector("." + ZINDEX_WRAPPER_CLASS);
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.className = "pe-properties__wrapper " + ZINDEX_WRAPPER_CLASS;
      wrapper.innerHTML = '<div class="pe-form-group"><label class="pe-label">Z-index</label><div class="pe-input__wrapper"><input class="pe-input" type="number" step="1" placeholder="\u041D\u0435 \u0437\u0430\u0434\u0430\u043D"></div></div>';
      properties.insertBefore(wrapper, itemsList);
      const input = wrapper.querySelector("input");
      input.addEventListener("input", () => onZIndexInput(wrapper.dataset.recId, input));
      input.addEventListener("change", () => commitZIndex(wrapper.dataset.recId, input));
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") input.blur();
      });
      toggle.addEventListener("click", () => {
        wrapper.dataset.userOpened = "1";
        renderZIndexState(toggle.dataset.recId, toggle, wrapper);
        wrapper.querySelector("input").focus();
      });
    } else if (wrapper.nextSibling !== itemsList) {
      properties.insertBefore(wrapper, itemsList);
    }
    if (wrapper.dataset.recId !== recId) {
      wrapper.dataset.recId = recId;
      toggle.dataset.recId = recId;
      delete wrapper.dataset.userOpened;
      const input = wrapper.querySelector("input");
      const map = getEffectiveZIndexMap();
      if (map.has(recId)) input.value = map.get(recId);
      else if (isZeroBlock(recId)) {
        input.value = readZeroZIndex(recId) || "";
        prefillZeroZIndex(recId, (v) => {
          if (wrapper.dataset.recId !== recId) return;
          if (document.activeElement === input) return;
          if (input.value !== "") return;
          input.value = v;
          renderZIndexState(recId, toggle, wrapper);
        });
      } else input.value = "";
    }
    renderZIndexState(recId, toggle, wrapper);
  }

  // src/attributes.js
  var LIVE_PREVIEW_SKIP = /* @__PURE__ */ new Set(["class", "id", "style"]);
  var appliedAttrs = /* @__PURE__ */ new Map();
  function applyLiveAttrPreview(map) {
    appliedAttrs.forEach((name, recId) => {
      const desired = map.get(recId);
      if (!desired || desired.name !== name) {
        const el = document.getElementById("rec" + recId);
        if (el) {
          try {
            el.removeAttribute(name);
          } catch (e) {
          }
        }
        appliedAttrs.delete(recId);
      }
    });
    map.forEach((info, recId) => {
      if (LIVE_PREVIEW_SKIP.has(info.name.toLowerCase())) return;
      const el = document.getElementById("rec" + recId);
      if (!el) return;
      try {
        if (el.getAttribute(info.name) !== info.value) el.setAttribute(info.name, info.value);
        appliedAttrs.set(recId, info.name);
      } catch (e) {
      }
    });
  }
  function readInputs(nameInput, valueInput) {
    const name = nameInput.value.trim();
    const value = valueInput.value;
    return name === "" ? null : { name, value };
  }
  function onAttrInput(numericId, nameInput, valueInput, wrapper) {
    if (wrapper) wrapper.dataset.userOpened = "1";
    setAttrOverride(numericId, readInputs(nameInput, valueInput));
    applyLiveAttrPreview(getEffectiveAttrMap());
  }
  function commitAttr(numericId, nameInput, valueInput) {
    setAttrOverride(numericId, readInputs(nameInput, valueInput));
    commitBlock(numericId);
  }
  function renderAttrState(recId, toggle, wrapper) {
    const isOpen = getEffectiveAttrMap().has(recId) || wrapper.dataset.userOpened === "1";
    toggle.style.display = isOpen ? "none" : "";
    wrapper.style.display = isOpen ? "" : "none";
  }
  function updateAttributeSidebarField() {
    const form = document.querySelector(".pe-settings-form[data-rec-id]");
    if (!form) return;
    const recId = form.dataset.recId;
    const body = form.querySelector(".edrec__wrapper.panel-body");
    if (!body) return;
    const properties = body.querySelector(".pe-properties");
    const itemsList = properties && properties.querySelector(".pe-properties__items");
    if (!itemsList) return;
    const zToggle = itemsList.querySelector("." + ZINDEX_TOGGLE_CLASS);
    let toggle = itemsList.querySelector("." + ATTR_TOGGLE_CLASS);
    if (!toggle) {
      toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "t-button pe-properties__item " + ATTR_TOGGLE_CLASS;
      toggle.innerHTML = '<span class="t-button__text">\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0430\u0442\u0440\u0438\u0431\u0443\u0442</span>';
    }
    if (zToggle) {
      if (toggle.previousElementSibling !== zToggle) itemsList.insertBefore(toggle, zToggle.nextSibling);
    } else if (toggle !== itemsList.firstChild) {
      itemsList.insertBefore(toggle, itemsList.firstChild);
    }
    const zWrapper = properties.querySelector("." + ZINDEX_WRAPPER_CLASS);
    let wrapper = properties.querySelector("." + ATTR_WRAPPER_CLASS);
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.className = "pe-properties__wrapper " + ATTR_WRAPPER_CLASS;
      wrapper.innerHTML = '<div class="th-attr-fields"><div class="pe-form-group"><label class="pe-label">\u0418\u043C\u044F \u0430\u0442\u0440\u0438\u0431\u0443\u0442\u0430</label><div class="pe-input__wrapper"><input class="pe-input th-attr-name" type="text" placeholder="data-\u2026"></div></div><div class="pe-form-group"><label class="pe-label">\u0417\u043D\u0430\u0447\u0435\u043D\u0438\u0435</label><div class="pe-input__wrapper"><input class="pe-input th-attr-value" type="text" placeholder="\u0417\u043D\u0430\u0447\u0435\u043D\u0438\u0435"></div></div></div>';
      const nameInput = wrapper.querySelector(".th-attr-name");
      const valueInput = wrapper.querySelector(".th-attr-value");
      const onInput = () => onAttrInput(wrapper.dataset.recId, nameInput, valueInput, wrapper);
      nameInput.addEventListener("input", onInput);
      valueInput.addEventListener("input", onInput);
      wrapper.addEventListener("focusout", (e) => {
        if (wrapper.contains(e.relatedTarget)) return;
        commitAttr(wrapper.dataset.recId, nameInput, valueInput);
      });
      [nameInput, valueInput].forEach(
        (inp) => inp.addEventListener("keydown", (e) => {
          if (e.key === "Enter") inp.blur();
        })
      );
      toggle.addEventListener("click", () => {
        wrapper.dataset.userOpened = "1";
        renderAttrState(toggle.dataset.recId, toggle, wrapper);
        nameInput.focus();
      });
    }
    if (zWrapper) {
      if (wrapper.nextElementSibling !== zWrapper) properties.insertBefore(wrapper, zWrapper);
    } else if (wrapper.nextSibling !== itemsList) {
      properties.insertBefore(wrapper, itemsList);
    }
    if (wrapper.dataset.recId !== recId) {
      wrapper.dataset.recId = recId;
      toggle.dataset.recId = recId;
      delete wrapper.dataset.userOpened;
      const map = getEffectiveAttrMap();
      const info = map.get(recId);
      wrapper.querySelector(".th-attr-name").value = info ? info.name : "";
      wrapper.querySelector(".th-attr-value").value = info ? info.value : "";
    }
    renderAttrState(recId, toggle, wrapper);
  }

  // src/multipreview.js
  var MP_HASH = "th-mp";
  var MP_BTN_ID = "th-multipreview-btn";
  var MP_ROOT_ID = "th-multipreview-root";
  var DEVICES = [
    { name: "\u0414\u0435\u0441\u043A\u0442\u043E\u043F", w: 1201 },
    { name: "\u041F\u043B\u0430\u043D\u0448\u0435\u0442", w: 959 },
    { name: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D", w: 360 }
  ];
  function getPublishedUrl() {
    const projectAlias = (window.projectalias || "").toString().trim();
    const pageAlias = (window.pagealias || "").toString().trim();
    const projectId = (window.projectid || "").toString().trim();
    const pageId = (window.pageid || "").toString().trim();
    if (projectAlias) {
      const path = pageAlias && pageAlias !== "home" ? "/" + pageAlias : "/";
      return `https://${projectAlias}.tilda.ws${path}`;
    }
    if (projectId && pageId) {
      return `https://project${projectId}.tilda.ws/page${pageId}.html`;
    }
    return null;
  }
  function injectMultiPreviewButton() {
    const navbar = document.querySelector("ul.tp-menu__navbar");
    if (!navbar || document.getElementById(MP_BTN_ID)) return;
    const li = document.createElement("li");
    li.className = "tp-menu__navbar__item tp-menu__navbar__item_desktop_only";
    const btn = document.createElement("button");
    btn.id = MP_BTN_ID;
    btn.type = "button";
    btn.className = "t-button tp-menu__navbar__button th-icon-only";
    btn.title = "\u041C\u0443\u043B\u044C\u0442\u0438\u043F\u0440\u0435\u0432\u044C\u044E \u2014 \u0434\u0435\u0441\u043A\u0442\u043E\u043F/\u043F\u043B\u0430\u043D\u0448\u0435\u0442/\u0442\u0435\u043B\u0435\u0444\u043E\u043D \u0440\u044F\u0434\u043E\u043C";
    btn.setAttribute("aria-label", "\u041C\u0443\u043B\u044C\u0442\u0438\u043F\u0440\u0435\u0432\u044C\u044E");
    btn.innerHTML = MULTIPREVIEW_ICON_SVG;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const url = getPublishedUrl();
      if (!url) {
        alert("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0438\u0442\u044C \u0430\u0434\u0440\u0435\u0441 \u043E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043D\u043D\u043E\u0439 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B (\u043D\u0435\u0442 alias \u043F\u0440\u043E\u0435\u043A\u0442\u0430).");
        return;
      }
      window.open(url + "#" + MP_HASH, "_blank");
    });
    li.appendChild(btn);
    const previewLi = navbar.querySelector(".tp-menu__navbar__item_preview");
    navbar.insertBefore(li, previewLi || null);
  }
  function isMultiPreviewTarget() {
    return location.hash.replace("#", "") === MP_HASH;
  }
  function buildMultiPreviewOverlay() {
    if (document.getElementById(MP_ROOT_ID)) return;
    const innerSrc = location.origin + location.pathname + location.search;
    const GAP = 20;
    const PAD = 20;
    const avail = Math.max(320, window.innerWidth - PAD * 2 - GAP * (DEVICES.length - 1));
    const totalW = DEVICES.reduce((s, d) => s + d.w, 0);
    const scale = Math.min(1, avail / totalW);
    const root = document.createElement("div");
    root.id = MP_ROOT_ID;
    root.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:2147483000",
      "background:#15161a",
      "display:flex",
      "flex-direction:column",
      "box-sizing:border-box",
      "font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif"
    ].join(";");
    const bar = document.createElement("div");
    bar.style.cssText = [
      "flex:0 0 auto",
      "height:44px",
      "display:flex",
      "align-items:center",
      "justify-content:space-between",
      "padding:0 18px",
      "background:#1d1f26",
      "border-bottom:1px solid #2b2e37",
      "color:#e6e7ec"
    ].join(";");
    const title = document.createElement("div");
    title.textContent = "\u041C\u0443\u043B\u044C\u0442\u0438\u043F\u0440\u0435\u0432\u044C\u044E";
    title.style.cssText = "font:600 13px/1 sans-serif;letter-spacing:.02em;";
    const close = document.createElement("button");
    close.textContent = "\u2715  \u0417\u0430\u043A\u0440\u044B\u0442\u044C";
    close.style.cssText = [
      "background:#2a2c34",
      "color:#fff",
      "border:0",
      "border-radius:8px",
      "padding:8px 14px",
      "font:600 13px sans-serif",
      "cursor:pointer"
    ].join(";");
    let popupTimer = null;
    const destroy = () => {
      root.remove();
      document.removeEventListener("keydown", onKey);
      if (popupTimer) clearInterval(popupTimer);
      history.replaceState(null, "", location.pathname + location.search);
    };
    close.addEventListener("click", destroy);
    bar.appendChild(title);
    bar.appendChild(close);
    const rowEl = document.createElement("div");
    rowEl.style.cssText = [
      "flex:1 1 auto",
      "display:flex",
      "gap:" + GAP + "px",
      `padding:${PAD}px`,
      "justify-content:center",
      "align-items:stretch",
      "overflow:auto",
      "min-height:0"
    ].join(";");
    const frames = [];
    const nav = { path: location.pathname + location.search };
    const syncState = { replaying: false };
    DEVICES.forEach((d) => {
      const colW = Math.round(d.w * scale);
      const col = document.createElement("div");
      col.style.cssText = "display:flex;flex-direction:column;min-height:0;";
      const cap = document.createElement("div");
      cap.textContent = `${d.name} \xB7 ${d.w}px`;
      cap.style.cssText = "flex:0 0 auto;color:#c7c9d1;font:600 12px/1.4 sans-serif;margin-bottom:8px;text-align:center;";
      const vp = document.createElement("div");
      vp.style.cssText = [
        "flex:1 1 auto",
        "width:" + colW + "px",
        "background:#fff",
        "border-radius:10px",
        "overflow:hidden",
        "position:relative",
        "box-shadow:0 10px 40px rgba(0,0,0,.5)"
      ].join(";");
      const f = document.createElement("iframe");
      f.style.cssText = [
        "border:0",
        "background:#fff",
        "width:" + d.w + "px",
        "height:" + 100 / scale + "%",
        "transform:scale(" + scale + ")",
        "transform-origin:top left"
      ].join(";");
      wireFrame(f, frames, nav, syncState);
      f.src = innerSrc;
      vp.appendChild(f);
      col.appendChild(cap);
      col.appendChild(vp);
      rowEl.appendChild(col);
      frames.push(f);
    });
    root.appendChild(bar);
    root.appendChild(rowEl);
    (document.body || document.documentElement).appendChild(root);
    popupTimer = wirePopupSync(frames);
    function onKey(e) {
      if (e.key === "Escape") destroy();
    }
    document.addEventListener("keydown", onKey);
  }
  function wirePopupSync(frames) {
    const SYNC_HOOK = /^#popup|^#order|tproduct/i;
    const CLOSE_SEL = '.t-popup__close, .t-popup__block-close-button, [class*="popup__close"]';
    const getHook = (doc) => {
      const view = doc.defaultView;
      for (const p of doc.querySelectorAll(".t-popup")) {
        const cs = view.getComputedStyle(p);
        if (cs.display !== "none" && cs.visibility !== "hidden") {
          const h = p.getAttribute("data-tooltip-hook") || "";
          if (SYNC_HOOK.test(h)) return h;
        }
      }
      return null;
    };
    const closeIn = (doc) => {
      for (const p of doc.querySelectorAll(".t-popup")) {
        const cs = doc.defaultView.getComputedStyle(p);
        if (cs.display !== "none" && cs.visibility !== "hidden") {
          const btn = p.querySelector(CLOSE_SEL);
          if (btn) btn.click();
        }
      }
    };
    let syncedHook = null;
    let syncing = false;
    let coolUntil = 0;
    return setInterval(() => {
      if (syncing || Date.now() < coolUntil) return;
      let hooks;
      try {
        hooks = frames.map((f) => getHook(f.contentDocument));
      } catch (e) {
        return;
      }
      const src = hooks.findIndex((h) => h !== syncedHook);
      if (src === -1) return;
      const desired = hooks[src];
      syncedHook = desired;
      coolUntil = Date.now() + 500;
      syncing = true;
      try {
        frames.forEach((f, i) => {
          if (hooks[i] === desired) return;
          const doc = f.contentDocument;
          closeIn(doc);
          if (desired) {
            const trigger = doc.querySelector('a[href="' + desired + '"]');
            if (trigger) trigger.click();
          }
        });
      } catch (e) {
      }
      syncing = false;
    }, 200);
  }
  function wireInteractionSync(doc, frame, allFrames, state2) {
    if (!doc || !doc.body || doc._mpWired) return;
    doc._mpWired = true;
    const view = doc.defaultView;
    const getPath = (node, root) => {
      const path = [];
      let cur = node;
      while (cur && cur !== root) {
        const parent = cur.parentElement;
        if (!parent) return null;
        path.unshift(Array.prototype.indexOf.call(parent.children, cur));
        cur = parent;
      }
      return path;
    };
    const resolvePath = (root, path) => {
      let cur = root;
      for (const i of path) {
        if (!cur || !cur.children || !cur.children[i]) return null;
        cur = cur.children[i];
      }
      return cur;
    };
    const ANCHOR_SEL = "[data-elem-id], [data-record-id]";
    const identify = (target) => {
      const container = target.closest && target.closest(ANCHOR_SEL);
      if (!container) return null;
      const attr = container.hasAttribute("data-elem-id") ? "data-elem-id" : "data-record-id";
      const path = target === container ? [] : getPath(target, container);
      if (path === null) return null;
      return {
        attr,
        key: container.getAttribute(attr),
        path,
        name: target.getAttribute && target.getAttribute("name") || null
      };
    };
    const resolve = (od, id) => {
      const container = od.querySelector("[" + id.attr + '="' + id.key + '"]');
      if (!container) return null;
      if (id.name) {
        const byName = container.querySelector('[name="' + id.name.replace(/"/g, '\\"') + '"]');
        if (byName) return byName;
      }
      return id.path.length ? resolvePath(container, id.path) : container;
    };
    const isVisible = (el) => {
      if (!el.getClientRects || !el.getClientRects().length) return false;
      const cs = el.ownerDocument.defaultView.getComputedStyle(el);
      return cs.visibility !== "hidden" && cs.display !== "none";
    };
    const forOthers = (fn) => {
      state2.replaying = true;
      allFrames.forEach((other) => {
        if (other === frame) return;
        try {
          const od = other.contentDocument;
          if (od) fn(od);
        } catch (e) {
        }
      });
      state2.replaying = false;
    };
    const isHandledAnchor = (a) => {
      const href = (a.getAttribute("href") || "").trim();
      if (!href || href === "#" || /^javascript:/i.test(href)) return false;
      if (/^#(popup|order)|tproduct/i.test(href)) return true;
      return true;
    };
    doc.addEventListener(
      "click",
      (e) => {
        if (state2.replaying) return;
        const t = e.target;
        if (!(t instanceof view.Element)) return;
        if (t.closest(".t-popup")) return;
        const a = t.closest("a");
        if (a && isHandledAnchor(a)) return;
        const id = identify(t);
        if (!id) return;
        forOthers((od) => {
          const el = resolve(od, id);
          if (el && isVisible(el)) {
            el.dispatchEvent(new od.defaultView.MouseEvent("click", { bubbles: true, cancelable: true, view: od.defaultView }));
          }
        });
      },
      true
    );
    const syncField = (e) => {
      if (state2.replaying) return;
      const t = e.target;
      if (!(t instanceof view.Element) || !("value" in t)) return;
      const id = identify(t);
      if (!id) return;
      const isToggle = t.type === "checkbox" || t.type === "radio";
      forOthers((od) => {
        const el = resolve(od, id);
        if (!el) return;
        if (isToggle) {
          if (el.checked !== t.checked) el.checked = t.checked;
        } else if (el.value !== t.value) {
          el.value = t.value;
        }
        el.dispatchEvent(new od.defaultView.Event("input", { bubbles: true }));
        el.dispatchEvent(new od.defaultView.Event("change", { bubbles: true }));
      });
    };
    doc.addEventListener("input", syncField, true);
    doc.addEventListener("change", syncField, true);
  }
  function wireFrame(frame, allFrames, nav, syncState) {
    frame.addEventListener("load", () => {
      let win, doc, path;
      try {
        win = frame.contentWindow;
        doc = frame.contentDocument;
        if (!win || !doc) return;
        path = win.location.pathname + win.location.search;
      } catch (e) {
        return;
      }
      if (path !== nav.path) {
        nav.path = path;
        const target = location.origin + path;
        allFrames.forEach((other) => {
          if (other === frame) return;
          try {
            const ow = other.contentWindow;
            if (ow.location.pathname + ow.location.search !== path) {
              ow.location.replace(target);
            }
          } catch (e) {
          }
        });
      }
      wireInteractionSync(doc, frame, allFrames, syncState);
      win.addEventListener(
        "scroll",
        () => {
          if (wireFrame._lock) return;
          wireFrame._lock = true;
          const max = doc.documentElement.scrollHeight - win.innerHeight;
          const ratio = max > 0 ? win.scrollY / max : 0;
          allFrames.forEach((other) => {
            if (other === frame) return;
            try {
              const ow = other.contentWindow;
              const od = other.contentDocument;
              if (!ow || !od) return;
              const omax = od.documentElement.scrollHeight - ow.innerHeight;
              ow.scrollTo(0, ratio * omax);
            } catch (e) {
            }
          });
          requestAnimationFrame(() => {
            wireFrame._lock = false;
          });
        },
        { passive: true }
      );
    });
  }

  // src/powermode.js
  function initProjectsPowerMode() {
    try {
      localStorage.setItem("powermode", "y");
      if (!window.powermode && typeof window.td__project__initPowerMode === "function") {
        window.powermode = "y";
        window.td__project__initPowerMode();
      }
    } catch (e) {
    }
    injectProjectsStyles();
  }
  function injectProjectsStyles() {
    if (document.getElementById("th-projects-style")) return;
    const style = document.createElement("style");
    style.id = "th-projects-style";
    style.textContent = `
    .td-sites-grid__item {
      border-radius: 12px;
    }
  `;
    (document.head || document.documentElement).appendChild(style);
  }

  // src/folders.js
  var INDENT_STEP = 20;
  function injectFolderStyles() {
    if (document.getElementById("th-folders-style")) return;
    const style = document.createElement("style");
    style.id = "th-folders-style";
    style.textContent = `
    /* \u0421\u0442\u0440\u043E\u043A\u0430-\u043F\u043E\u0434\u043F\u0430\u043F\u043A\u0430 \xAB\u0432\u043B\u043E\u0436\u0435\u043D\u0430\xBB: \u043E\u0442\u0441\u0442\u0443\u043F \u043F\u043E \u0433\u043B\u0443\u0431\u0438\u043D\u0435 (--th-pad) + tree-\u043C\u0430\u0440\u043A\u0435\u0440
       \u0432\u043F\u043B\u043E\u0442\u043D\u0443\u044E \u0441\u043B\u0435\u0432\u0430 \u043E\u0442 \u0442\u0435\u043A\u0441\u0442\u0430 (\u043D\u0430 14px \u043B\u0435\u0432\u0435\u0435 \u043D\u0430\u0447\u0430\u043B\u0430 \u0438\u043C\u0435\u043D\u0438). */
    .th-folder-nested .td-page__td-title-span {
      padding-left: var(--th-pad, 20px);
      position: relative;
    }
    .th-folder-nested .td-page__td-title-span::before {
      content: '';
      position: absolute;
      left: calc(var(--th-pad, 20px) - 14px);
      top: 0;
      bottom: 50%;
      width: 8px;
      border-left: 1.5px solid #c9c9c9;
      border-bottom: 1.5px solid #c9c9c9;
      border-bottom-left-radius: 3px;
    }
    /* \u0423 \u043F\u043E\u0434\u043F\u0430\u043F\u043A\u0438 \u043F\u0440\u044F\u0447\u0435\u043C \u0438\u043A\u043E\u043D\u043A\u0443-\u043F\u0430\u043F\u043A\u0443 (\u0440\u043E\u0434\u0438\u0442\u0435\u043B\u044C \u0443\u0436\u0435 \u043D\u0435\u0441\u0451\u0442 \u0435\u0451). opacity:0, \u0430 \u043D\u0435
       display:none \u2014 \u0438\u043D\u0430\u0447\u0435 \u043A\u043E\u043B\u043E\u043D\u043A\u0430 \u0441\u0445\u043B\u043E\u043F\u043D\u0435\u0442\u0441\u044F \u0438 \u0438\u043C\u044F \u0441\u044A\u0435\u0434\u0435\u0442 \u0432\u043B\u0435\u0432\u043E. */
    .th-folder-nested .td-page__img {
      opacity: 0;
    }
    /* \u041F\u0443\u0441\u0442\u0430\u044F \u043F\u0430\u043F\u043A\u0430 (\u043D\u0435\u0442 \u0441\u0442\u0440\u0430\u043D\u0438\u0446 \u0438 \u043D\u0435\u0442 \u0432\u043B\u043E\u0436\u0435\u043D\u043D\u044B\u0445 \u043F\u043E\u0434\u043F\u0430\u043F\u043E\u043A) \u2014 \u043F\u0440\u0438\u0433\u043B\u0443\u0448\u0430\u0435\u043C. */
    .th-folder-empty {
      opacity: 0.45;
    }
    /* \u0424\u043E\u0440\u043C\u0430 \u043F\u0435\u0440\u0435\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u044F \u043F\u0430\u043F\u043A\u0438 (.td-page__td-title-change) \u043F\u0435\u0440\u0435\u043A\u0440\u044B\u0432\u0430\u043B\u0430\u0441\u044C
       \u0441\u043E\u0441\u0435\u0434\u043D\u0438\u043C\u0438 \u0441\u0442\u0440\u043E\u043A\u0430\u043C\u0438 \u0438 \u0431\u044B\u043B\u0430 \u043D\u0435\u043A\u043B\u0438\u043A\u0430\u0431\u0435\u043B\u044C\u043D\u0430: \u0443 \u043D\u0435\u0451 \u043D\u0435 \u0431\u044B\u043B\u043E \u0441\u0432\u043E\u0435\u0433\u043E stacking-
       \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u0430, \u0430 \u043C\u044B \u043F\u0435\u0440\u0435\u0443\u043F\u043E\u0440\u044F\u0434\u043E\u0447\u0438\u0432\u0430\u0435\u043C \u0441\u0442\u0440\u043E\u043A\u0438 (\u043F\u043E\u0437\u0434\u043D\u0438\u0435 \u0440\u0438\u0441\u0443\u044E\u0442\u0441\u044F \u043F\u043E\u0432\u0435\u0440\u0445).
       \u041F\u043E\u0434\u043D\u0438\u043C\u0430\u0435\u043C \u043D\u0430\u0434 \u0441\u0442\u0440\u043E\u043A\u0430\u043C\u0438 \u0438 \u0434\u0435\u043B\u0430\u0435\u043C \u0444\u043E\u043D \u043D\u0435\u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u044B\u043C. */
    .td-page__td-title-change,
    .td-page__td-title-change_long {
      position: relative;
      z-index: 1000;
      background: #fff;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
      border-radius: 6px;
    }
    /* \u0421\u0442\u0440\u0435\u043B\u043E\u0447\u043A\u0430 \u0441\u0432\u043E\u0440\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u044F \u043F\u043E\u0434\u0433\u0440\u0443\u043F\u043F\u044B \u2014 \u0447\u0438\u043F \xAB\u25BE N\xBB (N \u2014 \u0447\u0438\u0441\u043B\u043E \u043F\u043E\u0434\u043F\u0430\u043F\u043E\u043A)
       \u0441\u0440\u0430\u0437\u0443 \u043F\u043E\u0441\u043B\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F \u043F\u0430\u043F\u043A\u0438. \u0420\u0430\u043D\u044C\u0448\u0435 \u0432\u0438\u0441\u0435\u043B\u0430 absolute-\u0441\u0435\u0440\u044B\u043C \u0448\u0435\u0432\u0440\u043E\u043D\u043E\u043C
       \u043F\u043E\u0441\u0440\u0435\u0434\u0438 \u043F\u0443\u0441\u0442\u043E\u0439 \u0441\u0442\u0440\u043E\u043A\u0438 (right:110px) \u2014 \u0435\u0451 \u0431\u044B\u043B\u043E \u043D\u0435 \u043D\u0430\u0439\u0442\u0438 \u0433\u043B\u0430\u0437\u0430\u043C\u0438. */
    .th-folder-toggle {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      height: 22px;
      margin-left: 10px;
      padding: 0 8px 0 4px;
      border: none;
      border-radius: 11px;
      background: #e8e8e8;
      color: #444;
      cursor: pointer;
      vertical-align: middle;
      font: 500 12px/1 Arial, sans-serif;
    }
    .th-folder-toggle svg {
      width: 14px;
      height: 14px;
      transition: transform 0.15s ease;
    }
    .th-folder-toggle:hover {
      background: #dcdcdc;
      color: #000;
    }
    .th-folder-toggle_collapsed svg {
      transform: rotate(-90deg);
    }
    /* \u0410\u043D\u0438\u043C\u0430\u0446\u0438\u044F \u0441\u0432\u043E\u0440\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u044F \u043F\u043E\u0434\u0433\u0440\u0443\u043F\u043F\u044B: max-height \u0432\u043C\u0435\u0441\u0442\u043E display:none, \u0447\u0442\u043E\u0431\u044B
       \u0441\u0442\u0440\u043E\u043A\u0430 \u043F\u043B\u0430\u0432\u043D\u043E \u0441\u0445\u043B\u043E\u043F\u044B\u0432\u0430\u043B\u0430\u0441\u044C/\u0440\u0430\u0437\u0432\u043E\u0440\u0430\u0447\u0438\u0432\u0430\u043B\u0430\u0441\u044C, \u0430 \u043D\u0435 \u0438\u0441\u0447\u0435\u0437\u0430\u043B\u0430 \u043C\u0433\u043D\u043E\u0432\u0435\u043D\u043D\u043E.
       300px \u2014 \u0441 \u0437\u0430\u043F\u0430\u0441\u043E\u043C \u0432\u044B\u0448\u0435 \u0440\u0435\u0430\u043B\u044C\u043D\u043E\u0439 \u0432\u044B\u0441\u043E\u0442\u044B \u0441\u0442\u0440\u043E\u043A\u0438 (\u0432 \u0442.\u0447. \u0441 \u0444\u043E\u0440\u043C\u043E\u0439
       \u043F\u0435\u0440\u0435\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u044F), \u0447\u0442\u043E\u0431\u044B \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043E\u0431\u0440\u0435\u0437\u0430\u043B\u043E\u0441\u044C \u0432 \u0440\u0430\u0437\u0432\u0451\u0440\u043D\u0443\u0442\u043E\u043C \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0438. */
    .td-folder {
      overflow: hidden;
      max-height: 300px;
      opacity: 1;
      transition: max-height 0.25s ease, opacity 0.2s ease;
    }
    .th-folder-hidden {
      max-height: 0 !important;
      opacity: 0 !important;
      pointer-events: none;
    }
  `;
    (document.head || document.documentElement).appendChild(style);
  }
  function readFolderName(row) {
    const id = row.id.replace("folder", "");
    if (Array.isArray(window.folders)) {
      const f = window.folders.find((x) => x && x.id === id);
      if (f) return f.title;
    }
    const span = row.querySelector(".td-page__td-title-span");
    if (!span) return "";
    return Array.from(span.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent).join("").trim();
  }
  function setRowLabel(row, depth, text, fullTitle) {
    const link = row.querySelector(".td-page__td-title a") || row.querySelector(".td-page__td-title");
    if (!link) return;
    let span = row.querySelector(".td-page__td-title-span");
    const editIcon = row.querySelector(".td-page__td-title-edit");
    if (!span) {
      span = document.createElement("span");
      span.className = "td-page__td-title-span";
      link.textContent = "";
      link.appendChild(span);
    }
    span.textContent = "";
    const nested = depth > 0;
    row.classList.toggle("th-folder-nested", nested);
    if (nested) {
      span.style.setProperty("--th-pad", depth * INDENT_STEP + "px");
      const leafEl = document.createElement("span");
      leafEl.className = "th-folder-leaf";
      leafEl.textContent = text;
      span.appendChild(leafEl);
    } else {
      span.style.removeProperty("--th-pad");
      span.appendChild(document.createTextNode(text));
    }
    if (editIcon) span.appendChild(editIcon);
    span.title = fullTitle;
  }
  function splitPath(raw) {
    return raw.split("/").map((s) => s.trim()).filter(Boolean);
  }
  function foldKey(raw) {
    return raw.toLowerCase();
  }
  function startsWithFold(str, prefix) {
    return foldKey(str).startsWith(foldKey(prefix));
  }
  var collapsedFolders = /* @__PURE__ */ new Set();
  var defaultStateDecided = /* @__PURE__ */ new Set();
  function computeFolderSequence(rows) {
    const parsed = rows.map((row) => {
      const raw = readFolderName(row);
      const parts = splitPath(raw);
      return {
        row,
        raw,
        parts,
        depth: parts.length - 1,
        parentPath: parts.length > 1 ? parts.slice(0, -1).join(" / ") : null,
        leaf: parts[parts.length - 1] || raw
      };
    });
    const allByName = /* @__PURE__ */ new Map();
    parsed.forEach((p) => {
      const key = foldKey(p.raw);
      if (!allByName.has(key)) allByName.set(key, p);
    });
    const childrenOf = /* @__PURE__ */ new Map();
    const roots = [];
    parsed.forEach((p) => {
      const parentKey = p.parentPath && foldKey(p.parentPath);
      if (parentKey && allByName.has(parentKey)) {
        if (!childrenOf.has(parentKey)) childrenOf.set(parentKey, []);
        childrenOf.get(parentKey).push(p);
      } else {
        roots.push(p);
      }
    });
    const sequence = [];
    const visited = /* @__PURE__ */ new Set();
    function emit(item, nestedDepth, hiddenByAncestor) {
      const key = foldKey(item.raw);
      if (visited.has(key)) return;
      visited.add(key);
      if (childrenOf.has(key) && !defaultStateDecided.has(item.raw)) {
        defaultStateDecided.add(item.raw);
        collapsedFolders.add(item.raw);
      }
      sequence.push({ item, depth: nestedDepth, hidden: hiddenByAncestor });
      const childHidden = hiddenByAncestor || collapsedFolders.has(item.raw);
      (childrenOf.get(key) || []).forEach((c) => emit(c, nestedDepth + 1, childHidden));
    }
    roots.forEach((r) => emit(r, 0, false));
    return { parsed, childrenOf, roots, sequence };
  }
  var CHEVRON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>';
  function setupCollapseToggle(row, raw, childCount) {
    let btn = row.querySelector(".th-folder-toggle");
    if (!childCount) {
      if (btn) btn.remove();
      return;
    }
    const span = row.querySelector(".td-page__td-title-span");
    if (!span) return;
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "th-folder-toggle";
      btn.innerHTML = CHEVRON_SVG + '<span class="th-folder-toggle-count"></span>';
      btn.setAttribute("aria-label", "\u0421\u0432\u0435\u0440\u043D\u0443\u0442\u044C/\u0440\u0430\u0437\u0432\u0435\u0440\u043D\u0443\u0442\u044C \u043F\u043E\u0434\u043F\u0430\u043F\u043A\u0438");
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const path = btn.dataset.thPath;
        if (collapsedFolders.has(path)) collapsedFolders.delete(path);
        else collapsedFolders.add(path);
        refreshFolderVisibility();
      });
    }
    if (btn.parentElement !== span) span.appendChild(btn);
    btn.querySelector(".th-folder-toggle-count").textContent = childCount;
    btn.dataset.thPath = raw;
    btn.classList.toggle("th-folder-toggle_collapsed", collapsedFolders.has(raw));
  }
  function refreshFolderVisibility() {
    const rows = Array.from(document.querySelectorAll(".td-folder"));
    if (!rows.length) return;
    const { childrenOf, sequence } = computeFolderSequence(rows);
    sequence.forEach(({ item, hidden }) => {
      setupCollapseToggle(item.row, item.raw, (childrenOf.get(foldKey(item.raw)) || []).length);
      item.row.classList.toggle("th-folder-hidden", hidden);
    });
  }
  var ancestorCreationTriggered = false;
  var deepNestingNotified = false;
  var normalizationTriggered = false;
  function ensureFolderNameNormalization() {
    if (normalizationTriggered) return;
    if (!Array.isArray(window.folders)) return;
    const live = window.folders.filter((f) => f && !f.trash);
    const bad = live.find((f) => {
      const parts = splitPath(f.title);
      return f.title.includes("/") && parts.join(" / ") !== f.title;
    });
    if (!bad) return;
    const projectid = new URLSearchParams(location.search).get("projectid");
    const csrf2 = window.getCSRF && window.getCSRF() || window.csrf;
    if (!projectid || typeof window.td__ajax !== "function" || !csrf2) return;
    const badParts = splitPath(bad.title);
    const newTitle = badParts.join(" / ");
    const renames = [{ folder: bad, title: newTitle }];
    live.forEach((f) => {
      if (f === bad) return;
      const fParts = splitPath(f.title);
      if (fParts.length <= badParts.length) return;
      const isDescendant = badParts.every((p, i) => fParts[i] === p);
      if (!isDescendant) return;
      const fixedTitle = badParts.concat(fParts.slice(badParts.length)).join(" / ");
      if (fixedTitle !== f.title) renames.push({ folder: f, title: fixedTitle });
    });
    normalizationTriggered = true;
    renames.forEach((r) => {
      r.folder.title = r.title;
    });
    let done = 0;
    let success = 0;
    renames.forEach((r) => {
      window.td__ajax({
        url: "/projects/submit/",
        dataToSend: { comm: "renamefolder", folderid: r.folder.id, title: r.title, csrf: csrf2 },
        ui: { ctext: "th: normalize folder name" },
        onSuccess: function() {
          done += 1;
          success += 1;
          if (done === renames.length && success > 0) location.reload();
        },
        onError: function() {
          done += 1;
          if (done === renames.length) {
            if (success > 0) location.reload();
            else console.warn("[th-folders] \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043D\u043E\u0440\u043C\u0430\u043B\u0438\u0437\u043E\u0432\u0430\u0442\u044C \u0438\u043C\u044F \u043F\u0430\u043F\u043A\u0438:", bad.title);
          }
        }
      });
    });
  }
  function ensureAncestorFolders() {
    if (ancestorCreationTriggered) return;
    if (!Array.isArray(window.folders)) return;
    const live = window.folders.filter((f) => f && !f.trash);
    if (!live.length) return;
    const domCount = document.querySelectorAll(".td-folder").length;
    if (domCount !== live.length) return;
    const existing = new Set(live.map((f) => foldKey(f.title)));
    const missing = /* @__PURE__ */ new Set();
    live.forEach((f) => {
      if (!f.title.includes("/")) return;
      const parts = splitPath(f.title);
      for (let i = 1; i < parts.length; i += 1) {
        const ancestor = parts.slice(0, i).join(" / ");
        if (!existing.has(foldKey(ancestor))) missing.add(ancestor);
      }
    });
    const toCreate = Array.from(missing).filter((t) => !existing.has(foldKey(t)));
    if (!toCreate.length) return;
    const MAX_MISSING_LEVELS = 2;
    if (toCreate.length > MAX_MISSING_LEVELS) {
      if (!deepNestingNotified) {
        deepNestingNotified = true;
        const text = "\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u0433\u043B\u0443\u0431\u043E\u043A\u0430\u044F \u0432\u043B\u043E\u0436\u0435\u043D\u043D\u043E\u0441\u0442\u044C \u043F\u0430\u043F\u043E\u043A: \u043D\u0435 \u0445\u0432\u0430\u0442\u0430\u0435\u0442 " + toCreate.length + " \u043F\u0440\u043E\u043C\u0435\u0436\u0443\u0442\u043E\u0447\u043D\u044B\u0445 \u043F\u0430\u043F\u043E\u043A. \u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u0438\u0445 \u0432\u0440\u0443\u0447\u043D\u0443\u044E \u043F\u043E \u043E\u0434\u043D\u043E\u043C\u0443 \u0443\u0440\u043E\u0432\u043D\u044E \u2014 \u0442\u043E\u0433\u0434\u0430 \u043F\u043E\u0434\u043F\u0430\u043F\u043A\u0438 \u0441\u043E\u0431\u0435\u0440\u0443\u0442\u0441\u044F \u0432 \u0434\u0435\u0440\u0435\u0432\u043E.";
        if (typeof window.td__showBubbleNotice === "function") {
          window.td__showBubbleNotice(text, 7e3, "error");
        }
      }
      return;
    }
    const projectid = new URLSearchParams(location.search).get("projectid");
    if (!projectid || typeof window.td__ajax !== "function" || typeof window.getCSRF !== "function") {
      return;
    }
    ancestorCreationTriggered = true;
    const names = toCreate;
    let done = 0;
    let success = 0;
    names.forEach((title) => {
      window.td__ajax({
        url: "/projects/submit/",
        dataToSend: { comm: "addnewfolder", projectid, title, csrf: window.getCSRF() },
        ui: { ctext: "th: create ancestor folder" },
        onSuccess: function(res) {
          done += 1;
          if (Number.isFinite(Number(res))) success += 1;
          if (done !== names.length) return;
          if (success > 0) {
            setTimeout(() => location.reload(), 800);
          } else {
            console.warn("[th-folders] \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u0430\u043F\u043A\u0443-\u043F\u0440\u0435\u0434\u043A\u0430:", res);
          }
        }
      });
    });
  }
  function applyFolderHierarchy() {
    const rows = Array.from(document.querySelectorAll(".td-folder"));
    if (!rows.length) return;
    if (rows.every((r) => r.dataset.thApplied)) return;
    const container = rows[0].parentElement;
    if (!container) return;
    ensureAncestorFolders();
    const { childrenOf, sequence } = computeFolderSequence(rows);
    const pageCountByFolder = /* @__PURE__ */ new Map();
    if (Array.isArray(window.pages)) {
      window.pages.forEach((pg) => {
        if (!pg || pg.trash || !pg.folderid) return;
        pageCountByFolder.set(pg.folderid, (pageCountByFolder.get(pg.folderid) || 0) + 1);
      });
    }
    sequence.forEach(({ item, depth, hidden }) => {
      setRowLabel(item.row, depth, depth > 0 ? item.leaf : item.raw, item.raw);
      const numId = item.row.id.replace("folder", "");
      const hasPages = (pageCountByFolder.get(numId) || 0) > 0;
      const hasChildren = childrenOf.has(item.raw);
      item.row.classList.toggle("th-folder-empty", !hasPages && !hasChildren);
      setupCollapseToggle(item.row, item.raw, (childrenOf.get(foldKey(item.raw)) || []).length);
      item.row.classList.toggle("th-folder-hidden", hidden);
      item.row.dataset.thApplied = "1";
      container.appendChild(item.row);
    });
  }
  function injectDescendantTree(folderid) {
    const cont = document.querySelector(".td-project-folders");
    if (!cont) return;
    if (cont.dataset.thChildrenFor === folderid) return;
    if (!Array.isArray(window.folders) || typeof window.td__project__gethtmlbadge__folder !== "function") {
      return;
    }
    const current = window.folders.find((f) => f && f.id === folderid);
    if (!current) return;
    const baseDepth = splitPath(current.title).length;
    const parentPathOf = (title) => {
      const parts = splitPath(title);
      return parts.length > 1 ? parts.slice(0, -1).join(" / ") : null;
    };
    const prefix = current.title + " / ";
    const descendants2 = window.folders.filter((f) => f && !f.trash && startsWithFold(f.title, prefix));
    const childrenOf = /* @__PURE__ */ new Map();
    descendants2.forEach((f) => {
      const pp = parentPathOf(f.title);
      const key = pp && foldKey(pp);
      if (!childrenOf.has(key)) childrenOf.set(key, []);
      childrenOf.get(key).push(f);
    });
    const ordered = [];
    (function walk(parentTitle) {
      (childrenOf.get(foldKey(parentTitle)) || []).forEach((f) => {
        ordered.push(f);
        walk(f.title);
      });
    })(current.title);
    cont.querySelectorAll(".th-injected-child").forEach((e) => e.remove());
    ordered.forEach((f) => {
      const wrap = document.createElement("div");
      wrap.innerHTML = window.td__project__gethtmlbadge__folder(f);
      const row = wrap.firstElementChild;
      if (!row) return;
      row.classList.add("th-injected-child");
      const relDepth = splitPath(f.title).length - baseDepth - 1;
      const span = row.querySelector(".td-page__td-title-span");
      if (span) {
        const editIcon = span.querySelector(".td-page__td-title-edit");
        span.textContent = "";
        span.appendChild(document.createTextNode(splitPath(f.title).pop()));
        if (editIcon) span.appendChild(editIcon);
        span.title = f.title;
      }
      if (relDepth > 0) {
        row.classList.add("th-folder-nested");
        const s = row.querySelector(".td-page__td-title-span");
        if (s) s.style.setProperty("--th-pad", relDepth * INDENT_STEP + "px");
      }
      cont.appendChild(row);
    });
    const controls = document.querySelector(".td-project-controls");
    cont.style.marginTop = ordered.length && controls ? controls.offsetHeight + "px" : "";
    const nopages = document.querySelector(".td-project-nopages");
    if (nopages) nopages.style.display = ordered.length ? "none" : "";
    cont.dataset.thChildrenFor = folderid;
    refreshFolderVisibility();
  }
  var delFolderPatched = false;
  function ensureDelFolderCascade() {
    if (delFolderPatched) return;
    if (typeof window.td__delFolder !== "function") return;
    const orig = window.td__delFolder;
    window.td__delFolder = function(folderid, projectid) {
      const all = Array.isArray(window.folders) ? window.folders : [];
      const target = all.find((f) => f && f.id === folderid);
      if (!target) return orig(folderid, projectid);
      const prefix = target.title + " / ";
      const descendants2 = all.filter((f) => f && !f.trash && startsWithFold(f.title, prefix));
      if (!descendants2.length) return orig(folderid, projectid);
      const ids = new Set([folderid].concat(descendants2.map((d) => d.id)));
      let pageCount = 0;
      if (Array.isArray(window.pages)) {
        window.pages.forEach((p) => {
          if (p && !p.trash && ids.has(p.folderid)) pageCount += 1;
        });
      }
      const name = splitPath(target.title).pop();
      const msg = "\u041F\u0430\u043F\u043A\u0430 \xAB" + name + "\xBB \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u0442 " + descendants2.length + " \u0432\u043B\u043E\u0436\u0435\u043D\u043D\u044B\u0445 \u043F\u043E\u0434\u043F\u0430\u043F\u043E\u043A \u0438 " + pageCount + " \u0441\u0442\u0440\u0430\u043D\u0438\u0446. \u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0432\u0441\u0451 \u0431\u0435\u0437\u0432\u043E\u0437\u0432\u0440\u0430\u0442\u043D\u043E?";
      const doDelete = () => {
        const order = descendants2.slice().sort(
          (a, b) => splitPath(b.title).length - splitPath(a.title).length
        );
        const csrf2 = window.getCSRF();
        let i = 0;
        let deletedAny = false;
        const stop = (failedTitle) => {
          const text = "\u0423\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E: \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u043F\u043E\u0434\u043F\u0430\u043F\u043A\u0443 \xAB" + splitPath(failedTitle).pop() + "\xBB. \xAB" + name + "\xBB \u0438 \u043E\u0441\u0442\u0430\u0432\u0448\u0438\u0435\u0441\u044F \u0432\u043B\u043E\u0436\u0435\u043D\u043D\u044B\u0435 \u043F\u0430\u043F\u043A\u0438 \u043D\u0435 \u0442\u0440\u043E\u043D\u0443\u0442\u044B \u2014 \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437.";
          if (typeof window.td__showBubbleNotice === "function") {
            window.td__showBubbleNotice(text, 7e3, "error");
          } else {
            console.warn("[th-folders] \u043A\u0430\u0441\u043A\u0430\u0434\u043D\u043E\u0435 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E \u043D\u0430:", failedTitle);
          }
          if (deletedAny) location.reload();
        };
        const next = () => {
          if (i >= order.length) {
            orig(folderid, projectid);
            return;
          }
          const d = order[i];
          i += 1;
          window.td__ajax({
            url: "/projects/submit/",
            dataToSend: { comm: "delfolder", folderid: d.id, projectid, csrf: csrf2 },
            ui: { ctext: "th: cascade delete folder" },
            onSuccess: function(res) {
              if (!Number.isFinite(Number(res))) return stop(d.title);
              deletedAny = true;
              next();
            },
            onError: function() {
              stop(d.title);
            }
          });
        };
        next();
      };
      if (window.confirm(msg)) doDelete();
    };
    delFolderPatched = true;
  }
  var foldersSignature = null;
  function computeFoldersSignature() {
    if (!Array.isArray(window.folders)) return "";
    return window.folders.filter((f) => f && !f.trash).map((f) => f.id + ":" + f.title).sort().join("|");
  }
  function resetFolderMarkers() {
    document.querySelectorAll(".td-folder").forEach((r) => {
      delete r.dataset.thApplied;
      delete r.dataset.thRaw;
    });
    const cont = document.querySelector(".td-project-folders");
    if (cont) delete cont.dataset.thChildrenFor;
    ancestorCreationTriggered = false;
    normalizationTriggered = false;
    if (Array.isArray(window.folders)) {
      const liveTitles = new Set(window.folders.filter((f) => f && !f.trash).map((f) => f.title));
      Array.from(collapsedFolders).forEach((path) => {
        if (!liveTitles.has(path)) collapsedFolders.delete(path);
      });
      Array.from(defaultStateDecided).forEach((path) => {
        if (!liveTitles.has(path)) defaultStateDecided.delete(path);
      });
    }
  }
  var renamePatched = false;
  function ensureRenameCascade() {
    if (renamePatched) return;
    if (typeof window.td__project__submitFolderTitle !== "function") return;
    const orig = window.td__project__submitFolderTitle;
    window.td__project__submitFolderTitle = function(e, t, a) {
      const oldTitle = e && e.title;
      if (!oldTitle || !Array.isArray(window.folders)) return orig.call(this, e, t, a);
      let newTitle = String(t == null ? "" : t).replace("<", "lt").replace(">", "gt");
      if (!newTitle) newTitle = "Folder: " + e.id;
      if (newTitle === oldTitle) return orig.call(this, e, t, a);
      const projectid = new URLSearchParams(location.search).get("projectid");
      const csrf2 = window.getCSRF && window.getCSRF() || window.csrf;
      const ajax2 = (data, cb) => window.td__ajax({
        url: "/projects/submit/",
        dataToSend: Object.assign({ csrf: csrf2 }, data),
        ui: { ctext: "th: folders" },
        onSuccess: cb,
        onError: cb
      });
      const runSeq = (list) => {
        let i = 0;
        const nx = () => {
          if (i >= list.length) return;
          list[i++](nx);
        };
        nx();
      };
      const target = window.folders.find(
        (f) => f && !f.trash && f.title === newTitle && f.id !== e.id
      );
      if (target) {
        const pages = Array.isArray(window.pages) ? window.pages.filter((p) => p && !p.trash && p.folderid === e.id) : [];
        const subs2 = window.folders.filter(
          (f) => f && !f.trash && startsWithFold(f.title, oldTitle + " / ")
        );
        const msg = "\u041F\u0430\u043F\u043A\u0430 \xAB" + newTitle + "\xBB \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442. \u041E\u0431\u044A\u0435\u0434\u0438\u043D\u0438\u0442\u044C: \u043F\u0435\u0440\u0435\u043D\u0435\u0441\u0442\u0438 " + pages.length + " \u0441\u0442\u0440\u0430\u043D\u0438\u0446 \u0438 " + subs2.length + " \u043F\u043E\u0434\u043F\u0430\u043F\u043E\u043A \u0432 \u043D\u0435\u0451, \u0430 \xAB" + splitPath(oldTitle).pop() + "\xBB \u0443\u0434\u0430\u043B\u0438\u0442\u044C?";
        if (!window.confirm(msg)) {
          orig.call(this, e, oldTitle, a);
          return;
        }
        pages.forEach((p) => {
          p.folderid = target.id;
        });
        subs2.forEach((f) => {
          f.title = target.title + f.title.slice(oldTitle.length);
        });
        e.trash = "y";
        const rowEl = document.getElementById("folder" + e.id);
        if (rowEl) rowEl.remove();
        if (a && a.remove) a.remove();
        const tasks = [];
        pages.forEach((p) => tasks.push((cb) => ajax2({ comm: "movepagetofolder", pageid: p.id, folderid: target.id }, cb)));
        subs2.forEach((f) => tasks.push((cb) => ajax2({ comm: "renamefolder", folderid: f.id, title: f.title }, cb)));
        tasks.push((cb) => ajax2({ comm: "delfolder", folderid: e.id, projectid }, cb));
        runSeq(tasks);
        return;
      }
      orig.call(this, e, t, a);
      const subs = window.folders.filter((f) => f && !f.trash && startsWithFold(f.title, oldTitle + " / "));
      if (e) e.title = newTitle;
      if (!subs.length) return;
      subs.forEach((f) => {
        f.title = newTitle + f.title.slice(oldTitle.length);
      });
      runSeq(subs.map((f) => (cb) => ajax2({ comm: "renamefolder", folderid: f.id, title: f.title }, cb)));
    };
    renamePatched = true;
  }
  var folderDnDoff = false;
  function ensureFolderDnDoff() {
    if (!folderDnDoff && typeof window.td__project__switchonSortFolders === "function") {
      window.td__project__switchonSortFolders = function() {
      };
      folderDnDoff = true;
    }
    const fsl = window.folderSortable;
    if (fsl && typeof fsl.destroy === "function") {
      fsl.destroy();
      window.folderSortable = null;
    } else if (fsl && typeof fsl.disable === "function") {
      fsl.disable();
    }
  }
  function tickFolders() {
    ensureDelFolderCascade();
    ensureRenameCascade();
    ensureFolderDnDoff();
    const sig = computeFoldersSignature();
    if (sig !== foldersSignature) {
      foldersSignature = sig;
      resetFolderMarkers();
    }
    ensureFolderNameNormalization();
    const folderid = new URLSearchParams(location.search).get("folderid");
    if (folderid) {
      injectDescendantTree(folderid);
      linkifyFolderBreadcrumb(folderid);
    } else {
      applyFolderHierarchy();
    }
  }
  function linkifyFolderBreadcrumb(folderid) {
    const el = document.querySelector(".td-project-midpanel__site-title");
    if (!el) return;
    if (el.dataset.thCrumb === folderid) return;
    if (!Array.isArray(window.folders)) return;
    const cur = window.folders.find((f) => f && f.id === folderid);
    const siteLink = el.querySelector("a");
    if (!cur || !siteLink) return;
    const projectid = new URLSearchParams(location.search).get("projectid");
    const linkStyle = siteLink.style.cssText || "font-weight:400; border-bottom: 1px #000 solid;";
    const parts = splitPath(cur.title);
    el.textContent = "";
    el.appendChild(siteLink);
    const acc = [];
    parts.forEach((seg, i) => {
      acc.push(seg);
      el.appendChild(document.createTextNode(" / "));
      const path = acc.join(" / ");
      const folder = window.folders.find((f) => f && !f.trash && f.title === path);
      const isLast = i === parts.length - 1;
      if (folder && !isLast) {
        const a = document.createElement("a");
        a.href = "/projects/?projectid=" + projectid + "&folderid=" + folder.id;
        a.textContent = seg;
        a.style.cssText = linkStyle;
        el.appendChild(a);
      } else {
        el.appendChild(document.createTextNode(seg));
      }
    });
    el.dataset.thCrumb = folderid;
  }
  function initFolderHierarchy() {
    injectFolderStyles();
    tickFolders();
    setInterval(tickFolders, 700);
  }

  // src/pagehierarchy.js
  var INDENT_STEP2 = 20;
  function injectPageHierarchyStyles() {
    if (document.getElementById("th-pages-style")) return;
    const style = document.createElement("style");
    style.id = "th-pages-style";
    style.textContent = `
    /* \u041C\u044B \u0441\u0430\u043C\u0438 \u043F\u0435\u0440\u0435\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u043C \u0441\u0442\u0440\u043E\u043A\u0438 \u043F\u043E\u0434 \u0434\u0435\u0440\u0435\u0432\u043E \u2014 \u0440\u043E\u0434\u043D\u043E\u0439 drag-handle \u0441\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0438
       \u0432\u0432\u043E\u0434\u0438\u0442 \u0432 \u0437\u0430\u0431\u043B\u0443\u0436\u0434\u0435\u043D\u0438\u0435 (\u043F\u0435\u0440\u0435\u0442\u0430\u0441\u043A\u0438\u0432\u0430\u043D\u0438\u0435 \u0438\u043C \u043A\u043E\u043D\u0444\u043B\u0438\u043A\u0442\u0443\u0435\u0442 \u0441 \u043D\u0430\u0448\u0438\u043C \u043F\u043E\u0440\u044F\u0434\u043A\u043E\u043C). */
    .td-page-page .td-page__td-sort-handler {
      display: none;
    }
    .th-page-nested .td-page__td-title-span {
      padding-left: var(--th-pad, 20px);
      position: relative;
    }
    .th-page-nested .td-page__td-title-span::before {
      content: '';
      position: absolute;
      left: calc(var(--th-pad, 20px) - 14px);
      top: 0;
      bottom: 50%;
      width: 8px;
      border-left: 1.5px solid #c9c9c9;
      border-bottom: 1.5px solid #c9c9c9;
      border-bottom-left-radius: 3px;
    }
    .th-page-nested .td-page__img {
      opacity: 0;
    }
    /* \u0421\u0442\u0440\u0435\u043B\u043E\u0447\u043A\u0430 \u0441\u0432\u043E\u0440\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u044F \u0432\u043B\u043E\u0436\u0435\u043D\u043D\u044B\u0445 \u0441\u0442\u0440\u0430\u043D\u0438\u0446 \u2014 \u0447\u0438\u043F \xAB\u25BE N\xBB (N \u2014 \u0447\u0438\u0441\u043B\u043E
       \u0434\u0435\u0442\u0435\u0439) \u0441\u0440\u0430\u0437\u0443 \u043F\u043E\u0441\u043B\u0435 \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043A\u0430, \u043A\u0430\u043A \u0443 \u043F\u0430\u043F\u043E\u043A (\u0441\u043C. folders.js). \u0420\u0430\u043D\u044C\u0448\u0435
       \u0431\u044B\u043B\u0430 \u0435\u0434\u0432\u0430 \u0437\u0430\u043C\u0435\u0442\u043D\u044B\u043C \u0448\u0435\u0432\u0440\u043E\u043D\u043E\u043C \u0432 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E\u0439 \u044F\u0447\u0435\u0439\u043A\u0435 \u0443 \u043A\u043D\u043E\u043F\u043E\u043A. */
    .th-page-toggle {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      height: 22px;
      margin-left: 10px;
      padding: 0 8px 0 4px;
      border: none;
      border-radius: 11px;
      background: #e8e8e8;
      color: #444;
      cursor: pointer;
      vertical-align: middle;
      font: 500 12px/1 Arial, sans-serif;
    }
    .th-page-toggle svg {
      width: 14px;
      height: 14px;
      transition: transform 0.15s ease;
    }
    .th-page-toggle:hover {
      background: #dcdcdc;
      color: #000;
    }
    .th-page-toggle_collapsed svg {
      transform: rotate(-90deg);
    }
    /* \u0410\u043D\u0438\u043C\u0430\u0446\u0438\u044F \u0441\u0432\u043E\u0440\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u044F \u0432\u043B\u043E\u0436\u0435\u043D\u043D\u044B\u0445 \u0441\u0442\u0440\u0430\u043D\u0438\u0446: max-height \u0432\u043C\u0435\u0441\u0442\u043E display:none,
       \u0447\u0442\u043E\u0431\u044B \u0441\u0442\u0440\u043E\u043A\u0430 \u043F\u043B\u0430\u0432\u043D\u043E \u0441\u0445\u043B\u043E\u043F\u044B\u0432\u0430\u043B\u0430\u0441\u044C/\u0440\u0430\u0437\u0432\u043E\u0440\u0430\u0447\u0438\u0432\u0430\u043B\u0430\u0441\u044C. 300px \u2014 \u0441 \u0437\u0430\u043F\u0430\u0441\u043E\u043C \u0432\u044B\u0448\u0435
       \u0440\u0435\u0430\u043B\u044C\u043D\u043E\u0439 \u0432\u044B\u0441\u043E\u0442\u044B \u0441\u0442\u0440\u043E\u043A\u0438 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B (\u043A\u0430\u0440\u0442\u0438\u043D\u043A\u0430-\u0431\u0435\u0439\u0434\u0436 + \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A + \u043A\u043D\u043E\u043F\u043A\u0438). */
    .td-page.td-page-page {
      overflow: hidden;
      max-height: 300px;
      opacity: 1;
      transition: max-height 0.25s ease, opacity 0.2s ease;
    }
    .th-page-hidden {
      max-height: 0 !important;
      opacity: 0 !important;
      pointer-events: none;
    }
  `;
    (document.head || document.documentElement).appendChild(style);
  }
  var collapsedPages = /* @__PURE__ */ new Set();
  function readPageUrlPath(row) {
    const a = row.querySelector(".td-page__td-url a");
    if (!a) return "";
    return (a.textContent || "").trim();
  }
  function computePageSequence(rows) {
    const parsed = rows.map((row) => {
      const raw = readPageUrlPath(row);
      return { row, raw };
    });
    const allByPath = /* @__PURE__ */ new Map();
    parsed.forEach((p) => {
      if (p.raw && !allByPath.has(p.raw)) allByPath.set(p.raw, p);
    });
    parsed.forEach((p) => {
      const segments = p.raw.split("/").map((s) => s.trim()).filter(Boolean);
      p.parentPath = null;
      for (let i = segments.length - 1; i >= 1; i -= 1) {
        const candidate = "/" + segments.slice(0, i).join("/");
        if (allByPath.has(candidate) && candidate !== p.raw) {
          p.parentPath = candidate;
          break;
        }
      }
    });
    const childrenOf = /* @__PURE__ */ new Map();
    const roots = [];
    parsed.forEach((p) => {
      if (p.parentPath) {
        if (!childrenOf.has(p.parentPath)) childrenOf.set(p.parentPath, []);
        childrenOf.get(p.parentPath).push(p);
      } else {
        roots.push(p);
      }
    });
    const sequence = [];
    const visited = /* @__PURE__ */ new Set();
    function emit(item, depth, hiddenByAncestor) {
      if (visited.has(item)) return;
      visited.add(item);
      sequence.push({ item, depth, hidden: hiddenByAncestor });
      const childHidden = hiddenByAncestor || collapsedPages.has(item.raw);
      (childrenOf.get(item.raw) || []).forEach((c) => emit(c, depth + 1, childHidden));
    }
    roots.forEach((r) => emit(r, 0, false));
    return { childrenOf, sequence };
  }
  var CHEVRON_SVG2 = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>';
  function setupPageCollapseToggle(row, raw, childCount) {
    let btn = row.querySelector(".th-page-toggle");
    if (!childCount) {
      if (btn) btn.remove();
      return;
    }
    const span = row.querySelector(".td-page__td-title-span");
    if (!span) return;
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "th-page-toggle";
      btn.innerHTML = CHEVRON_SVG2 + '<span class="th-page-toggle-count"></span>';
      btn.setAttribute("aria-label", "\u0421\u0432\u0435\u0440\u043D\u0443\u0442\u044C/\u0440\u0430\u0437\u0432\u0435\u0440\u043D\u0443\u0442\u044C \u0432\u043B\u043E\u0436\u0435\u043D\u043D\u044B\u0435 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B");
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const path = btn.dataset.thPath;
        if (collapsedPages.has(path)) collapsedPages.delete(path);
        else collapsedPages.add(path);
        refreshPageVisibility();
      });
    }
    if (btn.parentElement !== span) span.appendChild(btn);
    btn.querySelector(".th-page-toggle-count").textContent = childCount;
    btn.dataset.thPath = raw;
    btn.classList.toggle("th-page-toggle_collapsed", collapsedPages.has(raw));
  }
  function refreshPageVisibility() {
    const rows = Array.from(document.querySelectorAll(".td-page.td-page-page"));
    if (!rows.length) return;
    const { childrenOf, sequence } = computePageSequence(rows);
    sequence.forEach(({ item, hidden }) => {
      setupPageCollapseToggle(item.row, item.raw, (childrenOf.get(item.raw) || []).length);
      item.row.classList.toggle("th-page-hidden", hidden);
    });
  }
  function applyPageHierarchy() {
    const rows = Array.from(document.querySelectorAll(".td-page.td-page-page"));
    if (!rows.length) return;
    if (rows.every((r) => r.dataset.thPageApplied)) return;
    const container = rows[0].parentElement;
    if (!container) return;
    const { childrenOf, sequence } = computePageSequence(rows);
    sequence.forEach(({ item, depth, hidden }) => {
      const span = item.row.querySelector(".td-page__td-title-span");
      const nested = depth > 0;
      item.row.classList.toggle("th-page-nested", nested);
      if (span) {
        if (nested) span.style.setProperty("--th-pad", depth * INDENT_STEP2 + "px");
        else span.style.removeProperty("--th-pad");
      }
      setupPageCollapseToggle(item.row, item.raw, (childrenOf.get(item.raw) || []).length);
      item.row.classList.toggle("th-page-hidden", hidden);
      item.row.dataset.thPageApplied = "1";
      container.appendChild(item.row);
    });
  }
  var pageDnDoff = false;
  function ensurePageDnDoff() {
    if (!pageDnDoff && typeof window.td__project__switchonSortPages === "function") {
      window.td__project__switchonSortPages = function() {
      };
      pageDnDoff = true;
    }
    const psl = window.pageSortable;
    if (psl && typeof psl.destroy === "function") {
      psl.destroy();
      window.pageSortable = null;
    } else if (psl && typeof psl.disable === "function") {
      psl.disable();
    }
  }
  var pagesSignature = null;
  function computePagesSignature() {
    return Array.from(document.querySelectorAll(".td-page.td-page-page")).map((r) => r.id + ":" + readPageUrlPath(r)).sort().join("|");
  }
  function resetPageMarkers() {
    document.querySelectorAll(".td-page.td-page-page").forEach((r) => {
      delete r.dataset.thPageApplied;
    });
  }
  function tickPages() {
    ensurePageDnDoff();
    const sig = computePagesSignature();
    if (sig !== pagesSignature) {
      pagesSignature = sig;
      resetPageMarkers();
    }
    applyPageHierarchy();
  }
  function initPageHierarchy() {
    injectPageHierarchyStyles();
    tickPages();
    setInterval(tickPages, 700);
  }

  // src/pagecreate.js
  var FRIDAY37_PROJECT_ID = "11006165";
  var BLANK_EXAMPLE_PAGE_ID = "1231";
  var TOWNS = ["eclipse", "sunrise", "sunset", "grande", "double"];
  var TOWN_LABEL = {
    eclipse: "Eclipse",
    sunrise: "Sunrise",
    sunset: "Sunset",
    grande: "Grande",
    double: "Double"
  };
  var FLOOR_SLUGS = ["1", "2", "3", "-1", "mezzanine", "roof"];
  var FLOOR_LABEL = {
    "1": "\u044D\u0442\u0430\u0436 1",
    "2": "\u044D\u0442\u0430\u0436 2",
    "3": "\u044D\u0442\u0430\u0436 3",
    "-1": "\u044D\u0442\u0430\u0436 -1",
    mezzanine: "\u0430\u043D\u0442\u0440\u0435\u0441\u043E\u043B\u044C",
    roof: "\u043A\u0440\u043E\u0432\u043B\u044F"
  };
  function floorSlugPart(f) {
    return /^-?\d+$/.test(f) ? "floor-" + f : f;
  }
  function buildPageList() {
    const pages = [];
    const push = (alias, title) => pages.push({ alias, title });
    function lang(prefix) {
      push(prefix + "plan", "\u041F\u043B\u0430\u043D \u2014 \u0440\u0430\u0437\u0440\u0435\u0437 \u0434\u043E\u043C\u0430");
      FLOOR_SLUGS.forEach(
        (f) => push(prefix + "plan/" + floorSlugPart(f), "\u041F\u043B\u0430\u043D \u2014 " + FLOOR_LABEL[f] + " (\u0432\u0435\u0441\u044C \u044D\u0442\u0430\u0436)")
      );
      TOWNS.forEach((town) => {
        const label = TOWN_LABEL[town];
        push(prefix + "plan/" + town, "\u041F\u043B\u0430\u043D \u2014 " + label);
        FLOOR_SLUGS.forEach(
          (f) => push(prefix + "plan/" + town + "/floor-" + f, "\u041F\u043B\u0430\u043D \u2014 " + label + ", " + FLOOR_LABEL[f])
        );
      });
    }
    lang("");
    lang("en/");
    return pages;
  }
  function getProjectId() {
    return new URLSearchParams(location.search).get("projectid") || String(window.projectid || "");
  }
  function csrf() {
    return typeof window.getCSRF === "function" && window.getCSRF() || window.csrf || "";
  }
  function looksLikeLoginPage(res) {
    return typeof res === "string" && /Авторизация - Tilda|ts-page-login/.test(res);
  }
  function ajax(data) {
    return new Promise((resolve, reject) => {
      if (typeof window.td__ajax !== "function") {
        reject(new Error("td__ajax \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D"));
        return;
      }
      window.td__ajax({
        url: "/projects/submit/",
        dataToSend: Object.assign({ csrf: csrf() }, data),
        ui: { ctext: "th: Friday37 batch" },
        onSuccess: (res) => {
          if (looksLikeLoginPage(res)) reject(new SessionDeadError());
          else if (isDailyLimitMessage(res)) reject(new DailyLimitError(res));
          else resolve(res);
        },
        onError: (res) => {
          if (looksLikeLoginPage(res)) reject(new SessionDeadError());
          else if (isDailyLimitMessage(res)) reject(new DailyLimitError(res));
          else reject(new Error(typeof res === "string" ? res.slice(0, 300) : "\u043E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u043F\u0440\u043E\u0441\u0430"));
        }
      });
    });
  }
  var SessionDeadError = class extends Error {
    constructor() {
      super("\u0441\u0435\u0441\u0441\u0438\u044F \u0422\u0438\u043B\u044C\u0434\u044B \u043D\u0435\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u0430 (\u043F\u043E\u0445\u043E\u0436\u0435 \u043D\u0430 \u0440\u0430\u0437\u043B\u043E\u0433\u0438\u043D) \u2014 \u0431\u0430\u0442\u0447 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D");
    }
  };
  var DailyLimitError = class extends Error {
    constructor(raw) {
      super("\u0434\u043D\u0435\u0432\u043D\u043E\u0439 \u043B\u0438\u043C\u0438\u0442 \u0441\u0442\u0440\u0430\u043D\u0438\u0446 \u0442\u0430\u0440\u0438\u0444\u0430 \u0422\u0438\u043B\u044C\u0434\u044B \u0438\u0441\u0447\u0435\u0440\u043F\u0430\u043D \u2014 \u043E\u0441\u0442\u0430\u043B\u044C\u043D\u043E\u0435 \u0441\u043E\u0437\u0434\u0430\u0441\u0442\u0441\u044F \u0437\u0430\u0432\u0442\u0440\u0430 \u0442\u0435\u043C \u0436\u0435 \u0437\u0430\u043F\u0443\u0441\u043A\u043E\u043C (" + raw + ")");
    }
  };
  function isDailyLimitMessage(res) {
    return typeof res === "string" && /maximum \(\d+\) pages/i.test(res);
  }
  function nowDateStr() {
    const d = /* @__PURE__ */ new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }
  function existingAliasSet() {
    const set = /* @__PURE__ */ new Set();
    if (Array.isArray(window.pages)) {
      window.pages.forEach((p) => {
        if (p && !p.trash && p.alias) {
          set.add(String(p.alias).trim().replace(/^\/+|\/+$/g, "").toLowerCase());
        }
      });
    }
    return set;
  }
  async function createOnePage(projectid, entry, sort) {
    const newId = await ajax({
      comm: "addnewpagedublicateexample",
      projectid,
      examplepageid: BLANK_EXAMPLE_PAGE_ID,
      folderid: ""
    });
    if (!Number.isFinite(Number(newId))) throw new Error("addnewpagedublicateexample: " + newId);
    const res = await ajax({
      comm: "savepagesettings",
      pageid: newId,
      title: entry.title,
      descr: "",
      alias: entry.alias,
      imgfile: "",
      "img-tuinfo-uuid": "",
      "img-tuinfo-cdnurl": "",
      "img-tuinfo-name": "",
      "img-tuinfo-width": "",
      "img-tuinfo-size": "",
      fb_title: "",
      fb_descr: "",
      fb_imgfile: "",
      "fb_img-tuinfo-uuid": "",
      "fb_img-tuinfo-cdnurl": "",
      "fb_img-tuinfo-name": "",
      "fb_img-tuinfo-width": "",
      "fb_img-tuinfo-size": "",
      fb_img: "",
      fb_url: "",
      fb_appid: "",
      twitter_site: "",
      meta_title: "",
      meta_descr: "",
      meta_keywords: "",
      link_canonical: "",
      sort: String(sort),
      label: "",
      comment: "",
      folderid: "",
      writing_direction: "",
      date: nowDateStr(),
      tag: "",
      shorttitle: "",
      customlink: "",
      featureimgfile: "",
      "featureimg-tuinfo-uuid": "",
      "featureimg-tuinfo-cdnurl": "",
      "featureimg-tuinfo-name": "",
      "featureimg-tuinfo-width": "",
      "featureimg-tuinfo-size": "",
      viewpassword: "",
      jssubmit: "y"
    });
    if (String(res).trim() !== "OK") throw new Error("savepagesettings: " + res);
    return newId;
  }
  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
  var PANEL_ID = "th-f37-panel";
  var stopRequested = false;
  function ensurePanel() {
    let panel = document.getElementById(PANEL_ID);
    if (panel) return panel;
    panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:99999;background:#1e1e1e;color:#eee;font:12px/1.4 -apple-system,Arial,sans-serif;border-radius:10px;padding:12px 14px;box-shadow:0 6px 24px rgba(0,0,0,.35);max-width:360px;";
    panel.innerHTML = '<div style="font-weight:600;margin-bottom:6px;">Friday 37 \u2014 \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u043F\u043B\u0430\u043D\u0430 (\u0432\u0440\u0435\u043C.)</div><div style="display:flex;gap:8px;"><button type="button" id="th-f37-run" style="padding:6px 12px;border:0;border-radius:6px;background:#4a8;color:#fff;cursor:pointer;font:inherit;font-weight:600;">\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0432\u0441\u0435 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B</button><button type="button" id="th-f37-stop" disabled style="padding:6px 12px;border:0;border-radius:6px;background:#a44;color:#fff;cursor:pointer;font:inherit;font-weight:600;opacity:.5;">\u041E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C</button></div><div id="th-f37-log" style="margin-top:8px;max-height:220px;overflow:auto;white-space:pre-wrap;"></div>';
    document.body.appendChild(panel);
    panel.querySelector("#th-f37-run").addEventListener("click", () => {
      runBatch().catch((e) => log("\u041E\u0431\u0449\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430: " + e.message));
    });
    panel.querySelector("#th-f37-stop").addEventListener("click", () => {
      stopRequested = true;
      log("\u23F8 \u041E\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430 \u0437\u0430\u043F\u0440\u043E\u0448\u0435\u043D\u0430 \u2014 \u0434\u043E\u0441\u0447\u0438\u0442\u0430\u044E \u0442\u0435\u043A\u0443\u0449\u0438\u0439 \u0437\u0430\u043F\u0440\u043E\u0441 \u0438 \u0432\u0441\u0442\u0430\u043D\u0443 \u043D\u0430 \u043F\u0430\u0443\u0437\u0443.");
    });
    return panel;
  }
  function setRunningUI(running) {
    const runBtn = document.getElementById("th-f37-run");
    const stopBtn = document.getElementById("th-f37-stop");
    if (runBtn) runBtn.disabled = running;
    if (stopBtn) {
      stopBtn.disabled = !running;
      stopBtn.style.opacity = running ? "1" : ".5";
    }
  }
  function log(text) {
    ensurePanel();
    const el = document.getElementById("th-f37-log");
    el.textContent += text + "\n";
    el.scrollTop = el.scrollHeight;
  }
  async function runBatch() {
    stopRequested = false;
    setRunningUI(true);
    document.getElementById("th-f37-log").textContent = "";
    const projectid = getProjectId();
    const pages = buildPageList();
    const existing = existingAliasSet();
    const already = pages.filter((p) => existing.has(p.alias.toLowerCase())).length;
    log("\u0412\u0441\u0435\u0433\u043E \u0432 \u0441\u043F\u0438\u0441\u043A\u0435: " + pages.length + ", \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442: " + already);
    let created = 0, skipped = 0, failed = 0;
    let sort = 100;
    for (const entry of pages) {
      if (stopRequested) {
        log("\u23F9 \u041E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u043C \u043D\u0430 /" + entry.alias + ". \u0423\u0436\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u043D\u044B\u0435 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u043D\u0438\u043A\u0443\u0434\u0430 \u043D\u0435 \u0434\u0435\u043B\u0438\u0441\u044C.");
        setRunningUI(false);
        return;
      }
      const key = entry.alias.toLowerCase();
      if (existing.has(key)) {
        skipped++;
        continue;
      }
      try {
        const id = await createOnePage(projectid, entry, sort);
        created++;
        log("\u2713 /" + entry.alias + " \u2192 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 #" + id);
      } catch (e) {
        if (e instanceof SessionDeadError) {
          log("\u26D4 " + e.message + ". \u041E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E \u043D\u0430 /" + entry.alias + ".");
          log("\u041F\u0435\u0440\u0435\u0437\u0430\u0439\u0434\u0438\u0442\u0435 \u0432 \u0422\u0438\u043B\u044C\u0434\u0443 \u0438 \u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 \u043A\u043D\u043E\u043F\u043A\u0443 \u0441\u043D\u043E\u0432\u0430 \u2014 \u0443\u0436\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u043D\u044B\u0435 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u043D\u0435 \u0437\u0430\u0434\u0432\u043E\u044F\u0442\u0441\u044F.");
          setRunningUI(false);
          return;
        }
        if (e instanceof DailyLimitError) {
          log("\u23F3 " + e.message + ". \u041E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E \u043D\u0430 /" + entry.alias + ".");
          log("\u0421\u043E\u0437\u0434\u0430\u043D\u043E " + created + " \u0441\u0442\u0440\u0430\u043D\u0438\u0446. \u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 \u043A\u043D\u043E\u043F\u043A\u0443 \u0441\u043D\u043E\u0432\u0430 \u0437\u0430\u0432\u0442\u0440\u0430 \u2014 \u043E\u0441\u0442\u0430\u0432\u0448\u0438\u0435\u0441\u044F \u0441\u043E\u0437\u0434\u0430\u0434\u0443\u0442\u0441\u044F, \u0443\u0436\u0435 \u0433\u043E\u0442\u043E\u0432\u044B\u0435 \u043F\u0440\u043E\u043F\u0443\u0441\u0442\u044F\u0442\u0441\u044F.");
          setRunningUI(false);
          return;
        }
        failed++;
        log("\u2717 /" + entry.alias + " \u2014 " + e.message);
      }
      sort += 10;
      await sleep(2800);
    }
    log("\u0413\u043E\u0442\u043E\u0432\u043E. \u0421\u043E\u0437\u0434\u0430\u043D\u043E: " + created + ", \u043F\u0440\u043E\u043F\u0443\u0449\u0435\u043D\u043E (\u0443\u0436\u0435 \u0431\u044B\u043B\u043E): " + skipped + ", \u043E\u0448\u0438\u0431\u043E\u043A: " + failed);
    setRunningUI(false);
  }
  function initFriday37PageBatch() {
    if (getProjectId() !== FRIDAY37_PROJECT_ID) return;
    ensurePanel();
  }

  // src/copycode.js
  var T123_COPY_BTN_CLASS = "th-t123-copy-btn";
  function onCopyClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const btn = e.currentTarget;
    const rec = btn.closest(".r");
    const pre = rec && rec.querySelector(".tmod__cards pre");
    if (!pre) return;
    const text = pre.textContent.trim();
    const label = btn.querySelector(".th-t123-copy-label");
    const done = () => {
      btn.dataset.copied = "1";
      label.textContent = COPIED_TEXT;
      setTimeout(() => {
        delete btn.dataset.copied;
        label.textContent = "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C";
      }, 1200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }
  function buildCopyBtn() {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = T123_COPY_BTN_CLASS;
    btn.title = "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0432\u0435\u0441\u044C \u043A\u043E\u0434 \u0431\u043B\u043E\u043A\u0430";
    const icon = document.createElement("span");
    icon.className = "th-t123-copy-icon";
    icon.innerHTML = COPY_ICON_SVG;
    const label = document.createElement("span");
    label.className = "th-t123-copy-label";
    label.textContent = "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C";
    btn.appendChild(icon);
    btn.appendChild(label);
    btn.addEventListener("mousedown", (e) => e.stopPropagation());
    btn.addEventListener("click", onCopyClick);
    return btn;
  }
  function updateT123CopyButtons() {
    getT123Recs().forEach((rec) => {
      const header = rec.querySelector(".tmod__header");
      if (!header || header.querySelector("." + T123_COPY_BTN_CLASS)) return;
      if (isCarrierText(rec.textContent)) return;
      if (!rec.querySelector(".tmod__cards pre")) return;
      header.appendChild(buildCopyBtn());
    });
    getT868Recs().forEach((rec) => {
      const header = rec.querySelector(".tmod__header");
      if (!header || header.querySelector("." + T123_COPY_BTN_CLASS)) return;
      if (!rec.querySelector(".tmod__cards pre")) return;
      header.appendChild(buildCopyBtn());
    });
  }

  // src/popupopen.js
  var POPUP_OPEN_BTN_CLASS = "th-popup-open-btn";
  function updatePopupOpenButtons() {
    document.querySelectorAll('.r .tmod__text a[href^="#popup"]').forEach((link) => {
      const header = link.closest(".tmod__header");
      if (!header || header.querySelector("." + POPUP_OPEN_BTN_CLASS)) return;
      link.style.display = "none";
      const tail = link.nextSibling;
      if (tail && tail.nodeType === Node.TEXT_NODE) {
        tail.textContent = tail.textContent.replace(/^[^.]*\.\s*/, "");
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = POPUP_OPEN_BTN_CLASS;
      btn.title = "\u041E\u0442\u043A\u0440\u044B\u0442\u044C pop-up";
      const icon = document.createElement("span");
      icon.className = "th-popup-open-icon";
      icon.innerHTML = EYE_ICON_SVG;
      const label = document.createElement("span");
      label.textContent = "\u041E\u0442\u043A\u0440\u044B\u0442\u044C";
      btn.appendChild(icon);
      btn.appendChild(label);
      btn.addEventListener("mousedown", (e) => e.stopPropagation());
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        link.click();
      });
      header.appendChild(btn);
    });
  }

  // src/anchorcopy.js
  var ANCHOR_COPY_BTN_CLASS = "th-anchor-copy-btn";
  var ANCHOR_NAME_PLACEHOLDER = "\u043D\u0435 \u0437\u0430\u0434\u0430\u043D\u043E";
  function getAnchorName(header) {
    const nameBtn = header && header.querySelector('button[data-edit-link-field="anchor"]');
    if (!nameBtn) return null;
    const name = nameBtn.textContent.trim();
    if (!name || name === ANCHOR_NAME_PLACEHOLDER) return null;
    return name;
  }
  function onCopyClick2(e) {
    e.preventDefault();
    e.stopPropagation();
    const btn = e.currentTarget;
    const header = btn.closest(".tmod__header");
    const name = getAnchorName(header);
    if (!name) return;
    const text = "#" + name;
    const label = btn.querySelector(".th-t123-copy-label");
    const done = () => {
      btn.dataset.copied = "1";
      label.textContent = COPIED_TEXT;
      setTimeout(() => {
        delete btn.dataset.copied;
        label.textContent = "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C";
      }, 1200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }
  function updateAnchorCopyButtons() {
    document.querySelectorAll('.r .tmod__text button[data-edit-link-field="anchor"]').forEach((nameBtn) => {
      const header = nameBtn.closest(".tmod__header");
      if (!header) return;
      let btn = header.querySelector("." + ANCHOR_COPY_BTN_CLASS);
      if (!btn) {
        btn = document.createElement("button");
        btn.type = "button";
        btn.className = "th-t123-copy-btn " + ANCHOR_COPY_BTN_CLASS;
        btn.title = "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0441\u0441\u044B\u043B\u043A\u0443 \u043D\u0430 \u044F\u043A\u043E\u0440\u044C";
        const icon = document.createElement("span");
        icon.className = "th-t123-copy-icon";
        icon.innerHTML = COPY_ICON_SVG;
        const label = document.createElement("span");
        label.className = "th-t123-copy-label";
        label.textContent = "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C";
        btn.appendChild(icon);
        btn.appendChild(label);
        btn.addEventListener("mousedown", (e) => e.stopPropagation());
        btn.addEventListener("click", onCopyClick2);
        header.appendChild(btn);
      }
      btn.hidden = !getAnchorName(header);
    });
  }

  // src/library.js
  var LIBRARY_TOP_CODES = ["T123", "T173", "T213", "T178", "T1093"];
  function updateLibraryExpanded() {
    const lib = document.querySelector(".tp-library.tp-library_rightsideopened");
    if (!lib) return;
    const cont = lib.querySelector(".tp-library-rightside__container");
    if (!cont || cont.classList.contains("tp-library-rightside__container_expanded")) return;
    const btn = lib.querySelector(".tp-library-rightside__expand-btn");
    if (btn) btn.click();
  }
  var FAQ_SOURCE_TYPE_ID = "39";
  var FAQ_CODES = ["SV501", "SV502", "SV503"];
  var FAQ_TYPE_ID = "faq";
  function updateLibraryFaqSection() {
    const uslugi = document.querySelector(
      `.tp-library__type-body[data-library-type-id="${FAQ_SOURCE_TYPE_ID}"]`
    );
    const srcPanel = document.querySelector(`#tplslist${FAQ_SOURCE_TYPE_ID}`);
    if (!uslugi || !srcPanel) return;
    let faqItem = document.querySelector(`.tp-library__type-body[data-library-type-id="${FAQ_TYPE_ID}"]`);
    let panel = document.querySelector(`#tplslist${FAQ_TYPE_ID}`);
    if (!faqItem || !panel) {
      faqItem = uslugi.cloneNode(true);
      faqItem.setAttribute("data-library-type-id", FAQ_TYPE_ID);
      faqItem.classList.remove("tp-library__type-body_active");
      const title = faqItem.querySelector(".tp-library__type-title");
      if (title) title.textContent = "FAQ";
      uslugi.insertAdjacentElement("afterend", faqItem);
      faqItem.addEventListener("click", () => window.tp__library__openCategory(faqItem));
      panel = srcPanel.cloneNode(false);
      panel.id = `tplslist${FAQ_TYPE_ID}`;
      panel.setAttribute("data-tpls-for-type", FAQ_TYPE_ID);
      panel.classList.remove("tp-library__tpls-list-body_active", "tp-library__tpls-list-body_visible");
      const closeIcon = srcPanel.querySelector(".tp-library__tpls-list-body-close");
      if (closeIcon) panel.appendChild(closeIcon.cloneNode(true));
      const container2 = document.createElement("div");
      container2.className = "tp-library__tpls-list-body__container";
      panel.appendChild(container2);
      srcPanel.insertAdjacentElement("afterend", panel);
    }
    const container = panel.querySelector(".tp-library__tpls-list-body__container");
    if (!container) return;
    srcPanel.querySelectorAll(".tp-library__tpl-cod").forEach((codeEl) => {
      if (!FAQ_CODES.includes(codeEl.textContent.trim())) return;
      const card = codeEl.closest(".tp-library__tpl-body");
      if (card) container.appendChild(card);
    });
  }
  function updateLibraryOrder() {
    document.querySelectorAll(".tp-library__tpls-list-body__container").forEach((cont) => {
      const bodies = [...cont.children];
      const byCod = /* @__PURE__ */ new Map();
      bodies.forEach((b) => {
        const cod = b.querySelector(".tp-library__tpl-cod");
        if (cod) byCod.set(cod.textContent.trim(), b);
      });
      if (!LIBRARY_TOP_CODES.every((c) => byCod.has(c))) return;
      if (LIBRARY_TOP_CODES.every((c, i) => bodies[i] === byCod.get(c))) return;
      for (let i = LIBRARY_TOP_CODES.length - 1; i >= 0; i--) {
        cont.insertBefore(byCod.get(LIBRARY_TOP_CODES[i]), cont.firstChild);
      }
    });
  }

  // src/zeroblock.js
  var OPEN_ZERO_BLOCK_PREFS_BTN_SELECTOR = ".sui-btn-grid-open";
  var LANGUAGE_SELECT_SELECTOR = 'select[name="language"]';
  var DEFAULT_LANG = "EN";
  var RELOAD_DIALOG_CONTENT_SELECTOR = "#confirm-dialog-with-promise .tn-dialog-popup__content";
  var LANGUAGE_RELOAD_NOTE = "Tilda Helper \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u043F\u043E\u0441\u0442\u0430\u0432\u0438\u043B \u044F\u0437\u044B\u043A \u0431\u043B\u043E\u043A\u0430 \u2014 English. ";
  var RELOAD_NOTICE_TTL_MS = 5e3;
  var handledOpenButtons = /* @__PURE__ */ new WeakSet();
  var handledSelects = /* @__PURE__ */ new WeakSet();
  var languageReloadNoticeExpiresAt = 0;
  function autoOpenZeroBlockPreferences() {
    document.querySelectorAll(OPEN_ZERO_BLOCK_PREFS_BTN_SELECTOR).forEach((btn) => {
      if (handledOpenButtons.has(btn)) return;
      handledOpenButtons.add(btn);
      if (btn.textContent.trim().toLowerCase() === "open") return;
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
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
      languageReloadNoticeExpiresAt = Date.now() + RELOAD_NOTICE_TTL_MS;
    });
  }
  function annotateReloadDialogIfPending() {
    if (Date.now() > languageReloadNoticeExpiresAt) return;
    const content = document.querySelector(RELOAD_DIALOG_CONTENT_SELECTOR);
    if (!content || content.dataset.thAnnotated) return;
    content.dataset.thAnnotated = "1";
    content.textContent = LANGUAGE_RELOAD_NOTE + content.textContent.trim();
    languageReloadNoticeExpiresAt = 0;
  }
  function runZeroBlockAutomations() {
    autoOpenZeroBlockPreferences();
    enforceDefaultLanguage();
    annotateReloadDialogIfPending();
  }

  // src/zeroconstraints.js
  var SETTINGS_SELECTOR = ".tn-settings";
  var ALIGN_ROW_CLASS = "th-align-row";
  function isApiReady() {
    return typeof elem__getFieldValue === "function" && typeof elem__setFieldValue === "function" && typeof elem__isInAutolayout === "function" && typeof elem__renderViewOneField === "function" && typeof elem__getWidth === "function" && typeof elem__getHeight === "function" && typeof storeInstance === "object" && storeInstance;
  }
  function isAbsoluteAutolayout(el) {
    return el && elem__getFieldValue(el, "absolute") === "y" && elem__isInAutolayout(el);
  }
  function currentBreakpoint() {
    try {
      return storeInstance.getState().breakpoints.current;
    } catch (e) {
      return 1200;
    }
  }
  function gridWidth() {
    return currentBreakpoint();
  }
  function artboardHeight(el) {
    const ab = el.closest(".tn-artboard");
    if (!ab) return 0;
    const bp = currentBreakpoint();
    return parseFloat(ab.getAttribute("data-artboard-height-res-" + bp)) || parseFloat(ab.getAttribute("data-artboard-height")) || 0;
  }
  function alignH(el, where) {
    const gw = gridWidth();
    const ew = elem__getWidth(el);
    const left = where === "left" ? 0 : where === "center" ? Math.round((gw - ew) / 2) : gw - ew;
    elem__setFieldValue(el, "axisx", "left");
    elem__setFieldValue(el, "left", String(left));
    if (typeof elem__drawAxis === "function") elem__drawAxis(el);
    elem__renderViewOneField(el, "left");
  }
  function alignV(el, where) {
    const ah = artboardHeight(el);
    const eh = elem__getHeight(el);
    const top = where === "top" ? 0 : where === "center" ? Math.round((ah - eh) / 2) : ah - eh;
    elem__setFieldValue(el, "axisy", "top");
    elem__setFieldValue(el, "top", String(top));
    if (typeof elem__drawAxis === "function") elem__drawAxis(el);
    elem__renderViewOneField(el, "top");
  }
  var ICONS = {
    "H:left": '<svg width="18" height="18" viewBox="0 0 18 18"><rect x="2" y="2" width="1.6" height="14" fill="currentColor"/><rect x="5" y="5" width="8" height="3" rx="1" fill="currentColor"/><rect x="5" y="10" width="5" height="3" rx="1" fill="currentColor"/></svg>',
    "H:center": '<svg width="18" height="18" viewBox="0 0 18 18"><rect x="8.2" y="2" width="1.6" height="14" fill="currentColor"/><rect x="4" y="5" width="10" height="3" rx="1" fill="currentColor"/><rect x="5.5" y="10" width="7" height="3" rx="1" fill="currentColor"/></svg>',
    "H:right": '<svg width="18" height="18" viewBox="0 0 18 18"><rect x="14.4" y="2" width="1.6" height="14" fill="currentColor"/><rect x="5" y="5" width="8" height="3" rx="1" fill="currentColor"/><rect x="8" y="10" width="5" height="3" rx="1" fill="currentColor"/></svg>',
    "V:top": '<svg width="18" height="18" viewBox="0 0 18 18"><rect x="2" y="2" width="14" height="1.6" fill="currentColor"/><rect x="5" y="5" width="3" height="8" rx="1" fill="currentColor"/><rect x="10" y="5" width="3" height="5" rx="1" fill="currentColor"/></svg>',
    "V:center": '<svg width="18" height="18" viewBox="0 0 18 18"><rect x="2" y="8.2" width="14" height="1.6" fill="currentColor"/><rect x="5" y="4" width="3" height="10" rx="1" fill="currentColor"/><rect x="10" y="5.5" width="3" height="7" rx="1" fill="currentColor"/></svg>',
    "V:bottom": '<svg width="18" height="18" viewBox="0 0 18 18"><rect x="2" y="14.4" width="14" height="1.6" fill="currentColor"/><rect x="5" y="5" width="3" height="8" rx="1" fill="currentColor"/><rect x="10" y="8" width="3" height="5" rx="1" fill="currentColor"/></svg>'
  };
  var GROUPS = [
    { kind: "H", fn: alignH, values: ["left", "center", "right"] },
    { kind: "V", fn: alignV, values: ["top", "center", "bottom"] }
  ];
  function activeValue(el, kind) {
    if (kind === "H") {
      if (elem__getFieldValue(el, "axisx") !== "left") return null;
      const gw = gridWidth();
      const ew = elem__getWidth(el);
      const left = parseFloat(elem__getFieldValue(el, "left")) || 0;
      if (Math.abs(left - 0) <= 1) return "left";
      if (Math.abs(left - (gw - ew) / 2) <= 1) return "center";
      if (Math.abs(left - (gw - ew)) <= 1) return "right";
      return null;
    }
    if (elem__getFieldValue(el, "axisy") !== "top") return null;
    const ah = artboardHeight(el);
    const eh = elem__getHeight(el);
    const top = parseFloat(elem__getFieldValue(el, "top")) || 0;
    if (Math.abs(top - 0) <= 1) return "top";
    if (Math.abs(top - (ah - eh) / 2) <= 1) return "center";
    if (Math.abs(top - (ah - eh)) <= 1) return "bottom";
    return null;
  }
  function buildAlignRow(el) {
    const row = document.createElement("div");
    row.className = ALIGN_ROW_CLASS;
    const label = document.createElement("div");
    label.className = "th-align-label";
    label.textContent = "\u0412\u044B\u0440\u0430\u0432\u043D\u0438\u0432\u0430\u043D\u0438\u0435";
    row.appendChild(label);
    const wrap = document.createElement("div");
    wrap.className = "th-align-groups";
    GROUPS.forEach((grp) => {
      const g = document.createElement("div");
      g.className = "th-align-group";
      const active = activeValue(el, grp.kind);
      grp.values.forEach((val) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "th-align-btn";
        btn.innerHTML = ICONS[grp.kind + ":" + val];
        btn.title = val;
        if (val === active) btn.classList.add("th-align-btn_active");
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          try {
            grp.fn(el, val);
          } catch (err) {
            console.warn("[Tilda Helper] \u0432\u044B\u0440\u0430\u0432\u043D\u0438\u0432\u0430\u043D\u0438\u0435 \u043D\u0435 \u0441\u0440\u0430\u0431\u043E\u0442\u0430\u043B\u043E:", err);
          }
          g.querySelectorAll(".th-align-btn").forEach((b) => b.classList.remove("th-align-btn_active"));
          btn.classList.add("th-align-btn_active");
        });
        g.appendChild(btn);
      });
      wrap.appendChild(g);
    });
    row.appendChild(wrap);
    return row;
  }
  function injectAlignmentControls() {
    if (!isApiReady()) return;
    const panel = document.querySelector(SETTINGS_SELECTOR);
    if (!panel) return;
    const elemId = panel.getAttribute("data-for-elem-id");
    if (!elemId) return;
    const el = document.querySelector('[data-elem-id="' + elemId + '"]');
    if (!isAbsoluteAutolayout(el)) {
      const stale = panel.querySelector("." + ALIGN_ROW_CLASS);
      if (stale) stale.remove();
      return;
    }
    const existing = panel.querySelector("." + ALIGN_ROW_CLASS);
    if (existing && existing.dataset.forElem === elemId) {
      refreshActive(existing, el);
      return;
    }
    if (existing) existing.remove();
    const row = buildAlignRow(el);
    row.dataset.forElem = elemId;
    const posSection = panel.querySelector(".sui-panel__section-pos");
    if (posSection) posSection.insertBefore(row, posSection.firstChild);
    else panel.insertBefore(row, panel.firstChild);
  }
  function refreshActive(row, el) {
    const groups = row.querySelectorAll(".th-align-group");
    GROUPS.forEach((grp, i) => {
      const g = groups[i];
      if (!g) return;
      const active = activeValue(el, grp.kind);
      const btns = g.querySelectorAll(".th-align-btn");
      grp.values.forEach((val, j) => {
        if (btns[j]) btns[j].classList.toggle("th-align-btn_active", val === active);
      });
    });
  }
  var stylesInjected = false;
  function ensureAlignStyles() {
    if (stylesInjected) return;
    if (typeof document === "undefined" || !document.head) return;
    stylesInjected = true;
    const style = document.createElement("style");
    style.setAttribute("data-th-align", "1");
    style.textContent = `
.${ALIGN_ROW_CLASS}{padding:2px 0 14px;margin-bottom:14px;border-bottom:1px solid rgba(0,0,0,.08);}
.${ALIGN_ROW_CLASS} .th-align-label{font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:#8b8b8b;margin-bottom:8px;}
.${ALIGN_ROW_CLASS} .th-align-groups{display:flex;gap:10px;}
.${ALIGN_ROW_CLASS} .th-align-group{display:flex;background:#f0f0f0;border-radius:7px;padding:2px;gap:2px;}
.${ALIGN_ROW_CLASS} .th-align-btn{display:flex;align-items:center;justify-content:center;width:30px;height:26px;border:none;background:transparent;border-radius:5px;cursor:pointer;color:#6b6b6b;padding:0;}
.${ALIGN_ROW_CLASS} .th-align-btn:hover{background:rgba(0,0,0,.06);color:#2b2b2b;}
.${ALIGN_ROW_CLASS} .th-align-btn_active{background:#fff;color:#1a1a1a;box-shadow:0 1px 2px rgba(0,0,0,.14);}
`;
    document.head.appendChild(style);
  }
  function runZeroConstraints() {
    ensureAlignStyles();
    injectAlignmentControls();
  }

  // src/upscaletoggle.js
  var TOGGLE_CLASS = "th-upscale-toggle";
  var FIELDS = [
    { field: "upscale", on: "window", off: "grid", title: "Scale Grid Container" },
    { field: "flex", on: "auto", off: "", title: "Flex" },
    { field: "zoomable", on: "y", off: "", title: "Zoomable" },
    { field: "pevent", on: "", off: "none", title: "Pointer events" },
    { field: "hidden", on: "n", off: "y", title: "Visibility" }
  ];
  function syncToggle(toggle, select, onValue) {
    const on = select.value === onValue;
    toggle.classList.toggle(TOGGLE_CLASS + "_on", on);
    toggle.setAttribute("aria-checked", on ? "true" : "false");
  }
  function buildToggle(select, cfg) {
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = TOGGLE_CLASS;
    toggle.setAttribute("role", "switch");
    toggle.title = cfg.title;
    const thumb = document.createElement("span");
    thumb.className = TOGGLE_CLASS + "__thumb";
    toggle.appendChild(thumb);
    toggle.addEventListener("mousedown", (e) => e.stopPropagation());
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      select.value = select.value === cfg.on ? cfg.off : cfg.on;
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
      syncToggle(toggle, select, cfg.on);
    });
    return toggle;
  }
  function layoutInOneLine(group) {
    const table = group.querySelector("table");
    if (table) table.classList.add(TOGGLE_CLASS + "-row");
    const label = group.querySelector("label.sui-label");
    if (label) label.style.width = "auto";
  }
  function updateFieldToggle(cfg) {
    document.querySelectorAll('.tn-settings [data-control-field="' + cfg.field + '"]').forEach((group) => {
      const select = group.querySelector('select[name="' + cfg.field + '"]');
      if (!select) return;
      const wrap = select.parentElement;
      if (!wrap || !wrap.classList.contains("sui-select")) return;
      layoutInOneLine(group);
      let toggle = group.querySelector("." + TOGGLE_CLASS);
      if (!toggle) {
        wrap.style.display = "none";
        toggle = buildToggle(select, cfg);
        wrap.insertAdjacentElement("afterend", toggle);
      }
      syncToggle(toggle, select, cfg.on);
    });
  }
  var stylesInjected2 = false;
  function ensureUpscaleToggleStyles() {
    if (stylesInjected2) return;
    if (typeof document === "undefined" || !document.head) return;
    stylesInjected2 = true;
    const style = document.createElement("style");
    style.setAttribute("data-th-upscale-toggle", "1");
    style.textContent = `
.${TOGGLE_CLASS}-row{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;}
.${TOGGLE_CLASS}-row tbody,.${TOGGLE_CLASS}-row tr{display:contents;}
.${TOGGLE_CLASS}-row td{width:auto!important;padding:0;min-width:0;}
.${TOGGLE_CLASS}-row td:last-child{display:flex;justify-content:flex-end;}
.${TOGGLE_CLASS}{position:relative;display:inline-block;width:36px;height:20px;padding:0;border:none;border-radius:10px;background:#d5d5d5;cursor:pointer;flex-shrink:0;transition:background-color .15s ease;}
.${TOGGLE_CLASS}__thumb{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s ease;}
.${TOGGLE_CLASS}_on{background:#2d6cdf;}
.${TOGGLE_CLASS}_on .${TOGGLE_CLASS}__thumb{transform:translateX(16px);}
`;
    document.head.appendChild(style);
  }
  function runUpscaleToggle() {
    ensureUpscaleToggleStyles();
    FIELDS.forEach(updateFieldToggle);
  }

  // src/treelist.js
  var INDENT_STEP3 = 20;
  function syncRowMaxHeight(row, hidden) {
    if (hidden) {
      row.style.removeProperty("max-height");
    } else {
      row.style.maxHeight = row.scrollHeight + "px";
    }
  }
  var CHEVRON_SVG3 = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>';
  function injectTreelistStyles() {
    if (document.getElementById("th-treelist-style")) return;
    const style = document.createElement("style");
    style.id = "th-treelist-style";
    style.textContent = `
    .th-tl-folder-nested {
      margin-left: var(--th-tl-pad, 20px);
    }
    .th-tl-folder-nested > .tc-treelist__folder__title-wrapper {
      position: relative;
    }
    .th-tl-folder-nested > .tc-treelist__folder__title-wrapper::before {
      content: '';
      position: absolute;
      left: -14px;
      top: 0;
      bottom: 50%;
      width: 8px;
      border-left: 1.5px solid #c9c9c9;
      border-bottom: 1.5px solid #c9c9c9;
      border-bottom-left-radius: 3px;
    }
    /* \u0418\u043A\u043E\u043D\u043A\u0430 \u043F\u0430\u043F\u043A\u0438 \u2014 \u044D\u0442\u043E ::before \u043D\u0430 .tc-treelist__folder__title (\u043D\u0435 \u0444\u043E\u043D \u0438 \u043D\u0435
       \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0439 div). \u0423 \u0432\u043B\u043E\u0436\u0435\u043D\u043D\u043E\u0439 \u043F\u0430\u043F\u043A\u0438 \u043F\u0440\u044F\u0447\u0435\u043C. */
    .th-tl-folder-nested .tc-treelist__folder__title::before {
      content: none !important;
    }
    .th-tl-page-nested .tc-treelist__page__icon {
      opacity: 0;
    }
    .th-tl-page-nested .tc-treelist__page__name {
      padding-left: var(--th-tl-pad, 20px);
      position: relative;
    }
    .th-tl-page-nested .tc-treelist__page__name::before {
      content: '';
      position: absolute;
      left: calc(var(--th-tl-pad, 20px) - 14px);
      top: 0;
      bottom: 50%;
      width: 8px;
      border-left: 1.5px solid #c9c9c9;
      border-bottom: 1.5px solid #c9c9c9;
      border-bottom-left-radius: 3px;
    }
    .tc-treelist__folder__title-wrapper,
    .tc-treelist__page {
      position: relative;
    }
    /* \u0421\u0442\u0440\u0435\u043B\u043E\u0447\u043A\u0430 \u0441\u0432\u043E\u0440\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u044F \u2014 \u0447\u0438\u043F \xAB\u25BE N\xBB (N \u2014 \u0447\u0438\u0441\u043B\u043E \u0432\u043B\u043E\u0436\u0435\u043D\u043D\u044B\u0445) \u0441\u0440\u0430\u0437\u0443 \u043F\u043E\u0441\u043B\u0435
       \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F, \u043A\u0430\u043A \u0443 \u043F\u0430\u043F\u043E\u043A/\u0441\u0442\u0440\u0430\u043D\u0438\u0446 \u0432 /projects/, \u0442\u043E\u043B\u044C\u043A\u043E \u043A\u043E\u043C\u043F\u0430\u043A\u0442\u043D\u0435\u0435 \u043F\u043E\u0434
       \u0440\u0430\u0437\u043C\u0435\u0440 \u0434\u0440\u043E\u043F\u0434\u0430\u0443\u043D\u0430. \u0420\u0430\u043D\u044C\u0448\u0435 \u0431\u044B\u043B \u0435\u0434\u0432\u0430 \u0437\u0430\u043C\u0435\u0442\u043D\u044B\u0439 \u0448\u0435\u0432\u0440\u043E\u043D \u0443 \u043F\u0440\u0430\u0432\u043E\u0433\u043E \u043A\u0440\u0430\u044F. */
    .th-tl-toggle {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      height: 18px;
      margin-left: 8px;
      padding: 0 7px 0 3px;
      border: none;
      border-radius: 9px;
      background: #e8e8e8;
      color: #444;
      cursor: pointer;
      vertical-align: middle;
      flex: 0 0 auto;
      font: 500 11px/1 Arial, sans-serif;
    }
    .th-tl-toggle svg {
      width: 12px;
      height: 12px;
      transition: transform 0.15s ease;
    }
    .th-tl-toggle:hover {
      background: #dcdcdc;
      color: #000;
    }
    .th-tl-toggle_collapsed svg {
      transform: rotate(-90deg);
    }
    /* \u0410\u043D\u0438\u043C\u0430\u0446\u0438\u044F \u0441\u0445\u043B\u043E\u043F\u044B\u0432\u0430\u043D\u0438\u044F \u2014 max-height \u0432\u043C\u0435\u0441\u0442\u043E display:none. */
    .tc-treelist__pagelist__folder,
    .tc-treelist__page {
      overflow: hidden;
      max-height: 9999px;
      opacity: 1;
      transition: max-height 0.25s ease, opacity 0.2s ease;
    }
    .th-tl-hidden {
      max-height: 0 !important;
      opacity: 0 !important;
      pointer-events: none;
    }
    /* \u0420\u0430\u0437\u0434\u0435\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u043B\u0438\u043D\u0438\u0438 \u043C\u0435\u0436\u0434\u0443 \u0433\u0440\u0443\u043F\u043F\u0430\u043C\u0438:
       \u043F\u0430\u043F\u043A\u0438 \u2192 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B, \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u2192 Header/Footer, \u2192 Header/Footer [\u041A\u0430\u0442\u0430\u043B\u043E\u0433]
       (\u0441\u043B\u0443\u0436\u0435\u0431\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430-\u0445\u0435\u0434\u0435\u0440 \u043F\u043E\u0441\u043B\u0435 \u0434\u0440\u0443\u0433\u043E\u0439 \u0441\u043B\u0443\u0436\u0435\u0431\u043D\u043E\u0439), \u2192 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 404.
       \u041B\u0438\u043D\u0438\u044F \u0440\u0438\u0441\u0443\u0435\u0442\u0441\u044F ::before \u041D\u0410\u0414 \u0441\u0442\u0440\u043E\u043A\u043E\u0439 (\u0432 \u0437\u043E\u043D\u0435 margin), \u0430 \u043D\u0435 border'\u043E\u043C \u2014
       \u0438\u043D\u0430\u0447\u0435 \u0444\u043E\u043D \u043F\u043E\u0434\u0441\u0432\u0435\u0442\u043A\u0438 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0439 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B (_current) \u0443\u043F\u0438\u0440\u0430\u043B\u0441\u044F \u0431\u044B \u0432 \u043B\u0438\u043D\u0438\u044E.
       \u042D\u0442\u0438 \u0441\u0442\u0440\u043E\u043A\u0438 \u2014 \u0432\u0441\u0435\u0433\u0434\u0430 \u043A\u043E\u0440\u043D\u0435\u0432\u044B\u0435 (\u043D\u0435 \u0432\u043B\u043E\u0436\u0435\u043D\u043D\u044B\u0435), th-tl-hidden \u043A \u043D\u0438\u043C \u043D\u0435
       \u043F\u0440\u0438\u043C\u0435\u043D\u044F\u0435\u0442\u0441\u044F, \u043F\u043E\u044D\u0442\u043E\u043C\u0443 overflow:visible \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u0435\u043D. */
    .tc-treelist__pagelist__folder + .tc-treelist__page,
    .tc-treelist__page:not(.js-treelist-special-page) + .js-treelist-special-page,
    .js-treelist-special-page + .js-treelist-special-page:has(.tc-treelist__page__icon_header),
    .js-treelist-special-page + .js-treelist-special-page:has(.tc-treelist__page__icon_404) {
      margin-top: 21px;
      overflow: visible;
    }
    .tc-treelist__pagelist__folder + .tc-treelist__page::before,
    .tc-treelist__page:not(.js-treelist-special-page) + .js-treelist-special-page::before,
    .js-treelist-special-page + .js-treelist-special-page:has(.tc-treelist__page__icon_header)::before,
    .js-treelist-special-page + .js-treelist-special-page:has(.tc-treelist__page__icon_404)::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: -11px;
      border-top: 1px solid #e5e5e5;
    }
    .tc-treelist__page.tc-treelist__sort__item.tc-treelist__page_current.tc-treelist__page_changed {
      border-radius: 8px;
    }
  `;
    (document.head || document.documentElement).appendChild(style);
  }
  var collapsedTl = /* @__PURE__ */ new Set();
  function folderExpanded(row) {
    return !!row.querySelector(
      ":scope > .tc-treelist__folder__title-wrapper .tc-treelist__arrow_opened"
    );
  }
  function splitPath2(raw) {
    return raw.split("/").map((s) => s.trim()).filter(Boolean);
  }
  function setupTlToggle(hostEl, key, childCount, onRefresh) {
    let btn = hostEl.querySelector(":scope > .th-tl-toggle");
    if (!childCount) {
      if (btn) btn.remove();
      return;
    }
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "th-tl-toggle";
      btn.innerHTML = CHEVRON_SVG3 + '<span class="th-tl-toggle-count"></span>';
      btn.setAttribute("aria-label", "\u0421\u0432\u0435\u0440\u043D\u0443\u0442\u044C/\u0440\u0430\u0437\u0432\u0435\u0440\u043D\u0443\u0442\u044C");
      btn.addEventListener("mousedown", (e) => e.stopPropagation());
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const k = btn.dataset.thKey;
        if (collapsedTl.has(k)) collapsedTl.delete(k);
        else collapsedTl.add(k);
        onRefresh();
      });
      hostEl.appendChild(btn);
    }
    btn.querySelector(".th-tl-toggle-count").textContent = childCount;
    btn.dataset.thKey = key;
    btn.classList.toggle("th-tl-toggle_collapsed", collapsedTl.has(key));
  }
  function computeFolderTree(folderRows) {
    const parsed = folderRows.map((row) => {
      const titleEl = row.querySelector(".tc-treelist__folder__title");
      const domText = titleEl ? titleEl.textContent.trim() : "";
      const raw = row.dataset.thFullTitle || domText;
      row.dataset.thFullTitle = raw;
      const parts = splitPath2(raw);
      return {
        row,
        raw,
        depth0: parts.length - 1,
        parentPath: parts.length > 1 ? parts.slice(0, -1).join(" / ") : null,
        leaf: parts[parts.length - 1] || raw
      };
    });
    const allByName = /* @__PURE__ */ new Map();
    parsed.forEach((p) => {
      if (p.raw && !allByName.has(p.raw)) allByName.set(p.raw, p);
    });
    const childrenOf = /* @__PURE__ */ new Map();
    const roots = [];
    parsed.forEach((p) => {
      if (p.parentPath && allByName.has(p.parentPath)) {
        if (!childrenOf.has(p.parentPath)) childrenOf.set(p.parentPath, []);
        childrenOf.get(p.parentPath).push(p);
      } else {
        roots.push(p);
      }
    });
    const sequence = [];
    const visited = /* @__PURE__ */ new Set();
    function emit(item, depth, hiddenByAncestor) {
      if (visited.has(item)) return;
      visited.add(item);
      sequence.push({ item, depth, hidden: hiddenByAncestor });
      const childHidden = hiddenByAncestor || !folderExpanded(item.row);
      (childrenOf.get(item.raw) || []).forEach((c) => emit(c, depth + 1, childHidden));
    }
    roots.forEach((r) => emit(r, 0, false));
    return { childrenOf, sequence };
  }
  function computePageTree(pageRows) {
    const parsed = pageRows.map((row) => ({ row, raw: row.dataset.url || "" }));
    const allByPath = /* @__PURE__ */ new Map();
    parsed.forEach((p) => {
      if (p.raw && !allByPath.has(p.raw)) allByPath.set(p.raw, p);
    });
    parsed.forEach((p) => {
      const segments = p.raw.split("/").map((s) => s.trim()).filter(Boolean);
      p.parentPath = null;
      for (let i = segments.length - 1; i >= 1; i -= 1) {
        const candidate = segments.slice(0, i).join("/");
        if (allByPath.has(candidate) && candidate !== p.raw) {
          p.parentPath = candidate;
          break;
        }
      }
    });
    const childrenOf = /* @__PURE__ */ new Map();
    const roots = [];
    parsed.forEach((p) => {
      if (p.parentPath) {
        if (!childrenOf.has(p.parentPath)) childrenOf.set(p.parentPath, []);
        childrenOf.get(p.parentPath).push(p);
      } else {
        roots.push(p);
      }
    });
    const sequence = [];
    const visited = /* @__PURE__ */ new Set();
    function emit(item, depth, hiddenByAncestor) {
      if (visited.has(item)) return;
      visited.add(item);
      sequence.push({ item, depth, hidden: hiddenByAncestor });
      const childHidden = hiddenByAncestor || item.raw && collapsedTl.has("p:" + item.raw);
      (childrenOf.get(item.raw) || []).forEach((c) => emit(c, depth + 1, childHidden));
    }
    roots.forEach((r) => emit(r, 0, false));
    return { childrenOf, sequence };
  }
  function reorderInto(container, orderedRows, anchor) {
    orderedRows.forEach((row) => container.insertBefore(row, anchor));
  }
  function refreshPageVisibilityInScope(container) {
    const rows = Array.from(container.querySelectorAll(":scope > .tc-treelist__page"));
    if (!rows.length) return;
    const { sequence } = computePageTree(rows);
    sequence.forEach(({ item, hidden }) => {
      item.row.classList.toggle("th-tl-hidden", hidden);
      syncRowMaxHeight(item.row, hidden);
      const btn = item.row.querySelector(":scope > .tc-treelist__page__title > .th-tl-toggle");
      if (btn) btn.classList.toggle("th-tl-toggle_collapsed", !!item.raw && collapsedTl.has("p:" + item.raw));
    });
  }
  function applyPageTreeInScope(container) {
    const rows = Array.from(container.querySelectorAll(":scope > .tc-treelist__page"));
    if (!rows.length) return;
    if (rows.every((r) => r.dataset.thTlApplied)) return;
    const { childrenOf, sequence } = computePageTree(rows);
    const anchor = container.querySelector(":scope > .tc-treelist__folder__no-pages, :scope > .tc-treelist__pagelist__no-pages") || null;
    const ordered = [];
    sequence.forEach(({ item, depth, hidden }) => {
      const nested = depth > 0;
      item.row.classList.toggle("th-tl-page-nested", nested);
      if (nested) item.row.style.setProperty("--th-tl-pad", depth * INDENT_STEP3 + "px");
      else item.row.style.removeProperty("--th-tl-pad");
      const childCount = item.raw ? (childrenOf.get(item.raw) || []).length : 0;
      const titleLink = item.row.querySelector(":scope > .tc-treelist__page__title");
      if (titleLink) {
        setupTlToggle(titleLink, "p:" + item.raw, childCount, () => refreshPageVisibilityInScope(container));
      }
      item.row.classList.toggle("th-tl-hidden", hidden);
      syncRowMaxHeight(item.row, hidden);
      item.row.dataset.thTlApplied = "1";
      ordered.push(item.row);
    });
    reorderInto(container, ordered, anchor);
  }
  function refreshFolderVisibility2(container) {
    const folderRows = Array.from(container.querySelectorAll(":scope > .tc-treelist__pagelist__folder"));
    if (!folderRows.length) return;
    const { sequence } = computeFolderTree(folderRows);
    sequence.forEach(({ item, hidden }) => {
      item.row.classList.toggle("th-tl-hidden", hidden);
      syncRowMaxHeight(item.row, hidden);
    });
  }
  function hookArrowClicks(container) {
    if (container.dataset.thArrowHook) return;
    container.dataset.thArrowHook = "1";
    container.addEventListener("click", (e) => {
      if (!e.target.closest(".tc-treelist__arrow")) return;
      setTimeout(() => refreshFolderVisibility2(container), 0);
    });
  }
  function applyFolderTree(container) {
    const folderRows = Array.from(container.querySelectorAll(":scope > .tc-treelist__pagelist__folder"));
    if (!folderRows.length) return;
    if (folderRows.every((r) => r.dataset.thTlApplied)) return;
    const { childrenOf, sequence } = computeFolderTree(folderRows);
    const anchor = container.querySelector(":scope > .tc-treelist__page, :scope > .tc-treelist__pagelist__no-pages") || null;
    const ordered = [];
    sequence.forEach(({ item, depth, hidden }) => {
      const nested = depth > 0;
      item.row.classList.toggle("th-tl-folder-nested", nested);
      if (nested) item.row.style.setProperty("--th-tl-pad", depth * INDENT_STEP3 + "px");
      else item.row.style.removeProperty("--th-tl-pad");
      const titleEl = item.row.querySelector(".tc-treelist__folder__title");
      if (titleEl) {
        titleEl.textContent = nested ? item.leaf : item.raw;
        titleEl.title = item.raw;
      }
      item.row.classList.toggle("th-tl-hidden", hidden);
      syncRowMaxHeight(item.row, hidden);
      item.row.dataset.thTlApplied = "1";
      ordered.push(item.row);
    });
    reorderInto(container, ordered, anchor);
  }
  function tickTreelist() {
    const containers = document.querySelectorAll(".js-treelist-container");
    if (!containers.length) return;
    injectTreelistStyles();
    containers.forEach((container) => {
      hookArrowClicks(container);
      applyFolderTree(container);
      refreshFolderVisibility2(container);
      applyPageTreeInScope(container);
      container.querySelectorAll(".tc-treelist__page-list-folder__pages").forEach((pagesContainer) => applyPageTreeInScope(pagesContainer));
    });
  }
  function initTreelistHierarchy() {
    setInterval(tickTreelist, 700);
    tickTreelist();
  }

  // src/breadcrumbs.js
  var PAGE_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M8.05 1H3C2.44772 1 2 1.44772 2 2V13C2 13.5523 2.44771 14 3 14H12C12.5523 14 13 13.5523 13 13V5.5M8.05 1L13 5.5M8.05 1V4.5C8.05 5.05228 8.49772 5.5 9.05 5.5H13M5 8.5H10M5 10.5H10" stroke="black"></path></svg>';
  var FOLDER_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M6.28333 2.90909L5.93247 2.41838C5.74473 2.15581 5.4418 2 5.11901 2H2C1.44772 2 1 2.44772 1 3V11C1 11.5523 1.44772 12 2 12H13C13.5523 12 14 11.5523 14 11V4.68485C14 4.2062 13.612 3.81818 13.1333 3.81818V3.81818M6.28333 2.90909L6.63419 3.3998C6.82193 3.66238 7.12487 3.81818 7.44765 3.81818H13.1333M6.28333 2.90909H12.0689C12.4544 2.90909 12.8057 3.13076 12.9716 3.47881L13.1333 3.81818" stroke="black"></path><path d="M4.00118 8.95402C3.96895 7.66667 4.60279 7 5.43 7C5.93493 7 6.32168 7.17241 7.13815 7.58621C7.73976 7.89655 8.18022 8.12644 8.63143 8.12644C9.06115 8.12644 9.26527 7.74713 9.27602 7.04598H9.9958C10.0603 8.48276 9.3727 9 8.62069 9C8.13725 9 7.70753 8.85057 6.88031 8.43678C6.31093 8.13793 5.87047 7.87356 5.44075 7.87356C5.01102 7.87356 4.74245 8.1954 4.7317 8.97701H4.00118V8.95402Z" fill="black"></path></svg>';
  var parentPages = null;
  var projectPages = null;
  var foldersData = null;
  var projectDataPromise = null;
  var CRUMB_TEXT_MAX_W = 90;
  var FIT_GAP = 16;
  function injectBreadcrumbStyles() {
    if (document.getElementById("th-breadcrumbs-style")) return;
    const style = document.createElement("style");
    style.id = "th-breadcrumbs-style";
    style.textContent = `
    .th-parent-crumb .tp-menu__item__text {
      max-width: var(--th-crumb-w, 90px);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .th-parent-crumb_more .tp-menu__breadcrumbs__item {
      cursor: pointer;
    }
    /* \u0421\u0435\u0433\u043C\u0435\u043D\u0442\u044B \u0440\u0430\u0437\u0431\u0438\u0442\u043E\u0439 \u043A\u0440\u043E\u0448\u043A\u0438 \u043F\u0430\u043F\u043A\u0438 (\u0438 \u0440\u043E\u0434\u043D\u0430\u044F \u043A\u0440\u043E\u0448\u043A\u0430 \u043F\u043E\u0441\u043B\u0435 \u0440\u0430\u0437\u0431\u0438\u0435\u043D\u0438\u044F) \u2014
       \u043E\u0431\u0440\u0435\u0437\u0430\u0435\u043C \u0434\u043B\u0438\u043D\u043D\u044B\u0435 \u0438\u043C\u0435\u043D\u0430, \u043F\u043E\u043B\u043D\u043E\u0435 \u0438\u043C\u044F \u0432 title. */
    .th-folder-crumb .tp-menu__item__text,
    .th-folder-split .tp-menu__item__text {
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* \u0421\u0435\u0433\u043C\u0435\u043D\u0442 \u0431\u0435\u0437 \u0440\u0435\u0430\u043B\u044C\u043D\u043E\u0439 \u043F\u0430\u043F\u043A\u0438-\u043F\u0440\u0435\u0434\u043A\u0430 \u2014 \u043D\u0435\u043A\u043B\u0438\u043A\u0430\u0431\u0435\u043B\u044C\u043D\u044B\u0439 \u0442\u0435\u043A\u0441\u0442. */
    span.tp-menu__breadcrumbs__item {
      cursor: default;
    }
  `;
    (document.head || document.documentElement).appendChild(style);
  }
  async function loadFoldersFromProjectsHtml(projectId) {
    const resp = await fetch("/projects/?projectid=" + encodeURIComponent(projectId), {
      credentials: "same-origin"
    });
    const html = await resp.text();
    const m = html.match(/[^.\w]folders\s*=\s*(\[[\s\S]*?\])\s*;/);
    if (!m) return null;
    try {
      const parsed = JSON.parse(m[1]);
      return Array.isArray(parsed) ? parsed : null;
    } catch (e) {
      return null;
    }
  }
  function ensureProjectDataLoaded() {
    if (projectDataPromise) return projectDataPromise;
    const projectId = String(window.projectid || "");
    if (!projectId) return Promise.resolve();
    projectDataPromise = (async () => {
      const body = new URLSearchParams();
      body.append("projectid", projectId);
      const resp = await fetch("/projects/get/getprojects/", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body.toString()
      });
      const data = await resp.json();
      projectPages = Array.isArray(data.pages) ? data.pages : [];
      if (Array.isArray(data.folders)) {
        foldersData = data.folders;
      } else {
        foldersData = await loadFoldersFromProjectsHtml(projectId).catch(() => null) || [];
      }
    })().catch(() => {
      if (!projectPages) projectPages = [];
      if (foldersData === null) foldersData = [];
    });
    return projectDataPromise;
  }
  async function loadParentPages() {
    const alias = String(window.pagealias || "");
    const projectId = String(window.projectid || "");
    if (!alias || !projectId || alias.indexOf("/") === -1) {
      parentPages = [];
      return;
    }
    await ensureProjectDataLoaded();
    const byAlias = /* @__PURE__ */ new Map();
    (projectPages || []).forEach((p) => {
      if (p.alias && !byAlias.has(p.alias)) byAlias.set(p.alias, p);
    });
    const segments = alias.split("/").filter(Boolean);
    const found = [];
    for (let i = 1; i < segments.length; i += 1) {
      const prefix = segments.slice(0, i).join("/");
      if (byAlias.has(prefix)) {
        const p = byAlias.get(prefix);
        found.push({ id: String(p.id), title: p.title || "/" + prefix });
      }
    }
    parentPages = found;
  }
  function insertParentCrumbs(visible) {
    if (!parentPages || !parentPages.length) return false;
    const bar = document.querySelector(".tp-menu__breadcrumbs");
    if (!bar) return false;
    const pageWrap = bar.querySelector(".tp-menu__page:not(.th-parent-crumb)");
    if (!pageWrap) return false;
    bar.querySelectorAll(".th-parent-crumb").forEach((el) => el.remove());
    const projectId = String(window.projectid || "");
    const hidden = parentPages.slice(0, Math.max(0, parentPages.length - visible));
    const shown = visible ? parentPages.slice(-visible) : [];
    if (hidden.length) {
      const wrap = document.createElement("div");
      wrap.className = "tp-menu__breadcrumbs__item-wrapper tp-menu__page th-parent-crumb th-parent-crumb_more";
      wrap.innerHTML = '<div class="tp-menu__breadcrumbs__divider">/</div><span class="tp-menu__breadcrumbs__item"><div class="tp-menu__item__text">\u2026</div></span>';
      const item = wrap.querySelector(".tp-menu__breadcrumbs__item");
      item.title = "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0432\u0441\u0435 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B";
      item.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const toggler = document.querySelector(".tp-menu__page__dropdown-toggler");
        if (!toggler) return;
        ["mousedown", "mouseup", "click"].forEach((type) => {
          toggler.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
        });
      });
      pageWrap.parentNode.insertBefore(wrap, pageWrap);
    }
    shown.forEach((p) => {
      const wrap = document.createElement("div");
      wrap.className = "tp-menu__breadcrumbs__item-wrapper tp-menu__page th-parent-crumb";
      wrap.innerHTML = '<div class="tp-menu__breadcrumbs__divider">/</div><a class="tp-menu__breadcrumbs__item"><div class="tp-menu__item__icon">' + PAGE_ICON_SVG + '</div><div class="tp-menu__item__text"></div></a>';
      const a = wrap.querySelector("a");
      a.href = "/page/?pageid=" + p.id + "&projectid=" + projectId;
      a.title = p.title;
      const text = wrap.querySelector(".tp-menu__item__text");
      text.textContent = p.title;
      text.style.setProperty("--th-crumb-w", CRUMB_TEXT_MAX_W + "px");
      pageWrap.parentNode.insertBefore(wrap, pageWrap);
    });
    return true;
  }
  var fitVisible = -1;
  var fitViewportWidth = 0;
  function crumbsFit() {
    const bar = document.querySelector(".tp-menu__breadcrumbs");
    const middle = document.querySelector(".tp-menu__middle");
    if (!bar || !middle) return true;
    const barRect = bar.getBoundingClientRect();
    const midRect = middle.getBoundingClientRect();
    if (!midRect.width) return true;
    return barRect.right + FIT_GAP <= midRect.left;
  }
  function fitParentCrumbs() {
    fitVisible = parentPages.length;
    insertParentCrumbs(fitVisible);
    while (!crumbsFit() && fitVisible > 0) {
      fitVisible -= 1;
      insertParentCrumbs(fitVisible);
    }
  }
  function splitFolderPath(raw) {
    return String(raw).split("/").map((s) => s.trim()).filter(Boolean);
  }
  function updateFolderBreadcrumbs() {
    const wrap = document.querySelector(".tp-menu__folder:not(.th-folder-crumb)");
    if (!wrap || wrap.dataset.thSplit) return;
    const link = wrap.querySelector("a.tp-menu__breadcrumbs__item");
    const textEl = wrap.querySelector(".tp-menu__item__text");
    if (!link || !textEl) return;
    const segments = splitFolderPath(textEl.textContent);
    if (segments.length < 2) {
      wrap.dataset.thSplit = "1";
      return;
    }
    if (foldersData === null) {
      ensureProjectDataLoaded();
      return;
    }
    const projectId = String(window.projectid || "");
    const byPath = /* @__PURE__ */ new Map();
    foldersData.forEach((f) => {
      if (!f || !f.title || f.trash) return;
      const key = splitFolderPath(f.title).join(" / ");
      if (!byPath.has(key)) byPath.set(key, f);
    });
    segments.slice(0, -1).forEach((seg, i) => {
      const path = segments.slice(0, i + 1).join(" / ");
      const folder = byPath.get(path);
      const crumb = document.createElement("div");
      crumb.className = "tp-menu__breadcrumbs__item-wrapper tp-menu__folder th-folder-crumb";
      const tag = folder ? "a" : "span";
      crumb.innerHTML = '<div class="tp-menu__breadcrumbs__divider">/</div><' + tag + ' class="tp-menu__breadcrumbs__item"><div class="tp-menu__item__icon">' + FOLDER_ICON_SVG + '</div><div class="tp-menu__item__text"></div></' + tag + ">";
      const item = crumb.querySelector(".tp-menu__breadcrumbs__item");
      item.title = path;
      if (folder) {
        item.href = "/projects/?projectid=" + projectId + "&folderid=" + folder.id;
      }
      crumb.querySelector(".tp-menu__item__text").textContent = seg;
      wrap.parentNode.insertBefore(crumb, wrap);
    });
    textEl.textContent = segments[segments.length - 1];
    link.title = segments.join(" / ");
    wrap.classList.add("th-folder-split");
    wrap.dataset.thSplit = "1";
  }
  function initEditorBreadcrumbs() {
    injectBreadcrumbStyles();
    const waiter = setInterval(() => {
      if (window.projectid === void 0) return;
      clearInterval(waiter);
      loadParentPages().catch(() => {
        parentPages = [];
      });
    }, 300);
  }
  function updateEditorBreadcrumbs() {
    if (!parentPages || !parentPages.length) return;
    if (window.innerWidth !== fitViewportWidth) {
      fitViewportWidth = window.innerWidth;
      fitVisible = -1;
    }
    const bar = document.querySelector(".tp-menu__breadcrumbs");
    if (!bar) return;
    if (fitVisible < 0 || !bar.querySelector(".th-parent-crumb")) {
      fitParentCrumbs();
    } else if (!crumbsFit()) {
      while (!crumbsFit() && fitVisible > 0) {
        fitVisible -= 1;
        insertParentCrumbs(fitVisible);
      }
    }
  }

  // src/tokens.js
  var DATA_ID = "tilda-tokens-data";
  var RUNTIME_SRC = `(function(){
var el=document.getElementById('${DATA_ID}');if(!el)return;
var data;try{data=JSON.parse(el.textContent)}catch(e){return}
var R=data.resolved||{};var RE=/\\{\\{([a-zA-Z][\\w-]*(?:\\/[a-zA-Z][\\w-]*)*)\\}\\}/g;
function mode(){var w=window.innerWidth;return w<=480?'mobiles':w<=640?'mobile':w<=980?'tablet':w<=1200?'laptop':'desktop'}
var texts=[];
function sub(s,map){return s.replace(RE,function(_,n){return map[n]!=null?map[n]:_})}
function walk(root){
  var map=R[mode()]||{};
  var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null);
  var n;while((n=w.nextNode())){
    if(n.__tt)continue;
    if(RE.test(n.nodeValue)){RE.lastIndex=0;n.__tt=1;texts.push({n:n,orig:n.nodeValue});n.nodeValue=sub(n.nodeValue,map)}
    RE.lastIndex=0;
  }
  var els=(root.querySelectorAll?root:document).querySelectorAll('[style*="{{"]');
  for(var i=0;i<els.length;i++){var st=els[i].getAttribute('style');
    els[i].setAttribute('style',st.replace(RE,function(_,x){return 'var(--'+x.replace(/\\//g,'-')+')'}))}
}
function refresh(){var map=R[mode()]||{};for(var i=0;i<texts.length;i++){var t=texts[i];
  if(t.n.isConnected===false)continue;t.n.nodeValue=sub(t.orig,map)}}
var lastMode=mode();
window.addEventListener('resize',function(){var m=mode();if(m!==lastMode){lastMode=m;refresh()}});
function start(){walk(document.body);
  new MutationObserver(function(ms){for(var i=0;i<ms.length;i++)for(var j=0;j<ms[i].addedNodes.length;j++){
    var nd=ms[i].addedNodes[j];if(nd.nodeType===1)walk(nd)}}).observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();`;

  // src/zeroimport.js
  var BTN_CLASS = "th-zeroimport-btn";
  var MODAL_ID = "th-zi-modal";
  var GRID_WIDTH = 1200;
  function injectZeroImportButton() {
    const navbar = document.querySelector(".tp-menu__navbar");
    if (!navbar || navbar.querySelector("." + BTN_CLASS)) return;
    const li = document.createElement("li");
    li.className = "tp-menu__navbar__item";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "t-button tp-menu__navbar__button " + BTN_CLASS;
    btn.title = "HTML \u2192 Zero Block";
    btn.setAttribute("aria-label", "HTML \u2192 Zero Block");
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4.5L2 9l4 4.5M12 4.5L16 9l-4 4.5" stroke="black" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    btn.addEventListener("click", openImportModal);
    li.appendChild(btn);
    navbar.insertBefore(li, navbar.firstChild);
  }
  function openImportModal() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) {
      modal.style.display = "flex";
      return;
    }
    modal = document.createElement("div");
    modal.id = MODAL_ID;
    modal.innerHTML = '<div class="th-zi-dialog">  <div class="th-zi-title">HTML \u2192 Zero Block    <button type="button" class="th-zi-close" title="\u0417\u0430\u043A\u0440\u044B\u0442\u044C">\xD7</button></div>  <div class="th-zi-hint">\u0412\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u0432\u0451\u0440\u0441\u0442\u043A\u0443 \u0441\u0435\u043A\u0446\u0438\u0438 (HTML, \u043C\u043E\u0436\u043D\u043E \u0441\u043E &lt;style&gt; \u0432\u043D\u0443\u0442\u0440\u0438). \u041E\u043D\u0430 \u043E\u0442\u0440\u0435\u043D\u0434\u0435\u0440\u0438\u0442\u0441\u044F \u0432 \u043F\u043E\u043B\u043E\u0441\u0435 1200px \u0438 \u0441\u0442\u0430\u043D\u0435\u0442 \u043D\u043E\u0432\u044B\u043C Zero-\u0431\u043B\u043E\u043A\u043E\u043C \u0441 \u0430\u0432\u0442\u043E\u043B\u0430\u0439\u0430\u0443\u0442\u043E\u043C: flex-\u043A\u043E\u043D\u0442\u0435\u0439\u043D\u0435\u0440\u044B \u0438 \u0441\u0442\u043E\u043F\u043A\u0438 \u043F\u0440\u0435\u0432\u0440\u0430\u0442\u044F\u0442\u0441\u044F \u0432\u043E \u0444\u043B\u0435\u043A\u0441-\u0433\u0440\u0443\u043F\u043F\u044B \u0441 gap \u0438 padding.</div>  <textarea class="th-zi-source" spellcheck="false" placeholder="<style>\n  .hero { display:flex; gap:24px; padding:60px; }\n</style>\n<div class=&quot;hero&quot;>\n  <h1>\u0417\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A</h1>\n</div>"></textarea>  <div class="th-zi-footer">    <span class="th-zi-status"></span>    <button type="button" class="t-button th-zi-run">\u0421\u043E\u0437\u0434\u0430\u0442\u044C Zero-\u0431\u043B\u043E\u043A</button>  </div></div>';
    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.closest(".th-zi-close")) modal.style.display = "none";
    });
    modal.querySelector(".th-zi-run").addEventListener("click", runImport);
    document.body.appendChild(modal);
  }
  function setStatus(text, isError) {
    const el = document.querySelector("#" + MODAL_ID + " .th-zi-status");
    if (!el) return;
    el.textContent = text;
    el.classList.toggle("th-zi-status_error", !!isError);
  }
  async function runImport() {
    const modal = document.getElementById(MODAL_ID);
    const source = modal.querySelector(".th-zi-source").value.trim();
    if (!source) {
      setStatus("\u0412\u0451\u0440\u0441\u0442\u043A\u0430 \u043F\u0443\u0441\u0442\u0430\u044F", true);
      return;
    }
    const runBtn = modal.querySelector(".th-zi-run");
    runBtn.disabled = true;
    try {
      setStatus("\u0420\u0435\u043D\u0434\u0435\u0440\u044E \u0432\u0451\u0440\u0441\u0442\u043A\u0443\u2026");
      const recid = await importHTMLAsZeroBlock(source, setStatus);
      setStatus("\u0413\u043E\u0442\u043E\u0432\u043E: \u0431\u043B\u043E\u043A #rec" + recid + " \u0441\u043E\u0431\u0440\u0430\u043D \u0441 \u0430\u0432\u0442\u043E\u043B\u0430\u0439\u0430\u0443\u0442\u043E\u043C");
    } catch (e) {
      setStatus("\u041E\u0448\u0438\u0431\u043A\u0430: " + (e && e.message ? e.message : e), true);
    } finally {
      runBtn.disabled = false;
    }
  }
  async function importHTMLAsZeroBlock(source, onStatus) {
    const status = typeof onStatus === "function" ? onStatus : () => {
    };
    const built = await compileHTMLToFigmaTree(source);
    if (!built.root.children.length && built.root.type !== "FRAME") {
      throw new Error("\u0432 \u0432\u0451\u0440\u0441\u0442\u043A\u0435 \u043D\u0435 \u043D\u0430\u0448\u043B\u043E\u0441\u044C \u043D\u0438 \u043E\u0434\u043D\u043E\u0433\u043E \u0432\u0438\u0434\u0438\u043C\u043E\u0433\u043E \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430");
    }
    status("\u0421\u043E\u0437\u0434\u0430\u044E Zero-\u0431\u043B\u043E\u043A\u2026");
    const recid = await createZeroRecord();
    status("\u0421\u043E\u0431\u0438\u0440\u0430\u044E \u0430\u0432\u0442\u043E\u043B\u0430\u0439\u0430\u0443\u0442 \u0432 Zero-\u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0435\u2026");
    await importIntoZeroEditor(recid, built);
    if (window.tp__updateRecord) window.tp__updateRecord(recid);
    return recid;
  }
  function getWrapperIds() {
    return [...document.querySelectorAll(".t-records > div[recordid]")].map(
      (d) => d.getAttribute("recordid")
    );
  }
  async function createZeroRecord() {
    if (!window.tp__addRecord) throw new Error("tp__addRecord \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D");
    const before = new Set(getWrapperIds());
    const last = getWrapperIds().pop() || "";
    window.tp__addRecord(T396_TPLID, last, "");
    const fresh = await waitFor(
      () => getWrapperIds().find((id) => !before.has(id)) || null,
      12e3,
      200
    );
    if (!fresh) throw new Error("\u043D\u043E\u0432\u044B\u0439 \u0431\u043B\u043E\u043A \u043D\u0435 \u043F\u043E\u044F\u0432\u0438\u043B\u0441\u044F \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435");
    return fresh;
  }
  async function importIntoZeroEditor(recid, built) {
    window.tp__openZero(recid, true);
    const fw = await waitFor(() => {
      const f = document.querySelector(".t396__iframe");
      const w = f && f.contentWindow;
      if (!w || !w.figma__buildConfig || !w.figma__convertFigmaNodes || !w.figma__processRequests || !w.figma__finalizePipeline || !w.ab__saveToDataBase || !w.allelems__getJsonData) return null;
      try {
        return w.allelems__getJsonData() ? w : null;
      } catch (e) {
        return null;
      }
    }, 25e3, 300);
    if (!fw) throw new Error("Zero-\u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u043B\u0441\u044F (\u0438\u043B\u0438 \u0432 \u043D\u0451\u043C \u043D\u0435\u0442 Figma-\u043A\u043E\u043D\u0432\u0435\u0439\u0435\u0440\u0430)");
    try {
      const config = fw.figma__buildConfig();
      const res = fw.figma__convertFigmaNodes([built.root], config);
      const artboardIsFlex = !!built.root.layoutMode;
      if (res.elements.artboard && !artboardIsFlex) {
        res.elements.artboard.height = String(Math.round(built.root.absoluteBoundingBox.height));
      }
      for (const [nodeId, req] of Object.entries(res.nodeImageRequests || {})) {
        const url = built.imageUrls.get(nodeId);
        if (url && res.elements[req.id]) {
          res.elements[req.id].img = url;
          if (built.imageOpacity && built.imageOpacity.has(nodeId)) {
            res.elements[req.id].opacity = String(built.imageOpacity.get(nodeId));
          }
          delete res.nodeImageRequests[nodeId];
        }
      }
      for (const [elId, req] of Object.entries(res.refImageRequests || {})) {
        const url = built.imageUrls.get(req.nodeId);
        if (url && res.elements[elId]) {
          res.elements[elId].img = url;
          if (built.imageOpacity && built.imageOpacity.has(req.nodeId)) {
            res.elements[elId].opacity = String(built.imageOpacity.get(req.nodeId));
          }
          delete res.refImageRequests[elId];
        }
      }
      for (const el of Object.values(res.elements)) {
        if (el && el.elem_type === "button" && built.buttonLinks.has(el.layer)) {
          el.link = built.buttonLinks.get(el.layer);
        }
      }
      if (built.textHtml && built.textHtml.size) {
        for (const el of Object.values(res.elements)) {
          if (!el || el.elem_type !== "text" || !el.text) continue;
          const plain = String(el.text).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          if (built.textHtml.has(plain)) el.text = built.textHtml.get(plain);
        }
      }
      res.nodeImageRequests = {};
      res.refImageRequests = {};
      res.vectorRequests = {};
      let processed = res;
      try {
        processed = fw.figma__processRequests(res, config);
        if (processed && typeof processed.then === "function") processed = await processed;
      } catch (e) {
        processed = res;
      }
      fw.figma__finalizePipeline(processed, config.generateId);
      await new Promise((r) => setTimeout(r, 1500));
      if (artboardIsFlex) {
        try {
          const abEl = fw.document.querySelector(".tn-artboard");
          const stateApi = fw.tn && fw.tn.state;
          if (abEl && stateApi && stateApi.setArtboardValue && fw.autolayout__check && fw.autolayout__check(abEl).isAutolayout) {
            stateApi.setArtboardValue("heightmode", "hug");
            if (fw.ab__autolayout__init) fw.ab__autolayout__init({ usePredict: false });
            if (fw.core__updateAutoHeight) fw.core__updateAutoHeight(abEl);
            if (fw.ab__renderViewOneField) {
              fw.ab__renderViewOneField("heightmode");
              fw.ab__renderViewOneField("height");
            }
            await new Promise((r) => setTimeout(r, 600));
          }
        } catch (e) {
        }
      }
      await fw.ab__saveToDataBase();
      await new Promise((r) => setTimeout(r, 800));
    } finally {
      if (window.tp__closeZero) window.tp__closeZero();
    }
  }
  async function compileHTMLToFigmaTree(source) {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;left:-20000px;top:0;width:" + GRID_WIDTH + "px;height:3000px;border:0;pointer-events:none;";
    document.body.appendChild(iframe);
    try {
      const doc = iframe.contentDocument;
      doc.open();
      doc.write(
        '<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0}</style></head><body>' + source + "</body></html>"
      );
      doc.close();
      await Promise.race([
        Promise.all([...doc.images].map((im) => im.decode().catch(() => {
        }))).then(
          () => doc.fonts ? doc.fonts.ready : null
        ),
        new Promise((r) => setTimeout(r, 3500))
      ]);
      return buildFigmaTree(iframe.contentWindow, doc);
    } finally {
      iframe.remove();
    }
  }
  function buildFigmaTree(win, doc) {
    const imageUrls = /* @__PURE__ */ new Map();
    const imageOpacity = /* @__PURE__ */ new Map();
    const buttonLinks = /* @__PURE__ */ new Map();
    const textHtml = /* @__PURE__ */ new Map();
    let seq = 0;
    let buttonSeq = 0;
    const body = doc.body;
    const bodyRect = body.getBoundingClientRect();
    const topEls = visibleChildren(body);
    let root;
    if (topEls.length === 1) {
      root = convertContainer(topEls[0], win.getComputedStyle(topEls[0]));
    } else {
      root = frameNode("section", rectBox(bodyRect));
      const bodyCs = win.getComputedStyle(body);
      root.fills = backgroundFills(bodyCs);
      applyAutolayout(root, body, bodyCs, topEls);
      for (const el of topEls) {
        const node = convertEl(el);
        if (node) root.children.push(node);
      }
    }
    return { root, imageUrls, imageOpacity, buttonLinks, textHtml };
    function visibleChildren(el) {
      return [...el.children].filter((c) => {
        if (c.tagName === "STYLE" || c.tagName === "SCRIPT") return false;
        const cs = win.getComputedStyle(c);
        if (cs.display === "none" || cs.visibility === "hidden") return false;
        const r = c.getBoundingClientRect();
        return r.width >= 1 && r.height >= 1;
      });
    }
    function convertEl(el) {
      const cs = win.getComputedStyle(el);
      if (el.tagName === "IMG") return imageNode(el, cs);
      if (el.tagName.toUpperCase() === "SVG") return svgNode(el, cs);
      if (isButtonLike(el, cs)) return buttonNode(el, cs);
      if (isTextLeaf(el, win)) {
        const text = textNode(el, cs);
        if (isStyledBox(cs)) {
          const wrap = convertContainer(el, cs, true);
          wrap.children = [text];
          return wrap;
        }
        return text;
      }
      return convertContainer(el, cs);
    }
    function convertContainer(el, cs, skipChildren) {
      const node = frameNode(nodeName(el), elBox(el));
      node.fills = backgroundFills(cs);
      applyCorners(node, cs);
      applyStrokes(node, cs);
      applyOpacity(node, cs);
      node.effects = shadowEffects(cs);
      if (cs.overflow === "hidden") node.clipsContent = true;
      if (cs.position === "absolute") node.layoutPositioning = "ABSOLUTE";
      node.paddingTop = num(cs.paddingTop);
      node.paddingRight = num(cs.paddingRight);
      node.paddingBottom = num(cs.paddingBottom);
      node.paddingLeft = num(cs.paddingLeft);
      const kids = skipChildren ? [] : visibleChildren(el);
      const childRects = [];
      if (!skipChildren) {
        for (const child of el.childNodes) {
          if (child.nodeType === 3) {
            const run = textRunNode(child, el, cs);
            if (run) {
              node.children.push(run.node);
              childRects.push(run.rect);
            }
            continue;
          }
          if (child.nodeType !== 1 || !kids.includes(child)) continue;
          const cn = convertEl(child);
          if (cn) {
            node.children.push(cn);
            childRects.push(child.getBoundingClientRect());
          }
        }
      }
      applyAutolayout(node, el, cs, childRects);
      if (!node.children.length) {
        node.type = "RECTANGLE";
        delete node.layoutMode;
        delete node.layoutWrap;
        delete node.itemSpacing;
        delete node.primaryAxisAlignItems;
        delete node.counterAxisAlignItems;
        delete node.layoutSizingHorizontal;
        delete node.layoutSizingVertical;
      }
      return node;
    }
    function textRunNode(textDomNode, parentEl, parentCs) {
      const content = (textDomNode.textContent || "").replace(/\s+/g, " ").trim();
      if (!content) return null;
      const range = doc.createRange();
      range.selectNodeContents(textDomNode);
      const r = range.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return null;
      const box = rectBox(r);
      box.width += 4;
      const node = baseNode(content.slice(0, 24).replace(/image|button|svg/gi, "\xB7") || "text", "TEXT", box);
      node.size = { x: box.width, y: box.height };
      const fontsize = parseFloat(parentCs.fontSize) || 16;
      const lh = parseFloat(parentCs.lineHeight);
      node.characters = content;
      node.style = {
        fontFamily: firstFont(parentCs.fontFamily),
        fontWeight: parseInt(parentCs.fontWeight, 10) || 400,
        fontSize: fontsize,
        lineHeightPx: lh || Math.round(fontsize * 1.3),
        textAlignHorizontal: mapTextAlign(parentCs.textAlign),
        textAutoResize: "HEIGHT"
      };
      node.fills = solidFills(parentCs.color);
      return { node, rect: r };
    }
    function applyAutolayout(node, el, cs, rects) {
      if (cs.display === "flex" || cs.display === "inline-flex") {
        const row = cs.flexDirection.startsWith("row");
        node.layoutMode = row ? "HORIZONTAL" : "VERTICAL";
        if (cs.flexWrap === "wrap") node.layoutWrap = "WRAP";
        const gap = num(row ? cs.columnGap : cs.rowGap);
        node.itemSpacing = gap || measuredGap(rects, row);
        node.primaryAxisAlignItems = mapJustify(cs.justifyContent);
        node.counterAxisAlignItems = mapAlign(cs.alignItems);
        node.layoutSizingHorizontal = "FIXED";
        node.layoutSizingVertical = "HUG";
        return;
      }
      if (rects.length >= 1) {
        const vertical = rects.every(
          (r, i) => i === 0 || r.top >= rects[i - 1].bottom - 2
        );
        const horizontal = !vertical && rects.every(
          (r, i) => i === 0 || r.left >= rects[i - 1].right - 2 && r.top < rects[i - 1].bottom - 2 && r.bottom > rects[i - 1].top + 2
        );
        if (vertical || horizontal) {
          node.layoutMode = vertical ? "VERTICAL" : "HORIZONTAL";
          node.itemSpacing = measuredGap(rects, horizontal);
          node.primaryAxisAlignItems = "MIN";
          node.counterAxisAlignItems = vertical ? stackCounterAlign(el, cs, rects, vertical) : "CENTER";
          node.layoutSizingHorizontal = "FIXED";
          node.layoutSizingVertical = "HUG";
        }
      }
    }
    function stackCounterAlign(el, cs, rects, vertical) {
      const r = el.getBoundingClientRect();
      const start = vertical ? r.left + num(cs.paddingLeft) : r.top + num(cs.paddingTop);
      const end = vertical ? r.right - num(cs.paddingRight) : r.bottom - num(cs.paddingBottom);
      let centered = true;
      let maxed = true;
      for (const cr of rects) {
        const a = (vertical ? cr.left : cr.top) - start;
        const b = end - (vertical ? cr.right : cr.bottom);
        if (Math.abs(a - b) > 3) centered = false;
        if (b > 3) maxed = false;
      }
      if (centered) return "CENTER";
      if (maxed) return "MAX";
      return "MIN";
    }
    function measuredGap(rects, row) {
      const gaps = [];
      for (let i = 1; i < rects.length; i++) {
        const g = row ? rects[i].left - rects[i - 1].right : rects[i].top - rects[i - 1].bottom;
        if (g >= 0) gaps.push(g);
      }
      if (!gaps.length) return 0;
      gaps.sort((a, b) => a - b);
      return Math.round(gaps[Math.floor(gaps.length / 2)]);
    }
    function nid() {
      return "th:" + seq++;
    }
    function nodeName(el) {
      const text = (el.innerText || "").trim().replace(/\s+/g, " ");
      const base = (text ? text.slice(0, 24) : el.tagName.toLowerCase()).replace(/image|button|svg/gi, "\xB7");
      return base || "box";
    }
    function baseNode(name, type, box) {
      return {
        id: nid(),
        name,
        type,
        visible: true,
        blendMode: "PASS_THROUGH",
        absoluteBoundingBox: box,
        absoluteRenderBounds: box,
        // figma__field__size требует size:{x,y} наравне с bounding box — без
        // него все width/height остаются пустыми и вёрстка схлопывается.
        size: { x: box.width, y: box.height },
        children: [],
        fills: [],
        strokes: [],
        effects: []
      };
    }
    function frameNode(name, box) {
      return baseNode(name, "FRAME", box);
    }
    function textNode(el, cs) {
      const box = elBox(el);
      box.width += 4;
      const node = baseNode(nodeName(el), "TEXT", box);
      applyOpacity(node, cs);
      const fontsize = parseFloat(cs.fontSize) || 16;
      const lh = parseFloat(cs.lineHeight);
      const baseColor = rgbToHex(cs.color) || "#000000";
      const segs = collectTextSegments(el, cs, baseColor);
      applyRichText(node, segs, baseColor);
      if (segs.some((s) => s.u || s.b)) {
        const plain = (node.characters || "").replace(/\s+/g, " ").trim();
        if (plain) textHtml.set(plain, segsToHtml(segs, baseColor));
      }
      node.style = {
        fontFamily: firstFont(cs.fontFamily),
        fontWeight: parseInt(cs.fontWeight, 10) || 400,
        fontSize: fontsize,
        lineHeightPx: lh || Math.round(fontsize * 1.3),
        textAlignHorizontal: mapTextAlign(cs.textAlign),
        textAutoResize: "HEIGHT"
      };
      const ls = parseFloat(cs.letterSpacing);
      if (ls) node.style.letterSpacing = ls;
      node.fills = solidFills(cs.color);
      const textOp = parseFloat(cs.opacity);
      if (!isNaN(textOp) && textOp < 1 && node.fills[0]) {
        node.fills[0].opacity = (node.fills[0].opacity || 1) * textOp;
      }
      if (cs.position === "absolute") node.layoutPositioning = "ABSOLUTE";
      return node;
    }
    function collectTextSegments(root2, rootCs, baseColor) {
      const segs = [];
      const baseWeight = parseInt(rootCs.fontWeight, 10) || 400;
      const rootU = /underline/.test(rootCs.textDecorationLine || "");
      const push = (text, color, u, b) => {
        if (!text) return;
        const last = segs[segs.length - 1];
        if (last && last.color === color && last.u === u && last.b === b) last.text += text;
        else segs.push({ text, color, u, b });
      };
      const ensureNewline = () => {
        const last = segs[segs.length - 1];
        if (last && !last.text.endsWith("\n")) push("\n", baseColor, false, false);
      };
      walk(root2, baseColor, rootU, false);
      if (segs.length) {
        segs[0].text = segs[0].text.replace(/^\s+/, "");
        segs[segs.length - 1].text = segs[segs.length - 1].text.replace(/\s+$/, "");
      }
      return segs.filter((s) => s.text.length);
      function walk(node, color, u, b) {
        for (const child of node.childNodes) {
          if (child.nodeType === 3) {
            const t = (child.textContent || "").replace(/\s+/g, " ");
            if (t) push(t, color, u, b);
          } else if (child.nodeType === 1) {
            if (child.tagName === "BR") {
              push("\n", baseColor, false, false);
              continue;
            }
            if (child.tagName === "IMG" || child.tagName.toUpperCase() === "SVG") continue;
            const ccs = win.getComputedStyle(child);
            if (ccs.display === "none") continue;
            const block = ccs.display && !/^inline/.test(ccs.display);
            if (block) ensureNewline();
            const childColor = rgbToHex(ccs.color) || color;
            const childU = u || /underline/.test(ccs.textDecorationLine || "");
            const childB = b || (parseInt(ccs.fontWeight, 10) || 400) >= baseWeight + 200;
            walk(child, childColor, childU, childB);
            if (block) ensureNewline();
          }
        }
      }
    }
    function segsToHtml(segs, baseColor) {
      const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return segs.map(
        (seg) => seg.text.split("\n").map((part) => {
          let h = esc(part);
          if (!h) return "";
          if (seg.color && seg.color !== baseColor) h = '<span style="color: ' + seg.color + '">' + h + "</span>";
          if (seg.b) h = "<b>" + h + "</b>";
          if (seg.u) h = "<u>" + h + "</u>";
          return h;
        }).join("<br>")
      ).join("");
    }
    function applyRichText(node, segs, baseColor) {
      let characters = "";
      const overrides = [];
      const table = {};
      const colorToId = {};
      let nextId = 1;
      for (const seg of segs) {
        let styleId = 0;
        if (seg.color && seg.color !== baseColor) {
          if (!colorToId[seg.color]) {
            const id = nextId++;
            colorToId[seg.color] = id;
            const c = hexToFigma(seg.color);
            table[String(id)] = { fills: [{ type: "SOLID", visible: true, blendMode: "NORMAL", color: c, opacity: 1 }] };
          }
          styleId = colorToId[seg.color];
        }
        for (const ch of seg.text) {
          characters += ch;
          overrides.push(styleId);
        }
      }
      node.characters = characters;
      if (nextId > 1) {
        node.characterStyleOverrides = overrides;
        node.styleOverrideTable = table;
      }
    }
    function imageNode(el, cs) {
      const node = baseNode("image", "RECTANGLE", elBox(el));
      node.fills = [
        {
          type: "IMAGE",
          visible: true,
          blendMode: "NORMAL",
          scaleMode: cs.objectFit === "contain" ? "FIT" : "FILL"
        }
      ];
      applyCorners(node, cs);
      applyOpacity(node, cs);
      if (cs.position === "absolute") node.layoutPositioning = "ABSOLUTE";
      imageUrls.set(node.id, el.currentSrc || el.src);
      return node;
    }
    function applyOpacity(node, cs) {
      const op = parseFloat(cs.opacity);
      if (!isNaN(op) && op < 1) {
        node.opacity = op;
        imageOpacity.set(node.id, op);
      }
    }
    function svgNode(el, cs) {
      const node = baseNode("image", "RECTANGLE", elBox(el));
      node.fills = [{ type: "IMAGE", visible: true, blendMode: "NORMAL", scaleMode: "FIT" }];
      applyOpacity(node, cs);
      if (cs.position === "absolute") node.layoutPositioning = "ABSOLUTE";
      let svg = el.outerHTML.replace(/currentColor/g, cs.color);
      if (!/xmlns=/.test(svg)) svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
      imageUrls.set(node.id, "data:image/svg+xml;base64," + win.btoa(unescape(encodeURIComponent(svg))));
      return node;
    }
    function buttonNode(el, cs) {
      buttonSeq += 1;
      const name = "button " + buttonSeq;
      const node = frameNode(name, elBox(el));
      node.fills = backgroundFills(cs);
      applyCorners(node, cs);
      applyStrokes(node, cs);
      node.effects = shadowEffects(cs);
      const btnRect = el.getBoundingClientRect();
      const range = doc.createRange();
      range.selectNodeContents(el);
      const capRect = range.getBoundingClientRect();
      const padV = Math.max(0, Math.round((btnRect.height - capRect.height) / 2));
      const padH = Math.max(0, Math.round((btnRect.width - capRect.width) / 2));
      node.paddingTop = padV;
      node.paddingBottom = padV;
      node.paddingLeft = padH;
      node.paddingRight = padH;
      if (cs.position === "absolute") node.layoutPositioning = "ABSOLUTE";
      const caption = textNode(el, cs);
      if (capRect.width >= 1 && capRect.height >= 1) {
        const cb = rectBox(capRect);
        caption.absoluteBoundingBox = cb;
        caption.absoluteRenderBounds = cb;
        caption.size = { x: cb.width, y: cb.height };
      }
      node.children = [caption];
      const href = el.getAttribute && el.getAttribute("href");
      if (href && href !== "#") buttonLinks.set(name, href);
      return node;
    }
    function elBox(el) {
      return rectBox(el.getBoundingClientRect());
    }
    function rectBox(r) {
      return {
        x: r.left - bodyRect.left,
        y: r.top - bodyRect.top,
        width: Math.max(1, r.width),
        height: Math.max(1, r.height)
      };
    }
    function applyCorners(node, cs) {
      const tl = num(cs.borderTopLeftRadius);
      const tr = num(cs.borderTopRightRadius);
      const br = num(cs.borderBottomRightRadius);
      const bl = num(cs.borderBottomLeftRadius);
      if (tl || tr || br || bl) {
        if (tl === tr && tr === br && br === bl) node.cornerRadius = tl;
        else node.rectangleCornerRadii = [tl, tr, br, bl];
      }
    }
    function applyStrokes(node, cs) {
      const bw = parseFloat(cs.borderTopWidth);
      if (bw > 0 && cs.borderTopStyle !== "none") {
        const c = cssColorToFigma(cs.borderTopColor);
        if (c) {
          node.strokes = [{ type: "SOLID", visible: true, blendMode: "NORMAL", color: c.color, opacity: c.opacity }];
          node.strokeWeight = bw;
          node.strokeAlign = "INSIDE";
        }
      }
    }
    function solidFills(cssColor) {
      const c = cssColorToFigma(cssColor);
      return c ? [{ type: "SOLID", visible: true, blendMode: "NORMAL", color: c.color, opacity: c.opacity }] : [];
    }
    function backgroundFills(cs) {
      const grad = gradientFill(cs.backgroundImage);
      if (grad) return [grad];
      return solidFills(cs.backgroundColor);
    }
    function gradientFill(backgroundImage) {
      const src = backgroundImage || "";
      const start = src.indexOf("linear-gradient(");
      if (start === -1) return null;
      let depth = 0;
      let inner = null;
      for (let i = start + 16; i < src.length; i++) {
        if (src[i] === "(") depth++;
        else if (src[i] === ")") {
          if (depth === 0) {
            inner = src.slice(start + 16, i);
            break;
          }
          depth--;
        }
      }
      if (!inner) return null;
      const parts = splitTopLevel(inner);
      if (!parts.length) return null;
      let angle = 180;
      if (/^-?[\d.]+deg$/.test(parts[0])) {
        angle = parseFloat(parts.shift());
      } else if (parts[0].startsWith("to ")) {
        const dirs = {
          "top": 0,
          "right": 90,
          "bottom": 180,
          "left": 270,
          "top right": 45,
          "right top": 45,
          "bottom right": 135,
          "right bottom": 135,
          "bottom left": 225,
          "left bottom": 225,
          "top left": 315,
          "left top": 315
        };
        const key = parts.shift().slice(3).trim().replace(/\s+/g, " ");
        angle = key in dirs ? dirs[key] : 180;
      }
      const stops = [];
      for (const p of parts) {
        const cm = /rgba?\([^)]*\)/.exec(p);
        if (!cm) continue;
        const col = cssColorToFigma(cm[0]);
        if (!col) continue;
        const pos = /([\d.]+)%/.exec(p.slice(cm.index + cm[0].length));
        stops.push({ color: { ...col.color, a: col.opacity }, position: pos ? parseFloat(pos[1]) / 100 : null });
      }
      if (stops.length < 2) return null;
      stops.forEach((s, i) => {
        if (s.position === null) s.position = i / (stops.length - 1);
      });
      const rad = angle * Math.PI / 180;
      const d = { x: -Math.sin(rad), y: Math.cos(rad) };
      const p0 = { x: 0.5 - d.x / 2, y: 0.5 - d.y / 2 };
      const p1 = { x: 0.5 + d.x / 2, y: 0.5 + d.y / 2 };
      const p2 = { x: p0.x + d.y / 2, y: p0.y - d.x / 2 };
      return {
        type: "GRADIENT_LINEAR",
        visible: true,
        blendMode: "NORMAL",
        gradientHandlePositions: [p0, p1, p2],
        gradientStops: stops
      };
    }
    function shadowEffects(cs) {
      if (!cs.boxShadow || cs.boxShadow === "none") return [];
      const out = [];
      for (const s of splitTopLevel(cs.boxShadow)) {
        if (s.includes("inset")) continue;
        const cm = /rgba?\([^)]*\)/.exec(s);
        if (!cm) continue;
        const col = cssColorToFigma(cm[0]);
        if (!col) continue;
        const nums = (s.slice(0, cm.index) + s.slice(cm.index + cm[0].length)).trim().split(/\s+/).map(parseFloat).filter((n) => !isNaN(n));
        out.push({
          type: "DROP_SHADOW",
          visible: true,
          blendMode: "NORMAL",
          color: { ...col.color, a: col.opacity },
          offset: { x: nums[0] || 0, y: nums[1] || 0 },
          radius: nums[2] || 0,
          spread: nums[3] || 0,
          showShadowBehindNode: true
        });
      }
      return out;
    }
    function splitTopLevel(s) {
      const out = [];
      let depth = 0;
      let cur = "";
      for (const ch of s) {
        if (ch === "(") depth++;
        if (ch === ")") depth--;
        if (ch === "," && depth === 0) {
          out.push(cur.trim());
          cur = "";
          continue;
        }
        cur += ch;
      }
      if (cur.trim()) out.push(cur.trim());
      return out;
    }
    function cssColorToFigma(color) {
      const m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\s*\)/.exec(color || "");
      if (!m) return null;
      const opacity = m[4] === void 0 ? 1 : parseFloat(m[4]);
      if (opacity === 0) return null;
      return {
        color: { r: +m[1] / 255, g: +m[2] / 255, b: +m[3] / 255, a: 1 },
        opacity
      };
    }
    function rgbToHex(color) {
      const m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(color || "");
      if (!m) return null;
      return "#" + [m[1], m[2], m[3]].map((n) => (+n).toString(16).padStart(2, "0")).join("");
    }
    function hexToFigma(hex) {
      const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || "");
      if (!m) return { r: 0, g: 0, b: 0, a: 1 };
      return { r: parseInt(m[1], 16) / 255, g: parseInt(m[2], 16) / 255, b: parseInt(m[3], 16) / 255, a: 1 };
    }
    function mapJustify(v) {
      if (v === "center") return "CENTER";
      if (v === "flex-end" || v === "end") return "MAX";
      if (v === "space-between" || v === "space-around" || v === "space-evenly") return "SPACE_BETWEEN";
      return "MIN";
    }
    function mapAlign(v) {
      if (v === "center") return "CENTER";
      if (v === "flex-end" || v === "end") return "MAX";
      return "MIN";
    }
    function mapTextAlign(v) {
      if (v === "center") return "CENTER";
      if (v === "right" || v === "end") return "RIGHT";
      if (v === "justify") return "JUSTIFIED";
      return "LEFT";
    }
    function num(v) {
      return Math.round(parseFloat(v) || 0);
    }
    function firstFont(fontFamily) {
      return (fontFamily || "").split(",")[0].trim().replace(/^["']|["']$/g, "") || "Arial";
    }
  }
  function isTextLeaf(el, win) {
    if (!el.innerText || !el.innerText.trim()) return false;
    if (win && /flex|grid/.test(win.getComputedStyle(el).display)) return false;
    return [...el.querySelectorAll("*")].every((c) => {
      if (c.tagName === "IMG" || c.tagName.toUpperCase() === "SVG") return false;
      if (!win) return true;
      const cs = win.getComputedStyle(c);
      if (c.tagName === "A" && isButtonLike(c, cs)) return false;
      if (isStyledBox(cs)) return false;
      return true;
    });
  }
  function isButtonLike(el, cs) {
    if (el.tagName !== "A" && el.tagName !== "BUTTON") return false;
    if (!el.innerText || !el.innerText.trim()) return false;
    const hasBg = /rgba?\(/.test(cs.backgroundColor) && !/rgba?\([^)]*[,\s/]0\s*\)$/.test(cs.backgroundColor);
    const hasBorder = parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none";
    return hasBg || hasBorder;
  }
  function isStyledBox(cs) {
    const hasBg = /rgba?\(/.test(cs.backgroundColor) && !/rgba?\([^)]*[,\s/]0\s*\)$/.test(cs.backgroundColor);
    const hasBorder = parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none";
    const hasShadow = cs.boxShadow && cs.boxShadow !== "none";
    return hasBg || hasBorder || hasShadow;
  }

  // src/actionicons.js
  var ICONS2 = {
    // Copy (дублировать)
    dupl: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
    // Delete (корзина, Feather "trash-2" без внутренних линий)
    del: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    // Lock (замок)
    lock: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    // Group (два элемента в пунктирной рамке-группе)
    group: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="3" stroke-dasharray="4 3"/><rect x="6.5" y="6.5" width="6" height="6" rx="1"/><rect x="11.5" y="11.5" width="6" height="6" rx="1"/></svg>`,
    // Ungroup (элементы разъезжаются, рамка «разорвана»)
    ungroup: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/><line x1="16" y1="8" x2="19" y2="5"/><line x1="8" y1="16" x2="5" y2="19"/></svg>`,
    // File: Delete (та же корзина, что и у Actions)
    "file-del": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    // File: Edit (карандаш)
    "file-edit": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>`,
    // File: Original size (стрелки врозь по диагонали — «развернуть»)
    "file-reset": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
    // File: to Vector (перо)
    "file-vector": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`
  };
  function maskUrl(svg) {
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }
  var BUTTON_CLASS = {
    "file-del": "sui-file-del",
    "file-edit": "sui-file-edit",
    "file-reset": "sui-file-reset",
    "file-vector": "sui-file-to-vector"
  };
  function injectZeroActionIconStyles() {
    if (document.getElementById("th-action-icons-style")) return;
    const style = document.createElement("style");
    style.id = "th-action-icons-style";
    const perButton = Object.entries(ICONS2).map(([name, svg]) => {
      const cls = BUTTON_CLASS[name] || `sui-btn-${name}`;
      return `
    .${cls}::before {
      -webkit-mask-image: ${maskUrl(svg)};
      mask-image: ${maskUrl(svg)};
    }`;
    }).join("\n");
    style.textContent = `
    .sui-element-action-section .sui-btn,
    .sui-file-buttons-container .sui-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    /* Copy/Delete/Lock \u0438 \u0432\u0441\u0435 \u043A\u043D\u043E\u043F\u043A\u0438 File \u2014 \u0433\u0430\u0441\u0438\u043C \u0442\u0435\u043A\u0441\u0442\u043E\u0432\u044B\u0439 \u043B\u0435\u0439\u0431\u043B, \u043E\u0441\u0442\u0430\u0432\u043B\u044F\u044F
       \u0442\u043E\u043B\u044C\u043A\u043E \u0438\u043A\u043E\u043D\u043A\u0443. */
    .sui-element-action-section .sui-btn-dupl,
    .sui-element-action-section .sui-btn-del,
    .sui-element-action-section .sui-btn-lock,
    .sui-file-buttons-container .sui-btn {
      font-size: 0 !important;
      line-height: 0 !important;
    }
    /* Group/Ungroup \u2014 \u0438\u043A\u043E\u043D\u043A\u0430 \u0441\u043B\u0435\u0432\u0430 \u043E\u0442 \u0442\u0435\u043A\u0441\u0442\u0430. */
    .sui-element-action-section .sui-btn-group,
    .sui-element-action-section .sui-btn-ungroup {
      gap: 6px;
    }
    .sui-element-action-section .sui-btn::before,
    .sui-file-buttons-container .sui-btn::before {
      content: '';
      display: block;
      width: 15px;
      height: 15px;
      flex: 0 0 auto;
      background-color: currentColor;
      -webkit-mask-repeat: no-repeat;
      mask-repeat: no-repeat;
      -webkit-mask-position: center;
      mask-position: center;
      -webkit-mask-size: contain;
      mask-size: contain;
    }
    ${perButton}
  `;
    (document.head || document.documentElement).appendChild(style);
  }

  // src/components.js
  var BLOCK_START = "<!--TildaHelperComponents-->";
  var BLOCK_END = "<!--/TildaHelperComponents-->";
  var DATA_ID2 = "th-components-data";
  var STYLE_ID = "th-components-style";
  var BTN_ID = "th-comp-btn";
  var PURPLE = "#7c4dff";
  var SKIP_ALWAYS = /* @__PURE__ */ new Set(["classname", "groupid", "name"]);
  var SKIP_ROOT = /* @__PURE__ */ new Set([
    "top",
    "left",
    "topunits",
    "leftunits",
    "toptunits",
    "zindex",
    "lock",
    "container",
    "axisx",
    "axisy",
    "flexorder",
    "absolute",
    "margin",
    "flexalignself",
    "flexgrow",
    "flexshrink",
    "flexbasis",
    "flexbasisvalue"
  ]);
  var CID_RE = /(?:^|\s)th-comp-([a-z0-9]+)(?=\s|$)/;
  var INST_RE = /(?:^|\s)th-inst-([a-z0-9]+)(?=\s|$)/;
  var REV_RE = /(?:^|\s)th-rev-(\d+)(?=\s|$)/;
  var NODE_RE = /(?:^|\s)th-node-([a-z0-9]+)(?=\s|$)/;
  var state = {
    data: null,
    // { v:1, comps: { cid: def } } — реестр из head-кода
    loaded: false,
    loadError: null,
    saveTimer: 0,
    saving: false,
    dirty: false
  };
  function emptyData() {
    return { v: 1, comps: {} };
  }
  function uid() {
    return (Date.now().toString(36) + Math.random().toString(36).slice(2, 6)).toLowerCase();
  }
  function getProjectId2() {
    return new URLSearchParams(location.search).get("projectid") || String(window.projectid || "");
  }
  function getCsrf() {
    if (typeof window.csrf === "string" && window.csrf) return window.csrf;
    const m = document.getElementById("csrf");
    return m && m.getAttribute("content") || "";
  }
  function decodeEntities(s) {
    if (!s || s.indexOf("&") === -1) return s || "";
    const ta = document.createElement("textarea");
    ta.innerHTML = s;
    return ta.value;
  }
  async function apiPost(path, params) {
    const r = await fetch(path, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest"
      },
      body: new URLSearchParams({ ...params, csrf: getCsrf() })
    });
    if (!r.ok) throw new Error("HTTP " + r.status + " (" + path + ")");
    return (await r.text()).replace(/^\s*(?:<!--[\s\S]*?-->\s*)+/, "");
  }
  async function readHeadCode() {
    const txt = await apiPost("/projects/get/getheadcode/", {
      comm: "getheadcode",
      projectid: getProjectId2()
    });
    const j = JSON.parse(txt);
    if (!j || !j.project) throw new Error("getheadcode: \u043D\u0435\u043E\u0436\u0438\u0434\u0430\u043D\u043D\u044B\u0439 \u043E\u0442\u0432\u0435\u0442 " + txt.slice(0, 120));
    return decodeEntities(j.project.headcode || "");
  }
  async function writeHeadCode(headcode) {
    const res = (await apiPost("/projects/submit/", {
      comm: "editprojectheadcode",
      projectid: getProjectId2(),
      headcode
    })).trim();
    if (res !== "OK") throw new Error("Tilda \u043E\u0442\u0432\u0435\u0442\u0438\u043B\u0430: " + res.slice(0, 200));
  }
  function extractBlock(headcode) {
    const s = headcode.indexOf(BLOCK_START);
    if (s === -1) return null;
    const e = headcode.indexOf(BLOCK_END, s);
    if (e === -1) return null;
    return { start: s, end: e + BLOCK_END.length, text: headcode.slice(s, e + BLOCK_END.length) };
  }
  function parseFromHead(headcode) {
    const block = extractBlock(headcode);
    if (!block) return null;
    const m = block.text.match(
      new RegExp('<script type="application/json" id="' + DATA_ID2 + '">([\\s\\S]*?)<\/script>')
    );
    if (!m) return null;
    try {
      return JSON.parse(m[1]);
    } catch (e) {
      return null;
    }
  }
  function buildHeadBlock(data) {
    return BLOCK_START + '\n<script type="application/json" id="' + DATA_ID2 + '">' + JSON.stringify(data) + "<\/script>\n" + BLOCK_END;
  }
  function stripAllBlocks(headcode) {
    let out = headcode;
    let block;
    while (block = extractBlock(out)) {
      out = out.slice(0, block.start) + out.slice(block.end);
    }
    return out;
  }
  function headWithData(headcode, data) {
    const isEmpty = !data || !Object.keys(data.comps).length;
    const block = extractBlock(headcode);
    if (isEmpty) {
      const out = stripAllBlocks(headcode);
      return out.trim() ? out.replace(/\n{3,}/g, "\n\n") : "";
    }
    const fresh = buildHeadBlock(data);
    if (!block) return headcode + (headcode.trim() ? "\n" : "") + fresh;
    const rest = stripAllBlocks(headcode);
    return rest.slice(0, block.start) + fresh + rest.slice(block.start);
  }
  function scheduleSave() {
    state.dirty = true;
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(flushSave, 2500);
  }
  async function flushSave() {
    if (state.saving || !state.dirty) return;
    state.saving = true;
    state.dirty = false;
    try {
      const head = await readHeadCode();
      await writeHeadCode(headWithData(head, state.data));
    } catch (e) {
      state.dirty = true;
      console.warn("[Tilda Helper] \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u044B: \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0440\u0435\u0435\u0441\u0442\u0440:", e);
    } finally {
      state.saving = false;
      if (state.dirty) scheduleSave();
    }
  }
  function getClassname(el) {
    return el.getAttribute("data-field-classname-value") || "";
  }
  function setClassname(el, next) {
    const clean = next.replace(/\s+/g, " ").trim();
    window.elem__setFieldValue(el, "classname", clean, "render");
  }
  function addClass(el, cls) {
    const cur = getClassname(el);
    if ((" " + cur + " ").includes(" " + cls + " ")) return;
    setClassname(el, cur + " " + cls);
  }
  function snapshotFields(el, isRoot) {
    const out = {};
    for (const a of el.attributes) {
      const m = a.name.match(/^data-field-(.+)-value$/);
      if (!m) continue;
      const full = m[1];
      const base = baseField(full);
      if (SKIP_ALWAYS.has(base)) continue;
      if (isRoot && SKIP_ROOT.has(base)) continue;
      out[full] = a.value;
    }
    return out;
  }
  function baseField(full) {
    return full.replace(/-res-\d+$/, "");
  }
  function resOf(full) {
    const m = full.match(/-res-(\d+)$/);
    return m ? parseInt(m[1], 10) : 0;
  }
  function getText(el) {
    if (el.getAttribute("data-elem-type") !== "text") return void 0;
    const atom = el.querySelector(".tn-atom");
    return atom ? atom.innerHTML : void 0;
  }
  function setText(el, html) {
    window.elem__setFieldValue(el, "text", html, "render");
    const atom = el.querySelector(".tn-atom");
    if (atom && atom.innerHTML !== html) atom.innerHTML = html;
  }
  function applyField(el, full, value) {
    const base = baseField(full);
    const fieldsAttr = el.getAttribute("data-fields");
    if (fieldsAttr && !fieldsAttr.split(",").includes(base)) return;
    const top = window.tn && window.tn.topResolution || 1200;
    const res = resOf(full) || top;
    window.elem__setFieldValue(el, base, value, "render", void 0, res, top);
  }
  function descendants(rootEl) {
    return [...rootEl.querySelectorAll(".tn-elem, .tn-group")];
  }
  function nodeKeyOf(el) {
    const m = getClassname(el).match(NODE_RE);
    return m ? m[1] : null;
  }
  function findInstanceNode(instRoot, key) {
    for (const el of descendants(instRoot)) {
      if (nodeKeyOf(el) === key) return el;
    }
    return null;
  }
  function snapshotTree(rootEl, ensureKeys) {
    const nodes = {};
    nodes.root = {
      type: rootEl.getAttribute("data-elem-type") || "group",
      parent: null,
      fields: snapshotFields(rootEl, true),
      text: getText(rootEl)
    };
    for (const el of descendants(rootEl)) {
      let key = nodeKeyOf(el);
      if (!key) {
        if (!ensureKeys) continue;
        key = uid();
        addClass(el, "th-node-" + key);
      }
      const parentEl = el.parentElement && el.parentElement.closest(".tn-elem, .tn-group");
      const parentKey = parentEl && rootEl.contains(parentEl) && parentEl !== rootEl ? nodeKeyOf(parentEl) : "root";
      nodes[key] = {
        type: el.getAttribute("data-elem-type") || "group",
        parent: parentKey || "root",
        fields: snapshotFields(el),
        text: getText(el)
      };
    }
    return nodes;
  }
  function fieldsEqual(a, b) {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (const k of ka) if (a[k] !== b[k]) return false;
    return true;
  }
  function nodesEqual(a, b) {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (const k of ka) {
      const x = a[k];
      const y = b[k];
      if (!y || x.type !== y.type || x.parent !== y.parent || x.text !== y.text) return false;
      if (!fieldsEqual(x.fields, y.fields)) return false;
    }
    return true;
  }
  function currentRecordId() {
    return new URLSearchParams(location.search).get("recordid") || "";
  }
  function findRoots() {
    const mains = [];
    const insts = [];
    for (const el of document.querySelectorAll(".tn-elem, .tn-group")) {
      const cls = getClassname(el);
      let m = cls.match(CID_RE);
      if (m) mains.push({ el, cid: m[1] });
      m = cls.match(INST_RE);
      if (m) insts.push({ el, cid: m[1] });
    }
    return { mains, insts };
  }
  function instRev(el) {
    const m = getClassname(el).match(REV_RE);
    return m ? parseInt(m[1], 10) : -1;
  }
  function setInstRev(el, rev) {
    const cur = getClassname(el);
    let next;
    if (REV_RE.test(cur)) next = cur.replace(REV_RE, " th-rev-" + rev);
    else next = cur + " th-rev-" + rev;
    setClassname(el, next);
  }
  function overridesOf(el) {
    const out = /* @__PURE__ */ new Set();
    const re = /(?:^|\s)th-ovr-([a-z0-9_-]+)(?=\s|$)/g;
    let m;
    const cls = getClassname(el);
    while (m = re.exec(cls)) out.add(m[1]);
    return out;
  }
  function convertToInstance(el, cid, rev) {
    const cur = getClassname(el).replace(CID_RE, " ").replace(INST_RE, " ").replace(REV_RE, " ");
    setClassname(el, cur + " th-inst-" + cid + " th-rev-" + rev);
  }
  function detachSubtree(rootEl) {
    const strip = (el) => {
      const next = getClassname(el).split(/\s+/).filter((c) => c && !/^th-(comp|inst|rev|node|ovr)-/.test(c)).join(" ");
      if (next !== getClassname(el)) setClassname(el, next);
    };
    strip(rootEl);
    for (const el of descendants(rootEl)) strip(el);
  }
  function applyDefToInstance(def, instRoot) {
    const applyNode = (defNode, el, isRoot) => {
      const ovr = overridesOf(el);
      for (const [full, value] of Object.entries(defNode.fields)) {
        const base = baseField(full);
        if (SKIP_ALWAYS.has(base)) continue;
        if (isRoot && SKIP_ROOT.has(base)) continue;
        if (ovr.has(full) || ovr.has(base)) continue;
        const cur = el.getAttribute("data-field-" + full + "-value");
        if (cur === value) continue;
        applyField(el, full, value);
      }
      if (defNode.text !== void 0 && !ovr.has("text")) {
        const cur = getText(el);
        if (cur !== void 0 && cur !== defNode.text) setText(el, defNode.text);
      }
    };
    applyNode(def.nodes.root, instRoot, true);
    for (const [key, defNode] of Object.entries(def.nodes)) {
      if (key === "root") continue;
      const el = findInstanceNode(instRoot, key);
      if (!el) continue;
      applyNode(defNode, el, false);
    }
  }
  function detectOverrides(def, instRoot) {
    const checkNode = (defNode, el, isRoot) => {
      const ovr = overridesOf(el);
      const cur = snapshotFields(el, isRoot);
      for (const [full, value] of Object.entries(defNode.fields)) {
        const base = baseField(full);
        if (SKIP_ALWAYS.has(base)) continue;
        if (isRoot && SKIP_ROOT.has(base)) continue;
        if (ovr.has(full) || ovr.has(base)) continue;
        if (cur[full] !== void 0 && cur[full] !== value) {
          addClass(el, "th-ovr-" + full);
        }
      }
      if (defNode.text !== void 0 && !ovr.has("text")) {
        const t = getText(el);
        if (t !== void 0 && t !== defNode.text) addClass(el, "th-ovr-text");
      }
    };
    checkNode(def.nodes.root, instRoot, true);
    for (const [key, defNode] of Object.entries(def.nodes)) {
      if (key === "root") continue;
      const el = findInstanceNode(instRoot, key);
      if (el) checkNode(defNode, el, false);
    }
  }
  function updateZeroComponents() {
    if (!state.loaded || !window.elem__setFieldValue) return;
    const data = state.data;
    const record = currentRecordId();
    const { mains, insts } = findRoots();
    for (const { el, cid } of mains) {
      const def = data.comps[cid];
      if (!def) continue;
      if (el.id === def.mainId) continue;
      const mainStillHere = mains.some((m) => m.cid === cid && m.el.id === def.mainId);
      if (!mainStillHere && def.record === record) {
        def.mainId = el.id;
        scheduleSave();
      } else {
        convertToInstance(el, cid, def.rev);
        insts.push({ el, cid });
      }
    }
    for (const { el, cid } of mains) {
      const def = data.comps[cid];
      if (!def || el.id !== def.mainId) continue;
      const nodes = snapshotTree(el, true);
      if (!nodesEqual(nodes, def.nodes)) {
        def.nodes = nodes;
        def.rev += 1;
        def.record = record;
        def.name = el.getAttribute("data-field-name-value") || def.name;
        scheduleSave();
      }
    }
    for (const { el, cid } of insts) {
      const def = data.comps[cid];
      if (!def) continue;
      const rev = instRev(el);
      if (rev < def.rev) {
        applyDefToInstance(def, el);
        setInstRev(el, def.rev);
      } else {
        detectOverrides(def, el);
      }
    }
    updateToolbarButton();
  }
  function selectedRoot() {
    const sel = document.querySelectorAll(
      ".tn-elem__selected:not(.tn-group__selected .tn-elem__selected), .tn-group__selected"
    );
    const roots = [...sel].filter((el) => {
      const p = el.parentElement && el.parentElement.closest(".tn-elem__selected, .tn-group__selected");
      return !p;
    });
    return roots.length === 1 ? roots[0] : null;
  }
  function notice(text) {
    if (typeof window.td__showBubbleNotice === "function") window.td__showBubbleNotice(text);
    else console.log("[Tilda Helper] " + text);
  }
  function createComponent(rootEl) {
    const cid = uid();
    const nodes = snapshotTree(rootEl, true);
    state.data.comps[cid] = {
      name: rootEl.getAttribute("data-field-name-value") || "\u041A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442",
      rev: 0,
      mainId: rootEl.id,
      record: currentRecordId(),
      nodes
    };
    addClass(rootEl, "th-comp-" + cid);
    scheduleSave();
    notice("\u0421\u043E\u0437\u0434\u0430\u043D \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442. \u041A\u043E\u043F\u0438\u0438 (Cmd/Ctrl+C \u2192 V) \u0441\u0442\u0430\u043D\u0443\u0442 \u0438\u043D\u0441\u0442\u0430\u043D\u0441\u0430\u043C\u0438.");
  }
  function onButtonClick(e) {
    const rootEl = selectedRoot();
    if (!rootEl) {
      notice("\u0412\u044B\u0434\u0435\u043B\u0438\u0442\u0435 \u043E\u0434\u0438\u043D \u044D\u043B\u0435\u043C\u0435\u043D\u0442 \u0438\u043B\u0438 \u0433\u0440\u0443\u043F\u043F\u0443.");
      return;
    }
    const cls = getClassname(rootEl);
    const asMain = cls.match(CID_RE);
    const asInst = cls.match(INST_RE);
    if (asMain) {
      if (e.altKey) {
        delete state.data.comps[asMain[1]];
        detachSubtree(rootEl);
        scheduleSave();
        notice("\u041A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442 \u0440\u0430\u0441\u0444\u043E\u0440\u043C\u0438\u0440\u043E\u0432\u0430\u043D. \u0418\u043D\u0441\u0442\u0430\u043D\u0441\u044B \u043E\u0442\u0432\u044F\u0436\u0443\u0442\u0441\u044F \u043F\u0440\u0438 \u043E\u0442\u043A\u0440\u044B\u0442\u0438\u0438 \u0441\u0432\u043E\u0438\u0445 \u0431\u043B\u043E\u043A\u043E\u0432.");
      } else {
        notice("\u042D\u0442\u043E \u0433\u043B\u0430\u0432\u043D\u044B\u0439 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442. Alt+\u043A\u043B\u0438\u043A \u2014 \u0440\u0430\u0441\u0444\u043E\u0440\u043C\u0438\u0440\u043E\u0432\u0430\u0442\u044C.");
      }
      return;
    }
    if (asInst) {
      detachSubtree(rootEl);
      notice("\u0418\u043D\u0441\u0442\u0430\u043D\u0441 \u043E\u0442\u0432\u044F\u0437\u0430\u043D \u043E\u0442 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u0430.");
      return;
    }
    if (nodeKeyOf(rootEl)) {
      notice("\u042D\u0442\u043E \u0447\u0430\u0441\u0442\u044C \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u0430 \u2014 \u0432\u044B\u0434\u0435\u043B\u0438\u0442\u0435 \u0435\u0433\u043E \u043A\u043E\u0440\u0435\u043D\u044C.");
      return;
    }
    createComponent(rootEl);
  }
  var DIAMOND_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none"><rect x="15" y="6.4" width="5.4" height="5.4" transform="rotate(45 15 6.4)" stroke="currentColor" stroke-width="1.3"/><rect x="10.2" y="11.2" width="5.4" height="5.4" transform="rotate(45 10.2 11.2)" stroke="currentColor" stroke-width="1.3"/><rect x="19.8" y="11.2" width="5.4" height="5.4" transform="rotate(45 19.8 11.2)" stroke="currentColor" stroke-width="1.3"/><rect x="15" y="16" width="5.4" height="5.4" transform="rotate(45 15 16)" stroke="currentColor" stroke-width="1.3"/></svg>';
  function injectComponentStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
    /* \u0424\u0438\u043E\u043B\u0435\u0442\u043E\u0432\u0430\u044F \u0440\u0430\u043C\u043A\u0430 \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u044F \u0443 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u043E\u0432 \u0438 \u0438\u043D\u0441\u0442\u0430\u043D\u0441\u043E\u0432 (\u0432\u043C\u0435\u0441\u0442\u043E \u0441\u0438\u043D\u0435\u0439). */
    .tn-elem__selected[data-field-classname-value*="th-comp-"],
    .tn-elem__selected[data-field-classname-value*="th-inst-"],
    .tn-elem__selected[data-field-classname-value*="th-node-"] {
      box-shadow: 0 0 0 var(--tn-outline-width, 1px) ${PURPLE} inset !important;
    }
    .tn-group__selected[data-field-classname-value*="th-comp-"]:not(.tn-group__on-resize)::after,
    .tn-group__selected[data-field-classname-value*="th-inst-"]:not(.tn-group__on-resize)::after,
    .tn-group__selected[data-field-classname-value*="th-node-"]:not(.tn-group__on-resize)::after {
      box-shadow: 0 0 0 var(--tn-outline-width, 1px) ${PURPLE} inset !important;
    }
    /* \u041A\u043D\u043E\u043F\u043A\u0430 \u0432 \u043D\u0438\u0436\u043D\u0435\u0439 \u043F\u0430\u043D\u0435\u043B\u0438. */
    #${BTN_ID} { color: inherit; }
    #${BTN_ID}.th-comp-btn_active { color: ${PURPLE}; }
    #${BTN_ID}.th-comp-btn_hidden { display: none; }
  `;
    document.head.appendChild(style);
  }
  function updateToolbarButton() {
    const bar = document.querySelector(".tn-toolbar__content-block");
    if (!bar) return;
    let btn = document.getElementById(BTN_ID);
    if (!btn) {
      btn = document.createElement("div");
      btn.id = BTN_ID;
      btn.className = "tn-toolbar__content-icon-wrapper";
      btn.title = "\u041A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442: \u0441\u043E\u0437\u0434\u0430\u0442\u044C / \u0438\u043D\u0441\u0442\u0430\u043D\u0441 \u2014 \u043E\u0442\u0432\u044F\u0437\u0430\u0442\u044C (Alt+\u043A\u043B\u0438\u043A \u043F\u043E main \u2014 \u0440\u0430\u0441\u0444\u043E\u0440\u043C\u0438\u0440\u043E\u0432\u0430\u0442\u044C)";
      btn.innerHTML = '<div class="tn-toolbar__content-icon">' + DIAMOND_SVG + "</div>";
      btn.addEventListener("click", onButtonClick);
      if (bar.lastElementChild) {
        bar.insertBefore(btn, bar.lastElementChild);
      } else {
        bar.appendChild(btn);
      }
    }
    const rootEl = selectedRoot();
    btn.classList.toggle("th-comp-btn_hidden", !rootEl);
    if (rootEl) {
      const cls = getClassname(rootEl);
      btn.classList.toggle(
        "th-comp-btn_active",
        CID_RE.test(cls) || INST_RE.test(cls)
      );
    }
  }
  function initZeroComponents() {
    injectComponentStyles();
    (async () => {
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const head = await readHeadCode();
          state.data = parseFromHead(head) || emptyData();
          if (!state.data.comps) state.data.comps = {};
          state.loaded = true;
          return;
        } catch (e) {
          state.loadError = e;
          await new Promise((res) => setTimeout(res, 1500 * (attempt + 1)));
        }
      }
      console.warn("[Tilda Helper] \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u044B: \u0440\u0435\u0435\u0441\u0442\u0440 \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u043B\u0441\u044F, \u0444\u0438\u0447\u0430 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u0430:", state.loadError);
    })();
  }

  // src/index.js
  var brokenFeatures = /* @__PURE__ */ new Set();
  function safe(name, fn) {
    try {
      fn();
    } catch (e) {
      if (brokenFeatures.has(name)) return;
      brokenFeatures.add(name);
      console.warn(`[Tilda Helper] \u0441\u043B\u043E\u043C\u0430\u043B\u0430\u0441\u044C \u0444\u0438\u0447\u0430 \xAB${name}\xBB (\u0434\u0430\u043B\u044C\u043D\u0435\u0439\u0448\u0438\u0435 \u043E\u0448\u0438\u0431\u043A\u0438 \u044D\u0442\u043E\u0439 \u0444\u0438\u0447\u0438 \u043D\u0435 \u043B\u043E\u0433\u0438\u0440\u0443\u044E\u0442\u0441\u044F):`, e);
    }
  }
  function tick() {
    safe("\u0431\u0435\u0439\u0434\u0436\u0438 \u0431\u043B\u043E\u043A\u043E\u0432", updateBadges);
    safe("\u0432\u0435\u0440\u0445\u043D\u044F\u044F \u043F\u0430\u043D\u0435\u043B\u044C", updateTopToolbar);
    safe("\u043C\u0443\u043B\u044C\u0442\u0438\u043F\u0440\u0435\u0432\u044C\u044E: \u043A\u043D\u043E\u043F\u043A\u0430", injectMultiPreviewButton);
    safe("z-index: live-\u043F\u0440\u0435\u0432\u044C\u044E CSS", () => applyLiveCssPreview(getEffectiveZIndexMap()));
    safe("z-index: \u043F\u043E\u043B\u0435 \u0441\u0430\u0439\u0434\u0431\u0430\u0440\u0430", updateZIndexSidebarField);
    safe("\u0430\u0442\u0440\u0438\u0431\u0443\u0442\u044B: live-\u043F\u0440\u0435\u0432\u044C\u044E", () => applyLiveAttrPreview(getEffectiveAttrMap()));
    safe("\u0430\u0442\u0440\u0438\u0431\u0443\u0442\u044B: \u043F\u043E\u043B\u0435 \u0441\u0430\u0439\u0434\u0431\u0430\u0440\u0430", updateAttributeSidebarField);
    safe("\u0441\u043A\u0440\u044B\u0442\u0438\u0435 \u043F\u043E\u043B\u0435\u0439 \u0441\u0430\u0439\u0434\u0431\u0430\u0440\u0430", updateHiddenSidebarFields);
    safe("T123: \u043A\u043D\u043E\u043F\u043A\u0430 \xAB\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C\xBB", updateT123CopyButtons);
    safe("\u043F\u043E\u043F\u0430\u043F\u044B: \u043A\u043D\u043E\u043F\u043A\u0430 \u043E\u0442\u043A\u0440\u044B\u0442\u0438\u044F", updatePopupOpenButtons);
    safe("\u044F\u043A\u043E\u0440\u044F: \u043A\u043D\u043E\u043F\u043A\u0430 \u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F", updateAnchorCopyButtons);
    safe("\u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430: \u043F\u043E\u0440\u044F\u0434\u043E\u043A \u0431\u043B\u043E\u043A\u043E\u0432", updateLibraryOrder);
    safe("\u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430: \u0440\u0430\u0441\u043A\u0440\u044B\u0442\u0438\u0435", updateLibraryExpanded);
    safe("\u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430: \u0440\u0430\u0437\u0434\u0435\u043B FAQ", updateLibraryFaqSection);
    safe("z-index: \u043F\u0430\u0442\u0447 \u0441\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0438", ensureReorderPatched);
    safe("z-index: \u043F\u043E\u0440\u044F\u0434\u043E\u043A carrier\u2019\u043E\u0432", reorderMisplacedCarriers);
    safe("HTML\u2192Zero: \u043A\u043D\u043E\u043F\u043A\u0430", injectZeroImportButton);
    safe("\u043A\u0440\u043E\u0448\u043A\u0438 \u043F\u0430\u043F\u043A\u0438 \u0432 \u0448\u0430\u043F\u043A\u0435", updateFolderBreadcrumbs);
    safe("\u043A\u0440\u043E\u0448\u043A\u0438 \u0432 \u0448\u0430\u043F\u043A\u0435", updateEditorBreadcrumbs);
    safe("zero: \u0442\u0443\u043C\u0431\u043B\u0435\u0440 Scale Grid Container", runUpscaleToggle);
  }
  function main() {
    if (location.hostname.endsWith(".tilda.ws")) {
      if (isMultiPreviewTarget()) buildMultiPreviewOverlay();
      return;
    }
    if (location.pathname.startsWith("/projects/")) {
      safe("\u0441\u0442\u0438\u043B\u0438", injectStyles);
      safe("powermode", initProjectsPowerMode);
      safe("\u0438\u0435\u0440\u0430\u0440\u0445\u0438\u044F \u043F\u0430\u043F\u043E\u043A", initFolderHierarchy);
      safe("\u0438\u0435\u0440\u0430\u0440\u0445\u0438\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446", initPageHierarchy);
      safe("Friday37: \u043C\u0430\u0441\u0441\u043E\u0432\u043E\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0441\u0442\u0440\u0430\u043D\u0438\u0446 (\u0432\u0440\u0435\u043C.)", initFriday37PageBatch);
      return;
    }
    if (location.pathname.startsWith("/zero/")) {
      safe("zero: \u0438\u043A\u043E\u043D\u043A\u0438 \u043A\u043D\u043E\u043F\u043E\u043A Actions", injectZeroActionIconStyles);
      setInterval(() => safe("zero: \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0437\u0430\u0446\u0438\u0438", runZeroBlockAutomations), 700);
      safe("zero: \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0437\u0430\u0446\u0438\u0438", runZeroBlockAutomations);
      safe("zero: \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u044B: \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F", initZeroComponents);
      setInterval(() => {
        safe("zero: \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u044B", updateZeroComponents);
        safe("zero: \u0432\u044B\u0440\u0430\u0432\u043D\u0438\u0432\u0430\u043D\u0438\u0435 absolute", runZeroConstraints);
        safe("zero: \u0442\u0443\u043C\u0431\u043B\u0435\u0440 Scale Grid Container", runUpscaleToggle);
        safe("zero: \u0441\u0438\u043D\u043A z-index \u0432 /page/", syncZeroZIndexToParent);
      }, 700);
      return;
    }
    safe("\u0441\u0442\u0438\u043B\u0438", injectStyles);
    safe("treelist-\u0438\u0435\u0440\u0430\u0440\u0445\u0438\u044F", initTreelistHierarchy);
    safe("\u043A\u0440\u043E\u0448\u043A\u0438: \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F", initEditorBreadcrumbs);
    setInterval(tick, 700);
    tick();
  }
  main();
})();
