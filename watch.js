// ==========================================================================
// HotTube Watch Page Logic & Smart Self-Healing Native HLS Player (watch.js)
// ==========================================================================

const FALLBACK_CATALOG = [
  {
    "index": 1,
    "id": "27671902",
    "title": "Step Sister and Step Brother shared bed and Hard Rough Fuck",
    "category": "Indian",
    "duration": "7:48",
    "thumbnail_url": "https://ic-vt-nss.xhpingcdn.com/a/OTk4ZjQyMjIwYjJlYmY1NWEzN2FhM2M2ZDZjZDkyMjk/s(w:526,h:298),webp/027/671/902/1280x720.17600221.jpg",
    "poster_url": "https://ic-vt-nss.xhpingcdn.com/a/MjI1YzI0YmVjMTQxMTViZDhkNmU3MTBiMDkwMTdiZmI/s(w:1280,h:720),webp/027/671/902/1280x720.17600221.jpg",
    "page_url": "https://xhaccess.com/videos/step-sister-and-step-brother-shared-bed-and-hard-rough-fuck-xhHesPv",
    "video_stream_url": "https://video-nss.xhpingcdn.com/6jGgdiUQfQLz9UimjsbVjA==,1789210800/media=hls4/multi=256x144:144p:,426x240:240p:,854x480:480p:,1280x720:720p:,1920x1080:1080p:/027/671/902/_TPL_.av1.mp4.m3u8",
    "views": 21358612,
    "channel": "Shashi X"
  }
];

let catalogData = [];
let currentVideo = null;
let hlsInstance = null;
let isRefreshingToken = false;

// DOM Elements
const hlsVideoPlayer = document.getElementById('hlsVideoPlayer');
const playerLoader = document.getElementById('playerLoader');
const watchTitle = document.getElementById('watchTitle');
const watchChannel = document.getElementById('watchChannel');
const watchViews = document.getElementById('watchViews');
const watchDuration = document.getElementById('watchDuration');
const watchCategory = document.getElementById('watchCategory');
const recommendedGrid = document.getElementById('recommendedGrid');
const searchInput = document.getElementById('searchInput');
const qualityChips = document.getElementById('qualityChips');

/**
 * Initialize Watch Page
 */
async function initWatchPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('id');

  try {
    const res = await fetch('./sample_videos.json');
    if (res.ok) {
      catalogData = await res.json();
    } else {
      catalogData = FALLBACK_CATALOG;
    }
  } catch (_) {
    catalogData = FALLBACK_CATALOG;
  }

  if (!catalogData || catalogData.length === 0) {
    catalogData = FALLBACK_CATALOG;
  }

  // Find target video by ID
  currentVideo = catalogData.find(v => String(v.id) === String(videoId));

  if (!currentVideo) {
    currentVideo = catalogData[0];
  }

  // Set Page Title
  document.title = `${currentVideo.title} - HotTube`;

  // Render Video Information
  watchTitle.textContent = currentVideo.title;
  watchChannel.innerHTML = `<i class="fa-regular fa-circle-user"></i> ${currentVideo.channel || 'HotTube Creator'}`;
  watchViews.innerHTML = `<i class="fa-regular fa-eye"></i> ${formatViews(currentVideo.views)} views`;
  watchDuration.innerHTML = `<i class="fa-regular fa-clock"></i> ${currentVideo.duration}`;
  watchCategory.innerHTML = `<i class="fa-solid fa-layer-group"></i> Category: ${currentVideo.category || 'Trending'}`;
  hlsVideoPlayer.poster = currentVideo.poster_url || currentVideo.thumbnail_url;

  // Setup Quality Controls
  setupQualityControls();

  // Initialize Native HLS / Video Stream
  loadHlsStream(currentVideo.video_stream_url);

  // Render Category Based Recommended Videos
  renderRecommendations(currentVideo);

  // Search input redirect
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && searchInput.value.trim().length > 0) {
        window.location.href = `index.html?search=${encodeURIComponent(searchInput.value.trim())}`;
      }
    });
  }
}

