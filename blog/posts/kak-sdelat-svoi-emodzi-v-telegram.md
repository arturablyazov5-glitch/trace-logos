---
title: Как сделать свои эмодзи и стикеры в Telegram — полный гайд
title_en: How to Make Custom Emoji and Stickers in Telegram — Full Guide
description: Создаём кастомные эмодзи и стикеры для Telegram: требования к файлам, бот @Stickers, статичные и анимированные паки, эмодзи для Premium и каналов. Пошагово.
description_en: Creating custom Telegram emoji and stickers: file specs, the @Stickers bot, static and animated packs, Premium emoji for channels. Step by step.
date: 2026-08-11
updated: 2026-10-10
slug: kak-sdelat-svoi-emodzi-v-telegram
tags: Инструкции, Эмодзи, Telegram
tags_en: How-To, Emoji, Telegram
---

В [Telegram](../../logos/social/telegram/) можно загрузить не только стикеры, но и собственные эмодзи — маленькие картинки, которые вставляются прямо в текст сообщения и работают как реакции. Для брендов это бесплатный мерч внутри мессенджера: свой логотип в качестве эмодзи, фирменные реакции в канале, стикерпак, который расходится по чатам. Разбираем три пути: стикер из фото прямо в приложении, пак из своей графики через бота @Stickers и кастомные эмодзи для канала.

:::note Коротко
Стикер из фото делается прямо в приложении: панель стикеров в любом чате → «+» → фото → вырезать объект → добавить в пак. Пак из готовой графики, анимированные стикеры и кастомные эмодзи загружаются через официального бота **@Stickers**. Стикеры: PNG/WebP со стороной **512** пикселей (статичные) или TGS/WebM (анимированные). Кастомные эмодзи: те же форматы, но **100×100**. Создавать паки может любой пользователь бесплатно; **использовать** кастомные эмодзи в сообщениях могут только подписчики Telegram Premium, но в постах каналов их видят все.
:::

## Стикеры и кастомные эмодзи: в чём разница

| | Стикеры | Кастомные эмодзи |
| --- | --- | --- |
| Размер файла | 512×512 | 100×100 |
| Где живут | отдельным сообщением | внутри текста, в реакциях, в статусе |
| Кто может отправлять | все бесплатно | только Premium‑подписчики |
| В постах каналов | — | видят все, вставлять могут админы с Premium |
| Форматы | PNG, WebP, TGS, WebM | те же |
| Сколько в паке | до 120 | до 200 |

Практический вывод для брендов: стикерпак — инструмент массового охвата (бесплатен для всех), кастомные эмодзи — инструмент оформления канала и «статусности». Про эмодзи как маркетинговый канал у нас есть отдельная статья: [эмодзи в маркетинге](../emodzi-v-marketinge/).

## Как сделать стикер в ТГ с телефона за минуту

Самый быстрый путь не требует ни графического редактора, ни бота: в Telegram встроен редактор стикеров. Он берёт любое фото из галереи телефона, а готовый стикер сразу сохраняет в ваш пак.

1. Откройте любой чат, например «Избранное», и нажмите на иконку стикеров в поле ввода.
2. В панели стикеров нажмите **«+»** и выберите фото.
3. Редактор вырежет главный объект одним касанием и уберёт фон.
4. Поправьте края инструментами стирания и восстановления. Там же включается белая обводка, с которой картинка выглядит как классический стикер.
5. Если нужно, добавьте поверх фото текст, рисунок, эмодзи или другие стикеры.
6. Отправьте стикер в чат или добавьте его в пак. Для нового пака придумайте название.
7. Выберите эмодзи, которые передают эмоцию стикера. Telegram подскажет варианты по содержимому картинки, а по выбранным эмодзи стикер потом находится в панели.

У пака из редактора своя ссылка `t.me/addstickers/…`: её можно отправить друзьям или закрепить в канале. Следующие стикеры добавляются в тот же пак по тем же шагам.

## Как сделать стикер из фотографии, чтобы вырезка получилась чистой

Автоматическая вырезка ищет на снимке главный объект и отделяет его от фона. Чем легче ей найти границу, тем меньше придётся править руками, поэтому перед редактором проверьте снимок по трём признакам:

