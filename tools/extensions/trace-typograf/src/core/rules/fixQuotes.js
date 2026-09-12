// "…"/"“…”" → «ёлочки», чередуя открывающую/закрывающую при парных ".
function fixQuotes(text) {
  let out = text.replace(/[“”]/g, (m) => (m === '“' ? '«' : '»'));
  let open = true;
  out = out.replace(/"/g, () => {
    const ch = open ? '«' : '»';
    open = !open;
    return ch;
  });
  return out;
}
