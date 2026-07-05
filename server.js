#!/usr/bin/env node
// Простой статический сервер. Запуск: node server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css',
  '.webp': 'image/webp',
  '.png':  'image/png',
};

http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Normalize path (resolve trailing slash → index.html)
  const normPath = (pathname === '/' || pathname.endsWith('/'))
    ? pathname.replace(/\/?$/, '/index.html')
    : pathname;

  // For /en/* try the generated file first, fall back to non-en version.
  let resolved = normPath;
  if (normPath.startsWith('/en/')) {
    const enFile = path.join(ROOT, decodeURIComponent(normPath));
    if (!fs.existsSync(enFile)) {
      resolved = normPath.slice(3) || '/index.html';
    }
  }

  const file = path.join(ROOT, decodeURIComponent(resolved));
  if (!file.startsWith(ROOT + path.sep) && file !== ROOT) {
    res.writeHead(403); return res.end('Forbidden');
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      return fs.readFile(path.join(ROOT, '404.html'), (e2, page) => {
        res.writeHead(404, { 'Content-Type': mime['.html'] });
        res.end(e2 ? 'Not found' : page);
      });
    }
    const ext = path.extname(file);
    const headers = { 'Content-Type': mime[ext] || 'application/octet-stream' };
    if (ext === '.js' || ext === '.css') headers['Cache-Control'] = 'no-store';
    // Админка не должна индексироваться (и в прод она не деплоится — см. .gitignore).
    if (pathname.startsWith('/admin')) headers['X-Robots-Tag'] = 'noindex, nofollow';
    res.writeHead(200, headers);
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`Открой: http://localhost:${PORT}`);
});
