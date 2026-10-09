// ==========================================================================
// ExoticHub Watch Page Logic & Fail-Safe Smart Native Player (watch.js)
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
    const res = await fetch('./sample_videos.json?v=' + Date.now(), { cache: 'no-cache' });
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

  // Apply Complete SEO Keyword Stacking, OpenGraph Tags & JSON-LD VideoObject Schema
  applySeoMetadata(currentVideo);

  // Render Video Information
  watchTitle.textContent = currentVideo.title;
  watchChannel.innerHTML = `<i class="fa-regular fa-circle-user"></i> ${currentVideo.channel || 'ExoticHub Creator'}`;
  watchViews.innerHTML = `<i class="fa-regular fa-eye"></i> ${formatViews(currentVideo.views)} views`;
  watchDuration.innerHTML = `<i class="fa-regular fa-clock"></i> ${currentVideo.duration}`;
  watchCategory.innerHTML = `<i class="fa-solid fa-layer-group"></i> Category: ${currentVideo.category || 'Trending'}`;
  hlsVideoPlayer.poster = currentVideo.poster_url || currentVideo.thumbnail_url;

  // Setup Resolution Quality Dropdown Listener
  setupQualityControls();

  // Initialize Native HLS / Video Stream with ExoClick Custom VAST Pre-Roll
  playCustomVastPreRoll(currentVideo, () => {
    loadSmartVideoStream(currentVideo);
  });

  // Render Category Based Recommended Videos
  renderRecommendations(currentVideo);
}

/**
 * Dynamically Apply SEO Metadata, Canonical Links, Social Meta Tags & Google JSON-LD Schema
 */
function applySeoMetadata(video) {
  if (!video) return;

  const titleClean = (video.title || 'Exclusive HLS Video').replace(/[^\w\s-]/gi, '');
  const categoryStr = video.category || 'Trending';
  const channelStr = video.channel || 'ExoticHub Creator';

  const pageTitle = `${video.title} - ${categoryStr} HD Video Stream | ExoticHub`;
  const pageDesc = `Watch ${video.title} on ExoticHub. HD streaming from ${channelStr} in ${categoryStr} category. High-speed HLS playback available globally.`;
  const pageUrl = `https://exotichub.freeerentalagreement.com/watch.html?id=${encodeURIComponent(video.id)}`;
  // Safe Brand Logo image for Social Previews to prevent search/social crawler indexing blocks
  const safeBrandImage = 'https://exotichub.freeerentalagreement.com/icon.png';
  const videoPoster = video.poster_url || video.thumbnail_url || safeBrandImage;

  // 1. Page Title & Meta Description
  document.title = pageTitle;
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.name = 'description';
    document.head.appendChild(metaDesc);
  }
  metaDesc.content = pageDesc;

  // Dynamic Long-Tail Keyword Stacking per Video
  const longTailKeywords = [
    titleClean,
    `${categoryStr} video`,
    `ExoticHub ${categoryStr}`,
    `watch ${titleClean} online`,
    `free ${categoryStr} stream`,
    `${channelStr} videos`,
    `hd ${categoryStr} playback`,
    `trending ${categoryStr} clips`,
    `exotichub ${titleClean}`
  ].join(', ');

  const metaKeywordsEl = document.getElementById('metaKeywords');
  if (metaKeywordsEl) {
    metaKeywordsEl.setAttribute('content', longTailKeywords);
  }

  // 2. Canonical URL
  const canonicalEl = document.getElementById('canonicalUrl');
  if (canonicalEl) canonicalEl.href = pageUrl;

  // 3. OpenGraph Social Meta Tags (Uses Safe Brand Image)
  const setMetaProp = (id, prop, content) => {
    let el = document.getElementById(id) || document.querySelector(`meta[property="${prop}"]`);
    if (el) el.setAttribute('content', content);
  };
  setMetaProp('ogSiteName', 'og:site_name', 'ExoticHub');
  setMetaProp('ogType', 'og:type', 'video.other');
  setMetaProp('ogTitle', 'og:title', pageTitle);
  setMetaProp('ogDescription', 'og:description', pageDesc);
  setMetaProp('ogImage', 'og:image', safeBrandImage);
  setMetaProp('ogUrl', 'og:url', pageUrl);

  // 4. Twitter Cards (Uses Safe Brand Image)
  const setMetaName = (id, name, content) => {
    let el = document.getElementById(id) || document.querySelector(`meta[name="${name}"]`);
    if (el) el.setAttribute('content', content);
  };
  setMetaName('twitterCard', 'twitter:card', 'summary_large_image');
  setMetaName('twitterSite', 'twitter:site', '@exotichubmedia');
  setMetaName('twitterTitle', 'twitter:title', pageTitle);
  setMetaName('twitterDescription', 'twitter:description', pageDesc);
  setMetaName('twitterImage', 'twitter:image', safeBrandImage);

  // 5. Google JSON-LD VideoObject Structured Data Schema
  const schemaScript = document.getElementById('jsonLdVideoSchema');
  if (schemaScript) {
    const durationParts = (video.duration || '10:00').split(':').map(Number);
    let isoDuration = 'PT10M0S';
    if (durationParts.length === 2) {
      isoDuration = `PT${durationParts[0]}M${durationParts[1]}S`;
    } else if (durationParts.length === 3) {
      isoDuration = `PT${durationParts[0]}H${durationParts[1]}M${durationParts[2]}S`;
    }

    const jsonLdData = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "name": video.title,
      "description": pageDesc,
      "thumbnailUrl": [videoPoster],
      "uploadDate": "2026-09-13T00:00:00+00:00",
      "duration": isoDuration,
      "contentUrl": video.video_stream_url || pageUrl,
      "embedUrl": pageUrl,
      "publisher": {
        "@type": "Organization",
        "name": "ExoticHub",
        "logo": {
          "@type": "ImageObject",
          "url": "https://exotichub.freeerentalagreement.com/icon.png"
        }
      }
    };
    schemaScript.textContent = JSON.stringify(jsonLdData, null, 2);
  }
}

  // Search input redirect
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && searchInput.value.trim().length > 0) {
        window.location.href = `index.html?search=${encodeURIComponent(searchInput.value.trim())}`;
      }
    });
  }

