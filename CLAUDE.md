# Project Overview

**Trace Logos** is a web catalog of SVG/PNG logos for Russian and international brands. Users can browse, search, edit colors, and export logos.

**Stack:** Vanilla JS ES Modules, no framework, no build step. Static site + `server.js` as dev server.

**Data flow:**
`logos/manifest.json` → `logos/categories/*.json` (35+ categories) → logo items → `svgs/` / `pngs/`

Each item: `name`, `tags`, `figma` (Figma component path), `file`, `variants[]`, `ecosystem`. Optional `alt_name` / `alt_name_en` — a second searched brand name («Сбербанк» for Сбер): `build-seo-pages.js` renders it as «Имя (Алиас)» in title/H1/OG and as `alternateName` in JSON-LD. Add it when a brand is widely searched under a different name than the displayed one.

**Features:**
- Catalog browsable by category and ecosystem (Yandex, Sber, VK, Google, etc.)
- Search with automatic RU↔EN keyboard layout switching (`search.js`)
- Color editor: HSV picker, undo/redo, history (`color.js`, `picker.js`, `color-math.js`)
- Export: SVG, PNG, copy to clipboard, ZIP, Figma-ready SVG (`export.js`)
- Virtual scroll for performance (`virtual.js`)
- Logo suggestion form → Cloudflare Worker (`suggest.js`)

**JS modules:** `main.js` (orchestrator), `data.js`, `color.js`, `color-math.js`, `picker.js`, `export.js`, `search.js`, `virtual.js`, `suggest.js`, `seo.js`, `help.js`, `utils.js`

**UI layout:**
- Left sidebar — navigation by category and ecosystem. Hidden behind a burger menu on mobile.
- Main area — grid of logo cards split into sections by category.
- Detail panel — opens on card click. Shows preview, variants, color editor, export buttons.
- Search — single input in the header, filters across all categories simultaneously.

**Virtual scroll:**
Sections outside the viewport (±900px overscan) are unmounted — their cards are removed from the DOM but the container height is preserved to prevent scroll jumps. On scroll, sections remount and lazy-load images.

**Logo variants:**
`item.variants[]` holds additional files for the same logo. The `_original` variant (= `item.file`) is prepended automatically by `main.js` at render time — it does not exist in JSON.

Three JSON formats:
- `{ "type": "full"|"full_en"|"png"|"svg", "file": "..." }` — known type. `TYPE_LABELS` in `main.js` maps type → display label. Type also controls card shape: `full`/`full_en` → wide, others → square.
- `{ "label": "Old Icon", "file": "..." }` — no type, label rendered as-is. Card shape falls back to filename: ends with `-full.ext` → wide, otherwise → square (`isFullFile`).
- `{ "labelKey": "old-icon", "file": "..." }` — points into `logos/labels.json` (`{ "<key>": { "label": "...", "label_en"?: "..." } }`), the shared dictionary for one-off variant labels (holiday reskins, old logos, alt versions — anything that isn't a `type`). Prefer this over inline `label`/`label_en` for a new one-off label: reuse an existing key from `logos/labels.json` if the text already exists there, otherwise add a new entry (keep the file sorted by key). `resolveCategoryLabels()` (`scripts/lib/labels.js`, mirrored in `js/data.js`'s `loadLogos`) fills `v.label`/`v.label_en` from `labelKey` immediately after a category file is read/fetched — every other module keeps reading `v.label`/`v.label_en` unchanged. `test-data.js --pre` fails the build on a `labelKey` with no matching entry. Migrated from inline labels via `scripts/extract-labels.js` (one-off, safe to re-run — skips variants that already have `labelKey`).

Resolved label: `v.label ?? TYPE_LABELS[v.type] ?? v.type ?? ''` (main.js:482) — by this point `labelKey` has already been resolved into `v.label`.

**Adding a new logo:**
1. Place SVG in `assets/logos/svgs/` (or PNG in `assets/logos/pngs/`)
2. Add an entry to the appropriate `logos/categories/*.json`
3. Required fields: `name`, `tags`, `figma`, `file`. Optional: `variants[]`, `ecosystem`
4. **If the new logo sets `ecosystem` to a key not yet in `logos/ecosystems.json`:** add it there first — `build-all.js` doesn't create ecosystem keys, only pages for keys that already exist.
5. Run `npm run build` (= `node scripts/build-all.js`) — runs the full fast-tier pipeline below in dependency order, including OG preview images (`assets/og/<slug>.png`, mandatory since 2026-07), the sitemap (always last), and the EN mirror. **Do not run the individual scripts by hand** for a routine content change — that's how steps get forgotten or run out of order; use `--dry-run` first if you want to preview.
6. **If the new logo is a PNG:** the fast tier already ran `build-webp-previews.js` for you (step 5) — nothing extra to do. SVG logos never need it (the grid renders the SVG directly).

See "`node scripts/build-all.js`" below for what the fast tier actually runs and when you'd reach for an individual script instead (e.g. `--dry-run`-ing just one step while debugging it).

**Logo suggestion form:**
Users submit logos via a modal. Data (name, URL or file) is POSTed to Cloudflare Worker at `brand-icons-sanitizer.brand-icons.workers.dev/suggest`.

**Telegram bot token rotation (security):**
The Worker delivers submissions via a Telegram bot. The bot token lives ONLY as a Cloudflare secret (`BOT_TOKEN`) — never commit it to the repo, `wrangler.toml`, or paste it as plaintext. If the bot's description/about gets hijacked with spam (e.g. an «Undress …» ref link), the token leaked. Recovery:
1. @BotFather → `/mybots` → bot → API Token → **Revoke current token** (kills the leaked one instantly).
2. `cd sanitizer && npx wrangler secret put BOT_TOKEN` (paste the new token; no redeploy needed).
3. @BotFather → Edit Bot → clean BOTH *Description* and *About* fields.
4. Enable Two-Step Verification on the Telegram account; check Settings → Devices for stray sessions.

