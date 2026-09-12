---
title: Размеры логотипа для сайта и соцсетей — полная шпаргалка 2026
title_en: Logo Sizes for Websites and Social Media — the 2026 Cheat Sheet
description: Какого размера должен быть логотип в шапке сайта, аватарках Telegram, VK, YouTube, в OG‑превью и письмах. Таблицы размеров и правила подготовки файлов.
description_en: What size a logo should be in a site header, Telegram, VK and YouTube avatars, OG previews and emails. Size tables and file-prep rules.
date: 2026-07-10
slug: razmery-logotipa-dlya-sajta-i-socsetej
tags: Логотипы, Размеры, Соцсети
tags_en: Logos, Sizes, Social Media
---

«Пришлите логотип для сайта» — а какого размера? В пикселях ответа нет. В шапке сайта логотип занимает 120‑200 пикселей, в аватарке [Telegram](../../logos/social/telegram/) его сожмут до кружочка, а в поисковой выдаче до 16 пикселей. Один и тот же знак живёт в десятке размеров одновременно. Собрали шпаргалку по всем основным площадкам и правилам подготовки файлов.

:::note Коротко
Для сайта — **SVG, высота 28‑40 px в шапке**, размер не важен, вектор чёткий везде. Для соцсетей — **PNG‑квадрат от 512×512** с крупным знаком по центру: площадки сами нарежут его в свои размеры. Главная ошибка — грузить в аватарку горизонтальный логотип с текстом: после обрезки в круг от него остаётся нечитаемый огрызок.
:::

## Логотип на сайте

| Место | Рекомендация |
| --- | --- |
| Шапка (десктоп) | высота 28‑40 px, ширина до ~200 px |
| Шапка (мобайл) | высота 24‑32 px |
| Подвал | можно мельче, часто монохром |
| Фавикон | 16‑48 px, отдельный упрощённый знак |

Три правила:

1. **Формат — SVG.** Один файл закрывает все плотности экранов. Если только PNG — берите вдвое больше отображаемого размера, иначе на ретине будет мыло (почему, разбирали в статье [про размытые логотипы](../pochemu-logotip-razmytyj/)).
2. **Задавайте высоту, а не ширину.** Логотипы разных пропорций в шапке выравнивают по высоте. Так они смотрятся соразмерно навигации.
3. **Не растягивайте на всю шапку.** Гигантский логотип признак сайта из 2008‑го. Он должен быть заметен, но не доминировать.

## Аватарки соцсетей и мессенджеров

Площадки просят квадрат, а показывают часто круг. Поэтому знак должен уверенно жить в круге: без важных деталей по углам.

| Площадка | Загружаемый размер | Показ |
| --- | --- | --- |
| [Telegram](../../logos/social/telegram/) | от 512×512 | круг |
| [VK](../../logos/social/vk/) | от 400×400 | круг |
| [YouTube](../../logos/media/youtube/) | 800×800 | круг |
| [WhatsApp](../../logos/social/whatsapp/) | 500×500 | круг |
| [X (Twitter)](../../logos/social/x/) | 400×400 | круг |
| [Дзен](../../logos/media/yandexdzen/) | от 300×300 | круг |

:::danger Классическая ошибка
Загрузить в аватарку полный горизонтальный логотип «знак + название». После вписывания в круг текст обрезается или становится микроскопическим. В аватарку идёт **только знак**: иконка, буква или символ, занимающий 60‑80% площади квадрата.
:::

Разбор конкретно под Telegram‑канал (с обрезкой в круг и читаемостью в 40 пикселях) — в [отдельной статье про аватарку Telegram‑канала](../logotip-dlya-telegram-kanala/). Полное оформление YouTube‑канала — обложка, водяной знак, безопасные зоны — в гиде по оформлению YouTube‑канала.

## Обложки и превью

