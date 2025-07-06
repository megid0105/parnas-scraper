require('dotenv').config();
const { parseStringPromise } = require('xml2js');

(async () => {
  try {
    // 1) fetch Substack’s RSS
    const res = await fetch('https://aaronparnas.substack.com/feed');
    const xml = await res.text();

    // 2) parse it
    const { rss } = await parseStringPromise(xml, { explicitArray: false });
    const rawItems = Array.isArray(rss.channel.item)
      ? rss.channel.item
      : [rss.channel.item];

    // 3) transform into the shape n8n expects
    const posts = rawItems.map(item => ({
      title: item.title,
      url:   item.link,
      date:  item.pubDate,
    }));

    // 4) POST the entire array in one request
    const webhookRes = await fetch(process.env.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(posts),
    });

    if (!webhookRes.ok) {
      throw new Error(`Webhook responded ${webhookRes.status}`);
    }

    console.log(`→ posted ${posts.length} items in one batch`);
  } catch (err) {
    console.error('Scraper error:', err);
    process.exit(1);
  }
})();
