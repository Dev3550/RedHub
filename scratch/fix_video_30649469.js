const { fetchHtml, extractStreamDetails } = require('../utils');
const fs = require('fs');

async function fix30649469() {
  const url = 'https://xhaccess.com/videos/pawg-hotwife-gigi-broad-sneaks-off-on-her-husband-for-a-bbc-session-xheyZQ1';
  console.log('Extracting fresh details for video 30649469...');
  const details = await extractStreamDetails(url);
  console.log('Extracted details:', JSON.stringify(details, null, 2));

  if (details && details.stream_url) {
    const catalog = JSON.parse(fs.readFileSync('sample_videos.json', 'utf8'));
    const item = catalog.find(v => String(v.id) === '30649469');
    if (item) {
      item.video_stream_url = details.stream_url;
      fs.writeFileSync('sample_videos.json', JSON.stringify(catalog, null, 2), 'utf-8');
      console.log('✅ Video 30649469 updated in sample_videos.json!');
    }
  }
}

fix30649469();
