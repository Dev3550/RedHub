// scraper_cluster.js – Multi-Source High-Performance 10-Worker Parallel Cluster Scraper for HotTube (d:\redhub)

const fs = require('fs');
const path = require('path');
const { fetchHtml, parseCatalogPage, extractStreamDetails, isAdOrTracker } = require('./utils');
const { fetchFpvHtml, parseFpvCatalogPage, extractFpvStreamDetails } = require('./fpv_utils');

const WORKER_COUNT = 10;
const OUTPUT_FILE = path.resolve(__dirname, 'sample_videos.json');
const CHECKPOINT_FILE = path.resolve(__dirname, 'checkpoint_urls.json');

// Target Categories across xhaccess and freepornvideo.sex
const XH_CATEGORIES = [
  { name: 'All', url: 'https://xhaccess.com/search/xhamsters' },
  { name: 'Indian', url: 'https://xhaccess.com/search/indian' },
  { name: 'Desi', url: 'https://xhaccess.com/search/desi' },
  { name: 'Mom', url: 'https://xhaccess.com/search/mom' },
  { name: 'Japanese', url: 'https://xhaccess.com/search/japanese' },
  { name: 'Pakistani', url: 'https://xhaccess.com/search/pakistani' },
  { name: 'Russian', url: 'https://xhaccess.com/search/russian' },
  { name: 'American', url: 'https://xhaccess.com/search/american' }
];

