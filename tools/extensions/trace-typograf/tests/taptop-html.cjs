const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
(async () => {
  const root = path.join(__dirname, '..', 'src');
  const shared = path.join(__dirname, '..', '..', '..', 'figma-plugins', '_shared', 'typograf-rules.js');
  const source = fs.readFileSync(shared, 'utf8') + '\n' + fs.readFileSync(path.join(root, 'core/rules/protectedPatterns.js'), 'utf8')
    + '\n' + ['dom/myersDiff.js', 'dom/diffToHunks.js', 'platform/applyTypografToTaptopSelection.js'].map(name => fs.readFileSync(path.join(root, name), 'utf8')).join('\n');
  const browser = await puppeteer.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  try {
    const page = await browser.newPage();
    await page.addScriptTag({ content: source });
    const results = await page.evaluate(() => {
      const cases = [
        '<p>в <strong>тексте</strong> - "пример"...</p>',
        '<p><a href="https://example.com/a?b=1&c=2" data-id="x">в ссылке</a><br>на строке</p>',
        '<p>до <code>в коде - "не менять"</code> после</p>',
        '<p><strong>"Слож</strong><em>ная цитата"</em> - 50 000 руб.</p>',
        '<p>один</p><p>два</p>',
        '<p>😀 в тексте...</p>',
      ];
      return cases.map(value => {
        const output = typografTaptopValue(value, true);
        const a = document.createElement('template'), b = document.createElement('template');
        a.innerHTML = value; b.innerHTML = output;
        const structure = root => [...root.querySelectorAll('*')].map(el => [el.tagName, [...el.attributes].map(x => [x.name, x.value])]);
        return { output, before: structure(a.content), after: structure(b.content), twice: typografTaptopValue(output, true) };
      });
    });
    for (const r of results) {
      assert.deepEqual(r.after, r.before, 'markup and attributes stay intact');
      assert.equal(r.twice, r.output, 'idempotence');
      assert.ok(!r.output.includes('&nbsp;'));
    }
    assert.ok(results[0].output.includes('в\u00a0<strong>тексте</strong>'));
    assert.ok(results[1].output.includes('в\u00a0ссылке'));
    assert.ok(results[1].output.includes('<br>'));
    assert.equal(results[5].output, '<p>😀 в\u00a0тексте…</p>');
    assert.ok(results[2].output.includes('<code>в коде - "не менять"</code>'));
    console.log('HTML: 6 cases passed (inline boundaries, attributes, links, code, paragraphs, emoji, idempotence).');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
