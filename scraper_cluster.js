// scraper_cluster.js – High-Performance 10-Worker Parallel Async Scraper for HotTube (d:\redhub)

const fs = require('fs');
const path = require('path');
const { fetchHtml, parseCatalogPage, extractStreamDetails, isAdOrTracker } = require('./utils');

const WORKER_COUNT = 10;
const OUTPUT_FILE = path.resolve(__dirname, 'sample_videos.json');
const CHECKPOINT_FILE = path.resolve(__dirname, 'checkpoint_urls.json');

// Target Categories / Search Queries with Category Names
const TARGET_CATEGORIES = [
  { name: 'All', url: 'https://xhaccess.com/search/xhamsters' },
  { name: 'Indian', url: 'https://xhaccess.com/search/indian' },
  { name: 'Desi', url: 'https://xhaccess.com/search/desi' },
  { name: 'Mom', url: 'https://xhaccess.com/search/mom' },
  { name: 'Japanese', url: 'https://xhaccess.com/search/japanese' },
  { name: 'Pakistani', url: 'https://xhaccess.com/search/pakistani' },
  { name: 'Russian', url: 'https://xhaccess.com/search/russian' },
  { name: 'American', url: 'https://xhaccess.com/search/american' }
];

let catalog = [];
if (fs.existsSync(OUTPUT_FILE)) {
  try { catalog = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8')); } catch (_) {}
}

let scrapedUrls = new Set();
if (fs.existsSync(CHECKPOINT_FILE)) {
  try { scrapedUrls = new Set(JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'))); } catch (_) {}
}

function saveProgress() {
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(catalog, null, 2), 'utf-8');
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(Array.from(scrapedUrls), null, 2), 'utf-8');
}

/**
 * Discover all raw video items across categories
 */
async function discoverAllVideoItems() {
  const allItemsMap = new Map();

  for (const catObj of TARGET_CATEGORIES) {
    console.log(`\n🔎 Scanning category [${catObj.name}]: ${catObj.url}`);
    const html = await fetchHtml(catObj.url);
    if (!html) continue;

    const items = parseCatalogPage(html);
    console.log(`   ➜ Discovered ${items.length} raw video items`);

    for (const item of items) {
      if (item.page_url && !isAdOrTracker(item.page_url)) {
        if (!allItemsMap.has(item.page_url)) {
          allItemsMap.set(item.page_url, { ...item, category: catObj.name });
        }
      }
    }
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n✅ Total unique video URLs collected for queue: ${allItemsMap.size}`);
  return Array.from(allItemsMap.values());
}

/**
 * Async Worker function processing URLs from shared queue
 */
async function worker(id, queue) {
  while (queue.length > 0) {
    const item = queue.shift();
    if (!item || !item.page_url || scrapedUrls.has(item.page_url)) continue;

    try {
      console.log(`[Worker ${id}] 📥 Fetching details for [${item.category}]: ${item.title.substring(0, 35)}...`);

      let mainStreamUrl = item.stream_url;
      const details = await extractStreamDetails(item.page_url);

      if (details && details.stream_url) {
        mainStreamUrl = details.stream_url;
      }

      // Add clean video item to catalog
      const cleanItem = {
        index: catalog.length + 1,
        id: item.id,
        title: item.title.replace(/(xHamster|xHamsters|xNXX|Pornhub|XVideos)/gi, 'HotTube').trim(),
        category: item.category || 'All',
        duration: item.duration_formatted,
        duration_seconds: item.duration_seconds,
        thumbnail_url: item.thumbnail_url,
        poster_url: item.poster_url,
        page_url: item.page_url,
        video_stream_url: mainStreamUrl,
        views: item.views,
        channel: item.channel
      };

      // Deduplicate by ID
      catalog = catalog.filter(i => String(i.id) !== String(cleanItem.id));
      catalog.push(cleanItem);

      scrapedUrls.add(item.page_url);

      if (scrapedUrls.size % 5 === 0) {
        saveProgress();
        console.log(`   💾 Checkpoint saved - ${scrapedUrls.size} URLs processed (${catalog.length} items in catalog)`);
      }
    } catch (e) {
      console.error(`[Worker ${id}] ❌ Error processing ${item.page_url}: ${e.message}`);
    }
  }
}

/**
 * Launch 10-Worker Scraper Cluster
 */
async function runClusterScraper() {
  console.log('==================================================================');
  console.log('  🚀 HotTube - 10-Worker Parallel Cluster Scraper');
  console.log('==================================================================');

  const allItems = await discoverAllVideoItems();
  const queue = allItems.filter(i => !scrapedUrls.has(i.page_url));

  if (queue.length === 0) {
    console.log(' 🎉 All items already scraped – catalog up to date.');
    return;
  }

  console.log(`\n🗂️ Queue size: ${queue.length} items (skipping ${allItems.length - queue.length} already done)`);
  console.log(`🚀 Launching ${WORKER_COUNT} parallel workers...`);

  const promises = [];
  for (let i = 1; i <= WORKER_COUNT; i++) {
    promises.push(worker(i, queue));
  }

  await Promise.all(promises);
  saveProgress();

  console.log('\n==================================================================');
  console.log(`✅ Cluster scraping completed - ${catalog.length} items stored in ${OUTPUT_FILE}`);
  console.log('==================================================================');
}

runClusterScraper();
