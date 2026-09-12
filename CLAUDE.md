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
- Logo suggestion form → Supabase Edge Function (`suggest.js`)

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
3. Required fields: `name`, `tags`, `figma`, `file`, `dateAdded` (`YYYY-MM-DD`), `about`, `desc`. Optional: `dateModified` (`YYYY-MM-DD`), `variants[]`, `ecosystem`, `brandUrl`. Without `dateModified` the page shows «Добавлено» using `dateAdded`; when `dateModified` is present it shows «Изменён» using that date. These JSON fields are the sole source of truth for the visible date, JSON-LD, and sitemap; builders never infer dates from Git, file timestamps, or the build date. **`about`/`desc` are mandatory, not nice-to-have** — every SEO page renders them (`about` in the body copy, `desc` in `<meta description>`); a logo without them ships with a thin/empty page. `test-data.js --pre` gates `name`/`tags`/`figma`/`file`, `dateAdded`, and optional `dateModified`; missing `about`/`desc` remains a test gap, not license to skip them. There's an existing backlog of 121 logos missing `about` (tracked in agent memory, prioritized by download-stats.json) — don't add to it.
4. **If the new logo sets `ecosystem` to a key not yet in `logos/ecosystems.json`:** add it there first — `build-all.js` doesn't create ecosystem keys, only pages for keys that already exist.
5. Run `npm run build` — this is the command agents should type for a normal build. It delegates to `node scripts/build-all.js` internally, runs the full pipeline in dependency order, including OG preview images (`assets/og/<slug>.png`, mandatory since 2026-07), the sitemap (always last), and the EN mirror. **Do not run the individual scripts by hand** for a routine content change — that's how steps get forgotten or run out of order; use `npm run build -- --dry-run` first if you want to preview.
6. **Nothing extra to do for the preview** — the fast tier's `build-webp-previews.js` (step 5) generates a WebP grid preview for every logo, PNG or SVG. (History: this started 2026-08-06 as a size-gated exception for SVGs — a normal vector logo is a few KB, so only files over some "this is clearly a bad export" threshold got one, starting at 1 MB after `ozon-travel.svg` shipped at 2.9 MB from a Figma bug that baked a soft-shadow into embedded full-resolution rasters. Checking the actual numbers showed rasterizing to WebP saves 80-99% of the source weight regardless of how heavy the SVG is — the win comes from the format change, not from something being broken — so the threshold was dropped the same day and every SVG now gets a preview, same as every PNG.)

See "`npm run build`" below for what the fast tier actually runs and when you'd reach for an individual script instead (e.g. `--dry-run`-ing just one step while debugging it).

**Logo suggestion form:**
Users submit logos via a modal. Data (name, URL or file) is POSTed to the Supabase Edge Function at `WORKER_URL` in `js/suggest.js` (`.../functions/v1/suggest`, project `wezryybxxwicysnbmhkz`), source at `supabase/functions/suggest/index.ts`. (Historical: this used to be a Cloudflare Worker at `brand-icons-sanitizer.brand-icons.workers.dev/suggest` — migrated to Supabase; that Worker is retired, don't reference it as live.)

**File validation:** SVG uploads go through `supabase/functions/_shared/svg-sanitizer.ts` (element/attr whitelist, strips `<script>`/event handlers/etc). Raster uploads (`png`/`jpg`/`jpeg`/`webp`) are checked against both an extension whitelist and the file's actual magic bytes (`RASTER_SIGNATURES` in `suggest/index.ts`) — added 2026-08-10 after a `.rs` file sailed through with zero validation (the old code did `ext === 'png' ? 'image/png' : 'image/jpeg'` for literally any non-svg extension, no whitelist, no content check). Any other extension, or a file whose bytes don't match its claimed extension, is rejected with a 422 before it ever reaches Telegram.

**Telegram bot token rotation (security):**
The Edge Function delivers submissions via a Telegram bot. The bot token lives ONLY as a Supabase secret (`BOT_TOKEN`) — never commit it to the repo or paste it as plaintext. If the bot's description/about gets hijacked with spam (e.g. an «Undress …» ref link), the token leaked. Recovery:
1. @BotFather → `/mybots` → bot → API Token → **Revoke current token** (kills the leaked one instantly).
2. `npx supabase secrets set BOT_TOKEN=<new-token> --project-ref wezryybxxwicysnbmhkz` (no redeploy needed).
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

## `npm run build` — run this, not individual scripts

**Default entry point for any content change** (new/edited logo, emoji, collection, blog post, or a shared template/partial). The npm script delegates to `node scripts/build-all.js`, which spawns every script below as a child process, in dependency order, stopping on first failure. `npm run build -- --dry-run` previews every step without writing — and every step honours the flag, so a dry run really writes nothing.

**Important for reading logs:** seeing many `▶ build-*.js` lines does NOT mean the agent launched those scripts by hand. `npm run build` is the single command; `build-all.js` intentionally prints each child step as it runs. For deploys, `publish-scheduled-posts.js` is also a single entry point: it hides future posts, then runs `npm run build`, so the log still lists every child step.

- **Нет опциональных шагов и нет флагов-тиров.** Все ~34 шага обязательны на каждом запуске. Раньше существовал «slow tier» за `--og-home` / `--og-collections` / `--plugin-assets` / `--full`; 2026-07-28 он удалён вместе с флагами. Причина: опциональный шаг = шаг, который забудут. Так 125 из 176 постов блога уехали в прод без OG-картинки, логотип Ozon Profit — без `assets/og/`, а `assets/og/home.png` и `figma-plugin/assets/thumbnail.png` месяцами висели со старыми счётчиками логотипов/эмодзи. Все Puppeteer-шаги сделаны инкрементальными (скриншот детерминирован → сравниваем байты, пишем только изменившееся), поэтому полная сборка без изменений стоит ~74 с и нулевой мусор в git. **Не возвращать опциональность.** Дорого — оптимизируй сам шаг, а не убирай его из пайплайна.
- **Порядок:** build-figma-typograf → test-typograf-sync → apply-typography → test-data `--pre` → build-ecosystem-nav → test-ecosystem-sync → test-i18n → test-js → build-js-minify → build-js-bundles → test-css-parity → build-download-stats → build-search-images → build-seo-pages → cleanup-orphaned-pages → build-api-json → build-cdn → build-collections → build-credits → build-collection-og-images → build-category-pages → build-ecosystem-pages → build-webp-previews → test-data `--post` → build-emoji-seo-pages → build-emoji-category-pages → build-emoji-json → build-emoji-category-json → build-og-images → build-og-home → build-plugin-assets → build-blog → build-blog-og-images → build-blog-rss → build-home-popular → build-home-categories → build-home-collections → build-home-tools → build-home-sitemap → build-tools-headers → build-en-pages → **test-html → test-links → test-component-wiring → test-dead-code** → build-redirects → build-sitemap (always last) → build-version.
- **Девять тестов, восемь слоёв.** `test-data` — исходные JSON и ассеты; `test-i18n` — словари и их ключи; `test-js` — клиентский JS; `test-css-parity` — CSS для эффектов main.js создаёт безусловно; `test-html` — разметка готовых страниц; `test-links` — цели ссылок; `test-component-wiring` — custom-element теги без скрипта, задвоенные script/link, буквальный `{{> partial}}` в комментарии шаблона; `test-dead-code` — файлы, на которые никто не ссылается; `test-typograf-sync` — что правила типографики у сайта и у Figma-плагина из одного файла. Каждый ловит свой класс поломки, ни один не дублирует другой. Любой падает — сборка встаёт.
- **Why it exists:** the old workflow was "remember which of ~14 scripts to run, in what order" — easy to get wrong or skip a step (e.g. forgetting `build-ecosystem-pages.js` after adding an `ecosystem` key leaves cross-reference links 404ing). `build-all.js` removes that memory burden entirely for the common case.
- **When an individual script below is still the right call:** iterating on ONE script's own logic (fast `--dry-run` loop without re-running everything else), or `build-og-images.js` alone right after adding one new logo (faster than a full `npm run build` when nothing else changed).
- Each script also still works completely standalone (this doc lists them individually below) — `build-all.js` is a convenience wrapper, not a replacement for understanding what each step does.

## `node scripts/build-figma-typograf.js` + `node scripts/test-typograf-sync.js`
- **Источник правил типографики — `tools/figma-plugins/_shared/typograf-rules.js`**, один на сайт и на Figma-плагин. Только чистые строковые функции; всё, что трогает узлы Figma (`setRangeListOptions`, подчёркивание, загрузка шрифтов, посимвольный дифф для `applyTypography`), остаётся в `code.js` плагина — к правке файлов на диске это неприменимо.
- **`build-figma-typograf.js`** (write, обязателен) запекает источник дословно в `tools/figma-plugins/typograf/code.js` между маркерами `// RULES:START` / `// RULES:END`. **Не редактировать этот блок руками** — как и `logos/<cat>/<slug>/index.html` или блок `ECOSYSTEMS` в `js/data.js`, он генерируется. Node-сторона тот же файл просто `require()`-ит через `scripts/lib/typograf.js`.
- **Почему запекание, а не импорт:** плагин выполняется в песочнице Figma без `require()` и файловой системы, `code.js` грузится одним файлом. Тот же приём, что у `build-figma-promo.js`. Экспорт в источнике обёрнут в `typeof module !== 'undefined'` — в плагине условие ложно, в Node работает.
- **`test-typograf-sync.js`** (read-only) пересобирает ожидаемый блок той же функцией `buildBlock()`, которой пишет генератор (общий модуль — генератор и тест не могут разойтись между собой), и сравнивает байт в байт с тем, что лежит в `code.js`. Дополнительно: источник загружается и экспортирует всё, что нужно `scripts/lib/typograf.js`; в источнике нет обращений к `figma.*` (правило, написанное «по месту» в плагине, не заработало бы в Node). Любое расхождение — `exit 1`, `--warn-only` снимает.
- **Место в пайплайне:** самые первые два шага `build-all.js`, до `apply-typography.js` — тот читает тот же источник и должен видеть уже актуальные правила.
- **Маркеры ищутся строкой целиком** (`^// RULES:END$`), а не `indexOf`: заголовок самого источника упоминает эти же слова, и поиск подстрокой находил «конец» блока внутри его начала — замена дублировала половину файла, плагин падал на старте с `Identifier NBSP has already been declared`. Поймано при первом же прогоне.
- `--dry-run` у генератора — сказать, изменится ли блок, ничего не записывая.
## `node scripts/apply-typography.js`
- **Auto-fix, не тест.** Расставляет русскую типографику (НБСП, длинное/короткое тире, кавычки-ёлочки, многоточие, форматирование номеров/сумм) в текстовых источниках сайта, переписывая файлы на диске. Первый шаг fast tier — до `test-data.js --pre`, потому что правит именно тот текст, который читают все остальные билдеры.
- **Движок — `tools/figma-plugins/_shared/typograf-rules.js`, единственный источник правил.** Его `require()`-ит `scripts/lib/typograf.js` (тонкая обёртка, через неё работает этот скрипт) и в него же дословно запекается блок `RULES:START/END` в `code.js` Figma-плагина «Trace Typograf» — плагин выполняется в песочнице без `require()`, поэтому подключить файл он не может, только запечь (`scripts/build-figma-typograf.js`, тот же приём, что у `build-figma-promo.js`). **Правило типографики правится ТОЛЬКО в источнике**; расхождение запечённого блока с ним роняет сборку (`scripts/test-typograf-sync.js`).
- **Раньше это были две ручные копии** с инструкцией «меняешь правило — правь оба файла», и они молча разъехались: плагин умел «кв. м. → м²», «10 градусов → 10°», НБСП после «рис./табл./гл.» и «10+ шт», а сайт прогонялся через версию без этого (2026-08-19). Сверку теперь делает тест, а не память человека. **Не возвращать вторую копию.**
- **Состав конвейера у сайта и плагина РАЗНЫЙ, и это осознанно** — `CONTENT_OPTS` против `DEFAULT_OPTS` в источнике. Три правила плагина на прозе сайта портят текст: заглавная после «: «»» ломает перечни терминов («f» у Facebook → «F»), чистка пробелов внутри круглых скобок разъезжает каомодзи в `blog/posts/kaomodzi-i-tekstovye-smajliki.md`, а `McDonald's → McDonald’s` — верная правка, но на 67 видимых мест, включаемая отдельным решением. Отличия видны тремя строками в одном файле, а не расхождением двух.
- **Есть ТРЕТЬЯ копия того же движка** — `tools/extensions/trace-typograf/src/core/rules/*.js` (Chrome-расширение, плоская конкатенация без `require()`). Она портирована со старой версии `scripts/lib/typograf.js` и отстала ровно на те же четыре правила. В единый источник пока НЕ переведена.
- **Что трогает** (только русский текст, никогда `_en`-поля или английскую половину поста — «ёлочки»/НБСП-для-предлогов это правила именно русской типографики):
  - `blog/posts/*.md` — `title`/`description` во фронтматтере и русская половина тела (до `---EN---`), с защитой блоков кода, инлайн-кода, HTML-тегов, `:::widget` (тело — данные, не проза), URL, маркеров списков, разделителей таблиц.
  - `logos/categories/*.json` — `item.about`, `item.desc`, `variants[].label`.
  - `logos/labels.json` — `{key}.label`.
  - `logos/category-seo.json` — `intro`, `title`, `h1`.
  - `collections.json` — `title`/`h1`/`lead`, `intro[]`.
  - `js/i18n-dict-ru.js` — построчно, только простые `'...'`-литералы на своей строке (пропускает стрелочные функции/шаблонные литералы); после правки результат проверяется `node --check` — не скомпилировался, правки для файла откатываются целиком. `js/i18n-dict-en.js` не трогает.
- **НЕ трогает:** `name`/`tags`/`figma`/`file`/`ecosystem`/`alt_name` — идентификаторы и данные для поиска (НБСП в `tags` сломал бы токенизацию поиска).
- **Голые URL и «цифра:цифра» защищены отдельно от общей защиты тегов/кода** (`URL_RE`/`RATIO_TIME_RE` в самом скрипте) — движок плагина распознаёт `://` и `:3`/`:)` как эмотикон-лицо и вставляет туда пробел (`https://brand.com` → `https ://brand.com`, `4:3)` → `4 :3)`). Инцидент 2026-07-31: первый прогон без этой защиты сломал пример ссылки в `js/i18n-dict-ru.js` (`suggestErrorBadUrl`) — тот же баг воспроизводится и в самом Figma-плагине, если в текстовый слой попадёт голый URL.
- Идемпотентен: повторный прогон на уже поправленном тексте не меняет ничего (0 файлов, 0 полей).
- `--dry-run` — только считает, что изменится, ничего не пишет.

## `node scripts/test-data.js` (`npm test`)
- **Read-only data-integrity tests**, no output files. Runs inside `build-all.js` in two tiers; a failed check (exit 1) stops the pipeline.
- **`--pre`** (first step): required item fields (`name`/`tags`/`figma`/`file`), duplicate `file`/`figma` in a category, every `file`/`variants[].file`/`macos_styles.*` resolves to a real asset (logo paths starting with `/` resolve from repo root), every `ecosystem` key (string or array) exists in `logos/ecosystems.json`, orphan assets in `assets/logos/svgs|pngs` (warning).
- **`--post`** (after build-webp-previews): every PNG/SVG logo and PNG emoji has an up-to-date WebP preview; every buildable logo has `assets/og/<slug>.png` (warning — OG is the opt-in slow tier).
- Warnings don't fail the build; `--strict` makes them fatal. No flags = both tiers (`npm test`).
- Known tolerated warnings: emoji `figma` dups from the scraper (Emoji/Family ×14), missing google flag variants, a few orphan SVGs.

## `node scripts/build-ecosystem-nav.js` + `node scripts/test-ecosystem-sync.js`
- **`logos/ecosystems.json` — источник истины** для экосистем (Yandex/Sber/VK/…), не только для `build-ecosystem-pages.js`/`build-seo-pages.js`. Записи поддерживают два опциональных поля, которые читает только этот скрипт: `icon` (файл в `assets/logos/svgs/`, 16×16 иконка для левого сайдбара) и `navLabel: {ru, en}` (короткая подпись для узкого сайдбара, когда полное `ru`/`en` — то, что уходит в `<title>`/`<h1>` страницы экосистемы, — там не влезает, см. `artlebedev`).
- **`build-ecosystem-nav.js`** (write, обязателен в fast tier) патчит `js/data.js` между маркерами `// ECOSYSTEMS:START` / `// ECOSYSTEMS:END` — это `ecosystemLogoMap`, `ecosystemLabels`, `ecosystemLabelsEn`, `ecosystemSectionLabels`, `ecosystemSectionLabelsEn`. **Не редактировать этот блок руками** — как и `logos/<cat>/<slug>/index.html`, он генерируется, правки потрёт следующий билд. Логика генерации живёт в `scripts/lib/ecosystem-nav.js`, общей с тестом (см. ниже), чтобы генератор и тест физически не могли разойтись между собой — только оба с `ecosystems.json`.
- **Почему это отдельный скрипт, а не расширение `build-ecosystem-pages.js`:** до 2026-08-04 эти пять объектов в `js/data.js` были ручной копией того же списка, который заполняет `ecosystems.json` — новую экосистему (`gwm`, `litres`) вписывали в `ecosystems.json` для страниц, но забывали продублировать в `js/data.js`, и сайдбар каталога рисовал сырой ключ вместо лейбла и букву-заглушку вместо иконки. `build-ecosystem-nav.js` убирает второе место редактирования целиком.
- **Место в пайплайне:** сразу после `test-data.js --pre` (валидна структура `ecosystems.json`) и до `test-js.js`/`build-js-minify.js` — `js/data.js` должен быть патчнут и валиден ДО того, как эти шаги проверят/минифицируют JS.
- **`test-ecosystem-sync.js`** (read-only) перегенерирует ожидаемый блок тем же `scripts/lib/ecosystem-nav.js` и сравнивает байт-в-байт с тем, что реально лежит в `js/data.js` между маркерами — ловит расхождение, если кто-то отредактировал `js/data.js` руками в обход генератора; фейлит билд. Также проверяет, что каждый `icon` в `ecosystems.json` указывает на существующий файл в `assets/logos/svgs/` (фейлит билд) — опечатка в имени иначе тихо превращается в букву-заглушку, а не в ошибку сборки.
- **Третья проверка — предупреждение, не фейл:** экосистема с хотя бы одним не-`comingSoon` логотипом, но без `icon`, печатается как ⚠ (не блокирует `build-all.js`). Найдено 2026-08-04 на `x5` (Пятёрочка/Чижик/Перекрёсток — 3 живых логотипа, иконки не было — вот из-за чего сайдбар и показывал букву) и `adobe` (8 живых иконок приложений, но это PNG из набора macOS-иконок, не векторный логотип бренда) — оставлены предупреждением, а не ошибкой, потому что чинится не опечаткой, а добычей/отрисовкой нового SVG-ассета, которого в репозитории ещё нет. `kontur`/`PlayStation`-плейсхолдеры (`PS Remote Play`) экосистему не засчитывают — предупреждение триггерится только реальными логотипами.
- `--warn-only` — отчёт без `exit 1` (отключает даже фейл по первым двум пунктам).

## `node scripts/test-i18n.js`
- **Read-only паритет словарей**, ничего не пишет. Второй шаг fast tier (сразу после `test-data.js --pre`, до запекания `/en/`).
- **Переводы живут по одному файлу на язык** — `js/i18n-dict-ru.js` и `js/i18n-dict-en.js` (раньше был один общий `js/i18n-dict.js` с блоками `ru:`/`en:`; он удалён). Рантайм `js/i18n.js` грузит **только словарь текущего языка** динамическим `import()` — русский посетитель не качает английские строки и наоборот (~27 КБ на визит). Node-билдеры читают оба разом через `loadDict()` в `scripts/lib/en-transform.js` — форма возврата осталась `{ ru: {...}, en: {...} }`, поэтому все вызывающие скрипты (`loadDict().en`) не менялись.
- **Межъязыкового фолбэка больше нет.** Пропущенный ключ рендерится сырым (`copySvg`), а не русской строкой на английской странице. Этот скрипт — то, что заменило фолбэк: расхождение роняет сборку до деплоя. Проверяет: `LANGS`/`DEFAULT` синхронны между `js/i18n.js` и `en-transform.js`, на каждый язык есть файл словаря и статический литерал импорта в `i18n.js`, наборы ключей идентичны, совпадают типы значений и арность функций; пустая строка — предупреждение. `--strict` делает предупреждения фатальными.
- **Добавляя ключ — добавь его в ОБА файла.** Скрипты с маркерами (`build-home-collections.js`, `build-home-tools.js`) патчат `-ru` и `-en` по отдельности: в каждом файле ровно одна пара маркеров `// COLLECTIONS:START/END` и `// TOOLS:START/END`.
- **Сверка ключей с кодом (проверка 6).** Пункты выше сравнивают словари друг с другом — но они могут быть в идеальном паритете и оба не содержать ключа, на который ссылается вёрстка. Скрипт собирает все `data-i18n*` из готового HTML и партиалов + все литеральные `t('key')` из `js/` и `components/` и проверяет, что каждый есть в словаре `ru`. Опечатка в `data-i18n` рендерится сырым текстом на ОБОИХ языках сразу, паритет при этом зелёный.
- **`<link rel="modulepreload" href="…/js/i18n-dict-ru.min.js">`** прописан вручную в 5 источниках, которые доходят до `js/i18n.js`: `templates/partials/nav-header.html`, `templates/category-page.html`, `index.html`, `logos/index.html`, `emoji/index.html`. Без него динамический `import()` стартует только после разрешения всего статического графа модулей — лишний round-trip. `enChrome()` в `en-transform.js` меняет `-ru` → `-en` для `/en/`. **Новая точка входа с модулем, тянущим i18n, — добавь подсказку и туда** (и не забудь `.min.js`, см. `build-js-minify.js`).

## `node scripts/test-js.js`
- **Read-only проверка клиентского JS** (`js/`, `components/`), ничего не пишет. Третий шаг пайплайна — до генерации страниц, чтобы сломанный модуль не уехал в 5500 файлов.
- **Зачем:** бандлера нет, тестов в браузере нет. Опечатка в `js/*.js` или переименованный модуль всплывают только на белом экране у пользователя. `test-links.js` видит `<script src="…">` и говорит «файл на месте», `test-html.js` смотрит разметку — что ВНУТРИ файла, до 2026-07-28 не смотрел никто.
- Проверяет: (1) файл парсится — `node --check` по копии с расширением `.mjs` во временной папке, потому что в репозитории нет `"type": "module"` и на голом `.js` Node ругается на `import`; (2) каждый относительный импорт резолвится в реальный файл — один битый специфаер роняет ВЕСЬ граф модулей, браузер не выполнит ни одного; (3) импорт с расширением: `'./utils'` в браузере это 404, работает только `'./utils.js'` (Node такое простил бы, браузер нет). Голые специфаеры и `https://` пропускаются — их резолвит importmap/CDN.
- **`*.min.js` не сканирует** — это build-артефакт `build-js-minify.js`, не исходник; правь всегда немифицированный файл.
- `--warn-only` — отчёт без `exit 1`.

## `node scripts/build-js-minify.js`
- **Input:** каждый `.js` в `js/` и `components/` (кроме уже `.min.js`).
- **Output:** `<file>.min.js` рядом с исходником, через `terser` (`compress` + `mangle`, комментарии срезаны). Внутри минифицированного кода относительные/корне-абсолютные специфаеры импортов, указывающие на `.js` в `js/`/`components/`, переписываются на `.min.js` — иначе `main.min.js` тянул бы по цепочке НЕминифицированные модули и вся экономия терялась бы. `--dry-run` печатает список и суммарный % экономии без записи.
- **Зачем:** сайт статический, без бандлера — браузер грузит те файлы, что лежат в репозитории, один в один. Комментарии/форматирование для читаемости исходника летят пользователю как есть. Появилось 2026-08-03 после жалобы Lighthouse «Уменьшите размер кода JavaScript» на `js/i18n-dict-ru.js` (10.2 КиБ, ~2.5 КиБ можно было убрать без потери функциональности) — вместо точечного патча одного файла сделан общий build-шаг на все `js/`/`components/` (суммарно ~43% меньше байт).
- **HTML должен ссылаться на `.min.js`, не на исходник.** Точки входа (`<script src>`, `type="module" src`, `<link rel="modulepreload">`) прописаны вручную в `index.html`, `logos/index.html`, `emoji/index.html`, `icons/index.html`, шаблонах (`templates/*.html`, `templates/partials/*.html`) и в `scripts/build-blog.js`'s `WIDGETS` (путь до JS виджета). **Новая точка входа с `<script src="…js/…">` или `components/…` — сразу указывай `.min.js`**, иначе пользователь получит неминифицированный файл, а `build-js-minify.js` продолжит вхолостую генерировать `.min.js`-копию, на которую никто не ссылается.
- **Источник правды — всегда немифицированный файл.** `.min.js` коммитится в репозиторий как любой другой build-артефакт (сравни с `css/seo-page.bundle.css`, `assets/og/*.png`) — деплой не запускает сборку. Правишь `js/foo.js` — прогони `npm run build` (или хотя бы этот скрипт), иначе `.min.js` устареет молча (никакой тест сейчас не ловит рассинхрон источника и `.min.js` — рискованное место, если когда-нибудь появится ручная правка `.min.js`).
- **Второй шаг пайплайна после `test-js.js`** — источники должны пройти синтаксис-проверку до минификации; сам `build-js-minify.js` работает по исходникам, не по `.min.js`.
- Требует `terser` (`devDependencies`).

## `node scripts/build-js-bundles.js`
- **Input:** каждая ES-модульная точка входа, найденная в готовом HTML (`<script type="module" src="…/x.min.js">`) + `templates/`. Список НЕ ведётся руками в скрипте — новая точка входа в шаблоне подхватывается сама.
- **Output:** перезаписывает `.min.js` **только точек входа** собранным бандлом (esbuild, `bundle:true`, `format:'esm'`, `target:'es2022'`, minify). Не-входные модули сохраняют пофайловый `.min.js` от `build-js-minify.js`. Источник правды — по-прежнему неминифицированный файл.
- **Зачем:** сайт отдаёт ES-модули как есть, браузер качает каждый файл графа отдельно. `js/main.js` — 35 файлов, `js/seo-page.js` — 21, и этот граф перезапрашивается на каждом просмотре страницы. Байты давно решены (`build-js-minify.js` + CDN-кэш), метрится именно **количество** запросов — его убирает только бандлинг. Факт: страница каталога 41 JS-запрос → 3, страница логотипа 36 → 4, страница эмодзи 19 → 3.
- **Словари i18n намеренно остаются внешними** (`EXTERNAL`): `js/i18n.js` динамически импортирует ровно один из `js/i18n-dict-{ru,en}.js`, посетитель качает только свой язык (~27 КБ). Инлайн затянул бы оба в каждый бандл и убил сплит. Их специфаеры в бандле переписываются на `.min.js` (тем же правилом, что у `build-js-minify.js`). Остальные динамические импорты (`icns.js`, `download-modal.js`, …) инлайнятся — их единственная цена и есть лишний запрос.
- **Второй, независимый механизм в том же файле — `CLASSIC_BUNDLES`, простая конкатенация без esbuild.** `components/lang-switcher.js`, `search-box.js`, `mobile-nav.js` — обычные `<script defer>` без `import`/`export`, объединяются в `components/site-chrome.min.js` склейкой уже минифицированных `.min.js` (от `build-js-minify.js`) через `;\n`. Безопасно: ни один файл не читает `document.currentScript`, верхнеуровневые имена не пересекаются, а классические `<script>`-теги и так делят один глобальный lexical scope на странице — конкатенация ничего не меняет в том, как они видят друг друга. Список задаётся руками (не сканом HTML) — этим трём файлам негде объявить себя точкой входа так, как `type="module"` объявляет ESM-точки.
- **`components/lang-switcher.js`/`search-box.js`/`mobile-nav.js` подключаются на странице только через `templates/partials/nav-header.html`** — единственный источник правды, раздаваемый тремя механизмами: `{{> nav-header}}` в 8 mustache-шаблонах, `build-tools-headers.js`'ем в `tools/*.html` (маркеры `HEADER:START/END`) и `build-home-sitemap.js`'ем в `index.html`. Правка `nav-header.html` пропагируется во все три автоматически. **Не источник правды:** `logos/index.html`/`emoji/index.html`/`icons/index.html`/`terms/index.html`/`consent/index.html` — рукописные, без синка; правь тег на `site-chrome.min.js` в каждом отдельно. `templates/category-page.html` использует только `lang-switcher` (без `search-box`/`mobile-nav` — там нет соответствующей разметки) — бандлить один файл незачем, оставлен как есть. `404.html` аналогично держит только `search-box`.
- **`cookie-consent.js` тоже в бандле** (с 2026-08-20), несмотря на отсутствие единого источника — в отличие от тройки выше, у него были свои копии тега в `templates/partials/metrika.html`, каждом `tools/*.html` (7 файлов) и рукописных страницах каталога/terms/consent (~13 мест), убраны вручную по одной. `templates/category-page.html` — особый случай: у него нет `{{> nav-header}}` (свой инлайн-хедер только с `lang-switcher`), поэтому это единственный источник cookie-consent для `logos/<cat>/` и `logos/ecosystem/<key>/` — раньше через `metrika.html`, теперь через собственный тег на `site-chrome.min.js`. **Если новая страница добавляет свой тег `cookie-consent.min.js` копипастой старой копии вместо ссылки на `metrika.html`/`nav-header.html` — он тихо станет отдельным запросом снова**, тот же риск расхождения, что был и раньше у `metrika.html`/`nav-header.html`, не новый из-за бандла.
- **Плагин `forceEsmModule` обязателен, не косметика.** Файл без единого `import`/`export` (side-effect-модули: `components/support-btn.js`, `js/search-shortcut.js`, пасхалки) esbuild считает CommonJS и оборачивает в **не-async** функцию — а внутрь попадает top-level await из `js/i18n.js`. Получается `(()=>{await …})()`, который не парсится: **esbuild при этом рапортует успех**, битый бандл молча уезжает и роняет страницу целиком. Плагин дописывает пустой `export {}` на этапе загрузки (на диске ничего не меняется), файл становится однозначно ESM. Настоящего CommonJS под `js/`/`components/` нет — проверено grep'ом.
- **`assertParses()` на каждом выходе — страховка от ровно этого класса поломки:** успех esbuild не доказательство, поэтому перед записью бандл проверяется `node --check` по `.mjs`-копии (тот же приём, что в `test-js.js`). Не парсится — сборка встаёт. `logLevel` у esbuild specifically **не** `'silent'`: тот самый баг заявлял о себе предупреждением на фоне «успешной» сборки.
- **Место в пайплайне:** строго после `build-js-minify.js` (перезаписывает его вывод для точек входа) и до генерации страниц.
- `--dry-run` — отчёт со списком «N файлов → 1» без записи.
- Требует `esbuild` (`devDependencies`).

## `node scripts/test-css-parity.js`
- **Read-only**, ничего не пишет. Четвёртый шаг пайплайна, сразу после `test-js.js`.
- **Зачем:** `js/main.js` подключён как `<script type="module">` в четырёх местах — `logos/index.html`, `emoji/index.html`, `icons/index.html` (все рукописные) и `templates/category-page.html` (шаблон для `logos/<cat>/` и `logos/ecosystem/<key>/`). Список `<link rel="stylesheet">` в каждом собирался отдельно вручную и разъехался. Инцидент 2026-07-28: `templates/category-page.html` не тянул `easter-amongus.css`/`easter-google.css`/`easter-minicrewmate.css` — `js/easter-amongus.js` как и раньше безусловно добавлял `<img class="amongus-runner">` в `document.body` на странице любой категории, но без CSS (`position: fixed`, `z-index`) элемент вставлялся в обычный поток документа: невидим без скролла и раздувал ширину/высоту страницы. Пасхалка внешне «не работала» только там, где не хватало трёх строк `<link>` — сам JS был исправен.
- Проверяет ровно пять CSS-файлов (`REQUIRED` в скрипте) — тех, что стилизуют DOM, который `main.js` создаёт **безусловно**, а не по разметке страницы: `confetti.css`, `easter-amongus.css`, `easter-google.css`, `easter-minicrewmate.css`, `microanim.css`. Не входят `filters.css`/`category-seo.css`/`support-btn.css` — они стилизуют разметку, которой на странице физически может не быть (у emoji/icons нет блока формата файла), поэтому их отсутствие не обязательно баг.
- **Новый CSS-файл для эффекта, который `main.js` включает без проверки контекста страницы (безусловный импорт модуля, безусловный `classList.toggle`) — добавь его в `REQUIRED`.** Эффект, завязанный на конкретные данные страницы (условный рендер в HTML), в `REQUIRED` не добавлять — он и так упадёт молча только там, где нет нужной разметки, что нормально.
- **Знает про бандлы:** требование засчитывается и напрямую `<link>`, и через бандл, который этот файл инлайнит. Состав бандлов берётся `require()`-ом `BUNDLES` из `scripts/build-css-bundles.js` — не переписывать список сюда второй раз, это ровно тот разъезд, который тест и ловит.
- **Регекспы обязаны допускать `.min` и `?v=…`.** До 2026-08-20 тест искал буквально `js/main.js"` и `css/x.css"` — но `.min` дописывает `build-js-minify.js`, а `?v=` — `build-cache-bust.js`, обе конвенции появились позже теста. В результате он **не находил ни одной страницы** и рапортовал успех вхолостую: `js/main.js` матчился нулю файлов, цикл делал `continue`, вывод — зелёная галочка. Проверка, которая ничего не нашла, обязана быть ошибкой, а не успехом; помни об этом, добавляя сюда новые паттерны.
- `--warn-only` — отчёт без `exit 1`.

## `node scripts/build-css-bundles.js`
- **Input/Output:** склеивает фиксированные наборы `css/*.css` в бандлы (`BUNDLES` в скрипте), исходники не трогает — «1 файл = 1 забота» сохраняется, бандлится только вывод сборки. Коммитится в репозиторий как обычный build-артефакт.
- Два бандла: `seo-page.bundle.css` (страницы логотипов/эмодзи/подборок) и `catalog.bundle.css` (`logos/index.html`, `emoji/index.html`, `icons/index.html`, `templates/category-page.html` — те же четыре страницы, что грузят `main.js`). Второй добавлен 2026-08-20: каждая из них держала свои 15-18 `<link rel="stylesheet">`, то есть 15-18 запросов на каждый просмотр каталога. Стало 1.
- **`catalog.bundle.css` — намеренно НАДмножество:** `emoji/`/`icons/` не подключали `filters.css`/`support-btn.css`/`category-seo.css`, которые стилизуют отсутствующую у них разметку. Лишние селекторы стоят несколько байт и ноль запросов — ради чего бандл и делается. (`support-btn.css` был скорее реальным пробелом: `components/support-btn.min.js` грузят все четыре страницы.)
- **`@import` внутри бандла срезаются автоматически** (`stripBundledImports`, по списку `sources`, а не хардкодом на файл). Причина: CSS уважает `@import` только до первого правила — попав в середину бандла, строка либо игнорируется, либо стоит того самого лишнего запроса. Хардкод-список уже успел протухнуть: он покрывал `tokens`/`catalog-grid`, но не `faq`, и `@import './faq.css'` в `seo-page.css` выжил, будучи инертным лишь по случайности позиции.
- **`BUNDLES` экспортируется** (`module.exports`) для `test-css-parity.js`; `main()` под `require.main === module`, чтобы `require()` не запускал сборку.

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
- **When to run:** last, after all page builders (it needs the final HTML). It's the step before `build-redirects.js` in `build-all.js`. Relies on `cleanup-orphaned-pages.js` having GC'd orphaned RU **and** `en/` pages first — otherwise a stale `en/` leaf's canonical trips it.

## `node scripts/test-component-wiring.js`
- **Read-only, ничего не пишет.** Сразу после `test-links.js` — тоже нужен финальный HTML, тоже сканирует весь сайт (~5900 страниц, ~1с).
- **Зачем:** три класса поломки, реально случившиеся 2026-08-20 при переходе на JS/CSS-бандлы, ни один не ловил ни один существующий тест — молчаливый, «страница выглядит целой» баг-класс:
  1. **Custom-element тег в разметке без подключённого определяющего скрипта.** `icons/index.html` держал `<lang-switcher>` без `lang-switcher.js` — переключатель языка рендерился как безвестный inline-тег, никакой ошибки в консоли, просто не работал.
  2. **Один script/link дважды на одной странице.** `cookie-consent.min.js` дважды на `emoji/index.html` — лишний байт разметки от копипасты тега.
  3. **Буквальный `{{> partial}}` внутри HTML-комментария в исходнике шаблона.** `scripts/lib/render.js`'s `expandIncludes()` — наивный `str.replace(/\{\{>\s*name\s*\}\}/g, …)`, не различающий комментарий и живую разметку. Комментарий «этот шаблон не тянет `{{> nav-header}}`» разворачивается в ПОЛНЫЙ партиал внутри самого комментария — задваивает хедер (и его скрипты) на каждой странице, использующей этот шаблон. Пойман на собственных же комментариях, которые оставил тот же рефакторинг — переформулируй без буквальной директивы, экранирования эта грамматика не знает.
- **Реестр «тег → определяющий файл» не хардкодится** — строится сканом `components/*.js` на `customElements.define(...)`. Новый компонент сам себя регистрирует.
- **Про бандлы знает** тем же приёмом, что `test-css-parity.js` — `require()`-ит `CLASSIC_BUNDLES` из `scripts/build-js-bundles.js` напрямую, не копирует список.
- **SELF-CHECK на входе:** пустой реестр `customElements.define` или ноль просканированных HTML — сам по себе `exit 1`, а не «компонентов нет, всё ок». Именно такой ложный «зелёный вхолостую» уже был у `test-css-parity.js` до 2026-08-20 (регексп не находил ни одной страницы) — этот тест сразу пишется со страховкой от той же ошибки.
- Проверка 3 сканирует ИСХОДНИКИ (`templates/*.html`, `templates/partials/*.html`), а не рендер — ошибка там, её и чинить там.
- `--warn-only` — отчёт без `exit 1`.

## `node scripts/test-dead-code.js`
- **Read-only, ничего не пишет.** После `test-component-wiring.js` — тот же смысл проверки (статическая целостность проекта), не зависит от сгенерённых страниц, мог бы стоять и раньше в пайплайне.
- **Зачем:** заведён 2026-08-20 по прямому запросу — `templates/partials/site-header.html` был найден и удалён вручную в этой же сессии, полностью случайно, а не через инструмент. Тест механизирует ровно этот поиск на пять категорий: `js/*.js`, `components/*.js`, `css/*.css`, `templates/partials/*.html`, `scripts/lib/*.js`.
- **Метод — подстрочный поиск имени файла по кураторскому корпусу «источников правды»**, не резолв путей один-в-один (это работа `test-links.js` для готового HTML). Корпус: все `templates/*.html` + `templates/partials/*.html`, все `js/*.js`/`components/*.js` (исходники — минифицированный ESM-бандл может не содержать имени зависимости текстом вообще, esbuild инлайнит код вместо `import`-строки, см. `build-js-bundles.js`), все `css/*.css`, все `scripts/*.js`/`scripts/lib/*.js`, `package.json`, плюс рукописные корневые страницы (`index.html`, `404.html`, `logos/index.html`, `emoji/index.html`, `icons/index.html`, `icons/prototype.html`, `terms/index.html`, `consent/index.html`, `admin/index.html`, `tools/**/*.html`). Тысячи сгенерённых страниц (`logos/<cat>/<slug>/`, `blog/<slug>/`, …) не сканируются — каждая из них обслуживается одним и тем же шаблоном; если ссылки нет в шаблоне, её не будет ни в одной из тысяч страниц по нему.
- **Самоссылка исключается явно.** Многие файлы называют себя в шапке-комментарии (`donate.js — fundraiser modal…`) — без исключения own-file из корпуса при проверке конкретного кандидата любой файл тривиально «находил бы себя».
- **`scripts/*.js` верхнего уровня — НЕ проверяется, сознательно.** Первая версия проверяла и эту категорию (искала имя файла в `package.json`/`build-all.js`/другом `scripts/*.js`) — 12 находок, 11 из которых оказались живыми standalone-инструментами для ручного запуска (`add-brand-urls.js`, `dedupe-labels.js`, `optimize-svg.js`, критичный `publish-scheduled-posts.js` — намеренно не подключён нигде, сам оборачивает `build-all.js`, см. «Check blog embargo before deploy» в памяти). CLAUDE.md прямо документирует standalone-скрипты как паттерн проекта — статический скан текста не отличает «заброшено» от «инструмент по требованию», а ложная тревога такого масштаба хуже отсутствия проверки: приучает игнорировать красный тест. `scripts/lib/*.js` — другое дело, эти ВСЕГДА `require()`-ятся откуда-то по построению, поэтому остались в проверке (`lib/name` без расширения — так этот проект всегда их подключает).
- **Реальная находка первого прогона:** `js/threads-banner.js` + `css/threads-banner.css` — баннер Threads был архивирован (`templates/partials/_archived/threads-banner.html`), но JS/CSS-компаньоны остались в живых директориях. Удалены тем же прогоном, что завёл тест (git-история хранит на случай возврата функции).
- **SELF-CHECK на входе:** пустой корпус или ноль кандидатов ни в одной категории — `exit 1`, тот же класс страховки, что в `test-component-wiring.js`.
- Ложная находка чинится расширением грамматики поиска в самом скрипте, не списком исключений — список исключений гниёт молча.
- `--warn-only` — отчёт без `exit 1`.

## `node scripts/build-redirects.js`
- **Input:** `logos/url-aliases.json` (`[{ "from": "<old-category>/<slug>", "to": "<new-category>/<slug>" }, ...]`) + the built HTML (needs `logos/<to>/index.html` and `en/logos/<to>/index.html` to exist).
- **Output:** `vercel.json`'s `"redirects"` array — this script owns that key entirely, like `build-version.js` owns `js/version.js`. **Never hand-edit `"redirects"` in `vercel.json`** — edit `logos/url-aliases.json` instead and rerun the build. Surgical text splice (not a full `JSON.parse`+`stringify` round-trip), so the rest of `vercel.json` (`headers`, formatting) is untouched.
- **Why it exists:** a logo item's live URL is derived from its `figma` field's second path segment (see `build-seo-pages.js`), not from the category's manifest `slug`. Moving an item between `logos/categories/*.json` files — e.g. fixing a miscategorized logo — usually changes that segment, which changes the URL. If the old URL was already indexed, it now 404s unless a 301 redirect exists. Added 2026-08-02 after a session moved 16 logos across categories (VK Donut, ДомКлик, Siri, Маруся, Nike, Xiaomi, LG, Apple, Microsoft, DeepL, Google Fonts, Xbox, Windows, Steam, Мос.ру, ЦИАН) and had to hand-write 32 `vercel.json` redirect entries — exactly the kind of manual step this project replaces with automation (see `build-all.js`'s header comment on forgotten optional steps).
- **When you move a logo between categories:** add one `{ "from": ..., "to": ... }` entry to `logos/url-aliases.json` (RU-relative, no `/logos/` prefix, no trailing slash) in the same commit as the category move. The script emits both the RU and `/en/` 301 automatically — don't add the EN pair by hand.
- **Fails the build** if a `to` destination doesn't resolve to a real page (broken alias = build error, same severity as `test-links.js`). **Warns** (doesn't fail, unless `--strict`) if the `from` source page still exists on disk — that means the slug is back in active use for something else, or the move didn't actually happen; needs a human look either way.
- **`source` MUST carry a trailing slash** (`/logos/<from>/`, not `/logos/<from>`). `vercel.json`'s `trailingSlash: true` makes Vercel 308-redirect a slash-less request to the slash-suffixed path **before** evaluating the custom `redirects` array — so a slash-less `source` never matches a real request and silently falls through to the 404 page. Caught 2026-08-02: the first deploy of this feature shipped without the trailing slash and every one of the 16 redirects 404'd in production despite passing `build-redirects.js`'s own destination check (that check only verifies the target page exists, not that the source pattern can ever match).
- **When to run:** after `test-links.js` (needs final built HTML to validate destinations), before `build-sitemap.js`.
- `--dry-run` to preview the count without writing; `--strict` turns warnings into failures.

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
- **Output:** `assets/og/blog/social/<slug>.png` (1200×630 title-card PNG via Puppeteer + Chrome — dark background, accent dot cycled by post index, title + description + brand footer)
- **Why it exists:** without it, `build-blog.js` still emits an `og:image` URL unconditionally (same convention as `build-og-images.js` for logos) — this script is what actually puts the file there. Until it's run, every post's social-share preview is a broken image; `test-data.js --post` warns (not fails) on missing files.
- **MANDATORY in the fast tier** (unlike the other OG scripts, which stay opt-in) — `node scripts/build-all.js` runs it on every invocation, right after `build-blog.js`. Made mandatory 2026-07 after 125/176 posts silently shipped with no OG image because the opt-in flag (`--og-blog`) was easy to forget. Costs ~10-15s per full build (one Puppeteer/Chrome session, screenshots and compares all 176 posts, writes only the changed ones) — accepted deliberately so forgetting to run it is no longer possible. Standalone (`node scripts/build-blog-og-images.js`) still works fine too, e.g. while iterating on one post.
- `cleanup-orphaned-pages.js` knows to keep `assets/og/blog/social/<slug>.png` (and `assets/og/blog/webp/<slug>.webp`) for every slug still in `blog/posts/*.md` — don't hand-delete these, they'll just get regenerated as "orphaned" false positives if you rename a post's slug without rerunning this script.
- Requires Google Chrome at `/Applications/Google Chrome.app`
- `--dry-run` to preview paths without writing
- **`assets/og/blog/` holds three subfolders, one per role — don't flatten them back together:**
  - `originals/` — gitignored, full-res source art dropped in by hand (e.g. an upscaled PNG). Never committed, never auto-regenerated — if you delete a file here, that cover has to be re-supplied from scratch. Not used by any page directly.
  - `social/` — the PNG actually linked from `<meta property="og:image">` / JSON-LD `"image"`. What Telegram/social scrapers fetch when a post link is shared. PNG specifically, because scraper webp support is inconsistent.
  - `webp/` — the lightweight image shown on-page (post frontmatter `cover:`, rendered into `.blog-card-cover` / `.blog-article-cover`). Only browsers render this one, so file weight wins over format compatibility.
  - Kept separate from the flat `assets/og/<logo-slug>.png` / `assets/og/collection-<slug>.png` / `assets/og/home.png` too — that flat dir would otherwise mix 750+ files from four unrelated generators. `cleanup-orphaned-pages.js`'s `cleanupBlogOgImages()` GCs `social/` + `webp/` independently of the flat dir's `cleanupOgImages()`.
