// ==========================================================================
// HotTube Watch Page Logic & Fail-Safe Smart Native Player (watch.js)
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
let isEmbedMode = false;

// DOM Elements
const hlsVideoPlayer = document.getElementById('hlsVideoPlayer');
const embedVideoPlayer = document.getElementById('embedVideoPlayer');
const playerLoader = document.getElementById('playerLoader');
const watchTitle = document.getElementById('watchTitle');
const watchChannel = document.getElementById('watchChannel');
const watchViews = document.getElementById('watchViews');
const watchDuration = document.getElementById('watchDuration');
const watchCategory = document.getElementById('watchCategory');
const recommendedGrid = document.getElementById('recommendedGrid');
const searchInput = document.getElementById('searchInput');

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

  // Setup Resolution Quality Dropdown Listener
  setupQualityControls();

  // Initialize Native HLS / Video Stream
  loadSmartVideoStream(currentVideo);

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
 * Switch Player UI between Native Video Player and Sandboxed iFrame Embed Player
 */
function switchPlayerMode(embed) {
  isEmbedMode = embed;
  
  if (isEmbedMode) {
    if (hlsVideoPlayer) {
      hlsVideoPlayer.pause();
      hlsVideoPlayer.classList.add('hidden');
    }
    if (embedVideoPlayer) {
      embedVideoPlayer.classList.remove('hidden');
      
      let embedSrc = currentVideo.embed_url || currentVideo.page_url || currentVideo.video_stream_url;
      if (embedVideoPlayer.src !== embedSrc) {
        embedVideoPlayer.src = embedSrc;
      }
    }
    if (playerLoader) playerLoader.classList.add('hidden');
  } else {
    if (embedVideoPlayer) {
      embedVideoPlayer.src = 'about:blank';
      embedVideoPlayer.classList.add('hidden');
    }
    if (hlsVideoPlayer) {
      hlsVideoPlayer.classList.remove('hidden');
    }
    loadHlsStream(currentVideo.video_stream_url);
  }
}

/**
 * Load Smart Video Stream with Sandboxed Embed Fallback on Fatal Error
 */
function loadSmartVideoStream(video) {
  const streamUrl = video.video_stream_url;
  
  if (!streamUrl || isEmbedMode) {
    switchPlayerMode(true);
    return;
  }

  // Native player error listener: switch to sandboxed iframe embed if direct load errors
  hlsVideoPlayer.onerror = () => {
    console.warn('Native video error detected. Switching to Sandboxed Embed Player...');
    switchPlayerMode(true);
  };

  loadHlsStream(streamUrl);
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
    switchPlayerMode(true);
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
      switchPlayerMode(true);
    });
    return;
  }

  // HLS Stream (.m3u8) playback via HLS.js with Mobile Ultra-Smooth Buffer Optimization
  if (Hls.isSupported() && streamUrl.includes('.m3u8')) {
    hlsInstance = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
      autoStartLoad: true,
      startLevel: -1,                  // Auto adaptive initial level for instant play
      backBufferLength: 60,
      maxBufferLength: 30,             // Fast initial buffer fill (30s)
      maxMaxBufferLength: 90,          // Max 90s buffer
      maxBufferSize: 60 * 1024 * 1024, // 60 MB memory allocation
      maxBufferHole: 0.2,
      highBufferWatchdogPeriod: 1,
      progressive: true,
      capLevelToPlayerSize: false
    });

    hlsInstance.loadSource(streamUrl);
    hlsInstance.attachMedia(hlsVideoPlayer);

    hlsInstance.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
      if (playerLoader) playerLoader.classList.add('hidden');
      console.log('HLS Manifest Parsed! Available Quality Levels:', data.levels);

      // Dynamically populate resolution quality dropdown from manifest levels
      populateQualityDropdown(data.levels);

      // Start playing immediately
      hlsVideoPlayer.play().catch(e => console.warn('Autoplay prevented:', e.message));
    });

    hlsInstance.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        console.error('HLS Fatal Error detected:', data.type, data.details);
        if (playerLoader) playerLoader.classList.add('hidden');
        // Fallback to Sandboxed Embed Mode on expired/stuck stream token
        switchPlayerMode(true);
      }
    });

  } else {
    hlsVideoPlayer.src = streamUrl;
    hlsVideoPlayer.addEventListener('loadedmetadata', () => {
      if (playerLoader) playerLoader.classList.add('hidden');
      hlsVideoPlayer.play().catch(_ => {});
    });
    if (playerLoader) playerLoader.classList.add('hidden');
  }
}

/**
 * Dynamically Populate Quality Dropdown based on actual stream resolutions
 */
function populateQualityDropdown(levels) {
  const qualitySelect = document.getElementById('qualitySelect');
  if (!qualitySelect || !levels || levels.length === 0) return;

  qualitySelect.innerHTML = '<option value="-1">⚡ Auto (Adaptive HD/SD)</option>';

  // Sort levels descending by resolution height
  const levelItems = levels.map((lvl, index) => ({
    index,
    height: lvl.height || 0,
    width: lvl.width || 0,
    bitrate: lvl.bitrate || 0
  })).sort((a, b) => b.height - a.height);

  const addedHeights = new Set();

  levelItems.forEach(lvl => {
    if (lvl.height <= 0 || addedHeights.has(lvl.height)) return;
    addedHeights.add(lvl.height);

    let icon = '📱';
    if (lvl.height >= 1080) icon = '👑';
    else if (lvl.height >= 720) icon = '📺';
    else if (lvl.height >= 480) icon = '🎥';

    let tag = lvl.height >= 720 ? 'HD' : (lvl.height >= 480 ? 'SD' : 'Saver');

    const opt = document.createElement('option');
    opt.value = lvl.index;
    opt.textContent = `${icon} ${lvl.height}p ${tag}`;
    qualitySelect.appendChild(opt);
  });
}

/**
 * Setup Interactive Quality Control Dropdown Listener
 */
function setupQualityControls() {
  const qualitySelect = document.getElementById('qualitySelect');
  if (!qualitySelect) return;

  qualitySelect.addEventListener('change', (e) => {
    const selectedLevel = parseInt(e.target.value, 10);
    setHlsQuality(selectedLevel);
  });
}

/**
 * Force HLS Quality Level Switch Live in Hls.js Engine
 */
function setHlsQuality(selectedLevel) {
  if (!hlsInstance) {
    console.warn('Quality switch requested, but HLS instance is not active.');
    return;
  }

  if (selectedLevel === -1) {
    hlsInstance.currentLevel = -1; // Auto adaptive
    hlsInstance.loadLevel = -1;
    hlsInstance.nextLevel = -1;
    console.log('⚡ HLS Quality set to Auto (Adaptive)');
    return;
  }

  if (selectedLevel >= 0 && selectedLevel < hlsInstance.levels.length) {
    hlsInstance.currentLevel = selectedLevel;
    hlsInstance.nextLevel = selectedLevel;
    hlsInstance.loadLevel = selectedLevel;
    const targetLvl = hlsInstance.levels[selectedLevel];
    console.log(`🎬 HLS Quality switched live to Level index ${selectedLevel} (${targetLvl ? targetLvl.height : 'custom'}p)`);
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
