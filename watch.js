// ==========================================================================
// HotTube Watch Page Logic & Native HLS/Smart Player (watch.js)
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
const qualityChips = document.getElementById('qualityChips');
const toggleEmbedBtn = document.getElementById('toggleEmbedBtn');

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

  // Setup Quality Control buttons
  setupQualityControls();

  // Setup Embed Switcher
  if (toggleEmbedBtn) {
    toggleEmbedBtn.addEventListener('click', () => {
      isEmbedMode = !isEmbedMode;
      switchPlayerMode(isEmbedMode);
    });
  }

  // Initialize Video Stream
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
 * Switch Player UI between Native Video Player and iFrame Embed Player
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
 * Load Smart Video Stream - Direct Native Playback Primary
 */
function loadSmartVideoStream(video) {
  const streamUrl = video.video_stream_url;
  
  if (!streamUrl || isEmbedMode) {
    switchPlayerMode(true);
    return;
  }

  // Native player error listener: switch to iframe embed only on hard error
  hlsVideoPlayer.onerror = () => {
    console.warn('Native video player error, switching to Embed player...');
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
      console.warn('Direct MP4 playback catch:', e.message);
    });
    return;
  }

  // HLS Stream (.m3u8) playback via HLS.js
  if (Hls.isSupported() && streamUrl.includes('.m3u8')) {
    hlsInstance = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90
    });

    hlsInstance.loadSource(streamUrl);
    hlsInstance.attachMedia(hlsVideoPlayer);

    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
      if (playerLoader) playerLoader.classList.add('hidden');
      hlsVideoPlayer.play().catch(e => console.warn('Autoplay prevented:', e.message));
    });

    hlsInstance.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        console.error('HLS Fatal Error:', data.type);
        if (playerLoader) playerLoader.classList.add('hidden');
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
 * Setup Video Quality Control Bar Buttons
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

    if (hlsInstance) {
      if (targetHeight === -1) {
        hlsInstance.currentLevel = -1; // Auto adaptive
      } else {
        const levels = hlsInstance.levels;
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
        }
      }
    }
  });
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
      window.open(`watch.html?id=${encodeURIComponent(rec.id)}`, '_blank');
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
