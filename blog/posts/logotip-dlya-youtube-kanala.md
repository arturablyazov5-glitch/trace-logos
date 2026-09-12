---
title: Логотип и оформление YouTube‑канала — размеры и требования 2026
title_en: YouTube Channel Logo and Art — Sizes and Requirements for 2026
description: Аватарка, обложка и водяной знак YouTube‑канала: точные размеры, безопасная зона баннера, требования к файлам и типичные ошибки оформления
description_en: YouTube channel avatar, banner and watermark — exact sizes, the banner safe area, file requirements and common mistakes
date: 2026-08-16
slug: logotip-dlya-youtube-kanala
tags: YouTube, Инструкции, Брендинг
tags_en: YouTube, How-To, Branding
---

Оформление канала на [YouTube](../../logos/media/youtube/) состоит всего из трёх картинок — аватарки, обложки и водяного знака. Но именно на обложке ошибается почти каждый: [YouTube](../../logos/media/youtube/) показывает разным устройствам разные её куски, и логотип, красиво стоявший в макете, на телевизоре оказывается за краем экрана, а на телефоне — обрезан наполовину. Разбираем все размеры и безопасные зоны.

:::note Коротко
**Аватарка** — 800×800 px (показывается кружком). **Обложка** — 2560×1440 px, но всё важное держите в безопасной зоне **1546×423 px по центру**: только её видят все устройства. **Водяной знак** — 150×150 px. Форматы: PNG или JPG, для аватарки и знака лучше PNG. Исходник логотипа храните в SVG и экспортируйте растр под каждый слот.
:::

## Аватарка канала

Требуемый размер — **800×800 пикселей**, показывается всегда **кружком** диаметром от 32 px (в комментариях) до 176 px (шапка канала).

- **Проектируйте под круг.** Квадратный логотип с деталями в углах потеряет их при обрезке. Знак должен вписываться в окружность с запасом ~10% от края.
- **Никакого мелкого текста.** В комментариях аватарка — 32 пикселя; выживает только простой знак. Почему так — мы подробно разбирали в статье виды логотипов: монограммы и знаки масштабируются, полные надписи — нет.
- **Формат — PNG.** JPG на плоских заливках даёт артефакты у краёв (сравнение форматов — в статье [PNG или JPG](../png-ili-jpg-chto-luchshe/)). Прозрачность не нужна: [YouTube](../../logos/media/youtube/) всё равно подложит фон, лучше задать свой.
- **Исходник в векторе.** Держите логотип в SVG и экспортируйте 800×800 без потерь. Как это устроено, читайте в статье: [«Векторная и растровая графика»](../vektor-i-rastr-raznica/).

## Обложка (баннер): главная ловушка

Загружаемый файл — **2560×1440 px** (соотношение 16:9, до 6 МБ). Но целиком его видит только телевизор. Компьютер показывает горизонтальную полосу ~2560×423, телефон — ещё более узкий центральный фрагмент.

:::warning Безопасная зона — 1546×423
Единственная область, которую гарантированно видят **все** устройства, прямоугольник **1546×423 пикселя ровно по центру** файла 2560×1440. Логотип, название канала и расписание выпусков должны целиком лежать внутри неё. Всё за пределами области — декоративный фон, который можно и потерять.
:::

Практическая схема:

1. Создайте холст 2560×1440 в [Figma](../../logos/design/figma/), [Canva](../../logos/design/canva/) или [Adobe Photoshop](../../logos/design/photoshop/) (у [Canva](../../logos/design/canva/) есть готовый шаблон с разметкой зон).
2. Отметьте направляющими центральный прямоугольник 1546×423.
3. Логотип и текст только внутри него. Фон растяните на весь холст.
4. После загрузки проверьте предпросмотр: [YouTube](../../logos/media/youtube/) показывает, как обложка выглядит на ТВ, десктопе и мобильном.

## Композиция обложки: что положить в 1546×423

Безопасная зона — узкая горизонтальная полоса с пропорцией примерно 3.7:1, и это диктует композицию:

