// Выход из режима редактирования текста на Taptop — через их же API
// (setTextEditorMode(false), см. taptopApiBridge.js), плюс blur() на
// всякий случай как запасной путь, если API почему-то не сработал.
async function exitTaptopEditing(root) {
  window.getSelection().removeAllRanges();
  const res = await callTaptopApi('exit-edit');
  if (!res.ok && typeof root.blur === 'function') root.blur();
}
