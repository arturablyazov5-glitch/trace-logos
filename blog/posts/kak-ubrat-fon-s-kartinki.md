---
title: Как убрать фон с картинки — 6 бесплатных способов
title_en: How to Remove a Background From an Image — 6 Free Ways
description: Как удалить фон с логотипа или фото: онлайн‑сервисы, нейросети, Figma, Photoshop, встроенные функции macOS и iPhone. Пошагово, бесплатно, с сохранением качества.
description_en: How to delete the background from a logo or photo: online tools, AI, Figma, Photoshop, built-in macOS and iPhone features. Step by step, free.
date: 2026-08-12
slug: kak-ubrat-fon-s-kartinki
tags: Инструкции, Форматы, Инструменты
tags_en: How-To, Formats, Tools
---

Логотип прислали на белой плашке, а нужен прозрачный. Фото товара — на фоне склада, а нужен чистый каталожный кадр. Убрать фон — одна из самых частых графических задач, и в 2026 году она решается за секунды: нейросети вырезают объект точнее, чем вручную. Разбираем шесть рабочих способов — от кнопки в телефоне до профессиональных инструментов — и объясняем, в каком формате сохранять результат, чтобы прозрачность не пропала.

:::note Коротко
Быстрые пути: **iPhone/Mac** — прозрачный фон встроен в систему (долгое нажатие на объект / Быстрые действия); **онлайн** — сервисы типа remove.bg и Adobe Express вырезают фон нейросетью бесплатно; **[Figma](../../logos/design/figma/)** и **[Photoshop](../../logos/design/photoshop/)** — для контроля над результатом. Сохранять — только в **PNG**, **WebP** или **SVG**: JPG прозрачность не поддерживает.
:::

## Сначала главное: в чём сохранять результат

Самая обидная ошибка — аккуратно вырезать фон и сохранить в JPG: формат не поддерживает прозрачность, и на месте вырезанного появится белая заливка. Правила простые (подробно — в статье [PNG или JPG](../png-ili-jpg-chto-luchshe/)):

| Формат | Прозрачность | Когда использовать |
| --- | --- | --- |
| **PNG** | ✅ | универсальный выбор для фото и логотипов |
| **WebP** | ✅ | для сайтов — легче PNG |
| **SVG** | ✅ | только для векторных логотипов |
| **JPG** | ⛔ | никогда для картинок без фона |

Если задача — именно логотип с прозрачным фоном, у нас есть отдельная подробная статья: [логотип с прозрачным фоном](../logotip-s-prozrachnym-fonom/). А логотипы известных брендов проще не вырезать, а сразу скачать без фона из нашего [каталога](../../logos/) — в SVG и PNG.

## Способ 1. iPhone и iPad — долгое нажатие

Начиная с iOS 16 удаление фона встроено в систему:

1. Откройте картинку в приложении Фото.
2. Нажмите на объект и удерживайте — система обведёт его мерцающим контуром.
3. Выберите **«Скопировать»** или **«Поделиться» → «Сохранить изображение»** — объект сохранится в PNG с прозрачным фоном.

Работает и в Safari с картинками на веб‑страницах. Качество вырезания на фото с чётким объектом — отличное; на сложных фонах и полупрозрачных объектах (стекло, волосы) возможны артефакты.

## Способ 2. Mac — «Быстрые действия» и Просмотр

В macOS та же нейросеть доступна прямо в Finder: правый клик по файлу → **«Быстрые действия» → «Удалить фон»**. Рядом с исходником появится копия в PNG без фона. Альтернатива — приложение [Просмотр (Preview)](../../logos/design/preview/): инструмент «Волшебная палочка» позволяет выделить и удалить фон вручную, что удобно для картинок с однотонной заливкой.

## Способ 3. Онлайн‑сервисы с нейросетью

Если под рукой только браузер, фон уберут онлайн‑инструменты: remove.bg (эталон для фото), Adobe Express, Canva (в бесплатном тарифе — с ограничениями), PhotoRoom и десятки аналогов. Сценарий везде одинаковый: загрузили картинку → нейросеть вырезала объект за пару секунд → скачали PNG.

