const axios = require('axios');
const cheerio = require('cheerio');

async function testVideoPage() {
  try {
    const url = 'https://www.freepornvideo.sex/xxx/36016/watch-how-this-indian-wife-cheats-with-her-hot-lover-and-gets-her-ass-drilled-hard/';
    console.log('Fetching detail page:', url);
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000
    });
    const $ = cheerio.load(res.data);
    
    console.log('Title:', $('h1').first().text().trim() || $('.headline h1').first().text().trim());
    
    const iframes = [];
    $('iframe').each((i, el) => {
      iframes.push($(el).attr('src'));
    });
    console.log('Iframes:', iframes);

    const videoSrcs = [];
    $('video source, video').each((i, el) => {
      videoSrcs.push($(el).attr('src'));
    });
    console.log('Video tags:', videoSrcs);

    console.log('\nScanning script tags for player variables...');
    $('script').each((i, el) => {
      const text = $(el).html();
      if (text && (text.includes('video_url') || text.includes('license_code') || text.includes('html5player') || text.includes('mp4') || text.includes('m3u8') || text.includes('kt_player'))) {
        console.log(`\nScript ${i}:`);
        console.log(text);
      }
    });

  } catch(e) {
    console.error('Error:', e.message);
  }
}

testVideoPage();
