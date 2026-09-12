const axios = require('axios');
const cheerio = require('cheerio');

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://xhaccess.com/'
};

/**
 * Fetch page HTML safely with retries and browser headers.
 */
async function fetchHtml(url) {
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(url, {
        headers: DEFAULT_HEADERS,
        timeout: 15000,
      });
      if (response.status === 200) {
        return response.data;
      }
    } catch (err) {
      if (err.response && err.response.status === 404) return null;
      if (attempt === maxRetries) {
        console.error(`[Error] Failed to fetch ${url}: ${err.message}`);
        return null;
      }
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  return null;
}

/**
 * Filter out advertisement, popunder, and tracker links.
 */
function isAdOrTracker(url) {
  if (!url) return true;
  const adDomains = [
    'faphouse.com',
    'xhamsterlive.com',
    'horatybykyveja',
    'tsyndicate',
    'modusygunaciro',
    'trafficstars',
    'popunder',
    'adblocked',
    'doubleclick',
    'google-analytics'
  ];
  return adDomains.some(domain => url.toLowerCase().includes(domain));
}

/**
 * Parse search or category result page HTML.
 * Extracts video items (title, duration, thumbnail, detail link, stream/trailer link).
 */
function parseCatalogPage(html) {
  if (!html) return [];
  const items = [];

  // 1. Try extracting structured data from script window.initials
  try {
    const initialsMatch = html.match(/window\.initials\s*=\s*(\{.*?\});\s*<\/script>/s) || html.match(/id=['"]initials-script['"]>window\.initials\s*=\s*(\{.*?\});/s);
    if (initialsMatch && initialsMatch[1]) {
      const parsedData = JSON.parse(initialsMatch[1]);
      const videoThumbProps = parsedData?.searchResult?.videoThumbProps || parsedData?.videoThumbProps || [];

      for (const v of videoThumbProps) {
        const pageURL = v.pageURL || '';
        if (isAdOrTracker(pageURL)) continue;

        items.push({
          id: String(v.id || ''),
          title: (v.title || '').trim(),
          duration_seconds: v.duration || 0,
          duration_formatted: formatDuration(v.duration || 0),
          thumbnail_url: v.thumbURL || v.imageURL || '',
          poster_url: v.imageURL || v.thumbURL || '',
          page_url: pageURL,
          trailer_url: v.trailerURL || '',
          stream_url: v.trailerURL || v.imageURL || '', // Fallback video stream link
          views: v.views || 0,
          channel: v.landing?.name || 'Unknown'
        });
      }
    }
  } catch (err) {
    console.warn(`[Warning] JSON initials parsing fallback: ${err.message}`);
  }

  // 2. Fallback DOM Parsing via Cheerio if initials array was empty
  if (items.length === 0) {
    const $ = cheerio.load(html);

    $('a.video-thumb, article.video-card, div.thumb-list__item').each((_, el) => {
      const $el = $(el);
      const linkEl = $el.is('a') ? $el : $el.find('a[href*="/videos/"]').first();
      const pageURL = linkEl.attr('href') || '';

      if (!pageURL || isAdOrTracker(pageURL)) return;

      const title = linkEl.attr('title') || $el.find('.video-thumb__title, .title').text().trim();
      const img = $el.find('img').first();
      const thumbnail = img.attr('data-src') || img.attr('src') || '';
      const duration = $el.find('.duration, .video-thumb__duration').text().trim();

      if (title && pageURL) {
        items.push({
          id: pageURL.split('/').pop() || `id-${Date.now()}`,
          title,
          duration_seconds: 0,
          duration_formatted: duration || 'N/A',
          thumbnail_url: thumbnail,
          poster_url: thumbnail,
          page_url: pageURL.startsWith('http') ? pageURL : `https://xhaccess.com${pageURL}`,
          trailer_url: '',
          stream_url: '',
          views: 0,
          channel: 'Unknown'
        });
      }
    });
  }

  return items;
}

/**
 * Extract direct video stream link (HLS / MP4 / Embed) from video detail page.
 */
async function extractStreamDetails(pageUrl) {
  const html = await fetchHtml(pageUrl);
  if (!html) return null;

  let streamUrl = '';
  let hlsUrl = '';
  let mp4Url = '';

  // Parse window.initials for videoModel
  try {
    const initialsMatch = html.match(/window\.initials\s*=\s*(\{.*?\});\s*<\/script>/s);
    if (initialsMatch && initialsMatch[1]) {
      const parsed = JSON.parse(initialsMatch[1]);
      const videoModel = parsed?.videoModel || parsed?.video || {};
      
      // Look for HLS / MP4 sources inside videoModel or playerConfig
      if (videoModel.sources) {
        if (videoModel.sources.hls) hlsUrl = videoModel.sources.hls;
        if (videoModel.sources.mp4) {
          const qualities = Object.keys(videoModel.sources.mp4);
          if (qualities.length > 0) {
            mp4Url = videoModel.sources.mp4[qualities[qualities.length - 1]];
          }
        }
      }
    }
  } catch (_) {}

  // Fallback regex matching for .m3u8 or video source tags in HTML
  if (!hlsUrl && !mp4Url) {
    const m3u8Match = html.match(/(https?:\\?\/\\?\/[^"' ]+\.m3u8[^"' ]*)/i);
    if (m3u8Match) {
      hlsUrl = m3u8Match[1].replace(/\\/g, '');
    }

    const mp4Match = html.match(/(https?:\\?\/\\?\/[^"' ]+\.mp4[^"' ]*)/i);
    if (mp4Match && !isAdOrTracker(mp4Match[1])) {
      mp4Url = mp4Match[1].replace(/\\/g, '');
    }
  }

  streamUrl = hlsUrl || mp4Url || '';

  return {
    stream_url: streamUrl,
    hls_manifest: hlsUrl,
    direct_mp4: mp4Url
  };
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

module.exports = {
  fetchHtml,
  parseCatalogPage,
  extractStreamDetails,
  isAdOrTracker
};