:::warning Два подводных камня онлайн‑сервисов
**Разрешение.** Бесплатные тарифы часто отдают результат в уменьшенном размере (например, до 0,25 мегапикселя у remove.bg), а полный — за деньги. Проверяйте размеры скачанного файла.
**Приватность.** Вы загружаете изображение на чужой сервер. Для логотипа из интернета это неважно, для паспорта или закрытого макета — используйте локальные способы (iPhone, Mac, Figma).
:::

## Способ 4. Figma — контроль и бесплатно

У [Figma](../../logos/design/figma/) есть встроенный ИИ‑инструмент **Remove background**: выделяете картинку на холсте → в панели действий или во всплывающем тулбаре изображения жмёте «Remove background» — фон уходит без плагинов, разрешение и слои сохраняются. Рядом там же — **Boost resolution** для апскейла размытой картинки. Нюанс: эти ИИ‑функции доступны только на платных планах (Professional/Organization/Enterprise) с полным местом (Full seat) и включённым AI. На бесплатном тарифе выручит плагин вроде Remove BG или Background Remover (найдите в меню плагинов) — либо трюк без плагинов для логотипов с белой плашкой: режим наложения **Multiply** делает белый фон визуально прозрачным на светлых макетах, но это маскировка, а не удаление. Про работу с логотипами в Figma у нас есть отдельная инструкция: [как вставить логотип в Figma](../kak-vstavit-logotip-v-figma/).

## Способ 5. Photoshop — когда нужен идеальный контур

[Photoshop](../../logos/design/photoshop/) остаётся выбором для сложных случаев: волосы, мех, полупрозрачные края, тени, которые нужно сохранить:

1. **Выделение → Выделить объект** — нейросеть строит выделение одним кликом.
2. Уточните край инструментом **«Выделение и маска»**: ползунки радиуса и растушёвки решают проблему «жёсткого» контура.
3. Создайте маску слоя — фон скрыт, но не удалён: любую ошибку можно поправить кистью по маске.
4. **Экспорт → PNG** с прозрачностью.

Бесплатные альтернативы того же класса — GIMP (инструмент «Выделение переднего плана») и онлайновый Photopea, почти полностью повторяющий интерфейс Photoshop.

## Способ 6. Для логотипов — перевод в вектор

Если нужно убрать фон именно у логотипа, растровые методы — полумера: даже идеально вырезанный PNG останется растровым и [поплывёт при увеличении](../pochemu-logotip-razmytyj/). Правильное решение — трассировка в вектор: контуры перерисовываются кривыми, фон исчезает по определению, а результат масштабируется бесконечно. Как это сделать в [Illustrator](../../logos/design/illustrator/), Inkscape или онлайн — читайте в статье [как перевести логотип в вектор](../kak-perevesti-logotip-v-vektor/).

## Какой способ выбрать

- **Фото объекта, нужно быстро** → iPhone/Mac встроенными средствами или remove.bg.
- **Много товарных фото** → PhotoRoom / Photoshop с экшенами — пакетная обработка.
- **Сложный контур (волосы, стекло)** → Photoshop или GIMP вручную.
- **Логотип бренда** → не вырезать, а скачать готовый: в нашем [каталоге](../../logos/) тысячи логотипов уже лежат с прозрачным фоном — [как правильно скачивать логотипы](../kak-skachat-logotip-s-sajta/).
- **Свой логотип с плашкой** → [перевести в вектор](../kak-perevesti-logotip-v-vektor/) один раз и забыть о проблеме.

---EN---

The logo arrived on a white badge but you need it transparent. The product photo has a warehouse behind it but you need a clean catalog shot. Removing a background is one of the most common graphics tasks, and in 2026 it takes seconds: neural networks cut out objects more accurately than hand work. Here are six working methods — from a button on your phone to professional tools — plus the file formats that won't lose your transparency.

:::note TL;DR
Fast paths: **iPhone/Mac** — background removal is built into the OS (long-press the subject / Quick Actions); **online** — services like remove.bg and Adobe Express cut backgrounds with AI for free; **[Figma](../../logos/design/figma/)** and **[Photoshop](../../logos/design/photoshop/)** — when you need control. Save only to **PNG**, **WebP** or **SVG**: JPG does not support transparency.
:::

## First things first: what to save the result as

The most painful mistake: carefully cutting the background and saving as JPG — the format has no transparency, so the cut area becomes white fill. The rules are simple (details in [PNG vs JPG](../png-ili-jpg-chto-luchshe/)):