| Место | Размер |
| --- | --- |
| OG‑превью (превью ссылки в соцсетях) | 1200×630 |
| Обложка сообщества [VK](../../logos/social/vk/) | 1920×768 |
| Шапка канала [YouTube](../../logos/media/youtube/) | 2560×1440 (безопасная зона 1546×423) |
| Обложка [Telegram](../../logos/social/telegram/)-канала | не поддерживается, только аватар |

OG‑превью — недооценённая точка контакта: именно эту картинку видят, когда вашей ссылкой делятся в [Telegram](../../logos/social/telegram/) или [VK](../../logos/social/vk/). Логотип на ней должен быть в безопасной зоне по центру: края превью подрезаются на разных устройствах.

## Логотип в письмах

Почтовые клиенты — территория ограничений: SVG поддерживается плохо, поэтому здесь исключение из правила «всегда вектор».

- Формат: **PNG с прозрачным фоном**.
- Ширина в вёрстке: 120‑200 px, файл вдвое больше (240‑400 px) для ретины.
- Обязательно пропишите `width` в атрибутах и alt‑текст: у многих получателей картинки по умолчанию скрыты, и вместо логотипа виден именно alt.

## Печать: другая система координат

Для печати размер задаётся не пикселями, а физическими величинами и разрешением 300 dpi. Визитка, бланк, вывеска — везде отдавайте вектор (SVG, EPS, PDF), и вопрос размера исчезнет вовсе: вектор масштабируется под любой носитель. Какие форматы для чего — в [гиде по форматам логотипа](../v-kakom-formate-nuzhen-logotip/).

## Как подготовить комплект за 10 минут

1. Возьмите SVG‑исходник логотипа и отдельно SVG знака (без текста).
2. Из знака экспортируйте PNG 512×512 и 1024×1024 — это закроет все аватарки. Те же 1024×1024 нужны для иконки мобильного приложения (App Store требует ровно этот размер) — правила и подводные камни разбирали в [гиде по иконке приложения](../ikonka-prilozheniya/).
3. Из полного логотипа — PNG шириной 400 px для писем и документов.
4. Проверьте каждую версию на светлом и тёмном фоне: если знак пропадает на тёмном, нужна светлая версия.

:::tip Правило запаса
Всегда храните растровые версии в 2 раза больше, чем требует площадка. Уменьшить — секунда, увеличить без потерь — невозможно. А лучше храните вектор и генерируйте растр по запросу.
:::

## Логотип в поисковой выдаче и сниппетах

Ещё два места, где живёт ваш логотип и о которых часто забывают:

- **Фавикон в выдаче** — Яндекс и Google показывают иконку сайта рядом со сниппетом; без неё место занимает серый глобус. Требования и сборка — в [отдельном гиде по фавиконам](../kak-sdelat-favicon/).
- **Логотип организации для [Google](../../logos/search/google/) или [Яндекса](../../logos/search/yandex/)** — поисковики берут его из микроразметки `Organization` (поле `logo`) и карточек компаний. Рекомендации: квадратное или близкое к квадрату изображение от 112×112, доступное по постоянному URL. Это тот логотип, который появляется в панели знаний и карточке организации.
- **OG‑разметка** — превью ссылок собирается из `og:image` (1200×630). Если специальной OG‑картинки нет, соцсети возьмут случайное изображение со страницы — задайте её явно, поместив логотип в безопасную центральную зону.

## Как отдавать логотип в разных плотностях: srcset

Если вы верстаете сайт и вынуждены использовать PNG (например, логотип фотографический), отдавайте его в двух плотностях через `srcset` — браузер сам выберет версию под экран:

```
<img src="/logo-200.png"
     srcset="/logo-200.png 1x, /logo-400.png 2x"
     width="200" height="60" alt="Логотип компании">
```

Для SVG всё это не нужно — одна ссылка закрывает все плотности, что снова говорит в пользу вектора.

## Чек‑лист типовых носителей: сохраните себе

