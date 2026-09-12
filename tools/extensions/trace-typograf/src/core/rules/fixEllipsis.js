// Три точки и больше → символ многоточия «…».
function fixEllipsis(text) {
  return text.replace(/\.{3,}/g, ELLIPSIS);
}
