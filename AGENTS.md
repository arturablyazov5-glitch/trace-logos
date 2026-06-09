# Project Overview

**Trace Logos** is a web catalog of SVG/PNG logos for Russian and international brands. Users can browse, search, edit colors, and export logos.

**Stack:** Vanilla JS ES Modules, no framework, no build step. Static site + `server.js` as dev server.

**Data flow:**
`logos/manifest.json` → `logos/categories/*.json` (35+ categories) → logo items → `svgs/` / `pngs/`

Each item: `name`, `tags`, `figma` (Figma component path), `file`, `variants[]`, `ecosystem`.

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

Two JSON formats:
- `{ "type": "full"|"full_en"|"png"|"svg", "file": "..." }` — known type. `TYPE_LABELS` in `main.js` maps type → display label. Type also controls card shape: `full`/`full_en` → wide, others → square.
- `{ "label": "Old Icon", "file": "..." }` — no type, label rendered as-is. Card shape falls back to filename: ends with `-full.ext` → wide, otherwise → square (`isFullFile`).

Resolved label: `v.label ?? TYPE_LABELS[v.type] ?? v.type ?? ''` (main.js:482).

**Adding a new logo:**
1. Place SVG in `assets/logos/svgs/` (or PNG in `assets/logos/pngs/`)
2. Add an entry to the appropriate `logos/categories/*.json`
3. Required fields: `name`, `tags`, `figma`, `file`. Optional: `variants[]`, `ecosystem`
4. Run `node scripts/build-seo-pages.js` — regenerates all `logos/<cat>/<slug>/index.html` (with FAQ + brand-color swatches)
5. Run `node scripts/build-api-json.js` — regenerates `logos/<slug>.json` and `logos.json` (public API)
6. Run `node scripts/build-collections.js` — regenerates `collections/<slug>/index.html` (reads fresh `logos.json`, so run after step 5)
7. Run `node scripts/build-sitemap.js` — regenerates `sitemap.xml` (index) + `sitemap-*.xml`. **sitemap.xml is owned by this script** — run it LAST, after all page builders
8. Run `node scripts/build-og-images.js` — regenerates OG preview images in `assets/og/`. **Required for every new logo.**
9. **If the new logo is a PNG:** run `node scripts/build-webp-previews.js` — generates the lightweight WebP grid preview in `assets/logos/previews/`. SVG logos don't need this (the grid renders the SVG directly).

**Logo suggestion form:**
Users submit logos via a modal. Data (name, URL or file) is POSTed to Cloudflare Worker at `brand-icons-sanitizer.brand-icons.workers.dev/suggest`.

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

**scrape-emoji.js:** `--rebuild-only` refetches RU names, rebuilds 9 categories from emojigraph, then merges `custom.json`. Never touch `custom.json` during rebuild — it is the source of truth for manually added emoji.

**Adding new emoji not on emojigraph:**
1. Extract PNG from Apple Color Emoji font: `python3 scripts/extract-emoji.py`
2. Crop to content bbox, resize to 160×160 preserving aspect ratio (fit, don't stretch)
3. Place in `assets/emoji/pngs/apple/<slug>_<codepoints>.png`
4. Add item to `emoji/custom.json` under the correct category slug
5. Run `node scripts/scrape-emoji.js --rebuild-only` to merge into category JSONs

---

# Build Scripts

**NEVER manually edit generated files.** All `logos/<cat>/<slug>/index.html` pages are generated — hand edits will be overwritten on the next build.

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
- **When to run:** only when adding a **new** logo (not for file/variant changes to existing logos)
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
- **Input:** `logos/manifest.json` + `templates/category-page.html`
- **Output:** `logos/<category>/index.html` (category overview pages)
- **When to run:** after changes to manifest or category template

## `node scripts/build-api-json.js`
- **Input:** `logos/manifest.json` → `logos/categories/*.json`
- **Output:** `logos/<slug>.json` per category + `logos.json` (flat list for LLMs/bots)
- **When to run:** after any change to `logos/categories/*.json`
- `--dry-run` to preview stats without writing
- Logic: `svgUrl` = primary file if SVG; `pngUrl` = primary if PNG or first `type:"png"` variant; `formats` = `["svg","png"]` for SVG items, `["png"]` for PNG-only

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
- **Input:** `blog/posts/*.md` (frontmatter: `title`, `description`, `date`, `slug`) + `templates/blog-index.html` / `templates/blog-post.html`
- **Output:** `blog/index.html` + `blog/<slug>/index.html` (BlogPosting + Breadcrumb; index has Blog schema). Self-contained minimal markdown→HTML, no deps.
- **When to run:** after adding/editing a post in `blog/posts/`

## `node scripts/build-sitemap.js`
- **Input:** logos/emoji manifests, `collections.json`, `blog/posts/*.md`, `emoji/_urls.json`
- **Output:** `sitemap.xml` (**sitemap index**) + `sitemap-pages.xml` / `sitemap-logos.xml` / `sitemap-emoji.xml`
- **This script is the sole owner of `sitemap.xml`.** Run it LAST, after all page builders.

## `node scripts/build-home-sitemap.js`
- **Input:** `logos/manifest.json`, `emoji/manifest.json`, `collections.json`, `blog/posts/*.md`
- **Output:** injects the HTML «Карта сайта» block into `index.html` between `<!-- SITEMAP:START -->` / `<!-- SITEMAP:END -->` markers (4 groups: Логотипы, Эмодзи, Подборки, Разделы). `index.html` stays hand-editable everywhere else; **never hand-edit between the markers.**
- **When to run:** after adding/removing logo or emoji categories, collections, or blog posts
- `--dry-run` to print the block without writing

## `node scripts/build-og-home.js`
- **Output:** `assets/og/home.png` (1200×630 branded homepage OG image via Puppeteer + Chrome). Run rarely (only if the homepage OG design changes).

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