- **Объект крупный и целиком в кадре.** Обрезанные кадром уши или руки останутся обрезанными и в стикере.
- **Фон контрастный и однородный.** Рыжий кот на однотонной стене вырезается чище, чем тот же кот на пёстром ковре.
- **Снимок резкий.** Размытые края превращаются в рваный контур, и его видно даже в маленьком стикере.

Если редактор выделил не тот объект или захватил кусок фона, увеличьте фото пальцами и сотрите остатки вручную. Хуже всего вырезаются волосы, мех и прозрачные предметы. Для таких снимков фон удобнее убрать заранее ([как убрать фон с картинки](../kak-ubrat-fon-s-kartinki/)) и открыть в редакторе уже готовый PNG с прозрачностью.

## Редактор или бот: какой способ выбрать

Редактор решает задачу «стикер из фото за минуту». Пак бренда из нарисованной графики, анимацию и эмодзи собирают через бота @Stickers.

| | Редактор в приложении | Бот @Stickers |
| --- | --- | --- |
| Исходник | фото из галереи | готовые файлы PNG, WebP, TGS, WebM |
| Подготовка | не нужна | файлы по требованиям Telegram |
| Подходит для | личных стикеров из фото | пака бренда, анимации, эмодзи |

Дальше речь о втором пути: файлы для бота готовят заранее, и Telegram проверяет их строго.

## Требования к файлам

