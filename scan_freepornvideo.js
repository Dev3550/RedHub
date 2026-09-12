const axios = require('axios');
const cheerio = require('cheerio');

async function getCategories() {
  try {
    const catRes = await axios.get('https://www.freepornvideo.sex/categories/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 15000
    });
    const $cat = cheerio.load(catRes.data);
    const categories = [];
    
    // Check all divs or list items on categories page
    $cat('a[href*="/categories/"]').each((i, el) => {
      const href = $cat(el).attr('href');
      const text = $cat(el).text().trim();
      const parentText = $cat(el).parent().text().trim();
      if (href && href !== 'https://www.freepornvideo.sex/categories/' && href !== '/categories/') {
        categories.push({ text, href, parentText });
      }
    });

    console.log('Categories Links Count:', categories.length);
    const uniqueCats = {};
    categories.forEach(c => {
      const match = c.href.match(/\/categories\/([^\/]+)\//);
      if (match) {
        const slug = match[1];
        if (!uniqueCats[slug]) {
          uniqueCats[slug] = c;
        }
      }
    });
    console.log('Unique categories slugs:', Object.keys(uniqueCats).length);
    console.log('Category slugs list:', Object.keys(uniqueCats).join(', '));

  } catch(e) {
    console.error(e);
  }
}
getCategories();
