---
title: Логотип для презентации — как вставить в PowerPoint и Google Slides
title_en: A Logo for a Presentation — How to Insert It in PowerPoint and Google Slides
description: Как добавить логотип в презентацию: почему SVG работает не везде, какой формат и размер выбрать, как избежать белого фона и размытия на проекторе. Практический разбор для PowerPoint, Google Slides и Keynote.
description_en: How to add a logo to a presentation: why SVG doesn't work everywhere, what format and size to choose, how to avoid a white background and blur on a projector. A practical breakdown for PowerPoint, Google Slides, and Keynote.
date: 2026-08-13
slug: logotip-dlya-prezentacii
tags: Логотип, Презентация, PNG
tags_en: Logo, Presentation, PNG
---

Логотип в презентации — на титульном слайде, в углу каждой страницы, на схеме партнёров — должен выглядеть чётко и на ноутбуке, и на огромном экране проектора. И вот в этом «и там, и там» вся сложность: то, что идеально смотрелось на мониторе во время подготовки, на большом экране в зале может «поплыть». Презентационные программы капризны к графике, поэтому вставлять логотип нужно, помня о самом жёстком сценарии показа, а не о том, как он выглядит у вас в редакторе.

## Почему в презентации логотип «мылится» или пропадает

Чтобы выбрать формат, сначала разберёмся, из‑за чего знак портится, — причин три, и все связаны с тем, что презентацию показывают на разных экранах. Первая: растр на большом экране размывается. Маленький [PNG](../png-ili-jpg-chto-luchshe/), растянутый на весь слайд проектора, теряет чёткость, потому что пикселей в нём меньше, чем требует большой экран (механизм тот же, что в статье [почему логотип размытый](../pochemu-logotip-razmytyj/)). Вторая: SVG вставляется не везде — свежие версии PowerPoint работают с [SVG](../svg-ili-png-dlya-logotipa/), но старые и часть Google Slides либо не понимают его, либо теряют эффекты. Третья: белый фон портит слайд — логотип на непрозрачной подложке оставляет белый прямоугольник на цветном фоне слайда.

Особенно обидно, что всё это всплывает в самый неподходящий момент — на большом экране перед аудиторией, когда переделать уже нельзя. В редакторе на ноутбуке слайд выглядит безупречно, а проектор в зале растягивает картинку на несколько метров и обнажает каждый её недостаток: мелкий логотип рассыпается на пиксели, белая подложка вспыхивает прямоугольником на тёмном фоне, вставленный SVG вообще не открывается на чужом компьютере. Поэтому логотип для презентации проверяют не на своём мониторе, а мысленно на самом большом и самом чужом экране, где он может оказаться.

## Какой формат выбрать

Из этих трёх причин и вытекает выбор формата. Самый безопасный вариант — **[PNG](../png-ili-jpg-chto-luchshe/) с прозрачным фоном**: он открывается в любой программе и ложится на любой фон слайда. Чтобы он не размылся на проекторе, его экспортируют крупно — в 2‑3 раза больше, чем нужно на слайде, — тогда пикселей хватит и на большой экран. [SVG](../svg-ili-png-dlya-logotipa/) даёт идеальную чёткость на любом размере, но брать его стоит только там, где он точно поддерживается: перед важным показом проверьте, что он открывается именно на том компьютере, с которого будете показывать. А исходник в любом случае держат в [векторе](../vektor-i-rastr-raznica/): из [SVG](../svg-ili-png-dlya-logotipa/) вы за минуту экспортируете PNG под любой слайд, а обратно — уже сложно (почему так — в статье [вектор и растр](../vektor-i-rastr-raznica/)).

:::warning Не растягивайте маленький PNG
Самая частая ошибка — взять логотип на 100 пикселей из шапки сайта и растянуть его на весь титульный слайд. На ноутбуке это ещё терпимо, а на проекторе превращается в размытую кашу, потому что программе нечего показать, кроме увеличенных пикселей. Всегда берите знак в высоком разрешении или в [SVG](../svg-ili-png-dlya-logotipa/), а не увеличивайте маленький [PNG](../png-ili-jpg-chto-luchshe/) сверх его размера, — увеличение не добавляет деталей, а лишь делает видимой сетку пикселей.
:::