Бот принимает только файлы, которые проходят [официальные требования Telegram](https://core.telegram.org/stickers), остальные он возвращает с ошибкой.

**Статичные стикеры:** PNG или WebP, 512×512 пикселей (одна сторона ровно 512, вторая — до 512), прозрачный фон. Как получить прозрачный фон — [подробная инструкция](../kak-ubrat-fon-s-kartinki/); почему нельзя JPG — [в статье о форматах](../png-ili-jpg-chto-luchshe/).

**Анимированные стикеры** бывают двух видов. TGS — векторная анимация из Adobe After Effects, её экспортирует плагин Bodymovin‑TG: холст 512×512, до 3 секунд, 60 FPS, анимация зациклена, файл до 64 КБ. WebM — видео в кодеке VP9 из любого видеоредактора: одна сторона 512 пикселей, до 3 секунд, до 30 FPS, до 256 КБ и **без звуковой дорожки**. Беззвучная дорожка тоже считается звуковой, поэтому её нужно удалить при экспорте.

**Кастомные эмодзи:** всё то же самое, но холст 100×100 пикселей. Главное следствие маленького размера: **никаких мелких деталей** — эмодзи показывается в тексте размером со строчную букву. Логика ровно та же, что у фавиконок: [почему в 16 пикселях выживает только простое](../kak-sdelat-favicon/).

## Шаг 1. Готовим графику

1. **Рисуем или берём готовое.** Рисовать удобно в [Figma](../../logos/design/figma/) (базовые приёмы — в статье [как нарисовать логотип в Figma](../kak-narisovat-logotip-v-figma/)) или Procreate. Эмодзи‑версию логотипа делайте из компактного знака, не из полной надписи.
2. **Проверяем масштаб.** Уменьшите макет до размера строчной буквы на телефоне: если объект перестал читаться — упрощайте. Для эмодзи действует правило «один объект — один смысл».
3. **Прозрачный фон обязателен.** Стикер с белым квадратом вокруг — визитная карточка небрежного пака; [как убрать фон](../kak-ubrat-fon-s-kartinki/), мы разбирали отдельно.
4. **Экспортируем**: стикеры — 512×512 PNG/WebP, эмодзи — 100×100. Из Figma: фрейм нужного размера → Export PNG.

:::tip Обводка спасает тёмные темы
У Telegram есть тёмная и светлая темы, и ваш стикер должен читаться на обеих. Классическое решение — светлая обводка 6‑12 px вокруг объекта (как у стикеров самого Telegram): она отделяет картинку от любого фона.
:::

## Шаг 2. Загружаем через @Stickers

@Stickers — официальный бот Telegram, у него синяя галочка рядом с именем. У бота есть мини‑приложение, где создают паки стикеров и эмодзи и смотрят статистику использования. Те же действия доступны текстовыми командами, ниже порядок для них.

1. Откройте **@Stickers** и отправьте команду: **/newpack** создаёт пак статичных стикеров, **/newvideo** — видеостикеров, **/newemojipack** — набор кастомных эмодзи.
2. Пришлите название пака: его увидит каждый, кто откроет ссылку.
3. Отправляйте файлы по одному **документом**, без сжатия. С телефона: скрепка → «Файл» → картинка из галереи или из файлов. Если отправить картинку как фото, Telegram сожмёт её и прозрачный фон пропадёт.
4. После каждого файла пришлите эмодзи, который описывает стикер: по нему пак находится в панели.
5. Отправьте **/publish**. Бот предложит загрузить иконку пака 100×100 (шаг пропускается командой /skip) и попросит короткое имя латиницей без пробелов, после чего выдаст ссылку вида `t.me/addstickers/…` или `t.me/addemoji/…`.

Одноцветные эмодзи, например монохромный знак бренда, стоит сделать адаптивными: при создании набора отправьте боту **/adaptive**. Такие эмодзи в сообщении принимают цвет текста, а в статусе — акцентный цвет темы пользователя.

:::warning Бот не принимает файл
Сверьте файл с требованиями: одна сторона ровно 512 пикселей (у эмодзи 100×100); формат PNG или WebP, JPG не подходит; файл отправлен документом, а не фото; у WebM нет звуковой дорожки и длина не больше 3 секунд. Исправьте файл и отправьте его снова.
:::

Ссылку можно закрепить в канале, вшить в пост или QR‑код с логотипом. Управление паком — тоже через бота: /addsticker, /delsticker, /ordersticker, статистика установок — /packstats.

## Шаг 3. Подключаем эмодзи в канале

Кастомные эмодзи раскрываются в каналах и группах:

- **В постах** фирменные эмодзи видят все подписчики, даже без Premium (вставлять их может админ с Premium).
- **Реакции.** В настройках канала можно разрешить реакции кастомными эмодзи — свой логотип вместо сердечка (для каналов с уровнем/бустами).
- **Эмодзи‑статус** — Premium‑пользователи могут поставить ваш эмодзи рядом со своим именем: механика «носить мерч бренда».
- **Эмодзи‑пак группы.** Группа, набравшая 4‑й уровень бустов, может выбрать один пак кастомных эмодзи, которым пользуются все участники, даже без Premium.

Про оформление канала целиком — аватарку, обложку, единый стиль — читайте в статье [логотип для Telegram‑канала](../logotip-dlya-telegram-kanala/).

## Юридические грабли

Загружать в свой пак чужие логотипы, персонажей мультфильмов или мемы с узнаваемыми героями — нарушение прав: Telegram удаляет такие паки по жалобе правообладателя. Что можно и чего нельзя делать с чужими знаками — разбирали в статье [можно ли использовать чужой логотип](../mozhno-li-ispolzovat-chuzhoy-logotip/). Со стандартными эмодзи проще: сами символы Юникода — общее достояние, но **картинки** конкретных вендоров (Apple, Google) защищены — их нельзя перепаковывать в стикеры. Посмотреть, как отличаются одни и те же эмодзи у разных вендоров, можно в нашем [каталоге эмодзи](../../emoji/), а почему они вообще выглядят по‑разному — [в отдельной статье](../pochemu-emodzi-otobrazhayutsya-po-raznomu/).

## Чек‑лист перед публикацией

- Все файлы нужного размера (512×512 / 100×100), с прозрачным фоном, отправлены документом.
- Каждый элемент читается в реальном размере на телефоне, на светлой и тёмной теме.
- Пак назван так, чтобы его находил поиск (имя бренда + «stickers»/«emoji»).
- Ссылка на пак закреплена в канале и добавлена в описание.
- В паке нет чужой интеллектуальной собственности.

Если для пака нужны исходники эмодзи в высоком разрешении — в [каталоге эмодзи Trace Logos](../../emoji/) больше 1900 картинок в PNG, у многих есть версии Apple и Google. А про то, откуда эмодзи вообще взялись и кто их придумывает, — статья [что такое эмодзи](../chto-takoe-emodzi-i-otkuda-oni/).

---EN---

In [Telegram](../../logos/social/telegram/) you can upload not just stickers but your own emoji — small images inserted right into message text that also work as reactions. For brands it's free merch inside the messenger: your logo as an emoji, branded reactions in a channel, a sticker pack spreading through chats. We cover three routes: a sticker from a photo right in the app, a pack from your own artwork via the @Stickers bot, and custom emoji for a channel.

:::note TL;DR
A sticker from a photo is made right in the app: the sticker panel in any chat → "+" → a photo → cut out the subject → add to a pack. Packs from ready-made artwork, animated stickers and custom emoji go through the official **@Stickers** bot. Stickers: PNG/WebP with one side at **512** pixels (static) or TGS/WebM (animated). Custom emoji: same formats, **100×100**. Anyone can create packs for free; **using** custom emoji in messages requires Telegram Premium, though everyone sees them in channel posts.
:::

## Stickers vs custom emoji

| | Stickers | Custom emoji |
| --- | --- | --- |
| File size | 512×512 | 100×100 |
| Where they live | as a separate message | inside text, reactions, status |
| Who can send | everyone, free | Premium subscribers only |
| In channel posts | — | visible to all; admins with Premium can insert |
| Formats | PNG, WebP, TGS, WebM | the same |
| Per pack | up to 120 | up to 200 |

The practical takeaway for brands: a sticker pack is a mass-reach tool (free for everyone), custom emoji are a channel-styling and status tool. On emoji as a marketing channel, see [emoji in marketing](../emodzi-v-marketinge/).

## How to make a Telegram sticker on your phone in a minute

The fastest route needs neither a graphics editor nor the bot: Telegram has a built-in sticker editor. It takes any photo from your phone's gallery and saves the finished sticker straight into your pack.

1. Open any chat, Saved Messages for example, and tap the sticker icon in the input field.
2. In the sticker panel, tap **"+"** and pick a photo.
3. The editor cuts out the main subject and removes the background in one tap.
4. Fix the edges with the erase and restore tools. The same screen turns on a white outline that gives the image the classic sticker look.
5. Optionally add text, a drawing, emoji or other stickers on top.
6. Send the sticker to the chat or add it to a pack. For a new pack, choose a name.
7. Pick emoji that convey the sticker's emotion. Telegram suggests options based on the image, and the chosen emoji are how the sticker is found in the panel later.

A pack made in the editor gets its own `t.me/addstickers/...` link to send to friends or pin in a channel. More stickers go into the same pack by repeating the steps.

## How to make a sticker from a photo with a clean cut-out

Automatic cut-out looks for the main subject and separates it from the background. The easier the edge is to find, the less you fix by hand, so check the photo for three things before opening the editor:

- **The subject is large and fully in frame.** Ears or hands cropped by the frame stay cropped in the sticker.
- **The background is contrasting and plain.** A ginger cat against a plain wall cuts out cleaner than the same cat on a patterned rug.
- **The shot is sharp.** Blurry edges turn into a ragged outline that shows even in a small sticker.

If the editor picks the wrong subject or grabs a piece of background, zoom in with two fingers and erase the leftovers by hand. Hair, fur and transparent objects cut out worst. For such photos, remove the background beforehand ([how to remove a background](../kak-ubrat-fon-s-kartinki/)) and open a ready transparent PNG in the editor.

## Editor or bot: which route to pick

The editor handles "a sticker from a photo in a minute". A brand pack from drawn artwork, animation and emoji are built through the @Stickers bot.

| | In-app editor | @Stickers bot |
| --- | --- | --- |
| Source | a photo from the gallery | ready PNG, WebP, TGS, WebM files |
| Preparation | none | files to Telegram's specs |
| Best for | personal stickers from photos | brand packs, animation, emoji |

The rest of the guide covers the second route: files for the bot are prepared in advance, and Telegram checks them strictly.

## File requirements

The bot accepts only files that meet [Telegram's official requirements](https://core.telegram.org/stickers) and rejects the rest with an error.

**Static stickers:** PNG or WebP, 512×512 pixels (one side exactly 512, the other up to 512), transparent background. Getting transparency: [our guide](../kak-ubrat-fon-s-kartinki/); why not JPG: [the formats article](../png-ili-jpg-chto-luchshe/).

**Animated stickers** come in two kinds. TGS is vector animation from Adobe After Effects, exported with the Bodymovin-TG plugin: a 512×512 canvas, up to 3 seconds, 60 FPS, looped, under 64 KB. WebM is VP9 video from any video editor: one side at 512 pixels, up to 3 seconds, up to 30 FPS, under 256 KB and **no audio track**. A silent track still counts as audio, so strip it on export.

**Custom emoji:** all the same, but on a 100×100 canvas. The key consequence of the small size: **no fine detail** — an emoji renders at lowercase-letter height in text. Exactly the favicon logic: [why only simple shapes survive at 16 pixels](../kak-sdelat-favicon/).

## Step 1. Prepare the artwork

1. **Draw or reuse.** [Figma](../../logos/design/figma/) is convenient (basics in [how to design a logo in Figma](../kak-narisovat-logotip-v-figma/)), as is Procreate. Build the emoji version of a logo from the compact mark, not the full wordmark.
2. **Test the scale.** Shrink the design to lowercase-letter size on a phone: if the object stops reading — simplify. The emoji rule: one object, one meaning.
3. **Transparent background is mandatory.** A sticker with a white box around it is the hallmark of a sloppy pack; we cover [how to remove a background](../kak-ubrat-fon-s-kartinki/) separately.
4. **Export**: stickers — 512×512 PNG/WebP, emoji — 100×100. From Figma: a frame of the right size → Export PNG.

:::tip An outline saves dark themes
Telegram has light and dark themes and your sticker must read on both. The classic fix — a light 6-12 px outline around the subject (like Telegram's own stickers): it separates the image from any background.
:::

## Step 2. Upload via @Stickers

@Stickers is Telegram's official bot, marked with a blue check next to its name. The bot has a mini app where you create sticker and emoji packs and view usage stats. The same actions work as text commands; here is the order for them.

1. Open **@Stickers** and send a command: **/newpack** creates a static sticker pack, **/newvideo** a video sticker pack, **/newemojipack** a custom emoji set.
2. Send the pack title: everyone who opens the link will see it.
3. Send files one by one **as documents**, uncompressed. On a phone: paperclip → "File" → pick the image from the gallery or from files. Sent as a photo, the image gets compressed and loses its transparent background.
4. After each file, send an emoji that describes the sticker: that's how the pack is found in the panel.
5. Send **/publish**. The bot offers to upload a 100×100 pack icon (skip it with /skip) and asks for a short Latin name without spaces, then returns a link like `t.me/addstickers/...` or `t.me/addemoji/...`.

Single-color emoji, such as a monochrome brand mark, are worth making adaptive: send the bot **/adaptive** while creating the set. In messages such emoji take the text color, and as a status they take the user's theme accent color.

:::warning The bot rejects a file
Check the file against the requirements: one side exactly 512 pixels (100×100 for emoji); PNG or WebP format, JPG won't do; sent as a document rather than a photo; a WebM has no audio track and runs no longer than 3 seconds. Fix the file and send it again.
:::

Pin the link in your channel, embed it in a post or a QR code with a logo. Pack management also lives in the bot: /addsticker, /delsticker, /ordersticker, install stats via /packstats.

## Step 3. Wire the emoji into your channel

Custom emoji shine in channels and groups:

- **In posts** branded emoji are visible to all subscribers, Premium or not (a Premium admin inserts them).
- **Reactions.** Channel settings can allow custom-emoji reactions — your logo instead of a heart (for boosted channels).
- **Emoji status** — Premium users can set your emoji next to their name: the "wear the brand's merch" mechanic.
- **Group emoji pack.** A group that reaches boost level 4 can pick one custom emoji pack that all members use, Premium or not.

For the full channel look — avatar, cover, a coherent style — see [a logo for your Telegram channel](../logotip-dlya-telegram-kanala/).

## Legal traps

Uploading other people's logos, cartoon characters or memes with recognizable heroes is infringement: Telegram removes such packs on rights-holder complaints. What you can and can't do with others' marks: [can you use someone else's logo](../mozhno-li-ispolzovat-chuzhoy-logotip/). Standard emoji are simpler: the Unicode symbols themselves are common property, but specific vendors' **artwork** (Apple, Google) is protected — don't repack it into stickers. Compare how the same emoji differ between vendors in our [emoji catalog](../../emoji/), and why they differ at all — [in this article](../pochemu-emodzi-otobrazhayutsya-po-raznomu/).

## Pre-publish checklist

- All files at the right size (512×512 / 100×100), transparent, sent as documents.
- Every item reads at real size on a phone, on light and dark themes.
- The pack is named for search (brand name + "stickers"/"emoji").
- The pack link is pinned in the channel and added to its description.
- Nothing in the pack infringes on anyone's IP.

If you need high-resolution emoji sources for a pack — the [Trace Logos emoji catalog](../../emoji/) holds over 1,900 PNGs, many with both Apple and Google versions. And on where emoji came from in the first place: [what emoji are](../chto-takoe-emodzi-i-otkuda-oni/).