| Format | Transparency | When to use |
| --- | --- | --- |
| **PNG** | ✅ | the universal choice for photos and logos |
| **WebP** | ✅ | for websites — lighter than PNG |
| **SVG** | ✅ | vector logos only |
| **JPG** | ⛔ | never for background-free images |

If your task is specifically a transparent logo, we have a dedicated guide: [logo with a transparent background](../logotip-s-prozrachnym-fonom/). And famous brand logos are easier to download than to cut out — our [catalog](../../logos/) has them in SVG and PNG, background-free.

## Method 1. iPhone and iPad — long press

Since iOS 16, background removal is built into the system:

1. Open the image in Photos.
2. Press and hold the subject — the system traces it with a shimmering outline.
3. Choose **Copy** or **Share → Save Image** — the subject is saved as a transparent PNG.

Also works in Safari on web images. Quality on photos with a clear subject is excellent; complex backgrounds and translucent objects (glass, hair) may produce artifacts.

## Method 2. Mac — Quick Actions and Preview

On macOS the same neural network is available right in Finder: right-click a file → **Quick Actions → Remove Background**. A background-free PNG copy appears next to the original. The alternative is the [Preview](../../logos/design/preview/) app: its Instant Alpha (magic wand) tool selects and deletes flat-color backgrounds manually.

## Method 3. Online AI services

If all you have is a browser, online tools will do it: remove.bg (the benchmark for photos), Adobe Express, Canva (with free-tier limits), PhotoRoom and dozens of others. The flow is identical everywhere: upload → the AI cuts the subject in seconds → download a PNG.

:::warning Two catches with online services
**Resolution.** Free tiers often return a downscaled result (e.g. 0.25 megapixels at remove.bg) and sell the full size. Check the dimensions of what you downloaded.
**Privacy.** You are uploading the image to someone's server. Fine for a logo from the internet; for a passport or an unreleased design use local methods (iPhone, Mac, Figma).
:::

## Method 4. Figma — control, for free

[Figma](../../logos/design/figma/) now ships a built-in AI **Remove background** tool: select the image on the canvas, hit "Remove background" from the actions menu or the image's inline toolbar — no plugin needed, resolution and layers stay intact. Right next to it is **Boost resolution**, an AI upscaler for blurry images. Catch: these AI tools require a paid plan (Professional/Organization/Enterprise) with a Full seat and AI enabled. On the free tier, a plugin like Remove BG or Background Remover (find it in the plugins menu) still does the job — or, for logos on a white badge, a no-plugin trick: the **Multiply** blend mode makes white visually transparent on light layouts, though that's camouflage, not removal. For logo workflows in Figma see our guide: [how to insert a logo into Figma](../kak-vstavit-logotip-v-figma/).

## Method 5. Photoshop — when the edge must be perfect

[Photoshop](../../logos/design/photoshop/) remains the choice for hard cases: hair, fur, translucent edges, shadows you want to keep:

1. **Select → Subject** — AI builds the selection in one click.
2. Refine with **Select and Mask**: the radius and feather sliders fix harsh outlines.
3. Add a layer mask — the background is hidden, not deleted: any mistake is fixable with a brush on the mask.
4. **Export → PNG** with transparency.

Free alternatives in the same class: GIMP (Foreground Select) and the online Photopea, which mirrors Photoshop's interface almost completely.

## Method 6. For logos — convert to vector

If the background you're removing belongs to a logo, raster methods are a half-measure: even a perfectly cut PNG stays raster and [blurs when scaled](../pochemu-logotip-razmytyj/). The proper fix is vector tracing: the shapes are redrawn as curves, the background disappears by definition, and the result scales infinitely. How to do it in [Illustrator](../../logos/design/illustrator/), Inkscape or online — in [how to vectorize a logo](../kak-perevesti-logotip-v-vektor/).

## Which method to pick

- **A photo subject, need it fast** → built-in iPhone/Mac tools or remove.bg.
- **Lots of product photos** → PhotoRoom / Photoshop actions — batch processing.
- **A tricky outline (hair, glass)** → Photoshop or GIMP by hand.
- **A brand's logo** → don't cut it out, download it ready-made: thousands of logos in our [catalog](../../logos/) already have transparent backgrounds — see [how to download a logo properly](../kak-skachat-logotip-s-sajta/).
- **Your own logo on a badge** → [vectorize it](../kak-perevesti-logotip-v-vektor/) once and forget the problem.
