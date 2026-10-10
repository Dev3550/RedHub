// scraper_cluster.js – Multi-Worker Parallel Cluster Scraper for ExoticHub (d:\redhub)
// Dedicated to clean High-Quality HLS & MP4 streams from xhaccess.com & inxxx.com

const fs = require('fs');
const path = require('path');
const { fetchHtml, parseCatalogPage, parseInxxxCatalogPage, parsePornhatCatalogPage, extractStreamDetails, isAdOrTracker } = require('./utils');

const WORKER_COUNT = 70; // 70 Parallel High-Speed Async Scraper Workers
const OUTPUT_FILE = path.resolve(__dirname, 'sample_videos.json');
const CHECKPOINT_FILE = path.resolve(__dirname, 'checkpoint_urls.json');

// Target Categories across xhaccess, inxxx & pornhat
const TARGET_CATEGORIES = [
  // pornhat categories
  { name: 'Brazzers', source: 'pornhat', url: 'https://www.pornhat.com/sites/brazzers/' },
  { name: 'Indian', source: 'pornhat', url: 'https://www.pornhat.com/search/indian/' },
  { name: 'Desi', source: 'pornhat', url: 'https://www.pornhat.com/search/desi/' },
  { name: 'Anal', source: 'pornhat', url: 'https://www.pornhat.com/categories/anal/' },
  { name: 'Mom', source: 'pornhat', url: 'https://www.pornhat.com/categories/mom/' },
  { name: 'MILF', source: 'pornhat', url: 'https://www.pornhat.com/categories/milf/' },
  { name: 'Latina', source: 'pornhat', url: 'https://www.pornhat.com/categories/latina/' },
  { name: 'Asian', source: 'pornhat', url: 'https://www.pornhat.com/categories/asian/' },
  { name: 'Amateur', source: 'pornhat', url: 'https://www.pornhat.com/categories/amateur/' },
  { name: 'Blowjob', source: 'pornhat', url: 'https://www.pornhat.com/categories/blowjob/' },
  { name: 'Teen', source: 'pornhat', url: 'https://www.pornhat.com/categories/teen/' },
  { name: 'Japanese', source: 'pornhat', url: 'https://www.pornhat.com/categories/japanese/' },
  { name: 'Big Tits', source: 'pornhat', url: 'https://www.pornhat.com/categories/big-tits/' },
  { name: 'Creampie', source: 'pornhat', url: 'https://www.pornhat.com/categories/creampie/' },

  // xhaccess categories
  { name: 'Indian', source: 'xh', url: 'https://xhaccess.com/search/indian' },
  { name: 'Desi', source: 'xh', url: 'https://xhaccess.com/search/desi' },
  { name: 'Mom', source: 'xh', url: 'https://xhaccess.com/search/mom' },
  { name: 'Anal', source: 'xh', url: 'https://xhaccess.com/search/anal' },
  { name: 'Latina', source: 'xh', url: 'https://xhaccess.com/search/latina' },
  { name: 'Interracial', source: 'xh', url: 'https://xhaccess.com/search/interracial' },
  { name: 'Amateur', source: 'xh', url: 'https://xhaccess.com/search/amateur' },
  { name: 'Blowjob', source: 'xh', url: 'https://xhaccess.com/search/blowjob' },
  { name: 'Big Tits', source: 'xh', url: 'https://xhaccess.com/search/big-tits' },
  { name: 'Asian', source: 'xh', url: 'https://xhaccess.com/search/asian' },
  { name: 'Mature', source: 'xh', url: 'https://xhaccess.com/search/mature' },
  { name: 'Creampie', source: 'xh', url: 'https://xhaccess.com/search/creampie' },
  { name: 'POV', source: 'xh', url: 'https://xhaccess.com/search/pov' },
  { name: 'Group', source: 'xh', url: 'https://xhaccess.com/search/group' },
  { name: 'Hardcore', source: 'xh', url: 'https://xhaccess.com/search/hardcore' },
  { name: 'Teen', source: 'xh', url: 'https://xhaccess.com/search/teen' },
  { name: 'MILF', source: 'xh', url: 'https://xhaccess.com/search/milf' },
  { name: 'Threesome', source: 'xh', url: 'https://xhaccess.com/search/threesome' },
  { name: 'Solo', source: 'xh', url: 'https://xhaccess.com/search/solo' },
  { name: 'Lesbian', source: 'xh', url: 'https://xhaccess.com/search/lesbian' },
  { name: 'Blonde', source: 'xh', url: 'https://xhaccess.com/search/blonde' },
  { name: 'Brunette', source: 'xh', url: 'https://xhaccess.com/search/brunette' },
  { name: 'Japanese', source: 'xh', url: 'https://xhaccess.com/search/japanese' },
  { name: 'Pakistani', source: 'xh', url: 'https://xhaccess.com/search/pakistani' },
  { name: 'Russian', source: 'xh', url: 'https://xhaccess.com/search/russian' },
  { name: 'American', source: 'xh', url: 'https://xhaccess.com/search/american' },

  // inxxx categories
  { name: 'Indian', source: 'inxxx', url: 'https://www.inxxx.com/search/indian/' },
  { name: 'Desi', source: 'inxxx', url: 'https://www.inxxx.com/search/desi/' },
  { name: 'Mom', source: 'inxxx', url: 'https://www.inxxx.com/search/mom/' },
  { name: 'Anal', source: 'inxxx', url: 'https://www.inxxx.com/search/anal/' },
  { name: 'Latina', source: 'inxxx', url: 'https://www.inxxx.com/search/latina/' },
  { name: 'Interracial', source: 'inxxx', url: 'https://www.inxxx.com/search/interracial/' },
  { name: 'Amateur', source: 'inxxx', url: 'https://www.inxxx.com/search/amateur/' },
  { name: 'Blowjob', source: 'inxxx', url: 'https://www.inxxx.com/search/blowjob/' },
  { name: 'Big Tits', source: 'inxxx', url: 'https://www.inxxx.com/search/big-tits/' },
  { name: 'Asian', source: 'inxxx', url: 'https://www.inxxx.com/search/asian/' },
  { name: 'MILF', source: 'inxxx', url: 'https://www.inxxx.com/search/milf/' },
  { name: 'Mature', source: 'inxxx', url: 'https://www.inxxx.com/search/mature/' },
  { name: 'Creampie', source: 'inxxx', url: 'https://www.inxxx.com/search/creampie/' },
  { name: 'POV', source: 'inxxx', url: 'https://www.inxxx.com/search/pov/' },
  { name: 'Group', source: 'inxxx', url: 'https://www.inxxx.com/search/group/' },
  { name: 'Hardcore', source: 'inxxx', url: 'https://www.inxxx.com/search/hardcore/' },
  { name: 'Teen', source: 'inxxx', url: 'https://www.inxxx.com/search/teen/' },
  { name: 'Threesome', source: 'inxxx', url: 'https://www.inxxx.com/search/threesome/' },
  { name: 'Solo', source: 'inxxx', url: 'https://www.inxxx.com/search/solo/' },
  { name: 'Lesbian', source: 'inxxx', url: 'https://www.inxxx.com/search/lesbian/' },
  { name: 'Blonde', source: 'inxxx', url: 'https://www.inxxx.com/search/blonde/' },
  { name: 'Brunette', source: 'inxxx', url: 'https://www.inxxx.com/search/brunette/' },
  { name: 'Japanese', source: 'inxxx', url: 'https://www.inxxx.com/search/japanese/' },
  { name: 'Pakistani', source: 'inxxx', url: 'https://www.inxxx.com/search/pakistani/' },
  { name: 'Russian', source: 'inxxx', url: 'https://www.inxxx.com/search/russian/' },
  { name: 'American', source: 'inxxx', url: 'https://www.inxxx.com/search/american/' }
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
  const seenIds = new Set();
  const seenUrls = new Set();
  const clean = [];

  for (const v of catalog) {
    const pageUrl = v.page_url || '';
    const validDomain = pageUrl.includes('xhaccess.com') || pageUrl.includes('inxxx.com') || pageUrl.includes('pornhat.com');
    if (!validDomain || !v.video_stream_url || !v.id) continue;
    if (seenIds.has(v.id) || seenUrls.has(pageUrl)) continue;

    seenIds.add(v.id);
    seenUrls.add(pageUrl);
    clean.push(v);
  }

  catalog = clean.map((v, i) => ({ ...v, index: i + 1 }));
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(catalog, null, 2), 'utf-8');
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(Array.from(scrapedUrls), null, 2), 'utf-8');
}