- **Классическая схема:** логотип слева или по центру, название канала рядом, короткий дескриптор («о финансах простыми словами») под ним и расписание («новые видео по средам») в углу зоны. Всё — не больше трёх строк.
- **Контраст с фоном.** Фон за пределами зоны может быть сколь угодно декоративным, но внутри неё текст обязан читаться: положите под надписи полупрозрачную плашку или затемните центр фоновой картинки.
- **Не дублируйте аватарку.** Логотип уже стоит слева от названия канала — если он же занимает центр обложки, шапка выглядит как склад одного и того же знака. В обложке лучше работает текстовая часть айдентики или слоган.
- **Проверьте тёмную и светлую тему.** Обложка одна на обе, а интерфейс вокруг неё меняется: белые надписи впритык к нижнему краю зоны могут слиться со светлой темой интерфейса.

## Превью, как продолжение логотипа

Канал узнают в ленте не по аватарке, а по превью — значит, у превью должна быть система, как у логотипа:

1. **Постоянный угол для знака.** Выберите один угол (обычно правый нижний, подальше от таймкода) и ставьте туда уменьшенный логотип во всех роликах.
2. **Своя палитра.** Два‑три фирменных цвета на плашках и обводках делают ряд превью узнаваемым даже без чтения заголовков — как выбрать цвета, разбирали в статье [психология цвета в логотипе](../psihologiya-cveta-v-logotipe/).
3. **Один шрифт.** Крупный (читается в 120 px), жирный, без теней‑радуг. Хорошо, если он совпадает со шрифтом логотипа — о подборе пары читайте в статье [шрифт для логотипа](../shrift-dlya-logotipa/).
4. **Шаблон.** Соберите мастер‑макет в [Figma](../../logos/design/figma/) с фиксированными слоями (фон, фото, плашка, текст, логотип) — новое превью будет занимать пять минут, а лента канала станет выглядеть как единый продукт.

## Водяной знак

Полупрозрачный логотип в правом нижнем углу всех видео, при наведении. Кнопка: «Подписаться». Требования: **150×150 px**, квадрат, до 1 МБ.

- Используйте упрощённый одноцветный знак — белый или светлый. Он лежит поверх видео и не должен спорить с картинкой.
- PNG с прозрачным фоном обязателен — иначе под знаком будет квадратная плашка (как получить прозрачный фон, рассказывали в статье [логотип с прозрачным фоном](../logotip-s-prozrachnym-fonom/)).
- В настройках показа выбирайте «во всех видео» — водяной знак работает как постоянная подпись канала.

## Сводная таблица размеров

| Слот | Размер файла | Реально видно | Формат |
| --- | --- | --- | --- |
| Аватарка | 800×800 px | круг 32‑176 px | PNG |
| Обложка | 2560×1440 px | безопасная зона 1546×423 px | JPG/PNG, до 6 МБ |
| Водяной знак | 150×150 px | ~30 px в углу видео | PNG с прозрачностью |
| Превью видео | 1280×720 px | от 120 px в ленте | JPG/PNG, до 2 МБ |

Превью роликов формально не «оформление канала», но именно оно чаще всего показывает логотип зрителю — держите знак в одном углу всех превью для узнаваемости в ленте.

## Типичные ошибки

- **Логотип в углу обложки.** В макете красиво — на телефоне за кадром. Только центральная зона.
- **Одна картинка на все площадки.** Обложка [YouTube](../../logos/media/youtube/), шапка [ВКонтакте](../../logos/social/vk/) и аватар [Telegram](../../logos/social/telegram/)-канала — три разных формата с разными обрезками; полный список размеров — в статье [размеры логотипа для сайта и соцсетей](../razmery-logotipa-dlya-sajta-i-socsetej/), а про оформление канала в [Telegram](../../logos/social/telegram/) у нас есть [отдельный разбор](../logotip-dlya-telegram-kanala/).
- **Растровый исходник.** Логотип, существующий только как PNG 500×500, придётся растягивать под обложку — получится мыло (что делать в этом случае — в статье [как перевести логотип в вектор](../kak-perevesti-logotip-v-vektor/)).
- **Мелкий текст на аватарке.** Слоган, год основания, «official» — в 32 пикселях это шум.