- **Custom hand-made covers:** add `og_custom: true` to a post's frontmatter and `build-blog-og-images.js` will never overwrite `assets/og/blog/social/<slug>.png` for that slug as long as the file already exists on disk (still generates it once if missing). Also set `cover: /assets/og/blog/webp/<slug>.webp` in the frontmatter — that's what `build-blog.js` reads to swap the CSS gradient card/header for the real image (both cover boxes are `aspect-ratio: 16/9` in `css/blog.css`). **Always author/export a custom cover at 16:9** — `background-size: cover` shows it uncropped only if the source already matches; the 1200×630 crop convention is for the auto-generated gradient OG cards only, not these. Used where the gradient title-card was swapped for a real illustrated cover — e.g. `chem-otkryt-svg-fajl.md`. This will stay rare; most posts keep the auto-generated gradient.
- **`node scripts/build-blog-covers.js`** (mandatory fast-tier step, runs right after `build-blog.js`) is what derives `social/<slug>.png` + `webp/<slug>.webp` from `originals/<slug>.{png,jpg}` — incremental by mtime. To add/replace a custom cover: drop the full-res original in `assets/og/blog/originals/` as `<slug>.png`, run the script (or `npm run build`), point `cover:` at the `.webp` output. Only slugs with a file in `originals/` are touched — everyone else's `social/<slug>.png` stays owned by `build-blog-og-images.js`'s gradient generator, and they have no `webp/` file at all (no custom on-page cover).

