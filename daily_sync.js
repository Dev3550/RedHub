const fs = require('fs');
const path = require('path');

console.log('======================================================');
console.log(' 🔄 ExoticHub Daily Automated Video Sync Script ');
console.log('======================================================');

// Scrapes newest pages across top high-volume categories
const dailyScraperPath = path.join(__dirname, 'scratch', 'scrape_massive_80k.js');
const alternativePath = path.join(__dirname, 'scraper_cluster.js');

const targetScript = fs.existsSync(dailyScraperPath) ? dailyScraperPath : alternativePath;

console.log(`📡 Executing daily scraping pipeline using: ${targetScript}`);
require('child_process').execSync(`node "${targetScript}"`, { stdio: 'inherit' });

console.log('✅ Daily sync completed successfully! Total catalog updated.');
