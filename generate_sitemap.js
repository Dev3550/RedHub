const fs = require('fs');
const path = require('path');

const CATALOG_FILE = path.join(__dirname, 'sample_videos.json');
const SITEMAP_FILE = path.join(__dirname, 'sitemap.xml');
const BASE_URL = 'https://exotichub.freeerentalagreement.com';

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function parseDurationSeconds(durStr) {
  if (!durStr) return 600; // default 10 mins
  const parts = String(durStr).split(':').map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return (parts[0] * 60) + parts[1];
  } else if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  }
  return 600;
}

function generateSitemap() {
  console.log('==================================================================');
  console.log('  🚀 Generating Google Video Sitemap XML for ExoticHub');
  console.log('==================================================================');

  if (!fs.existsSync(CATALOG_FILE)) {
    console.error('Catalog file missing:', CATALOG_FILE);
    return;
  }

  const catalog = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf-8'));
  console.log(`Processing ${catalog.length} videos into Google Video Sitemap...`);

  const categories = [
    'Brazzers', 'Indian', 'Desi', 'Mom', 'Anal', 'Latina', 'Interracial', 'Amateur',
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
    const catUrl = escapeXml(`${BASE_URL}/index.html?category=${encodeURIComponent(cat)}`);
    xml += `  <url>\n`;
    xml += `    <loc>${catUrl}</loc>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n\n`;
  }

  // 3. Video Detail Watch Pages with Google Video Schema
  for (const item of catalog) {
    const rawWatchUrl = `${BASE_URL}/watch.html?id=${encodeURIComponent(item.id)}`;
    const watchUrl = escapeXml(rawWatchUrl);
    const rawEmbedUrl = `${BASE_URL}/watch.html?id=${encodeURIComponent(item.id)}&embed=1`;
    const embedUrl = escapeXml(rawEmbedUrl);

    const title = escapeXml(item.title || 'ExoticHub HD Video');
    const category = escapeXml(item.category || 'Trending');
    const channel = escapeXml(item.channel || 'ExoticHub Creator');
    const description = escapeXml(`Watch ${item.title || 'HD Video'} on ExoticHub. High speed HLS streaming in ${item.category || 'Trending'} category.`);
    
    let rawThumb = item.poster_url || item.thumbnail_url || `${BASE_URL}/icon.png`;
    if (rawThumb.startsWith('//')) rawThumb = 'https:' + rawThumb;
    const thumbnailUrl = escapeXml(rawThumb);

    let rawStream = item.video_stream_url;
    if (rawStream && rawStream.startsWith('//')) rawStream = 'https:' + rawStream;
    const streamUrl = (rawStream && rawStream !== rawWatchUrl) ? escapeXml(rawStream) : null;
    
    const durationSec = parseDurationSeconds(item.duration);

    xml += `  <url>\n`;
    xml += `    <loc>${watchUrl}</loc>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.7</priority>\n`;
    xml += `    <video:video>\n`;
    xml += `      <video:thumbnail_loc>${thumbnailUrl}</video:thumbnail_loc>\n`;
    xml += `      <video:title>${title}</video:title>\n`;
    xml += `      <video:description>${description}</video:description>\n`;
    xml += `      <video:player_loc allow_embed="yes">${embedUrl}</video:player_loc>\n`;
    xml += `      <video:duration>${durationSec}</video:duration>\n`;
    xml += `      <video:publication_date>2026-09-13T00:00:00+00:00</video:publication_date>\n`;
    xml += `      <video:category>${category}</video:category>\n`;
    xml += `      <video:uploader>${channel}</video:uploader>\n`;
    xml += `      <video:tag>Brazzers</video:tag>\n`;
    xml += `      <video:tag>Brazzers HD</video:tag>\n`;
    xml += `      <video:tag>ExoticHub</video:tag>\n`;
    xml += `      <video:tag>ExoticHub Original</video:tag>\n`;
    xml += `      <video:tag>${category}</video:tag>\n`;
    xml += `    </video:video>\n`;
    xml += `  </url>\n\n`;
  }

  // 4. Legal & Trust Pages for Search Engine Authority
  const legalPages = ['dmca.html', 'privacy.html', 'terms.html'];
  for (const page of legalPages) {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}/${page}</loc>\n`;
    xml += `    <changefreq>monthly</changefreq>\n`;
    xml += `    <priority>0.5</priority>\n`;
    xml += `  </url>\n\n`;
  }

  xml += `</urlset>`;

  fs.writeFileSync(SITEMAP_FILE, xml, 'utf-8');
  console.log(`✅ Google Video Sitemap generated successfully: ${SITEMAP_FILE}`);
}

generateSitemap();