| Носитель | Файл | Размер |
| --- | --- | --- |
| Шапка сайта | SVG | высота 28‑40 px в вёрстке |
| Фавикон | SVG + ICO + PNG | 32/180/192 |
| Аватарки соцсетей | PNG‑квадрат | 1024×1024 (знак 60‑80%) |
| OG‑превью | PNG/JPG | 1200×630 |
| Письма | PNG | ширина 240‑400 px (показ 120‑200) |
| Презентации | SVG или PNG | PNG от 800 px по ширине |
| Мессенджеры/стикеры | PNG | 512×512 |
| Печать | вектор (PDF/EPS/SVG) | любой физический размер |
| Логотип для микроразметки | PNG | от 112×112, квадрат |

Соберите эти файлы один раз в папку с говорящими именами — и вопрос «какой размер логотипа нужен для…» перестанет возникать. Полный состав комплекта и форматы — в [гиде по форматам логотипа](../v-kakom-formate-nuzhen-logotip/).

## Коротко

На сайт — SVG и высота 28‑40 px, в соцсети — квадратный PNG от 512 px с одним только знаком, в письма — PNG с двойным запасом, в печать — вектор. И никогда не суйте горизонтальный логотип в круглую аватарку.

Нужные размеры удобно получать из нашего [каталога логотипов](../../logos/): каждый бренд лежит в SVG и PNG, а PNG при скачивании можно выбрать в нужном размере — от иконки до 4K.

---EN---

«Send us the logo for the website» — at what size? There's no single answer in pixels: a site header shows the logo at 120–200 px, a Telegram avatar squeezes it into a circle, search results shrink it to 16 px. The same mark lives at a dozen sizes at once. Here's the cheat sheet for every major placement, plus the file-prep rules.

:::note TL;DR
For websites — **SVG at 28–40 px height in the header**; being vector, it's sharp everywhere. For social — a **square PNG of 512×512 or larger** with a big centered mark: platforms slice it into their own sizes. The #1 mistake is uploading a horizontal text logo as an avatar: after the circular crop, an unreadable stump remains.
:::

## Logo on a website

| Placement | Recommendation |
| --- | --- |
| Header (desktop) | height 28–40 px, width up to ~200 px |
| Header (mobile) | height 24–32 px |
| Footer | can be smaller, often monochrome |
| Favicon | 16–48 px, a separate simplified mark |

Three rules:

1. **Format — SVG.** One file covers every screen density. PNG-only? Use twice the display size, or retina screens will blur it (see [why logos look blurry](../pochemu-logotip-razmytyj/)).
2. **Set the height, not the width.** Logos of different proportions align by height in a header — that's what looks balanced next to navigation.
3. **Don't stretch it across the header.** A giant logo screams 2008. It should be noticeable, not dominant.

## Social media avatars

Platforms ask for a square but often display a circle. The mark must live confidently inside a circle: no important details in the corners.

| Platform | Upload size | Display |
| --- | --- | --- |
| [Telegram](../../logos/social/telegram/) | 512×512+ | circle |
| [VK](../../logos/social/vk/) | 400×400+ | circle |
| [YouTube](../../logos/media/youtube/) | 800×800 | circle |
| [WhatsApp](../../logos/social/whatsapp/) | 500×500 | circle |
| [X (Twitter)](../../logos/social/x/) | 400×400 | circle |

:::danger The classic mistake
Uploading the full horizontal "mark + name" logo as an avatar. After the circular crop the text is cut off or microscopic. An avatar gets the **mark only** — icon, letter, symbol — filling 60–80% of the square.
:::

For the specifics of a Telegram channel avatar (circular crop, legibility at 40 px) see [the dedicated Telegram channel avatar guide](../logotip-dlya-telegram-kanala/). For full YouTube channel branding — cover, watermark, safe areas — see the YouTube channel branding guide.

## Covers and previews

