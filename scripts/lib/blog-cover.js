#!/usr/bin/env node
/**
 * Per-post cover visuals for the blog: a deterministic gradient + a Lucide icon,
 * shared by build-blog.js for both the index card covers and the article hero banner.
 *
 * Icon paths are copied verbatim from lucide-icons/lucide (ISC licensed), matching
 * the stroke style already used for callout icons in build-blog.js.
 */

// slug -> Lucide icon name (one distinct icon per post, picked by topic)
const SLUG_ICON = {
  "animirovannyj-logotip": "sparkles",
  "chem-otkryt-svg-fajl": "folder-open",
  "chto-takoe-brendbuk": "book-open",
  "chto-takoe-emodzi-i-otkuda-oni": "smile",
  "emodzi-v-marketinge": "megaphone",
  "firmennye-cveta-izvestnyh-brendov": "palette",
  "ikonka-prilozheniya": "smartphone",
  "istoriya-logotipa-apple": "history",
  "istoriya-logotipa-sbera": "landmark",
  "istoriya-logotipa-yandeksa": "search",
  "kak-konvertirovat-svg-v-png": "refresh-cw",
  "kak-optimizirovat-svg": "gauge",
  "kak-perevesti-logotip-v-vektor": "spline",
  "kak-sdelat-favicon": "globe",
  "kak-sdelat-logotip-samomu": "pen-tool",
  "kak-skachat-logotip-s-sajta": "download",
  "kak-uznat-cvet-logotipa": "pipette",
  "kak-vstavit-emodzi-s-klaviatury": "keyboard",
  "kak-vstavit-logotip-v-figma": "frame",
  "kak-vstavit-svg-na-sajt": "code",
  "kak-zaregistrirovat-logotip": "shield-check",
  "kaomodzi-i-tekstovye-smajliki": "smile-plus",
  "logotip-dlya-telegram-kanala": "send",
  "logotip-nejrosetyu": "bot",
  "logotip-s-prozrachnym-fonom": "layers",
  "logotipy-so-skrytym-smyslom": "eye",
  "mozhno-li-ispolzovat-chuzhoy-logotip": "scale",
  "png-ili-jpg-chto-luchshe": "images",
  "pochemu-brendy-uproshchayut-logotipy": "minimize-2",
  "pochemu-emodzi-otobrazhayutsya-po-raznomu": "monitor-smartphone",
  "pochemu-logotip-razmytyj": "scan",
  "pochemu-ne-otobrazhayutsya-emodzi": "circle-question-mark",
  "psihologiya-cveta-v-logotipe": "droplet",
  "razmery-logotipa-dlya-sajta-i-socsetej": "ruler",
  "samye-dorogie-logotipy": "gem",
  "shrift-dlya-logotipa": "type",
  "simvoly-i-emodzi-dlya-nika": "at-sign",
  "skolko-stoit-logotip": "wallet",
  "svg-ili-png-dlya-logotipa": "file-image",
  "v-kakom-formate-nuzhen-logotip": "file-type",
  "vektor-i-rastr-raznica": "grid-3x3",
  "vodyanoj-znak-na-foto": "droplets",
  "znachenie-populyarnyh-emodzi": "message-circle",
  "kak-izmenit-cvet-logotipa": "paintbrush",
};