/**
 * Self-Healing: Refresh Expired Stream Token from Source Page
 */
async function refreshStreamAndReload() {
  if (isRefreshingToken || !currentVideo || !currentVideo.page_url) return;
  isRefreshingToken = true;

  if (playerLoader) {
    playerLoader.classList.remove('hidden');
    const span = playerLoader.querySelector('span');
    if (span) span.textContent = 'Refreshing Stream Token...';
  }

  console.log('🔄 Expired stream token detected. Refreshing token on-demand from source page...');
  const freshUrl = await fetchFreshStreamUrl(currentVideo.page_url);

  if (freshUrl && freshUrl !== currentVideo.video_stream_url) {
    console.log('✅ Fresh working stream token obtained:', freshUrl);
    currentVideo.video_stream_url = freshUrl;
    isRefreshingToken = false;
    loadHlsStream(freshUrl);
  } else {
    isRefreshingToken = false;
    if (playerLoader) playerLoader.classList.add('hidden');
    console.warn('Could not refresh stream token.');
  }
}

/**
 * Fetch fresh stream URL from video detail page
 */
async function fetchFreshStreamUrl(pageUrl) {
  try {
    const res = await fetch(pageUrl);
    if (!res.ok) return null;
    const html = await res.text();

    const initialsMatch = html.match(/window\.initials\s*=\s*(\{.*?\});\s*<\/script>/s);
    if (initialsMatch && initialsMatch[1]) {
      const parsed = JSON.parse(initialsMatch[1]);
      const videoModel = parsed?.videoModel || parsed?.video || {};
      if (videoModel.sources && videoModel.sources.hls) {
        return videoModel.sources.hls;
      }
    }

    const m3u8Match = html.match(/(https?:\\?\/\\?\/[^"' ]+\.m3u8[^"' ]*)/i);
    if (m3u8Match) {
      return m3u8Match[1].replace(/\\/g, '');
    }
  } catch (err) {
    console.warn('Failed to fetch fresh stream URL:', err.message);
  }
  return null;
}

/**
 * Load HLS Stream via HLS.js or Native HTML5 Video
 */
function loadHlsStream(streamUrl) {
  if (playerLoader) playerLoader.classList.remove('hidden');

  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }

  if (!streamUrl) {
    refreshStreamAndReload();
    return;
  }

  // Direct MP4 playback in Native HTML5 Video Player
  if (streamUrl.includes('.mp4')) {
    hlsVideoPlayer.src = streamUrl;
    
    const onLoaded = () => {
      if (playerLoader) playerLoader.classList.add('hidden');
      hlsVideoPlayer.removeEventListener('loadeddata', onLoaded);
    };
    hlsVideoPlayer.addEventListener('loadeddata', onLoaded);
    
    hlsVideoPlayer.play().then(() => {
      if (playerLoader) playerLoader.classList.add('hidden');
    }).catch(e => {
      if (playerLoader) playerLoader.classList.add('hidden');
      console.warn('Native MP4 play catch:', e.message);
      refreshStreamAndReload();
    });
    return;
  }

  // HLS Stream (.m3u8) playback via HLS.js
  if (Hls.isSupported() && streamUrl.includes('.m3u8')) {
    hlsInstance = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90,
      capLevelToPlayerSize: false
    });

    hlsInstance.loadSource(streamUrl);
    hlsInstance.attachMedia(hlsVideoPlayer);

    hlsInstance.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
      if (playerLoader) playerLoader.classList.add('hidden');
      console.log('HLS Manifest Parsed! Available Quality Levels:', data.levels);

      // Start playing
      hlsVideoPlayer.play().catch(e => console.warn('Autoplay prevented:', e.message));
    });

    hlsInstance.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        console.error('HLS Fatal Error detected:', data.type, data.details);
        // Automatically self-heal on network/expired token error
        refreshStreamAndReload();
      }
    });

  } else {
    hlsVideoPlayer.src = streamUrl;
    hlsVideoPlayer.addEventListener('loadedmetadata', () => {
      if (playerLoader) playerLoader.classList.add('hidden');
      hlsVideoPlayer.play().catch(_ => {});
    });
    hlsVideoPlayer.onerror = () => {
      refreshStreamAndReload();
    };
    if (playerLoader) playerLoader.classList.add('hidden');
  }
}