| Placement | Size |
| --- | --- |
| OG preview (link cards in social/messengers) | 1200×630 |
| [VK](../../logos/social/vk/) community cover | 1920×768 |
| [YouTube](../../logos/media/youtube/) channel banner | 2560×1440 (safe area 1546×423) |

The OG preview is an underrated touchpoint: it's what people see when your link is shared in [Telegram](../../logos/social/telegram/) or [VK](../../logos/social/vk/). Keep the logo in the central safe zone — edges get cropped on different devices.

## Logos in email

Email clients are restriction territory: SVG support is poor, so this is the exception to "always vector".

- Format: **transparent PNG**.
- Layout width 120–200 px; the file itself 2× that (240–400 px) for retina.
- Always set the `width` attribute and alt text: many recipients have images off by default and see the alt instead of the logo.

## Print: a different coordinate system

Print sizing uses physical units at 300 dpi, not pixels. Business card, letterhead, signage — always hand over vector (SVG, EPS, PDF) and the size question disappears: vectors scale to any medium. Which format for what — in [the logo format guide](../v-kakom-formate-nuzhen-logotip/).

## A full kit in 10 minutes

1. Take the logo's SVG master and a separate SVG of the mark alone (no text).
2. From the mark, export 512×512 and 1024×1024 PNGs — covers every avatar. The same 1024×1024 is what App Store requires for a mobile app icon — rules and gotchas in [the app icon guide](../ikonka-prilozheniya/).
3. From the full logo — a 400 px wide PNG for emails and documents.
4. Check every version on light and dark backgrounds; if the mark vanishes on dark, you need a light variant.

:::tip The margin rule
Store raster versions at 2× what platforms require. Downscaling takes a second; lossless upscaling is impossible. Better yet, store the vector and generate raster on demand.
:::

## Your logo in search results and snippets

Two more homes for your logo that get forgotten:

- **The favicon in search results** — Yandex and Google show the site icon next to the snippet; without one, a gray globe takes the seat. Requirements and assembly — in [the favicon guide](../kak-sdelat-favicon/).
- **The organization logo for search engines** — pulled from `Organization` microdata (the `logo` field) and business profiles. Recommendations: square-ish, 112×112 minimum, at a stable URL. This is the logo that surfaces in knowledge panels.
- **OG markup** — link previews are built from `og:image` (1200×630). Without an explicit OG image, social networks grab a random picture off the page — set it deliberately, logo in the central safe zone.

## Serving densities properly: srcset

If you must use PNG in markup (say, a photographic logo), serve two densities via `srcset` and let the browser pick:

```
<img src="/logo-200.png"
     srcset="/logo-200.png 1x, /logo-400.png 2x"
     width="200" height="60" alt="Company logo">
```

SVG needs none of this — one URL covers every density, which once more argues for vectors.

## The carrier checklist: save this

| Carrier | File | Size |
| --- | --- | --- |
| Site header | SVG | 28–40 px height in layout |
| Favicon | SVG + ICO + PNG | 32/180/192 |
| Social avatars | square PNG | 1024×1024 (mark at 60–80%) |
| OG preview | PNG/JPG | 1200×630 |
| Email | PNG | 240–400 px wide (displayed 120–200) |
| Decks | SVG or PNG | PNG from 800 px wide |
| Messengers/stickers | PNG | 512×512 |
| Print | vector (PDF/EPS/SVG) | any physical size |
| Structured-data logo | PNG | 112×112+, square |

Assemble these once into a folder with sane names — and "what size logo do I need for…" stops being a question. The full kit and formats — in [the logo format guide](../v-kakom-formate-nuzhen-logotip/).

## In short

Website — SVG at 28–40 px height; social — a square PNG of 512+ px with the mark only; email — PNG at double size; print — vector. And never put a horizontal logo into a circular avatar.

Our [logo catalog](../../logos/) makes the sizing easy: every brand ships as SVG and PNG, and the PNG can be downloaded at any size — from icon to 4K.
