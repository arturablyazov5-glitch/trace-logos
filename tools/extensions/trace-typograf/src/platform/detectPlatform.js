// Определяет платформу по текущему URL — используется точечно, там, где
// движок типографики должен обойти несовместимость конкретного редактора
// (см. platform/taptopQuirks.js). Не путать с host_permissions в
// manifest.json — тот решает, ГДЕ инжектится скрипт, этот — КАК он себя
// ведёт после инжекции.
function detectPlatform() {
  if (location.pathname.includes('/-/cms/v1/mosaic/')) return 'taptop';
  if (location.hostname.endsWith('.tilda.cc')) return 'tilda';
  return 'unknown';
}
