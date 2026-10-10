const fs = require('fs');
const { fetchHtml } = require('../utils');

async function testTrailerFix() {
  const catalog = JSON.parse(fs.readFileSync('sample_videos.json', 'utf8'));
  const trailerItems = catalog.filter(v => {
    const s = v.video_stream_url || '';
    return s.includes('.t.mp4') || s.includes('.t.av1.mp4') || s.includes('/526x298.') || s.includes('trailer');
  });

  console.log(`Testing full stream extraction on first 10 trailer items (out of ${trailerItems.length})...`);

  for (let i = 0; i < Math.min(10, trailerItems.length); i++) {
    const item = trailerItems[i];
    const html = await fetchHtml(item.page_url);
    if (!html) {
      console.log(`Item ${i+1} [${item.id}]: HTML fetch returned null`);
      continue;
    }

    const m3u8Matches = html.match(/(https?:\\?\/\\?\/[^"' ]+\.m3u8[^"' ]*)/gi) || [];
    const validM3u8 = m3u8Matches.map(u => u.replace(/\\/g, '')).filter(u => !u.includes('trailer') && !u.includes('thumb'));

    if (validM3u8.length > 0) {
      console.log(`Item ${i+1} [${item.id}] [${item.duration}]: ✅ Full HLS: ${validM3u8[0].substring(0, 80)}...`);
    } else {
      console.log(`Item ${i+1} [${item.id}] [${item.duration}]: ❌ No M3U8 match found`);
    }
  }
}

testTrailerFix();