## Чек‑лист оформления канала

1. Аватарка 800×800, знак вписан в круг с запасом, без мелкого текста.
2. Обложка 2560×1440, всё важное — в центральных 1546×423.
3. Предпросмотр обложки проверен на ТВ / десктопе / мобильном.
4. Водяной знак 150×150, PNG с прозрачностью, показ «во всех видео».
5. Шаблон превью собран, логотип в одном углу во всех роликах.
6. Исходник логотипа — SVG; экспорты под каждый слот — PNG.
7. Аватарка и баннер согласованы с другими площадками — единый образ в [Telegram](../../logos/social/telegram/), [ВКонтакте](../../logos/social/vk/) и на сайте.

## Коротко

Три файла: аватарка 800×800 под круглую обрезку, обложка 2560×1440 со всем важным в центральных 1546×423, водяной знак 150×150 с прозрачностью. Исходник — вектор, экспорт — PNG под каждый слот. Иконки платформ и брендов для превью и оформления берите в нашем [каталоге логотипов](../../logos/) — там всё уже в SVG и PNG.

---EN---

Channel art on [YouTube](../../logos/media/youtube/) is just three images — avatar, banner and watermark. Yet almost everyone gets the banner wrong: [YouTube](../../logos/media/youtube/) shows different slices of it to different devices, so a logo that looked great in the mockup ends up off-screen on a TV and half-cropped on a phone. Here are all the sizes and safe areas.

:::note TL;DR
**Avatar** — 800×800 px (always shown as a circle). **Banner** — 2560×1440 px, but keep everything important inside the **1546×423 px safe area in the center**: it's the only region every device shows. **Watermark** — 150×150 px. Formats: PNG or JPG; PNG for the avatar and watermark. Keep the logo master in SVG and export raster per slot.
:::

## Channel avatar

Required size — **800×800 pixels**, always displayed as a **circle** from 32 px (comments) to 176 px (channel header).

- **Design for the circle.** A square logo with corner details loses them to the crop. The mark should fit the circle with ~10% margin.
- **No small text.** In comments the avatar is 32 pixels; only a simple mark survives. Why — see types of logos: monograms and marks scale, full lockups don't.
- **Format — PNG.** JPG produces edge artifacts on flat fills (formats compared in [PNG vs JPG](../png-ili-jpg-chto-luchshe/)). Transparency isn't needed: [YouTube](../../logos/media/youtube/) adds a background anyway — better set your own.
- **Master in vector.** Keep the logo as SVG and export a lossless 800×800 — how that works is in [vector vs raster](../vektor-i-rastr-raznica/).

## Banner: the big trap

The uploaded file is **2560×1440 px** (16:9, up to 6 MB). But only TVs show all of it. Desktop displays a horizontal strip of ~2560×423; phones show an even narrower central fragment.

:::warning The safe area is 1546×423
The only region **every** device is guaranteed to show is the **1546×423 pixel rectangle dead center** of the 2560×1440 file. The logo, channel name and upload schedule must sit entirely inside it. Everything outside is decorative background you can afford to lose.
:::

The practical workflow:

1. Create a 2560×1440 canvas in [Figma](../../logos/design/figma/), [Canva](../../logos/design/canva/) or [Adobe Photoshop](../../logos/design/photoshop/) ([Canva](../../logos/design/canva/) has a ready template with the zones marked).
2. Add guides for the central 1546×423 rectangle.
3. Logo and text go inside it only; stretch the background across the full canvas.
4. After uploading, check the preview: [YouTube](../../logos/media/youtube/) shows how the banner looks on TV, desktop and mobile.

## Banner composition: what goes into 1546×423

The safe area is a narrow horizontal strip of roughly 3.7:1, and that dictates the composition:

