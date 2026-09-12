# Taptop Helper — Chrome Extension (Manifest V3)

Расширение-помощник для редактора сайтов Taptop. **Две функции в одном расширении.**

## ⚠️ Главное: рабочая папка

**Актуальная папка — `taptop-helper/`. Грузить в Chrome ТОЛЬКО её.**

Старые папки оставлены как бэкап, в Chrome НЕ подключать (конфликт content scripts):
- `multidelete-layers/` — старое расширение слоёв
- `auto-publish-all-pages/` — старый Публикатор

## Функции

### 1. Слои (`content.js`, работает в `world: MAIN`)
- **Cmd+Click** — мультивыбор слоёв в панели Layers (подсветка красным)
- **Cmd+C** — копировать выделенные слои во внутренний буфер `multiClipboard`
- **Cmd+V** — вставить все слои из буфера на текущую страницу (буфер переживает SPA-навигацию между страницами)
- **Delete/Backspace** — удалить выделенные слои
- **Escape** — снять выделение / очистить буфер

### 2. Автопубликация всех страниц
- **Кнопка «Опубликовать всё» встроена в шапку редактора** (content.js, слева от родной «Опубликовать»). Встраивается через `injectPublishButton()` + `setInterval(1000)` (шапка пересоздаётся при SPA-навигации).
- Также есть кнопка «Опубликовать все страницы» в popup (инжектит `startTaptopPublisher`).
- Родная кнопка публикации зависит от режима: `.tt-design-mode-publish` или `.tt-client-mode-publish` — искать через оба селектора (`findPublishButton()`).
- Логика: открыть модалку → кликать `.tt-publish-design-list__item button.tt-button--appearance-primary` по очереди → ждать статус `.tt-header__status use[xlink:href*="large-navbar-saved"]` → закрыть `.tt-popup__close-button`.

## Критичные технические факты (НЕ сломать)

1. **`"world": "MAIN"` в manifest обязателен** — иначе `window.rspackChunktaptop_design_editor` недоступен (он в main world).

2. **Доступ к API Taptop через rspack:**
   ```js
   let req = null
   window.rspackChunktaptop_design_editor.push([[`_ext_${Date.now()}`], {}, (r) => { req = r }])
   const C = req(6269).A   // ClipboardService (класс, статические методы)
   const E = req(36945).A  // MainLayout (синглтон), E.tree.root, E.remove(tagID)
   const A = req(87621).A  // UIState, A.selected = tagID выбранного слоя
   ```

3. **`C.pasteFromClipboard(posDesc, tagID)` — 2-й аргумент ОБЯЗАТЕЛЕН.**
   Без него `return null`, если на странице ничего не выделено (`A.selected` пустой на свежей странице). Передавать `rootId` как 2-й аргумент. Исходник: `if (!(t || A.A.selected) || ...) return null`.

4. **clipData нужно deep-клонировать** при сохранении (`JSON.parse(JSON.stringify(...))`) — иначе MobX-прокси устаревает после SPA-навигации.

5. **paste НЕ проверяет `designId`/`verId`** — только `tree.version` (общая для билда). Кросс-дизайн вставка работает, патчить ID не нужно.

## Окружение
- Домен: `taptop.pro` (dashboard.taptop.pro, site-XXXXX.taptop.site, иногда кастомные домены)
- URL редактора: `*://*/-/cms/v1/mosaic/*` (параметры: `page_id`, `design_id`, `ver_id`, `access`)
- Навигация между страницами — SPA (URL меняется без перезагрузки)
- Токен `access` в URL протухает → редирект на дашборд. Заходить в редактор через кнопку «Редактировать сайт».

## Перезагрузка после правок
`chrome://extensions` → Taptop Helper → ⟳. После правки content.js нужен reload расширения (Chrome кеширует).

## Подход к отладке
См. `/Users/rafael/Documents/Работа/Полезные файлы/CLAUDE.md` — чинить корневую причину в owner-layer, не патчить симптомы. Перед фиксом читать реальный исходник минифицированного бандла (`/tmp/taptop_main.js`, если есть), а не гадать.
