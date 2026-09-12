const fs = require('fs');
const path = require('path');
const { fetchHtml, parseCatalogPage, extractStreamDetails, isAdOrTracker } = require('./utils');

const SEARCH_URL = 'https://xhaccess.com/search/xhamsters';
const OUTPUT_FILE = path.join(__dirname, 'sample_videos.json');
const LIMIT_VIDEOS = 5;

async function runScraper() {
  console.log('==================================================================');
  console.log('  🚀 RedHub - Async Video Catalog & Stream Extractor Scraper');
  console.log('==================================================================');
  console.log(`🔎 Target URL: ${SEARCH_URL}`);
  console.log(`🎯 Target Item Count: ${LIMIT_VIDEOS} Videos\n`);

  console.log('📥 Fetching search catalog page...');
  const html = await fetchHtml(SEARCH_URL);

  if (!html) {
    console.error('❌ Failed to retrieve HTML from target site.');
    process.exit(1);
  }

  console.log(' Parsing catalog items and extracting video metadata...');
  const rawItems = parseCatalogPage(html);
  console.log(` Found ${rawItems.length} raw video items on catalog page.`);

  const cleanVideos = [];

  for (const item of rawItems) {
    if (cleanVideos.length >= LIMIT_VIDEOS) break;

    // Filter out ads or invalid links
    if (isAdOrTracker(item.page_url)) continue;

    console.log(`\n------------------------------------------------------------------`);
    console.log(` Processing Video [${cleanVideos.length + 1}/${LIMIT_VIDEOS}]:`);
    console.log(`   Title: ${item.title}`);
    console.log(`   Duration: ${item.duration_formatted}`);
    console.log(`   Thumbnail: ${item.thumbnail_url}`);
    console.log(`   Page URL: ${item.page_url}`);

    // Resolve detail page stream URL if available
    let mainStreamUrl = item.stream_url;
    if (item.page_url) {
      console.log(`    Fetching direct video stream URL...`);
      const details = await extractStreamDetails(item.page_url);
      if (details && details.stream_url) {
        mainStreamUrl = details.stream_url;
        console.log(`   ✅ Direct Stream URL Found: ${mainStreamUrl}`);
      } else {
        console.log(`   ℹ️ Using Video Trailer/Stream Fallback URL: ${mainStreamUrl}`);
      }
    }

    cleanVideos.push({
      index: cleanVideos.length + 1,
      id: item.id,
      title: item.title,
      duration: item.duration_formatted,
      duration_seconds: item.duration_seconds,
      thumbnail_url: item.thumbnail_url,
      poster_url: item.poster_url,
      page_url: item.page_url,
      video_stream_url: mainStreamUrl,
      views: item.views,
      channel: item.channel
    });
  }

  // Save scraped sample output to JSON
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cleanVideos, null, 2), 'utf-8');

  console.log('\n==================================================================');
  console.log(`✅ Successfully Scraped ${cleanVideos.length} Clean Videos!`);
  console.log(`📁 Saved output to: ${OUTPUT_FILE}`);
  console.log('==================================================================\n');

  console.log(JSON.stringify(cleanVideos, null, 2));
}

runScraper().catch(err => {
  console.error('❌ Scraper runtime error:', err);
});