/**
 * Load Smart Video Stream directly into HotTube Video Player
 */
function loadSmartVideoStream(video) {
  const streamUrl = video.video_stream_url;
  if (!streamUrl) {
    console.warn('No stream URL available for video ID:', video.id);
    if (playerLoader) playerLoader.classList.add('hidden');
    return;
  }
  loadHlsStream(streamUrl);
}

/**
 * Load HLS Stream via HLS.js or Native HTML5 Video Player
 */
function loadHlsStream(streamUrl) {
  if (playerLoader) playerLoader.classList.remove('hidden');

  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }

  if (!streamUrl) {
    if (playerLoader) playerLoader.classList.add('hidden');
    return;
  }

  const startPlayback = () => {
    if (!hlsVideoPlayer) return;

    const playPromise = hlsVideoPlayer.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        if (playerLoader) playerLoader.classList.add('hidden');
      }).catch(err => {
        console.warn('Unmuted play blocked by browser, attempting muted autoplay fallback:', err.message);
        hlsVideoPlayer.muted = true;
        hlsVideoPlayer.play().then(() => {
          if (playerLoader) playerLoader.classList.add('hidden');
        }).catch(err2 => {
          console.warn('Playback requires user interaction on native controls:', err2.message);
          if (playerLoader) playerLoader.classList.add('hidden');
        });
      });
    }
  };

  hlsVideoPlayer.onplay = () => {
    if (playerLoader) playerLoader.classList.add('hidden');
    if (typeof window.closePauseAd === 'function') {
      window.closePauseAd();
    }
  };

  hlsVideoPlayer.onpause = () => {
    if (!hlsVideoPlayer.ended && adHasPlayed && hlsVideoPlayer.currentTime > 1) {
      if (typeof window.showPauseAd === 'function') {
        window.showPauseAd();
      }
    }
  };

  // Direct MP4 playback in Native HTML5 Video Player
  if (streamUrl.includes('.mp4')) {
    hlsVideoPlayer.src = streamUrl;
    startPlayback();
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
      console.log('HLS Manifest Parsed! Available Quality Levels:', data ? data.levels : []);

      if (data && data.levels) {
        populateQualityDropdown(data.levels);
      }

      startPlayback();
    });

    hlsInstance.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        console.error('HLS Fatal Error detected:', data.type, data.details);
        if (playerLoader) playerLoader.classList.add('hidden');
        
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.warn('Network error encountered, attempting reload...');
            hlsInstance.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.warn('Media error encountered, attempting recovery...');
            hlsInstance.recoverMediaError();
            break;
          default:
            hlsInstance.destroy();
            hlsVideoPlayer.src = streamUrl;
            startPlayback();
            break;
        }
      }
    });

  } else {
    hlsVideoPlayer.src = streamUrl;
    startPlayback();
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
          <span class="card-channel"><i class="fa-regular fa-circle-user"></i> ${escapeHtml(rec.channel || 'ExoticHub Creator')}</span>
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

// Setup Watch Page Event Initialization
document.addEventListener('DOMContentLoaded', () => {
  initWatchPage();
});

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ==========================================================================
// Custom ExoClick VAST 4.3 Pre-Roll & Pause Ad Player Engine
// ==========================================================================
const VAST_URLS = [
  "https://s.magsrv.com/v1/vast.php?idz=6050694",
  "https://s.magsrv.com/v1/vast.php?idz=6051450",
  "https://s.magsrv.com/v1/vast.php?idz=6051448"
];
const PAUSE_ZONE_ID = "6049564";
const SKIP_COUNTDOWN = 6;

let adHasPlayed = false;
let skipTimer = null;
let trackingEvents = { impressions: [], tracking: [], clickThrough: null };

function firePixel(url) {
  if (!url) return;
  const img = new Image();
  img.src = url.trim();
}

async function loadVastAd() {
  for (let url of VAST_URLS) {
    try {
      const response = await fetch(url).catch(() => null);
      if (!response) continue;
      const text = await response.text().catch(() => null);
      if (!text || !text.includes('<MediaFile')) continue;

      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "text/xml");

      const mediaFiles = xml.querySelectorAll("MediaFile");
      let adMediaUrl = null;
      for (let mf of mediaFiles) {
        const src = (mf.textContent || '').trim();
        if (src && (src.includes('.mp4') || mf.getAttribute('type') === 'video/mp4')) {
          adMediaUrl = src;
          break;
        }
      }
      if (!adMediaUrl && mediaFiles.length > 0) {
        adMediaUrl = (mediaFiles[0].textContent || '').trim();
      }

      if (!adMediaUrl) continue;

      trackingEvents.impressions = [];
      trackingEvents.tracking = [];

      xml.querySelectorAll("Impression").forEach(el => trackingEvents.impressions.push(el.textContent.trim()));
      xml.querySelectorAll("Tracking").forEach(el => {
        trackingEvents.tracking.push({ event: el.getAttribute("event"), url: el.textContent.trim() });
      });

      const clickThrough = xml.querySelector("ClickThrough");
      trackingEvents.clickThrough = clickThrough ? clickThrough.textContent.trim() : null;

      return adMediaUrl;
    } catch (e) {
      console.error("VAST Fetch Error:", e);
    }
  }
  return null;
}

