#!/usr/bin/env node
/**
 * Сидер демо-иконок для визуального прототипа раздела «Иконки».
 * Пишет реальные SVG в assets/icons/svgs/<pack>/<name>.svg
 * и demo-manifest.json (превью того, что будет генерить build-icons-data.js:
 * pack → subgroup → icon + флаги strokeEditable / colorType).
 *
 * Запуск: node scripts/seed-demo-icons.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets/icons/svgs');

// Обёртка для outline-иконок (stroke на корне → слайдер толщины меняет корневой stroke-width)
const line = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
// Обёртка для filled-иконок (заливка currentColor, обводки нет → слайдер скрыт)
const solid = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">${inner}</svg>`;
// Многоцветная (явные hex → список свотчей)
const multi = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${inner}</svg>`;

const PACKS = {
  outline: {
    label: 'Outline UI',
    style: 'outline',
    strokeEditable: true,
    colorType: 'mono',
    groups: {
      'Стрелки': {
        'arrow-up':     line('<path d="M12 19V5"/><path d="M5 12l7-7 7 7"/>'),
        'arrow-right':  line('<path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>'),
        'chevron-down': line('<path d="M6 9l6 6 6-6"/>'),
        'refresh':      line('<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>'),
      },
      'Интерфейс': {
        'home':     line('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>'),
        'search':   line('<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>'),
        'settings': line('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
        'bell':     line('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>'),
      },
      'Действия': {
        'heart':    line('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'),
        'star':     line('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/>'),
        'trash':    line('<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/>'),
        'download': line('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
      },
    },
  },
  solid: {
    label: 'Solid',
    style: 'solid',
    strokeEditable: false,
    colorType: 'mono',
    groups: {
      'Интерфейс': {
        'home': solid('<path d="M12 2.1 1 12h3v9h7v-6h2v6h7v-9h3z"/>'),
        'bell': solid('<path d="M12 2a6 6 0 0 0-6 6c0 7-3 9-3 9h18s-3-2-3-9a6 6 0 0 0-6-6z"/><path d="M10.27 21a2 2 0 0 0 3.46 0z"/>'),
      },
      'Действия': {
        'heart': solid('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'),
        'star':  solid('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/>'),
      },
    },
  },
  color: {
    label: 'Цветные',
    style: 'color',
    strokeEditable: false,
    colorType: 'multi',
    groups: {
      'Файлы': {
        'folder': multi('<path d="M3 7a2 2 0 0 1 2-2h3.5l2 2H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#2563EB"/><path d="M3 10h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#60A5FA"/>'),
        'file':   multi('<path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#F59E0B"/><path d="M14 2v6h6z" fill="#FBBF24"/>'),
      },
    },
  },
};

// ── Запись файлов + сборка манифеста ──
const manifest = { packs: [] };
let count = 0;
for (const [packId, pack] of Object.entries(PACKS)) {
  const dir = path.join(OUT, packId);
  fs.mkdirSync(dir, { recursive: true });
  const packEntry = { id: packId, label: pack.label, style: pack.style, subgroups: [] };
  for (const [groupName, icons] of Object.entries(pack.groups)) {
    const items = [];
    for (const [name, svg] of Object.entries(icons)) {
      fs.writeFileSync(path.join(dir, `${name}.svg`), svg);
      items.push({
        name,
        file: `${packId}/${name}.svg`,
        strokeEditable: pack.strokeEditable,
        colorType: pack.colorType,
      });
      count++;
    }
    packEntry.subgroups.push({ name: groupName, items });
  }
  manifest.packs.push(packEntry);
}
fs.writeFileSync(path.join(OUT, '..', 'demo-manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`✓ Записано ${count} иконок в ${path.relative(ROOT, OUT)}`);
console.log(`✓ Манифест: ${path.relative(ROOT, path.join(OUT, '..', 'demo-manifest.json'))}`);
