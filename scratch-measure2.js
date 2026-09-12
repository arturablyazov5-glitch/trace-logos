const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const page = await browser.newPage();
  await page.setViewport({ width: 360, height: 800 });
  const file = 'file://' + path.resolve('tools/figma-plugins/typograf/ui.html');
  await page.goto(file);

  const data = await page.evaluate(() => {
    document.getElementById('screenEmpty').hidden = true;
    const screenTools = document.getElementById('screenTools');
    screenTools.hidden = false;

    const rules = document.getElementById('rules');
    const footer = document.querySelector('.footer');
    const tlp = document.querySelector('.tlp');
    const btn = document.getElementById('run');

    // list rule titles + positions
    const ruleEls = [...document.querySelectorAll('.rule-title')].map(el => el.textContent.trim());

    // scroll rules to bottom
    rules.scrollTop = rules.scrollHeight;

    const rulesRect = rules.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const tlpRect = tlp.getBoundingClientRect();
    const lastRule = document.querySelectorAll('.rule');
    const lastRuleRect = lastRule[lastRule.length - 1].getBoundingClientRect();

    return {
      ruleTitles: ruleEls,
      rulesScrollTop: rules.scrollTop,
      rulesScrollHeight: rules.scrollHeight,
      rulesClientHeight: rules.clientHeight,
      rulesRectBottom: rulesRect.bottom,
      lastRuleRectBottom: lastRuleRect.bottom,
      gapRulesToFooter: footerRect.top - rulesRect.bottom,
      footerRect: { top: footerRect.top, bottom: footerRect.bottom, height: footerRect.height },
      btnRect: { top: btnRect.top, bottom: btnRect.bottom },
      tlpRect: { top: tlpRect.top },
      gapBtnToTlp: tlpRect.top - btnRect.bottom,
    };
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
