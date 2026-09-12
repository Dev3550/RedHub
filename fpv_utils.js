const axios = require('axios');
const cheerio = require('cheerio');

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9'
};

async function fetchFpvHtml(url) {
  try {
    const res = await axios.get(url, { headers: DEFAULT_HEADERS, timeout: 12000 });
    return res.data;
  } catch (e) {
    console.error(`Fetch error for ${url}: ${e.message}`);
    return null;
  }
}

function parseFpvCatalogPage(html) {
  if (!html) return [];
  const $ = cheerio.load(html);
  const items = [];

  $('.list-videos .item, .item-video').each((i, el) => {
    const titleEl = $(el).find('a.title, .title, a[title]').first();
    const title = titleEl.attr('title') || titleEl.text().trim();
    const href = titleEl.attr('href') || $(el).find('a').first().attr('href');
    const duration = $(el).find('.duration, .time').text().trim();
    const viewsStr = $(el).find('.views').text().trim();
    const viewsNum = parseInt(viewsStr.replace(/\D/g, ''), 10) || 0;
    const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-original');

    let fullPageUrl = href;
    if (fullPageUrl && !fullPageUrl.startsWith('http')) {
      if (fullPageUrl.includes('out.php?l=thumb&u=')) {
        const match = fullPageUrl.match(/u=(https?:[^\&]+)/);
        if (match) fullPageUrl = decodeURIComponent(match[1]);
      } else {
        fullPageUrl = 'https://www.freepornvideo.sex' + fullPageUrl;
      }
    }

    if (fullPageUrl && fullPageUrl.includes('?')) {
      fullPageUrl = fullPageUrl.split('?')[0];
    }

    // Extract ID from URL
    let id = '';
    if (fullPageUrl) {
      const match = fullPageUrl.match(/\/xxx\/(\d+)\//);
      if (match) id = match[1];
    }

    if (fullPageUrl && title) {
      items.push({
        id: id || `fpv_${i}`,
        title,
        page_url: fullPageUrl,
        duration,
        views: viewsNum,
        thumbnail_url: img
      });
    }
  });

  return items;
}

async function extractFpvStreamDetails(pageUrl) {
  const html = await fetchFpvHtml(pageUrl);
  if (!html) return null;

  const $ = cheerio.load(html);
  let streamUrl = '';
  let embedUrl = '';
  let posterUrl = '';
  let categories = [];
  let title = $('h1').first().text().trim();
  let duration = '';
  let views = 0;

  // 1. Parse JSON-LD schema
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const json = JSON.parse($(el).html());
      if (json && json['@type'] === 'VideoObject') {
        if (json.contentUrl) streamUrl = json.contentUrl;
        if (json.embedUrl) embedUrl = json.embedUrl;
        if (json.thumbnailUrl) posterUrl = json.thumbnailUrl;
        if (json.name) title = json.name;
        if (json.interactionStatistic) {
          json.interactionStatistic.forEach(stat => {
            if (stat.userInteractionCount) views = stat.userInteractionCount;
          });
        }
      }
    } catch (_) {}
  });

  // 2. Parse inline data JS object (e.g. data_36016)
  $('script').each((i, el) => {
    const text = $(el).html();
    if (text && text.includes('video_url:')) {
      const vMatch = text.match(/video_url:\s*['"]([^'"]+)['"]/);
      if (vMatch && !streamUrl) streamUrl = vMatch[1];

      const catMatch = text.match(/video_categories:\s*['"]([^'"]+)['"]/);
      if (catMatch && catMatch[1]) {
        categories = catMatch[1].split(',').map(c => c.trim()).filter(Boolean);
      }

      const prevMatch = text.match(/preview_url:\s*['"]([^'"]+)['"]/);
      if (prevMatch && prevMatch[1] && !posterUrl) posterUrl = prevMatch[1];
    }
  });

  // Fallback embed URL
  if (!embedUrl && pageUrl) {
    const idMatch = pageUrl.match(/\/xxx\/(\d+)\//);
    if (idMatch) {
      embedUrl = `https://www.freepornvideo.sex/embed/${idMatch[1]}`;
    }
  }

  return {
    title,
    stream_url: streamUrl || embedUrl,
    embed_url: embedUrl,
    poster_url: posterUrl,
    categories,
    views
  };
}

module.exports = {
  fetchFpvHtml,
  parseFpvCatalogPage,
  extractFpvStreamDetails
};

// Quick self-test if executed directly
if (require.main === module) {
  (async () => {
    console.log('Testing catalog extraction...');
    const catHtml = await fetchFpvHtml('https://www.freepornvideo.sex/');
    const items = parseFpvCatalogPage(catHtml);
    console.log(`Extracted ${items.length} items from homepage.`);
    console.log('Sample item:', items[0]);

    if (items.length > 0) {
      console.log('\nTesting stream details extraction for first item:', items[0].page_url);
      const details = await extractFpvStreamDetails(items[0].page_url);
      console.log('Extracted Details:', JSON.stringify(details, null, 2));
    }
  })();
}