## `node scripts/build-webp-previews.js`
- **Input:** `assets/logos/pngs/*.png` and `assets/logos/svgs/*.svg` (via `sharp`)
- **Output:** `assets/logos/previews/<name>.webp` — lightweight grid thumbnails (fit inside 192×192, quality 80), one per logo regardless of source format
- **Why:** logo sources are full-size — PNGs avg ~175 KB, SVGs anywhere from ~1 KB to a few MB — but the card grid (and the related-logos/ecosystem/variant-thumbnail blocks on SEO pages) shows them at ~20-60px. The grid loads the WebP preview instead; the **original file stays untouched** as the source for the detail panel, download, copy, ZIP, and color editor.
- **Every logo gets a preview, PNG or SVG — no size threshold.** This covered only PNGs until 2026-08-06, when SVGs were added with a "heavy" size gate (started at 1 MB, lowered to 300 KB same day) meant to catch bad exports like `ozon-travel.svg` (2.9 MB — a Figma bug baked a soft-shadow into embedded full-resolution rasters instead of real vector paths). Checking the actual numbers showed rasterizing to a 192×192 WebP saves 80-99% of the source weight **regardless of how heavy the source SVG is** — a 10 KB icon and a 2.9 MB broken export both end up as a ~2-6 KB preview, because the saving comes from the format change (vector markup → small raster), not from anything being "broken." So the threshold was dropped entirely the same day: across all 894 SVG logos, previews total 9.76 MB → 1.90 MB (-81%). A logo that ends up with an unusually large SVG source is still worth checking (something may be a bad export, same as before) — it just no longer changes whether it gets a preview.
- **Scope:** logos only. The runtime swap is gated to `_pathSection === 'logos'` (`setPreviewBase` in `main.js`); emoji/icons are unaffected.
- **When to run:** after adding or replacing any logo asset (PNG or SVG) — nothing extra to reason about, just run it (or `npm run build`, which always does).
- Incremental by default (skips up-to-date previews); `--force` to rebuild all, `--dry-run` to preview
- **Honored in all four places a logo thumbnail gets rendered, not just the live grid** — each has its own small "does a preview exist for this file" check, re-deriving the rule from the file on disk (no shared runtime state needed since these run at build time): the live JS catalog grid (`js/utils.js`'s `previewUrl()`), the build-time SSR grid on category/ecosystem pages (`scripts/lib/static-grid.js`'s `imgSrc()`), the variant-thumbnail blocks on SEO pages (`build-seo-pages.js`'s `webpPreviewRel()`/`thumbSrc()`), and the "Экосистема" cross-link block on SEO pages (`buildOneEcosystemSection()`, also routed through `thumbSrc()`). A new thumbnail-rendering spot for a logo should route through the equivalent helper for whichever layer it's in (Node build script vs. browser runtime), not reinvent the check.
- **Two more tiers exist for two specific spots, both intentionally NOT sharing the 192px tier above:**
  - `logosMini` (48×48, `assets/logos/previews-mini/`) — `buildCatalogGridSection()`'s "Остальные категории" tiles (`build-seo-pages.js`'s `miniThumbSrc()`), 26px CSS. Started at 16×16 (2026-08-06) but that read soft on retina, bumped to 48×48 same day.
  - `logosRelated` (120×120, `assets/logos/previews-related/`) — `buildRelatedSection()`'s "Другие логотипы этой категории" tiles (`build-seo-pages.js`'s `relatedThumbSrc()`), 48px CSS. Added 2026-08-06 at the user's explicit request (started at 100, bumped to 120 same day), even though the "Экосистема" block shows logos at the same 48px CSS size and deliberately stays on the shared 192px tier — the two blocks aren't required to match.
  - Don't reuse either dir for a new block, and don't assume a new small-thumbnail spot should default to one of these sizes — add its own tier (`cfg.max` in `SECTIONS`) sized to that spot's actual display size.

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

## `node scripts/build-credits.js`
- **Input:** `credits.json` + `logos.json` + `templates/credits-page.html`
- **Output:** `credits/index.html` + `en/credits/index.html` — стена благодарностей «Люди, благодаря которым каталог жив»: бумажные стикеры, приколотые канцелярскими кнопками к шероховатой стене.
- **`credits.json` — источник правды.** Одна запись = один стикер: `type` (`donate` | `logo` | `outdated` | `big` | `custom`), `email` (или `name`, если человек не хочет светить почту), `date` (ISO — рендерится по-русски и по-английски сам), `logo` (путь `<cat>/<slug>`, из него тянутся имя бренда и ссылка на его страницу), `count` (для `big`), `text`/`text_en` (для `custom`). Текст заслуги собирается по типу — руками формулировки не пишутся, иначе они разъедутся между RU и EN.
- **Битый `logo` роняет сборку.** Индексируются только логотипы, у которых страница реально существует в **обоих** языках; `comingSoon` в `logos.json` есть, а страницы у него нет — ссылка на такой стикер была бы 404 (поймано на первом же прогоне с `telecom/mts`).
- **Порядок записей = z-index.** Скрипт сортирует по дате по возрастанию: свежая благодарность идёт последней в DOM и физически ложится поверх остальных (`js/credits-wall.js` раздаёт z-index по позиции).
- **Ничего случайного на билде.** Наклон, оттенок бумаги, цвет кнопки и ширина стикера берутся из хеша `id` записи, а не из `Math.random()` — иначе каждый `npm run build` переписывал бы страницу целиком и гадил в git.
- **Раскладку считает `js/credits-wall.js`** (браузер), не билд: стикеры печены обычным потоком, поэтому без JS страница читается как есть, а краулер видит настоящий текст и настоящие ссылки. Алгоритм — случайная точка → доля пересечения с уже развешенными → повтор, плюс защита «шапки» (бейдж + почта + первая строка заслуги): её закрывать нельзя, нижний край не жалко. На ширине контейнера < 700px — две колонки с небольшим нахлёстом (< 300px — одна). Стили — `css/credits.css`.
- **Ссылка на страницу** стоит в нижнем ряду футера (`templates/partials/site-footer.html`, ключ `footerCredits`), в `sitemap-pages.xml` и в HTML-карте сайта (`build-home-sitemap.js`).
- **`build-en-pages.js` эту страницу пропускает** (как блог и подборки) — EN-версию пишет сам этот скрипт, с английскими meta/H1/JSON-LD.
- **When to run:** после правки `credits.json` или шаблона. В fast tier стоит сразу после `build-collections.js` — нужен свежий `logos.json` от `build-api-json.js`.
- `--dry-run` — счётчик стикеров и проверка путей логотипов, без записи.

## Emoji page builders
- **`node scripts/build-emoji-seo-pages.js`** — per-emoji pages `emoji/<cat>/<slug>/index.html` (~1918) from `emoji/categories/*.json` + `templates/emoji-seo-page.html`. BreadcrumbList + ImageObject + FAQPage. Emits `emoji/_urls.json` (for sitemap) and `emoji/_url-map.json` (file→URL, for `build-emoji-json.js`). **Run before** the next two.
- **`node scripts/build-emoji-category-pages.js`** — 9 category pages `emoji/<slug>/index.html` (CollectionPage + ItemList + FAQPage). Reads `emoji/_url-map.json`.
- **`node scripts/build-emoji-json.js`** — `emoji.json` (now includes per-emoji `url` from `_url-map.json`, used by homepage live search). Run after `build-emoji-seo-pages.js`.
- **`node scripts/build-emoji-category-json.js`** — `emoji-index.json` + `emoji/<slug>.json` (9 files: `smileys`/`people`/`animals`/`food`/`travel`/`activities`/`objects`/`symbols`/`flags`) — a separate GEO-facing export documented in `llms.txt` for LLM bots, distinct from `emoji.json` above (which the site itself uses for search/hero-shuffle). Fields per emoji: `name`, `emoji`, `figma`, `appleUrl`, plus `googleUrl`/`microsoftUrl` **only when that variant actually exists** in `emoji/categories/*.json`'s `variants[]` — this is the one guarantee the previous generator lacked. Replaces the deleted `scripts/build-icons-data.js` (see the scraper-removal note above): that artifact stopped being regenerated on 2026-06-10 and drifted from the source data — `emoji/flags.json` carried 12 dead `googleUrl` links for flags that never had a Google variant (Yandex reported these as 404s, fixed 2026-08-06), and **all 9 files were completely missing `microsoftUrl`** despite `emoji-index.json` advertising `microsoftCount: 1525` and `llms.txt` documenting the field. Mandatory in the fast tier, runs right after `build-emoji-json.js`. `--dry-run` to preview counts without writing.

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

## `node scripts/build-home-categories.js`
- **Input:** `logos/manifest.json` + `logos/categories/*.json`
- **Output:** patches `index.html`'s «Категории логотипов» `.catalog-cats` grid between `<!-- CATEGORIES:START -->` / `<!-- CATEGORIES:END -->` markers — one `.catalog-cat` tile per category with items, showing up to 4 logo thumbnails (48×48 `previews-mini` tier, same as `build-seo-pages.js`'s "Остальные категории" block) plus a live count. **Never hand-edit between those markers.** The section's own `<h2>`/subtitle/"Открыть каталог →" link stay hand-authored in `index.html` — this script only replaces the grid.
- **Shares its markup and CSS with `build-seo-pages.js`'s `buildCatalogGridSection()`** — same `.catalog-cats`/`.catalog-cat*` classes, defined once in `css/catalog-grid.css` (imported by both `css/seo-page.css` and linked directly from `index.html`). Edit the shared look in `css/catalog-grid.css`, not in either page's own stylesheet.
- **Why it exists:** the old block was a hand-maintained `.cat-tile` list (Lucide icon + a count typed by hand) that drifted every time a category was added — found with 35 tiles hardcoded while the catalog already had 43 categories and 8 (including brand-new `game-platforms`/`tech`) were missing entirely. Deriving it from the manifest like every other per-category listing on the site makes that drift impossible.
- **EN mirror:** category tile names translate via `loadCategoryPairs()` in `scripts/lib/home-i18n.js`, generated from `manifest.json`'s `section`/`section_en` — not hand-copied pairs (the previous 35-entry hardcoded list had the same staleness problem the tile grid did). No `.catalog-cat-count-label` "N логотипов" mobile text here (unlike the SEO-page version) — the homepage has no per-item i18n hook to translate it on `/en/`.
- Mandatory in the fast tier (`build-all.js`), runs before `build-home-sitemap.js` (which patches the "N разделов" subtitle count via a separate mechanism, `patchHomepageCounts()`).
- `--dry-run` to preview category/count list without writing

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

## `node scripts/build-figma-promo.js`
- **Input:** `tools/figma-plugins/_shared/promo-banner.html` (единственный источник разметки блока) + иконки `tools/extensions/reviews-exporter/promo-assets/*.svg` + `assets/logos/svgs/trace-logos.svg` + счётчики из `scripts/lib/counts.js`.
- **Output:** промо-блок Trace Logo's, запечённый в `tools/figma-plugins/<plugin>/ui.html` между маркерами `<!-- PROMO:START -->` / `<!-- PROMO:END -->`. Плагины: `clean-layers`, `photo-editor`, `typograf`, `style-scanner`. **Плагин `trace-logos` намеренно вне списка** — он сам и есть каталог. **Не редактировать между маркерами руками** — затрёт следующий прогон; правь источник.
- **Почему генератор, а не три копии:** у плагинов нет сборки, `ui.html` у каждого один-единственный файл — без скрипта одна и та же разметка жила бы в трёх местах и разъехалась бы на первой правке (та же болезнь, от которой `build-home-collections.js` лечит подборки). Счётчики («723 логотипа и 1918 эмодзи») по той же причине берутся из `counts.js`, а не вписываются руками, — иначе устаревают молча, как было с thumbnail'ом до `build-plugin-assets.js`.
- **Картинки инлайнятся как `data:`-URI**: manifest всех трёх плагинов объявляет `networkAccess: "none"`, а `ui.html` грузится единственным документом — внешний `src` там не загрузится ни из сети, ни с диска (тот же приём, что в `taptop-helper/promo-assets.js`, только по другой причине).
- **Ссылки открываются сообщением `open-url` → `figma.openExternal()`** в `code.js` плагина: в iframe плагина `<a target="_blank">` и `window.open()` наружу не ведут. **Новый плагин с этим блоком — не забудь обработчик `open-url` в его `code.js`**, иначе кнопки молча ничего не делают.
- Обязательный шаг fast tier, сразу после `build-plugin-assets.js` (оба живут на счётчиках). Идемпотентен, `--dry-run` для превью.

## `node scripts/build-version.js`
- **Output:** `js/version.js` (`ASSET_VERSION`, a `YYYYMMDD` string) — imported by `js/utils.js` as `SVG_URL_V`, appended as `?v=` to every logo/emoji SVG/PNG/WebP URL.
- **Why it exists:** `assets/logos/*` and `assets/emoji/*` get a 30-day immutable browser cache (`vercel.json`). That's only safe if the URL changes when the file's content changes — `ASSET_VERSION` is that cache-buster. It must be a value that stays fixed between deploys, not one computed per page load.
- **When to run:** run it LAST, after all other build scripts, whenever you've replaced/edited an existing SVG or PNG under the same filename (new files with new names don't need it), or changed anything under `/js` or `/css`. Safe to skip for a routine "add a new logo" pass (new filename ⇒ new URL already busts on its own). It's the final step in `scripts/build-all.js` (`npm run build`), so a full pipeline run always refreshes it — only matters if you're running individual scripts by hand.

---

# Checkout «плати сколько хочешь»

Продукты (Chrome-расширения, дальше — плагины) не отдаются прямой ссылкой. Перед скачиванием стоит модалка с полем суммы по модели Gumroad: **0 — валидная сумма** и главный сценарий, файл отдаётся сразу и почту за него не спрашивают. Платящему email нужен, потому что его требует invoice в lava.top.

**Источник правды — `products.json`** (корень репозитория): `id`, `title`/`title_en`, `storageObject`, `downloadName`, `lavaOfferId`, плюс общие `presets` сумм по валютам. Пояснительный текст модалки там НЕ живёт — он общий на все продукты и лежит в `js/i18n-dict-{ru,en}.js` (ключи `pwyw*`, `thanks*`). Версия продукта тоже не дублируется: для расширений её источник — `tools/extensions/<id>/manifest.json`.

**Файла нет в публичной раздаче.** `build-extension-zip.js` пишет архивы в `dist/products/` (gitignored), оттуда `scripts/sync-products.js` заливает их в приватный бакет Supabase Storage. Единственный путь к файлу — подписанная ссылка на 15 минут, которую выдаёт Edge Function `checkout` по токену заказа. **Не возвращай прямую ссылку на `.zip` в разметку** — ни в кнопку, ни в `downloadUrl` JSON-LD (там теперь URL страницы продукта).

**Поток:**
`[data-pwyw="<id>"]` на лендинге → `js/pwyw.js` (модалка, `css/pwyw.css`) → `POST /functions/v1/checkout` → **0**: заказ `free` → `/thanks/?t=<token>`; **>0**: invoice в lava.top → `paymentUrl` → возврат на `/thanks/?t=<token>` → `js/thanks.js` опрашивает статус, пока вебхук не переведёт заказ в `paid`.

**Оплаченным заказ делает ТОЛЬКО вебхук `payment.success`.** Факт возврата браузера с lava.top не доказывает ничего и подделывается тривиально — не строй выдачу файла на нём. Поэтому `pending` на `/thanks/` это нормальное состояние, а не ошибка.

**Таблицы** — `supabase/migrations/20260822000000_create_checkout.sql`: `products` (зеркало реестра, Edge Function не читает файлы репозитория) и `orders` (одна строка на каждое нажатие «Скачать», включая бесплатные). Отдельного счётчика нет: и скачивания, и суммы — агрегаты по `orders`, их показывает вкладка «Продукты» в `admin/index.html` (запрос идёт на `/checkout` с `x-admin-key`, не на `/track`, как остальные вкладки).

**Секреты Supabase** (как `BOT_TOKEN`, в репозиторий не попадают, заданы `supabase secrets set`): `LAVA_API_KEY`, `LAVA_WEBHOOK_KEY`, `PRODUCTS_BUCKET`. Пока `LAVA_API_KEY` или `lavaOfferId` продукта пусты, платный путь честно отвечает `503 payments_disabled`, а бесплатный работает полностью — это штатный режим «фундамент есть, платёжка ещё не подключена». Функция задеплоена с `verify_jwt = false` (см. `supabase/config.toml`) — как `track`/`suggest`, вызывается с фронта без JWT.

**Оффер в lava.top должен быть опубликован с признаком «Цена по запросу через API»** — иначе `POST /api/v3/invoice` возьмёт цену оффера вместо переданной суммы, и «плати сколько хочешь» превратится в фиксированный ценник.

**Вебхук в кабинете lava** («Интеграции → API → Webhooks → Добавить Webhook»): URL — `<SUPABASE_URL>/functions/v1/checkout?action=webhook`, тип события — оплата разового счёта (успех/неудача), «Вид аутентификации для Webhook» — **«API key вашего сервиса»**, значение — `LAVA_WEBHOOK_KEY`. Не Basic: тому нужны два секрета (логин+пароль) вместо одного, а функция проверяет ровно заголовок `X-Api-Key`.

