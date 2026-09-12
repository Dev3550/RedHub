const fs = require('fs');
const path = require('path');
const https = require('https');

const CATALOG_FILE = path.join(__dirname, 'sample_videos.json');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.redtube.net/'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function scrapeRedtube10() {
  console.log('==================================================================');
  console.log('  🚀 Scraping 10 Fresh Redtube Videos for HotTube Catalog');
  console.log('==================================================================\n');

  try {
    const searchHtml = await httpGet('https://www.redtube.net/?search=hard+sex');
    const matches = [...searchHtml.matchAll(/href=["'](\/(\d+)|https:\/\/www\.redtube\.net\/(\d+))["']/gi)];
    
    const uniquePaths = Array.from(new Set(matches.map(m => m[1])));
    console.log(`Discovered ${uniquePaths.length} raw video links on Redtube search.`);

    const targetVideos = [];

    for (const p of uniquePaths) {
      if (targetVideos.length >= 10) break;

      const pageUrl = p.startsWith('http') ? p : `https://www.redtube.net${p}`;
      const videoId = pageUrl.split('/').pop();

      console.log(`\n[${targetVideos.length + 1}/10] Extracting details for Video ID: ${videoId}...`);

      try {
        const vidHtml = await httpGet(pageUrl);

        // Extract title
        const titleMatch = vidHtml.match(/<h1[^>]*class=["'][^"']*video_title[^"']*["'][^>]*>(.*?)<\/h1>/i) ||
                           vidHtml.match(/<title>(.*?)<\/title>/i);
        let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').replace(/- Redtube/gi, '').trim() : `Redtube Hardcore Video ${videoId}`;
        title = title.replace(/(Redtube|Pornhub|xHamster|XVideos)/gi, 'HotTube').trim();

        // Extract thumbnail
        const thumbMatch = vidHtml.match(/https?:\/\/[^"'\s]+\.(jpg|webp|png)/gi);
        const thumbnail = thumbMatch ? thumbMatch[0] : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80';

        // Extract stream URL
        const mp4Matches = [...vidHtml.matchAll(/https?:\\?\/\\?\/[^"' ]+\.mp4[^"' ]*/gi)].map(m => m[0].replace(/\\/g, ''));
        const m3u8Matches = [...vidHtml.matchAll(/https?:\\?\/\\?\/[^"' ]+\.m3u8[^"' ]*/gi)].map(m => m[0].replace(/\\/g, ''));
        
        let streamUrl = m3u8Matches[0] || mp4Matches[0] || '';

        if (!streamUrl) {
          console.warn(`   ⚠️ Stream URL not found for ${videoId}, skipping.`);
          continue;
        }

        console.log(`   Title: ${title.substring(0, 45)}...`);
        console.log(`   Stream URL: ${streamUrl.substring(0, 65)}...`);

        targetVideos.push({
          index: targetVideos.length + 1,
          id: `rt_${videoId}`,
          title: title,
          category: 'Hardcore',
          duration: '10:15',
          duration_seconds: 615,
          thumbnail_url: thumbnail,
          poster_url: thumbnail,
          page_url: pageUrl,
          video_stream_url: streamUrl,
          views: Math.floor(Math.random() * 800000) + 100000,
          channel: 'Redtube Official'
        });

      } catch (err) {
        console.error(`   Error extracting video ${videoId}: ${err.message}`);
      }
    }

    console.log(`\n✅ Scraped ${targetVideos.length} fresh Redtube videos.`);

    // Merge into sample_videos.json
    let catalog = [];
    if (fs.existsSync(CATALOG_FILE)) {
      catalog = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf-8'));
    }

    // Prepend new Redtube videos at the beginning of catalog so they display on Homepage right now!
    const mergedCatalog = [...targetVideos, ...catalog.filter(v => !v.id.startsWith('rt_'))].map((v, idx) => ({
      ...v,
      index: idx + 1
    }));

    fs.writeFileSync(CATALOG_FILE, JSON.stringify(mergedCatalog, null, 2), 'utf-8');
    console.log(`📁 Updated sample_videos.json! Total items in catalog: ${mergedCatalog.length}`);

  } catch (err) {
    console.error('Error scraping Redtube 10:', err);
  }
}

scrapeRedtube10();
