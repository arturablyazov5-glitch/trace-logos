const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });
  await page.goto('https://trace-logos.ru/logos/', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));
  const sidebar = await page.$('#sidebar');
  await sidebar.screenshot({ path: '/private/tmp/claude-501/-Users-rafael-Documents-trace-logos/50c5cb62-a508-40a4-9c94-b9b5abd94991/scratchpad/sidebar.png' });
  await page.screenshot({ path: '/private/tmp/claude-501/-Users-rafael-Documents-trace-logos/50c5cb62-a508-40a4-9c94-b9b5abd94991/scratchpad/full.png' });
  await browser.close();
})();
