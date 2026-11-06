// Клик по иконке — переключатель. Сам скрипт сообщает, включён ли режим.
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    const [res] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    });
    const on = !!(res && res.result);
    chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#2f6fed' });
    chrome.action.setBadgeText({ tabId: tab.id, text: on ? 'ON' : '' });
  } catch (e) {
    // chrome://, веб-магазин и т.п. — внедрение запрещено
    chrome.action.setBadgeText({ tabId: tab.id, text: '' });
  }
});
