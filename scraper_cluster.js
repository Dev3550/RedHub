// scraper_cluster.js – Multi-Worker Parallel Cluster Scraper for ExoticHub (d:\redhub)
// Dedicated to clean High-Quality HLS & MP4 streams from xhaccess.com & inxxx.com

const fs = require('fs');
const path = require('path');
const { fetchHtml, parseCatalogPage, parseInxxxCatalogPage, parsePornhatCatalogPage, extractStreamDetails, isAdOrTracker } = require('./utils');

const WORKER_COUNT = 140; // 140 Parallel High-Speed Async Scraper Workers
const OUTPUT_FILE = path.resolve(__dirname, 'sample_videos.json');
const CHECKPOINT_FILE = path.resolve(__dirname, 'checkpoint_urls.json');

// Dynamic Multi-Page Target Generation across pornhat and xhaccess
const PORN_BASE_CATEGORIES = [
  { name: 'Brazzers', path: 'sites/brazzers' },
  { name: 'Indian', path: 'search/indian' },
  { name: 'Desi', path: 'search/desi' },
  { name: 'Anal', path: 'categories/anal' },
  { name: 'Mom', path: 'categories/mom' },
  { name: 'MILF', path: 'categories/milf' },
  { name: 'Latina', path: 'categories/latina' },
  { name: 'Asian', path: 'categories/asian' },
  { name: 'Amateur', path: 'categories/amateur' },
  { name: 'Blowjob', path: 'categories/blowjob' },
  { name: 'Teen', path: 'categories/teen' },
  { name: 'Japanese', path: 'categories/japanese' },
  { name: 'Big Tits', path: 'categories/big-tits' },
  { name: 'Creampie', path: 'categories/creampie' },
  { name: 'Hardcore', path: 'categories/hardcore' },
  { name: 'Threesome', path: 'categories/threesome' },
  { name: 'Babe', path: 'categories/babe' },
  { name: 'Ebony', path: 'categories/ebony' },
  { name: 'Interracial', path: 'categories/interracial' },
  { name: 'Brunette', path: 'categories/brunette' },
  { name: 'Blonde', path: 'categories/blonde' },
  { name: 'Cumshot', path: 'categories/cumshot' },
  { name: 'POV', path: 'categories/pov' }
];

const XH_BASE_CATEGORIES = [
  'Indian', 'Desi', 'Mom', 'Anal', 'Latina', 'Interracial', 'Amateur', 'Blowjob',
  'Big Tits', 'Asian', 'Mature', 'Creampie', 'POV', 'Group', 'Hardcore', 'Teen',
  'MILF', 'Threesome', 'Solo', 'Lesbian', 'Blonde', 'Brunette', 'Japanese',
  'Pakistani', 'Russian', 'American'
];

const TARGET_CATEGORIES = [];

// Generate multi-page Pornhat URLs (Pages 1 to 10)
for (const cat of PORN_BASE_CATEGORIES) {
  for (let p = 1; p <= 10; p++) {
    const pagePath = p === 1 ? `https://www.pornhat.com/${cat.path}/` : `https://www.pornhat.com/${cat.path}/${p}/`;
    TARGET_CATEGORIES.push({ name: cat.name, source: 'pornhat', url: pagePath });
  }
}

// Generate multi-page xHAccess URLs (Pages 1 to 5)
for (const catName of XH_BASE_CATEGORIES) {
  const slug = catName.toLowerCase().replace(/ /g, '-');
  for (let p = 1; p <= 5; p++) {
    const pageUrl = p === 1 ? `https://xhaccess.com/search/${slug}` : `https://xhaccess.com/search/${slug}?page=${p}`;
    TARGET_CATEGORIES.push({ name: catName, source: 'xh', url: pageUrl });
  }
}

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
    const validDomain = pageUrl.includes('xhaccess.com') || pageUrl.includes('pornhat.com');
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
