---
title: Как вставить SVG на сайт — img, инлайн, background и что выбрать
title_en: How to Embed SVG on a Website — img, Inline, Background and Which to Pick
description: Четыре способа вставить SVG в HTML и CSS: тег img, инлайн‑код, background‑image и use‑спрайты. Плюсы, минусы, безопасность и готовые примеры кода.
description_en: Four ways to put SVG into HTML and CSS — the img tag, inline code, background-image and use-sprites. Pros, cons, security notes and code examples.
date: 2026-06-25
slug: kak-vstavit-svg-na-sajt
tags: SVG, Вёрстка, Сайты
tags_en: SVG, Web Development, Websites
---

SVG можно вставить на сайт четырьмя разными способами, и они не взаимозаменяемы: один даёт кэширование, другой — управление цветом из CSS, третий — экономию запросов. Выбор влияет на скорость, гибкость и даже безопасность. Разберём каждый способ с кодом и честным списком ограничений.

:::note Коротко
**Логотип и картинки** — `<img src="logo.svg">`: просто, кэшируется, безопасно. **Иконки, которые нужно перекрашивать** (ховеры, тёмная тема) — инлайн `<svg>` в HTML. **Декор и фоны** — `background-image` в CSS. Спрайты через `<use>` — когда одинаковых иконок много.
:::

## Способ 1. Тег img — дефолтный выбор

```
<img src="/images/logo.svg" alt="Логотип компании" width="140" height="40">
```

Работает как любая картинка: файл кэшируется браузером, лениво грузится с `loading="lazy"`, не раздувает HTML.

**Плюсы:** кэширование, простота, безопасность — скрипты внутри SVG в этом режиме не выполняются.

**Минусы:** нельзя управлять внутренностями из CSS. Перекрасить логотип по ховеру через `fill` не получится — стили страницы внутрь `<img>` не проникают.

:::tip Всегда указывайте width и height
Без явных размеров некоторые браузеры считают размер SVG уже после загрузки — и вёрстка прыгает. Атрибуты `width`/`height` резервируют место заранее и убирают сдвиг макета (тот самый CLS из Core Web Vitals).
:::

## Способ 2. Инлайн SVG — полный контроль

Код SVG вставляется прямо в HTML:

```
<button class="btn">
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <path d="M12 2L2 22h20L12 2z" fill="currentColor"/>
  </svg>
  Отправить
</button>
```

**Плюсы:** полное управление из CSS и JS — цвет, анимации, transition по ховеру. Волшебное слово `fill="currentColor"` заставляет иконку наследовать цвет текста: сменился цвет кнопки — сменилась и иконка, включая тёмную тему автоматически. Плюс ноль сетевых запросов.

**Минусы:** код не кэшируется (грузится с каждой страницей), раздувает HTML, а повторяющаяся иконка копипастится по всему шаблону.

**Когда выбирать:** интерфейсные иконки, которые меняют цвет по состоянию, и критичные элементы первого экрана, которым нельзя ждать сетевой запрос.

## Способ 3. Background‑image в CSS — для декора

```
.hero {
  background-image: url('/images/pattern.svg');
  background-size: cover;
}
```

**Плюсы:** кэшируется, декор отделён от контента, работают `background-repeat` и все фоновые трюки.

**Минусы:** перекрашивать нельзя (лайфхак: одноцветную иконку можно красить через `mask-image` + `background-color`), для скринридеров изображение невидимо — значит, только для декора, не для смысла.

## Способ 4. SVG‑спрайт и use — когда иконок много

Все иконки складываются в один файл‑спрайт, а на странице вызываются по id:

```
<svg class="icon"><use href="/sprite.svg#icon-search"/></svg>
```

**Плюсы:** один запрос на все иконки, кэшируется, `currentColor` работает.

**Минусы:** нужно собирать спрайт (обычно автоматикой в сборке), а с ленивой загрузкой отдельных иконок сложнее.

**Когда выбирать:** дизайн‑системы и интерфейсы с десятками повторяющихся иконок.