---

# Emoji Section

The emoji catalog lives at `/emoji/` and shares the same `main.js`, CSS, and data pipeline as logos.

**Data flow:**
`emoji/manifest.json` → `emoji/categories/*.json` (9 categories) → emoji items → `assets/emoji/pngs/`

**Categories (9 standard):** smileys-emotion, people-body, animals-nature, food-drink, travel-places, activities, objects, symbols, flags.

**PNG files:**
- Stored in `assets/emoji/pngs/<vendor>/<slug>_<codepoints>.png`
- Primary vendor is always **apple** (160×160px, cropped to content bbox, aspect ratio preserved)
- Google variants: `assets/emoji/pngs/google/<slug>_<codepoints>.png`, downloaded from emojigraph.org

**Filename convention:** `<slug>_<hex-codepoints-dash-separated>.png`
- Single: `grinning-face_1f600.png`
- ZWJ: `ballet-dancer_1f9d1-200d-1fa70.png`
- Keycap: `hash_0023-fe0f-20e3.png`, `keycap_star_002a-fe0f-20e3.png`, `zero_0030-fe0f-20e3.png`
- Copyright/registered: `copyright_00a9-fe0f.png`, `registered_00ae-fe0f.png` (leading zeros required)

**Item JSON format:**
```json
{
  "name": "Русское название",
  "tags": "🔥 english name русское название",
  "figma": "Emoji/ComponentName",
  "file": "apple/slug_codepoints.png",
  "variants": [
    { "label": "Google", "file": "google/slug_codepoints.png" }
  ]
}
```
- `name` — Russian display name
- `tags` — starts with the emoji character (enables symbol search), then English name, then Russian name
- `figma` — PascalCase, no spaces, `Emoji/` prefix
- `file` — always `apple/...` as primary (Apple is the canonical source); omit `variants` if Google doesn't have the image
- Variants use `{ "label": "VendorName", "file": "vendor/..." }` — no `type` field for emoji

**emoji/custom.json** — manual additions that survive `--rebuild-only`:
- Structure: `{ "<category-slug>": [ ...items ] }`
- Items merged into standard category JSONs after each rebuild (deduplication by `file`)
- Supports `"insertAfter": "<filename-substring>"` to place item after a specific existing entry instead of appending
- Never add a `symbols` key — standard symbols are handled by the scraper with `FILENAME_CORRECTIONS`

**⚠️ Скрейпера `scripts/scrape-emoji.js` в репозитории НЕТ.** Он и `scripts/extract-emoji.py` удалены коммитом `f5dc5d0e3` («Удалить scripts/ из репо, добавить в .gitignore») и не восстановлены — то же самое с `scripts/build-icons-data.js`. Категории эмодзи в `emoji/categories/*.json` сейчас поддерживаются вручную; `emoji/custom.json` остаётся источником правды для ручных добавлений, но мержить его автоматически нечем. **Не ссылайся на `--rebuild-only` как на рабочий путь** — если понадобится пересборка категорий, скрейпер придётся написать заново.

