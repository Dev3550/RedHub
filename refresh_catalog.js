const fs = require('fs');
const path = require('path');
const { fetchHtml, extractStreamDetails } = require('./utils');

const CATALOG_FILE = path.join(__dirname, 'sample_videos.json');

async function refreshAllExpiredTokens() {
  console.log('==================================================================');
  console.log('  🚀 Refreshing Catalog Stream Tokens in sample_videos.json');
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

  for (let i = 0; i < catalog.length; i++) {
    const item = catalog[i];
    const streamUrl = item.video_stream_url;

    let isExpired = false;

    if (!streamUrl) {
      isExpired = true;
    } else {
      try {
        const checkRes = await fetch(streamUrl, { method: 'HEAD' });
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
      console.log(`[${i + 1}/${catalog.length}] 🔄 Token expired for video ID ${item.id} [${item.category}]: ${item.title.substring(0, 30)}...`);
      try {
        const freshDetails = await extractStreamDetails(item.page_url);
        if (freshDetails && freshDetails.stream_url) {
          item.video_stream_url = freshDetails.stream_url;
          updatedCount++;
          console.log(`   ✅ Refreshed stream URL: ${freshDetails.stream_url.substring(0, 60)}...`);
        } else {
          failedCount++;
          console.warn(`   ⚠️ Could not fetch fresh stream URL for ID ${item.id}`);
        }
      } catch (err) {
        failedCount++;
        console.error(`   ❌ Error refreshing ID ${item.id}: ${err.message}`);
      }

      // Save checkpoint every 10 updates
      if (updatedCount % 10 === 0) {
        fs.writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2), 'utf-8');
      }
    }
  }

  // Filter out non-xhaccess items or items that still have invalid/missing stream URLs
  const cleanCatalog = catalog.filter(v => (v.page_url || '').includes('xhaccess.com') && v.video_stream_url && v.video_stream_url.includes('.m3u8')).map((v, idx) => ({
    ...v,
    index: idx + 1
  }));

  fs.writeFileSync(CATALOG_FILE, JSON.stringify(cleanCatalog, null, 2), 'utf-8');

  console.log('\n==================================================================');
  console.log(`✅ Token Refresh Complete!`);
  console.log(`   Valid active streams: ${validCount}`);
  console.log(`   Tokens refreshed: ${updatedCount}`);
  console.log(`   Failed/Removed: ${failedCount}`);
  console.log(`   Final active catalog size: ${cleanCatalog.length}`);
  console.log('==================================================================\n');
}

refreshAllExpiredTokens();
