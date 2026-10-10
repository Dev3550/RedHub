const fs = require('fs');
const path = require('path');
const { extractStreamDetails } = require('../utils');

async function fixAllTrailers() {
  const file = path.join(__dirname, '../sample_videos.json');
  const catalog = JSON.parse(fs.readFileSync(file, 'utf-8'));

  const trailerItems = catalog.filter(v => {
    const s = v.video_stream_url || '';
    return s.includes('.t.mp4') || s.includes('.t.av1.mp4') || s.includes('/526x298.') || s.includes('trailer');
  });

  console.log(`Found ${trailerItems.length} videos with trailer preview URLs. Fixing to full-length HLS streams...`);

  let count = 0;
  for (const item of trailerItems) {
    if (!item.page_url) continue;
    try {
      const fresh = await extractStreamDetails(item.page_url);
      if (fresh && fresh.stream_url && !fresh.stream_url.includes('.t.mp4') && !fresh.stream_url.includes('.t.av1.mp4')) {
        item.video_stream_url = fresh.stream_url;
        count++;
        console.log(`✅ Fixed video ${item.id} (${item.duration}): ${fresh.stream_url.substring(0, 70)}...`);
      }
    } catch (e) {}
  }

  fs.writeFileSync(file, JSON.stringify(catalog, null, 2), 'utf-8');
  console.log(`\n🎉 Finished! Fixed ${count} / ${trailerItems.length} trailer URLs to FULL-LENGTH streams.`);
}

fixAllTrailers();
