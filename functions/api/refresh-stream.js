// Cloudflare Pages Serverless Edge Function for Real-Time Stream Token Refresh
// Location: functions/api/refresh-stream.js

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const pageUrl = url.searchParams.get('page_url');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!pageUrl) {
    return new Response(JSON.stringify({ success: false, error: 'Missing page_url parameter' }), {
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    let referer = 'https://xhaccess.com/';
    if (pageUrl.includes('pornhat.com')) referer = 'https://www.pornhat.com/';

    const response = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': '_sv=1',
        'Referer': referer
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ success: false, error: `Upstream returned status ${response.status}` }), {
        status: 502,
        headers: corsHeaders
      });
    }

    const html = await response.text();
    let streamUrl = '';

    if (pageUrl.includes('pornhat.com')) {
      const matches = html.match(/(https?:\/\/[^"'\s]+\/get_file\/[^"'\s]*)/gi) || [];
      const valid = matches.filter(u => !u.includes('trailer') && !u.includes('thumb') && !u.includes('preview'));
      if (valid.length > 0) {
        const hd = valid.find(u => u.includes('720p.mp4') || u.includes('1080p.mp4')) || valid[0];
        streamUrl = hd.replace(/\\/g, '').replace(/&amp;/g, '&');
      }
    } else if (pageUrl.includes('inxxx.com')) {
      const getFileMatch = html.match(/(https?:\/\/[^"'\s]+\/get_file\/[^\s"']+)/i);
      if (getFileMatch) {
        streamUrl = getFileMatch[1].replace(/&amp;/g, '&');
      }
    } else {
      const initialsMatch = html.match(/window\.initials\s*=\s*(\{[\s\S]*?\});\s*<\/script>/s);
      if (initialsMatch && initialsMatch[1]) {
        try {
          const parsed = JSON.parse(initialsMatch[1]);
          const sources = parsed?.videoModel?.sources || parsed?.video?.sources || parsed?.xplayerSettings?.sources;
          if (typeof sources?.hls === 'string') {
            streamUrl = sources.hls;
          } else if (typeof sources?.hls === 'object' && sources.hls !== null) {
            const vals = Object.values(sources.hls);
            if (vals.length) streamUrl = vals[vals.length - 1];
          } else if (sources?.mp4) {
            const keys = Object.keys(sources.mp4);
            if (keys.length) streamUrl = sources.mp4[keys[keys.length - 1]];
          }
        } catch (_) {}
      }
      if (!streamUrl) {
        const m3u8Match = html.match(/(https?:\\?\/\\?\/[^"' ]+\.m3u8[^"' ]*)/i);
        if (m3u8Match) streamUrl = m3u8Match[1].replace(/\\/g, '');
      }
    }

    if (streamUrl) {
      return new Response(JSON.stringify({ success: true, stream_url: streamUrl }), {
        status: 200,
        headers: corsHeaders
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Stream URL not found in target page HTML' }), {
        status: 404,
        headers: corsHeaders
      });
    }

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