- **The classic scheme:** logo left or centered, channel name next to it, a short descriptor ("personal finance in plain words") beneath, and the schedule ("new videos every Wednesday") in a corner of the zone. Three lines maximum.
- **Contrast against the background.** Outside the zone the background can be as decorative as you like, but inside it the text must read: put a semi-transparent plate under the lettering or darken the center of the background image.
- **Don't duplicate the avatar.** The logo already sits next to the channel name — if it also fills the banner center, the header looks like a warehouse of one mark. The banner is better served by the wordmark or a slogan.
- **Check both themes.** One banner serves dark and light UI alike: white text hugging the zone's bottom edge can melt into the light theme.

## Thumbnails as an extension of the logo

In the feed a channel is recognized by thumbnails, not the avatar — so thumbnails need a system, like a logo does:

1. **A fixed corner for the mark.** Pick one corner (usually bottom-right, away from the timestamp) and place the shrunken logo there in every video.
2. **A palette of your own.** Two-three brand colors on plates and outlines make a row of thumbnails recognizable before the titles are read — picking them is covered in [color psychology in logos](../psihologiya-cveta-v-logotipe/).
3. **One typeface.** Large (legible at 120 px), bold, no rainbow shadows. Bonus points if it matches the logo's typeface — see [choosing a logo font](../shrift-dlya-logotipa/).
4. **A template.** Build a master layout in [Figma](../../logos/design/figma/) with fixed layers (background, photo, plate, text, logo) — each new thumbnail takes five minutes, and the channel feed reads as one product.

## Watermark

The semi-transparent logo in the bottom-right corner of every video; on hover it becomes a Subscribe button. Requirements: **150×150 px**, square, up to 1 MB.

- Use a simplified single-color mark — white or light: it sits on top of footage and must not fight the picture.
- PNG with a transparent background is mandatory — otherwise the mark gets a square plate under it (how to get transparency — [logo with a transparent background](../logotip-s-prozrachnym-fonom/)).
- In display settings choose "entire video" — the watermark works as the channel's permanent signature.

## Size cheat sheet

| Slot | File size | Actually visible | Format |
| --- | --- | --- | --- |
| Avatar | 800×800 px | circle 32-176 px | PNG |
| Banner | 2560×1440 px | 1546×423 px safe area | JPG/PNG, up to 6 MB |
| Watermark | 150×150 px | ~30 px in the video corner | transparent PNG |
| Thumbnail | 1280×720 px | from 120 px in the feed | JPG/PNG, up to 2 MB |

Thumbnails technically aren't "channel art", but they show your logo to viewers more often than anything else — keep the mark in the same corner of every thumbnail for feed recognition.

## Common mistakes

- **Logo in the banner corner.** Pretty in the mockup — off-screen on a phone. Central zone only.
- **One image for every platform.** The [YouTube](../../logos/media/youtube/) banner, the [VK](../../logos/social/vk/) cover and a [Telegram](../../logos/social/telegram/) channel avatar are three different formats with different crops; the full size list is in [logo sizes for websites and social networks](../razmery-logotipa-dlya-sajta-i-socsetej/), and [Telegram](../../logos/social/telegram/) channel art has [its own guide](../logotip-dlya-telegram-kanala/).
- **A raster-only master.** A logo that exists only as a 500×500 PNG will have to be stretched for the banner — hello blur (what to do about it — [how to vectorize a logo](../kak-perevesti-logotip-v-vektor/)).
- **Small text on the avatar.** A slogan, founding year, "official" — at 32 pixels it's all noise.

## Channel art checklist

1. Avatar 800×800, mark fits the circle with margin, no small text.
2. Banner 2560×1440, everything important inside the central 1546×423.
3. Banner preview checked on TV / desktop / mobile.
4. Watermark 150×150, transparent PNG, set to "entire video".
5. Thumbnail template built, logo in the same corner in every video.
6. Logo master is SVG; per-slot exports are PNG.
7. Avatar and banner aligned with your other platforms — one image across [Telegram](../../logos/social/telegram/), [VK](../../logos/social/vk/) and the website.

## In short

Three files: an 800×800 avatar designed for a circular crop, a 2560×1440 banner with everything important inside the central 1546×423, and a 150×150 transparent watermark. Master in vector, export PNG per slot. Platform and brand icons for thumbnails and art are in our [logo catalog](../../logos/) — already in SVG and PNG.
