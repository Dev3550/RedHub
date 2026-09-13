const fs = require('fs');
const path = require('path');

const CATALOG_FILE = path.join(__dirname, 'sample_videos.json');
const SITEMAP_FILE = path.join(__dirname, 'sitemap.xml');
const BASE_URL = 'https://hottube.devendradubey61.workers.dev';

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function parseDurationSeconds(durStr) {
  if (!durStr) return 600; // default 10 mins
  const parts = durStr.split(':').map(Number);
  if (parts.length === 2) {
    return (parts[0] * 60) + parts[1];
  } else if (parts.length === 3) {
    return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  }
  return 600;
}

function generateSitemap() {
  console.log('==================================================================');
  console.log('  🚀 Generating Google Video Sitemap XML for HotTube');
  console.log('==================================================================');

  if (!fs.existsSync(CATALOG_FILE)) {
    console.error('Catalog file missing:', CATALOG_FILE);
    return;
  }

  const catalog = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf-8'));
  console.log(`Processing ${catalog.length} videos into Google Video Sitemap...`);

  const categories = [
    'Indian', 'Desi', 'Mom', 'Anal', 'Latina', 'Interracial', 'Amateur',
    'Blowjob', 'Big Tits', 'Asian', 'MILF', 'Mature', 'Creampie', 'POV',
    'Group', 'Hardcore', 'Teen', 'Threesome', 'Solo', 'Lesbian', 'Blonde', 'Brunette'
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n\n`;

  // 1. Homepage Entry
  xml += `  <url>\n`;
  xml += `    <loc>${BASE_URL}/</loc>\n`;
  xml += `    <changefreq>always</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n\n`;

  // 2. Top Category Pages
  for (const cat of categories) {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}/index.html?category=${encodeURIComponent(cat)}</loc>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n\n`;
  }

  // 3. Video Detail Watch Pages with Google Video Schema
  for (const item of catalog) {
    const watchUrl = `${BASE_URL}/watch.html?id=${encodeURIComponent(item.id)}`;
    const title = escapeXml(item.title);
    const category = escapeXml(item.category || 'Trending');
    const channel = escapeXml(item.channel || 'HotTube Creator');
    const description = escapeXml(`Watch ${item.title} video. Channel: ${item.channel || 'HotTube Creator'}. Category: ${item.category || 'Trending'}. Stream HD videos online on HotTube.`);
    const thumbnailUrl = escapeXml(item.poster_url || item.thumbnail_url);
    const streamUrl = escapeXml(item.video_stream_url);
    const durationSec = parseDurationSeconds(item.duration);

    xml += `  <url>\n`;
    xml += `    <loc>${watchUrl}</loc>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.7</priority>\n`;
    xml += `    <video:video>\n`;
    xml += `      <video:thumbnail_loc>${thumbnailUrl}</video:thumbnail_loc>\n`;
    xml += `      <video:title>${title}</video:title>\n`;
    xml += `      <video:description>${description}</video:description>\n`;
    if (streamUrl) {
      xml += `      <video:content_loc>${streamUrl}</video:content_loc>\n`;
    }
    xml += `      <video:player_loc>${watchUrl}</video:player_loc>\n`;
    xml += `      <video:duration>${durationSec}</video:duration>\n`;
    xml += `      <video:publication_date>2026-09-13T00:00:00+00:00</video:publication_date>\n`;
    xml += `      <video:category>${category}</video:category>\n`;
    xml += `      <video:uploader>${channel}</video:uploader>\n`;
    xml += `    </video:video>\n`;
    xml += `  </url>\n\n`;
  }

  xml += `</urlset>`;

  fs.writeFileSync(SITEMAP_FILE, xml, 'utf-8');
  console.log(`✅ Google Video Sitemap generated successfully: ${SITEMAP_FILE}`);
}

generateSitemap();