// icon name -> inner SVG markup (viewBox 0 0 24 24)
const ICONS = {
  "sparkles": "<path d=\"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z\" /><path d=\"M20 2v4\" /><path d=\"M22 4h-4\" /><circle cx=\"4\" cy=\"20\" r=\"2\" />",
  "folder-open": "<path d=\"m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2\" />",
  "book-open": "<path d=\"M12 7v14\" /><path d=\"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z\" />",
  "smile": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><path d=\"M8 14s1.5 2 4 2 4-2 4-2\" /><line x1=\"9\" x2=\"9.01\" y1=\"9\" y2=\"9\" /><line x1=\"15\" x2=\"15.01\" y1=\"9\" y2=\"9\" />",
  "megaphone": "<path d=\"M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z\" /><path d=\"M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14\" /><path d=\"M8 6v8\" />",
  "palette": "<path d=\"M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z\" /><circle cx=\"13.5\" cy=\"6.5\" r=\".5\" fill=\"currentColor\" /><circle cx=\"17.5\" cy=\"10.5\" r=\".5\" fill=\"currentColor\" /><circle cx=\"6.5\" cy=\"12.5\" r=\".5\" fill=\"currentColor\" /><circle cx=\"8.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\" />",
  "smartphone": "<rect width=\"14\" height=\"20\" x=\"5\" y=\"2\" rx=\"2\" ry=\"2\" /><path d=\"M12 18h.01\" />",
  "history": "<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\" /><path d=\"M3 3v5h5\" /><path d=\"M12 7v5l4 2\" />",
  "landmark": "<path d=\"M10 18v-7\" /><path d=\"M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z\" /><path d=\"M14 18v-7\" /><path d=\"M18 18v-7\" /><path d=\"M3 22h18\" /><path d=\"M6 18v-7\" />",
  "search": "<path d=\"m21 21-4.34-4.34\" /><circle cx=\"11\" cy=\"11\" r=\"8\" />",
  "refresh-cw": "<path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\" /><path d=\"M21 3v5h-5\" /><path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\" /><path d=\"M8 16H3v5\" />",
  "gauge": "<path d=\"m12 14 4-4\" /><path d=\"M3.34 19a10 10 0 1 1 17.32 0\" />",
  "spline": "<circle cx=\"19\" cy=\"5\" r=\"2\" /><circle cx=\"5\" cy=\"19\" r=\"2\" /><path d=\"M5 17A12 12 0 0 1 17 5\" />",
  "globe": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><path d=\"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20\" /><path d=\"M2 12h20\" />",
  "pen-tool": "<path d=\"M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z\" /><path d=\"m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18\" /><path d=\"m2.3 2.3 7.286 7.286\" /><circle cx=\"11\" cy=\"11\" r=\"2\" />",
  "download": "<path d=\"M12 15V3\" /><path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" /><path d=\"m7 10 5 5 5-5\" />",
  "pipette": "<path d=\"m12 9-8.414 8.414A2 2 0 0 0 3 18.828v1.344a2 2 0 0 1-.586 1.414A2 2 0 0 1 3.828 21h1.344a2 2 0 0 0 1.414-.586L15 12\" /><path d=\"m18 9 .4.4a1 1 0 1 1-3 3l-3.8-3.8a1 1 0 1 1 3-3l.4.4 3.4-3.4a1 1 0 1 1 3 3z\" /><path d=\"m2 22 .414-.414\" />",
  "keyboard": "<path d=\"M10 8h.01\" /><path d=\"M12 12h.01\" /><path d=\"M14 8h.01\" /><path d=\"M16 12h.01\" /><path d=\"M18 8h.01\" /><path d=\"M6 8h.01\" /><path d=\"M7 16h10\" /><path d=\"M8 12h.01\" /><rect width=\"20\" height=\"16\" x=\"2\" y=\"4\" rx=\"2\" />",
  "frame": "<line x1=\"22\" x2=\"2\" y1=\"6\" y2=\"6\" /><line x1=\"22\" x2=\"2\" y1=\"18\" y2=\"18\" /><line x1=\"6\" x2=\"6\" y1=\"2\" y2=\"22\" /><line x1=\"18\" x2=\"18\" y1=\"2\" y2=\"22\" />",
  "code": "<path d=\"m16 18 6-6-6-6\" /><path d=\"m8 6-6 6 6 6\" />",
  "shield-check": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\" /><path d=\"m9 12 2 2 4-4\" />",
  "smile-plus": "<path d=\"M22 11v1a10 10 0 1 1-9-10\" /><path d=\"M8 14s1.5 2 4 2 4-2 4-2\" /><line x1=\"9\" x2=\"9.01\" y1=\"9\" y2=\"9\" /><line x1=\"15\" x2=\"15.01\" y1=\"9\" y2=\"9\" /><path d=\"M16 5h6\" /><path d=\"M19 2v6\" />",
  "send": "<path d=\"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z\" /><path d=\"m21.854 2.147-10.94 10.939\" />",
  "bot": "<path d=\"M12 8V4H8\" /><rect width=\"16\" height=\"12\" x=\"4\" y=\"8\" rx=\"2\" /><path d=\"M2 14h2\" /><path d=\"M20 14h2\" /><path d=\"M15 13v2\" /><path d=\"M9 13v2\" />",
  "layers": "<path d=\"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z\" /><path d=\"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12\" /><path d=\"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17\" />",
  "eye": "<path d=\"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0\" /><circle cx=\"12\" cy=\"12\" r=\"3\" />",
  "scale": "<path d=\"M12 3v18\" /><path d=\"m19 8 3 8a5 5 0 0 1-6 0zV7\" /><path d=\"M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1\" /><path d=\"m5 8 3 8a5 5 0 0 1-6 0zV7\" /><path d=\"M7 21h10\" />",
  "images": "<path d=\"m22 11-1.296-1.296a2.4 2.4 0 0 0-3.408 0L11 16\" /><path d=\"M4 8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2\" /><circle cx=\"13\" cy=\"7\" r=\"1\" fill=\"currentColor\" /><rect x=\"8\" y=\"2\" width=\"14\" height=\"14\" rx=\"2\" />",
  "minimize-2": "<path d=\"m14 10 7-7\" /><path d=\"M20 10h-6V4\" /><path d=\"m3 21 7-7\" /><path d=\"M4 14h6v6\" />",
  "monitor-smartphone": "<path d=\"M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8\" /><path d=\"M10 19v-3.96 3.15\" /><path d=\"M7 19h5\" /><rect width=\"6\" height=\"10\" x=\"16\" y=\"12\" rx=\"2\" />",
  "scan": "<path d=\"M3 7V5a2 2 0 0 1 2-2h2\" /><path d=\"M17 3h2a2 2 0 0 1 2 2v2\" /><path d=\"M21 17v2a2 2 0 0 1-2 2h-2\" /><path d=\"M7 21H5a2 2 0 0 1-2-2v-2\" />",
  "circle-question-mark": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><path d=\"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3\" /><path d=\"M12 17h.01\" />",
  "droplet": "<path d=\"M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z\" />",
  "ruler": "<path d=\"M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z\" /><path d=\"m14.5 12.5 2-2\" /><path d=\"m11.5 9.5 2-2\" /><path d=\"m8.5 6.5 2-2\" /><path d=\"m17.5 15.5 2-2\" />",
  "gem": "<path d=\"M10.5 3 8 9l4 13 4-13-2.5-6\" /><path d=\"M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z\" /><path d=\"M2 9h20\" />",
  "type": "<path d=\"M12 4v16\" /><path d=\"M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2\" /><path d=\"M9 20h6\" />",
  "at-sign": "<circle cx=\"12\" cy=\"12\" r=\"4\" /><path d=\"M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8\" />",
  "wallet": "<path d=\"M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1\" /><path d=\"M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4\" />",
  "file-image": "<path d=\"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z\" /><path d=\"M14 2v5a1 1 0 0 0 1 1h5\" /><circle cx=\"10\" cy=\"12\" r=\"2\" /><path d=\"m20 17-1.296-1.296a2.41 2.41 0 0 0-3.408 0L9 22\" />",
  "file-type": "<path d=\"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z\" /><path d=\"M14 2v5a1 1 0 0 0 1 1h5\" /><path d=\"M11 18h2\" /><path d=\"M12 12v6\" /><path d=\"M9 13v-.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5v.5\" />",
  "grid-3x3": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" /><path d=\"M3 9h18\" /><path d=\"M3 15h18\" /><path d=\"M9 3v18\" /><path d=\"M15 3v18\" />",
  "droplets": "<path d=\"M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z\" /><path d=\"M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97\" />",
  "message-circle": "<path d=\"M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719\" />",
  "paintbrush": "<path d=\"m14.622 17.897-10.68-2.913\" /><path d=\"M18.376 2.622a1 1 0 1 1 3.002 3.002L17.36 9.643a.5.5 0 0 0 0 .707l.944.944a2.41 2.41 0 0 1 0 3.408l-.944.944a.5.5 0 0 1-.707 0L8.354 7.348a.5.5 0 0 1 0-.707l.944-.944a2.41 2.41 0 0 1 3.408 0l.944.944a.5.5 0 0 0 .707 0z\" /><path d=\"M9 8c-1.804 2.71-3.97 3.46-6.583 3.948a.507.507 0 0 0-.302.819l7.32 8.883a1 1 0 0 0 1.185.204C12.735 20.405 16 16.792 16 15\" />",
};

function iconSvg(name, size, cls) {
  const inner = ICONS[name] || ICONS.sparkles;
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

// Deterministic, well-spread gradient per post index -- golden-angle hue rotation
// (137.508 deg) keeps consecutive posts visually distinct without any two hues
// clustering, even across 40+ posts. No Math.random: output must stay stable
// across rebuilds so unrelated diffs do not touch every post HTML.
function coverGradient(index) {
  const hue1 = Math.round((index * 137.508) % 360);
  const hue2 = Math.round((hue1 + 42) % 360);
  return `background: linear-gradient(135deg, hsl(${hue1} 72% 58%) 0%, hsl(${hue2} 68% 42%) 100%);`;
}

function pickIcon(slug) {
  return SLUG_ICON[slug] || "sparkles";
}

module.exports = { iconSvg, coverGradient, pickIcon };
