require('dotenv').config();
const fetch = require('node-fetch');
const xml2js = require('xml2js');

(async () => {
  try {
    // fetch the feed
    const res = await fetch('https://aaronparnas.substack.com/feed');
    const xml = await res.text();

    // parse it
    const { rss } = await xml2js.parseStringPromise(xml, { explicitArray: false });
    const items = rss.channel.item instanceof Array
      ? rss.channel.item
      : [rss.channel.item];

    // push into n8n
    for (const { title, link, pubDate } of items) {
      await fetch(process.env.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, url: link, date: pubDate }),
      });
      console.log(`→ posted: ${title}`);
    }
  } catch (err) {
    console.error('Scraper error:', err);
    process.exit(1);
  }
})();
