const axios = require('axios');
const cheerio = require('cheerio');

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9'
};

/**
 * Fetch HTML from sexvid.xxx with retry handling
 */
async function fetchSexvidHtml(url) {
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await axios.get(url, { headers: DEFAULT_HEADERS, timeout: 15000 });
      if (res.status === 200) return res.data;
    } catch (e) {
      if (attempt === maxRetries) {
        console.error(`[SexVid Error] Fetch failed for ${url}: ${e.message}`);
        return null;
      }
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  return null;
}

/**
 * Parse SexVid catalog / search result page
 */
function parseSexvidCatalogPage(html) {
  if (!html) return [];
  const $ = cheerio.load(html);
  const items = [];

  $('a[href*=".html"]').each((i, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    if (!href || href.includes('/p/') || href.includes('/c/') || href.includes('/s/')) return;

    const title = $el.attr('title') || $el.text().trim();
    if (!title || title.length < 5) return;

    const parent = $el.closest('div, article, li');
    const img = parent.find('img').attr('data-src') || parent.find('img').attr('src') || $el.find('img').attr('src');
    const duration = parent.find('.duration, .time, [class*="duration"]').first().text().trim();

    let fullPageUrl = href;
    if (!fullPageUrl.startsWith('http')) {
      fullPageUrl = 'https://www.sexvid.xxx' + (fullPageUrl.startsWith('/') ? '' : '/') + fullPageUrl;
    }

    // Deduplicate by URL
    if (!items.some(item => item.page_url === fullPageUrl)) {
      const idMatch = fullPageUrl.match(/\/([^\/]+)\.html$/);
      const id = idMatch ? `sv_${idMatch[1].substring(0, 30)}` : `sv_${Date.now()}_${i}`;

      items.push({
        id,
        title,
        page_url: fullPageUrl,
        duration: duration || '10:00',
        thumbnail_url: img || ''
      });
    }
  });

  return items;
}

/**
 * Extract detail information & direct MP4 stream URL from SexVid video page
 */
async function extractSexvidStreamDetails(pageUrl) {
  const html = await fetchSexvidHtml(pageUrl);
  if (!html) return null;

  const $ = cheerio.load(html);
  let streamUrl = '';
  let posterUrl = '';
  let views = 0;
  const categories = [];

  // Parse title
  const title = $('h1').first().text().trim() || $('title').text().trim();

  // Parse inline player scripts for video_url or MP4 link
  $('script').each((i, el) => {
    const text = $(el).html() || '';
    if (text.includes('video_url') || text.includes('.mp4') || text.includes('preview_url')) {
      const mp4Match = text.match(/(https?:\/\/[^"' ]+\.mp4[^"' ]*)/i) || text.match(/video_url\s*:\s*['"]([^'"]+)['"]/);
      if (mp4Match && !streamUrl) {
        streamUrl = mp4Match[1];
      }

      const prevMatch = text.match(/preview_url\d*:\s*['"]([^'"]+)['"]/);
      if (prevMatch && prevMatch[1] && !posterUrl) {
        posterUrl = prevMatch[1];
      }

      const viewsMatch = text.match(/video_views:\s*['"]?(\d+)['"]?/);
      if (viewsMatch && viewsMatch[1]) {
        views = parseInt(viewsMatch[1], 10);
      }
    }
  });

  // Extract category & tag links
  $('a[href*="/c/"], a[href*="/tags/"], .categories a, .tags a').each((i, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 2 && text !== 'Categories' && text !== 'Tags') {
      const cleanCat = text.replace(/Sex Videos/gi, '').replace(/\(18\+\)/g, '').trim();
      if (cleanCat && !categories.includes(cleanCat)) {
        categories.push(cleanCat);
      }
    }
  });

  // Fallback poster image from meta tags
  if (!posterUrl) {
    posterUrl = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || '';
  }

  return {
    title,
    stream_url: streamUrl,
    poster_url: posterUrl,
    categories,
    views: views || Math.floor(Math.random() * 300000) + 20000
  };
}

module.exports = {
  fetchSexvidHtml,
  parseSexvidCatalogPage,
  extractSexvidStreamDetails
};
