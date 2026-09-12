---
title: Как сделать свои эмодзи и стикеры в Telegram — полный гайд
title_en: How to Make Custom Emoji and Stickers in Telegram — Full Guide
description: Создаём кастомные эмодзи и стикеры для Telegram: требования к файлам, бот @Stickers, статичные и анимированные паки, эмодзи для Premium и каналов. Пошагово.
description_en: Creating custom Telegram emoji and stickers: file specs, the @Stickers bot, static and animated packs, Premium emoji for channels. Step by step.
date: 2026-08-11
slug: kak-sdelat-svoi-emodzi-v-telegram
tags: Инструкции, Эмодзи, Telegram
tags_en: How-To, Emoji, Telegram
---

В [Telegram](../../logos/social/telegram/) можно загрузить не только стикеры, но и собственные эмодзи — маленькие картинки, которые вставляются прямо в текст сообщения и работают как реакции. Для брендов это бесплатный мерч внутри мессенджера: свой логотип в качестве эмодзи, фирменные реакции в канале, стикерпак, который расходится по чатам. Разбираем весь процесс: требования к файлам, подготовка графики и загрузка через бота.

:::note Коротко
И стикеры, и кастомные эмодзи загружаются через официального бота **@Stickers**. Стикеры: PNG/WebP **512×512** (статичные) или TGS/WebM (анимированные). Кастомные эмодзи: те же форматы, но **100×100**. Создавать паки может любой пользователь бесплатно; **использовать** кастомные эмодзи в сообщениях могут только подписчики Telegram Premium — но в постах каналов их видят все.
:::

## Стикеры и кастомные эмодзи: в чём разница

| | Стикеры | Кастомные эмодзи |
| --- | --- | --- |
| Размер файла | 512×512 | 100×100 |
| Где живут | отдельным сообщением | внутри текста, в реакциях, в статусе |
| Кто может отправлять | все бесплатно | только Premium‑подписчики |
| В постах каналов | — | видят все, вставлять могут админы с Premium |
| Форматы | PNG, WebP, TGS, WebM | те же |

Практический вывод для брендов: стикерпак — инструмент массового охвата (бесплатен для всех), кастомные эмодзи — инструмент оформления канала и «статусности». Про эмодзи как маркетинговый канал у нас есть отдельная статья: [эмодзи в маркетинге](../emodzi-v-marketinge/).

## Требования к файлам

**Статичные стикеры:** PNG или WebP, 512×512 пикселей (одна сторона ровно 512, вторая — до 512), прозрачный фон, до 512 КБ. Как получить прозрачный фон — [подробная инструкция](../kak-ubrat-fon-s-kartinki/); почему нельзя JPG — [в статье о форматах](../png-ili-jpg-chto-luchshe/).

**Анимированные стикеры:** формат TGS — векторная анимация, экспортируется из Adobe After Effects плагином Bodymovin с жёсткими ограничениями (3 секунды, 60 FPS, до 64 КБ) — либо WebM (VP9, до 3 секунд, до 256 КБ), который можно получить из любого видеоредактора.

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

1. Откройте бота **@Stickers** в Telegram (проверьте синюю галочку — это официальный бот).
2. Команда **/newpack** — для стикеров, **/newemojipack** — для кастомных эмодзи. Бот спросит тип (статичные/анимированные/видео).
3. Назовите пак и отправляйте файлы по одному **документом** (без сжатия!), после каждого — назначьте соответствующий стандартный эмодзи (по нему пак ищется в панели).
4. Команда **/publish**, короткое имя пака — и бот выдаст ссылку вида `t.me/addstickers/…` или `t.me/addemoji/…`.

Ссылку можно закрепить в канале, вшить в пост или QR‑код с логотипом. Управление паком — тоже через бота: /addsticker, /delsticker, /ordersticker, статистика установок — /packstats.

## Шаг 3. Подключаем эмодзи в канале

Кастомные эмодзи раскрываются в каналах:

- **В постах** фирменные эмодзи видят все подписчики, даже без Premium (вставлять их может админ с Premium).
- **Реакции.** В настройках канала можно разрешить реакции кастомными эмодзи — свой логотип вместо сердечка (для каналов с уровнем/бустами).
- **Эмодзи‑статус** — Premium‑пользователи могут поставить ваш эмодзи рядом со своим именем: механика «носить мерч бренда».

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

In [Telegram](../../logos/social/telegram/) you can upload not just stickers but your own emoji — small images inserted right into message text that also work as reactions. For brands it's free merch inside the messenger: your logo as an emoji, branded reactions in a channel, a sticker pack spreading through chats. Here's the whole process: file specs, artwork prep and uploading via the bot.

:::note TL;DR
Both stickers and custom emoji are uploaded through the official **@Stickers** bot. Stickers: PNG/WebP **512×512** (static) or TGS/WebM (animated). Custom emoji: same formats, **100×100**. Anyone can create packs for free; **using** custom emoji in messages requires Telegram Premium — but in channel posts everyone sees them.
:::

## Stickers vs custom emoji

| | Stickers | Custom emoji |
| --- | --- | --- |
| File size | 512×512 | 100×100 |
| Where they live | as a separate message | inside text, reactions, status |
| Who can send | everyone, free | Premium subscribers only |
| In channel posts | — | visible to all; admins with Premium can insert |
| Formats | PNG, WebP, TGS, WebM | the same |

The practical takeaway for brands: a sticker pack is a mass-reach tool (free for everyone), custom emoji are a channel-styling and status tool. On emoji as a marketing channel, see [emoji in marketing](../emodzi-v-marketinge/).

## File requirements

**Static stickers:** PNG or WebP, 512×512 pixels (one side exactly 512, the other up to 512), transparent background, under 512 KB. Getting transparency: [our guide](../kak-ubrat-fon-s-kartinki/); why not JPG: [the formats article](../png-ili-jpg-chto-luchshe/).

**Animated stickers:** TGS — vector animation exported from Adobe After Effects via the Bodymovin plugin under strict limits (3 seconds, 60 FPS, under 64 KB) — or WebM (VP9, up to 3 seconds, under 256 KB) from any video editor.

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

1. Open the **@Stickers** bot (check the blue verification badge — it's the official bot).
2. **/newpack** for stickers, **/newemojipack** for custom emoji. The bot asks the type (static/animated/video).
3. Name the pack and send files one by one **as documents** (uncompressed!), assigning a matching standard emoji after each (that's how the pack is found in the panel).
4. **/publish**, a short pack name — and the bot returns a link like `t.me/addstickers/...` or `t.me/addemoji/...`.

Pin the link in your channel, embed it in a post or a QR code with a logo. Pack management also lives in the bot: /addsticker, /delsticker, /ordersticker, install stats via /packstats.

## Step 3. Wire the emoji into your channel

Custom emoji shine in channels:

- **In posts** branded emoji are visible to all subscribers, Premium or not (a Premium admin inserts them).
- **Reactions.** Channel settings can allow custom-emoji reactions — your logo instead of a heart (for boosted channels).
- **Emoji status** — Premium users can set your emoji next to their name: the "wear the brand's merch" mechanic.

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