## Прозрачный фон и тёмные слайды

Отдельно стоит подумать о фоне, потому что слайды редко бывают белыми. Прозрачный фон обязателен для наложения на цветные и фото‑слайды (как его получить, в статье [логотип с прозрачным фоном](../logotip-s-prozrachnym-fonom/)), иначе знак приедет с белым прямоугольником, который на цветном слайде сразу бросается в глаза. Если тема слайдов тёмная, тёмный логотип на ней пропадёт — готовьте светлую версию, принцип тот же, что в статье [логотип для тёмной темы](../logotip-dlya-temnoj-temy/). И держите под рукой полную и компактную версии знака, чтобы под угол каждого слайда была подходящая, — это тот же [адаптивный](../adaptivnyj-logotip/) подход, только применённый к слайдам.

## Как разместить логотип на слайдах

Когда версии готовы, остаётся композиция, и здесь работает одно правило — единообразие. На титульном слайде знак ставят крупно, но с воздухом вокруг (охранное поле). В углу каждого слайда — компактную версию, ненавязчиво и в одном и том же месте на всех слайдах, потому что «гуляющий» по углам логотип разрушает ощущение цельной презентации. Единый размер и позиция от слайда к слайду — это часть [согласованности](../soglasovannost-brenda/), которую зритель считывает как аккуратность. Удобнее всего задать положение знака один раз — на образце слайдов (мастер‑слайде): тогда логотип автоматически встанет одинаково на всех страницах, а при смене версии обновится везде разом. Это то же переиспользование, что и в [дизайн‑системе](../dizajn-sistema-brenda/): вы не расставляете знак на каждом слайде вручную, рискуя сдвинуть его на пару пикселей, а закладываете правило один раз — и заодно страхуетесь от разнобоя, когда презентацию правят несколько человек. А если вы показываете логотипы партнёров или клиентов, берите их официальные версии в [векторе](../svg-ili-png-dlya-logotipa/), а не мутные картинки из поиска, и помните про [границы использования чужих логотипов](../mozhno-li-ispolzovat-chuzhoy-logotip/).

## Короткий вывод

Логотип для презентации должен оставаться чётким и на ноутбуке, и на огромном проекторе, и именно из‑за этого разброса размеров его безопаснее всего вставлять как [PNG](../png-ili-jpg-chto-luchshe/) с [прозрачным фоном](../logotip-s-prozrachnym-fonom/) в высоком разрешении: так он откроется в любой программе и не размоется на большом экране. [SVG](../svg-ili-png-dlya-logotipa/) даёт идеальную чёткость, но поддерживается не везде, поэтому его проверяют перед показом. Держите исходник в [векторе](../vektor-i-rastr-raznica/), готовьте светлую версию для тёмных слайдов и никогда не растягивайте маленький PNG. И ставьте знак одинаково на всех слайдах — это поддерживает [согласованность](../soglasovannost-brenda/).

