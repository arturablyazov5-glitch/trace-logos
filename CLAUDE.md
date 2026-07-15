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
4. **If the new logo sets `ecosystem` to a key not yet in `logos/ecosystems.json`:** add it there first — `build-all.js` doesn't create ecosystem keys, only pages for keys that already exist.
5. Run `npm run build` (= `node scripts/build-all.js`) — runs the full fast-tier pipeline below in dependency order, including the sitemap (always last) and the EN mirror. **Do not run the individual scripts by hand** for a routine content change — that's how steps get forgotten or run out of order; use `--dry-run` first if you want to preview.
6. Run `node scripts/build-og-images.js` (or `npm run build -- --with-og`) — regenerates OG preview images in `assets/og/`. **Required for every new logo**, but excluded from the default fast tier because it's slow (Puppeteer/Chrome).
7. **If the new logo is a PNG:** the fast tier already ran `build-webp-previews.js` for you (step 5) — nothing extra to do. SVG logos never need it (the grid renders the SVG directly).

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

## `node scripts/build-all.js` (`npm run build`) — run this, not the individual scripts below

**Default entry point for any content change** (new/edited logo, emoji, collection, blog post, or a shared template/partial). Spawns every fast-tier script below as a child process, in dependency order, stopping on first failure. `--dry-run` previews every step without writing.

- **Fast tier (default):** test-data `--pre` → build-seo-pages → build-api-json → build-collections → build-category-pages → build-ecosystem-pages → build-webp-previews → test-data `--post` → build-emoji-seo-pages → build-emoji-category-pages → build-emoji-json → build-blog → build-blog-rss → build-home-sitemap → build-en-pages → test-links → build-sitemap (always last) → build-version.
- **Opt-in slow tier** (Puppeteer/Chrome, excluded by default — run only when actually needed, see each script's own entry below): `--with-og` (build-og-images), `--og-home` (build-og-home), `--plugin-assets` (build-plugin-assets), or `--full` for all three.
- **Why it exists:** the old workflow was "remember which of ~14 scripts to run, in what order" — easy to get wrong or skip a step (e.g. forgetting `build-ecosystem-pages.js` after adding an `ecosystem` key leaves cross-reference links 404ing). `build-all.js` removes that memory burden entirely for the common case.
- **When an individual script below is still the right call:** iterating on ONE script's own logic (fast `--dry-run` loop without re-running everything else), or a slow-tier step you're intentionally running standalone (e.g. `build-og-images.js` alone after adding one new logo, rather than `--with-og` re-rendering nothing new).
- Each script also still works completely standalone (this doc lists them individually below) — `build-all.js` is a convenience wrapper, not a replacement for understanding what each step does.

## `node scripts/test-data.js` (`npm test`)
- **Read-only data-integrity tests**, no output files. Runs inside `build-all.js` in two tiers; a failed check (exit 1) stops the pipeline.
- **`--pre`** (first step): required item fields (`name`/`tags`/`figma`/`file`), duplicate `file`/`figma` in a category, every `file`/`variants[].file`/`macos_styles.*` resolves to a real asset (logo paths starting with `/` resolve from repo root), every `ecosystem` key (string or array) exists in `logos/ecosystems.json`, orphan assets in `assets/logos/svgs|pngs` (warning).
- **`--post`** (after build-webp-previews): every PNG logo/emoji has an up-to-date WebP preview; every buildable logo has `assets/og/<slug>.png` (warning — OG is the opt-in slow tier).
- Warnings don't fail the build; `--strict` makes them fatal. No flags = both tiers (`npm test`).
- Known tolerated warnings: emoji `figma` dups from the scraper (Emoji/Family ×14), missing google flag variants, a few orphan SVGs.

## `node scripts/test-links.js`
- **Read-only broken-link test on the RENDERED HTML.** Walks every `*.html` on the site (prunes `templates/`, `en/` is checked, plus service dirs like `node_modules`/`cdn-dist`/`upptime`), extracts navigational `href`/`src`/URL-like `content` (canonical, og:image, hreflang), and asserts each **page** link (`…/` or `….html`) resolves to a real file on disk. Asset links (png/svg/css/js/…) are skipped on purpose — those are `test-data.js`'s job.
- **Why:** catches stale cross-links `test-data.js` can't see — a moved/renamed logo leaving a dead `/logos/<cat>/<slug>/` href in another item's about-text, or an orphaned `/en/` mirror whose canonical points at a deleted RU page. Replaced the old JSON-only about/desc scan that used to live in `cleanup-orphaned-pages.js`.
- **Fails the build** (exit 1) on any broken link, like `test-data.js`. `--warn-only` to report without failing.
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
- Also **patches `logos/index.html`** (hand-maintained main catalog): updates the logo counter AND re-injects the shared **detail panel** between `<!-- DETAIL:START/END -->` markers. The detail panel is a single source — `templates/partials/detail-panel.html` (which itself nests `{{> download-dropdown}}`); `category-page.html` pulls it via `{{> detail-panel}}`. **Edit the detail panel / download dropdown ONLY in `templates/partials/`, then run this script** — never between the markers.
- **When to run:** after changes to manifest, the category template, or the detail/dropdown partials

## `node scripts/build-ecosystem-pages.js`
- **Input:** `logos/ecosystems.json` (key → RU/EN label) + `logos/manifest.json` → `logos/categories/*.json` (items with matching `ecosystem` field) + `templates/category-page.html`
- **Output:** `logos/ecosystem/<key>/index.html` (RU + EN) — one page per ecosystem, listing all its logos (BreadcrumbList + CollectionPage JSON-LD)
- **When to run:** after adding a new `ecosystem` key to `logos/ecosystems.json`, or after adding/removing items on an existing ecosystem. Generates a page even for an ecosystem with a single ready item — a low member count is not a reason to skip a key already in `ecosystems.json`.
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
- **Output (remote):** `deploy-cdn.js` re-inits `cdn-dist/` as its own git repo and force-pushes it to **`sixxset5-star/trace-logos-cdn`** (separate repo, same pattern as the `upptime` status-page repo) — GitHub Pages there serves it at **`cdn.trace-logos.ru`**, giving every logo a short embeddable/shareable URL like `cdn.trace-logos.ru/vk.svg`.
- **When to run:** `build-cdn.js` runs automatically as part of the `npm run build` fast tier (so `cdn-dist/` always reflects the current manifest). `deploy-cdn.js` does **not** run automatically — run `npm run deploy:cdn` explicitly after a build when you want the short links live (adding/renaming a logo, changing variants). This mirrors the "opt-in slow tier" philosophy: cheap/local steps are automatic, anything that pushes to another repo is explicit.
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

## `node scripts/build-version.js`
- **Output:** `js/version.js` (`ASSET_VERSION`, a `YYYYMMDD` string) — imported by `js/utils.js` as `SVG_URL_V`, appended as `?v=` to every logo/emoji SVG/PNG/WebP URL.
- **Why it exists:** `assets/logos/*` and `assets/emoji/*` get a 30-day immutable browser cache (`vercel.json`). That's only safe if the URL changes when the file's content changes — `ASSET_VERSION` is that cache-buster. It must be a value that stays fixed between deploys, not one computed per page load.
- **When to run:** run it LAST, after all other build scripts, whenever you've replaced/edited an existing SVG or PNG under the same filename (new files with new names don't need it), or changed anything under `/js` or `/css`. Safe to skip for a routine "add a new logo" pass (new filename ⇒ new URL already busts on its own). It's the final step in `scripts/build-all.js` (`npm run build`), so a full pipeline run always refreshes it — only matters if you're running individual scripts by hand.

