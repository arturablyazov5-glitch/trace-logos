// Достаёт diffHunks из БОЕВОГО code.js плагина — тесты гоняют то, что уезжает.
const fs = require('fs');
const src = fs.readFileSync('/Users/rafael/Documents/trace-logos/tools/figma-plugins/typograf/code.js', 'utf8');
const block = src.slice(src.indexOf('const MYERS_MAX_D'), src.indexOf('async function applyTypography'));
const api = new Function(`${block}
  let cap = MYERS_MAX_D;
  return { diffHunks, setMaxD: (d) => { MYERS_MAX_D = d; } };`.replace('const MYERS_MAX_D', 'let MYERS_MAX_D'))();
module.exports = api.diffHunks;
module.exports.setMaxD = api.setMaxD;