Скачать логотип в SVG, сделать светлую версию и экспортировать PNG для слайдов можно в [каталоге Trace Logo's](../../logos/).

---EN---

A logo in a presentation — on the title slide, in the corner of every page, on a partner diagram — must look crisp both on a laptop and on a huge projector screen. And in this "both here and there" lies the whole difficulty: what looked perfect on a monitor during prep may "drift" on the big screen in the room. Presentation software is finicky about graphics, so a logo must be inserted with the harshest showing scenario in mind, not with how it looks in your editor.

## Why a logo "blurs" or vanishes in a presentation

To choose a format, let's first figure out why the mark gets spoiled — there are three reasons, all tied to a presentation being shown on different screens. The first: raster blurs on a big screen. A small [PNG](../png-ili-jpg-chto-luchshe/) stretched across a whole projector slide loses crispness, because it has fewer pixels than the big screen demands (the mechanism is the same as in [why a logo looks blurry](../pochemu-logotip-razmytyj/)). The second: SVG doesn't insert everywhere — recent PowerPoint versions work with [SVG](../svg-ili-png-dlya-logotipa/), but old ones and part of Google Slides either don't understand it or lose effects. The third: a white background ruins the slide — a logo on an opaque backing leaves a white rectangle on a colored slide background.

It's especially galling that all this surfaces at the worst moment — on a big screen in front of an audience, when it's too late to redo. In the editor on a laptop the slide looks flawless, but the projector in the room stretches the image across several meters and exposes its every flaw: a small logo crumbles into pixels, a white backing flares as a rectangle on a dark background, an inserted SVG doesn't open on someone else's computer at all. So a presentation logo is checked not on your own monitor but mentally on the biggest and most foreign screen it might end up on.

## What format to choose

From these three reasons the format choice follows. The safest option is a **[PNG](../png-ili-jpg-chto-luchshe/) with a transparent background**: it opens in any program and lies on any slide background. So it doesn't blur on a projector, it's exported large — 2-3× bigger than needed on the slide — then there are enough pixels even for a big screen. [SVG](../svg-ili-png-dlya-logotipa/) gives perfect crispness at any size, but it's worth taking only where it's definitely supported: before an important show, check that it opens on the very computer you'll present from. And the source is kept in [vector](../vektor-i-rastr-raznica/) in any case: from [SVG](../svg-ili-png-dlya-logotipa/) you export a PNG for any slide in a minute, while the reverse is hard (why so — in [vector vs raster](../vektor-i-rastr-raznica/)).

:::warning Don't stretch a small PNG
The most common mistake is taking a 100-pixel logo from a site header and stretching it across the whole title slide. On a laptop it's still tolerable, but on a projector it turns into a blurry mess, because the software has nothing to show but enlarged pixels. Always take the mark at high resolution or in [SVG](../svg-ili-png-dlya-logotipa/), don't enlarge a small [PNG](../png-ili-jpg-chto-luchshe/) beyond its size — enlargement doesn't add detail, it only makes the pixel grid visible.
:::

## Transparent background and dark slides

The background deserves separate thought, because slides are rarely white. A transparent background is mandatory for overlaying on colored and photo slides (how to get it, in [a logo with a transparent background](../logotip-s-prozrachnym-fonom/)), or the mark arrives with a white rectangle that jumps out on a colored slide. If the slide theme is dark, a dark logo will vanish on it — prepare a light version, the same principle as in [a logo for dark mode](../logotip-dlya-temnoj-temy/). And keep full and compact versions of the mark handy so each slide corner gets a suitable one — it's the same [adaptive](../adaptivnyj-logotip/) approach, only applied to slides.

## How to place a logo on slides

When the versions are ready, composition remains, and here one rule works — uniformity. On the title slide the mark is placed large, but with air around it (clear space). In the corner of every slide — a compact version, unobtrusive and in the same spot on all slides, because a logo "wandering" around the corners destroys the sense of a coherent presentation. A unified size and position from slide to slide is part of the [consistency](../soglasovannost-brenda/) the viewer reads as neatness. It's most convenient to set the mark's position once — on the slide master: then the logo automatically sits the same on all pages, and on a version change it updates everywhere at once. It's the same reuse as in a [design system](../dizajn-sistema-brenda/): you don't place the mark on each slide by hand, risking a shift of a couple of pixels, but set the rule once — and at the same time you insure against a mismatch when several people edit the presentation. And if you show partner or client logos, take their official versions in [vector](../svg-ili-png-dlya-logotipa/), not murky pictures from search, and remember the [boundaries of using others' logos](../mozhno-li-ispolzovat-chuzhoy-logotip/).

## The short takeaway

A logo for a presentation must stay crisp both on a laptop and on a huge projector, and it's precisely because of this size spread that it's safest to insert it as a [PNG](../png-ili-jpg-chto-luchshe/) with a [transparent background](../logotip-s-prozrachnym-fonom/) at high resolution: so it opens in any program and doesn't blur on a big screen. [SVG](../svg-ili-png-dlya-logotipa/) gives perfect crispness but isn't supported everywhere, so it's checked before the show. Keep the source in [vector](../vektor-i-rastr-raznica/), prepare a light version for dark slides, and never stretch a small PNG. And place the mark the same on all slides — this supports [consistency](../soglasovannost-brenda/).

You can download a logo in SVG, make a light version, and export a PNG for slides in the [Trace Logo's catalog](../../logos/).