const FPV_CATEGORIES = [
  { name: 'All', url: 'https://www.freepornvideo.sex/' },
  { name: 'Indian', url: 'https://www.freepornvideo.sex/categories/indian/' },
  { name: 'Indian', url: 'https://www.freepornvideo.sex/categories/indian/2/' },
  { name: 'Anal', url: 'https://www.freepornvideo.sex/categories/anal/' },
  { name: 'Anal', url: 'https://www.freepornvideo.sex/categories/anal/2/' },
  { name: 'Latina', url: 'https://www.freepornvideo.sex/categories/latina/' },
  { name: 'Interracial', url: 'https://www.freepornvideo.sex/categories/interracial/' },
  { name: 'Amateur', url: 'https://www.freepornvideo.sex/categories/amateur/' },
  { name: 'Blowjob', url: 'https://www.freepornvideo.sex/categories/blowjob/' },
  { name: 'Big Tits', url: 'https://www.freepornvideo.sex/categories/big-tits/' },
  { name: 'Small Tits', url: 'https://www.freepornvideo.sex/categories/small-tits/' },
  { name: 'Asian', url: 'https://www.freepornvideo.sex/categories/asian/' },
  { name: 'Mature', url: 'https://www.freepornvideo.sex/categories/mature/' },
  { name: 'Cumshot', url: 'https://www.freepornvideo.sex/categories/cumshot/' },
  { name: 'Creampie', url: 'https://www.freepornvideo.sex/categories/creampie/' },
  { name: 'Pussy Licking', url: 'https://www.freepornvideo.sex/categories/pussy-licking/' },
  { name: 'POV', url: 'https://www.freepornvideo.sex/categories/pov/' },
  { name: 'Group', url: 'https://www.freepornvideo.sex/categories/group/' },
  { name: 'Cum in Mouth', url: 'https://www.freepornvideo.sex/categories/cum-in-mouth/' },
  { name: 'Hardcore', url: 'https://www.freepornvideo.sex/categories/hardcore/' },
  { name: 'Teen', url: 'https://www.freepornvideo.sex/categories/teen/' },
  { name: 'MILF', url: 'https://www.freepornvideo.sex/categories/milf/' },
  { name: 'MILF', url: 'https://www.freepornvideo.sex/categories/milf/2/' },
  { name: 'Threesome', url: 'https://www.freepornvideo.sex/categories/threesome/' },
  { name: 'Solo', url: 'https://www.freepornvideo.sex/categories/solo/' },
  { name: 'Redhead', url: 'https://www.freepornvideo.sex/categories/redhead/' },
  { name: 'Shaved Pussy', url: 'https://www.freepornvideo.sex/categories/shaved-pussy/' },
  { name: 'Brunette', url: 'https://www.freepornvideo.sex/categories/brunette/' },
  { name: 'Masturbation', url: 'https://www.freepornvideo.sex/categories/masturbation/' },
  { name: 'Lesbian', url: 'https://www.freepornvideo.sex/categories/lesbian/' },
  { name: 'Beautiful', url: 'https://www.freepornvideo.sex/categories/beuatiful/' },
  { name: 'Blonde', url: 'https://www.freepornvideo.sex/categories/blonde/' },
  { name: 'Rimming', url: 'https://www.freepornvideo.sex/categories/rimming/' },
  { name: 'Old & Young', url: 'https://www.freepornvideo.sex/categories/old-and-young/' },
  { name: 'Striptease', url: 'https://www.freepornvideo.sex/categories/striptease/' },
  { name: 'Webcam', url: 'https://www.freepornvideo.sex/categories/webcam/' },
  { name: 'Hairy Pussy', url: 'https://www.freepornvideo.sex/categories/hairy-pussy/' },
  { name: 'Cum on Face', url: 'https://www.freepornvideo.sex/categories/cum-on-face/' },
  { name: 'Outdoors', url: 'https://www.freepornvideo.sex/categories/outdoors/' },
  { name: 'Pee', url: 'https://www.freepornvideo.sex/categories/pee/' },
  { name: 'Stockings', url: 'https://www.freepornvideo.sex/categories/stockings/' },
  { name: 'Fisting', url: 'https://www.freepornvideo.sex/categories/fisting/' },
  { name: 'Dildo', url: 'https://www.freepornvideo.sex/categories/dildo/' },
  { name: 'Toys', url: 'https://www.freepornvideo.sex/categories/toys/' },
  { name: 'Oil & Cream', url: 'https://www.freepornvideo.sex/categories/oil-and-cream/' }
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
 * Discover all raw video items across all target sites & categories
 */
async function discoverAllVideoItems() {
  const allItemsMap = new Map();

  // 1. Scan xhaccess categories
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

  // 2. Scan freepornvideo.sex categories
  for (const catObj of FPV_CATEGORIES) {
    console.log(`\n🔎 [freepornvideo.sex] Scanning category [${catObj.name}]: ${catObj.url}`);
    const html = await fetchFpvHtml(catObj.url);
    if (!html) continue;

    const items = parseFpvCatalogPage(html);
    console.log(`   ➜ Discovered ${items.length} raw video items`);

    for (const item of items) {
      if (item.page_url && !isAdOrTracker(item.page_url)) {
        if (!allItemsMap.has(item.page_url)) {
          allItemsMap.set(item.page_url, { ...item, category: catObj.name, source: 'fpv' });
        }
      }
    }
    await new Promise(r => setTimeout(r, 150));
  }

  console.log(`\n✅ Total unique video URLs collected for queue across all sources: ${allItemsMap.size}`);
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
      console.log(`[Worker ${id}] 📥 Fetching details for [${item.category}] (${item.source}): ${item.title.substring(0, 35)}...`);

      let mainStreamUrl = item.stream_url || '';
      let embedUrl = '';
      let posterUrl = item.poster_url || item.thumbnail_url;
      let categories = [item.category || 'All'];

      if (item.source === 'fpv') {
        const details = await extractFpvStreamDetails(item.page_url);
        if (details) {
          if (details.stream_url) mainStreamUrl = details.stream_url;
          if (details.embed_url) embedUrl = details.embed_url;
          if (details.poster_url) posterUrl = details.poster_url;
          if (details.categories && details.categories.length > 0) {
            categories = details.categories;
          }
        }
      } else {
        const details = await extractStreamDetails(item.page_url);
        if (details && details.stream_url) {
          mainStreamUrl = details.stream_url;
        }
      }

      // Format clean title without third-party branding
      const cleanTitle = item.title
        .replace(/(xHamster|xHamsters|xNXX|Pornhub|XVideos|FreePornVideo)/gi, 'HotTube')
        .trim();

      const cleanItem = {
        index: catalog.length + 1,
        id: item.id || `vid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: cleanTitle,
        category: item.category || categories[0] || 'All',
        categories: categories,
        duration: item.duration || item.duration_formatted || '10:00',
        thumbnail_url: item.thumbnail_url || posterUrl,
        poster_url: posterUrl || item.thumbnail_url,
        page_url: item.page_url,
        video_stream_url: mainStreamUrl,
        embed_url: embedUrl,
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
  console.log('  🚀 HotTube Multi-Source 10-Worker Cluster Scraper');
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