## Сводная таблица

| | img | инлайн | background | спрайт |
| --- | --- | --- | --- | --- |
| Кэширование | ✅ | ⛔ | ✅ | ✅ |
| Перекраска из CSS | ⛔ | ✅ | ⛔ | ✅ |
| Доступность (alt) | ✅ | ✅ | ⛔ | ✅ |
| Не раздувает HTML | ✅ | ⛔ | ✅ | ✅ |
| Типичный случай | логотип | иконки UI | декор | иконки UI (много) |

## Безопасность: почему чужой SVG нельзя вставлять инлайном

SVG — это XML, и внутри него могут жить `<script>`, обработчики событий и внешние ссылки. Через `<img>` и `background` браузер это всё игнорирует, а вот **инлайн‑вставка выполняет скрипты** с полными правами вашей страницы.

:::danger Правило
Инлайном вставляйте только SVG, которые вы контролируете: свои или из проверенного источника, прогнанные через оптимизатор (SVGO вычищает скрипты). SVG, загруженный пользователями, — только через `<img>` и с отдельного домена.
:::

## Частые вопросы

**Нужен ли фоллбэк в PNG?** Нет. SVG поддерживают все браузеры, которые вы встретите в 2026 году. Фоллбэки для IE — археология.

**Почему мой инлайн‑SVG огромный на странице?** У него, скорее всего, нет атрибута `viewBox` или заданы гигантские `width`/`height` в самом файле. Проверьте, что `viewBox` есть, а размеры управляются с уровня CSS.

**Как анимировать SVG?** Инлайн‑вставка + обычные CSS‑анимации на `path` и группы. Для сложного — библиотеки типа GSAP или Lottie (какая анимация логотипу вообще нужна — разбирали [отдельно](../animirovannyj-logotip/)).

**Работает ли lazy loading для SVG?** Для `<img>` — да, обычный `loading="lazy"`. Инлайн‑SVG грузится вместе с HTML и лениво не бывает — ещё один аргумент не инлайнить всё подряд.

**Как задать SVG в качестве курсора или favicon?** Favicon — да, через `<link rel="icon" type="image/svg+xml">` (детали — в [статье про фавиконы](../kak-sdelat-favicon/)). Курсор — формально можно (`cursor: url(icon.svg)`), но поддержка капризная, надёжнее PNG.

## Доступность: три атрибута, о которых забывают

SVG на сайте должен быть понятен не только глазам, но и скринридерам:

- **Смысловая картинка** (логотип, иллюстрация): в `<img>` — обычный `alt`; в инлайн‑SVG — `role="img"` и `<title>` первым дочерним элементом:

```
<svg role="img" viewBox="0 0 100 100">
  <title>Логотип компании</title>
  ...
</svg>
```

- **Декоративная иконка** рядом с текстом (иконка в кнопке «Отправить»): наоборот, спрячьте её от скринридера — `aria-hidden="true"`, иначе он прочитает и текст, и описание иконки.
- **Интерактивный SVG** (кнопка‑иконка без текста): `aria-label` на самой кнопке, а SVG внутри — с `aria-hidden`.

Это три строки кода, которые отделяют аккуратный сайт от сайта, где незрячий пользователь слышит «graphic graphic graphic» вместо навигации.

## Производительность: что даёт каждый способ в цифрах

Прикинем на типичной странице с логотипом и 20 иконками:

- **Всё инлайном:** +30‑60 КБ к каждому HTML‑документу; иконки не кэшируются между страницами. На сайте из 100 страниц пользователь скачает иконки 100 раз.
- **Всё через img:** 21 запрос при первом визите, дальше — из кэша. Но 20 запросов на старте — заметная пауза на медленных сетях (HTTP/2 смягчает, но не отменяет).
- **Спрайт + инлайн‑логотип:** 1 запрос на все иконки (кэшируется), логотип виден мгновенно без запроса. Обычно это оптимум.

