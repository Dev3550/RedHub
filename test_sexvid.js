const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9'
};

async function getSexvidCategories() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`Fetching https://www.sexvid.xxx/c/ (Attempt ${attempt})...`);
      const res = await axios.get('https://www.sexvid.xxx/c/', { headers: HEADERS, timeout: 15000 });
      const $ = cheerio.load(res.data);

      const categories = [];
      $('a[href*="/c/"]').each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).attr('title') || $(el).text().trim();
        const match = href.match(/\/c\/([^\/]+)\//);
        if (match && text && match[1] !== 'c') {
          const slug = match[1];
          if (!categories.some(c => c.slug === slug)) {
            let fullUrl = href.startsWith('http') ? href : 'https://www.sexvid.xxx' + href;
            categories.push({ name: text, slug, url: fullUrl });
          }
        }
      });

      console.log(`Found ${categories.length} unique categories on sexvid.xxx:`);
      console.log(JSON.stringify(categories, null, 2));
      return;

    } catch (e) {
      console.error(`Attempt ${attempt} error:`, e.message);
      await new Promise(r => setTimeout(r, 1500));
    }
  }
}

getSexvidCategories();
