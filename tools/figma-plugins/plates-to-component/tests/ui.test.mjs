import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import puppeteer from 'puppeteer';

const browser=await puppeteer.launch({headless:true,executablePath:process.env.PLATES_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try {
  const page=await browser.newPage();await page.setViewport({width:360,height:850});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent(readFileSync(new URL('../ui.html',import.meta.url),'utf8'));
  const send=message=>page.evaluate(m=>window.postMessage({pluginMessage:m},'*'),message);
  await send({type:'selection',ready:false,message:'Выдели две или больше похожих плашек.'});
  await page.waitForSelector('#empty:not([hidden])');
  await send({type:'selection',ready:true});
  await page.waitForSelector('#work:not([hidden])');assert.equal(await page.$('select'),null);assert.equal(await page.$('#basis'),null);assert.equal(await page.$('#count'),null);
  await page.click('#convert');await page.waitForSelector('#spinner:not([hidden])');assert(await page.$eval('#convert',n=>n.disabled));
  assert.equal(await page.$('#preview'),null);assert.equal(await page.$('#analyze'),null);assert.equal(await page.$('#commit'),null);
  await send({type:'working'});await page.waitForSelector('#spinner:not([hidden])');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await send({type:'success'});await page.waitForSelector('#result.success:not([hidden])');
  assert.equal(await page.$eval('#resultText',n=>n.textContent),'Готово. Плашки собраны.');await send({type:'error',message:'Не удалось собрать плашки. Исходные плашки восстановлены.'});await page.waitForSelector('#error:not([hidden])');
  assert.deepEqual(errors,[]);console.log('UI: selection, one-click convert, busy, success, error, width 360 — OK (browser, synthetic messages).');
}finally {await browser.close();}
