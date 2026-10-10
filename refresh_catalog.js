const fs = require('fs');
const path = require('path');
const { fetchHtml, extractStreamDetails } = require('./utils');

const CATALOG_FILE = path.join(__dirname, 'sample_videos.json');
const CONCURRENCY = 140; // 140 High-Speed Parallel Async Scraper Workers

async function refreshAllExpiredTokens() {
  console.log('==================================================================');
  console.log('  🚀 ExoticHub 140-Worker Parallel Stream Token & Catalog Refresher');
  console.log('==================================================================');

  if (!fs.existsSync(CATALOG_FILE)) {
    console.error('Catalog file not found:', CATALOG_FILE);
    return;
  }

  let catalog = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf-8'));
  console.log(`Total catalog items to audit: ${catalog.length}`);

  let updatedCount = 0;
  let failedCount = 0;
  let validCount = 0;
  let processedCount = 0;

  // Create queue of items to process
  const queue = catalog.map((item, index) => ({ item, index }));

  async function saveProgress() {
    try {
      const validItems = catalog.filter(v => v.video_stream_url).map((v, idx) => ({
        ...v,
        index: idx + 1
      }));
      fs.writeFileSync(CATALOG_FILE, JSON.stringify(validItems, null, 2), 'utf-8');
    } catch (_) {}
  }

  async function worker(workerId) {
    while (queue.length > 0) {
      const task = queue.shift();
      if (!task) break;

      const { item, index } = task;
      const streamUrl = item.video_stream_url;
      let isExpired = false;

      if (!streamUrl) {
        isExpired = true;
      } else {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);

          const checkRes = await fetch(streamUrl, { method: 'HEAD', signal: controller.signal });
          clearTimeout(timeoutId);

          if (checkRes.status === 410 || checkRes.status === 404 || checkRes.status === 403 || checkRes.status === 423) {
            isExpired = true;
          } else {
            validCount++;
          }
        } catch (_) {
          isExpired = true;
        }
      }

      if (isExpired && item.page_url) {
        try {
          const freshDetails = await extractStreamDetails(item.page_url);
          if (freshDetails && freshDetails.stream_url) {
            item.video_stream_url = freshDetails.stream_url;
            item._wasRefreshed = true;
            updatedCount++;
            console.log(`[Worker ${workerId}] ✅ Refreshed stream URL for ID ${item.id}`);
          } else {
            failedCount++;
          }
        } catch (err) {
          failedCount++;
        }
      }

      processedCount++;
      if (processedCount % 200 === 0 || queue.length === 0) {
        console.log(` ⏳ Audited [${processedCount}/${catalog.length}] items | Valid: ${validCount} | Refreshed: ${updatedCount}`);
      }

      if (processedCount % 500 === 0) {
        await saveProgress();
        if (global.gc) global.gc();
      }
    }
  }

  const workers = [];
  for (let i = 1; i <= CONCURRENCY; i++) {
    workers.push(worker(i));
  }

  await Promise.all(workers);

  // Separate refreshed items and place them at the TOP (beginning) of the catalog for Homepage display
  const refreshedItems = [];
  const validItems = [];

  for (const v of catalog) {
    const pageUrl = v.page_url || '';
    if ((pageUrl.includes('xhaccess.com') || pageUrl.includes('pornhat.com')) && v.video_stream_url) {
      if (v.channel === 'HotTube Creator' || v.channel === 'HotTube Original') {
        v.channel = 'ExoticHub Original';
      }
      if (v.title) {
        v.title = v.title.replace(/(HotTube|inxxx|pornhat|xxx|video)/gi, 'ExoticHub');
      }

      if (v._wasRefreshed) {
        delete v._wasRefreshed;
        refreshedItems.push(v);
      } else {
        validItems.push(v);
      }
    }
  }

  const cleanCatalog = [...refreshedItems, ...validItems].map((v, idx) => ({
    ...v,
    index: idx + 1
  }));

  fs.writeFileSync(CATALOG_FILE, JSON.stringify(cleanCatalog, null, 2), 'utf-8');

  console.log('\n==================================================================');
  console.log(`✅ Parallel Token Refresh Complete!`);
  console.log(`   Valid active streams: ${validCount}`);
  console.log(`   Tokens refreshed & moved to Homepage Top: ${updatedCount}`);
  console.log(`   Failed/Removed: ${failedCount}`);
  console.log(`   Final active catalog size: ${cleanCatalog.length}`);
  console.log('==================================================================\n');
}

async function startLoopMode() {
  const isLoop = process.argv.includes('--loop');
  await refreshAllExpiredTokens();

  if (isLoop) {
    console.log('🔄 Loop mode active: Next 140-worker refresh scheduled in 4 minutes...');
    setInterval(async () => {
      console.log('\n⏰ Starting 4-minute scheduled token refresh cycle...');
      await refreshAllExpiredTokens();
    }, 4 * 60 * 1000);
  }
}

startLoopMode();

