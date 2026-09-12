---
title: Как сделать круглую аватарку — чтобы ничего не обрезалось
title_en: How to Make a Round Avatar — Without Anything Getting Cropped
description: Готовим аватарку под круглую обрезку: безопасная зона, размеры для Telegram, VK, YouTube и WhatsApp, инструменты кадрирования, ошибки с логотипами в кругу
description_en: Preparing an avatar for circular crops: the safe zone, sizes for Telegram, VK, YouTube and WhatsApp, cropping tools, logo-in-circle mistakes
date: 2026-08-09
slug: kak-sdelat-krugluyu-avatarku
tags: Инструкции, Соцсети, Дизайн
tags_en: How-To, Social Media, Design
---

Загрузили аккуратный логотип в профиль — а платформа обрезала его кругом, и от знака остались рожки да ножки: углы срезаны, текст уехал, половина буквы за краем. Круглая обрезка — стандарт почти всех платформ, при этом **загружаются везде квадраты**, и вся наука сводится к одному: правильно расположить содержимое внутри будущего круга. Разбираем безопасные зоны, размеры площадок, инструменты и типовые ошибки.

:::note Коротко
Правило номер один: **загружается квадрат, показывается круг** — всё важное должно вписываться в окружность диаметром ~80% стороны квадрата; углы будут отрезаны всегда. Готовьте мастер‑файл **800×800** (хватит всем платформам), знак — по центру с полями, фон — свой, не прозрачный. Проверяйте результат в самом маленьком размере — в списке чатов, а не на странице профиля.
:::

## Геометрия: что именно отрезается

Вписанный в квадрат круг занимает ~78,5% его площади — то есть **пятая часть картинки гарантированно уходит в мусор**, и вся она — углы. Дальше хуже: некоторые платформы кадрируют с запасом, а интерфейсные элементы (значок онлайна, бейдж «плюс» у сторис) наезжают на край круга. Отсюда практичная формула безопасной зоны:

- **Центр (60% стороны)** — зона гарантии: сюда — знак и главное.
- **Кольцо 60‑80%** — зона риска: фоновые элементы, допустимые к подрезке.
- **Углы и край** — расходный материал: только фон.

## Размеры площадок

| Платформа | Загружаемый размер | Особенности |
| --- | --- | --- |
| [Telegram](../../logos/social/telegram/) | от 512×512 | круг везде; в списке чатов — ~40 px ([оформление канала](../logotip-dlya-telegram-kanala/)) |
| [ВКонтакте](../../logos/social/vk/) | от 400×400 | круг; детали — в [гайде по сообществам](../logotip-dlya-vk-soobshchestva/) |
| [YouTube](../../logos/media/youtube/) | 800×800 | круг; виден и под видео в размере ~24 px ([гайд](../logotip-dlya-youtube-kanala/)) |
| [WhatsApp](../../logos/social/whatsapp/) | 500×500 | круг в чатах |
| [Instagram](../../logos/social/instagram/) | от 320×320 | круг + кольцо сторис поверх края |
| [X](../../logos/social/x/) | 400×400 | круг |

Один мастер‑файл **800×800** с запасом закрывает всё: платформы уменьшают сами, а вот увеличить маленькую картинку без потерь нельзя — [почему так происходит](../pochemu-logotip-razmytyj/), мы объясняли отдельно.

## Готовим аватарку из логотипа

1. **Возьмите компактный знак, не полный логотип.** Текстовая часть в круге диаметром 40 пикселей нечитаема — нужна иконочная версия — о том, [чем иконка отличается от логотипа](../ikonka-i-logotip-raznica/) и зачем вообще нужны разные версии знака, мы рассказывали отдельно.
2. **Холст‑квадрат, знак по центру.** В [Figma](../../logos/design/figma/): фрейм 800×800, знак — 55‑65% ширины, строго по центру. Для проверки наложите сверху окружность‑шаблон и убедитесь, что ничего не выпирает.
3. **Задайте фон.** Прозрачный фон платформы зальют своим цветом (в тёмной теме — тёмным, и чёрный знак исчезнет). Надёжно: фирменный цвет фона + контрастный знак — о том, [как подобрать такую пару](../kak-podobrat-cvetovuyu-palitru-brenda/), мы писали отдельно.
4. **Не рисуйте круг сами.** Частая ошибка — вписать знак в белый круг на квадрате «для надёжности»: платформа обрежет своим кругом чуть иначе, и получится кольцо‑артефакт по краю.
5. **Экспорт в PNG** 800×800 — [почему не JPG](../png-ili-jpg-chto-luchshe/) для такой графики.

