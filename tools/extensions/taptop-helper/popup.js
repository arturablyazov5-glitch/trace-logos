document.addEventListener("DOMContentLoaded", function () {
  const statusAvatar = document.getElementById("statusAvatar")
  const statusIcon = document.getElementById("statusIcon")
  const statusText = document.getElementById("statusText")
  const errorMessage = document.getElementById("errorMessage")
  const publishBtn = document.getElementById("publishBtn")
  const publishStatus = document.getElementById("publishStatus")

  // Иконка статуса — <use href> на спрайт в popup.html, не текстовый
  // символ/эмодзи. Цвет-состояние несёт .scope-avatar (см. styles.css:
  // .active/.error), тот же паттерн, что .count-badge в Figma-плагине.
  function setStatusIcon(iconId, avatarClass) {
    statusIcon.setAttribute("href", "#" + iconId)
    statusAvatar.className = "scope-avatar" + (avatarClass ? ` ${avatarClass}` : "")
  }

  // ─── Статус расширения слоёв ─────────────────────────────────────────
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0]
    const isValidUrl = currentTab && currentTab.url && currentTab.url.includes("mosaic")

    if (!isValidUrl) {
      showError("Откройте редактор Taptop")
      setStatusIcon("icon-alert", "error")
      statusText.textContent = "Неверная страница"
    } else {
      checkExtensionStatus(currentTab)
    }
  })

  async function checkExtensionStatus(tab) {
    try {
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: "MAIN",
        func: () => ({
          isExtensionActive: typeof window.layerMultiSelect !== "undefined",
          selectedCount: window.layerMultiSelect ? window.layerMultiSelect.getCount() : 0,
        }),
      })

      const data = result[0]?.result

      if (data && data.isExtensionActive) {
        setStatusIcon("icon-check", "active")
        statusText.textContent = `Расширение активно (выбрано: ${data.selectedCount})`
      } else {
        setStatusIcon("icon-zap", "")
        statusText.textContent = "Расширение не активно"
      }
    } catch (error) {
      console.error("Ошибка проверки статуса:", error)
      setStatusIcon("icon-alert", "error")
      statusText.textContent = "Ошибка проверки"
    }
  }

  function showError(message) {
    errorMessage.textContent = message
    errorMessage.style.display = "block"
    setTimeout(() => {
      errorMessage.style.display = "none"
    }, 3000)
  }

  setInterval(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0]
      if (currentTab && currentTab.url && currentTab.url.includes("mosaic")) {
        checkExtensionStatus(currentTab)
      }
    })
  }, 2000)

  // ─── Автопубликация всех страниц ─────────────────────────────────────
  publishBtn.addEventListener("click", async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
        url: "*://*/-/cms/v1/mosaic/*",
      })

      if (!tab) {
        setPublishStatus("Откройте редактор Taptop", "error")
        return
      }

      publishBtn.disabled = true
      setPublishBtnLabel("Запуск…")
      setPublishStatus("Запуск публикации…", "info")

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: startTaptopPublisher,
        args: [],
      })

      setPublishStatus("Публикация запущена", "success")

      setTimeout(() => {
        window.close()
      }, 2000)
    } catch (error) {
      console.error("Ошибка:", error)
      setPublishStatus("Ошибка: " + error.message, "error")
      publishBtn.disabled = false
      setPublishBtnLabel("Опубликовать все страницы")
    }
  })

  // Кнопка несёт иконку (svg use) + текстовый узел — textContent затирал бы
  // иконку, поэтому подпись меняет отдельный <span>.
  function setPublishBtnLabel(text) {
    const label = publishBtn.querySelector(".btn-label")
    if (label) label.textContent = text
  }

  function setPublishStatus(text, type = "info") {
    publishStatus.textContent = text
    publishStatus.className = "publish-status" + (type ? ` ${type}` : "")
  }

  // Функция, выполняемая на странице редактора (изолированный мир)
  function startTaptopPublisher() {
    if (window.taptopPublisherRunning) {
      console.log("[Taptop Publisher] Публикатор уже запущен")
      return
    }
    window.taptopPublisherRunning = true

    function waitForElement(selector, timeout = 10000) {
      return new Promise((resolve, reject) => {
        const startTime = Date.now()
        const check = () => {
          const el = document.querySelector(selector)
          if (el) return resolve(el)
          if (Date.now() - startTime > timeout) return reject(new Error("Timeout"))
          setTimeout(check, 100)
        }
        check()
      })
    }

    function elementExists(selector) {
      return document.querySelector(selector) !== null
    }

    function clickElement(element) {
      if (element) {
        element.click()
        console.log("[Taptop Publisher] Клик: " + (element.className || element.tagName))
        return true
      }
      return false
    }

    async function waitForSavedStatus() {
      const maxWait = 60000
      const start = Date.now()
      return new Promise((resolve, reject) => {
        const check = () => {
          if (Date.now() - start > maxWait) return reject(new Error("Timeout сохранения"))
          const statusEl = document.querySelector(".tt-header__status")
          if (statusEl) {
            const useEl = statusEl.querySelector("use")
            if (
              useEl &&
              useEl.getAttribute("xlink:href") &&
              useEl.getAttribute("xlink:href").includes("large-navbar-saved")
            ) {
              console.log("[Taptop Publisher] Статус: Сохранено")
              return resolve()
            }
          }
          setTimeout(check, 1000)
        }
        check()
      })
    }

    async function publishAllPages() {
      console.log("[Taptop Publisher] Старт публикации всех страниц")

      let totalPublished = 0
      let iteration = 1

      while (true) {
        console.log(`[Taptop Publisher] Итерация ${iteration}`)

        try {
          if (!elementExists(".tt-publish-modal")) {
            console.log("[Taptop Publisher] Открываю модальное окно")
            const publishBtn = await waitForElement(".tt-design-mode-publish")
            clickElement(publishBtn)
            await new Promise((r) => setTimeout(r, 1500))
          }

          await waitForElement(".tt-publish-modal", 3000)
          const buttons = document.querySelectorAll(
            ".tt-publish-design-list__item button.tt-button--appearance-primary"
          )

          console.log(`[Taptop Publisher] Найдено кнопок: ${buttons.length}`)

          if (buttons.length === 0) {
            console.log("[Taptop Publisher] Все страницы опубликованы!")
            alert("✅ Все страницы опубликованы!")
            break
          }

          console.log(`[Taptop Publisher] Публикую страницу ${totalPublished + 1}`)
          clickElement(buttons[0])

          try {
            await waitForSavedStatus()
          } catch (e) {
            console.log("[Taptop Publisher] Использую упрощенное ожидание")
            await new Promise((r) => setTimeout(r, 5000))
          }

          totalPublished++
          console.log(`[Taptop Publisher] Опубликовано: ${totalPublished}`)

          if (elementExists(".tt-publish-modal")) {
            const closeBtn = document.querySelector(".tt-popup__close-button")
            if (closeBtn) {
              clickElement(closeBtn)
              await new Promise((r) => setTimeout(r, 1000))
            }
          }

          await new Promise((r) => setTimeout(r, 2000))
        } catch (error) {
          console.log("[Taptop Publisher] Ошибка:", error.message)

          if (elementExists(".tt-publish-modal")) {
            const closeBtn = document.querySelector(".tt-popup__close-button")
            if (closeBtn) {
              clickElement(closeBtn)
              await new Promise((r) => setTimeout(r, 1000))
            }
          }

          const remainingButtons = document.querySelectorAll(
            ".tt-publish-design-list__item button.tt-button--appearance-primary"
          )
          if (remainingButtons.length === 0) {
            console.log("[Taptop Publisher] Все страницы опубликованы!")
            alert("✅ Все страницы опубликованы!")
            break
          }
        }

        iteration++
        if (iteration > 100) {
          console.log("[Taptop Publisher] Достигнут лимит итераций")
          break
        }
      }

      console.log(`[Taptop Publisher] Завершено. Опубликовано: ${totalPublished} страниц`)
      window.taptopPublisherRunning = false
    }

    publishAllPages()
  }
})
