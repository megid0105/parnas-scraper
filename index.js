require('dotenv').config();
const { parseStringPromise } = require('xml2js');

(async () => {
  try {
    // 1) fetch Substack’s RSS
    const res = await fetch('https://aaronparnas.substack.com/feed');
    const xml = await res.text();

    // 2) parse it
    const { rss } = await parseStringPromise(xml, { explicitArray: false });
    const items = Array.isArray(rss.channel.item)
      ? rss.channel.item
      : [rss.channel.item];

    // 3) POST each to your n8n webhook
    for (const { title, link, pubDate } of items) {
      await fetch(process.env.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, url: link, date: pubDate }),
      });
      console.log('→ posted:', title);
    }
  } catch (err) {
    console.error('Scraper error:', err);
    process.exit(1);
  }
})();
