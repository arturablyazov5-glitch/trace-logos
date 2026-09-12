// Background script для управления состоянием публикации

let activeTabId = null
let isPublishing = false

// Отслеживаем изменения вкладок
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId) {
    activeTabId = null
    isPublishing = false
  }
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.status === "loading") {
    // Если активная вкладка обновляется, сбрасываем состояние
    isPublishing = false
  }
})

// Функция для проверки статуса публикации
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getPublishingStatus") {
    sendResponse({ isPublishing, activeTabId })
  }

  if (message.type === "startPublishing") {
    activeTabId = sender.tab.id
    isPublishing = true
    sendResponse({ success: true })
  }

  if (message.type === "stopPublishing") {
    isPublishing = false
    activeTabId = null
    sendResponse({ success: true })
  }
})