function playCustomVastPreRoll(video, onAdFinished) {
  if (adHasPlayed) {
    onAdFinished();
    return;
  }

  const adLayer = document.getElementById('adLayer');
  const adVideo = document.getElementById('adVideo');
  const skipBtn = document.getElementById('skipBtn');

  loadVastAd().then(adMediaUrl => {
    if (!adMediaUrl) {
      adHasPlayed = true;
      if (adLayer) adLayer.style.display = "none";
      onAdFinished();
      return;
    }

    if (adLayer && adVideo && skipBtn) {
      adLayer.style.display = "block";
      skipBtn.style.display = "block";
      adVideo.src = adMediaUrl;

      if (trackingEvents.clickThrough) {
        adVideo.style.cursor = 'pointer';
        adVideo.onclick = () => {
          window.open(trackingEvents.clickThrough, '_blank');
        };
      }

      adVideo.play().then(() => {
        if (playerLoader) playerLoader.classList.add('hidden');
      }).catch(err => {
        console.warn('Ad autoplay restricted, attempting muted play:', err);
        adVideo.muted = true;
        adVideo.play().catch(() => {
          endAdPlayback(onAdFinished);
        });
      });

      // Fire Initial Impression Beacons
      trackingEvents.impressions.forEach(firePixel);

      // Skip Timer Logic
      let timeLeft = SKIP_COUNTDOWN;
      skipBtn.innerText = `Skip in ${timeLeft}s`;
      skipBtn.classList.remove('active');

      if (skipTimer) clearInterval(skipTimer);
      skipTimer = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
          skipBtn.innerText = `Skip in ${timeLeft}s`;
        } else {
          clearInterval(skipTimer);
          skipBtn.innerText = "Skip Ad";
          skipBtn.classList.add('active');

          const handleSkip = (e) => {
            if (e) e.stopPropagation();
            endAdPlayback(onAdFinished);
          };
          skipBtn.onclick = handleSkip;
          skipBtn.ontouchstart = handleSkip;
        }
      }, 1000);

      adVideo.onended = () => endAdPlayback(onAdFinished);
    } else {
      adHasPlayed = true;
      onAdFinished();
    }
  });
}