И два усилителя для любого способа: сожмите SVG оптимизатором (минус 30‑70% веса — см. статью [про оптимизацию SVG](../kak-optimizirovat-svg/)) и убедитесь, что сервер отдаёт SVG с gzip/brotli — текстовый формат сжимается в 3‑5 раз.

## Частый вопрос: SVG‑логотип «прыгает» при загрузке

Классический симптом: страница отрисовалась, а логотип появился на долю секунды позже, сдвинув шапку. Причины и лечение:

1. **Нет width/height у img** — браузер не знает размер до загрузки. Задайте атрибуты.
2. **SVG грузится из CSS‑фона** после парсинга стилей — для логотипа в шапке используйте `<img>` или инлайн.
3. **Логотип зависит от веб‑шрифта** (текст в SVG не в кривых) — переведите текст в кривые.

Для первого экрана работает и приём «критический инлайн»: логотип шапки — инлайном (мгновенно), всё остальное — файлами с кэшированием.

## Коротко

`<img>` — для логотипов и картинок, инлайн — для перекрашиваемых иконок, background — для декора, спрайт — для иконок оптом. И никогда не инлайньте SVG из непроверенных источников.

Все SVG в нашем [каталоге логотипов](../../logos/) — чистый вектор без скриптов и мусора: можно скачать файл для `<img>` или скопировать код прямо в разметку одной кнопкой.

---EN---

There are four different ways to put an SVG on a website, and they're not interchangeable: one gives you caching, another CSS color control, a third saves requests. The choice affects speed, flexibility and even security. Let's go through each with code and an honest list of trade-offs.

:::note TL;DR
**Logos and images** — `<img src="logo.svg">`: simple, cached, safe. **Icons that change color** (hovers, dark mode) — inline `<svg>` in the HTML. **Decoration and backgrounds** — CSS `background-image`. **`<use>` sprites** — when you have lots of repeated icons.
:::

## Method 1. The img tag — the default

```
<img src="/images/logo.svg" alt="Company logo" width="140" height="40">
```

Behaves like any image: cached by the browser, lazy-loads with `loading="lazy"`, keeps HTML lean.

**Pros:** caching, simplicity, safety — scripts inside the SVG don't run in this mode.

**Cons:** no CSS access to the internals. You can't recolor the logo on hover with `fill` — page styles don't reach inside `<img>`.

:::tip Always set width and height
Without explicit dimensions some browsers measure the SVG only after it loads — and the layout jumps. `width`/`height` reserve the space upfront and kill layout shift (the CLS from Core Web Vitals).
:::

## Method 2. Inline SVG — full control

```
<button class="btn">
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <path d="M12 2L2 22h20L12 2z" fill="currentColor"/>
  </svg>
  Send
</button>
```

**Pros:** full CSS/JS control — color, animation, hover transitions. The magic word `fill="currentColor"` makes the icon inherit the text color: button color changes — icon follows, dark mode included, automatically. Zero network requests.

**Cons:** no caching (ships with every page), bloats HTML, and repeated icons get copy-pasted around.

**Choose for:** UI icons that change color by state, and above-the-fold elements that can't wait for a request.

## Method 3. CSS background-image — for decoration

```
.hero {
  background-image: url('/images/pattern.svg');
  background-size: cover;
}
```

**Pros:** cached, decoration separated from content, `background-repeat` and friends work.

**Cons:** no recoloring (workaround: paint one-color icons via `mask-image` + `background-color`); invisible to screen readers — so decoration only, never meaning.

## Method 4. SVG sprite with use — for many icons

All icons live in one sprite file, referenced by id:

```
<svg class="icon"><use href="/sprite.svg#icon-search"/></svg>
```

**Pros:** one request for all icons, cached, `currentColor` works.

**Cons:** requires building the sprite (usually automated), and per-icon lazy loading is awkward.

**Choose for:** design systems and interfaces with dozens of repeated icons.

## Summary table