---

# Hosting & caching

**Production host is GitHub Pages** (as of 2026-07-05), not Vercel. Repo lives on the `sixxset5-star` GitHub account (migrated off `rafael-mansurov` after an Actions abuse flag banned that account's Actions/Pages builds). `.github/workflows/deploy.yml` (`workflow_dispatch` + push-to-`main` trigger) builds and deploys on every push to `main`; `trace-logos.ru` DNS points at GitHub Pages IPs. The user explicitly decided to drop Vercel — don't assume `vercel.json` / `.vercel/project.json` reflect current routing. Verify with `curl -sI https://trace-logos.ru` (look for the GitHub Pages `server` header) or `gh run list --workflow=deploy.yml` if in doubt.

**Cache-Control is now GitHub Pages' default** (`max-age=600`) — GitHub Pages doesn't support custom response headers, so `vercel.json`'s `headers` block (30-day immutable caching for `/assets/logos/*`, `/assets/emoji/*`, etc., cache-busted via `ASSET_VERSION`/`build-version.js`) no longer applies in production. `build-version.js` still runs (harmless, and needed if Vercel/a CDN with custom headers is reintroduced later) but isn't doing cache-control work on the current host.

**`cdn.trace-logos.ru`** (added 2026-07-07) is a separate GitHub Pages site backed by the `sixxset5-star/trace-logos-cdn` repo (same pattern as `status.trace-logos.ru`/`upptime`) — it serves short, flat, embeddable logo URLs like `cdn.trace-logos.ru/vk.svg` for sharing/hotlinking. It is NOT built by this repo's `deploy.yml`; content is pushed by `scripts/deploy-cdn.js` (see that script's entry above under Build Scripts). DNS for `cdn.trace-logos.ru` is 4 A-records at the GitHub Pages IPs, set at reg.ru.

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