/**
 * Discover all raw video items across xhaccess, inxxx & pornhat categories
 */
async function discoverAllVideoItems() {
  const allItemsMap = new Map();

  for (const catObj of TARGET_CATEGORIES) {
    console.log(`\n🔎 [${catObj.source}] Scanning category [${catObj.name}]: ${catObj.url}`);
    const html = await fetchHtml(catObj.url);
    if (!html) continue;

    let items = [];
    if (catObj.source === 'pornhat') items = parsePornhatCatalogPage(html);
    else if (catObj.source === 'inxxx') items = parseInxxxCatalogPage(html);
    else items = parseCatalogPage(html);
    console.log(`   ➜ Discovered ${items.length} raw video items`);

    for (const item of items) {
      if (item.page_url && !isAdOrTracker(item.page_url)) {
        if (!allItemsMap.has(item.page_url)) {
          allItemsMap.set(item.page_url, { ...item, category: catObj.name, source: catObj.source });
        }
      }
    }
    await new Promise(r => setTimeout(r, 120));
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
      console.log(`[Worker ${id}] 📥 Fetching Stream details for [${item.category}] (${item.source}): ${item.title.substring(0, 35)}...`);

      let mainStreamUrl = item.stream_url || '';
      let posterUrl = item.poster_url || item.thumbnail_url;

      const details = await extractStreamDetails(item.page_url);
      if (details && details.stream_url) {
        mainStreamUrl = details.stream_url;
      }

      if (!mainStreamUrl) {
        console.log(`[Worker ${id}] ⚠️ No valid stream URL found for ${item.page_url}`);
        scrapedUrls.add(item.page_url);
        continue;
      }

      // Format clean title without third-party branding
      const cleanTitle = item.title
        .replace(/(xHamster|xHamsters|xNXX|Pornhub|XVideos|FreePornVideo|SexVid|HotTube|inxxx|xxx|video)/gi, 'ExoticHub')
        .trim();

      const cleanItem = {
        index: 1,
        id: item.id || `vid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: cleanTitle || 'ExoticHub Trending Video',
        category: item.category || 'Trending',
        duration: item.duration || item.duration_formatted || '10:00',
        thumbnail_url: item.thumbnail_url || posterUrl,
        poster_url: posterUrl || item.thumbnail_url,
        page_url: item.page_url,
        video_stream_url: mainStreamUrl,
        views: item.views || Math.floor(Math.random() * 500000) + 50000,
        channel: 'ExoticHub Original'
      };

      // Deduplicate by ID & Page URL
      catalog = catalog.filter(i => String(i.id) !== String(cleanItem.id) && i.page_url !== cleanItem.page_url);
      // PREPEND newly scraped item to the FRONT of catalog for Homepage visibility!
      catalog.unshift(cleanItem);

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
  console.log('  🚀 ExoticHub Multi-Source Cluster Scraper (15 Workers)');
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
  console.log(`✅ Cluster scraping completed - ${catalog.length} Stream items stored in ${OUTPUT_FILE}`);
  console.log('==================================================================');
}

runClusterScraper();
