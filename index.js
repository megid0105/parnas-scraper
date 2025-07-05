require('dotenv').config();
const { chromium } = require('playwright-chromium');
const fetch = require('node-fetch');

(async () => {
  try {
    const browser = await chromium.launch();
    const context = await browser.newContext({
      storageState: {
        cookies: [
          {
            name: 'sid',
            value: process.env.SUBSTACK_SID,
            domain: '.substack.com',
            path: '/',
          },
        ],
      },
    });
    const page = await context.newPage();
    await page.goto('https://aaronparnas.substack.com/');
    await page.waitForSelector('article');

    // scrape all <article> elements
    const posts = await page.$$eval('article', (els) =>
      els.map((el) => ({
        title: el.querySelector('h1')?.innerText,
        url: el.querySelector('a')?.href,
        date: el.querySelector('time')?.dateTime,
      }))
    );

    await browser.close();

    // properly iterate and POST each item
    for (const post of posts) {
      try {
        const res = await fetch(process.env.WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(post),
        });
        console.log(
          `Posted "${post.title}" → ${res.status} ${res.statusText}`
        );
      } catch (err) {
        console.error('Error posting to webhook:', err);
      }
    }
  } catch (err) {
    console.error('Scraper failed:', err);
    process.exit(1);
  }
})();