## Готовим аватарку из фото

Для личных профилей и персональных брендов работают правила портрета:

- **Лицо — в верхних двух третях круга**, глаза — примерно на трети от верха: кадрирование по пояс «в упор» читается хуже, чем голова с воздухом.
- **Обрезайте сами, не доверяйте автокропу**: платформа возьмёт центр квадрата, а не центр лица.
- **Контраст с фоном.** Лицо на пёстром фоне в 40 пикселях сливается — [уберите или размойте фон](../kak-ubrat-fon-s-kartinki/), добавьте однотонную подложку.
- Инструменты: кадрирование кругом есть в любом редакторе — от Просмотра на Mac до онлайн‑кропперов; в Figma — фрейм с закруглением 50% для предпросмотра.

## Проверка: три размера

Аватарка живёт в трёх масштабах, и проверять нужно все:

1. **Страница профиля** (~100‑160 px) — здесь красиво почти всё.
2. **Список чатов / лента** (~40‑48 px) — здесь умирает текст и тонкие линии; главная проверка.
3. **Мини‑контексты** (~24 px): комментарии, реакции, «печатает…» — здесь выживает только пятно цвета и силуэт. Ровно поэтому [цвет — главный актив](../kak-podobrat-cvetovuyu-palitru-brenda/) аватарки, как и [фавиконки](../kak-sdelat-favicon/).

:::tip Тест соседей
Откройте свой профиль в списке диалогов между десятком чужих и честно ответьте: находится ли ваша аватарка за полсекунды? Если нет — упрощайте знак и усиливайте цвет. Тот же тест мы советовали для [иконок мессенджеров](../logotipy-messendzherov/) — аватарка конкурирует в той же сетке.
:::

## Частые ошибки

1. **Полный логотип с текстом** — буквы по кругу срезаны, остальное нечитаемо.
2. **Важное в углах** — срезано геометрией, без вариантов.
3. **Прозрачный фон** — цвет подложки решает за вас платформа.
4. **Маленький исходник** — мыло при любом показе крупнее списка чатов.
5. **Разные аватарки на разных площадках** — узнаваемость собирается из повторения: один знак везде — [как выстроить такую систему](../chto-takoe-firmennyj-stil/), мы разбирали отдельно.

Смежные гайды: [логотип для Telegram‑канала](../logotip-dlya-telegram-kanala/), [для YouTube](../logotip-dlya-youtube-kanala/), [для сообщества ВКонтакте](../logotip-dlya-vk-soobshchestva/) и [размеры логотипа для всех площадок](../razmery-logotipa-dlya-sajta-i-socsetej/). Компактные версии знаков для аватарок — у большинства брендов в [каталоге](../../logos/).

---EN---

You upload a neat logo to a profile — and the platform crops it into a circle, leaving scraps: corners sliced, text run off, half a letter beyond the edge. The circular crop is the standard of nearly every platform, yet **everything uploads as a square**, so the whole science boils down to one thing: placing the content correctly inside the future circle. Here are the safe zones, platform sizes, tools and typical mistakes.

:::note TL;DR
Rule one: **a square is uploaded, a circle is shown** — everything important must fit a circle of ~80% of the square's side; the corners are always cut. Prepare an **800×800** master (enough for every platform), the mark centered with margins, the background your own — not transparent. Check the result at the smallest size — in the chat list, not on the profile page.
:::

## The geometry: what exactly gets cut

A circle inscribed in a square covers ~78.5% of its area — meaning **a fifth of your image is guaranteed waste**, all of it corners. It gets worse: some platforms crop with a margin, and UI elements (the online dot, the stories ring) overlap the circle's edge. Hence the practical safe-zone formula:

- **The center (60% of the side)** — the guarantee zone: the mark and essentials go here.
- **The 60-80% ring** — the risk zone: background elements that may be trimmed.
- **Corners and edge** — expendable: background only.