/**
 * Setup Interactive Quality Control Bar for HLS Streams (1080p, 720p, 480p, 360p, Auto)
 */
function setupQualityControls() {
  if (!qualityChips) return;

  qualityChips.addEventListener('click', (e) => {
    const btn = e.target.closest('.q-chip');
    if (!btn) return;

    // Update UI active chip
    const chips = qualityChips.querySelectorAll('.q-chip');
    chips.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');

    const targetHeight = parseInt(btn.dataset.quality, 10);
    setHlsQuality(targetHeight);
  });
}

/**
 * Force HLS Quality Level Switch in Hls.js Engine
 */
function setHlsQuality(targetHeight) {
  if (!hlsInstance) {
    console.warn('Quality switch requested, but HLS instance is not active for this video format.');
    return;
  }

  if (targetHeight === -1) {
    hlsInstance.currentLevel = -1; // Auto adaptive
    hlsInstance.loadLevel = -1;
    console.log('⚡ HLS Quality set to Auto (Adaptive)');
    return;
  }

  const levels = hlsInstance.levels;
  if (!levels || levels.length === 0) return;

  let matchedIndex = -1;
  let minDiff = Infinity;

  levels.forEach((level, idx) => {
    const diff = Math.abs(level.height - targetHeight);
    if (diff < minDiff) {
      minDiff = diff;
      matchedIndex = idx;
    }
  });

  if (matchedIndex !== -1) {
    hlsInstance.currentLevel = matchedIndex;
    hlsInstance.nextLevel = matchedIndex;
    hlsInstance.loadLevel = matchedIndex;
    console.log(`🎬 HLS Quality switched to Level ${matchedIndex} (${levels[matchedIndex].height}p @ ${Math.round(levels[matchedIndex].bitrate / 1000)} kbps)`);
  }
}

/**
 * Render Recommended Videos matching current video's category
 */
function renderRecommendations(video) {
  if (!recommendedGrid) return;
  recommendedGrid.innerHTML = '';

  const catLower = (video.category || '').toLowerCase();
  
  // Filter by matching category or title keyword, excluding current video
  let recs = catalogData.filter(v => String(v.id) !== String(video.id) && (
    (v.category && v.category.toLowerCase() === catLower) ||
    (v.title && catLower && v.title.toLowerCase().includes(catLower))
  ));

  // Fallback to general videos if category recommendations count is low
  if (recs.length < 4) {
    const fallbackRecs = catalogData.filter(v => String(v.id) !== String(video.id) && !recs.includes(v));
    recs = [...recs, ...fallbackRecs];
  }

  // Display top 12 recommendations
  recs.slice(0, 12).forEach(rec => {
    const card = document.createElement('article');
    card.className = 'video-card';
    card.innerHTML = `
      <div class="thumb-container">
        <img src="${rec.thumbnail_url}" alt="${escapeHtml(rec.title)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80'">
        <span class="badge-duration">${rec.duration}</span>
        <div class="play-overlay">
          <div class="play-icon-btn">
            <i class="fa-solid fa-play"></i>
          </div>
        </div>
      </div>
      <div class="card-content">
        <h3 class="card-title">${escapeHtml(rec.title)}</h3>
        <div class="card-meta">
          <span class="card-channel"><i class="fa-regular fa-circle-user"></i> ${escapeHtml(rec.channel || 'HotTube Creator')}</span>
          <span class="card-views"><i class="fa-regular fa-eye"></i> ${formatViews(rec.views)}</span>
        </div>
      </div>
    `;

    card.onclick = () => {
      window.location.href = `watch.html?id=${encodeURIComponent(rec.id)}`;
    };

    recommendedGrid.appendChild(card);
  });
}

function formatViews(num) {
  if (!num || isNaN(num)) return '10K+';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

document.addEventListener('DOMContentLoaded', initWatchPage);