**Реальная схема API — не в `developers.lava.top` (там только описательные обзорные страницы), а в `https://gate.lava.top/docs/documentation.yaml`** (Swagger UI на `/docs` рендерится в браузере через JS, но сам YAML отдаётся напрямую и читается curl'ом). Это единственный надёжный источник — сторонние SDK/примеры на GitHub на момент подключения (2026-08) были неточны: поле `paymentMethod` в `POST /api/v3/invoice` принимает только `CARD`/`SBP`/`PAYPAL`/`PIX` (не `BANK131`/`UNLIMINT`, которые изначально попали в код по аналогии с другими провайдерами — платежи с ними падали 502-м) — сейчас поле просто не передаётся, оно опционально и по умолчанию `CARD`. Вебхук-пейлоад — `PurchaseWebhookLog` из того же YAML (путь `/example-of-webhook-route-contract`): `eventType` строго `"payment.success"` / `"payment.failed"` для разовой покупки, `contractId` — id счёта, `status` дублирует смысл (`"completed"`/`"failed"`) — `handleWebhook` сверен с этой схемой один в один, никаких «на всякий случай» вариантов имени поля.

**`GET /api/v2/products` по умолчанию отдаёт только `feedVisibility=ONLY_VISIBLE`.** Товар со статусом «Доступен по ссылке» (не выложенный в публичную ленту lava — ровно то, что нужно нашему сценарию, покупатель никогда не видит саму lava-страницу) в дефолтный список не попадает и выглядит как «API не видит товар», хотя ключ и аккаунт правильные. Добавь `?feedVisibility=ALL`, чтобы найти его `offers[].id` — это и есть `offerId` для `products.json`, отдельно от id самого продукта (который в адресной строке кабинета).

**Новый продукт:** запись в `products.json` → `node scripts/build-extension-zip.js` → `node scripts/sync-products.js` → кнопка `data-pwyw="<id>"` и `<script type="module" src="…/js/pwyw.min.js">` на лендинге. `sync-products.js` намеренно НЕ входит в `build-all.js`: ему нужны сервисный ключ и сеть, а содержимое продукта меняется реже страниц сайта (тот же принцип, что у `deploy-cdn.js`).

---

# Hosting & caching

**Production host is Vercel again** (as of 2026-07-17), not GitHub Pages. **Current Vercel account as of 2026-09-03:** project `trace-logos` lives under account **`rafaelmansurov2-9449`** (rafaelmansurov2@gmail.com) — a **personal** account, not a team (org id `team_XDIaefzVHfWNR2FEA6LWlGKy`, project id `prj_bl1Uh3KLk8G46lxgSnmjMPEdpP2k`). `.vercel/project.json` in the repo root points at this org/project — don't "fix" it back to `levanibragimov-9907`, `trace-63e4`, `arturablyazov5-5100s-projects`, `sixxset5-star`, or `mansurov`. `trace-logos.ru` and `www.trace-logos.ru` were removed from the old `levanibragimov-9907`/`trace-logos` team project and re-added to this one on 2026-09-03; DNS itself didn't change (still points at Vercel's edge). `www.trace-logos.ru` redirects to `trace-logos.ru` with 308 (set via `PATCH /v9/projects/.../domains/www.trace-logos.ru` — `vercel domains add` alone does NOT set the redirect, has to be done separately). Verify with `curl -sI https://trace-logos.ru` (look for `server: Vercel`, `200`) and `vercel whoami --token "$VERCEL_TOKEN"` (should show `rafaelmansurov2-9449`). Deploy manually with `npm run deploy` (= `vercel --prod --yes --archive=tgz --token="$VERCEL_TOKEN" && node scripts/indexnow-ping.js`) — the repo has 15,000+ files, so `--archive=tgz` is required. **No `--scope` flag** — Vercel CLI 50.x refuses `--scope`/`--team` when the value names your own *personal* account ("You cannot set your Personal Account as the scope"), on every subcommand (`link`, `project ls`, `domains ls`, deploy). Since `.vercel/project.json` already pins org/project locally, omitting `--scope` entirely works fine for a personal-account project — don't re-add it. (A team-owned project, unlike this one, would still need `--scope=<team-slug>`.) All deploys still go through the blog-embargo flow (`status` → hold/force → deploy → `restore`) before this command is run.

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

# Claude Memory Import

Copied from `/Users/rafael/.claude/projects/-Users-rafael-Documents-trace-logos/memory/` on 2026-08-27.

## Memory: admin-mac-app.md

---
name: admin-mac-app
description: "Нативная macOS-админка для trace-logos живёт в ~/Documents/TraceLogosAdmin, отдельно от репо сайта"
metadata: 
  node_type: memory
  type: project
  originSessionId: dc286bcf-66e4-47f0-8c56-f216d06d688b
  modified: 2026-08-15T11:03:21.631Z
---

Начата 2026-08-15: SwiftUI-приложение «Trace Logos Admin» — добавление/правка/удаление
логотипов и запуск пайплайна (только сборка / холд→билд→деплой→ресторе / только ресторе)
без Claude. Лежит в `~/Documents/TraceLogosAdmin`, **не внутри** репозитория сайта.

**Why:** репозиторий деплоится на Vercel архивом (`--archive=tgz`, 15 900+ файлов, у Vercel
предел 15 000) — Swift-проект с `.build/` внутри раздувал бы загрузку. Пользователь хочет
независимость от подписки на Claude.

**How to apply:**
- Правишь пайплайн-скрипты (`build-all.js`, `publish-scheduled-posts.js`) или схему item'а
  в `logos/categories/*.json` — проверь, не разошлась ли с ними админка.
- Сериализатор JSON в админке обязан совпадать с `JSON.stringify(x, null, 2)` байт в байт;
  есть самопроверка `TraceLogosAdmin --selftest-json <repo>` (на 2026-08-15 — 46/46 файлов).
- Приложение НЕ разбивает `build-all.js` на шаги (осознанно, чтобы копия порядка шагов
  не разошлась с оригиналом) и НЕ пишет `logos/url-aliases.json` — только предупреждает.
- Связано: [[check-blog-embargo-before-deploy]], [[hosting_vercel_reactivated]].

## Memory: amongus-easter-egg.md

---
name: amongus-easter-egg
description: "Among Us escape animation easter egg — trigger, files, and asset-recolor workflow"
metadata: 
  node_type: memory
  type: project
  originSessionId: 9e910695-9b20-4ad7-a57f-ccceffb4feac
---

The Among Us logo page has an easter egg: selecting the "Amongus" variant on the detail panel (checked via `item.figma === 'Icon/Game/AmongUs' && vDef.labelKey === 'amongus'` in `js/main.js`) calls `playAmongUsEscape(vc)` from `js/easter-amongus.js`.

Sequence: runner jumps off the detail panel, runs across the catalog grid, hops onto the sidebar, runs off-screen — waits — runner and a chasing "seeker" sprite both run back and jump onto the panel together (the "catch") — both are removed — after a delay a translucent ghost sprite floats out along the same route (no jumps, just glide) as the "killed" aftermath.

Assets live in `assets/easter-egg/`: `character-walk.webp` (run cycle), `character-jump.webp` (jump pose), `character-ghost.webp` (post-death ghost), `seeker-run.webp` / `seeker-jump.webp` (chaser).

**Why:** built iteratively across a long session — colors, timing, and choreography went through many rounds of user correction (jump easing, run speed, seeker size during its own jump, ghost delay/speed, removing an added glow/opacity that didn't match the source art).

**How to apply:**
- Any new sprite for this feature needs recoloring via the HSV hue-shift technique (Python PIL, `colorsys`) — original character art is red (top) / blue (body) / green (visor); the established scheme is red untouched, blue → dark burgundy (character) or dark orange (seeker), green → cyan visor. Preserve alpha as-is — the source webps are already mostly opaque (alpha 255) except anti-aliased edges, so don't add CSS opacity assuming the art itself is translucent.
- Respect scope precisely when the user corrects a change — e.g. "speed up the jump" meant only the jump, not the run legs; corrections in this feature have repeatedly been about one specific segment, not the whole animation.
- See [no-unprompted-browser-verify](no-unprompted-browser-verify.md) — user checks this feature manually, don't self-verify via preview tools unless asked.

## Memory: anti-ai-text-patterns.md

---
name: anti-ai-text-patterns
description: "13 запретов, убирающих «нейросетевость» из текста — применять к любому тексту, который пишу для пользователя (статьи блога, копирайт, описания)"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 91df82e7-cc56-41c3-89dd-79c5a5af3583
  modified: 2026-07-26T07:31:07.670Z
---

Пользователь дал инструкцию «убираем нейросеть из текста» (файл `~/Downloads/Инструкция_ убираем нейросеть из текста.txt`, передан 2026-07-26). Эти конструкции выдают LLM-происхождение текста и должны отсутствовать:

1. **Полностью убрать «не X, а Y» в любом виде.** Самый частый мой паразит: «держит не сходство, а всё остальное», «это не потеря, а требование». Переписывать в утвердительное: «держит всё остальное», «это требование».
2. Не больше **2 метафор** на весь текст.
3. Не больше **2 конструкций «X — это Y»**.
4. Полностью убрать **«Это не просто X, а …»**.
5. Убрать **симметричные предложения** и абзацы одинаковой длины.
6. Запрещён **лестничный стиль**: одиночные строки, дробление мысли на строчки, псевдодраматические переносы.
7. Убрать **размытые прилагательные** без точного признака (нормальный, хороший, настоящий, самый дисциплинированный).
8. Убрать **искусственные склейки абзацев**: «и тут начинается…», «а дальше начинается…».
9. Вычеркнуть канцеляризмы: **«важно понимать», «стоит отметить», «следует учитывать», «в современном мире», «таким образом», «в конечном итоге»**.
10. Запрещены **абстрактные выводы** без фактов и конкретики.
11. Убрать **рваные предложения в 1–2 слова** («Ничего.», «И всё.»).
12. Убрать рваные предложения с **«Без»**: «Без восторгов. Без лишних слов».
13. **Тире («—») только по правилам, не как связка по умолчанию** (added 2026-08, user found two real punctuation errors in published posts — both were MY OWN example sentences reused across the skill/blog). LLM-тик: ставить «—» вместо любой другой пунктуации просто чтобы соединить мысли. Реально тире законно только в конкретных случаях (пропущенное «есть/это», обособление вставки, противопоставление без союза, обобщающее слово, прямая речь).
    - **Перед противительным союзом («а», «но», «однако», «зато»):** союз уже выражает связь, значит по правилам нужна запятая, не тире. Пойманный пример: «…перескажет её одним предложением — а это единственное, что от неё в итоге останется» → запятая перед «а».
    - **Перед соединительным союзом «и» (без противопоставления):** тире там почти всегда чисто декоративное — «для драматизма», а не разделительный знак. Пойманный пример (моя же иллюстрация хорошей связки между секциями, использованная в трёх местах — `coherence.md`, `svyaznost-teksta.md`, `ekosistema-yandeksa-logotipy.md`): «В интерфейсе остаётся квадрат 40×40 — и систему здесь держат другие средства» → тире просто убрать, перед «и» здесь не нужно вообще ничего: «...квадрат 40×40 и систему здесь держат другие средства». Запятая перед «и» ставится, только если её требует независимая от союза причина (например, тире/запятая закрывает вложенное придаточное — это НЕ довод в пользу тире перед самим «и»).
    - **Перед уточняющим/поясняющим оборотом, который просто переименовывает уже названное существительное** (не постановка «есть/это», не вставка, не противопоставление — обычное уточнение места/понятия): тире и здесь декоративное, нужна запятая или двоеточие. Пойманный пример (не исправлен по просьбе пользователя — только зафиксировано в памяти, 2026-08): «Как те же правила работают в тексте о фирменном знаке — в разборе про то, почему сильный логотип проваливают на словах» — «в разборе...» переименовывает «тексте о фирменном знаке», это уточнение, не вставка; корректно — запятая: «...в тексте о фирменном знаке, в разборе про то, почему...».
    - Перед каждым «—» спрашивать: можно обосновать конкретным правилом? Нет → менять на запятую (если её требует своя причина), точку, двоеточие или убирать без замены вообще.
    - **Watch for this in my OWN example sentences, not just user text** — this bug shipped inside the skill's own "good example" and got copy-pasted into two more places before being caught.
    - **Three occurrences found so far, three different syntactic positions** (before «а», before «и», before a clarifying appositive) — this is not a one-off typo, it's a systemic default: reach for «—» whenever two clauses/phrases need connecting, regardless of what the actual grammatical relationship calls for. Treat EVERY «—» in a draft as guilty until proven — don't just pattern-match the two examples already caught.

**Why:** пользователь публикует статьи под своим брендом; узнаваемый LLM-почерк обесценивает текст и, для Яндекса, выглядит как низкокачественный автоконтент.

**How to apply:** прогонять как чек-лист ПОСЛЕ написания черновика, отдельным проходом. Полный текст правил с примерами — в скилле `.claude/skills/article-writing/references/anti-ai.md` (оркестратор `/article-writing` подключает его вместе с [[strong-text-39-rules]] и связностью из [[blog-writing-workflow]]).

**Проверять глазами, не скриптом** (пользователь указал 2026-07-26): регулярки в JS не знают кириллицу (`\b` не работает на «не»), и ни один скрипт не увидит метафору, размытое прилагательное или оборванную связку между секциями.

## Memory: article-writing-skill.md

---
name: article-writing-skill
description: Все правила текста сведены в скилл-оркестратор /article-writing в репозитории trace-logos — вызывать его на любую задачу «написать/поправить/вычитать статью»
metadata: 
  node_type: memory
  type: project
  originSessionId: 91df82e7-cc56-41c3-89dd-79c5a5af3583
  modified: 2026-07-26T07:47:02.015Z
---

Пользователь попросил (2026-07-26) соединить все свои правила текста в один оркестратор, «чтобы если задача написать статью — агент изучил все эти правила». Результат: скилл `.claude/skills/article-writing/` в репозитории trace-logos.

**Структура:**
- `SKILL.md` — порядок работы: загрузить правила → сформулировать и озвучить тезис → черновик живой мыслью → три прохода вычитки (архитектура / антинейросеть / сила формулировок) → проверка фактов → сборка. Плюс чек-лист перед сдачей.
- `references/coherence.md` — тезис, причинная цепь, три теста (перестановка/удаление/«поэтому»), связки между секциями. Свод правок пользователя за 2026-07…09, дублирует ядро [[blog-writing-workflow]].
- `references/strong-text.md` — 39 правил сильного текста с примерами, см. [[strong-text-39-rules]] (источник не называть, см. заметку там).
- `references/anti-ai.md` — 12 запретов против «нейросетевости», см. [[anti-ai-text-patterns]].

**Why:** правил стало четыре набора (связность, 39 правил, 12 запретов, плюс проектные требования блога), держать их в голове по одному нереально — пользователь заметил, что я упускаю условия. Скилл грузит всё сразу.

**Случай пропуска (2026-07-26):** в сессии правки статей блога я переписал 10 штук, НЕ вызвав скилл, — знал только память `blog-writing-workflow` (связность) и пропустил `anti-ai.md`. Итог: 102 конструкции «не X, а Y» в готовых текстах, пришлось вычищать вторым проходом. Вывод: задача вида «исправляй следующие N статей» — это триггер скилла так же, как «напиши статью»; вызывать ДАЖЕ когда кажется, что правила уже в памяти (память покрывает только один из четырёх наборов).

**How to apply:** на любую задачу про текст вызывать `Skill(article-writing)` ДО написания, а не после. Скилл явно запрещает: проверять правила только скриптом (регулярки в JS не знают кириллицу и не видят метафор), применять плагинный `blog-writer` (он про другого автора), править сгенерированные `blog/<slug>/index.html`.

## Memory: backup-before-risky-edits.md

---
name: backup-before-risky-edits
description: "Перед скриптовыми/массовыми правками — снапшот ДО, не после; git-автобэкап (checkout/reset/clean) сюда не относится"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 282e4db6-2b74-4ba2-857d-fd9f2a484cb7
  modified: 2026-07-31T14:01:47.816Z
---

Перед любой рискованной правкой — скриптом, массовым редактированием, восстановлением данных, чем угодно, что трогает больше одного файла или переписывает значимое содержимое (не точечный однострочный Edit) — СНАЧАЛА снапшот, ПОТОМ правка:

```bash
git stash create "pre-edit: <что делаю>" | xargs -I{} git tag "autosave/pre-$(date +%Y%m%d-%H%M%S)" {}
```
(не трогает рабочее дерево/индекс — та же механика, что у [[git-autobackup-exists]], тот же способ найти: `git tag -l 'autosave/*'`)

**Why:** [[git-autobackup-exists]] защищает только от git-команд (checkout/restore/reset --hard/clean), которые ОТБРАСЫВАЮТ изменения. Она ничего не видит, если правку делает сам агент — через Edit/Write с неверным содержимым, или через скрипт (Python/Node), который посчитал что-то неправильно и переписал файлы напрямую, без единого git-вызова. Инцидент 2026-07-31: `restore.py` менял 20 category JSON — если бы логика в нём была ошибочна, откатить можно было бы только имея снапшот ДО его запуска, а не после. Пользователь прямо спросил «а если тупая правка? неудачный скрипт?» и это вскрыло дыру в защите.

**How to apply:**
- Точечный Edit одного файла, где diff тривиально проверяем глазами — снапшот избыточен.
- Скрипт, который сам пишет в несколько файлов (особенно программно, без dry-run проверки на этой итерации) — снапшот обязателен ДО запуска.
- Восстановление/массовый импорт данных (как сегодняшнее восстановление логотипов из архива Vercel) — обязательно.
- Массовый find/replace, рефакторинг, затрагивающий много файлов — обязательно.
- После снапшота — обычная работа: скрипт пишет, потом `git diff`/`test-data.js` проверяют результат. Если что-то не так — тот же `git checkout autosave/<ts> -- <path>`, что и в [[git-autobackup-exists]].

## Memory: bash-while-read-trailing-newline-bug.md

---
name: bash-while-read-trailing-newline-bug
description: "bash `while read` silently drops the last item of a file list that lacks a trailing newline — a footgun for any file-list backup/restore loop"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 56639755-0856-43a6-93c1-b25195a9b22c
  modified: 2026-07-26T08:27:23.758Z
---

Never build a file-processing loop as `while read -r line; do ...; done < list.txt` when `list.txt` was written by joining items with `\n` and no trailing newline (e.g. Python's `'\n'.join(items)`). Bash's `read` returns failure on the final line if it has no trailing `\n`, so the loop body never runs for the last item — silently, no error printed.

**Why:** hit this exact bug in [[daily-blog-publish-scheduled-task]] — a backup/restore script for temporarily-stripped blog links skipped restoring the last file in the list, leaving one post's markdown links wrongly stripped in the working copy after "restore" claimed to finish. Only caught by chance because a final diff-check was run.

**How to apply:** for any future script (in this repo or elsewhere) that backs up/restores/moves a list of files:
- Prefer doing the whole loop in one Python (or similar) process operating on an in-memory list — no intermediate newline-delimited text file, no bash `while read`.
- If a text file list is unavoidable, write it with a trailing newline (`'\n'.join(items) + '\n'`).
- Always verify: after any backup/restore step, diff *every* restored file against its backup — don't spot-check — before treating the state as clean.

## Memory: blog-brand-mentions-must-link.md

---
name: blog-brand-mentions-must-link
description: "Every brand/tool/product name mentioned in a blog post body must link to that brand's catalog page, if one exists — checked exhaustively, not just first mention."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 766c6acc-4d69-4494-82c1-38bf3bc92b03
---

Any mention of a logo/brand/tool name in blog post body text (`blog/posts/*.md`) must be a markdown link to that brand's page in the catalog (`/logos/<category>/<slug>/`), if the brand has a catalog entry. This applies to **every occurrence** in the article body, not just the first — the user explicitly escalated ("БЛЯТЬ. НАДО ВЕЗДЕ ПОСТАВИТЬ") after repeatedly pointing out individual missed mentions one at a time across multiple posts (Figma, Photoshop, Canva, Chrome, Safari, Firefox, Яндекс Браузер, Illustrator, Lightroom, Finder, Preview, Windows, Сбер/Сбербанк, YouTube, Zoom).

**Why:** internal cross-linking to the catalog is an intentional SEO/UX pattern for this site — readers should be able to jump straight from a brand mention to its logo page.

**How to apply:**
- When adding or editing blog post content, check every paragraph (not just the first mention) for brand/tool names that have a catalog page, and link them.
- Skip: markdown headings (`#`/`##`/`###`), YAML frontmatter (`title`/`description` fields — not markdown-rendered, can't hold a link), and occurrences already inside another link's anchor text.
- Look up the catalog slug via `logos/categories/*.json` (`"name"` field) before assuming a page exists — not every brand/tool mentioned in a post has one (e.g. Inkscape, Microsoft Store, Quick Look currently don't).
- Watch for compound-word false matches when scripting this (e.g. "Сбер" is a substring-prefix of "СберМаркет"/"СберЗвук") — a word-boundary regex must account for uppercase Cyrillic letters (`А-ЯЁ`), not just lowercase, or it will insert a link that splits a compound brand name in half.
- All markdown links rendered by `scripts/build-blog.js`'s `inline()` function open in a new tab (`target="_blank" rel="noopener"`) — this was made universal for every link type (internal cross-post, catalog, external), not just catalog links. See [[dont-nag-seo-ops]] for adjacent SEO-related standing instructions.

## Memory: blog-factcheck-gensearch-pattern.md

---
name: blog-factcheck-gensearch-pattern
description: "Pattern from a 176-post Yandex GenSearch fact-check pass on Trace Logos blog — real, confirmed edits are almost always granular details (dates, numbers, named specifics), never conceptual corrections"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 955bff8a-a650-42fb-a465-175908cb595a
---

Ran a fact-check pass 2026-08 on all 176 blog/posts/*.md against a Yandex GenSearch report (ai-studio-checks/blog-factcheck.csv). Only ~9/176 posts (~5%) needed a real edit. **The core pattern, confirmed by the user reviewing the same data: almost every real correction was a DETAIL — a date, a number, a named specific — never a conceptual or explanatory error.**

The 9 confirmed edits, by what kind of fact changed:
- **Dates/timelines (6 of 9):** ChatGPT logo — added 2025 OpenAI rebrand date; Spotify — added 2026 anniversary icon date; Starbucks — added a 2008 event; emoji-keyboard article — added Emoji 17.0's Sept 2025 approval / 2026 rollout dates; crypto-logos article — tightened "first exchange to go public" into "April 2021, Nasdaq"; localization article — added law 168-ФЗ's exact effective date (2026-03-01).
- **Numbers (1 of 9):** font-licensing article — corrected a compensation ceiling from ₽5M to the current ₽10M (ст. 1301 ГК РФ, changed by law in Jan 2026).
- **Named specifics (2 of 9):** Emoji 18.0 article — swapped an outdated candidate name for the current one, added missing candidate names; background-removal article — added a specific tool feature name (Photoshop's Quick Action button).

**Conclusion — where to spend verification effort in a factcheck pass like this:** an article's core explanation/argument (what a symbol means, why a trend happened, how a process works) is very rarely actually wrong — that's conceptual content and it ages slowly. What goes stale is the SPECIFIC, TIME-BOUND layer sitting on top of it: exact dates, exact figures, exact product/version names, legal thresholds. When scanning a GenSearch row, weight claims that name a specific date/number/version much higher than claims that say "the article's explanation of X is wrong" — the latter were false positives essentially every time in this pass (GenSearch flagged BMW-propeller myth, Toyota-ovals meaning, YouTube's 2017 redesign timing, genmodzi hardware requirements, Nike's slogan history, Apple's rainbow-flag timeline, Sber's 2009→2020 timeline, X/Twitter's rebrand — all of which the article already stated correctly; GenSearch was pattern-matching keywords, not reading the text).

Also: GenSearch's own suggested "correct" number can itself be stale (it gave ₽5M for the compensation ceiling; real current figure was ₽10M) — a claimed detail-correction still needs independent verification of the number itself, not just the fact that a number changed.

**Workflow note:** NBSP characters (typography already applied via apply-typography.js) make Edit tool's old_string matching fail silently on nearly every RU sentence — read the file via Python with encoding='utf-8' to see exact `\xa0` placement, or do the replacement in Python directly instead of fighting Edit's string match.

**Cost note:** spawning ~14 parallel Agent subagents to cover the CSV batches burned ~1M+ tokens for a pass that only needed ~9 real edits — user pushed back ("500к токенов потратил") and asked to switch to manual small-batch review (10 slugs at a time, no subagents). For a similar future pass: given the pattern above, it's more efficient to specifically hunt for dates/numbers/named-versions in each GenSearch row and verify just those, rather than spawning agents to re-litigate every conceptual claim.

## Memory: blog-posts-do-not-touch.md

---
name: blog-posts-do-not-touch
description: "Список статей блога Trace Logos, которые уже вычитаны (агентом или вручную пользователем) — не переписывать без явного разрешения"
metadata: 
  node_type: memory
  type: project
  originSessionId: 7cd8cffc-4bf6-4813-9aec-4b5847c091b7
  modified: 2026-08-09T18:03:09.633Z
---

Пользователь вычитывает блог `blog/posts/*.md` порциями по 2 статьи, по возрастанию поля `date`. Перечисленные ниже файлы **уже приведены в порядок, и трогать их без явного разрешения нельзя** — ни «заодно», ни «мимоходом при другой задаче». Если кажется, что статья из списка нарушает правила, сначала спроси.

## Отредактированы вручную пользователем (5 самых новых) — НЕ ТРОГАТЬ вообще

Это его собственная правка, агент к ней не притрагивался:

- `mikrokopiya-v-interfejse` (2026-09-17)
- `keys-v-portfolio-dizajnera` (2026-09-16)
- `priznaki-nejrosetevogo-teksta` (2026-09-15)
- `svyaznost-teksta` (2026-09-14)
- `kak-pisat-o-logotipe` (2026-09-13)

## Вычитаны агентом сверху вниз (заход «от самых новых», 2026-08-05) — НЕ ТРОГАТЬ без разрешения

Полностью переписаны под последнюю версию скилла `/article-writing` (тезис, 8+ мин RU и EN отдельно, ноль «не X, а Y», тире и запятая перед «и», ссылки на каталог). Пользователь отдельно потребовал: **никакой другой агент не правит эти файлы без его явного разрешения.**

- `tochki-kontakta-brenda` (2026-09-12)
- `mikrovzaimodejstviya` (2026-09-12)
- `logotip-dlya-muzykanta` (2026-09-11) — 8.0 мин RU / 10 EN
- `brending-s-pomoshyu-ii` (2026-09-11) — 8.3 мин RU / 10.3 EN
- `logotip-dlya-yurista` (2026-09-10) — 8.8 мин RU / 11.2 EN, переписана целиком
- `logotip-dlya-obrazovaniya` (2026-09-10) — 8.2 мин RU / 10.8 EN, переписана целиком

- `logotip-dlya-eko-brenda` (2026-09-10) — 8.1 мин RU / 9.9 EN, переписана целиком
- `skevomorfizm` (2026-09-09) — 8.1 мин RU / 9.2 EN, доводочный проход + две новых секции

- `geshtalt-v-logotipe` (2026-09-09) — 8.0 мин RU / 10.0 EN, переписана целиком
- `arhetipy-brenda` (2026-09-09) — 8.1 мин RU / 10.0 EN, переписана целиком

Следующая пара сверху вниз — `oformlenie-socsetej` и `memy-v-marketinge` (обе 2026-09-08).

**Ссылки на каталог проверяй по диску, а не по `logos.json`.** Запись в `logos/categories/*.json` может быть `comingSoon`: в `logos.json` она есть, а страницы `logos/<cat>/<slug>/index.html` нет, и `test-links.js` роняет сборку. Так уехали `docs/egrul`, `docs/diadoc`, `docs/kontur`, `education/uchiru`, `education/netology` — перед вставкой ссылки смотри `ls logos/<cat>/`.

## Приведены к ПОСЛЕДНЕЙ версии правил скилла (2026-08-05)

Прошли объём 8–15 мин (RU и EN отдельно), запрет «не X, а Y», правила тире и запятой перед «и»:

- `svg-ili-png-dlya-logotipa` (2026-06-02)
- `kak-izmenit-cvet-logotipa` (2026-06-03)
- `chto-takoe-emodzi-i-otkuda-oni` (2026-06-04)
- `animirovannyj-logotip` (2026-06-05)
- `chem-otkryt-svg-fajl` (2026-06-06) — внутри блок `:::widget svg-viewer` от пользователя, сохранять
- `chto-takoe-brendbuk` (2026-06-07)
- `emodzi-v-marketinge` (2026-06-09)
- `firmennye-cveta-izvestnyh-brendov` (2026-06-10)
- `ikonka-prilozheniya` (2026-06-11)
- `istoriya-logotipa-apple` (2026-06-12)
- `istoriya-logotipa-sbera` (2026-06-13) — внутри `:::widget logo-timeline` от пользователя, сохранять
- `istoriya-logotipa-yandeksa` (2026-06-14)
- `kak-konvertirovat-svg-v-png` (2026-06-15) — доводочный проход 2026-08-05: объём 8.4 мин RU / 10.0 EN, тире и запятые перед «и», ссылки на PowerPoint/Gmail/Outlook
- `kak-optimizirovat-svg` (2026-06-16) — доводочный проход 2026-08-05: объём 8.2 мин RU / 9.6 EN, новая секция «Чем проверить, что стало лучше»
- `kak-perevesti-logotip-v-vektor` (2026-06-17) — полный проход 2026-08-05: 8.2 мин RU / 9.0 EN, переставлены секции (подготовка исходника перед «Путь 2», FAQ в конец), убран ложный ссылочный `[Zoom]` на глаголе «zoom», 6 «не X, а Y», метафоры до лимита
- `kak-sdelat-favicon` (2026-06-18) — доводочный проход 2026-08-05: 8.1 мин RU / 9.4 EN, три декоративных тире, блок про ICO, проверка тёмной темы, сроки обновления в выдаче
- `kak-sdelat-logotip-samomu` (2026-06-19) — полный проход 2026-08-05: 8.2 мин RU / 9.1 EN, 9 «не X, а Y», новая секция «Что делать, если ничего не придумывается», тест памяти, именование файлов
- `kak-uznat-cvet-logotipa` (2026-06-22) — полный проход 2026-08-05: 8.2 мин RU / 9.1 EN, 8 «не X, а Y», новые секции «Что делать, если в SVG нет ни одного fill» и «Как убедиться, что цвет снят правильно», системные пипетки macOS/PowerToys
- `kak-vstavit-emodzi-s-klaviatury` (2026-06-23) — полный проход 2026-08-05: 8.3 мин RU / 8.6 EN, секции про Linux (GNOME/KDE) и пустой квадрат вместо эмодзи, ввод по коду Unicode, ссылки на каталог для Word/Telegram/Slack/Discord/Notion/Outlook/Excel/Google Docs/Sheets
- `kak-vstavit-logotip-v-figma` (2026-06-24) — полный проход 2026-08-05: 8.1 мин RU / 8.6 EN, новые секции «Ряд логотипов партнёров за десять минут» и настройки SVG-экспорта, плагины, FAQ про отличие от сайта бренда
- `kak-vstavit-svg-na-sajt` (2026-06-25) — полный проход 2026-08-05: 8.1 мин RU / 8.6 EN, новые секции «Как перекрасить SVG через img» (mask/filter) и «Как отдавать SVG с сервера» (MIME, сжатие, кэш, same-origin для `<use>`), FAQ про xmlns и письма
- `kak-zaregistrirovat-logotip` (2026-06-26) — полный проход 2026-08-05: 8.1 мин RU / 9.0 EN; EN-половина была вдвое короче RU (не хватало трёх секций — отказ, Мадридская система, после регистрации), домирроренa; новая секция «Что подготовить до подачи», ТРОИС, как искать бесплатно
- `kaomodzi-i-tekstovye-smajliki` (2026-06-27) — полный проход 2026-08-05: 8.1 мин RU / 9.0 EN (была 4.3 — самая короткая в блоге); новые секции «Анатомия каомодзи», «Японский ASCII-арт / Shift_JIS и кот Мона», «Смайлики говорят на разных языках» (рунетовские скобки, корейские ㅋㅋㅋ), «Каомодзи в интерфейсах и коде»
- `kak-skachat-logotip-s-sajta` (2026-06-21) — доводочный проход 2026-08-05: 8.2 мин RU / 9.9 EN, новая секция «Где ещё лежит вектор, кроме сайта» (PDF/PPTX/APK/расширения), случай SVG-спрайта, четвёртая проверка файла

## Правились в более ранней сессии (до появления скилла)

Статус неизвестен, антинейросетевые правила к ним не применялись: `kak-vstavit-logotip-v-figma` (06-24), `logotip-s-prozrachnym-fonom` (06-30), `pochemu-emodzi-otobrazhayutsya-po-raznomu` (07-06), `pochemu-logotip-razmytyj` (07-07), `psihologiya-cveta-v-logotipe` (07-09), `razmery-logotipa-dlya-sajta-i-socsetej` (07-10), `skolko-stoit-logotip` (07-15), `v-kakom-formate-nuzhen-logotip` (07-16), `vektor-i-rastr-raznica` (07-17), `vodyanoj-znak-na-foto` (07-18), `znachenie-populyarnyh-emodzi` (07-28).

**Why:** пользователь тратит время на вычитку порциями и на ручную правку; переписанная без спроса статья уничтожает эту работу молча, а заметить это можно только перечитав текст целиком.

**Округление врёт на границе.** `1432/180 = 7.96` печатается как «8.0», хотя норму не проходит. Сравнивай точное значение (`8 <= w/180 <= 15`), а не отформатированное.

**Правь ОБЕ половины сразу.** Дважды подряд декоративные тире вычищались только в RU, а EN-зеркало оставалось нетронутым и всплывало на финальной проверке. Для EN шаблон тире: `—\s+(?:and|but|while|yet|so)\s`.

**Детектор «не X, а Y» должен ловить и вариант с тире** (`, — а не`), и стяжения в EN (`isn't X but Y`, `aren't X but Y`) — обычный шаблон их пропускает, и на статьях 06-09/06-10 так уцелели нарушения в EN-половине, пережившие первый проход. Рабочая версия: `(\bне\s[^.!?;:]{2,140}?,\s*—?\s*а\s|,\s*—?\s*а\s+не\s|\bnot\s[^.!?;:]{2,120}?\sbut\s|n.t\s[^.!?;:]{2,110}?\sbut\s|rather than|not only )`, всегда с заменой NBSP на пробел перед проверкой.

**How to apply:** идут ДВА встречных захода, и направление нужно уточнять у пользователя, а не угадывать. 2026-08-05 пользователь сформулировал прямо: «один агент идёт сверху вниз, второй снизу вверх» — сессии не должны пересекаться. Снизу вверх (по возрастанию `date`) дошли до 06-27 включительно (следующая — `logotip-dlya-telegram-kanala`, 06-28); EN-половина может быть заметно короче RU (на 06-26 не хватало трёх секций целиком) — считай объём отдельно по языкам, а не только RU; сверху вниз (по убыванию, «начни с самых новых», пропуская 5 ручных статей) обработаны 09-12 (две) и 09-11 (две). При расхождении инструкции и памяти спроси: 2026-08-05 запланированная задача несла «по возрастанию», а память к тому моменту уже была переписана на «по убыванию» — пользователь подтвердил возрастание.

Файлы будущих постов физически лежат в `.blog-embargo-backup/future-posts/`, когда эмбарго в режиме `held` (см. [[check-blog-embargo-before-deploy]]) — правь их там же; при `held` в `blog/posts/` остаётся около 87 файлов вместо 181, и сборка это отражает. Перед правкой сверься с этим списком. См. [[article-writing-skill]] и [[blog-writing-workflow]].

## Memory: blog-set-updated-on-edit.md

---
name: blog-set-updated-on-edit
description: "Правя уже опубликованный пост blog/posts/*.md, всегда ставить frontmatter-поле updated: с датой правки"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 8da5b98a-9f05-4c72-88e7-7f49099be701
  modified: 2026-08-17T03:08:17.041Z
---

Когда правишь **уже опубликованный** пост в `blog/posts/*.md` (пост был в индексе поисковиков до правки), добавляй во фронтматтер поле `updated: YYYY-MM-DD` с сегодняшней датой — даже если пользователь прямо не попросил, это часть обычной правки такого поста.

**Как это работает:** `date:` — исходная публикация, не трогать. `updated:` (если стоит и позже `date:`) даёт:
- строку «Изменено ‹дата›» под текстом статьи (RU/EN),
- `dateModified` в JSON-LD `BlogPosting` — сигнал свежести для Яндекса/Google,
- `<meta property="article:modified_time">`.

Механизм в [build-blog.js](../../../../Documents/trace-logos/scripts/build-blog.js) (`parseUpdated`, `updatedNoteHtml`), реализован 2026-08-17. Без поля пост рендерится как раньше — никакой автоматики по git/mtime нет специально: массовые билд-коммиты трогают разом все посты и проставили бы всем одну дату, хотя текст не менялся.

**Why:** пользователь публикует пост, тот попадает в индекс, а потом в него вносят фактические правки (пример: обновление логотипа Instagram в августе 2026 после того, как пост про историю лого вышел раньше). Без видимой даты изменения читатель из поиска не понимает, что видит актуальную версию, а не устаревшую.

**Не путать с** [[blog-posts-do-not-touch]] — тот список про «не трогать текст без разрешения», это правило — про техническую метку, когда правка УЖЕ согласована/сделана.

## Memory: blog-writing-workflow.md

---
name: blog-writing-workflow
description: "How the user wants new Trace Logos blog articles written — style, structure variety, and the build/verify workflow"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: eccbb7c1-b25b-4fce-b7be-f1fa4ac18d04
---

The user repeatedly asks for batches of new blog articles ("напиши еще N статей ... актуальные темы на 2026 ... глянь в интернете"). Established pattern:

- **Length/format (CORRECTED 2026-08 — was ~1200-1600 words, now stricter):** target **8-15 minutes reading time, not shorter and not longer** — user's explicit rule, added to the shipped skill (`article-writing/SKILL.md`). The site's `{{READ_TIME}}` counter uses 180 words/min (`readTime()` in `scripts/build-blog.js`), so that maps to **≈1450-2700 words** of article body (excluding frontmatter/heading/widget captions). Under 8 min → topic underdeveloped or too thin for its own post; over 15 min → failed the strong-text pass (cut boosters/filler) or should split into two posts. Check by word count, not by eye, and check RU and EN halves separately since they can drift in length during translation. RU body + `---EN---` + full EN mirror. Frontmatter needs `title/title_en/description/description_en/date/slug/tags/tags_en`.
- **Interlinking (very important to user):** dense links to existing posts (`../slug/`) and catalog pages (`../../logos/<cat>/<slug>/`, `../../emoji/`). Link every brand mention, every occurrence — see [[blog-brand-mentions-must-link]]. Cross-link new posts within the same batch. Verify catalog paths exist on disk before linking (grep prior-used links; test-links catches breaks anyway).
- **Style (user asked 2026-08, re Yandex SEO):** do NOT reuse an identical template across posts — Yandex can flag near-duplicate structure as low-quality. Vary: distinct narrative HOOK up front (a scene, stat, myth, famous example), smooth reveal, engaging to the end. Rotate the closing heading ("Что в итоге"/"Итог"/"Если коротко"/"Что запомнить"), don't put the `:::note Коротко` box on every article. Still use the markdown toolkit (callouts `:::tip/warning/note`, tables, TOC auto at ≥3 `##`).
- **SURFACE THE THESIS BEFORE WRITING (user 2026-07-22, editing existing posts):** don't just form each article's one-sentence thesis internally — STATE it explicitly to the user (one line per article: «slug — тезис: …») and, for a batch, ideally get a nod before touching files. The user noticed a rewrite session where theses were never surfaced and asked "а че ты тезисы не определял?". Reason: a one-line thesis is the cheapest checkpoint — correcting a wrong through-line costs one line, not a rewritten 1600-word article. Formulating the thesis first is already the canonical form below; this adds: make it visible, not silent.
- **CANONICAL FORM — use THIS; everything below is derivation + diagnostics (user's final, deliberate stopping point 2026-09).** The whole long thread about coherence collapses to three things:
  1. **First formulate the THESIS in one sentence** — the idea everything is built around. Not necessarily a "conclusion to prove": a text may explain, explore, compare, or tell a story, but it always has a thesis (e.g. "A logo isn't a picture but a tool of recognition"; "Skeuomorphism didn't return by accident"; "Minimalism didn't die, it took a different role").
  2. **Every fragment must strengthen that thesis.** Everything serves the thesis (not "holds up a final conclusion" — "thesis" is the more universal frame).
  3. **Every next fragment must follow naturally from the previous one.**
  The ONE editorial test that removes subjectivity (better than "necessity" — no guessing what the reader "needs"): **"if I remove this fragment, does the thesis get weaker?" Yes → keep. No → delete.** All the named rules — "поэтому"/therefore, swap, delete, retelling, information gap, Given→New, "inevitable", live-conversation — are NOT the foundation; they're diagnostic tools that show where the architecture cracked. Stop refining here: good theory ends where it can't be made simpler without losing meaning; going further just re-splinters it into smaller rules.
- **COHERENCE — critical (user pushback 2026-09, cited discourse-coherence / cohesion research):** the earlier batches read as fact-dumps — "ФАКТ. ФАКТ. ФАКТ." — because they leaned on bulleted parallel sections ("вот 3 причины", "что работает: •, •, •"). Formally on-topic, but no through-line; the reader gets bricks and has to build the house. FIX: write a causal chain where each sentence/paragraph answers the previous one's "и что?" — problem → why it arises → mechanism → consequence → therefore → conclusion. Lead the reader by the hand. Concretely: (1) minimize bullet lists — convert "here are N factors" into flowing prose where each factor *causes or enables* the next ("...но одной усталости мало: пока это было дорого технически, ничего бы не вернулось. А потом подтянулись экраны — и..."); keep a list ONLY when items are genuinely non-sequential (a checklist), and wrap it in narrative. (2) Add connective tissue between sections — each `##` should pick up where the last ended, not start cold. (3) Each section answers a real question the previous section raised. LLMs generate locally-good sentences but drop global structure — this is exactly that failure mode; watch for it. Rewrote `skevomorfizm.md` as the reference example of the fixed style.
- **COHERENCE mechanics (user follow-up 2026-09, cited Given→New, topic chains, cognitive load, NN/g):** lists are NOT the enemy — missing cause-effect is. Concrete levers to apply: (1) **Given→New** — each sentence opens with what the reader already knows (the previous sentence's topic) and only then adds the new thing; don't start each sentence on a fresh subject. (2) **Topic chain** — keep the SAME grammatical subject recurring ("Логотип… Этот знак… Поэтому знак…") instead of hopping logo→Apple→history→designer→study; the brain shouldn't have to re-find what the passage is about. (3) **Self-questioning progression** — the text raises the reader's next question and answers it: тезис → «почему?» → ответ → «но одной причины мало, что ещё?» → ответ → следствие → вывод. Use an occasional EXPLICIT question as a hinge, but not every paragraph — the reader should feel the pull, not see the scaffolding. (4) NN/g truth: people scan the PAGE but READ the story — once hooked they want logic, not fact-cards. A list is fine only when its items are a genuine set AND it's framed as the answer to a posed question or chained causally.
- **THE single law (user's sharpest formulation 2026-09):** don't treat Given→New / topic-chain / self-question as a checklist — they are all consequences of ONE law: *each sentence and each paragraph must ARISE FROM THE PREVIOUS ONE.* Get that right and the rest follows automatically (sentence opens on old info, topic doesn't hop, the next question is born on its own, the conclusion feels inevitable). The engine that drives it is the **Information Gap**: the brain hates an open loop, so each answer should open the reader's next question — "Skeuomorphism returned." → *why?* → answer → *why now specifically?* → answer → *what does it mean for me?* → answer. That's what makes an article "read itself." A cold "In 2013 Apple…" after an unrelated sentence makes the reader think "why are you telling me this now?" and attention drops. **THE TEST for every paragraph before writing it: "if I delete this paragraph, would the reader be left with a question it answers?" If no — the paragraph exists only because I recalled another fact; cut it.** The bar isn't amount of information — it's that every paragraph feels inevitable: the reader thinks "yes, that's exactly what I wanted to know next," never "oh, another interesting fact." This is the characteristic LLM failure (knows thousands of facts, doesn't always know which one is needed *right now*) — guard against it explicitly.
- **THE root rule (user's final grounded form 2026-09 — not a technique or checklist, it's the causality of thinking):** *every next thought must feel INEVITABLE to the reader.* That one word unifies everything below: paragraphs can't be swapped because the next one is inevitable; can't be deleted because without it the next stops being inevitable; "поэтому" fits because the next inevitably follows; the retelling is one idea because the whole chain worked toward one conclusion; the reader never loses the thread because each link inevitably continues the last. So the single operative question after every sentence, paragraph, and section is NOT "what else can I tell?" but **"what must now inevitably be said?"** Even a historical aside proves the point: "In 1984 a designer…" grates not because it's history but because it doesn't inevitably follow — yet reframed so it does ("Minimalism became the norm. But it wasn't always so. To understand why it appeared at all, we go back to 1984…"), the same aside stops being an insertion and becomes inevitable. (The earlier "born half a second before the author says it" is the same idea, just more aphoristic — prefer "inevitable" as the working word.) But one word sits ABOVE "inevitable": **necessity.** "Inevitable" describes the reader's *feeling*; "necessary" describes the author's *decision* — and the author can only act on the second. So the actual working question is not "how do I make the next paragraph inevitable?" but **"what is NECESSARY to say now so the reader can understand the next thought?"** A story, a study, an example, a statistic — each faces the same question: is it necessary right now? If the answer is "no, it's just interesting," it's garbage; if "without it the next conclusion hangs in the air," it's necessary. That's why good editors ruthlessly cut beloved passages — not because they're bad but because they aren't needed. Final formulation: **there must be nothing in the text that isn't necessary for the birth of the next thought** — remove any element and the chain breaks; if it doesn't break, the element was optional. This is literally dramaturgy: every scene exists only because the next one can't exist without it — which is why strong articles read like short stories, not like lecture notes. (Don't turn "necessity" into a new mantra either — it's the author's lens, not a slogan to chant.)
- **TOP LEVEL — measure necessity against the MAIN CONCLUSION, not the next paragraph (user's final elevation 2026-09):** "what's necessary for the NEXT thought?" still looks at the neighbor. But the goal was never the next thought — it's the article's ONE main conclusion. So the real question is: **"without what can the reader NOT accept the main conclusion?"** This turns the linear chain A→B→C→D into an ARCHITECTURE: the conclusion is the apex, every paragraph is a support holding it up. Load-bearing test: remove a support — if the apex doesn't fall, it was decorative; if it falls, it was structural. This is why a paragraph that doesn't lead straight to the next one is still allowed when it sharply strengthens trust in the conclusion — a strong example, an apt analogy, a short story: locally it doesn't "move the plot," but it makes the apex more stable. So each element must be necessary not only to the next element but to the whole construction. The ultimate question (this is no longer a writing rule — it's the definition of persuasive reasoning): **"what does the reader need right now so that at the end they say, on their own: 'Yes, there could be no other conclusion here'?"** Practical consequence for these rewrites: decide the article's one-sentence conclusion FIRST, then keep only what is load-bearing for it. The whole thread went from a style complaint to a definition of *thinking*; the same applies to a talk, video, landing page, conversation — all check one thing: does the author have a line of thought?
- **THE fundamental principle (user's refined final form 2026-09):** do NOT enshrine "what does the reader want to ask now?" as the master rule — it's useful but has a trap: it pushes toward a mechanical "почему?→потому что" chain and predictable writing. The broader, truer principle: **each next paragraph must be the ONLY natural continuation of the previous one.** The continuation is NOT always an answer to a question — sometimes it's an example, sometimes a counter-argument, sometimes an unexpected exception, sometimes a consequence. What they share: the reader never thinks "where did this come from?" So vary the move (answer / example / objection / exception / consequence) — don't lock into Q→A.
- **Section links must not be a cold start OR a duplicate (user correction 2026-08).** The rule "each `##` picks up where the last ended, not cold" (§21 below) needs a second half: picking up ≠ restating. Don't paraphrase the previous section's closing idea as the new section's opening sentence — the user's words: "каждый абзац не должен дублировать... подхватывать... но не слишком тупо. чтобы это читалось честно, а не дубли одни." Test: if the new section's first sentence could replace the old section's last sentence with no loss of meaning, it's a duplicate, not a link — reads as dishonest because the reader just read it. A real link names what the prior section concluded and immediately moves past it in the same breath, rather than re-stating the conclusion as its own sentence before moving on. Updated in the shipped skill (`coherence.md`'s "Связки между секциями", `SKILL.md`).
- **THE 3-test architecture check (user's consolidated system 2026-09 — run all three on a draft):** these check the text's *architecture*, not its style; pass all three and it feels whole even in plain language.
  1. **Swap test.** Try swapping two adjacent paragraphs. If the article barely changes → bad. In strong writing you can't reorder: para 2 exists only because of para 1, para 3 only because of 2. "ФАКТ! ФАКТ!" text shuffles like a deck of cards — that's the failure mode.
  2. **Delete test.** Remove any paragraph, then read the next one. If it still reads fine → the deleted paragraph was optional (an "interesting fact," not a link in the chain) → bad. In a strong chain A→B→C, cutting B must break the jump A→C.
  3. **Conjunction test (the strictest, CORRECTED 2026-08 — not just "поэтому").** The user pushed back on treating "поэтому"/therefore as the one required connective: "не обязательно поэтому... можно вставлять любой союз мысленно: и / затем чтобы / как / поэтому и тд." The relation between two paragraphs isn't always causal — it can be purpose (чтобы), comparison (как / так же как), sequence (затем / после этого), contrast (но / однако / хотя), explanation (то есть / ведь), or a genuinely illustrative example (например, when it truly illustrates the prior point, not padding). Mentally insert WHATEVER connective actually matches the relationship. If some real connective fits naturally → the link is real → good. If nothing fits except filler ("кстати / также / вообще / ещё / кроме того") → the chain already tore. This generalizes and supersedes the earlier "поэтому-only" framing — updated in the shipped skill too (`.claude/skills/article-writing/references/coherence.md` test 3, and `SKILL.md`'s checklist/proof-read-pass wording).
  Everything else (Given→New, topic chain, information gap, live-conversation, "only natural continuation") just describes what passing these three produces.
- **DON'T write to the checklist — write the thought, use the tests only as a debugger (user's closing point 2026-09).** The whole thing collapses to ONE idea: *an article is a chain reaction — each paragraph inevitably triggers the next.* Everything above is only an unpacking of that. Critical distinction: when you write TO a checklist, the text smells like an algorithm; when you write a genuine thought and use the 3 tests only for REVIEW afterward, it stays alive. So: draft freely first, then debug — if paragraphs can be swapped, where did the chain break? if one can be deleted, why does it exist? if "поэтому" won't fit, which causal link is missing? Do not mechanically pre-plan a "почему→потому что" skeleton.
- **The "Retelling" test (the most merciless, final check):** after reading, could someone summarize the article in ONE sentence? If they say "there were lots of interesting facts about logos…" → it failed. If they say the one connected idea (e.g. "skeuomorphism came back not because designers missed volume, but because several factors coincided — fatigue with minimalism, hardware stopped limiting interfaces, and Apple set a new reference") → it had a single thesis, not a collection of facts. THIS is what separates a strong article from an ordinary one: after reading, ONE idea remains in the head, and everything else existed only to make that idea obvious. Every article should have one such sentence, decided before writing.
- **Topics:** current-2026 angles, checked via WebSearch. Pull real gaps not already covered (site has 100+ posts on logos + emoji). Mix trend pieces, practical use-cases, and branding fundamentals for variety.
- **Dates (as of batch dated 2026-09):** the user publishes new posts gradually to avoid a Yandex spam flag. Give NEW posts FUTURE dates staggered ~2-3 per day; NEVER change existing posts' dates. Find the current max `date:` across blog/posts (`grep -h '^date:' blog/posts/*.md | sort | tail`) and start the new batch the day after it. build-blog renders all posts regardless of date; the date is just the displayed/sort value the user filters on when publishing.

**Build/verify workflow after writing MD files:**
1. `npm run build` — grep output for `битых целей` (must be 0) — this runs build-blog, EN mirror, sitemap, test-links.
2. `node scripts/build-blog-og-images.js` — generates `assets/og/blog-<slug>.png` per post (Puppeteer). Required or social previews are broken.
3. Verify each slug has `blog/<slug>/index.html`, `en/blog/<slug>/index.html`, `assets/og/blog-<slug>.png`.

Do NOT commit or deploy unless asked. Deploy is `vercel --prod --yes --archive=tgz` — see [[hosting_vercel_reactivated]].

## Memory: check-blog-embargo-before-deploy.md

---
name: check-blog-embargo-before-deploy
description: "CRITICAL — future-dated blog posts must NEVER reach prod. Archive deploys go through scripts/publish-scheduled-posts.js (hold → deploy → restore); a git-connected Vercel project is a SEPARATE leak path — any commit/push to a git-connected repo ships whatever is in the working tree at commit time, hold state or not"
metadata: 
  node_type: memory
  type: feedback
  modified: 2026-08-08T08:53:25.193Z
  originSessionId: cfb5cebc-43bd-4c4f-becf-7c3c3695e4df
---

**THE RULE, NO EXCEPTIONS: future-dated posts (`blog/posts/*.md` with `date:` in the future) must never be reachable on trace-logos.ru.** Every procedure below exists to serve that one rule — if a new deploy mechanism is added and it isn't obviously covered by one of these procedures, treat it as unsafe until proven otherwise (test with a spot-check `curl` on a known-future slug, see bottom).

Before running `vercel --prod --yes --archive=tgz` (or any prod deploy) from this repo, check whether `blog/posts/*.md` contains posts whose frontmatter `date:` is in the future. `vercel --prod --archive=tgz` uploads the entire working directory as-is, regardless of git-tracked status — it does not know or care that some posts are "not due yet."

**Why this matters — three separate incidents, three separate failure modes.**
1. **2026-07-25 — leaked to prod.** A full deploy at 07:10 MSK shipped all 176 posts live, including ones dated through 2026-09-12, because future `.md` files (and their already-built `blog/<slug>/index.html`) were sitting in the tree at deploy time.
2. **2026-07-28 — nearly lost locally.** During the SAME cleanup work, `.blog-embargo-backup/` got dropped from `.gitignore` in the working tree (accidental, not via any git command — just vanished from a manual edit pass). If that change had been committed before a `restore` cycle finished, the temporarily-held future posts sitting in `.blog-embargo-backup/future-posts/` risked being swept up by a careless `git clean`/`git add -A`, since the dir would no longer read as ignored. Caught by `git diff .gitignore` before any commit; fixed with `git checkout -- .gitignore`. No data was actually lost, but it was close.
3. **2026-08-08 — near-leak via git-connected Vercel, caught before going live.** During the Vercel account migration ([[hosting-vercel-reactivated]]), a new GitHub repo was connected to the new Vercel project for git-push-triggered deploys. The commit that got pushed was made **after** an `embargo restore` (correctly — committing during a `hold` would have committed the *deletion* of 86 future posts, an even worse outcome) — but that means the commit's working tree had the full, un-embargoed post set. The push auto-triggered a Vercel Production build with all future posts included. Caught while it was still `Building` (not yet aliased to the live domain) and killed with `vercel remove <deployment-url>` before it went live; spot-checked with `curl` on a known-future slug (404, confirmed safe) after. **A git-connected Vercel project has NO awareness of `publish-scheduled-posts.js`'s hold state at all** — `git push` bypasses the entire hold→deploy→restore procedure below, because Vercel builds directly from whatever was committed, not from a locally-orchestrated archive upload.

**The tool now:** [scripts/publish-scheduled-posts.js](../../../../Documents/trace-logos/scripts/publish-scheduled-posts.js) — written 2026-07-28 specifically to make this mechanical instead of a manual multi-step agent job. It does NOT deploy — deploy stays a manual, explicit step the user runs themselves.

```
node scripts/publish-scheduled-posts.js status    # read-only report, always safe
node scripts/publish-scheduled-posts.js           # hold: moves future posts to .blog-embargo-backup/, strips forward-links, runs npm run build
vercel --prod --yes --archive=tgz                 # manual, deliberate
node scripts/publish-scheduled-posts.js restore   # MANDATORY — un-holds everything, restores links, rebuilds full tree locally
```

**Non-negotiable rules when touching this flow:**
- **Never call `restore` and treat the job as optional.** `hold` without a matching `restore` leaves the working copy missing every future post — that's the "lost" failure mode. The script refuses a second `hold` while one is already active (`state.json` guard), specifically to stop this from compounding.
- **Before any `git add`/`git commit` while `.blog-embargo-backup/` might exist, run `git diff .gitignore` and `git status --porcelain` first.** Confirm `.blog-embargo-backup/` still ends in `.gitignore` and that nothing under it appears in `git status`. If the ignore line is missing, `git checkout -- .gitignore` restores it (verified fix, 2026-07-28).
- **Don't hand-delete anything under `.blog-embargo-backup/`.** If a hold looks stuck or wrong, run `status` first to see `state.json`'s account of what's held, then `restore` — don't manually `mv`/`rm` files back, that's exactly how the slug/link accounting drifts.
- The script's own `hold` guards against exactly incident #1 (won't build with future posts in the tree once held) but the deploy step itself is still manual and unprotected — nothing stops a `vercel --prod` run BEFORE calling `hold`, or a run from a second terminal while a hold is active elsewhere. Always `status` first if unsure of current state.

**How to apply:** Before any manual deploy that touches blog content: run `status`, and if there's a due batch or existing posts to protect, run the hold→deploy→restore cycle above in full, in order, no skipped steps. This is about deploy *hygiene* and *data safety*, not deploy *timing* — [[dont-nag-seo-ops]] still applies to not nagging about *when* to deploy.

**Explicit user instruction (2026-07-28, clarified 2026-08-28): whenever the user asks for a deploy in this repo, run it through `scripts/publish-scheduled-posts.js`, not a bare `npm run build` + `vercel --prod`.** The build itself has zero date awareness — it builds whatever `.md` files happen to be sitting in `blog/posts/` at that instant, future-dated or not, and a plain deploy afterward ships all of them. This came up because the user ran a raw build directly and got confused by a stale post count (171) left over from mid-session testing — the takeaway wasn't "the count was wrong," it was "don't run the raw build/deploy path for this repo at all." Default to: `status` → `hold` (which itself calls `npm run build`) → deploy → `restore`. Only skip the script if the user explicitly says this deploy has nothing to do with blog content and confirms no embargo is needed.

**Explicit user instruction (2026-08-08, said with maximum possible force after the near-leak above): future posts must NEVER go to prod, full stop — no procedural nuance, no "well the mechanism was different this time" excuse.** This extends the 2026-07-28 instruction to cover mechanisms that don't go through `publish-scheduled-posts.js` at all:
- **A `hold` must never be committed as the repo's state.** If `hold` is active and a commit is needed for any reason (account migration, unrelated fix, whatever), `restore` first — an active `hold` committed as-is *permanently deletes* future posts from history, which is worse than a leak.
- **Any git-connected Vercel project auto-deploys on push, independent of local hold/restore state.** Before pushing to a branch that a Vercel project auto-deploys from: run `publish-scheduled-posts.js status` first — if there are future posts pending (there almost always are, currently 86), a plain commit+push of the full working tree WILL ship them the moment Vercel finishes building, no manual `vercel --prod` step required as a checkpoint. There is currently no `hold`-aware equivalent for git-push deploys — either don't connect a git-triggered deploy path in this repo without first building one, or manually watch the deployment (`vercel ls`) and kill it (`vercel remove <url>`) with `vercel inspect`/API `readyState` while `Building`/`BLOCKED`, before it aliases to the live domain, if a leak risk is discovered after the push already happened.
- **After ANY deploy (archive or git-push), spot-check before calling it done:** pick a slug from a post with a future `date:` (`grep -l "date: 2026-XX-XX" blog/posts/*.md` for a date past today) and `curl -s -o /dev/null -w "%{http_code}" https://trace-logos.ru/blog/<slug>/` — must be `404`. Don't just trust that the hold/restore cycle ran; verify the live result. This is now a mandatory last step of any deploy in this repo, not an optional nicety.

## Memory: css-parity-guard.md

---
name: css-parity-guard
description: "test-css-parity.js guards CSS for main.js's unconditional DOM effects across the 4 pages that load main.js"
metadata: 
  node_type: memory
  type: project
  originSessionId: beedba0e-1afc-4e93-b2d9-ed447c60e01a
---

`scripts/test-css-parity.js` runs in `build-all.js` (step 4, right after `test-js.js`). It checks that `logos/index.html`, `emoji/index.html`, `icons/index.html`, and `templates/category-page.html` — the four sources that load `js/main.js` as a `<script type="module">` — all include a fixed list of CSS files (`confetti.css`, `easter-amongus.css`, `easter-google.css`, `easter-minicrewmate.css`, `microanim.css`).

**Why this list specifically:** these are the CSS files for DOM that `main.js` creates or toggles *unconditionally* (e.g. `js/easter-amongus.js` always appends a runner `<img>` to `document.body` when the right variant is clicked, `initSidebarIndicator` always builds `.nav-indicator-pill`), regardless of what's on the page. Deliberately excludes `filters.css`/`category-seo.css`/`support-btn.css` — those style markup that legitimately may not exist on a given page (e.g. no format filter on emoji pages), so their absence isn't a bug by itself.

**Origin incident (2026-07-28):** `templates/category-page.html` was missing all three easter-egg CSS files. `js/easter-amongus.js` still ran on `/logos/games/` (or any category page) and injected the runner sprite into `<body>`, but with no `position: fixed`/`z-index` it rendered as a plain inline image — invisible without scrolling, and it widened/heightened the page (perceived as "catalog width shrinking" — actually a scrollbar appearing). Sound played (audio isn't CSS-gated) but no visible character. Same root cause silently broke the Google-assemble easter egg on category pages, and the sidebar's sliding nav-indicator pill on category/emoji/icons pages.

**How to apply:** when adding a new effect to `js/main.js` that creates/toggles DOM unconditionally (not gated by page-specific markup), add its CSS file to the `REQUIRED` array in `scripts/test-css-parity.js` — don't rely on remembering to copy the `<link>` into all 4 HTML sources by hand, that's exactly how this bug happened. See [amongus-easter-egg](amongus-easter-egg.md).

## Memory: dont-nag-seo-ops.md

---
name: dont-nag-seo-ops
description: "Don't repeatedly raise www-404, deploy timing, or link-building — the user manages these himself"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 9896e809-af0b-42f8-b802-c233f0fe27f9
---

Stop bringing up these three topics unprompted — the user was explicitly annoyed by repeated mentions:

1. **www / «сайт 404»** — the site opens fine. A `curl -sI https://www.trace-logos.ru/` returning 404 from THIS machine is a local/proxy artifact (the user runs a proxy — «Прокси запущен» in the menu bar), NOT a real outage. Do not diagnose, warn about, or ask to fix the www redirect.
2. **Deploy timing** — never nag «нужно задеплоить / задеплоить?». The user deploys to Vercel himself when he decides it's time. State that changes are built/ready and stop there. See [[hosting_vercel_reactivated]].
3. **Link building / ссылочная масса** — don't recommend backlinks (Habr, vc.ru, Figma Community, TG подборки, etc.). The user will add link mass when he wants.

**Why:** these are his operational decisions, not gaps to flag. Repeating them reads as nagging.

**How to apply:** finish SEO/code work, report what was done, and stop. Mention deploy/links/www only if he asks directly.

## Memory: doodlejump-easter-egg.md

---
name: doodlejump-easter-egg
description: "Doodle Jump live-preview easter egg — real Phaser engine (not a custom clone), widget, lightbox, attract-mode bot, files"
metadata: 
  node_type: memory
  type: project
  originSessionId: d80b1cec-6af4-4600-b299-522a0a9aa66e
---

The Doodle Jump logo page has an easter egg: opening its detail panel (`item.figma === 'Icon/Game/DoodleJump'` in `js/main.js`'s `openDetailFn`) calls `showDoodleJumpWidget()` from `js/easter-doodlejump.js`; closing the panel or switching to another item calls `hideDoodleJumpWidget()`.

**Also fires on the item's own SEO page** (`logos/game/doodlejump/`, not just the catalog detail panel) — added on request 2026-07-29. That page runs `js/seo-page.js`, not `js/main.js`, and has no detail-panel lifecycle at all, so the widget can't reuse the `openDetailFn` hook; instead `templates/seo-page.html` gained two conditional placeholders — `{{EASTER_EGG_CSS}}` (in `<head>`, after `confetti.css`) and `{{EASTER_EGG_SCRIPT}}` (right before `</body>`) — populated in `scripts/build-seo-pages.js` only `if (item.figma === 'Icon/Game/DoodleJump')`, same conditional-placeholder pattern already used there for `SPONSOR_CSS`/`SPONSOR_SECTION`. The injected script is a one-line `<script type="module">import {showDoodleJumpWidget} from '/js/easter-doodlejump.js'; showDoodleJumpWidget();</script>` — no hide call needed since it's a plain static page, not an SPA (navigating away unloads everything). Every other item's SEO page gets empty strings for both placeholders, so nothing changes there. **Not added to `test-css-parity.js`'s `REQUIRED` list** — that list is for CSS main.js needs unconditionally on any page it might run on; this is the opposite shape (one specific page, injected at build time only for that one item), matching the `SPONSOR_CSS` precedent, not the parity-guard one.

**Engine: the real official Lima Sky Doodle Jump HTML5 build, not a custom clone.** First version (2026-07-28) was a stripped p5.js clone built from a GitHub `DoodleJump-master` project the user provided — user reported it "broken, lacking dynamics" after comparing to the real doodlejump.org. Rebuilt 2026-07-29 by extracting the actual engine doodlejump.org itself runs: Phaser 2.6.2 + a game bundle (`doodle.min.js`, obfuscated but decipherable) loaded from `cdn.jsdelivr.net/gh/gracehuynhh/doodlejump`, with real assets (atlases, sounds, bitmap fonts, data) served from `doodlejump.org/assets/*`. All fetched via `curl` and vendored locally at `assets/easter-egg/doodlejump/` — `libraries/phaser.min.js`, `libraries/fulltilt.min.js` (device-tilt lib, harmless to keep even though unused), `lib/doodle.min.js` (untouched engine logic — GameState/MenuState/ScoresState etc.), `assets/{images,audio,fonts,data}/*` (atlases/sprites/mp3s/bitmap fonts — `.ogg` variants dropped, they 404 on the source and mp3 already covers all browsers).

**`lib/boot.js` is the only hand-written glue**, built from three real, hard-won lessons:
1. **`game.sound`/`game.input` are `null` until Phaser's own async boot finishes** (device detection etc.) — touching them synchronously right after `new Phaser.Game()` throws and silently kills the rest of the script (this was the actual root cause of the widget looking permanently "stuck" — not a preview-tool artifact, though a frozen-rAF headless preview tab masked/mimicked the same symptom and cost real debugging time before the true cause was found via a real focused Chrome tab). Fix: defer everything touching `game.sound`/`game.input` inside `Doodle.game.state.onStateChange.addOnce(fn)` — fires once, after boot.
2. **`Doodle.PreloadState` is fully replaced**, not reused. The real one shows a ~1.4s+ branded Lima Sky/CloudGames splash-and-tween animation before Menu — user explicitly asked to remove it. Replacement loads the identical asset list (copy the exact `this.load.*` calls, or GameState/MenuState break) but skips the splash sprites/tweens and calls `this.state.start('Menu')` the instant `this.load.onLoadComplete` fires.
3. **`game.sound.mute` doesn't stick from a one-time assignment** — Menu/Game states read a stored `DJ_soundToggle` preference from `localStorage` on their own and silently reset `game.sound.mute`, undoing an earlier mute call. Attract mode (the small widget) must NEVER be audible — only the fullscreen lightbox (`?mode=play`) has sound. Fix: re-assert `Doodle.game.sound.mute = true` on every tick of the attract-mode polling interval, not just once at boot.
4. **Phaser's own state transitions call `keyboard.reset()`, which wipes `onDown`/`onUp` signal bindings on every Key object** — a WASD binding added via `key.onDown.add(...)` right after boot silently stops firing once Menu/Game loads (confirmed: `onDown._bindings.length` was 0 after the state settled). Direct `.isDown` writes on the Key object survive fine (same object reference persists across resets, only its own state/signals get cleared) — that's how touch-button movement and the attract-mode bot work. But event-driven bindings don't survive. Fix: WASD uses plain `document.addEventListener('keydown'/'keyup', ...)` with `e.code === 'KeyA'/'KeyD'`, not Phaser Key signals.

**Behavior:**
- `?mode=attract` (the widget, 635×955 internal Phaser resolution scaled via CSS `transform: scale(0.252)` to ~160×240px): boots straight past Menu into gameplay, a simple bot (`mobileMoving(Math.random()<0.5)` on a 350-800ms random cadence) steers left/right — no access to the obfuscated engine's internal platform-position state, so it's a randomized wiggle rather than real platform-tracking, which reads fine as "someone playing" at the small scale it renders at. Death doesn't change `game.state.current` (the built-in "Play Again" button just shows a `gameOverGroup` overlay while still in the `Game` state and restarts via `state.start("Game")` on itself) — the same polling interval checks `gameState.gameOverGroup.visible` and drives that same restart call. Always muted.
- `?mode=play` (the lightbox, opened by clicking the widget): real official Menu → Play → Game → Scores flow, arrow keys + WASD (`A`/`D`) + on-screen touch buttons (only shown when `'ontouchstart' in window || navigator.maxTouchPoints > 0` — no arrows cluttering desktop), full sound.
- `js/easter-doodlejump.js` — widget/lightbox DOM management (`.dj-widget`, `.dj-lightbox`), idempotent create/destroy.
- `css/easter-doodlejump.css` — added to `REQUIRED` in `scripts/test-css-parity.js` (the widget can be triggered from the games category page or the main catalog, not just the item's own SEO page) and linked in all 4 sources that load `main.js`: `templates/category-page.html`, `logos/index.html`, `emoji/index.html`, `icons/index.html`.

**Follow-up round (2026-07-29, same day):** four more fixes/features on top of the above.
- **Widget flies in from the left** on show: `@keyframes dj-fly-in` (`translateX(-220px)→0` + opacity) applied directly on `.dj-widget` in `css/easter-doodlejump.css`, replays every time the widget is (re)created since it's a fresh DOM element each time.
- **Attract-mode bot pauses while the lightbox is open** — was previously running/animating uselessly behind it. `js/easter-doodlejump.js`'s `openLightbox()`/`closeLightbox()` `postMessage({type:'dj-pause'|'dj-resume'}, location.origin)` to the widget iframe's `contentWindow`; `lib/boot.js` listens on `window` and toggles `Doodle.game.paused` (stops Phaser's whole update/render loop — real CPU savings, not just skipped input) plus a local `djPaused` flag that gates the wiggle/restart-poll timers from doing pointless work while paused.
- **"TAP TO CHANGE" is a baked English image (atlas frame `"tapToChange"`, 230×134 at (410,510)), not text** — can't localize in place. `lib/boot.js` monkey-patches `Doodle.GameState.create` (before `state.add`, same object either way) to call the original then `this.tapToChange.visible = false` + add its own `game.add.text(...)` Russian label ("нажми, чтобы\nизменить имя →") anchored over the same spot. Same patch pattern used for `writeScore` (leaderboard submit) and `ScoresState.create` (leaderboard fetch) below.
- **Name-input bug, root cause: `<label style="display:none">` wrapping `#highscore`.** The engine calls `document.getElementById("highscore").focus()` from a tap handler on the "your name" area — `display:none` makes an element (and all descendants) unfocusable, so the call silently no-ops and typing never worked. doodlejump.org's own CSS avoids this via a CSS bug of its own (`display: 'none'` — quoted string, invalid property value, browser ignores it) that happens to leave the input focusable while visually off-screen via `position:absolute; left:-100px`. Fix here: dropped the wrapping `<label>` entirely, kept only `<input id="highscore">` — `css/style.css`'s existing `#highscore { position:absolute; left:-100px; top:-100px; width:5px }` already does the (correct, non-buggy) off-screen-but-focusable positioning.
- **Global leaderboard, via existing Supabase project (`wezryybxxwicysnbmhkz`).** `ScoresState` already ships a fully-built "Local"/"Global" tab UI on the real engine (`globalButton`/`localButton`/`setLoad('global')`) — it was just never fed data (`this.dataTest` was always `undefined`). No new UI was built; `lib/boot.js` patches `ScoresState.create` to fetch `GET .../functions/v1/doodlejump-scores` once and assign `this.dataTest = [[name, score], ...]`, and patches `GameState.writeScore` to `POST` the same endpoint with `{name, score}` (guarded `!ATTRACT_MODE` — never submit from the bot). Backend follows the exact pattern of the existing `track` function: [supabase/migrations/20260729000000_create_doodlejump_scores.sql](../../../../Documents/trace-logos/supabase/migrations/20260729000000_create_doodlejump_scores.sql) (`doodlejump_scores` table, one row per player name, `submit_doodlejump_score` RPC keeps only the best score via `greatest()`, RLS enabled with zero policies — service-role-only, same as `logo_stats`), [supabase/functions/doodlejump-scores/index.ts](../../../../Documents/trace-logos/supabase/functions/doodlejump-scores/index.ts) (POST rate-limited 20/60s, GET top-20 rate-limited 60/60s, `checkRateLimit` from `_shared/rate-limit.ts`, `MAX_SCORE = 5_000_000` sanity cap), registered in `supabase/config.toml` (`verify_jwt = false`, matching the other public functions).
- **Deployed 2026-07-29.** Function deploy (`supabase functions deploy doodlejump-scores`) worked fine over HTTPS. `supabase db push` (raw Postgres on port 5432 to `db.<ref>.supabase.co`) failed on this machine — that hostname is IPv6-only and resolves to a bogus `198.18.x.x` placeholder locally (VPN/DNS interception on this network blocks/can't route direct DB connections; `aws-*.pooler.supabase.com`, used for IPv4, resolves fine, but `db push` doesn't offer a pooler fallback and using it needs the DB password, not just the CLI's access token). **Fix: `supabase db query --linked -f <migration.sql>`** — that subcommand explicitly routes through the Management API over HTTPS instead of a raw PG connection, same transport as `functions deploy`. Ran the migration file through it directly; confirmed applied via `information_schema.tables`/`routines` lookups afterward. Table and RPC now live; this bypasses the CLI's own migration-history bookkeeping (harmless here since every statement in the file is idempotent — `create table if not exists`, `create or replace function`, `grant` — so a future real `db push` reapplying it is a safe no-op). **If a future migration ever needs a genuinely non-idempotent statement on this network, use the same `db query --linked -f` route, not `db push`.**
- **CORS is intentionally locked to `https://trace-logos.ru`** — the `ALLOWED_ORIGIN` secret is shared project-wide (confirmed identical restriction already existed on the `track` function). `http://localhost:3010` gets a browser-level `Failed to fetch` from local dev — expected, not a bug; verified the endpoint works end-to-end by curling with `Origin: https://trace-logos.ru` directly (`{"ok":true}`, then GET returned the submitted row). Don't try to loosen this for local testing.
- **Cyrillic names don't render in the in-game "your name:" bitmap text — confirmed by live test, not just inspection.** `DoodleFont`/`DoodleFont2`'s `.fnt` files list only char ids 32–126 (pure ASCII) — no Cyrillic block. Live-rendered `gameOverStats2.text = 'your name:Рафаэль'` in a real browser: "your name:" showed, the name itself rendered as nothing (blank space, not tofu boxes — Phaser's BitmapText just skips glyphs it has no frame for). The underlying `this.name` string, `localStorage`, and the Supabase submission are all unaffected (plain JS strings/HTTP, no font involved) — only this one on-canvas label is blank for non-Latin names.
- **Fixed, same session, on request ("just use a regular font if they type in Russian").** `this.gameOverStats` (confirmed via 4 separate occurrences of `"your name:"+this.name` in doodle.min.js — that's the object, not `gameOverStats1`/`gameOverStats2`, which show "your high score"/"your score") is the one bitmapText showing the name, and it's reassigned every frame while the game-over screen is up (including live while typing — synced from `#highscore`'s value). `lib/boot.js` patches `Doodle.GameState.update` (wraps original, runs every frame, no-ops via early return when `gameOverGroup` isn't visible) — if `/[^\x00-\x7F]/.test(this.name)` (any non-ASCII, not just Cyrillic specifically), it resets `gameOverStats.text` back to the bare `'your name:'` label and shows the real name in a lazily-created `this.nameFallback` (`game.add.text`, regular canvas font, anchor `(0, 0.5)` to line up with `gameOverStats`' own anchor, positioned via `gameOverStats.x + gameOverStats.textWidth + 6`). Plain ASCII names are untouched — original bitmapText path still renders them, `nameFallback` stays hidden. Scope note: the Scores-list rows (Local/Global tabs, `ScoresState.spawnText`) use the same Latin-only bitmap font for player names too and have the identical blank-for-Cyrillic limitation — not patched (pooled/reused text-node architecture makes it a fair bit more involved than the single game-over label was), flag if it comes up.

**Debugging note for next time:** a headless preview tab (Claude_Preview MCP) can leave Phaser's rAF loop completely frozen (`game.time.time` never advances) even when there are zero console errors and every asset request returns 200 — looks exactly like "stuck loading" but is a tooling artifact from the tab not being genuinely visible/focused. When a Phaser/canvas-based embed appears frozen with no errors, switch to a real focused Chrome tab (Claude_in_Chrome MCP) before concluding it's a code bug — that's what surfaced the actual `game.sound`/`game.input` null-reference exception here, which the headless tab's silent freeze had been masking.

**The same rAF-freeze symptom came back on the Claude_in_Chrome tab itself** near the end of a very long session (many navigations, several local dev-server restarts, `computer-use.request_access` itself timing out after 300s) — `game.time.time` dead-stopped, a brand new tab showed the identical symptom, and clicking into the page didn't revive it. Read that as "the automation stack is worn down for this session, not a new code bug," especially if the exact same class of embed worked fine earlier in the same session. Don't keep spending time re-diagnosing at that point — fall back to static verification (`node --check`, code-pattern comparison against an already-proven-working patch in the same file) and say so plainly rather than claiming a live-pixel check that didn't actually happen. Also: the local dev server (`node server.js`, default port 3000) can go into a state where it accepts TCP connections but never responds (curl hangs to timeout) — if that happens mid-session, don't fight it, just start a fresh one on a different port (`PORT=3011 nohup node server.js &`).

**How to apply:** any future easter egg gated on a specific logo/item, triggered from the shared `openDetailFn`/variant-click code in `js/main.js`, needs its CSS added to `REQUIRED` in `scripts/test-css-parity.js` and linked in all 4 HTML sources — the same lesson as [[css-parity-guard]]. See [[amongus-easter-egg]] for the sibling sprite-animation-style easter egg this one's DOM-wiring pattern was modeled on.

## Memory: en-assets-yandex-stale-404.md

---
name: en-assets-yandex-stale-404
description: "/en/assets/... 404 в отчётах Яндекс.Вебмастера — старый баг, уже исправлен в коде и на проде"
metadata: 
  node_type: memory
  type: project
  originSessionId: ff58066c-16eb-4f72-bbda-beeac728bc52
  modified: 2026-08-06T03:54:07.179Z
---

Баг «EN-страницы ссылаются на ассеты по `/en/assets/...`, а `assets/` не зеркалируется под `/en/`» исправлен коммитом `bd49ccdc7` (fix: абсолютные пути ассетов на EN-зеркале главной, ~2026-07-22). Проверено на 2026-08-06: ни в текущей сборке (`en/`), ни на живом проде (`curl https://trace-logos.ru/en/logos/cloud/applecontacts/`) таких ссылок нет.

Если в новой выгрузке Яндекс.Вебмастера (`*.tsv` из «Исключённые страницы» / отчёт 404) снова всплывает `/en/assets/...` — это почти наверняка **стейл-индекс**, а не рецидив: Яндекс переобходит страницы медленно, и в отчёте видны URL с датами `первое/последнее обнаружение` до фикса. Сначала сверять дату обнаружения в TSV с датой коммита фикса, и curl'ить живую страницу-источник на `/en/assets/` перед тем, как чинить что-либо в коде.

**Why:** чтобы не тратить время на повторное расследование уже закрытого инцидента при каждой новой выгрузке отчёта Яндекса. См. также [check-blog-embargo-before-deploy](check-blog-embargo-before-deploy.md) — общий процесс проверки перед деплоем, сюда не относится напрямую, но обе заметки — про доверие к «свежести» данных перед действием.

## Memory: figma-plugin-ui-hot-reload.md

---
name: figma-plugin-ui-hot-reload
description: "Figma dev-mode plugins (at least Typograf) pick up ui.html edits instantly, no manual reload needed"
metadata: 
  node_type: memory
  type: project
  originSessionId: 6f3bcdf3-b862-4759-b762-83b23b6609c5
  modified: 2026-08-20T04:19:41.361Z
---

Editing a dev-mode Figma plugin's `ui.html` (e.g. `tools/figma-plugins/typograf/ui.html`) takes effect **immediately** in the already-open plugin window — Figma does NOT cache the old version. No "Plugins → Development → Reload" step needed to see changes.

**Why it matters:** when a user reports a visual bug against a just-edited `ui.html` and the CSS/JS *looks* correct on paper, don't attribute the mismatch to a stale cached build — that's not how this environment behaves. Treat the discrepancy as a real bug and keep digging (check the actual runtime message protocol between `ui.html` and `code.js`, timing of postMessage calls, etc.), not "ask the user to reload."

## Memory: full-suffix-always-wide-card.md

---
name: full-suffix-always-wide-card
description: файл с суффиксом -full.svg/-full.png ВСЕГДА рендерится широкой карточкой — не переопределяй type на основе viewBox
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 962fd792-f5b2-49ed-81db-29beb5e401dc
  modified: 2026-08-19T04:49:58.339Z
---

Файл `*-full.ext` в `variants[]` логотипа всегда должен рендериться широкой карточкой — это правило проекта, а не эвристика, которую можно переопределять по факту. Не ставь `"type": "svg"` (или другой type), чтобы «исправить» форму на квадратную, даже если реальный `viewBox` у SVG квадратный (1:1) — например бейдж с текстом внутри квадрата, а не горизонтальный лендшафт.

**Почему так, а не «по факту пропорций»:** в [js/main.js](js/main.js) (`getDisplayType`/`isFullFile`) форма карточки для файла без явного `type` уже определяется суффиксом имени — `-full` → `wide`. Это осознанное решение архитектуры проекта, а не баг. Автор экспортов иногда называет файл `-full`, даже если внутри технически квадратный `viewBox` (см. `rostics-alt-full.svg`, `kfs-alt-full.svg` — оба 1000×1000, но с суффиксом `-full`), и ожидает, что карточка всё равно будет широкой.

**Инцидент 2026-08-08:** при добавлении Rostic's/KFC поставил `"type": "svg"` на `rostics-alt-full.svg`/`kfs-alt-full.svg`, руководствуясь тем, что их `viewBox` квадратный — карточка отрендерилась маленьким квадратом вместо широкой. Пользователь резко поправил: «ВСЕГДА -full svg рендерятся как full. не самовольничай. есть чёткие правила проекта». Откатил — убрал `"type": "svg"`, оставил только `labelKey`.

**Как применять:** увидев файл `*-full.ext`, НЕ открывай его и не проверяй `viewBox`/пропорции, чтобы решить форму карточки — просто не добавляй `type` вообще (или используй `type: "full"`/`"full_en"`, если это основной вариант), и он корректно станет `wide` через `isFullFile`. `type: "svg"` — для форсирования square на файле БЕЗ суффикса `-full`, который иначе рендерился бы square и так по умолчанию (не тот случай).

**Уточнение 2026-08-19:** пользователь ужесточил правило — «лого с суффиксом full — ВСЕГДА ТИП FULL». Т.е. не просто «не переопределяй type», а явно ставь `"type": "full"` на КАЖДЫЙ `*-full.ext`-вариант, даже если это не основной/не вордмарк‑лейаут (пример: `ostrovok-coin-full.svg` — круглая «монета» бонусной программы, не горизонтальный лендшафт). `labelKey`/`label` для кастомного текста ставятся ДОПОЛНИТЕЛЬНО к `type: "full"`, а не вместо него — `resolveCategoryLabels` всё равно берёт текст лейбла из `labelKey`, а `type: "full"` отвечает только за форму карточки. Не полагайся на fallback по имени файла (`isFullFile`) как на достаточную меру — ставь `type` явно.

## Memory: git-autobackup-exists.md

---
name: git-autobackup-exists
description: "Автобэкап перед разрушительными git-командами уже настроен — где искать снапшот, если файлы пропали"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 282e4db6-2b74-4ba2-857d-fd9f2a484cb7
  modified: 2026-07-31T13:53:51.287Z
---

На машине пользователя стоит **глобальная обёртка git** — `/opt/homebrew/bin/git` (первая в PATH, перехватывает `git` независимо от вызывающего: терминал, Claude Code, другой агент, IDE). Плюс дублирующий локальный хук `PreToolUse`/`Bash` в [.claude/settings.json](../../../.claude/settings.json trace-logos) на случай, если обёртка не установлена в другом окружении.

**Что делает:** перед `git checkout -- <path>`, `git checkout .`, `git restore`, `git reset --hard`, `git clean -f*` — командами, которые могут без предупреждения снести незакоммиченные правки, — автоматически:
1. `git stash create` + `git tag autosave/<timestamp>` — снапшот отслеживаемых файлов (не трогает рабочее дерево/индекс).
2. Для `clean` — архив untracked-файлов в `.git/autosave-untracked/<timestamp>.tar.gz` (stash их не видит).

Затем настоящая git-команда выполняется как обычно — обёртка не блокирует, только подстраховывает.

**Если файлы пропали — ПЕРВЫМ ДЕЛОМ проверь это, прежде чем городить восстановление из деплоя/архивов** (как в инциденте 2026-07-31, см. [[vercel-deploy-source-recovery]] — тот путь понадобился именно потому, что автобэкапа тогда ещё не было):
```bash
git tag -l 'autosave/*' | sort                   # список снапшотов
git show autosave/<ts> -- <path>                  # что было внутри
git checkout autosave/<ts> -- <path>               # вернуть (попадёт в staged — `git restore --staged` если не хотите коммитить)
ls .git/autosave-untracked/                        # untracked-архивы (после clean)
```

**Ограничение:** обёртка в `/opt/homebrew/bin` — только на этой машине. На другом окружении (новый Mac, CI) её нет, пока не поставить заново. Файл обёртки не в git (это `/opt/homebrew/bin/git`, вне репозитория) — при желании поставить и в новом окружении содержимое можно взять из истории этой сессии (2026-07-31) или из `.claude/settings.json` + `scripts/git-autobackup-hook.sh` в репозитории trace-logos, которые несут ту же логику.

Тегов `autosave/*` со временем накапливается много — не мусор, но раз в пару недель можно почистить старые (`git tag -l 'autosave/*' | head -n -20 | xargs -r git tag -d`).

## Memory: hosting_vercel_reactivated.md

---
name: hosting-vercel-reactivated
description: Production hosting for trace-logos is Vercel; current account (2026-08-28) is levanibragimov-9907 (scope trace-logos), not savramstudia/arturablyazov5/sixxset5-star/mansurov
metadata:
  node_type: memory
  type: project
  originSessionId: ada35a6f-e1ea-460f-95c8-87b0e1fef60c
  modified: 2026-08-20T13:43:59.664Z
---

Production deploys for trace-logos go to **Vercel**. History of account moves, most recent first:

- **2026-08-28 → `levanibragimov-9907` (levanibragimov@yandex.ru)**, team/scope **`trace-logos`** (team name "Trace Logos", org id `team_s4A3qqis7cFPb1oqZLcKBCHL`, project id `prj_8joeFkwKktzRgtQLHyaJDWOD28Sa`) — current, live. Migrated by archive deploy through `publish-scheduled-posts.js` hold/restore; `trace-logos.ru` and `www.trace-logos.ru` moved from the old `trace-63e4` project to the new one; `www` redirects to apex with 308. `.vercel/project.json`, `package.json` deploy script, and `~/.zshrc` token/email were updated. HEAD was moved to a new local commit authored as `levanibragimov@yandex.ru` so Vercel archive deploy author validation does not block. No push was done.
- **2026-08-20 → `savramstudia` (savramstudia@yandex.ru)**, team/scope **`trace-63e4`** (`vercel teams ls` showed team name "Trace", id `trace-63e4`) — superseded on 2026-08-28. Discovered via commit `54028e1338` ("chore: обновление git-автора для нового Vercel-аккаунта"). `package.json`'s `"deploy"` script was updated in that commit to `vercel --prod --yes --archive=tgz --scope=trace-63e4 --token="$VERCEL_TOKEN" && node scripts/indexnow-ping.js`; later replaced by the `trace-logos` scope in the 2026-08-28 migration. **Non-interactive Bash shells don't source `~/.zshrc`** — always `source ~/.zshrc` first or the token env var is empty.
- **2026-08-08 → `arturablyazov5-5100`** (superseded) — org id `team_EcDiXc050vJYrmzk2c72d3Up`.
- **2026-07-28 → `sixxset5-star`** (superseded) — was itself a move off the original `mansurov` account (org `team_5qtHZtJBmfxpP7GJ9GasLi8j`, retired that day).

**How to apply:** Deploy with `npm run deploy` (now `vercel --prod --yes --archive=tgz --scope=trace-logos --token="$VERCEL_TOKEN" && node scripts/indexnow-ping.js`) — remember to `source ~/.zshrc` first in a non-interactive shell so `$VERCEL_TOKEN` is set, or `npm run deploy` itself will fail with an empty token. `--archive=tgz` stays required (repo exceeds the 15,000-file plain-upload limit). If `vercel whoami` / a deploy errors with "the specified scope does not exist" or similar, re-verify the current account with `vercel teams ls --token "$VERCEL_TOKEN"` rather than assuming the scope name from a previous session.

**Deploy timing note (still applies):** `vercel --prod` can take several minutes for the archive upload (656MB+) and may appear to hang past a short timeout — it usually still succeeds; check `vercel ls trace-logos --scope=trace-logos --token="$VERCEL_TOKEN"` or `curl -sI https://trace-logos.ru` before assuming failure and retrying.

**Every deploy in this repo goes through [[check-blog-embargo-before-deploy]] (hold → deploy → restore), never a bare build+vercel.**

**IndexNow ping is selective, not full-sitemap** (see [[indexnow-ping-selective]]) — `scripts/indexnow-ping.js` (the second half of `npm run deploy`) only submits pages that actually changed since the last git commit, not every URL in the sitemaps.

## Memory: idea-howto-video-schema.md

---
name: idea-howto-video-schema
description: "Future idea — add a shared screencast to the existing HowTo JSON-LD on logo pages (not a visible embed, not on catalog hub pages)"
metadata: 
  node_type: memory
  type: project
  originSessionId: da17b1e7-4e86-41df-ba0e-6c2ea85b7385
---

Idea from the 2026-07-30 SEO audit, revised after user pushback: originally suggested putting a Figma-plugin screencast on catalog/hub pages (`/logos/`, `/logos/market/`, ecosystem pages) — user correctly rejected this, those are pure browse/search pages, a plugin video is off-context clutter there (visitors aren't primed for it).

**Better version:** every logo page already renders an unconditional `HowTo` JSON-LD block ("Как вставить лого {name} в Figma", see [scripts/build-seo-pages.js:1143](../../../scripts/build-seo-pages.js)) with 3 text steps. Record ONE shared screencast of the plugin flow, then add a `video` field (`VideoObject`) pointing to it inside that existing HowTo schema, reused across all logo pages. This is a schema-only addition — no visible player embed, no per-page cost, and it fits the context (user is already looking at a specific logo and reading the HowTo steps).

Optionally, actually embed a visible player (not just schema) on a handful of the highest-traffic logo pages only (pick via `logos/download-stats.json`), not on every page and not on catalog hubs.

**Status:** not started, no priority/date attached — just a parked idea, unlike [seo-fill-missing-about-fields](seo-fill-missing-about-fields.md)/[seo-fill-missing-brandurl](seo-fill-missing-brandurl.md) which have a scheduled reminder.

## Memory: indexnow-ping-selective.md

---
name: indexnow-ping-selective
description: "scripts/indexnow-ping.js now pings only pages that actually changed since the last commit, not the whole sitemap"
metadata: 
  node_type: memory
  type: project
  originSessionId: 87ba6c1a-7690-4809-8967-2c0e8c5bd182
  modified: 2026-08-13T10:43:51.037Z
---

`scripts/indexnow-ping.js` (runs as the tail end of `npm run deploy`, see [[hosting_vercel_reactivated]]) used to submit **every** URL in `sitemap-pages.xml`/`sitemap-logos.xml`/`sitemap-emoji.xml` to IndexNow on every deploy (~2840 URLs), regardless of whether that page's content changed.

**Why that was wrong:** two build steps touch every HTML file on every build without changing anything meaningful — `build-cache-bust.js` re-stamps `?v=ASSET_VERSION` into every css/js link, and `build-home-popular.js` re-bakes view counters into the "популярные посты" widget on every blog page. Neither is a real content change, but both made `git diff` (and the old blind full-sitemap ping) treat almost the entire site as "updated" on every single deploy.

**How it works now (rewritten 2026-08-13):**
1. `git status --porcelain -- '*.html'` → which page files are modified or new since HEAD (deleted files are skipped, nothing to crawl).
2. For modified files, diff current content against `git show HEAD:<file>`, with `?v=\d{8}` stripped from both sides first (the only known pure-noise pattern) — if they're still equal after that, skip (noise-only). New files (not in HEAD) are always included.
3. Only the URLs that survive get POSTed to IndexNow.

Verified same day: on a working tree with a large uncommitted logo batch it selected 898/2914 URLs instead of all 2914 — expected to be far smaller (single digits to low tens) on a routine one-post/one-logo deploy.

**Flags:** `--dry-run` prints the selected URL list without submitting. `--all` restores the old blind full-sitemap behavior (fallback for a first deploy with no useful git history, or troubleshooting).

**How to apply:** don't re-add a blind full-sitemap ping as a "simpler" fix if this ever looks broken — the selective diff is the fix for a real over-pinging problem the user flagged. If another build step starts stamping something into every page unconditionally (a new counter, a new cache-buster), add its pattern to `NOISE_RE` in the script rather than reverting to `--all` by default.

## Memory: MEMORY.md

- ⚠️ [Git-автобэкап перед разрушительными командами](git-autobackup-exists.md) — CRITICAL: если файлы пропали, ПЕРВЫМ ДЕЛОМ проверь `git tag -l 'autosave/*'` — обёртка /opt/homebrew/bin/git + Claude-хук уже страхуют checkout/restore/reset --hard/clean -f
- ⚠️ [Бэкап перед рискованной правкой](backup-before-risky-edits.md) — CRITICAL: перед скриптом/массовой правкой ВСЕГДА снапшот (git stash create + tag) до, не после — git-автобэкап не спасёт от кривого Edit/скрипта, только от git checkout/reset/clean
- ⚠️ [Check blog embargo before deploy](check-blog-embargo-before-deploy.md) — CRITICAL: any deploy request → run scripts/publish-scheduled-posts.js (hold→deploy→restore), never bare build-all+vercel; never skip `restore`
- [Hosting: Vercel reactivated](hosting_vercel_reactivated.md) — prod on Vercel, now under account `levanibragimov-9907` scope `trace-logos` (not savramstudia/arturablyazov5-5100/sixxset5-star/mansurov); `npm run deploy`, `VERCEL_TOKEN` in `~/.zshrc` (source it first in non-interactive shells)
- [IndexNow ping now selective](indexnow-ping-selective.md) — scripts/indexnow-ping.js (2nd half of npm run deploy) pings only pages changed since last commit, not the whole sitemap; `--all`/`--dry-run` flags
- [Vercel account migration checklist](vercel-account-migration-checklist.md) — full reusable steps for next account switch: token-based auth (avoid wrong-browser login), archive-first deploy, domain swap; ⚠️ HEAD commit's author email blocks deploys even on archive uploads — `git config` alone doesn't fix it, needs a new commit
- [Don't nag SEO ops](dont-nag-seo-ops.md) — never unprompted-raise www-404 (site works, it's a local proxy artifact), deploy timing, or link-building — user manages these
- [Version/changelog only on request](version-changelog-only-on-request.md) — never bump version.json/changelog.json as a side effect of a fix, even where the project has that convention; wait for explicit ask
- [reviews-exporter version source of truth](reviews-exporter-version-source-of-truth.md) — bump manifest.json's "version", not version.json — build-extension-zip.js syncs version.json/zip/landing from manifest.json and reverts hand-edits
- [reviews-exporter Telegram parsing](reviews-exporter-telegram-parsing.md) — K vs A client selectors, br/PUA-glyph/reply-quote/sticker-vs-AnimatedEmoji/GIF gotchas, scroll-patience tuning (6s), two hashed-CSS fragile spots (.yIk5KK-h, .wNIxEPfy)
- [Blog brand mentions must link](blog-brand-mentions-must-link.md) — every brand/tool name in a blog post body must link to its catalog page, every occurrence, not just first
- [Blog writing workflow](blog-writing-workflow.md) — how the user wants batch blog articles: RU+EN, dense interlinks, hook-first varied structure (Yandex anti-dup), then build + OG + verify
- [Anti-AI text patterns](anti-ai-text-patterns.md) — 13 запретов, убирающих «нейросетевость»; главный — полностью убрать «не X, а Y»
- [39 rules of strong text](strong-text-39-rules.md) — чек-лист: вывод раньше объяснения, факты вместо оценок, короткий глагол, активный залог (источник не называть)
- ⚠️ [Статьи блога: не трогать без спроса](blog-posts-do-not-touch.md) — CRITICAL: 5 новейших статей отредактированы пользователем ВРУЧНУЮ + ~27 вычитано агентом (сверху вниз доведено до 2026-09-09 включительно: …logotip-dlya-eko-brenda, skevomorfizm, geshtalt-v-logotipe, arhetipy-brenda — без явного разрешения не трогать; два агента идут навстречу друг другу); сверяйся со списком ПЕРЕД любой правкой blog/posts/*.md
- [Article-writing skill](article-writing-skill.md) — все правила текста сведены в скилл `/article-writing` в репозитории trace-logos; вызывать его на любую задачу «написать/поправить/вычитать статью»
- [bash while-read trailing-newline bug](bash-while-read-trailing-newline-bug.md) — never iterate a file list with bash `while read`; last item silently dropped if no trailing `\n`
- [Respond in Russian](respond-in-russian.md) — communicate in Russian in this project
- [No unprompted browser verify](no-unprompted-browser-verify.md) — don't self-verify UI changes with preview_* tools unless asked; user checks manually
- [Among Us easter egg](amongus-easter-egg.md) — trigger, files, recolor scheme for the Among Us logo escape animation easter egg
- [CSS parity guard](css-parity-guard.md) — test-css-parity.js (in build-all.js) enforces easter-egg/microanim CSS across the 4 pages loading main.js
- [Doodle Jump easter egg](doodlejump-easter-egg.md) — live-preview widget + lightbox, attract-mode bot, files at assets/easter-egg/doodlejump/
- [Fill missing `about` fields](seo-fill-missing-about-fields.md) — TODO 2026-08-03: 121/708 logo items lack history text, prioritize by download-stats.json
- [Fill missing `brandUrl` fields](seo-fill-missing-brandurl.md) — TODO 2026-08-03: 635/708 logo items lack brandUrl (Brand.sameAs/license), prioritize by download-stats.json
- [Idea: HowTo video schema](idea-howto-video-schema.md) — parked, no date: add shared screencast to existing HowTo JSON-LD on logo pages, not catalog hubs
- [Unofficial logo = thumb pattern](unofficial-logo-thumb-pattern.md) — no `unofficial` field exists; use `file`=full official + `thumb`=square stand-in (see T-ID)
- [Восстановление из архива деплоя Vercel](vercel-deploy-source-recovery.md) — незакоммиченные правки достаются из source.tgz старого деплоя через API (v6 files → v7 base64)
- [Yandex AI Studio outputs folder](yandex-ai-studio-outputs-folder.md) — все выводы экспериментов с бюджетом aistudio.yandex (спрос, factcheck) класть в trace-logos/ai-studio-checks/, не в корень репо
- [NBSP in about/desc JSON fields](nbsp-in-json-about-fields.md) — Edit old_string with plain spaces silently fails to match; get exact text via json.load, not hand-retyped heredoc
- [Blog factcheck: GenSearch pattern](blog-factcheck-gensearch-pattern.md) — real factcheck edits are almost always granular details (dates, numbers, version names), never conceptual corrections; weight CSV rows accordingly
- ⚠️ [Session scope: mobile only](session-scope-mobile-only.md) — CRITICAL: current thread's detail-sheet fixes and all following fixes are mobile-only, don't touch desktop layout
- [Yandex 404 report: /en/assets stale](en-assets-yandex-stale-404.md) — уже исправлено (bd49ccdc7); новая выгрузка с этим URL — скорее всего стейл-индекс, сверь дату обнаружения перед расследованием
- ⚠️ [-full suffix всегда wide-карточка](full-suffix-always-wide-card.md) — CRITICAL: не переопределяй type:"svg" на файле *-full.ext по факту квадратного viewBox — suffix однозначно определяет форму, это правило проекта, не эвристика
- [Нативная macOS-админка](admin-mac-app.md) — ~/Documents/TraceLogosAdmin (вне репо сайта); правишь build-all/publish-scheduled-posts или схему item — проверь админку
- [Правь пост → ставь updated:](blog-set-updated-on-edit.md) — правя уже опубликованный blog/posts/*.md, добавляй frontmatter updated: с датой правки (даёт «Изменено ‹дата›» + dateModified в JSON-LD); механизм в build-blog.js с 2026-08-17
- [Figma plugin ui.html hot-reloads instantly](figma-plugin-ui-hot-reload.md) — no manual reload needed in dev mode; don't blame "stale cache" for a mismatch, it's a real bug
- [Typograf: единый источник правил](typograf-unified-source.md) — движок объединён (2026-08-19) в tools/figma-plugins/_shared/typograf-rules.js, запекается в плагин, sync стережёт test-typograf-sync.js; конвейер сайта/плагина НЕ идентичен (CONTENT_OPTS vs DEFAULT_OPTS — 3 флага); Chrome-расширение (trace-typograf) осталась третьей неунифицированной копией

## Memory: nbsp-in-json-about-fields.md

---
name: nbsp-in-json-about-fields
description: logos/categories/*.json about/desc text uses non-breaking spaces (U+00A0) and non-breaking hyphen (U+2011) per Russian typography rules — plain-space old_string in Edit will silently fail to match
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 50bfda13-fd28-46a5-a06e-0770e234369b
---

`about`/`desc` fields in `logos/categories/*.json` (and other RU text apply-typography.js touches — see CLAUDE.md's typography section) are full of `\xa0` (NBSP, e.g. after short prepositions «в», «с», «и», «от», «на», before em dash) and `‑` (U+2011 non-breaking hyphen, e.g. «Альфа‑Банка»). These look like normal spaces/hyphens when read via the Read tool or eyeballed in a diff.

**Why:** `Edit`'s `old_string` requires an exact byte match. If you hand-type or copy text that "looks the same" with regular spaces/hyphens, the match silently fails ("String to replace not found") even though the text is visually identical.

**How to apply:** Don't hand-retype Cyrillic `about` text into an `old_string`/heredoc — retyping through a shell heredoc also risks silent NFC/NFD unicode normalization corruption on macOS. Instead:
1. Get the exact current value via `python3 -c "import json; print(repr(json.load(open(path,encoding='utf-8'))['items'][i]['about']))"` or similar — this gives the byte-exact string including `\xa0`/`‑`.
2. Build the new string by concatenating onto that exact value (don't retype the untouched parts).
3. Write back via direct string replace on the raw file text, not `json.dump` (dumping would reformat the whole file and blow up the diff / lose formatting).
4. After editing, running `node scripts/apply-typography.js` will auto-fix NBSP/dash typography in any plain-space text you appended, so newly inserted sentences don't need to be hand-typed with `\xa0` — just run it after.

## Memory: no-unprompted-browser-verify.md

---
name: no-unprompted-browser-verify
description: "Don't use preview_* browser tools to self-verify UI/animation changes unless the user explicitly asks — user checks manually"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 9e910695-9b20-4ad7-a57f-ccceffb4feac
---

Don't open the browser preview to verify UI or animation changes on your own initiative. The user checks manually and finds unsolicited verification unnecessary.

**Why:** explicit instruction — "хватит проверять. я сам проверю" (stop verifying, I'll check myself), given during iterative work on the Among Us easter-egg animation (see [amongus-easter-egg](amongus-easter-egg.md)).

**How to apply:** make code/CSS/JS edits and describe what changed, but skip `preview_*` tool calls (screenshot, eval, snapshot, etc.) for this kind of visual/animation tweak unless the user asks you to check or reports something is broken and asks you to investigate.

## Memory: respond-in-russian.md

---
name: respond-in-russian
description: User wants Claude to communicate in Russian in this project
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 9e910695-9b20-4ad7-a57f-ccceffb4feac
---

Respond in Russian in this project, not English.

**Why:** explicit instruction from the user ("по русски общайся").

**How to apply:** default all conversational replies (not code, not file content, not commit messages unless asked) to Russian for this project going forward, unless the user switches back to English.

## Memory: reviews-exporter-telegram-parsing.md

---
name: reviews-exporter-telegram-parsing
description: "How Telegram comment collection works in tools/extensions/reviews-exporter/collector.js — two client DOMs, key selectors, known fragile spots"
metadata: 
  node_type: memory
  type: project
  originSessionId: e939862f-5653-42d6-89b3-9664f6c751e5
  modified: 2026-08-07T10:21:02.732Z
---

`tools/extensions/reviews-exporter/collector.js` collects comments from a Telegram channel post's discussion thread and exports to `.md`. Telegram Web ships **two completely different clients** with unrelated DOM/CSS, so the extension has two parallel, mostly-independent implementations:

- **Client K** (`web.telegram.org/k/*`) — semantic class names (`.bubble`, `.peer-title`, `.document-container`, `data-mid`). Entry: `window.__rvwCollectTelegramComments`.
- **Client A** (`web.telegram.org/a/*`) — React app, `data-message-id`, `.Message`/`.sender-title`/`.text-content`/`.MessageMeta`. Entry: `window.__rvwCollectTelegramCommentsA`. Both are wired into `manifest.json`'s `content_scripts` matches and `button-injector.js` (branches on `location.pathname.startsWith('/a')`).

## Detecting "discussion is open" (client A)
No K-style `data-type="discussion"].active`. Instead: the active `.MiddleHeader .Transition_slide.Transition_slide-active` for a real channel view always contains `.chat-info-wrapper` (avatar+subscriber count); the discussion pane's active header slide never does (just back-button + `<h3>`). This is locale-independent (doesn't rely on the header text "N Comments"). Verified live via a console diagnostic script rather than guessed.

## Known parsing gotchas fixed this session (both clients unless noted)
- **`<br>`/block elements don't add whitespace to `.textContent`** — Telegram's line breaks are purely visual; multi-paragraph messages (and post excerpts) glued together mid-sentence ("почему.Пытаться"). Fixed with `rvwNormalizeLineBreaks(el)` — replaces `<br>` with a text-node newline and brackets `blockquote/div/p` with newlines *before* reading `.textContent`.
- **PUA icon glyphs** (`.tgico` in K, icon fonts generally) inject a real Private-Use-Area character into `.textContent`, rendering as a broken box/`?` for viewers without the font. Fixed via `rvwElementText()`/`rvwTextWithoutIconsA()` — clone and strip the icon node before reading text, not a post-hoc character-range regex (PUA isn't in the bidi-mark ranges `rvwStripInvisibleChars` covers).
- **Author name resolution** must never grab `.peer-title`/`.sender-title` from a reply-quote block (`.reply-content` in K, `.EmbeddedMessage` in A) — that's the *quoted* person, not the sender. Scope the selector to `.colored-name` (K) / `.message-title .sender-title` (A) specifically.
- **Group-continuation messages have no name in their own bubble** (K: `hide-name` class messages only show the shared avatar). Resolve via nearest-preceding `.bubbles-group-avatar-container`'s `data-peer-id`, cached in a `peerNames` map filled from *any* bubble in the group that does show a name — backfilled after the whole harvest (order-independent, since the name-bearing bubble can come after the nameless one in DOM).
- **Sticker vs plain photo** (client A): a sticker's `<img>` thumbnail placeholder alone looks like a photo — must check for `.sticker-media`/`.AnimatedSticker`/`.rlottie-canvas` first.
- **`.AnimatedEmoji` (a single big animated emoji sent alone) vs a real sticker** — same Lottie/canvas rendering (`.AnimatedSticker`/`.rlottie-canvas`), must check `mediaInner.classList.contains('AnimatedEmoji')` *before* the generic sticker check, or it mislabels as "Стикер". The actual emoji glyph is **not recoverable from the DOM** for this type (no `data-alt`, unlike inline custom-emoji in text which do have it) — labeled generically "Эмодзи (анимированный)".
- **GIF vs video** (client A): Telegram implements GIFs as silent looping `<video>` — distinguish via `.message-media-duration` text being literally `"GIF"` instead of a time.
- **Emoji-only comments must NOT be filtered for Telegram** (unlike Yandex Maps/Avito, where an emoji-only review is spam-like noise and `rvwParseYandexReview` intentionally drops it) — in Telegram it's a legitimate live reply. Don't port that Yandex filter here; documented inline with a comment at both K/A's "Без имени + empty" filter site so it isn't reintroduced by mistake.
- **Post excerpt is now the full post text**, not truncated — `.slice(0, 200)` was removed from both `readPostExcerpt()` (K) and the inline post-text extraction (A) per explicit user request 2026-08-07.

## Scroll/collection tuning
Both collectors do a two-phase scroll (up to thread start, then down to end) with a stability-based give-up: `maxStableRounds` iterations of no-growth at the scroll edge before quitting. Currently `6 × 1000ms ≈ 6s` patience per edge (was briefly raised to `20 × 1500ms ≈ 30s` after a real under-collection incident — exactly ~342 of ~700 comments came back once — then explicitly reduced back to 6s per user request; the 30s value is not in use, don't reintroduce it without being asked).

## Fragile spots — real, not fixed (accepted risk)
Client A's CSS uses Vite/Rolldown content-hashed class names for some elements (e.g. `.yIk5KK-h` — reaction counter, `.wNIxEPfy` — poll wrapper) alongside stable semantic ones (`.Reactions`, `.MessageMeta`, `.sender-title`). These two hashed classes could silently break (reactions read as 0, polls fall through to plain-text parsing) if Telegram ships a new A-client build. No live re-verification was possible mid-session; flagged rather than "fixed" since there's nothing more stable to key off currently.

See also [[reviews-exporter-version-source-of-truth]] for how to bump this extension's version (never hand-edit `version.json`).

## Memory: reviews-exporter-version-source-of-truth.md

---
name: reviews-exporter-version-source-of-truth
description: "reviews-exporter Chrome extension's version lives in manifest.json, not version.json"
metadata: 
  node_type: memory
  type: project
  originSessionId: e939862f-5653-42d6-89b3-9664f6c751e5
  modified: 2026-08-07T07:13:30.428Z
---

For `tools/extensions/reviews-exporter/` (and any other `tools/extensions/<slug>/` Chrome extension), the version source of truth is **`manifest.json`**'s `"version"` field — not `version.json`. `scripts/build-extension-zip.js` reads `manifest.json`, then generates/syncs `version.json`, the `.zip`, and the landing page's version/changelog markers from it (and warns on mismatch if `version.json`/`changelog.json` disagree with `manifest.json`).

**Why:** hand-editing `version.json`/`changelog.json` directly (as instructed once for a routine fix, see [[version-changelog-only-on-request]]) gets silently overwritten back to whatever `manifest.json` says the next time `build-extension-zip.js` (or `npm run build`) runs — that's what happened 2026-08-07: `version.json` was hand-bumped to 1.2.0, then a full build reverted it to 1.1.1 (manifest's stale value) with a mismatch warning.

**How to apply:** to bump the extension's version, edit `manifest.json`'s `"version"` (and optionally its `"description"`), add the changelog entry to `changelog.json`, then run `node scripts/build-extension-zip.js` (or `npm run build`) to regenerate `version.json`/zip/landing page from it.

## Memory: seo-fill-missing-about-fields.md

---
name: seo-fill-missing-about-fields
description: "Status of filling missing `about` field on logo items — checked 2026-08-03, effectively done"
metadata: 
  node_type: memory
  type: project
  originSessionId: da17b1e7-4e86-41df-ba0e-6c2ea85b7385
---

**Статус на 2026-08-03: задача закрыта.**

Из 721 логотипа 605 имели `about`. Из 116 без `about` — 115 оказались `comingSoon: true` (у них нет страниц, поэтому поле не нужно). Единственный активный логотип без `about` — GeekBrains — заполнен в этой сессии.

Все активные (не-comingSoon) логотипы теперь имеют `about`. Дальнейшие действия нужны только при добавлении новых не-comingSoon логотипов без поля `about`.

**Why:** SEO-страницы под `/logos/<category>/<slug>/` несут ~90% трафика сайта; `about` даёт уникальный текст вместо шаблонного.

**How to apply:** при добавлении нового логотипа без `comingSoon` — сразу добавлять `about` в том же коммите, не откладывать.

## Memory: seo-fill-missing-brandurl.md

---
name: seo-fill-missing-brandurl
description: "DONE 2026-08-03 — brandUrl заполнен у всех 721 логотипов (было 76 из 721, стало 721/721)"
metadata: 
  node_type: memory
  type: project
  originSessionId: da17b1e7-4e86-41df-ba0e-6c2ea85b7385
---

**Выполнено 2026-08-03.** Все три этапа завершены:
1. `scripts/add-brand-urls.js` — добавил `brandUrl` к 645 логотипам без него (стало 721/721)
2. `scripts/fix-brand-urls.js` — исправил ~80 неверных URL (несуществующие домены, 404-пути, scam-сайт Snapseed)
3. `scripts/upgrade-brand-urls.js` — апгрейд 250 голых сайтов до официальных брендбуков/пресс-страниц (Google brand-resource-center, Yandex adv/brandguide, Apple трейдмарки, Meta about.meta.com/brand, OpenAI openai.com/brand, Sber brand.sber.ru, Avito press.avito.ru и т.д.)

`scripts/build-seo-pages.js` использует `brandUrl` для двух entity-grounding сигналов в JSON-LD: `Brand.sameAs` и `ImageObject.license` — оба направляют AI-краулеры/Google на официальный домен бренда.

**Как применять в будущем:** новые логотипы добавлять с `brandUrl` сразу в JSON категории. Если упустили — дополнить маппинг в `add-brand-urls.js` и запустить.

## Memory: session-scope-mobile-only.md

---
name: session-scope-mobile-only
description: Active work scope is mobile-only — detail sheet drag/sticky fixes and upcoming fixes in this thread must not touch desktop layout
metadata: 
  node_type: memory
  type: project
  originSessionId: 2965a1b4-32fd-4299-a8ec-5cdaf767a8b3
---

User declared: right now we work ONLY on mobile. This covers the detail-sheet-handle drag-to-dismiss fix ([js/main.js](../../../js/main.js)) and the sticky handle/close-button fix ([css/mobile.css](../../../css/mobile.css)), plus whatever fixes follow in the same session.

**Why:** explicit user instruction — scope guard so fixes don't leak into desktop CSS/JS paths.

**How to apply:** for any following fix in this thread, scope changes to mobile-only selectors/breakpoints (`@media (max-width: 768px)` in `css/mobile.css`, or `layoutMq.matches` guards in JS) — don't touch desktop `#detail` behavior, desktop CSS files, or shared code paths that also affect desktop unless unavoidable. If a fix genuinely requires touching shared code, flag it before proceeding.

## Memory: strong-text-39-rules.md

---
name: strong-text-39-rules
description: "39 правил сильного текста — чек-лист, по которому пользователь просит писать и проверять любые тексты"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 91df82e7-cc56-41c3-89dd-79c5a5af3583
  modified: 2026-07-26T07:31:14.834Z
---

Пользователь передал (2026-07-26) внешний чек-лист «39 правил сильного текста: как писать, чтобы дочитывали и покупали» как рабочий чек-лист для своих текстов. Источник не называть — пользователь просил не упоминать, чьи это правила.

**Каркас (задача и адресат):** 1) сформулировать, что человек должен понять, почувствовать и сделать; 2) одно главное целевое действие на текст; 3) учитывать ступень осведомлённости (лестница Ханта); 4) язык аудитории вместо профессионального; 5) фактура — по частотности вопросов у ЦА, а не по вкусу автора; 6) выкидывать всё, что не влияет на решение.

**Порядок подачи:** 7) сначала вывод и польза, потом объяснение; 8) сначала результат, потом процесс; 18) сильные слова и ключи — в первые 2–4 слова; 19) заголовок отвечает на вопрос или снимает возражение, а не называет тему; 23) подзаголовок дополняет заголовок, не пересказывает его.

**Доказательность:** 9) оценки («качественно», «надёжно») менять на факт, цифру, критерий; 10) у каждого факта — польза для читателя; 17) на каждое заявление — доказательство; 20) цифры только там, где усиливают смысл; 29) слишком хорошее обещание подкреплять описанием процесса; 30) ограничения и срочность — конкретно (дата, количество); 35) сравнения вместо голых «быстрее/лучше».

**Синтаксис:** 11) один абзац — один микро-вопрос; 12) одна мысль — одно предложение; 13) короткий простой глагол («уберём» вместо «осуществим оптимизацию»); 14) активный залог; 33) убрать слова-прокладки между подлежащим и сказуемым; 34) проверять чтением вслух; 36) избегать нанизывания родительных падежей; 37) единая форма для однородных элементов.

**Ясность:** 15) один термин — одна сущность; 16) никакой двусмысленности; 22) не выдумывать замену привычным паттернам («Тарифы», «Программа»); 32) каждый кусок понятен без контекста; 38) метафора только если упрощает понимание.

**Чистка:** 24) делить длинный текст на короткие абзацы/буллеты; 25) не порождать новых сомнений; 26) думать не что добавить, а что сократить; 27) выкидывать усилители и слова-паразиты; 28) позитивная формулировка вместо конструкции через «не»; 31) использовать контраст и противопоставление; 39) не смешивать продажу и оправдание («от 10 дней, но всё зависит»).

**How to apply:** использовать и как шпаргалку при написании, и как чек-лист при вычитке. Полный текст с примерами — в скилле `.claude/skills/article-writing/references/strong-text.md`; оркестратор `/article-writing` в репозитории trace-logos подключает его вместе с [[anti-ai-text-patterns]] и связностью из [[blog-writing-workflow]]. П.28 здесь и п.1 там пересекаются: обе требуют утвердительных формулировок вместо «не X, а Y».

## Memory: typograf-unified-source.md

---
name: typograf-unified-source
description: Движок русской типографики объединён в один источник (2026-08-19) — сайт и Figma-плагин больше не ручные копии
metadata: 
  node_type: memory
  type: project
  originSessionId: f6f2c5e8-6579-49d9-aa7f-9d9930ce973e
  modified: 2026-08-19T04:05:37.652Z
---

Устранён дубликат движка типографики, из-за которого сайт и Figma-плагин «Trace Typograf» молча разошлись (сайт был на 4 правила беднее: `кв.м → м²`, `10 градусов → 10°`, НБСП после `рис./табл./гл.`, `10+ шт`).

**Новая структура:**
- Единственный источник правил — `tools/figma-plugins/_shared/typograf-rules.js` (чистые строковые функции, без Figma API).
- `scripts/lib/typograf.js` — тонкая Node-обёртка, `require()`-ит источник (сократилась с 411 до 45 строк).
- `tools/figma-plugins/typograf/code.js` — источник дословно запекается между маркерами `// RULES:START` / `// RULES:END` скриптом `scripts/build-figma-typograf.js` (плагин не умеет `require()`).
- `scripts/test-typograf-sync.js` — сторож: сравнивает запечённый блок с источником байт в байт, роняет сборку при расхождении. Оба шага — первые в `build-all.js`, до `apply-typography.js`.

**Важно — конвейер НЕ полностью общий, и это осознанно.** Прогон старого/нового движка по всем 1629 текстам каталога+блога показал: три правила плагина портят прозу сайта —
- заглавная после `: «` — ломает «f» у Facebook → «F» (фактическая ошибка про логотип), «собака»/«закат» → с большой буквы;
- чистка пробелов в круглых скобках — разъезжает каомодзи (`ᕕ( ᐛ )ᕗ`, `( ͡° ͜ʖ ͡°)`) в `blog/posts/kaomodzi-i-tekstovye-smajliki.md`;
- `McDonald's → McDonald's` (апостроф) — верная правка, но 67 мест, требует отдельного решения, не побочный эффект.

Решение: `DEFAULT_OPTS` (плагин) vs `CONTENT_OPTS` (сайт) в самом источнике — три флага `colonQuote`/`parenSpace`/`apostrophe`, разница видна в одном файле тремя строками.

**Применено на диск:** 206 файлов получили накопленный долг НБСП/м²/градусов. Три опасных места (McDonald's, каомодзи, «f» Facebook) проверены — целы.

**Третья копия НЕ тронута:** `tools/extensions/trace-typograf/src/core/rules/*.js` (Chrome-расширение, плоская конкатенация без require) — порт того же движка, отстал на те же 4 правила. Не унифицирован — требует отдельной работы со сборкой расширения, пользователь не просил.

**CLAUDE.md обновлён** — секция про `build-figma-typograf.js`/`test-typograf-sync.js` добавлена, старое «дубликат, правь оба файла» переписано.

См. также [Article-writing skill](article-writing-skill.md) — типографика применяется до публикации статей блога.

## Memory: unofficial-logo-thumb-pattern.md

---
name: unofficial-logo-thumb-pattern
description: "How \"mark a logo as unofficial\" is implemented in trace-logos — the thumb/file swap pattern, no dedicated field exists"
metadata: 
  node_type: memory
  type: project
  originSessionId: 7600bb00-1d24-4cf6-9609-1851efb9233b
  modified: 2026-07-31T04:06:28.790Z
---

There is no `unofficial: true` field in the data schema. "Пометь как неофициальный" means: the brand has no official square icon, only an official horizontal (`full`) logo — the square version shown in the grid is a stand-in drawn/added by the site, not an official asset.

**How to apply it:**
- Set `"file"` to the official horizontal asset (e.g. `alfa-pay-full.svg`) — this is the real primary, used for downloads/API/CDN.
- Set `"thumb"` to the square asset (e.g. `alfa-pay.svg`) — used ONLY as the grid tile stand-in, not offered as a downloadable variant.
- Do NOT put the square file in `variants[]` — it stays out of the variant list entirely.
- In `about`, add a sentence like T-ID/Т-Премиум do: "У X нет официальной квадратной иконки — бренд использует только горизонтальный знак, квадратная плитка в каталоге неофициальная."

**Why:** `js/main.js` reads `item.thumb ?? item.file` for the grid tile, and toggles the "no official square icon" explainer (`#detail-noicon`) on the logo detail page based on `!!item.thumb`. This is the site's only existing mechanism for signaling "this square mark isn't official" — reused rather than inventing a new field. Reference implementations: T-ID and Т-Премиум in `logos/categories/story-i-podpiski.json`, and Альфа Pay in `logos/categories/platezhi-i-karty.json` (added 2026-07-31).

Precedent found by the user pointing at the T-ID entry when asked how to mark alfa-pay unofficial — don't reintroduce a separate "unofficial" flag/field, this pattern already covers the concept via `thumb`.

## Memory: vercel-account-migration-checklist.md

---
name: vercel-account-migration-checklist
description: Step-by-step checklist for moving trace-logos to a new Vercel/GitHub account — auth without browser-login conflicts, domain swap, and the git-commit-author-email gotcha that blocks deploys
metadata:
  node_type: memory
  type: project
  originSessionId: cfb5cebc-43bd-4c4f-becf-7c3c3695e4df
  modified: 2026-08-08T09:01:16.656Z
---

Full procedure for switching trace-logos to a new Vercel account (and optionally a new GitHub account), derived from the 2026-08-08 migration to `arturablyazov5-5100` ([[hosting-vercel-reactivated]]). Follow this in order next time; skipping steps is what caused the incidents below.

**0. Auth without opening the wrong browser.** `vercel login` / `gh auth login`'s default OAuth flow opens the OS default browser — if that's not the browser holding the target account's session (e.g. default is Yandex, target account is logged into Chrome), the flow authenticates the wrong account. Use tokens instead, pasted in-chat, never run through the browser:
- Vercel: user generates at `vercel.com/account/tokens`, gives it in chat → used as `--token=...` per-command, or exported as `VERCEL_TOKEN` in `~/.zshrc` (NOT in any repo file) so the CLI picks it up automatically. Verify with `vercel whoami`.
- GitHub: user generates a classic PAT at `github.com/settings/tokens/new` (scope: `repo`, add `workflow` if needed), gives it in chat → `echo "<token>" | gh auth login --with-token`. Verify with `gh auth status` (shows all logged-in accounts; check which is `Active account: true`).

**1. Create/link the new Vercel project.** `vercel link --project=trace-logos --scope=<new-team-slug> --yes`. If it prompts "Found multiple remote URLs, which do you want to connect?" (this repo has multiple git remotes), that prompt has no `--yes` bypass — pipe `printf '\x1b[B\x1b[B\n'` (down-arrow ×N + enter) to select **Cancel**, since deploy is archive-based, not git-integration-based, at this stage. Confirm with `cat .vercel/project.json` — `orgId`/`projectId` must match the new account, not linger on the old one.

**2. First deploy — archive-based, not git push.** `vercel --prod --yes --archive=tgz --scope=<new-team-slug>` (repo exceeds the 15,000-file plain-upload limit). This is deliberately NOT a git-connected deploy yet — keeps the migration's blast radius to "one CLI command," not "whatever's in git history." Still goes through the blog-embargo hold→deploy→restore cycle ([[check-blog-embargo-before-deploy]]) — an account migration deploy is not exempt.

**3. THE GOTCHA — commit-author-email block.** Even a pure archive upload attaches the local repo's **HEAD commit's** author metadata to the deployment. If that email doesn't resolve to a GitHub account Vercel can verify (e.g. HEAD was last committed under the *old* account's email), Vercel returns the deployment as `status: BLOCKED` with "Fix Git Configuration" — **this blocks archive deploys too, not just git-push deploys**, because the check reads existing HEAD metadata, not how the deploy was triggered. `git config user.email "new@email"` (do this **locally in-repo**, not `--global`, to avoid affecting other repos) fixes it **only for future commits** — it does NOT retroactively fix an already-existing HEAD. The actual fix is a **new commit** authored under the corrected email (`git commit --allow-empty` works if there's nothing else to commit; otherwise fold it into whatever real commit is due). Diagnose a blocked deploy with:
```
curl -s "https://api.vercel.com/v13/deployments/<dpl_id>?teamId=<org_id>" -H "Authorization: Bearer $VERCEL_TOKEN" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('readyState'), d.get('errorMessage'))"
```
(the CLI's own `status` column just says `UNKNOWN`/`BLOCKED` without the reason — the dashboard's "Fix Git Configuration" dialog or this API call is what surfaces it.)

**4. If migrating to a new GitHub account too (private repo, git-push deploys):** `gh repo create <new-account>/trace-logos --private`, `git remote add <name> https://github.com/<new-account>/trace-logos.git`, then **before the first push**, make sure HEAD is already committed under the new email (step 3) — otherwise the auto-triggered Vercel deploy from that push inherits the exact same block. `vercel git connect <repo-url> --scope=<new-team-slug> --yes` wires the project to auto-deploy on push to `main`.
- **DANGER specific to this repo:** a git-connected Vercel project auto-deploys on every push with ZERO awareness of the blog-embargo hold state — see [[check-blog-embargo-before-deploy]]'s incident #3. Before the first push to a branch Vercel auto-deploys from, run `publish-scheduled-posts.js status`; if there's a pending future batch (there almost always is), committing+pushing the full working tree ships it the moment the build finishes, with no `vercel --prod` checkpoint to intercept. Prefer staying on manual archive-based deploys (step 2) for this repo unless git-push deploys are a deliberate, discussed decision — don't let `vercel git connect` become the default deploy path silently.

**5. Domain swap.** `vercel domains rm <domain> --scope=<old-team-slug>` on the old account, then `vercel domains add <domain> --scope=<new-team-slug>` on the new one. DNS itself doesn't need to change (already points at Vercel's edge, not at a specific account) — only the project-level domain assignment moves. Expect ~1 minute of the domain resolving to neither project during the swap; confirm the user is fine with the gap before starting (it's disruptive, ask first).

**6. Update the repo's own deploy config so `npm run deploy` targets the new account by default:** `package.json`'s `"deploy"` script needs `--scope=<new-team-slug>` added/updated, and [CLAUDE.md](../../../../Documents/trace-logos/CLAUDE.md)'s Hosting & caching section needs the new account/org id documented — both are checked-in files future sessions read, don't leave them pointing at the retired account.

**7. Verify, don't assume.** `curl -sI https://<domain>` should show `server: Vercel` and `200`. `vercel whoami` should show the new account. And — non-negotiable for this repo specifically — spot-check a future-dated blog post slug returns `404` on the live domain (see [[check-blog-embargo-before-deploy]]) before calling the migration done.

**Related:** [[hosting-vercel-reactivated]] has the account identity/history; this memory has the reusable *procedure*.

## Memory: vercel-deploy-source-recovery.md

---
name: vercel-deploy-source-recovery
description: Как вытащить утраченные незакоммиченные правки из архива исходников старого деплоя Vercel
metadata: 
  node_type: memory
  type: reference
  originSessionId: 282e4db6-2b74-4ba2-857d-fd9f2a484cb7
  modified: 2026-07-31T13:32:37.214Z
---

Деплой `vercel --prod --archive=tgz` кладёт в деплой **полный tar.gz исходников проекта** — его можно скачать и достать любой файл на момент того деплоя. Это спасает незакоммиченные правки, потерянные `git checkout`/`reset` (в reflog `git checkout -- .` не пишется, стэш их не содержит).

**Как:**
1. Токен: `~/Library/Application Support/com.vercel.cli/auth.json` → поле `token`.
2. `.vercel/project.json` → `projectId`, `orgId` (это `teamId`).
3. Список деплоев: `GET https://api.vercel.com/v6/deployments?projectId=…&teamId=…&limit=20` (поле `created` — мс).
4. Файлы деплоя: `GET /v6/deployments/<dpl_id>/files?teamId=…` → вернёт `src/.vercel/source.tgz.partN` с их `uid`.
5. Каждую часть: `GET /v7/deployments/<dpl_id>/files/<uid>?teamId=…` → **JSON вида `{"data":"<base64>"}`**, а не сырые байты. Декодировать base64 и склеить части по порядку → валидный gzip (~0.5 ГБ).
6. `tar xzf src.tgz -C out 'logos/categories' …` — пути в архиве от корня репозитория, без ведущей директории.

Preview-URL деплоев закрыты Vercel SSO (302 на `vercel.com/sso-api`), поэтому качать файлы надо именно через API, а не curl'ом по адресу деплоя.

**Выбор нужного деплоя** — по mtime сгенерированных артефактов (`assets/logos/search/<slug>.png`, `assets/og/<cat>-<slug>.png`): они показывают, когда билд последний раз видел данные, и подсказывают, какой деплой их ещё содержит.

Инцидент 2026-07-31: так вернули 11 записей логотипов + 13 вариантов (РЖД, СТС, ТНТ, РЕН ТВ, LEGO, Milka, ТВОЕ, VK Donut, Яндекс Ритм, Алиса Плюс, Директ Про и др.) из деплоя от 29.07. При слиянии брать из архива только `file`/`variants` и отсутствующие поля — текст `about`/`desc` в рабочей копии свежее (по нему прошла `apply-typography.js`).

## Memory: version-changelog-only-on-request.md

---
name: version-changelog-only-on-request
description: Never bump version.json / changelog.json (or similar version files) unless the user explicitly asks
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 6d841275-2e60-4975-95c6-9041d9ba8a5c
  modified: 2026-08-07T06:00:54.837Z
---

Do not bump `version.json`/`updatedAt` or add an entry to `changelog.json` (e.g. in `tools/extensions/reviews-exporter/`) as a side effect of a code fix — even when the change clearly deserves a changelog line and the project has that convention.

**Why:** user explicitly said this is his call, not something to do automatically after any change.

**How to apply:** ship the code fix only. If a version bump seems warranted, mention it as a suggestion and wait for the user to say to do it — don't touch `version.json`/`changelog.json` unprompted.

## Memory: yandex-ai-studio-outputs-folder.md

---
name: yandex-ai-studio-outputs-folder
description: "all Yandex AI Studio experiment outputs (demand checks, about-text factcheck) go into trace-logos/ai-studio-checks/"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 7a9f10c9-b62e-4995-8179-ceecc82b0db8
---

Every output produced while spending the aistudio.yandex budget (Wordstat demand-check CSVs, `aboutfactcheck` Generative Search reports/CSVs, any future one-off Yandex AI Studio experiment output) goes into `/Users/rafael/Documents/trace-logos/ai-studio-checks/` — not the repo root.

**Why:** these are scratch outputs for later manual review, not build artifacts or repo content — dumping them at repo root clutters `git status` and mixes throwaway experiment data with the actual site source. Keeping them in one folder means "let's go through the Yandex outputs" always has one place to look.

**How to apply:** when creating a new CSV/report from a Yandex Wordstat check, `aboutfactcheck`, `brandurl`, or similar admin-panel/Yandex-API experiment, write directly into `ai-studio-checks/` (create it if missing) instead of the project root, and never commit it to git unless the user explicitly asks.