**Adding new emoji (вручную):**
1. Достать PNG из шрифта Apple Color Emoji (скрипта в репозитории нет — вытаскивать руками)
2. Crop to content bbox, resize to 160×160 preserving aspect ratio (fit, don't stretch)
3. Place in `assets/emoji/pngs/apple/<slug>_<codepoints>.png`
4. Добавить запись напрямую в нужный `emoji/categories/<slug>.json` (и продублировать в `emoji/custom.json`, чтобы она пережила будущую пересборку, если скрейпер вернут)
5. `npm run build` — страницы эмодзи, `emoji.json` и sitemap подтянутся

---

# Build Scripts

**NEVER manually edit generated files.** All `logos/<cat>/<slug>/index.html` pages are generated — hand edits will be overwritten on the next build.

## `node scripts/build-all.js` (`npm run build`) — run this, not the individual scripts below

**Default entry point for any content change** (new/edited logo, emoji, collection, blog post, or a shared template/partial). Spawns every script below as a child process, in dependency order, stopping on first failure. `--dry-run` previews every step without writing — and every step honours the flag, so a dry run really writes nothing.

- **Нет опциональных шагов и нет флагов-тиров.** Все ~34 шага обязательны на каждом запуске. Раньше существовал «slow tier» за `--og-home` / `--og-collections` / `--plugin-assets` / `--full`; 2026-07-28 он удалён вместе с флагами. Причина: опциональный шаг = шаг, который забудут. Так 125 из 176 постов блога уехали в прод без OG-картинки, логотип Ozon Profit — без `assets/og/`, а `assets/og/home.png` и `figma-plugin/assets/thumbnail.png` месяцами висели со старыми счётчиками логотипов/эмодзи. Все Puppeteer-шаги сделаны инкрементальными (скриншот детерминирован → сравниваем байты, пишем только изменившееся), поэтому полная сборка без изменений стоит ~74 с и нулевой мусор в git. **Не возвращать опциональность.** Дорого — оптимизируй сам шаг, а не убирай его из пайплайна.
- **Порядок:** test-data `--pre` → test-i18n → test-js → build-download-stats → build-search-images → build-seo-pages → cleanup-orphaned-pages → build-api-json → build-cdn → build-collections → build-collection-og-images → build-category-pages → build-ecosystem-pages → build-webp-previews → test-data `--post` → build-emoji-seo-pages → build-emoji-category-pages → build-emoji-json → build-og-images → build-og-home → build-plugin-assets → build-blog → build-blog-og-images → build-blog-rss → build-home-popular → build-home-collections → build-home-tools → build-home-sitemap → build-tools-headers → build-en-pages → **test-html → test-links** → build-sitemap (always last) → build-version.
- **Пять тестов, четыре слоя.** `test-data` — исходные JSON и ассеты; `test-i18n` — словари и их ключи; `test-js` — клиентский JS; `test-html` — разметка готовых страниц; `test-links` — цели ссылок. Каждый ловит свой класс поломки, ни один не дублирует другой. Любой падает — сборка встаёт.
- **Why it exists:** the old workflow was "remember which of ~14 scripts to run, in what order" — easy to get wrong or skip a step (e.g. forgetting `build-ecosystem-pages.js` after adding an `ecosystem` key leaves cross-reference links 404ing). `build-all.js` removes that memory burden entirely for the common case.
- **When an individual script below is still the right call:** iterating on ONE script's own logic (fast `--dry-run` loop without re-running everything else), or `build-og-images.js` alone right after adding one new logo (faster than a full `npm run build` when nothing else changed).
- Each script also still works completely standalone (this doc lists them individually below) — `build-all.js` is a convenience wrapper, not a replacement for understanding what each step does.

## `node scripts/test-data.js` (`npm test`)
- **Read-only data-integrity tests**, no output files. Runs inside `build-all.js` in two tiers; a failed check (exit 1) stops the pipeline.
- **`--pre`** (first step): required item fields (`name`/`tags`/`figma`/`file`), duplicate `file`/`figma` in a category, every `file`/`variants[].file`/`macos_styles.*` resolves to a real asset (logo paths starting with `/` resolve from repo root), every `ecosystem` key (string or array) exists in `logos/ecosystems.json`, orphan assets in `assets/logos/svgs|pngs` (warning).
- **`--post`** (after build-webp-previews): every PNG logo/emoji has an up-to-date WebP preview; every buildable logo has `assets/og/<slug>.png` (warning — OG is the opt-in slow tier).
- Warnings don't fail the build; `--strict` makes them fatal. No flags = both tiers (`npm test`).
- Known tolerated warnings: emoji `figma` dups from the scraper (Emoji/Family ×14), missing google flag variants, a few orphan SVGs.

## `node scripts/test-i18n.js`
- **Read-only паритет словарей**, ничего не пишет. Второй шаг fast tier (сразу после `test-data.js --pre`, до запекания `/en/`).
- **Переводы живут по одному файлу на язык** — `js/i18n-dict-ru.js` и `js/i18n-dict-en.js` (раньше был один общий `js/i18n-dict.js` с блоками `ru:`/`en:`; он удалён). Рантайм `js/i18n.js` грузит **только словарь текущего языка** динамическим `import()` — русский посетитель не качает английские строки и наоборот (~27 КБ на визит). Node-билдеры читают оба разом через `loadDict()` в `scripts/lib/en-transform.js` — форма возврата осталась `{ ru: {...}, en: {...} }`, поэтому все вызывающие скрипты (`loadDict().en`) не менялись.
- **Межъязыкового фолбэка больше нет.** Пропущенный ключ рендерится сырым (`copySvg`), а не русской строкой на английской странице. Этот скрипт — то, что заменило фолбэк: расхождение роняет сборку до деплоя. Проверяет: `LANGS`/`DEFAULT` синхронны между `js/i18n.js` и `en-transform.js`, на каждый язык есть файл словаря и статический литерал импорта в `i18n.js`, наборы ключей идентичны, совпадают типы значений и арность функций; пустая строка — предупреждение. `--strict` делает предупреждения фатальными.
- **Добавляя ключ — добавь его в ОБА файла.** Скрипты с маркерами (`build-home-collections.js`, `build-home-tools.js`) патчат `-ru` и `-en` по отдельности: в каждом файле ровно одна пара маркеров `// COLLECTIONS:START/END` и `// TOOLS:START/END`.
- **Сверка ключей с кодом (проверка 6).** Пункты выше сравнивают словари друг с другом — но они могут быть в идеальном паритете и оба не содержать ключа, на который ссылается вёрстка. Скрипт собирает все `data-i18n*` из готового HTML и партиалов + все литеральные `t('key')` из `js/` и `components/` и проверяет, что каждый есть в словаре `ru`. Опечатка в `data-i18n` рендерится сырым текстом на ОБОИХ языках сразу, паритет при этом зелёный.
- **`<link rel="modulepreload" href="…/js/i18n-dict-ru.js">`** прописан вручную в 5 источниках, которые доходят до `js/i18n.js`: `templates/partials/nav-header.html`, `templates/category-page.html`, `index.html`, `logos/index.html`, `emoji/index.html`. Без него динамический `import()` стартует только после разрешения всего статического графа модулей — лишний round-trip. `enChrome()` в `en-transform.js` меняет `-ru` → `-en` для `/en/`. **Новая точка входа с модулем, тянущим i18n, — добавь подсказку и туда.**

## `node scripts/test-js.js`
- **Read-only проверка клиентского JS** (`js/`, `components/`), ничего не пишет. Третий шаг пайплайна — до генерации страниц, чтобы сломанный модуль не уехал в 5500 файлов.
- **Зачем:** бандлера нет, тестов в браузере нет. Опечатка в `js/*.js` или переименованный модуль всплывают только на белом экране у пользователя. `test-links.js` видит `<script src="…">` и говорит «файл на месте», `test-html.js` смотрит разметку — что ВНУТРИ файла, до 2026-07-28 не смотрел никто.
- Проверяет: (1) файл парсится — `node --check` по копии с расширением `.mjs` во временной папке, потому что в репозитории нет `"type": "module"` и на голом `.js` Node ругается на `import`; (2) каждый относительный импорт резолвится в реальный файл — один битый специфаер роняет ВЕСЬ граф модулей, браузер не выполнит ни одного; (3) импорт с расширением: `'./utils'` в браузере это 404, работает только `'./utils.js'` (Node такое простил бы, браузер нет). Голые специфаеры и `https://` пропускаются — их резолвит importmap/CDN.
- `--warn-only` — отчёт без `exit 1`.

## `node scripts/test-html.js`
- **Read-only санитарная проверка СГЕНЕРЁННОГО HTML**, ничего не пишет. Идёт прямо перед `test-links.js` — после всех билдеров страниц, включая `build-en-pages.js`.
- **Зачем отдельно от `test-links.js`:** тот проверяет ровно одно — что цель ссылки лежит на диске. Здесь всё остальное, что билд-скрипт может испортить молча, не поломав ни одной ссылки.
- Проверяет: (1) незамещённые `{{PLACEHOLDER}}` (UPPER_SNAKE — формат билд-переменных; `${…}` в `<script>` не трогаем); (2) каждый блок `application/ld+json` парсится — незакрытая кавычка в имени логотипа даёт битую разметку, которую поисковики просто отбрасывают, а страница внешне цела; (3) ровно один непустой `<title>`; (4) непустой `<meta name="description">` — только у индексируемых; (5) есть `canonical` **либо** явный `noindex`; (6) ровно один `<h1>` у индексируемой страницы; (7) `canonical` уникален по всему сайту — два файла с одним canonical означают, что один никогда не попадёт в индекс; (8) `hreflang` взаимен — цель существует и ссылается обратно.
- **Проверка 6 появилась не на пустом месте:** 52 страницы экосистем (×2 языка) уезжали в индекс вообще без H1 и без единой ссылки на логотипы — `build-ecosystem-pages.js` передавал `STATIC_GRID: ''`. Исправлено 2026-07-28 (см. его секцию). Тем же прогоном нашлись `/logos/`, `/emoji/`, `/icons/` — их каталог рисуется целиком на JS, и краулер видел страницу без заголовка.
- **Приём «H1 внутри `.ssr-grid`»:** `js/main.js` сносит первый `.ssr-grid` на init, поэтому блок внутри него виден краулеру и не меняет вёрстку пользователю с JS. Так добавлены `logosIndexH1` / `emojiIndexH1` / `iconsIndexH1`.
- **Исключение ровно одно** — файлы-подтверждения владения доменом (`yandex_<hash>.html`): их содержимое диктует Яндекс. Всё остальное, что «не совсем страница» (админка, `icons/prototype.html`), закрывается `noindex` — тогда проверки 4 и 6 отступают сами, и причина видна прямо в файле, а не в списке исключений внутри теста. **Не добавляй сюда исключений.**
- `--warn-only` — отчёт без `exit 1`.

## `node scripts/test-links.js`
- **Read-only broken-link test on the RENDERED HTML.** Walks every `*.html` on the site (prunes `templates/`, `en/` is checked, plus service dirs like `node_modules`/`cdn-dist`/`upptime`), extracts every internal `href`/`src`/URL-like `content` (canonical, og:image, hreflang) and asserts the target resolves to a real file on disk — **both pages** (`…/` or `….html`) **and assets** (svg/png/webp/css/js/…). Query strings and `%XX` escapes are stripped/decoded before checking, so `file.svg?v=…` and `File%20Name.svg` resolve correctly.
- **Why it also checks assets (not just `test-data.js`'s job):** `test-data.js` validates that `file`/`variants[].file` in the SOURCE JSON point at real files — it never looks at rendered HTML. A builder can still bake a *wrong* path into the page (wrong `rel` prefix, a leftover `/en/` on an asset URL that has no EN mirror, etc.) while the JSON itself is fine. `test-links.js` is what catches that class of bug — e.g. the 2026-07-22 incident where EN logo pages linked thumbnails/downloads at `/en/assets/...`, which 404s because `assets/` is never mirrored under `/en/`.
- **Исключений нет.** Раньше `SOFT_WARN_RE` прощал отсутствующие `assets/og/*.png` — «их генерирует опциональный slow-tier шаг, его могли не запустить». Опциональных шагов больше нет: все четыре генератора OG (логотипы, блог, подборки, главная) обязательны и отрабатывают ДО этой проверки, поэтому отсутствующий OG — это упавший шаг или мусор в данных, и билд обязан встать. Послабление снято 2026-07-28, на его месте `const isSoftWarn = () => false;`. Ничего туда не возвращать; чинить в источнике (template/build-script bug → fix the script; dead reference → fix the JSON, as was done for [emoji/categories/flags.json](emoji/categories/flags.json)'s 12 `google/flag-*` variants that emojigraph.org 404s on and will never exist).
- **Fails the build** (exit 1) on any other broken link. `--warn-only` demotes everything to a warning (report without failing).
- **When to run:** last, after all page builders (it needs the final HTML). It's the step before `build-sitemap.js` in `build-all.js`. Relies on `cleanup-orphaned-pages.js` having GC'd orphaned RU **and** `en/` pages first — otherwise a stale `en/` leaf's canonical trips it.

## `node scripts/build-seo-pages.js`
- **Input:** `logos/manifest.json` → `logos/categories/*.json` + `templates/seo-page.html`
- **Output:** `logos/<category>/<slug>/index.html` for every non-comingSoon item
- Each page includes a **FAQ block** (`FAQPage` JSON-LD) and a **«Цвета бренда»** block — hex swatches extracted from the SVG text (source of truth), click-to-copy via `js/seo-page.js`. Monochrome SVGs (no extractable colors) omit the block.
- **When to run:** after any change to `logos/categories/*.json` or `templates/seo-page.html`
- Does **not** write the sitemap — that is owned by `build-sitemap.js`
- `--dry-run` to preview paths without writing

## `node scripts/build-og-images.js`
- **Input:** `logos/categories/*.json` + logo asset files
- **Output:** `assets/og/<slug>.png` (1200×630 PNG via Puppeteer + Chrome)
- **MANDATORY in the fast tier** (same reasoning as `build-blog-og-images.js` below) — `node scripts/build-all.js` runs it on every invocation. It's incremental (screenshots and compares every logo, only writes changed ones), so an unchanged run costs ~40s for 570 logos but no disk churn. Made mandatory 2026-07-27 after a new logo (Ozon Profit) shipped without an OG image because the step was opt-in (`--with-og`) and easy to forget — same failure mode as the blog OG incident below. Standalone (`node scripts/build-og-images.js`) still works fine too, e.g. right after adding one new logo.
- Requires Google Chrome at `/Applications/Google Chrome.app`
- `--dry-run` to preview paths without writing

## `node scripts/build-blog-og-images.js`
- **Input:** `blog/posts/*.md` frontmatter (`title`, `description`, `tags`)
- **Output:** `assets/og/blog-<slug>.png` (1200×630 title-card PNG via Puppeteer + Chrome — dark background, accent dot cycled by post index, title + description + brand footer)
- **Why it exists:** without it, `build-blog.js` still emits a `blog-<slug>.png` URL unconditionally (same convention as `build-og-images.js` for logos) — this script is what actually puts the file there. Until it's run, every post's social-share preview is a broken image; `test-data.js --post` warns (not fails) on missing files.
- **MANDATORY in the fast tier** (unlike the other OG scripts, which stay opt-in) — `node scripts/build-all.js` runs it on every invocation, right after `build-blog.js`. Made mandatory 2026-07 after 125/176 posts silently shipped with no OG image because the opt-in flag (`--og-blog`) was easy to forget. Costs ~10-15s per full build (one Puppeteer/Chrome session, screenshots and compares all 176 posts, writes only the changed ones) — accepted deliberately so forgetting to run it is no longer possible. Standalone (`node scripts/build-blog-og-images.js`) still works fine too, e.g. while iterating on one post.
- `cleanup-orphaned-pages.js` knows to keep `assets/og/blog-<slug>.png` for every slug still in `blog/posts/*.md` — don't hand-delete these, they'll just get regenerated as "orphaned" false positives if you rename a post's slug without rerunning this script.
- Requires Google Chrome at `/Applications/Google Chrome.app`
- `--dry-run` to preview paths without writing

## `node scripts/build-webp-previews.js`
- **Input:** `assets/logos/pngs/*.png` (via `sharp`)
- **Output:** `assets/logos/previews/<name>.webp` — lightweight grid thumbnails (fit inside 192×192, quality 80)
- **Why:** PNG logos are full-res (avg ~175 KB) but the card grid shows them at ~48-60px. The grid loads the WebP preview (~5 KB, ~98% lighter); the **original PNG stays untouched** as the source for the detail panel, download, copy and ZIP.
- **Scope:** logos only. The runtime swap is gated to `_pathSection === 'logos'` (`setPreviewBase` in `main.js`); emoji/icons are unaffected. SVG logos are intentionally excluded — converting them would make them heavier and blurrier.
- **When to run:** after adding or replacing any **PNG** logo asset
- Incremental by default (skips up-to-date previews); `--force` to rebuild all, `--dry-run` to preview

## `node scripts/build-category-pages.js`
- **Input:** `logos/manifest.json` + `logos/category-seo.json` + `templates/category-page.html`
- **Output:** `logos/<category>/index.html` (category overview pages)
- **SEO copy lives in `logos/category-seo.json`** (keyed by cat.slug): `gen` — родительный падеж for the title formula «Логотипы {gen} — скачать SVG и PNG бесплатно», `intro` — unique page text (a string; blank lines split it into `<p>`s; inline `<a>` HTML is allowed and injected raw), optional `title`/`h1` full overrides (flags), `*_en` variants. Two separate rendered pieces (don't confuse them):
  - `{{INTRO_SECTION}}` — the `intro`/`intro_en` copy as a `.category-intro` block above the grid, OUTSIDE `#content` (so `main.js`, which only manages `#content`, never wipes it). Intro links use RU-relative `../../logos/…` hrefs; the EN mirror rewrites them to `/en/…` via `applyEnChrome`→`makePathsAbsolute` (double-quoted `href` only). This is unique crawlable text — recovers the SEO value that was dead before (the field used to be authored but never rendered).
  - `{{STATIC_GRID}}` — build-time pre-rendered grid (`buildStaticGrid`, `.ssr-grid`): H1 + real `<a>` links to EVERY logo page in the category. `main.js` removes `.ssr-grid` on init and builds the live JS grid; the static copy is what Yandex crawls (Yandex renders JS poorly).
  - New category ⇒ add its entry here, or the page falls back to the generic «Логотипы — {section}» wording (and an empty intro).
  - The `category-page.html` template is shared with `build-ecosystem-pages.js`, which passes `INTRO_SECTION: ''` (ecosystems have no authored intro copy).
- Also **patches `logos/index.html`** (hand-maintained main catalog): updates the logo counter, re-injects the shared **detail panel** between `<!-- DETAIL:START/END -->` markers, AND re-injects the crawlable category-links block between `<!-- CATLINKS:START/END -->` markers (relative hrefs + `data-i18n="sitemapCat_<slug>"` — a new category also needs that key in `js/i18n-dict-ru.js` И `js/i18n-dict-en.js`, or the runtime i18n shows the raw key). The detail panel is a single source — `templates/partials/detail-panel.html` (which itself nests `{{> download-dropdown}}`); `category-page.html` pulls it via `{{> detail-panel}}`. **Edit the detail panel / download dropdown ONLY in `templates/partials/`, then run this script** — never between the markers.
- **When to run:** after changes to manifest, `category-seo.json`, the category template, or the detail/dropdown partials

## `node scripts/build-ecosystem-pages.js`
- **Input:** `logos/ecosystems.json` (key → RU/EN label) + `logos/manifest.json` → `logos/categories/*.json` (items with matching `ecosystem` field) + `templates/category-page.html`
- **Output:** `logos/ecosystem/<key>/index.html` (RU + EN) — one page per ecosystem, listing all its logos (BreadcrumbList + CollectionPage JSON-LD)
- **When to run:** after adding a new `ecosystem` key to `logos/ecosystems.json`, or after adding/removing items on an existing ecosystem. Generates a page even for an ecosystem with a single ready item — a low member count is not a reason to skip a key already in `ecosystems.json`.
- **Пререндер сетки — как у страниц категорий**, через тот же `scripts/lib/static-grid.js` (`ecoStaticGrid`): H1 + настоящие `<a>` на каждый логотип экосистемы. До 2026-07-28 сюда передавалось `STATIC_GRID: ''` с пометкой «сетку построит main.js» — в результате все 26 страниц × 2 языка уходили в индекс без H1 и без единой ссылки, краулер видел пустой шаблон. Для Яндекса, который плохо рендерит JS, это ровно та проблема, ради которой `static-grid.js` и написан. Ссылки отдаются корне-абсолютными: `makePathsAbsolute` в `/en/` сам допишет `/en/` к `<a href="/logos/…">`, а `/assets/…` оставит на корне. Регрессию теперь ловит `test-html.js` (проверка «ровно один `<h1>`»).
- **Gotcha:** this script is easy to forget because it isn't in the "adding a new logo" checklist for the common case (most logos have no `ecosystem`). If an about-text cross-links to `/logos/ecosystem/<key>/` and it 404s, check `logos/ecosystems.json` first — the key is probably already registered and just needs this script run, not new data.
- `--dry-run` to preview paths without writing

## `node scripts/build-api-json.js`
- **Input:** `logos/manifest.json` → `logos/categories/*.json`
- **Output:** `logos/<slug>.json` per category + `logos.json` (flat list for LLMs/bots)
- **When to run:** after any change to `logos/categories/*.json` — including adding/removing/editing `variants[]` on existing logos. The Figma plugin reads `logos.json` directly, so stale API JSON = missing variants in the plugin.
- `--dry-run` to preview stats without writing
- Logic: `svgUrl` = primary file if SVG; `pngUrl` = primary if PNG or first `type:"png"` variant; `formats` = `["svg","png"]` for SVG items, `["png"]` for PNG-only

## `node scripts/build-cdn.js` + `node scripts/deploy-cdn.js`
- **Input:** `logos/manifest.json` → `logos/categories/*.json` + the actual asset files under `assets/logos/svgs/` and `assets/logos/pngs/`
- **Output (local):** `cdn-dist/` — a flat mirror named by slug: `<slug>.<ext>` for the primary file, `<slug>-<variant>.<ext>` for each entry in `variants[]`. `comingSoon` items are skipped (their `file` is a shared placeholder, not a real asset). Slug collisions (same last figma segment reused across categories, e.g. `Icon/Bank/Alfa` vs `Icon/Insurance/Alfa`) are disambiguated by prefixing the category slug. `cdn-dist/` is gitignored — it is NOT committed to this repo.
- **Output (remote):** `deploy-cdn.js` is written to re-init `cdn-dist/` as its own git repo and force-push it to a `trace-logos-cdn` repo, intended to be served via GitHub Pages at a short-link domain (`cdn.trace-logos.ru`). **This was never actually deployed** — no such repo, DNS record, or live domain exists (verified 2026-07-28: `sixxset5-star/trace-logos-cdn` 404s, `cdn.trace-logos.ru` doesn't resolve to anything real). Treat `deploy-cdn.js` as unfinished/aspirational, not a working deploy path — confirm with the user before relying on it or running `npm run deploy:cdn`.
- **When to run:** `build-cdn.js` runs automatically as part of the `npm run build` fast tier (so `cdn-dist/` always reflects the current manifest, purely local). `deploy-cdn.js` does **not** run automatically and its target infrastructure doesn't exist yet — don't reference `cdn.trace-logos.ru` as a live asset host.
- `node scripts/build-cdn.js --dry-run` to preview the file list without writing

## `node scripts/build-collections.js`
- **Input:** `collections.json` + `logos.json` + `templates/collection-page.html`
- **Output:** `collections/<slug>/index.html` — cross-category landing pages (CollectionPage + ItemList + FAQPage JSON-LD)
- Each collection picks logos from `logos.json` by `match[]` name substrings
- **When to run:** after changing `collections.json` or adding logos. **Run after `build-api-json.js`** (needs fresh `logos.json`)
- `--dry-run` to preview

## Emoji page builders
- **`node scripts/build-emoji-seo-pages.js`** — per-emoji pages `emoji/<cat>/<slug>/index.html` (~1918) from `emoji/categories/*.json` + `templates/emoji-seo-page.html`. BreadcrumbList + ImageObject + FAQPage. Emits `emoji/_urls.json` (for sitemap) and `emoji/_url-map.json` (file→URL, for `build-emoji-json.js`). **Run before** the next two.
- **`node scripts/build-emoji-category-pages.js`** — 9 category pages `emoji/<slug>/index.html` (CollectionPage + ItemList + FAQPage). Reads `emoji/_url-map.json`.
- **`node scripts/build-emoji-json.js`** — `emoji.json` (now includes per-emoji `url` from `_url-map.json`, used by homepage live search). Run after `build-emoji-seo-pages.js`.

## `node scripts/build-blog.js`
- **Input:** `blog/posts/*.md` (frontmatter: `title`, `description`, `date`, `slug`; optional `title_en`/`description_en`/`tags`/`tags_en`; optional `---EN---` line splits RU body from EN body) + `templates/blog-index.html` / `templates/blog-post.html`
- **Output:** `blog/index.html` + `blog/<slug>/index.html` (BlogPosting + Breadcrumb; index has Blog schema) + `/en/` mirror. Self-contained markdown→HTML, no deps.
- **Markdown blocks (the reusable toolkit — use these for readable articles):**
  - Inline: `**bold**`, `*italic*`, `` `code` ``, `[text](href)` (relative hrefs like `../../logos/` resolve to `/en/…` on the EN mirror).
  - `##`/`###` headings — every `##` gets an anchor id; **≥3 `##` auto-generates a table of contents** at the top.
  - `>` blockquote (use for law/spec citations), pipe tables (`| a | b |` + `|---|---|`), `---` hr, `-`/`1.` lists.
  - **Callouts:** ` :::type Optional title ` … ` ::: ` where type ∈ `note`/`tip`/`warning`/`success`/`danger`. Each has an accent colour + icon + default localized label (RU/EN by build lang); a title on the fence overrides the label. Callout bodies are parsed as markdown (lists/paragraphs allowed). This is the main readability lever — use `success`/`danger` for can/can't, `warning` for caveats, `tip` for how-to, `note` for TL;DR + disclaimer.
  - Reading time (`{{READ_TIME}}`) and the lead-paragraph style are automatic. Styles live in `css/blog.css`.
- **Interactive widgets:** ` :::widget <name> ` … ` ::: ` on its own lines (body empty). Raw HTML in a post is escaped by design, so this directive is the ONLY way to put an interactive block into an article. Registered in `WIDGETS` in [scripts/build-blog.js](scripts/build-blog.js) — markup comes from `templates/partials/blog-widget-<name>.html` (baked into the page at build time, so crawlers see real HTML), and the widget's css/js are injected **only into posts that actually use it** (`{{WIDGET_CSS}}` / `{{WIDGET_JS}}` in `templates/blog-post.html`); posts without a widget stay byte-identical. An unknown name fails the build. Currently: `svg-viewer` ([js/blog-svg-viewer.js](js/blog-svg-viewer.js) + [css/blog-widget-svg.css](css/blog-widget-svg.css)) — drag&drop/paste preview of a user's SVG with an **editable** source view (edits re-render the picture live, `Вернуть исходный` restores), file diagnostics, and a download modal (PNG @1×/2×/4×; SVG appears as a format choice only once the code was edited). Used in `blog/posts/chem-otkryt-svg-fajl.md`.
  - **Never render a user's SVG via `innerHTML`** — it can carry `<script>`/`on*` handlers and that is XSS on our domain. `blog-svg-viewer.js` draws it through `<img src="blob:…">` (inert), shows the source as `textContent`, and parses it only in a detached `DOMParser` document. Any new widget touching user files must keep that boundary.
  - Widget text lives in `js/i18n-dict-<lang>.js` like everything else: static labels via `data-i18n`/`data-i18n-aria` (baked into `/en/` by `bakeI18n`), runtime strings via `t()`. Elements carrying `data-i18n` must contain plain text only — `bakeI18n` replaces their whole contents.
- **Data-driven widgets** (no css/js of their own — markup is baked from the catalog at build time, styling reuses existing components). Body is DATA, one `cat/slug` catalog path per line — the same path the article already links to, so the author never retypes a brand name or filename and the block cannot drift from the catalog. An unknown path fails the build.
  - `icon-row` — row of square tiles. Reuses `.ecosystem-grid`/`.ecosystem-card` from `css/seo-page.css` (the same "Экосистема" block as on logo pages), which `templates/blog-post.html` already loads.
  - `logo-full` — horizontal (`type:"full"`) lockups on a light canvas. A line may name the variant and a caption: `search/yandex full_en | Латиница`. A bare `dark` line switches the canvas to dark for white marks.
  - `logo-colors` — brand palette pulled from the SVG via [scripts/lib/brand-colors.js](scripts/lib/brand-colors.js), the module shared with `build-seo-pages.js` so a palette in an article can't disagree with the same logo's page. Hex labels flip black/white by WCAG luminance.
  - `logo-top` — download ranking from `logos/download-stats.json`. Order, bar widths and the snapshot date are computed at build time; `build-download-stats.js` refreshes that file earlier in the same pipeline run, so the chart is never stale.
- **`{{stat:cat/slug}}` in body text** → that logo's download count at build time. **Use it instead of typing a number into a sentence**: `logo-top` recomputes every build, so a hand-written "11 downloads" in the surrounding prose starts contradicting the table above it within months. The placeholder gives prose and widget one source. Unknown path fails the build (a silently substituted zero would be invisible to the reader).
- **When to run:** after adding/editing a post in `blog/posts/`. `npm run build` covers the rest of the checklist automatically — `build-blog-og-images.js` (per-post social-share preview) is mandatory in the fast tier now, no separate flag needed.

## `node scripts/build-sitemap.js`
- **Input:** logos/emoji manifests, `collections.json`, `blog/posts/*.md`, `emoji/_urls.json`
- **Output:** `sitemap.xml` (**sitemap index**) + `sitemap-pages.xml` / `sitemap-logos.xml` / `sitemap-emoji.xml` / `sitemap-en.xml` (the `/en/` mirror — only URLs whose `en/<path>/index.html` actually exists on disk)
- **This script is the sole owner of `sitemap.xml`.** Run it LAST, after all page builders.

## `node scripts/build-home-collections.js`
- **Input:** `collections.json` — each entry needs `lucide` (icon name for the homepage tile) and `home_label` (short footer link text, distinct from the longer `h1`)
- **Output:** patches `index.html`'s «Подборки логотипов» `.cat-grid` and `templates/partials/site-footer.html`'s «Подборки» `<ul>`, both between `<!-- COLLECTIONS:START -->` / `<!-- COLLECTIONS:END -->` markers. **Never hand-edit between those markers** — add/remove a collection in `collections.json` instead.
- **Why it exists:** `collections.json` used to be the only place a new collection was registered — the homepage tile grid and footer link were separate hand-maintained lists, easy to forget (as happened with the `video-streaming` collection, live in `collections.json`/`/sitemap/` but missing from both). This script makes `collections.json` the single source of truth for both.
- Mandatory in the fast tier (`build-all.js`), runs right before `build-home-sitemap.js` (which re-injects the footer partial into `index.html`, so the footer must already be current).
- `--dry-run` to preview without writing

## `node scripts/build-home-sitemap.js`
- **Input:** `logos/manifest.json`, `emoji/manifest.json`, `collections.json`, `blog/posts/*.md`
- **Output:** injects the HTML «Карта сайта» block into `index.html` between `<!-- SITEMAP:START -->` / `<!-- SITEMAP:END -->` markers (4 groups: Логотипы, Эмодзи, Подборки, Разделы). `index.html` stays hand-editable everywhere else; **never hand-edit between the markers.**
- **When to run:** after adding/removing logo or emoji categories, collections, or blog posts
- `--dry-run` to print the block without writing

## `node scripts/build-og-home.js`
- **Output:** `assets/og/home.png` (1200×630 branded homepage OG image via Puppeteer + Chrome). Run rarely (only if the homepage OG design changes).

## `node scripts/build-version.js`
- **Output:** `js/version.js` (`ASSET_VERSION`, a `YYYYMMDD` string) — imported by `js/utils.js` as `SVG_URL_V`, appended as `?v=` to every logo/emoji SVG/PNG/WebP URL.
- **Why it exists:** `assets/logos/*` and `assets/emoji/*` get a 30-day immutable browser cache (`vercel.json`). That's only safe if the URL changes when the file's content changes — `ASSET_VERSION` is that cache-buster. It must be a value that stays fixed between deploys, not one computed per page load.
- **When to run:** run it LAST, after all other build scripts, whenever you've replaced/edited an existing SVG or PNG under the same filename (new files with new names don't need it), or changed anything under `/js` or `/css`. Safe to skip for a routine "add a new logo" pass (new filename ⇒ new URL already busts on its own). It's the final step in `scripts/build-all.js` (`npm run build`), so a full pipeline run always refreshes it — only matters if you're running individual scripts by hand.

---

# Hosting & caching

**Production host is Vercel again** (as of 2026-07-17), not GitHub Pages. The GitHub Pages migration documented below (2026-07-05, `sixxset5-star` account, `.github/workflows/deploy.yml`) was reversed — the user explicitly asked to deploy to Vercel instead. `.vercel/project.json` (project `trace-logos`, org `team_5qtHZtJBmfxpP7GJ9GasLi8j`) is live and current; `trace-logos.ru` is aliased to it. Verify with `curl -sI https://trace-logos.ru` (look for `server: Vercel`). Deploy manually with `vercel --prod --yes --archive=tgz` — the repo has 15,900+ files, over Vercel's 15,000-file plain-upload limit, so `--archive=tgz` is required. It's unclear whether the `sixxset5-star/trace-logos` GitHub Pages path (`.github/workflows/deploy.yml`, `gh run list --workflow=deploy.yml`) is still wired up as a fallback or fully retired — check with the user before relying on either path.

**Cache-Control is Vercel's again** — `vercel.json`'s `headers` block (30-day immutable caching for `/assets/logos/*`, `/assets/emoji/*`, etc., cache-busted via `ASSET_VERSION`/`build-version.js`) applies in production once more. `build-version.js` still runs as the final build step and its output matters again for cache-busting.

**`cdn.trace-logos.ru` does not exist.** An earlier version of this doc described it as a live GitHub Pages short-link mirror (`sixxset5-star/trace-logos-cdn`, DNS A-records at reg.ru) — that was never actually built. Verified 2026-07-28: the repo 404s and the domain doesn't resolve to anything real. `scripts/build-cdn.js`/`deploy-cdn.js` exist and `build-cdn.js` runs locally as part of `npm run build`, but nothing has ever been pushed live. Don't reference this domain as a working asset host.

---

# Architecture Principles

## Module structure
- One module = one concern: `color.js`, `search.js`, `virtual.js`, `export.js` etc. Don't mix concerns.
- Each new feature gets its own file. Don't grow existing modules — if a new capability doesn't clearly belong to an existing module, create a new one.
- `main.js` is the sole orchestrator: it owns all DOM refs, initializes modules, and wires events. Modules don't call each other directly.
- Modules expose an `init()` function that receives DOM refs and callbacks from `main.js` (dependency injection). This keeps modules decoupled and importable in isolation.

## State
- Shared mutable state lives in explicit exported objects (e.g. `colorState` in `color.js`), not scattered across modules.
- No reactive bindings — DOM is updated imperatively via `classList`, `innerHTML`, `replaceChildren`.

## Data flow
- Data source: `logos/manifest.json` → category JSON files → logo items. The server is a static file server only.
- SVG text is the source of truth for colors and export. Always derive from raw SVG; cache fetched SVGs in `svgRawCache`.
- Normalize SVG colors at load time (`normalizeSvgColors`), not at use time.

## Rendering
- Virtual mounting: sections are mounted/unmounted based on viewport visibility (overscan = 900px). Never bypass `mountVirtualSection`/`unmountVirtualSection`.
- Grid height is reserved before mount to prevent layout jumps.
- Images use `data-src` and are lazy-loaded via `loadCardImage` on mount.

## CSS
- CSS mirrors JS: one file per concern (`color.css`, `cards.css`, `modals.css`, etc.). Don't put unrelated rules in the same file.

---

# Before touching any file

**Before writing or editing a single line**, answer these questions:

1. **Does a pattern already exist for this?** Check `components/`, `js/`, `css/` for existing solutions. If the project already solves a similar problem somewhere, follow that pattern — don't invent a new one.
2. **Where is the source of truth?** Find the owner layer (HTML template, JS module, JSON data, CSS file). Fix there, not where the symptom surfaces.
3. **Who else is affected?** If the fix touches shared code (`main.js`, `utils.js`, a component), check all pages that use it (`logos/`, `emoji/`, `icons/`).

If you skip this step and get corrected, it means you fixed a symptom. Go back to step 1.

---

# Debugging & Fix Philosophy

- Do not fix symptoms before identifying the root cause.
- Fix at the source-of-truth (owner layer), not where the symptom appears.
- Avoid child-layer compensation (fallbacks, patches, duplicated logic, branching).
- If a bug appears in a rendered card or panel, inspect the data layer first (JSON → `data.js` → `main.js`), then rendering, then CSS.
- When changing shared code (`main.js`, `utils.js`, a component), check all pages affected: logos, emoji, icons.
- Be skeptical of one-file fixes; justify why other layers are unaffected.
- Prefer systemic fixes, but keep changes proportional.
