const axios = require('axios');
const cheerio = require('cheerio');

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cookie': '_sv=1'
};

/**
 * Fetch page HTML safely with retries and browser headers.
 */
async function fetchHtml(url) {
  const maxRetries = 3;
  let referer = 'https://xhaccess.com/';
  if (url.includes('inxxx.com')) referer = 'https://www.inxxx.com/';
  else if (url.includes('pornhat.com')) referer = 'https://www.pornhat.com/';
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(url, {
        headers: { ...DEFAULT_HEADERS, Referer: referer },
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
    'google-analytics',
    'whitetrafsa.com'
  ];
  return adDomains.some(domain => url.toLowerCase().includes(domain));
}

/**
 * Parse search or category result page HTML for xhaccess.com
 */
function parseCatalogPage(html) {
  if (!html) return [];
  const items = [];

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
          title: (v.title || '').replace(/(xHamster|xHamsters|xNXX|Pornhub|XVideos|FreePornVideo|HotTube|inxxx|pornhat)/gi, 'ExoticHub').trim(),
          duration_seconds: v.duration || 0,
          duration_formatted: formatDuration(v.duration || 0),
          thumbnail_url: v.thumbURL || v.imageURL || '',
          poster_url: v.imageURL || v.thumbURL || '',
          page_url: pageURL,
          trailer_url: v.trailerURL || '',
          stream_url: v.trailerURL || v.imageURL || '',
          views: v.views || 0,
          channel: v.landing?.name || 'ExoticHub Original'
        });
      }
    }
  } catch (err) {
    console.warn(`[Warning] JSON initials parsing fallback: ${err.message}`);
  }

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
          title: title.replace(/(xHamster|xHamsters|xNXX|Pornhub|XVideos|FreePornVideo|HotTube|inxxx|pornhat)/gi, 'ExoticHub').trim(),
          duration_seconds: 0,
          duration_formatted: duration || '10:00',
          thumbnail_url: thumbnail,
          poster_url: thumbnail,
          page_url: pageURL.startsWith('http') ? pageURL : `https://xhaccess.com${pageURL}`,
          trailer_url: '',
          stream_url: '',
          views: 0,
          channel: 'ExoticHub Original'
        });
      }
    });
  }

  return items;
}

/**
 * Parse category search result page HTML for inxxx.com
 */
function parseInxxxCatalogPage(html) {
  if (!html) return [];
  const items = [];
  const $ = cheerio.load(html);

  $('a[href*="/v/"]').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href') || '';
    if (!href || isAdOrTracker(href)) return;

    const title = $el.attr('title') || $el.text().trim();
    const img = $el.find('img').first();
    const thumbnail = img.attr('data-src') || img.attr('src') || '';
    const duration = $el.find('.duration, .time, .duration-badge').text().trim() || '10:00';

    const pageUrl = href.startsWith('http') ? href : `https://www.inxxx.com${href}`;
    const cleanId = pageUrl.split('/').pop().replace('.xxx-video', '') || `inxxx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const cleanTitle = title.replace(/(xHamster|xHamsters|xNXX|Pornhub|XVideos|FreePornVideo|HotTube|inxxx|pornhat|xxx|video)/gi, 'ExoticHub').trim() || 'ExoticHub Video';

    if (!items.some(i => i.page_url === pageUrl)) {
      items.push({
        id: cleanId,
        title: cleanTitle,
        duration_seconds: 600,
        duration_formatted: duration,
        thumbnail_url: thumbnail,
        poster_url: thumbnail,
        page_url: pageUrl,
        stream_url: '',
        views: Math.floor(Math.random() * 400000) + 20000,
        channel: 'ExoticHub Original'
      });
    }
  });

  return items;
}

/**
 * Parse category page HTML for pornhat.com
 */
function parsePornhatCatalogPage(html) {
  if (!html) return [];
  const items = [];
  const $ = cheerio.load(html);

  $('a[href*="/video/"]').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href') || '';
    if (!href || href === '/video/' || isAdOrTracker(href)) return;

    const pageUrl = href.startsWith('http') ? href : `https://www.pornhat.com${href}`;
    const slug = href.replace(/^\/video\//, '').replace(/\/$/, '');
    if (!slug) return;

    const title = $el.attr('title') || $el.find('.video-title, .title').text().trim() || slug.replace(/-/g, ' ');
    const img = $el.find('img').first();
    const thumbnail = img.attr('data-src') || img.attr('src') || '';
    const duration = $el.find('.duration, .time, .duration-badge').text().trim() || '10:00';

    const cleanTitle = title.replace(/(xHamster|xHamsters|xNXX|Pornhub|XVideos|FreePornVideo|HotTube|inxxx|pornhat|xxx|video)/gi, 'ExoticHub').trim() || 'ExoticHub Video';

    if (!items.some(i => i.page_url === pageUrl)) {
      items.push({
        id: slug,
        title: cleanTitle.startsWith('ExoticHub') ? cleanTitle : `Porn ExoticHub ${cleanTitle}`,
        duration_seconds: 600,
        duration_formatted: duration,
        thumbnail_url: thumbnail,
        poster_url: thumbnail,
        page_url: pageUrl,
        stream_url: '',
        views: Math.floor(Math.random() * 450000) + 30000,
        channel: 'ExoticHub Original'
      });
    }
  });

  return items;
}

/**
 * Extract direct video stream link (HLS / MP4) from xhaccess.com, inxxx.com, or pornhat.com detail page.
 */
async function extractStreamDetails(pageUrl) {
  const html = await fetchHtml(pageUrl);
  if (!html) return null;

  let streamUrl = '';
  let hlsUrl = '';
  let mp4Url = '';

  if (pageUrl.includes('pornhat.com')) {
    // Extract stream MP4 URL from pornhat.com page (get_file/...)
    const getFileMatches = html.match(/(https?:\/\/[^"'\s]+\/get_file\/[^"'\s]*)/gi) || [];
    const validMatches = getFileMatches.filter(u => !u.includes('trailer') && !u.includes('thumb'));
    if (validMatches.length > 0) {
      mp4Url = validMatches[0].replace(/\\/g, '').replace(/&amp;/g, '&');
    }
  } else if (pageUrl.includes('inxxx.com')) {
    // Extract stream MP4 URL from inxxx.com page (get_file/.../?v-acctoken=...)
    const getFileMatch = html.match(/(https?:\/\/[^"'\s]+\/get_file\/[^\s"']+)/i);
    if (getFileMatch) {
      mp4Url = getFileMatch[1].replace(/&amp;/g, '&');
    }
  } else {
    // Parse xhaccess.com initials script
    try {
      const initialsMatch = html.match(/window\.initials\s*=\s*(\{.*?\});\s*<\/script>/s);
      if (initialsMatch && initialsMatch[1]) {
        const parsed = JSON.parse(initialsMatch[1]);
        const videoModel = parsed?.videoModel || parsed?.video || {};
        
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
  parseInxxxCatalogPage,
  parsePornhatCatalogPage,
  extractStreamDetails,
  isAdOrTracker
};