| | img | inline | background | sprite |
| --- | --- | --- | --- | --- |
| Caching | ✅ | ⛔ | ✅ | ✅ |
| CSS recoloring | ⛔ | ✅ | ⛔ | ✅ |
| Accessibility (alt) | ✅ | ✅ | ⛔ | ✅ |
| Keeps HTML lean | ✅ | ⛔ | ✅ | ✅ |
| Typical case | logo | UI icons | decoration | UI icons (many) |

## Security: why you must not inline third-party SVG

SVG is XML, and it can carry `<script>`, event handlers and external references. Via `<img>` and `background` the browser ignores all of it — but **inlining executes scripts** with your page's full privileges.

:::danger The rule
Inline only SVGs you control: your own or from a trusted source, run through an optimizer (SVGO strips scripts). User-uploaded SVG — `<img>` only, served from a separate domain.
:::

## FAQ

**Do I need a PNG fallback?** No. Every browser you'll meet in 2026 supports SVG. IE fallbacks are archaeology.

**Why is my inline SVG huge on the page?** It probably lacks a `viewBox` or carries giant hardcoded `width`/`height`. Make sure `viewBox` exists and sizing is done in CSS.

**How do I animate SVG?** Inline it and use regular CSS animations on paths and groups. For complex work — GSAP or Lottie (what logo animation is even for — [covered separately](../animirovannyj-logotip/)).

**Does lazy loading work for SVG?** For `<img>` — yes, plain `loading="lazy"`. Inline SVG ships with the HTML and can't be lazy — one more argument against inlining everything.

**Can SVG be a cursor or favicon?** Favicon — yes, via `<link rel="icon" type="image/svg+xml">` ([the favicon article](../kak-sdelat-favicon/)). Cursor — formally possible (`cursor: url(icon.svg)`) but flaky; PNG is safer.

## Accessibility: the three attributes everyone forgets

An SVG should make sense to screen readers, not just eyes:

- **A meaningful image** (logo, illustration): in `<img>` — a normal `alt`; in inline SVG — `role="img"` plus a `<title>` as the first child:

```
<svg role="img" viewBox="0 0 100 100">
  <title>Company logo</title>
  ...
</svg>
```

- **A decorative icon** next to text (the icon inside a "Send" button): the opposite — hide it with `aria-hidden="true"`, or the reader announces both the text and the icon.
- **An interactive SVG** (an icon-only button): `aria-label` on the button itself, `aria-hidden` on the SVG inside.

Three lines of code separating a tidy site from one where a blind user hears "graphic graphic graphic" instead of navigation.

## Performance: what each method costs, in numbers

Take a typical page with a logo and 20 icons:

- **Everything inline:** +30–60 KB on every HTML document; icons never cache across pages. On a 100-page site the user downloads the icons 100 times.
- **Everything via img:** 21 requests on first visit, then cache. But 20 requests upfront is a visible pause on slow networks (HTTP/2 softens, doesn't cancel).
- **Sprite + inline logo:** 1 cached request for all icons, the logo renders instantly with zero requests. Usually the optimum.

Two multipliers for any method: run the SVG through an optimizer (30–70% off — see [SVG optimization](../kak-optimizirovat-svg/)) and confirm the server gzips/brotlis SVG — text compresses 3–5×.

## The classic complaint: the SVG logo "jumps" on load

The page renders, the logo pops in a beat later, shifting the header. Causes and cures:

1. **No width/height on the img** — the browser doesn't know the size until load. Set the attributes.
2. **The SVG loads from a CSS background** after style parsing — for a header logo use `<img>` or inline.
3. **The logo depends on a web font** (SVG text not outlined) — outline the text.

For above-the-fold there's also the "critical inline" pattern: the header logo inline (instant), everything else as cached files.

## In short

`<img>` for logos and images, inline for recolorable icons, background for decoration, sprites for icons in bulk. And never inline SVG from untrusted sources.

Every SVG in our [logo catalog](../../logos/) is clean vector with no scripts or junk: download the file for `<img>` or copy the markup straight to your clipboard with one button.
