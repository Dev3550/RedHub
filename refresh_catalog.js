const fs = require('fs');
const path = require('path');
const { fetchHtml, extractStreamDetails } = require('./utils');

const CATALOG_FILE = path.join(__dirname, 'sample_videos.json');
const CONCURRENCY = 15; // 15 Parallel Async Workers

async function refreshAllExpiredTokens() {
  console.log('==================================================================');
  console.log('  🚀 Fast Parallel Refreshing Catalog Stream Tokens');
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

          if (checkRes.status === 410 || checkRes.status === 404 || checkRes.status === 403) {
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
      if (processedCount % 100 === 0 || queue.length === 0) {
        console.log(` ⏳ Audited [${processedCount}/${catalog.length}] items | Valid: ${validCount} | Refreshed: ${updatedCount}`);
      }
    }
  }

  const workers = [];
  for (let i = 1; i <= CONCURRENCY; i++) {
    workers.push(worker(i));
  }

  await Promise.all(workers);

  // Filter out non-xhaccess items or items that still have invalid/missing stream URLs
  const cleanCatalog = catalog.filter(v => (v.page_url || '').includes('xhaccess.com') && v.video_stream_url && v.video_stream_url.includes('.m3u8')).map((v, idx) => ({
    ...v,
    index: idx + 1
  }));

  fs.writeFileSync(CATALOG_FILE, JSON.stringify(cleanCatalog, null, 2), 'utf-8');

  console.log('\n==================================================================');
  console.log(`✅ Parallel Token Refresh Complete!`);
  console.log(`   Valid active streams: ${validCount}`);
  console.log(`   Tokens refreshed: ${updatedCount}`);
  console.log(`   Failed/Removed: ${failedCount}`);
  console.log(`   Final active catalog size: ${cleanCatalog.length}`);
  console.log('==================================================================\n');
}

refreshAllExpiredTokens();