## Platform sizes

| Platform | Upload size | Notes |
| --- | --- | --- |
| [Telegram](../../logos/social/telegram/) | 512×512+ | circle everywhere; ~40 px in the chat list ([channel guide](../logotip-dlya-telegram-kanala/)) |
| [VK](../../logos/social/vk/) | 400×400+ | circle; details in the [community guide](../logotip-dlya-vk-soobshchestva/) |
| [YouTube](../../logos/media/youtube/) | 800×800 | circle; also shows under videos at ~24 px ([guide](../logotip-dlya-youtube-kanala/)) |
| [WhatsApp](../../logos/social/whatsapp/) | 500×500 | circle in chats |
| [Instagram](../../logos/social/instagram/) | 320×320+ | circle + the stories ring over the edge |
| [X](../../logos/social/x/) | 400×400 | circle |

One **800×800** master covers everything: platforms downscale on their own, while upscaling a small image losslessly is impossible — [we explain why](../pochemu-logotip-razmytyj/) separately.

## Making an avatar from a logo

1. **Use the compact mark, not the full logo.** Text inside a 40-pixel circle is unreadable — you need the icon version — see [icon vs logo](../ikonka-i-logotip-raznica/) and why different versions exist for more.
2. **A square canvas, the mark centered.** In [Figma](../../logos/design/figma/): an 800×800 frame, the mark at 55-65% of the width, dead center. Overlay a circle template to confirm nothing pokes out.
3. **Set a background.** Platforms flood transparent backgrounds with their own color (dark in dark theme — and a black mark vanishes). Reliable: a brand background color + a contrasting mark — see [picking that pair](../kak-podobrat-cvetovuyu-palitru-brenda/) for how.
4. **Don't draw the circle yourself.** A common error is placing the mark in a white circle on the square "to be safe": the platform's crop lands slightly differently, producing an artifact ring at the edge.
5. **Export PNG** at 800×800 — [why not JPG](../png-ili-jpg-chto-luchshe/) for graphics like this.

## Making an avatar from a photo

For personal profiles and personal brands, portrait rules apply:

- **The face in the circle's upper two thirds**, eyes at roughly one third from the top: a tight waist-up crop reads worse than a head with air.
- **Crop yourself, don't trust the auto-crop**: the platform takes the square's center, not the face's.
- **Contrast with the background.** A face on a busy background merges at 40 pixels — [remove or blur the background](../kak-ubrat-fon-s-kartinki/), add a solid backing.
- Tools: circular cropping exists in every editor — from macOS Preview to online croppers; in Figma, a frame with 50% corner radius previews the crop.

## The check: three sizes

An avatar lives at three scales, and all need checking:

1. **The profile page** (~100-160 px) — almost everything looks fine here.
2. **The chat list / feed** (~40-48 px) — text and thin lines die here; this is the main check.
3. **Micro contexts** (~24 px): comments, reactions, "typing..." — only a color patch and a silhouette survive. Which is exactly why [color is the avatar's main asset](../kak-podobrat-cvetovuyu-palitru-brenda/), as with [favicons](../kak-sdelat-favicon/).

:::tip The neighbors test
Open your profile in a dialog list among a dozen others and answer honestly: is your avatar found within half a second? If not — simplify the mark and strengthen the color. We recommended the same test for [messenger icons](../logotipy-messendzherov/) — an avatar competes in the same grid.
:::

## Common mistakes

1. **The full logo with text** — letters sliced by the circle, the rest unreadable.
2. **Essentials in the corners** — cut by geometry, no exceptions.
3. **A transparent background** — the platform picks the backing color for you.
4. **A small source file** — mush at any size above the chat list.
5. **Different avatars on different platforms** — recognition builds through repetition: one mark everywhere — see [building that system](../chto-takoe-firmennyj-stil/) for how.

Adjacent guides: [a logo for a Telegram channel](../logotip-dlya-telegram-kanala/), [for YouTube](../logotip-dlya-youtube-kanala/), [for a VK community](../logotip-dlya-vk-soobshchestva/) and [logo sizes for every platform](../razmery-logotipa-dlya-sajta-i-socsetej/). Compact mark versions fit for avatars accompany most brands in the [catalog](../../logos/).