function endAdPlayback(onAdFinished) {
  if (skipTimer) clearInterval(skipTimer);
  const adLayer = document.getElementById('adLayer');
  const adVideo = document.getElementById('adVideo');

  if (adVideo) {
    adVideo.pause();
    adVideo.onended = null;
  }
  if (adLayer) adLayer.style.display = "none";
  adHasPlayed = true;

  // Fire skip/close tracking pixels
  trackingEvents.tracking
    .filter(t => t.event === "skip" || t.event === "close")
    .forEach(t => firePixel(t.url));

  if (typeof onAdFinished === 'function') {
    onAdFinished();
  } else if (hlsVideoPlayer) {
    hlsVideoPlayer.play();
  }
}

// Video Pause Ad Integration
if (hlsVideoPlayer) {
  hlsVideoPlayer.addEventListener('pause', () => {
    if (!hlsVideoPlayer.ended && adHasPlayed && hlsVideoPlayer.currentTime > 1) {
      showPauseAd();
    }
  });

  hlsVideoPlayer.addEventListener('play', () => {
    closePauseAd();
  });
}

function showPauseAd() {
  const pauseBannerLayer = document.getElementById('pauseBannerLayer');
  const pauseAdSlot = document.getElementById('pauseAdSlot');
  if (pauseBannerLayer) pauseBannerLayer.style.display = "block";
  if (pauseAdSlot && !pauseAdSlot.hasChildNodes()) {
    pauseAdSlot.innerHTML = `
      <ins class="eas6a97888e38" data-zoneid="${PAUSE_ZONE_ID}"></ins>
    `;
    const script = document.createElement("script");
    script.src = "https://a.magsrv.com/ad-provider.js";
    script.async = true;
    script.onload = () => {
      (window.AdProvider = window.AdProvider || []).push({"serve": {}});
    };
    pauseAdSlot.appendChild(script);
  }
}

function closePauseAd() {
  const pauseBannerLayer = document.getElementById('pauseBannerLayer');
  if (pauseBannerLayer) pauseBannerLayer.style.display = "none";
}

// Expose functions globally for inline HTML event handlers
window.showPauseAd = showPauseAd;
window.closePauseAd = closePauseAd;





