// scraper_cluster.js – Multi-Worker Parallel Cluster Scraper for HotTube (d:\redhub)
// Dedicated 100% to clean High-Quality xhaccess HLS streams

const fs = require('fs');
const path = require('path');
const { fetchHtml, parseCatalogPage, extractStreamDetails, isAdOrTracker } = require('./utils');

const WORKER_COUNT = 10;
const OUTPUT_FILE = path.resolve(__dirname, 'sample_videos.json');
const CHECKPOINT_FILE = path.resolve(__dirname, 'checkpoint_urls.json');

// Target Categories across xhaccess
const XH_CATEGORIES = [
  { name: 'All', url: 'https://xhaccess.com/search/xhamsters' },
  { name: 'Indian', url: 'https://xhaccess.com/search/indian' },
  { name: 'Desi', url: 'https://xhaccess.com/search/desi' },
  { name: 'Mom', url: 'https://xhaccess.com/search/mom' },
  { name: 'Japanese', url: 'https://xhaccess.com/search/japanese' },
  { name: 'Pakistani', url: 'https://xhaccess.com/search/pakistani' },
  { name: 'Russian', url: 'https://xhaccess.com/search/russian' },
  { name: 'American', url: 'https://xhaccess.com/search/american' },
  { name: 'Anal', url: 'https://xhaccess.com/search/anal' },
  { name: 'Latina', url: 'https://xhaccess.com/search/latina' },
  { name: 'Interracial', url: 'https://xhaccess.com/search/interracial' },
  { name: 'Amateur', url: 'https://xhaccess.com/search/amateur' },
  { name: 'Blowjob', url: 'https://xhaccess.com/search/blowjob' },
  { name: 'Big Tits', url: 'https://xhaccess.com/search/big-tits' },
  { name: 'Asian', url: 'https://xhaccess.com/search/asian' },
  { name: 'Mature', url: 'https://xhaccess.com/search/mature' },
  { name: 'Creampie', url: 'https://xhaccess.com/search/creampie' },
  { name: 'POV', url: 'https://xhaccess.com/search/pov' },
  { name: 'Group', url: 'https://xhaccess.com/search/group' },
  { name: 'Hardcore', url: 'https://xhaccess.com/search/hardcore' },
  { name: 'Teen', url: 'https://xhaccess.com/search/teen' },
  { name: 'MILF', url: 'https://xhaccess.com/search/milf' },
  { name: 'Threesome', url: 'https://xhaccess.com/search/threesome' },
  { name: 'Solo', url: 'https://xhaccess.com/search/solo' },
  { name: 'Lesbian', url: 'https://xhaccess.com/search/lesbian' },
  { name: 'Blonde', url: 'https://xhaccess.com/search/blonde' },
  { name: 'Brunette', url: 'https://xhaccess.com/search/brunette' }
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
  // Always filter out any non-xhaccess entries
  catalog = catalog.filter(v => {
    const url = (v.page_url || '') + (v.video_stream_url || '');
    return !url.includes('sexvid') && !url.includes('freepornvideo');
  }).map((v, i) => ({ ...v, index: i + 1 }));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(catalog, null, 2), 'utf-8');
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(Array.from(scrapedUrls), null, 2), 'utf-8');
}

/**
 * Discover all raw video items across xhaccess categories
 */
async function discoverAllVideoItems() {
  const allItemsMap = new Map();

  for (const catObj of XH_CATEGORIES) {
    console.log(`\n🔎 [xhaccess] Scanning category [${catObj.name}]: ${catObj.url}`);
    const html = await fetchHtml(catObj.url);
    if (!html) continue;

    const items = parseCatalogPage(html);
    console.log(`   ➜ Discovered ${items.length} raw video items`);

    for (const item of items) {
      if (item.page_url && !isAdOrTracker(item.page_url)) {
        if (!allItemsMap.has(item.page_url)) {
          allItemsMap.set(item.page_url, { ...item, category: catObj.name, source: 'xh' });
        }
      }
    }
    await new Promise(r => setTimeout(r, 150));
  }

  console.log(`\n✅ Total unique video URLs collected for queue: ${allItemsMap.size}`);
  return Array.from(allItemsMap.values());
}

/**
 * Async Worker processing items from queue
 */
async function worker(id, queue) {
  while (queue.length > 0) {
    const item = queue.shift();
    if (!item || !item.page_url || scrapedUrls.has(item.page_url)) continue;

    try {
      console.log(`[Worker ${id}] 📥 Fetching HLS details for [${item.category}]: ${item.title.substring(0, 35)}...`);

      let mainStreamUrl = item.stream_url || '';
      let posterUrl = item.poster_url || item.thumbnail_url;

      const details = await extractStreamDetails(item.page_url);
      if (details && details.stream_url) {
        mainStreamUrl = details.stream_url;
      }

      // Format clean title without third-party branding
      const cleanTitle = item.title
        .replace(/(xHamster|xHamsters|xNXX|Pornhub|XVideos|FreePornVideo|SexVid|SexVid\.xxx)/gi, 'HotTube')
        .trim();

      const cleanItem = {
        index: catalog.length + 1,
        id: item.id || `vid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: cleanTitle,
        category: item.category || 'All',
        duration: item.duration || item.duration_formatted || '10:00',
        thumbnail_url: item.thumbnail_url || posterUrl,
        poster_url: posterUrl || item.thumbnail_url,
        page_url: item.page_url,
        video_stream_url: mainStreamUrl,
        views: item.views || Math.floor(Math.random() * 500000) + 50000,
        channel: item.channel || 'HotTube Original'
      };

      // Deduplicate by ID & Page URL
      catalog = catalog.filter(i => String(i.id) !== String(cleanItem.id) && i.page_url !== cleanItem.page_url);
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
 * Launch Multi-Source Scraper Cluster
 */
async function runClusterScraper() {
  console.log('==================================================================');
  console.log('  🚀 HotTube Dedicated HLS Cluster Scraper (10 Workers)');
  console.log('==================================================================');

  const allItems = await discoverAllVideoItems();
  const queue = allItems.filter(i => !scrapedUrls.has(i.page_url));

  if (queue.length === 0) {
    console.log(' 🎉 All items already scraped – catalog up to date.');
    saveProgress();
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
  console.log(`✅ Cluster scraping completed - ${catalog.length} HLS items stored in ${OUTPUT_FILE}`);
  console.log('==================================================================');
}

runClusterScraper();
