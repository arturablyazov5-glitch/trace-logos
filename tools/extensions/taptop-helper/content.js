;(function () {
  "use strict"

  if (window.layerMultiSelect) {
    console.log("Мультиинструменты уже активны")
    return
  }

  console.log("Мультиинструменты активируются...")

  const selectedLayers = new Set()
  let isDeleting = false
  let multiClipboard = [] // [{tagID, clipData}] — буфер для мультивставки

  // ─── Доступ к внутреннему API Taptop через rspack ────────────────────
  function getTaptopModules() {
    try {
      let req = null
      const chunk = window.rspackChunktaptop_design_editor
      if (!chunk) return null
      chunk.push([[`_ext_${Date.now()}`], {}, (r) => { req = r }])
      if (!req) return null
      return {
        C: req(6269).A,   // ClipboardService: copyToClipboard, pasteFromClipboard
        E: req(36945).A,  // MainLayout: tree
        A: req(87621).A,  // UIState: selected (tagID выбранного слоя)
      }
    } catch (e) {
      console.warn("Taptop API недоступен:", e)
      return null
    }
  }

  // ─── Копирование выделенных слоёв в мультибуфер (Cmd+C) ─────────────
  async function startMultiCopy() {
    if (selectedLayers.size === 0) return

    const mods = getTaptopModules()
    if (!mods) {
      showNotif("Ошибка: API Taptop недоступен. Обновите страницу.", "red")
      return
    }

    const { C, E, A } = mods
    const layers = Array.from(selectedLayers).filter((el) => elementExists(el))
    if (layers.length === 0) return

    showNotif(`Копирую ${layers.length} ${pluralSloy(layers.length)}...`, "blue")

    const queue = []
    for (const layer of layers) {
      layer.click()
      await wait(200)

      const tagID = A.selected
      if (!tagID) continue

      C.copyToClipboard(E, "copy", tagID)
      await wait(150)

      const rawClipData = window.store.clipboard.getClipboard()
      if (rawClipData && rawClipData.copiedLayout) {
        // Deep-clone: отвязываем от MobX-прокси, иначе данные устаревают после SPA-навигации
        queue.push({ tagID, clipData: JSON.parse(JSON.stringify(rawClipData)) })
      }
    }

    if (queue.length === 0) {
      showNotif("Не удалось скопировать слои. Попробуйте снова.", "red")
      return
    }

    multiClipboard = queue
    const n = queue.length
    showNotif(`${n} ${pluralSloy(n)} в буфере. Нажми Cmd+V на нужной странице.`, "green")
  }

  // ─── Вставка из мультибуфера (Cmd+V) ────────────────────────────────
  async function doMultiPaste() {
    if (multiClipboard.length === 0) return false // нет данных — отдаём обычному Cmd+V

    const mods = getTaptopModules()
    if (!mods) {
      showNotif("Ошибка: API Taptop недоступен", "red")
      return true
    }

    const { C, E } = mods
    const total = multiClipboard.length
    let pasted = 0

    for (let i = 0; i < multiClipboard.length; i++) {
      showNotif(`Вставляю ${i + 1}/${total}...`, "blue")
      window.store.clipboard.setClipboard(multiClipboard[i].clipData)
      await wait(200)
      // rootId берём свежим на каждой итерации — после вставки дерево меняется.
      const rootId = E.tree.root
      const posDesc = { id: rootId, afterChild: null, beforeChild: null }
      // 2-й аргумент (tagID) обязателен: без него pasteFromClipboard требует
      // активного выделения на странице (A.selected) и иначе возвращает null.
      const result = C.pasteFromClipboard(posDesc, rootId)
      if (result) pasted++
      await wait(600)
    }

    showNotif(
      pasted > 0
        ? `Готово! Вставлено ${pasted} ${pluralSloy(pasted)}.`
        : `Ничего не вставлено. Попробуйте снова.`,
      pasted > 0 ? "green" : "blue"
    )
    return true
  }

  function pluralSloy(n) {
    if (n === 1) return "слой"
    if (n >= 2 && n <= 4) return "слоя"
    return "слоёв"
  }

  // ─── Вспомогательные утилиты ─────────────────────────────────────────

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  function elementExists(el) {
    return el && document.contains(el)
  }

  // ─── Уведомление ─────────────────────────────────────────────────────

  function showNotif(text, color) {
    const colorMap = {
      blue:  "rgba(30, 130, 255, 0.92)",
      green: "rgba(22, 163, 74, 0.92)",
      red:   "rgba(220, 38, 38, 0.92)",
    }
    const bg = colorMap[color] || colorMap.blue
    let notif = document.getElementById("__tt-ext-notif__")
    if (!notif) {
      notif = document.createElement("div")
      notif.id = "__tt-ext-notif__"
      Object.assign(notif.style, {
        position:      "fixed",
        bottom:        "24px",
        left:          "50%",
        transform:     "translateX(-50%)",
        color:         "#fff",
        padding:       "10px 20px",
        borderRadius:  "8px",
        fontSize:      "13px",
        fontFamily:    "system-ui, sans-serif",
        zIndex:        "999999",
        boxShadow:     "0 4px 16px rgba(0,0,0,0.25)",
        maxWidth:      "480px",
        textAlign:     "center",
        pointerEvents: "none",
        transition:    "opacity 0.3s",
        lineHeight:    "1.4",
      })
      document.body.appendChild(notif)
    }
    notif.style.background = bg
    notif.textContent = text
    notif.style.opacity = "1"
    clearTimeout(notif._t)
    notif._t = setTimeout(() => (notif.style.opacity = "0"), 5000)
  }

  // ─── Визуальное выделение ────────────────────────────────────────────

  function clearChildBg(el) {
    if (!elementExists(el)) return
    el.querySelectorAll("*").forEach((c) => {
      c.style.setProperty("background", "none", "important")
      c.style.setProperty("background-color", "transparent", "important")
    })
  }

  function clearStyle(el) {
    if (!elementExists(el)) return
    el.classList.remove("layer-multiselect-highlight")
    el.style.removeProperty("background-color")
    el.style.removeProperty("background")
    el.style.removeProperty("border")
    el.style.removeProperty("outline")
    el.style.removeProperty("box-shadow")
    clearChildBg(el)
    el.style.backgroundColor = ""
    el.style.background = ""
  }

  function updateVisual() {
    requestAnimationFrame(() => {
      document.querySelectorAll(".tt-layers__item").forEach((item) => {
        if (selectedLayers.has(item)) {
          item.classList.add("layer-multiselect-highlight")
          item.style.setProperty("background-color", "rgba(255, 100, 100, 0.2)", "important")
          clearChildBg(item)
        } else {
          clearStyle(item)
        }
      })
    })
  }

  // ─── Выделение слоёв ─────────────────────────────────────────────────

  function handleMousedown(e) {
    const draggable = e.target.closest(".tt-layers__draggable")
    if (!draggable) return
    const item = draggable.querySelector(".tt-layers__item")
    if (!item) return

    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      e.stopPropagation()

      if (selectedLayers.has(item)) {
        selectedLayers.delete(item)
        clearStyle(item)
      } else {
        selectedLayers.add(item)
        item.classList.add("layer-multiselect-highlight")
        item.style.setProperty("background-color", "rgba(255, 100, 100, 0.2)", "important")
        clearChildBg(item)
      }

      setTimeout(updateVisual, 10)
      window.layerMultiSelect?._updatePopupCount?.()
      return false
    }

    if (!e.shiftKey) {
      selectedLayers.forEach((i) => clearStyle(i))
      selectedLayers.clear()
      updateVisual()
    }
  }

  // ─── Клавиатура ──────────────────────────────────────────────────────

  function handleKeydown(e) {
    const isDelete    = e.key === "Delete" || e.key === "Del" || e.keyCode === 46
    const isBackspace = e.key === "Backspace" || e.keyCode === 8
    const isCopy      = (e.ctrlKey || e.metaKey) && e.key === "c" && !e.shiftKey && !e.altKey
    const isPaste     = (e.ctrlKey || e.metaKey) && e.key === "v" && !e.shiftKey && !e.altKey
    const isEscape    = e.key === "Escape"

    if (isCopy && selectedLayers.size > 0) {
      e.preventDefault()
      e.stopPropagation()
      startMultiCopy()
      return false
    }

    if (isPaste && multiClipboard.length > 0) {
      e.preventDefault()
      e.stopPropagation()
      doMultiPaste()
      return false
    }

    if ((isDelete || isBackspace) && selectedLayers.size > 0 && !isDeleting) {
      e.preventDefault()
      e.stopPropagation()
      deleteLayersSequentially(Array.from(selectedLayers))
      return false
    }

    if (isEscape) {
      if (multiClipboard.length > 0) {
        multiClipboard = []
        showNotif("Буфер очищен.", "blue")
      }
      selectedLayers.forEach((i) => clearStyle(i))
      selectedLayers.clear()
      updateVisual()
    }
  }

  // ─── Удаление ────────────────────────────────────────────────────────

  async function deleteLayersSequentially(list) {
    if (isDeleting) return
    isDeleting = true
    for (let i = 0; i < list.length; i++) {
      const item = list[i]
      let done = false
      for (let attempt = 1; attempt <= 3 && !done; attempt++) {
        done = await deleteSingle(item)
        if (!done && attempt < 3) await wait(200)
      }
      if (done) { selectedLayers.delete(item); clearStyle(item) }
      if (i < list.length - 1) await wait(150)
    }
    isDeleting = false
    updateVisual()
  }

  function dispatchKey(key, keyCode) {
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key, code: `Key${key.toUpperCase()}`, keyCode,
        bubbles: true, cancelable: true, composed: true,
      }),
    )
  }

  async function deleteSingle(item) {
    if (!elementExists(item)) return true
    try {
      item.click()
      await wait(80)
      if (!elementExists(item)) return true
      dispatchKey("Delete", 46)
      await wait(300)
      if (!elementExists(item)) return true
      dispatchKey("Backspace", 8)
      await wait(200)
      if (!elementExists(item)) return true
      for (let i = 0; i < 3; i++) { dispatchKey("Delete", 46); await wait(50) }
      await wait(200)
      return !elementExists(item)
    } catch { return false }
  }

  // ─── Автопубликация всех страниц ─────────────────────────────────────
  //
  // Баннер прогресса (затемнение + блюр + карточка + промо Trace Logos) —
  // 1в1 портирован из tools/extensions/reviews-exporter/collector.js
  // (createRvwProgress/rvwPromoInnerHtml/RVW_PROMO_CSS). Разница только в
  // мире выполнения: content.js здесь подключён с "world": "MAIN"
  // (обязательно для доступа к window.rspackChunktaptop_design_editor —
  // см. CLAUDE.md), а в MAIN world chrome.runtime.getURL() недоступен,
  // поэтому промо-картинки не читаются файлами через web_accessible_resources
  // как у reviews-exporter, а инлайнены data:-URI в promo-assets.js
  // (window.__ttHelperPromoAssets), который подключён первым в том же
  // content_scripts-блоке.

  const TT_TRACE_LOGOS_URL = "https://trace-logos.ru/?utm_source=taptop-helper&utm_medium=extension"
  const TT_DONATE_URL = "https://app.lava.top/products/6f3c8efd-27c3-41a8-acb1-559b83ea3b46/d9261f0e-d716-418c-b91d-764e83f1c01c?currency=RUB"

  // forms = [один, два-четыре, пять-и-больше]
  function ttPluralWord(n, forms) {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return forms[0]
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
    return forms[2]
  }
  const TT_PAGE_WORDS = ["страница", "страницы", "страниц"]

  function ttPromoInnerHtml() {
    const assets = window.__ttHelperPromoAssets || {}
    const popularLogos = [
      ["ozon", "Ozon"],
      ["wildberries", "Wildberries"],
      ["2gis", "2ГИС"],
      ["yandex", "Яндекс"],
      ["sber", "Сбер"],
      ["vk", "ВКонтакте"],
    ]
    const logosGridHtml = popularLogos
      .map(([slug, name]) => `
        <img class="tth-logo-cell" src="${assets[slug] || ""}" alt="${name}" title="${name}" loading="lazy" />
      `)
      .join("")

    return `
      <img src="${assets.traceLogos || ""}" width="52" height="52" style="border-radius:13px; display:block; margin:0 auto 12px;" alt="Trace Logos" />
      <div style="font-size:15px; font-weight:600; margin-bottom:6px;">Trace Logos</div>
      <div style="font-size:12px; opacity:.65; line-height:1.45; margin-bottom:16px;">3000+ SVG/PNG-логотипов брендов — бесплатно, без регистрации</div>
      <div class="tth-logo-grid">${logosGridHtml}</div>
      <a class="tth-btn tth-btn-primary" href="${TT_TRACE_LOGOS_URL}" target="_blank" rel="noopener noreferrer">
        Перейти на сайт
      </a>
      <a class="tth-btn tth-btn-secondary" href="${TT_DONATE_URL}" target="_blank" rel="noopener noreferrer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        Поддержать автора
      </a>
    `
  }

  const TT_PROMO_CSS = `
    .tth-promo, .tth-promo * {
      box-sizing: border-box;
    }
    .tth-promo .tth-logo-grid {
      display: flex;
      justify-content: space-between;
      margin-bottom: 18px;
    }
    .tth-promo .tth-logo-cell {
      width: 32px; height: 32px; object-fit: contain; flex-shrink: 0; border-radius: 8px;
    }
    .tth-promo .tth-btn {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      width: 100%; padding: 12px 20px; border-radius: 12px;
      font-size: 12px; font-weight: 500; text-decoration: none;
      color: #fff; transition: background .15s, filter .15s;
    }
    .tth-promo .tth-btn-primary {
      background: #5229cd;
      margin-bottom: 10px;
    }
    .tth-promo .tth-btn-primary:hover { filter: brightness(1.12); }
    .tth-promo .tth-btn-secondary {
      background: rgb(36, 36, 36);
    }
    .tth-promo .tth-btn-secondary:hover { background: rgb(50, 50, 50); }
  `

  // Единая карточка с прогрессом поверх затемнённой/размытой страницы —
  // такая же, как в reviews-exporter (createRvwProgress). Затемнение
  // перехватывает клики (pointer-events: auto), колесо/тачпад/свайп
  // глушатся отдельно, иначе скролл проходит сквозь непрозрачный для
  // кликов элемент прямо в документ под ним.
  function createTtProgress({ initialText = "Начинаю публикацию", statusText = "Публикую страницы…" } = {}) {
    const overlay = document.createElement("div")
    overlay.id = "tth-progress-overlay"

    const card = document.createElement("div")
    card.id = "tth-progress-card"
    card.innerHTML = `
      <div id="tth-progress-status">${statusText}</div>
      <div id="tth-progress-count">${initialText}</div>
      <div id="tth-progress-track"><div id="tth-progress-bar"></div></div>
      <div id="tth-progress-hint">Не закрывай вкладку</div>
      <div class="tth-progress-divider"></div>
      <div class="tth-promo"></div>
    `
    card.querySelector(".tth-promo").innerHTML = ttPromoInnerHtml()
    overlay.appendChild(card)
    document.body.appendChild(overlay)

    const styleTag = document.createElement("style")
    styleTag.id = "tth-progress-style"
    styleTag.textContent = `
      #tth-progress-overlay {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.65);
        backdrop-filter: blur(3px);
        opacity: 0;
        transition: opacity .5s ease;
        pointer-events: auto;
      }
      #tth-progress-card, #tth-progress-card * {
        box-sizing: border-box;
      }
      #tth-progress-card {
        position: relative;
        pointer-events: auto;
        width: 300px;
        padding: 24px;
        border-radius: 18px;
        background: rgba(22, 21, 26, 0.94);
        backdrop-filter: blur(8px);
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08), 0 24px 70px rgba(0, 0, 0, 0.55);
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #fff;
        transform: translateY(8px) scale(.98);
        transition: transform .5s cubic-bezier(.2,.8,.3,1);
      }
      #tth-progress-close {
        position: absolute;
        top: 10px;
        right: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        border: none;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.65);
        cursor: pointer;
        transition: background .15s, color .15s;
      }
      #tth-progress-close:hover {
        background: rgba(255, 255, 255, 0.16);
        color: #fff;
      }
      #tth-progress-overlay.tth-shown #tth-progress-card { transform: none; }
      #tth-progress-status {
        font-size: 15px;
        font-weight: 600;
        margin-bottom: 6px;
      }
      #tth-progress-count {
        font-size: 12px;
        opacity: .65;
        margin-bottom: 14px;
      }
      #tth-progress-track {
        height: 6px;
        border-radius: 99px;
        background: rgba(255, 255, 255, 0.12);
        overflow: hidden;
      }
      #tth-progress-bar {
        height: 100%;
        width: 0%;
        border-radius: 99px;
        background: #5229cd;
        transition: width .35s ease, background-color .35s ease;
      }
      /* Пока не знаем общее число неопубликованных страниц (до первого
         открытия модалки публикации) — вместо вранья про «0%» бегущая полоса. */
      #tth-progress-track.tth-indeterminate #tth-progress-bar {
        width: 35%;
        animation: tth-progress-slide 1.1s ease-in-out infinite;
      }
      @keyframes tth-progress-slide {
        0%   { transform: translateX(-100%); }
        100% { transform: translateX(285%); }
      }
      #tth-progress-hint {
        font-size: 11px;
        opacity: .4;
        margin-top: 10px;
      }
      #tth-progress-overlay.tth-done #tth-progress-bar { background: #5dcaa5; }
      #tth-progress-overlay.tth-done #tth-progress-hint { visibility: hidden; }
      .tth-progress-divider {
        height: 1px;
        margin: 20px 0;
        background: rgba(255, 255, 255, 0.09);
      }
      #tth-progress-done-check {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 52px;
        height: 52px;
        margin: 0 auto 14px;
        border-radius: 50%;
        background: rgba(93, 202, 165, 0.14);
      }
      #tth-progress-done-text {
        font-size: 14px;
        font-weight: 600;
        line-height: 1.4;
        margin-bottom: 20px;
      }
      #tth-progress-card .tth-btn {
        display: flex; align-items: center; justify-content: center; gap: 6px;
        width: 100%; padding: 12px 20px; border-radius: 12px;
        font-size: 12px; font-weight: 500; text-decoration: none;
        color: #fff; border: none; transition: background .15s, filter .15s;
      }
      #tth-progress-card .tth-btn-primary {
        background: #5229cd;
        margin-bottom: 10px;
        cursor: pointer;
        font-family: inherit;
      }
      #tth-progress-card .tth-btn-primary:hover { filter: brightness(1.12); }
      #tth-progress-card .tth-btn-secondary {
        background: rgb(36, 36, 36);
      }
      #tth-progress-card .tth-btn-secondary:hover { background: rgb(50, 50, 50); }
      ${TT_PROMO_CSS}
    `
    document.head.appendChild(styleTag)

    const countEl = card.querySelector("#tth-progress-count")
    const trackEl = card.querySelector("#tth-progress-track")
    const barEl = card.querySelector("#tth-progress-bar")
    trackEl.classList.add("tth-indeterminate")
    // Знаменатель (expected) уточняется на каждой итерации публикации —
    // модалка Taptop каждый раз отдаёт актуальный остаток. Полоса зажата
    // на максимуме, который уже показывали: назад она не идёт никогда.
    let maxPct = 0

    setTimeout(() => {
      overlay.style.opacity = "1"
      overlay.classList.add("tth-shown")
    }, 30)

    const blockScroll = (e) => e.preventDefault()
    overlay.addEventListener("wheel", blockScroll, { passive: false })
    overlay.addEventListener("touchmove", blockScroll, { passive: false })

    let closed = false
    function cleanup() {
      if (closed) return
      closed = true
      overlay.removeEventListener("wheel", blockScroll)
      overlay.removeEventListener("touchmove", blockScroll)
      overlay.style.opacity = "0"
      setTimeout(() => {
        overlay.remove()
        styleTag.remove()
      }, 600)
    }

    return {
      // total — сколько страниц опубликовано (счётчик), expected —
      // total + сколько ещё осталось в списке модалки на этой итерации.
      progress({ total, expected }) {
        if (expected) {
          trackEl.classList.remove("tth-indeterminate")
          const rawPct = Math.min(100, Math.round((total / expected) * 100))
          maxPct = Math.max(maxPct, rawPct)
          barEl.style.width = `${maxPct}%`
          countEl.textContent = `Опубликовано ${total} из ${expected} · ${maxPct}%`
        } else {
          countEl.textContent = `Опубликовано ${total} ${ttPluralWord(total, TT_PAGE_WORDS)}`
        }
      },
      finish(count) {
        overlay.classList.add("tth-done")
        card.innerHTML = `
          <button id="tth-progress-close" type="button" aria-label="Закрыть">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M1 1l10 10M11 1 1 11"/></svg>
          </button>
          <div id="tth-progress-done-check">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5DCAA5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
          </div>
          <div id="tth-progress-done-text">${count > 0 ? `${count} ${ttPluralWord(count, TT_PAGE_WORDS)} опубликовано` : "Все страницы уже опубликованы"}</div>
          <a class="tth-btn tth-btn-primary" href="${TT_TRACE_LOGOS_URL}" target="_blank" rel="noopener noreferrer">
            Перейти на сайт
          </a>
          <a class="tth-btn tth-btn-secondary" href="${TT_DONATE_URL}" target="_blank" rel="noopener noreferrer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            Поддержать автора
          </a>
        `
        card.querySelector("#tth-progress-close").addEventListener("click", cleanup)
      },
      error(text) {
        overlay.classList.add("tth-done")
        trackEl.classList.remove("tth-indeterminate")
        barEl.style.background = "#dc2626"
        card.querySelector("#tth-progress-status").textContent = "Ошибка"
        countEl.textContent = text
        card.querySelector("#tth-progress-hint").style.visibility = "hidden"
        // Карточка при ошибке не пересобирается целиком (в отличие от finish) —
        // промо остаётся на месте, добавляем только крестик, иначе оверлей
        // (pointer-events: auto) навсегда блокирует клики по странице.
        if (!card.querySelector("#tth-progress-close")) {
          const closeBtn = document.createElement("button")
          closeBtn.id = "tth-progress-close"
          closeBtn.type = "button"
          closeBtn.setAttribute("aria-label", "Закрыть")
          closeBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M1 1l10 10M11 1 1 11"/></svg>`
          closeBtn.addEventListener("click", cleanup)
          card.appendChild(closeBtn)
        }
      },
      remove: cleanup,
    }
  }

  let isPublishing = false

  // Кнопка публикации в шапке зависит от режима редактора
  function findPublishButton() {
    return document.querySelector(".tt-design-mode-publish, .tt-client-mode-publish")
  }

  async function publishAllPages() {
    if (isPublishing) return
    isPublishing = true

    const btn = document.getElementById("__tt-helper-publish-all__")
    const restoreBtn = () => {
      if (btn) {
        btn.disabled = false
        btn.textContent = "Опубликовать всё"
        // disabled-кнопка не получает mouseleave (браузер не шлёт события
        // мыши на disabled form controls) — если курсор оказался над кнопкой
        // прямо перед тем, как мы её задизейблили ниже, hover-фон из
        // mouseenter так и остаётся фиолетовым до следующего наведения.
        // Сбрасываем явно, не полагаясь на mouseleave.
        btn.style.background = "#fff"
        btn.style.color = "#1a1a1a"
      }
    }
    if (btn) { btn.disabled = true; btn.textContent = "Публикую…" }

    const indicator = createTtProgress()

    let totalPublished = 0
    let iteration = 1

    try {
      while (true) {
        // 1. Открыть модалку, если закрыта
        if (!elementExists2(".tt-publish-modal")) {
          const pub = findPublishButton()
          if (!pub) { indicator.error("Кнопка публикации не найдена"); break }
          pub.click()
          await wait(1500)
        }

        // 2. Дождаться модалки и найти кнопки публикации страниц
        const modal = await waitForSelector(".tt-publish-modal", 3000).catch(() => null)
        if (!modal) { indicator.error("Окно публикации не открылось"); break }

        const buttons = document.querySelectorAll(
          ".tt-publish-design-list__item button.tt-button--appearance-primary"
        )

        // Знаменатель прогресса — сколько страниц ещё остались в списке
        // модалки на этой итерации плюс уже опубликованные.
        indicator.progress({ total: totalPublished, expected: totalPublished + buttons.length })

        if (buttons.length === 0) {
          indicator.finish(totalPublished)
          break
        }

        // 3. Публикуем первую страницу в списке
        buttons[0].click()

        // 4. Ждём статус «Сохранено» (или упрощённое ожидание)
        await waitForSavedStatus().catch(() => wait(5000))
        totalPublished++
        indicator.progress({ total: totalPublished, expected: totalPublished + buttons.length - 1 })

        // 5. Закрываем модалку, чтобы обновился список
        if (elementExists2(".tt-publish-modal")) {
          const closeBtn = document.querySelector(".tt-popup__close-button")
          if (closeBtn) { closeBtn.click(); await wait(1000) }
        }
        await wait(2000)

        if (++iteration > 100) { indicator.error("Достигнут лимит итераций"); break }
      }
    } catch (e) {
      console.warn("[Taptop Helper] Ошибка публикации:", e)
      indicator.error("Ошибка публикации: " + e.message)
    } finally {
      isPublishing = false
      restoreBtn()
    }
  }

  function elementExists2(selector) {
    return document.querySelector(selector) !== null
  }

  function waitForSelector(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const start = Date.now()
      const check = () => {
        const el = document.querySelector(selector)
        if (el) return resolve(el)
        if (Date.now() - start > timeout) return reject(new Error("Timeout: " + selector))
        setTimeout(check, 100)
      }
      check()
    })
  }

  function waitForSavedStatus(maxWait = 60000) {
    return new Promise((resolve, reject) => {
      const start = Date.now()
      const check = () => {
        if (Date.now() - start > maxWait) return reject(new Error("Timeout сохранения"))
        const statusEl = document.querySelector(".tt-header__status")
        const useEl = statusEl?.querySelector("use")
        const href = useEl?.getAttribute("xlink:href") || ""
        if (href.includes("large-navbar-saved")) return resolve()
        setTimeout(check, 1000)
      }
      check()
    })
  }

  // Дизайнер — средняя кнопка (индекс 1) в .tt-design-preview-toggle,
  // см. автовключение режима «Дизайнер» ниже.
  function isDesignerModeActive() {
    const toggle = document.querySelector(".tt-design-preview-toggle")
    const designerBtn = toggle?.querySelectorAll("button")[1]
    return !!designerBtn?.classList.contains("tt-button--state-active")
  }

  // Просмотр — третья кнопка (индекс 2). В этом режиме сайт не редактируется
  // и публиковать нечего — кнопка там не нужна вообще, не просто с другим
  // отступом.
  function isPreviewModeActive() {
    const toggle = document.querySelector(".tt-design-preview-toggle")
    const previewBtn = toggle?.querySelectorAll("button")[2]
    return !!previewBtn?.classList.contains("tt-button--state-active")
  }

  // Зазор от соседей задаём сами, а не полагаемся на CSS-селекторы Taptop
  // вида «.tt-button + .tt-button» — наша кнопка не имеет класса tt-button.
  // В режиме «Дизайнер» рядом всегда есть </> (tt-button), и он своим
  // классом уже создаёт нужный отступ с обеих сторон — наш margin поверх
  // него давал бы двойной зазор. В режиме «Наполнение» </> нет в DOM
  // вообще, наша кнопка оказывается вплотную к статусу, и без своего
  // margin кнопки слипаются — там отступ нужен.
  function applyPublishBtnGap(btn) {
    const gap = isDesignerModeActive() ? "0" : "5px"
    btn.style.marginLeft = gap
    btn.style.marginRight = gap
  }

  // ─── Встройка кнопки «Опубликовать всё» в шапку редактора ────────────
  function injectPublishButton() {
    const existing = document.getElementById("__tt-helper-publish-all__")

    if (isPreviewModeActive()) {
      if (existing) existing.remove()
      return
    }

    const pub = findPublishButton()

    if (existing) {
      // Зазор пересчитываем всегда, даже если pub сейчас не нашёлся —
      // в режиме «Просмотр» нет ни .tt-design-mode-publish, ни
      // .tt-client-mode-publish (вместо них «Скрыть интерфейс»), и без
      // этого кнопка застревала бы с margin от предыдущего режима.
      applyPublishBtnGap(existing)
      // Кнопка уже вставлена, но Taptop мог пересоздать соседние кнопки
      // (например «</>») и вставить их перед pub, оттеснив нашу кнопку
      // левее. Возвращаем её на место — сразу перед «Опубликовать» —
      // при каждом тике, а не только при первом создании. Если pub сейчас
      // нет вообще (режим «Просмотр») — репозиционировать не от чего.
      if (pub && pub.parentElement && existing.nextElementSibling !== pub) {
        pub.parentElement.insertBefore(existing, pub)
      }
      return
    }

    if (!pub || !pub.parentElement) return

    const btn = document.createElement("button")
    btn.id = "__tt-helper-publish-all__"
    btn.type = "button"
    btn.textContent = "Опубликовать всё"
    Object.assign(btn.style, {
      height: "35px",
      padding: "0 14px",
      border: "none",
      borderRadius: "5px",          // как у оригинальной «Опубликовать»
      background: "#fff",
      color: "#1a1a1a",
      fontSize: "13.3333px",        // как у оригинала
      fontWeight: "500",            // как у оригинала
      fontFamily: "Inter, sans-serif",
      cursor: "pointer",
      whiteSpace: "nowrap",
      transition: "background 0.15s, color 0.15s",
    })
    applyPublishBtnGap(btn)
    btn.addEventListener("mouseenter", () => {
      if (!btn.disabled) { btn.style.background = "#5229CD"; btn.style.color = "#fff" }
    })
    btn.addEventListener("mouseleave", () => {
      if (!btn.disabled) { btn.style.background = "#fff"; btn.style.color = "#1a1a1a" }
    })
    btn.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      publishAllPages()
    })

    pub.parentElement.insertBefore(btn, pub)
  }

  // Шапка пересоздаётся при SPA-навигации, а Taptop иногда пересобирает
  // кнопки внутри неё (например прячет «</>» в режиме «Наполнение», что
  // сдвигает наши кнопки) — вместо setInterval-поллинга раз в секунду
  // реагируем на реальные изменения DOM через MutationObserver.
  // requestAnimationFrame схлопывает пачку мутаций одного рендера в один
  // вызов injectPublishButton вместо реакции на каждую по отдельности.
  let _publishBtnRAF = null
  const _publishBtnObserver = new MutationObserver(() => {
    if (_publishBtnRAF) return
    _publishBtnRAF = requestAnimationFrame(() => {
      _publishBtnRAF = null
      injectPublishButton()
    })
  })
  // attributes+attributeFilter:['class'] — отдельно от childList: переключение
  // режима «Наполнение»/«Дизайнер» меняет только class активной кнопки
  // тумблера (наш зазор зависит от него, см. applyPublishBtnGap), без
  // добавления/удаления узлов, поэтому childList его не поймал бы.
  _publishBtnObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"],
  })
  injectPublishButton()

  // Обычный el.click() не доходит до React-обработчика тумблера в Taptop —
  // подтверждено в консоли: .click() и MouseEvent('click') в одиночку не
  // переключают класс кнопки на tt-button--state-active, а полная цепочка
  // pointerdown → mousedown → pointerup → mouseup → click — переключает.
  // Судя по всему, обработчик у них завязан на реальную pointer-последовательность,
  // не на голое событие click.
  function simulateClick(el) {
    const r = el.getBoundingClientRect()
    const opts = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: r.left + r.width / 2,
      clientY: r.top + r.height / 2,
      button: 0,
    }
    el.dispatchEvent(new PointerEvent("pointerdown", { ...opts, pointerId: 1, isPrimary: true }))
    el.dispatchEvent(new MouseEvent("mousedown", opts))
    el.dispatchEvent(new PointerEvent("pointerup", { ...opts, pointerId: 1, isPrimary: true }))
    el.dispatchEvent(new MouseEvent("mouseup", opts))
    el.dispatchEvent(new MouseEvent("click", opts))
  }

  // ─── Автовключение режима «Дизайнер» при заходе (один раз) ───────────
  // Три кнопки в .tt-design-preview-toggle: контент / дизайнер / превью.
  // Дизайнер — средняя кнопка. Проверяем один раз при загрузке страницы:
  // если активна не она — включаем. Дальше не трогаем, чтобы не мешать,
  // если пользователь сам переключится на другой режим.
  // Элемент появляется в DOM раньше, чем React у Taptop навешивает на него
  // реальный обработчик (или домонтирует стейт-менеджмент режима) — клик
  // сразу по найденному .tt-design-preview-toggle иногда просто теряется.
  // Поэтому не кликаем один раз, а перепроверяем результат и повторяем с
  // растущей паузой, пока класс кнопки реально не станет state-active —
  // так интерфейс сам сообщает нам, когда он «готов принимать клики»,
  // вместо гадания с фиксированным таймаутом. Кнопку перезапрашиваем на
  // каждой попытке (не держим ссылку) — на случай если toggle пересоздался.
  function ensureDesignerMode(attempt = 0) {
    const toggle = document.querySelector(".tt-design-preview-toggle")
    const designerBtn = toggle?.querySelectorAll("button")[1]
    if (!designerBtn) {
      if (attempt < 20) setTimeout(() => ensureDesignerMode(attempt + 1), 250 + attempt * 150)
      else console.warn("[Taptop Helper] .tt-design-preview-toggle/кнопка «Дизайнер» так и не появились")
      return
    }
    if (designerBtn.classList.contains("tt-button--state-active")) {
      console.log("[Taptop Helper] режим «Дизайнер» уже активен, попытка", attempt)
      return
    }
    if (attempt >= 20) {
      console.warn("[Taptop Helper] не удалось переключить режим «Дизайнер» за", attempt, "попыток")
      return
    }
    simulateClick(designerBtn)
    console.log("[Taptop Helper] клик по кнопке «Дизайнер», попытка", attempt)
    setTimeout(() => ensureDesignerMode(attempt + 1), 250 + attempt * 150)
  }
  waitForSelector(".tt-design-preview-toggle", 15000)
    .then(() => ensureDesignerMode())
    .catch((e) => console.warn("[Taptop Helper] .tt-design-preview-toggle не найден:", e))

  // ─── Сжатие фото в WebP («Сжать фото» в панели картинки) ─────────────
  //
  // Алгоритм сжатия — портирован 1в1 из tools/compress-webp/index.html
  // (createOutputForFile/findAutoQuality на trace-logos.ru): canvas →
  // toBlob('image/webp', quality) + бинарный поиск качества, при котором
  // результат ещё меньше оригинала. Портирован, а не подключён скриптом —
  // content.js работает в world: MAIN на домене taptop.pro, чужой JS с
  // trace-logos.ru туда не загрузить (другой origin).
  //
  // Заливка и применение — реверс-инжинирены через консоль на живом
  // редакторе. Прямой POST /-/x-api/v1/protected/?method=mosaic/uploadDesignImage
  // (тот самый запрос, что уходит при обычной загрузке) заливает файл на
  // сервер, но список в панели «Ресурсы» — локальный React-state
  // конкретного компонента, а не глобальный MobX-стор, поэтому raw-fetch
  // и даже их собственный internal service (rspack-модуль 49940,
  // uploadImage — та же голая обёртка над этим POST без побочных
  // эффектов) не обновляют список на экране. Единственный надёжный путь —
  // настоящий Drag & Drop на найденную дроп-зону (`.tt-dnd-upload__placeholder`,
  // см. `dispatchFileDrop`): тогда их собственный обработчик сам заливает
  // файл и сам обновляет список, а мы просто кликаем по появившейся
  // карточке — так же, как это делает человек, без обращения к
  // недокументированному внутреннему API вставки.

  async function createWebpBlob(file, quality) {
    const img = await new Promise((resolve, reject) => {
      const im = new Image()
      const objectUrl = URL.createObjectURL(file)
      im.onload = () => { URL.revokeObjectURL(objectUrl); resolve(im) }
      im.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Не удалось прочитать изображение")) }
      im.src = objectUrl
    })
    const canvas = document.createElement("canvas")
    canvas.width = img.width
    canvas.height = img.height
    canvas.getContext("2d").drawImage(img, 0, 0)
    const blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/webp", quality))
    if (!blob) throw new Error("Браузер не смог собрать WebP")
    return blob
  }

  // Бинарный поиск качества (макс. 7 итераций) — то же качество, при
  // котором результат ещё меньше оригинала, что и в веб-инструменте.
  async function findAutoQualityWebp(file) {
    const origSize = file.size
    const minBlob = await createWebpBlob(file, 0.01)
    if (minBlob.size >= origSize) return { blob: minBlob, quality: 1 }
    let lo = 1, hi = 100, bestQ = 1, bestBlob = minBlob
    for (let iter = 0; iter < 7; iter++) {
      const mid = Math.floor((lo + hi) / 2)
      if (mid <= lo) break
      const out = await createWebpBlob(file, mid / 100)
      if (out.size < origSize) { bestQ = mid; bestBlob = out; lo = mid }
      else hi = mid - 1
    }
    return { blob: bestBlob, quality: bestQ }
  }

  function formatBytes(n) {
    if (n < 1024) return `${n} Б`
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} КБ`
    return `${(n / 1024 / 1024).toFixed(2)} МБ`
  }

  // Список в панели «Ресурсы» — локальный React-state конкретного
  // компонента, а не глобальный MobX-стор: прямой POST на
  // mosaic/uploadDesignImage (см. ниже) заливает файл на сервер, но список
  // на экране не узнаёт об этом сам. И их же internal service (модуль
  // 49940, uploadImage) — это ровно тот же голый POST без какого-либо
  // побочного обновления стора. Поэтому вместо вызова API — настоящий
  // Drag & Drop на найденную дроп-зону: тогда их собственный обработчик
  // сам заливает файл, сам обновляет список, и мы просто кликаем по
  // появившейся карточке — так же, как это делает человек.
  // Стадии — с паузами, а не синхронно одна за другой. Похоже, их
  // компонент оптимистично подменяет верхнюю карточку списка "заглушкой
  // загрузки" уже на dragenter, а реальными данными — только после drop;
  // без паузы между стадиями это, судя по всему, гонка, из-за которой
  // ломается карточка, бывшая наверху списка (см. жалобу пользователя).
  async function dispatchFileDrop(target, file) {
    const dt = new DataTransfer()
    dt.items.add(file)
    const fire = (type, el) => {
      el.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt }))
    }
    // Все три события — в один и тот же элемент: ровно так отработал
    // проверочный дроп в консоли, отдельный «внешний» приёмник не нужен.
    fire("dragenter", target)
    await wait(300)
    fire("dragover", target)
    await wait(300)
    fire("drop", target)
  }

  function waitForAssetItem(filenameNoExt, timeout = 8000) {
    return new Promise((resolve, reject) => {
      const start = Date.now()
      const check = () => {
        const texts = document.querySelectorAll(".tt-assets-primary-item__text")
        for (const el of texts) {
          if (el.textContent.includes(filenameNoExt)) {
            const item = el.closest(".tt-assets-primary-item")
            if (item) return resolve(item)
          }
        }
        if (Date.now() - start > timeout) return reject(new Error("Не дождались файла в списке «Ресурсы»"))
        setTimeout(check, 200)
      }
      check()
    })
  }

  async function compressCurrentImage(picker, btn) {
    const srcLink = picker.querySelector(".image-source-picker__info-desc__body--source a")
    const replaceBtn = picker.querySelector(".image-source-picker__control button")
    if (!srcLink || !replaceBtn) {
      showNotif("Не найдена ссылка на файл или кнопка «Заменить изображение»", "red")
      return
    }

    const srcUrl = srcLink.getAttribute("href")
    // Текст — во вложенном .tt-button__text (структура их разметки), не
    // в самой кнопке: их padding для текста висит на этом span, не на button.
    const textEl = btn.querySelector(".tt-button__text") || btn
    const origBtnText = textEl.textContent
    btn.disabled = true
    textEl.textContent = "Сжимаю…"

    try {
      // Открываем панель «Ресурсы» — до сжатия, а не после. Первое
      // открытие тянет свой ленивый rspack-чанк (та же природа, что у
      // setImageBeforeInsert раньше) — ждём реального появления дроп-зоны
      // в DOM, а не фиксированную паузу: на медленном первом открытии
      // 600мс не хватало, и остаток кода падал на "зона не найдена".
      // «Заменить изображение» — переключатель, а не «открыть». Если
      // панель уже открыта с прошлого раза (или от другого блока), повторный
      // клик её ЗАКРОЕТ, и дроп-зона никогда не появится (Timeout). Кликаем
      // только когда дроп-зоны ещё нет на экране.
      // Цель дропа — сам список ресурсов. НЕ `.tt-dnd-upload__placeholder`:
      // тот оверлей («отпустите файл здесь») рендерится только ПОКА drag
      // активен, в покое его в DOM нет вообще — ожидание его появления до
      // дропа всегда упиралось в таймаут. Проверено в консоли: после
      // dragenter он появляется сам, а дроп в `.tt-assets-primary-list`
      // штатно добавляет файл в список.
      let dropZone = document.querySelector(".tt-assets-primary-list")
      if (!dropZone) {
        showNotif("Открываю панель «Ресурсы»…", "blue")
        // Голый replaceBtn.click() ненадёжен — тот же баг, что у тумблера
        // «Дизайнер» (см. simulateClick выше): их React-обработчики
        // подписаны на настоящую pointer-последовательность, а не на
        // синтетическое DOM-событие click.
        simulateClick(replaceBtn)
        dropZone = await waitForSelector(".tt-assets-primary-list", 8000)
      }

      // Снимок верхней карточки списка ДО дропа — чтобы после проверить,
      // что она никуда не делась (см. жалобу на порчу оригинала в списке).
      const topItemTextBefore = document.querySelector(".tt-assets-primary-item__text")?.textContent?.trim() || null

      showNotif("Скачиваю оригинал…", "blue")
      const origRes = await fetch(srcUrl)
      if (!origRes.ok) throw new Error("Не удалось скачать оригинал")
      const origBlob = await origRes.blob()
      const filename = decodeURIComponent(srcUrl.split("/").pop() || "image")
      const origFile = new File([origBlob], filename, { type: origBlob.type })

      showNotif("Подбираю качество WebP…", "blue")
      const { blob: webpBlob, quality } = await findAutoQualityWebp(origFile)

      if (webpBlob.size >= origFile.size) {
        showNotif("Сжатие не уменьшило размер — оригинал и так меньше.", "blue")
        return
      }

      // Уникальное имя — чтобы отличить свежую карточку от одноимённого
      // файла, который мог быть в «Ресурсах» и раньше.
      const baseName = `${filename.replace(/\.[^.]+$/, "")}_${Date.now()}`
      const webpFile = new File([webpBlob], `${baseName}.webp`, { type: "image/webp" })

      showNotif("Загружаю сжатую версию…", "blue")
      await dispatchFileDrop(dropZone, webpFile)

      const newItem = await waitForAssetItem(baseName)

      // Проверка целостности: старая верхняя карточка должна была просто
      // сдвинуться вниз списка, а не пропасть/побиться.
      if (topItemTextBefore) {
        const stillThere = [...document.querySelectorAll(".tt-assets-primary-item__text")]
          .some((el) => el.textContent?.trim() === topItemTextBefore)
        if (!stillThere) {
          console.warn(`[Taptop Helper] Карточка «${topItemTextBefore}», бывшая наверху списка «Ресурсы», не найдена после загрузки — возможна порча.`)
        }
      }

      showNotif("Применяю…", "blue")
      newItem.click()

      showNotif(
        `Готово! ${formatBytes(origBlob.size)} → ${formatBytes(webpBlob.size)} (качество ${quality}%)`,
        "green"
      )
    } catch (e) {
      console.warn("[Taptop Helper] Ошибка сжатия фото:", e)
      showNotif("Ошибка: " + e.message, "red")
    } finally {
      btn.disabled = false
      textEl.textContent = origBtnText
    }
  }

  // Кнопка нужна только когда в панели реально загружено фото, а не
  // заглушка (у заглушки «Размер источника» — «0 KB»). Проверяем на каждый
  // тик MutationObserver, а не один раз при первом появлении блока — тот
  // же .image-source-picker переиспользуется React'ом при смене картинки.
  function injectCompressButtons() {
    document.querySelectorAll(".image-source-picker").forEach((picker) => {
      const sizeEl = picker.querySelector(".image-source-picker__info-size")
      const sizeText = sizeEl?.textContent?.trim() || ""
      const hasRealImage = sizeText && !/^0\s*(KB|Б|B)\b/i.test(sizeText)
      // Уже WebP или векторный SVG — сжимать нечего (SVG — не растр, наш
      // canvas→toBlob('image/webp') тут не подходит по смыслу). Смотрим
      // на подпись адреса файла (`...__body--source`), не на href — там
      // расширение видно и без декодирования, даже если текст усечён
      // посередине (само расширение в конце всегда сохраняется).
      const srcText = picker.querySelector(".image-source-picker__info-desc__body--source")?.textContent?.trim() || ""
      const isAlreadyWebp = /\.webp\b/i.test(srcText)
      const isSvg = /\.svg\b/i.test(srcText)
      const existing = picker.querySelector(".tth-compress-btn")

      if (!hasRealImage || isAlreadyWebp || isSvg) {
        if (existing) existing.remove()
        return
      }
      if (existing) return

      // Родные классы Taptop, а не свои с нуля — content.js выполняется
      // прямо в контексте их страницы, .tt-button и его CSS-переменные уже
      // загружены. .tt-button задаёт radius/шрифт/transition и читает
      // background/border/color из --background-*/--border-*/--text-color-*
      // (см. правило .tt-button--state-hover, .tt-button:hover в их CSS) —
      // по умолчанию те же значения, что у оригинальной «Заменить
      // изображение» (appearance-black: #333 текст/бордер, прозрачный фон),
      // и только hover/active — фиолетовые. Наведение идёт через их же
      // настоящий :hover, не через сымитированные mouseenter/leave.
      const btn = document.createElement("button")
      btn.type = "button"
      btn.className = "tt-button tt-modifier--full-width tt-modifier--flex-content-center tth-compress-btn"
      btn.style.marginTop = "8px"
      const colorVars = {
        "--background-default": "transparent",
        "--background-hover": "#5229CD",
        "--background-active": "#4520a8",
        "--border-default": "#333",
        "--border-hover": "#5229CD",
        "--border-active": "#4520a8",
        "--text-color-default": "#333",
        "--text-color-hover": "#fff",
        "--text-color-active": "#fff",
        "--background-disabled": "transparent",
        "--border-disabled": "#dce8f2",
        "--text-color-disabled": "#dce8f2",
      }
      Object.entries(colorVars).forEach(([k, v]) => btn.style.setProperty(k, v))

      const textEl = document.createElement("span")
      textEl.className = "tt-button__text tt-button__text--size-medium"
      textEl.textContent = "Сжать фото"
      // Явно, поверх класса — подстраховка на случай, если специфичность
      // <button><span> у нас читает font-weight не так, как в их разметке.
      textEl.style.fontWeight = "500"
      textEl.style.fontFamily = "Inter, sans-serif"
      btn.appendChild(textEl)

      btn.addEventListener("click", (e) => {
        e.preventDefault()
        e.stopPropagation()
        compressCurrentImage(picker, btn)
      })
      picker.appendChild(btn)
    })
  }

  // characterData — размер/имя файла React иногда обновляет прямой правкой
  // текстового узла, без childList-мутации на предках; без этого флага
  // такое обновление осталось бы незамеченным.
  let _compressBtnRAF = null
  const _compressBtnObserver = new MutationObserver(() => {
    if (_compressBtnRAF) return
    _compressBtnRAF = requestAnimationFrame(() => {
      _compressBtnRAF = null
      injectCompressButtons()
    })
  })
  _compressBtnObserver.observe(document.body, { childList: true, subtree: true, characterData: true })
  injectCompressButtons()

  // ─── Инициализация ───────────────────────────────────────────────────

  document.addEventListener("mousedown", handleMousedown, true)
  document.addEventListener("keydown",   handleKeydown,   true)

  window.layerMultiSelect = {
    getSelected:       () => Array.from(selectedLayers),
    getCount:          () => selectedLayers.size,
    getClipboardCount: () => multiClipboard.length,
    clearAll: () => {
      selectedLayers.forEach((i) => clearStyle(i))
      selectedLayers.clear()
      multiClipboard = []
      updateVisual()
    },
    refreshHighlight:  () => updateVisual(),
    _updatePopupCount: null,
  }

  window._layerMultiSelectHandlers = { mousedown: handleMousedown, keydown: handleKeydown }

  let _refreshBusy = false
  const _refreshTimer = setInterval(() => {
    if (selectedLayers.size > 0 && !_refreshBusy) {
      _refreshBusy = true
      requestAnimationFrame(() => { updateVisual(); _refreshBusy = false })
    }
  }, 500)
  window.addEventListener("beforeunload", () => {
    clearInterval(_refreshTimer)
    _publishBtnObserver.disconnect()
    if (_publishBtnRAF) cancelAnimationFrame(_publishBtnRAF)
    _compressBtnObserver.disconnect()
    if (_compressBtnRAF) cancelAnimationFrame(_compressBtnRAF)
  })

  console.log("Мультиинструменты активированы (v5 — кнопка публикации в шапке + сжатие фото)")
})()
