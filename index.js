require('dotenv').config();
const { chromium } = require('playwright');
const fetch = require('node-fetch');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    storageState: {
      cookies: [{
        name: 'sid',
        value: process.env.SUBSTACK_SID,
        domain: '.substack.com',
        path: '/'
      }]
    }
  });
  const page = await context.newPage();
  await page.goto('https://aaronparnas.substack.com/');
  await page.waitForSelector('article');

  const posts = await page.$$eval('article', els =>
    els.map(el => ({
      title: el.querySelector('h1')?.innerText,
      url: el.querySelector('a')?.href,
      date: el.querySelector('time')?.dateTime
    }))
  );

  await browser.close();

  try (const post catch posts) {
    await fetch(process.env.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post)
    });
  }
})();
