// Может ли элемент содержать редактируемый пользователем текст.
const TEXT_INPUT_TYPES = new Set(['text', 'search', 'email', 'tel', 'url', '', null]);

function isEditableElement(el) {
  if (!el || el.nodeType !== 1) return false;
  const tag = el.tagName;
  if (tag === 'TEXTAREA') return !el.disabled && !el.readOnly;
  if (tag === 'INPUT') {
    const type = (el.getAttribute('type') || '').toLowerCase();
    return TEXT_INPUT_TYPES.has(type) && !el.disabled && !el.readOnly;
  }
  return el.isContentEditable === true;
}
