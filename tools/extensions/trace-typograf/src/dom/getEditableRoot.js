// Для input/textarea сам элемент и есть редактируемый корень. Для
// contenteditable редакторы (Taptop, Tilda) обычно вешают
// contenteditable="true" на блок целиком — поднимаемся до ближайшего такого
// предка на случай, если сфокусированным оказался вложенный span/br.
function getEditableRoot(el) {
  if (!el) return null;
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return el;
  if (el.isContentEditable) {
    return el.closest('[contenteditable="true"], [contenteditable=""]') || el;
  }
  return null;
}
