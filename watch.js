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
    const res = await fetch('/sample_videos.json?v=' + Date.now(), { cache: 'no-cache' });
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

  // Find target video by ID (robust case-insensitive trimmed matching)
  const targetIdStr = String(videoId || '').trim().toLowerCase();
  currentVideo = catalogData.find(v => String(v.id || '').trim().toLowerCase() === targetIdStr);

  if (!currentVideo) {
    if (videoId) {
      // Dynamic on-demand video item auto-discovery
      const cleanTitle = 'Porn ExoticHub ' + videoId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const pageUrl = videoId.includes('inxxx') || !videoId.startsWith('xh')
        ? `https://www.inxxx.com/v/${videoId.replace(/\.xxx-video$/, '')}.xxx-video`
        : `https://xhaccess.com/videos/${videoId}`;

      currentVideo = {
        id: videoId,
        title: cleanTitle,
        category: 'Trending',
        duration: '10:00',
        thumbnail_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80',
        poster_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80',
        page_url: pageUrl,
        video_stream_url: '',
        views: 185000,
        channel: 'ExoticHub Original'
      };
    } else {
      currentVideo = catalogData[0];
    }
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

  // 1. Immediately start pre-loading main video stream in the background (shouldPlay: false)
  loadSmartVideoStream(currentVideo, { shouldPlay: false });

  // 2. Play VAST 4.3 Pre-Roll Video Ad Overlay on top
  playCustomVastPreRoll(currentVideo, () => {
    // When VAST ad completes or Skip Ad is clicked, play main video instantly!
    if (hlsVideoPlayer) {
      const playPromise = hlsVideoPlayer.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          if (playerLoader) playerLoader.classList.add('hidden');
        }).catch(err => {
          console.warn('Unmuted playback restricted, attempting muted play:', err.message);
          hlsVideoPlayer.muted = true;
          hlsVideoPlayer.play().then(() => {
            if (playerLoader) playerLoader.classList.add('hidden');
          }).catch(() => {
            if (playerLoader) playerLoader.classList.add('hidden');
          });
        });
      }
    }
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
    `Brazzers ${categoryStr}`,
    `Brazzers ${titleClean}`,
    `free Brazzers stream`,
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
 * Real-Time Background Stream Refresher Engine
 * Scrapes fresh video_stream_url dynamically on hover/click or on player playback error
 */
async function fetchFreshStreamUrl(pageUrl) {
  if (!pageUrl) return null;

  // 1. Try local Node backend API (/api/refresh-stream)
  try {
    const res = await fetch(`/api/refresh-stream?page_url=${encodeURIComponent(pageUrl)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.stream_url) {
        return data.stream_url;
      }
    }
  } catch (_) {}

  // 2. Client-side fallback scraping via CORS proxy (for static CDN deployments)
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(pageUrl)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const html = await res.text();
      let streamUrl = '';

      if (pageUrl.includes('inxxx.com')) {
        const getFileMatch = html.match(/(https?:\/\/[^"'\s]+\/get_file\/[^\s"']+)/i);
        if (getFileMatch) streamUrl = getFileMatch[1].replace(/&amp;/g, '&');
      } else {
        const initialsMatch = html.match(/window\.initials\s*=\s*(\{.*?\});\s*<\/script>/s);
        if (initialsMatch && initialsMatch[1]) {
          const parsed = JSON.parse(initialsMatch[1]);
          const sources = parsed?.videoModel?.sources || parsed?.video?.sources;
          if (sources?.hls) streamUrl = sources.hls;
          else if (sources?.mp4) {
            const keys = Object.keys(sources.mp4);
            if (keys.length) streamUrl = sources.mp4[keys[keys.length - 1]];
          }
        }
        if (!streamUrl) {
          const m3u8Match = html.match(/(https?:\\?\/\\?\/[^"' ]+\.m3u8[^"' ]*)/i);
          if (m3u8Match) streamUrl = m3u8Match[1].replace(/\\/g, '');
        }
      }
      if (streamUrl) return streamUrl;
    }
  } catch (_) {}

  return null;
}

let isRefreshingStream = false;

/**
 * Load Smart Video Stream directly into HotTube Video Player with instant auto-refresh
 */
async function loadSmartVideoStream(video, options = { shouldPlay: true }) {
  if (!video) return;
  if (playerLoader) playerLoader.classList.remove('hidden');

  // Check if session storage already has a pre-fetched fresh stream URL
  const cachedStream = sessionStorage.getItem('fresh_stream_' + video.id);
  if (cachedStream) {
    console.log('⚡ Using pre-fetched live stream URL for video:', video.id);
    loadHlsStream(cachedStream, video, options);
    return;
  }

  // Attempt current stream URL, or fetch fresh stream URL instantly
  let streamUrl = video.video_stream_url;
  if (streamUrl && (streamUrl.includes('.t.mp4') || streamUrl.includes('.t.av1.mp4') || streamUrl.includes('/526x298.') || streamUrl.includes('trailer') || streamUrl.includes('data='))) {
    streamUrl = '';
  }

  if (!streamUrl) {
    console.log('⏳ No stream URL found, auto-refreshing live link for ID:', video.id);
    const fresh = await fetchFreshStreamUrl(video.page_url);
    if (fresh) {
      sessionStorage.setItem('fresh_stream_' + video.id, fresh);
      loadHlsStream(fresh, video, options);
      return;
    }
  }

  loadHlsStream(streamUrl, video, options);
}

/**
 * Load HLS Stream via HLS.js or Native HTML5 Video Player
 */
function loadHlsStream(streamUrl, video, options = { shouldPlay: true }) {
  if (playerLoader) playerLoader.classList.remove('hidden');

  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }

  if (!streamUrl) {
    console.warn('No stream URL provided for video ID:', video ? video.id : 'unknown');
    if (playerLoader) playerLoader.classList.add('hidden');
    return;
  }

  // Ensure no-referrer policy so CDN stream servers (inxxx/xhaccess) do not send 403 Forbidden
  if (hlsVideoPlayer) {
    hlsVideoPlayer.setAttribute('referrerpolicy', 'no-referrer');
    try { hlsVideoPlayer.currentTime = 0; } catch (_) {}
  }

  const triggerStreamRefreshFallback = async () => {
    if (isRefreshingStream || !video || !video.page_url) return;
    isRefreshingStream = true;
    console.warn('🔄 Video stream token expired or network error. Auto-refreshing in background...');

    if (playerLoader) {
      playerLoader.classList.remove('hidden');
      const loaderSpan = playerLoader.querySelector('span');
      if (loaderSpan) loaderSpan.textContent = '⚡ Refreshing Live HD Stream...';
    }

    const freshUrl = await fetchFreshStreamUrl(video.page_url);
    isRefreshingStream = false;

    if (freshUrl) {
      console.log('✅ Stream token successfully refreshed! Resuming video playback...');
      sessionStorage.setItem('fresh_stream_' + video.id, freshUrl);
      video.video_stream_url = freshUrl;
      loadHlsStream(freshUrl, video, { shouldPlay: true });
    } else {
      console.error('❌ Direct stream token unavailable, switching to fail-safe player fallback...');
      if (playerLoader) playerLoader.classList.add('hidden');
      if (hlsVideoPlayer) hlsVideoPlayer.classList.add('hidden');
      if (embedVideoPlayer && video.page_url) {
        let embedUrl = video.page_url;
        if (video.page_url.includes('pornhat.com')) {
          const pornhatIdMatch = video.page_url.match(/video\/([^/]+)/);
          const pid = pornhatIdMatch ? pornhatIdMatch[1] : video.id;
          embedUrl = `https://www.pornhat.com/embed/${pid}`;
        } else {
          const videoIdMatch = video.page_url.match(/videos\/([^/]+)/);
          const vid = videoIdMatch ? videoIdMatch[1] : video.id;
          embedUrl = `https://xhaccess.com/embed/${vid}`;
        }
        embedVideoPlayer.src = embedUrl;
        embedVideoPlayer.classList.remove('hidden');
      }
    }
  };

  const startPlayback = () => {
    if (!hlsVideoPlayer || options.shouldPlay === false) {
      hideLoader();
      return;
    }

    try { hlsVideoPlayer.currentTime = 0; } catch (_) {}
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

  const hideLoader = () => {
    if (playerLoader) playerLoader.classList.add('hidden');
  };

  if (hlsVideoPlayer) {
    hlsVideoPlayer.onplay = () => {
      hideLoader();
      if (typeof window.closePauseAd === 'function') {
        window.closePauseAd();
      }
    };

    hlsVideoPlayer.onplaying = hideLoader;
    hlsVideoPlayer.oncanplay = hideLoader;
    hlsVideoPlayer.onloadeddata = hideLoader;

    hlsVideoPlayer.onerror = (e) => {
      console.warn('HTML5 Video player error detected, triggering auto-refresh fallback:', e);
      triggerStreamRefreshFallback();
    };

    hlsVideoPlayer.onpause = () => {
      if (!hlsVideoPlayer.ended && typeof window.showPauseAd === 'function' && hlsVideoPlayer.currentTime > 1) {
        window.showPauseAd();
      }
    };
  }

  // Direct MP4 or Non-M3U8 Stream playback in Native HTML5 Video Player
  if (streamUrl.includes('.mp4') || !streamUrl.includes('.m3u8')) {
    hlsVideoPlayer.src = streamUrl;
    if (options.shouldPlay !== false) {
      startPlayback();
    } else {
      hideLoader();
    }
    return;
  }

  // HLS Stream (.m3u8) playback via HLS.js with Mobile Ultra-Smooth Buffer Optimization
  if (Hls.isSupported() && streamUrl.includes('.m3u8')) {
    hlsInstance = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
      autoStartLoad: true,
      startPosition: 0,
      startLevel: -1,
      backBufferLength: 60,
      maxBufferLength: 30,
      maxMaxBufferLength: 90,
      maxBufferSize: 60 * 1024 * 1024,
      maxBufferHole: 0.2,
      highBufferWatchdogPeriod: 1,
      progressive: true,
      capLevelToPlayerSize: false
    });

    hlsInstance.loadSource(streamUrl);
    hlsInstance.attachMedia(hlsVideoPlayer);

    hlsInstance.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
      hideLoader();
      if (data && data.levels) {
        populateQualityDropdown(data.levels);
      }
      if (hlsInstance.subtitleTracks && hlsInstance.subtitleTracks.length > 0) {
        populateSubtitleDropdown(hlsInstance.subtitleTracks);
      } else {
        populateSubtitleDropdown(video ? video.subtitles : null);
      }
      startPlayback();
    });

    hlsInstance.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        console.error('HLS Fatal Error detected:', data.type, data.details);
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.warn('Network error encountered, auto-refreshing stream URL...');
            triggerStreamRefreshFallback();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.warn('Media error encountered, attempting recovery...');
            hlsInstance.recoverMediaError();
            break;
          default:
            triggerStreamRefreshFallback();
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
/**
 * Dynamically Populate Quality Dropdown & In-Player Control Overlay
 */
function populateQualityDropdown(levels) {
  const qualitySelect = document.getElementById('qualitySelect');
  const inPlayerQualityMenu = document.getElementById('inPlayerQualityMenu');
  const inPlayerQualityBtn = document.getElementById('inPlayerQualityBtn');
  const inPlayerQualityLabel = document.getElementById('inPlayerQualityLabel');

  if (!levels || levels.length === 0) return;

  if (qualitySelect) {
    qualitySelect.innerHTML = '<option value="-1">⚡ Auto (Adaptive HD/SD)</option>';
  }
  if (inPlayerQualityMenu) {
    inPlayerQualityMenu.innerHTML = '';
    const autoBtn = document.createElement('button');
    autoBtn.className = 'in-player-menu-item active';
    autoBtn.innerHTML = '⚡ Auto HD';
    autoBtn.onclick = () => {
      setHlsQuality(-1);
      if (inPlayerQualityLabel) inPlayerQualityLabel.textContent = 'Auto HD';
      inPlayerQualityMenu.classList.add('hidden');
      updateActiveMenuItem(inPlayerQualityMenu, autoBtn);
    };
    inPlayerQualityMenu.appendChild(autoBtn);
  }

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

    if (qualitySelect) {
      const opt = document.createElement('option');
      opt.value = lvl.index;
      opt.textContent = `${icon} ${lvl.height}p ${tag}`;
      qualitySelect.appendChild(opt);
    }

    if (inPlayerQualityMenu) {
      const itemBtn = document.createElement('button');
      itemBtn.className = 'in-player-menu-item';
      itemBtn.innerHTML = `${icon} ${lvl.height}p ${tag}`;
      itemBtn.onclick = () => {
        setHlsQuality(lvl.index);
        if (inPlayerQualityLabel) inPlayerQualityLabel.textContent = `${lvl.height}p`;
        inPlayerQualityMenu.classList.add('hidden');
        updateActiveMenuItem(inPlayerQualityMenu, itemBtn);
      };
      inPlayerQualityMenu.appendChild(itemBtn);
    }
  });

  if (inPlayerQualityBtn && inPlayerQualityMenu) {
    inPlayerQualityBtn.onclick = (e) => {
      e.stopPropagation();
      const inPlayerSubMenu = document.getElementById('inPlayerSubMenu');
      if (inPlayerSubMenu) inPlayerSubMenu.classList.add('hidden');
      inPlayerQualityMenu.classList.toggle('hidden');
    };
  }
}

function updateActiveMenuItem(menuContainer, activeBtn) {
  if (!menuContainer) return;
  menuContainer.querySelectorAll('.in-player-menu-item').forEach(btn => btn.classList.remove('active'));
  if (activeBtn) activeBtn.classList.add('active');
}

/**
 * Setup Interactive Quality Control Dropdown Listener
 */
function setupQualityControls() {
  const qualitySelect = document.getElementById('qualitySelect');
  if (qualitySelect) {
    qualitySelect.addEventListener('change', (e) => {
      const selectedLevel = parseInt(e.target.value, 10);
      setHlsQuality(selectedLevel);
    });
  }

  // Close in-player floating menus on click outside
  document.addEventListener('click', () => {
    const inPlayerQualityMenu = document.getElementById('inPlayerQualityMenu');
    const inPlayerSubMenu = document.getElementById('inPlayerSubMenu');
    if (inPlayerQualityMenu) inPlayerQualityMenu.classList.add('hidden');
    if (inPlayerSubMenu) inPlayerSubMenu.classList.add('hidden');
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
 * Dynamically Populate Subtitle Tracks Dropdown & In-Player CC Menu
 */
function populateSubtitleDropdown(tracks) {
  const subtitleSelect = document.getElementById('subtitleSelect');
  const subtitleWrapper = document.getElementById('subtitleWrapper');
  const inPlayerSubMenu = document.getElementById('inPlayerSubMenu');
  const inPlayerSubGroup = document.getElementById('inPlayerSubGroup');
  const inPlayerSubBtn = document.getElementById('inPlayerSubBtn');
  const inPlayerSubLabel = document.getElementById('inPlayerSubLabel');

  if (!tracks || tracks.length === 0) {
    if (subtitleWrapper) subtitleWrapper.style.display = 'none';
    if (inPlayerSubGroup) inPlayerSubGroup.style.display = 'none';
    return;
  }

  if (subtitleWrapper) subtitleWrapper.style.display = 'flex';
  if (inPlayerSubGroup) inPlayerSubGroup.style.display = 'block';

  if (subtitleSelect) {
    subtitleSelect.innerHTML = '<option value="-1">💬 Subtitles Off</option>';
  }
  if (inPlayerSubMenu) {
    inPlayerSubMenu.innerHTML = '';
    const offBtn = document.createElement('button');
    offBtn.className = 'in-player-menu-item active';
    offBtn.innerHTML = '🚫 Subtitles Off';
    offBtn.onclick = () => {
      if (hlsInstance) hlsInstance.subtitleTrack = -1;
      if (inPlayerSubLabel) inPlayerSubLabel.textContent = 'CC Off';
      inPlayerSubMenu.classList.add('hidden');
      updateActiveMenuItem(inPlayerSubMenu, offBtn);
    };
    inPlayerSubMenu.appendChild(offBtn);
  }

  tracks.forEach((track, index) => {
    const label = track.name || track.lang || track.label || `Track ${index + 1}`;

    if (subtitleSelect) {
      const opt = document.createElement('option');
      opt.value = index;
      opt.textContent = `💬 ${label.toUpperCase()}`;
      subtitleSelect.appendChild(opt);
    }

    if (inPlayerSubMenu) {
      const itemBtn = document.createElement('button');
      itemBtn.className = 'in-player-menu-item';
      itemBtn.innerHTML = `💬 ${label.toUpperCase()}`;
      itemBtn.onclick = () => {
        if (hlsInstance) hlsInstance.subtitleTrack = index;
        if (inPlayerSubLabel) inPlayerSubLabel.textContent = label.toUpperCase();
        inPlayerSubMenu.classList.add('hidden');
        updateActiveMenuItem(inPlayerSubMenu, itemBtn);
      };
      inPlayerSubMenu.appendChild(itemBtn);
    }
  });

  if (subtitleSelect) {
    subtitleSelect.onchange = (e) => {
      const targetIdx = parseInt(e.target.value);
      if (hlsInstance) {
        hlsInstance.subtitleTrack = targetIdx;
        console.log('💬 Subtitle track switched live to index:', targetIdx);
      }
    };
  }

  if (inPlayerSubBtn && inPlayerSubMenu) {
    inPlayerSubBtn.onclick = (e) => {
      e.stopPropagation();
      const inPlayerQualityMenu = document.getElementById('inPlayerQualityMenu');
      if (inPlayerQualityMenu) inPlayerQualityMenu.classList.add('hidden');
      inPlayerSubMenu.classList.toggle('hidden');
    };
  }
}

let recDisplayCount = 12;
let allRecommendations = [];
let recObserver = null;
let isRecLoading = false;

/**
 * Render Recommended Videos with Infinite Scroll on Watch Page
 */
function renderRecommendations(video) {
  if (!recommendedGrid) return;

  const catLower = (video.category || '').toLowerCase();
  
  // Filter by matching category or title keyword, excluding current video
  let categoryRecs = catalogData.filter(v => String(v.id) !== String(video.id) && (
    (v.category && v.category.toLowerCase() === catLower) ||
    (v.title && catLower && v.title.toLowerCase().includes(catLower))
  ));

  // Rest of catalog for endless mixing
  let otherRecs = catalogData.filter(v => String(v.id) !== String(video.id) && !categoryRecs.includes(v));

  // Mix category recommendations first, followed by remaining catalog
  allRecommendations = [...categoryRecs, ...otherRecs];
  recDisplayCount = 12;

  renderRecCards();
  setupWatchInfiniteScroll();
}

function renderRecCards() {
  if (!recommendedGrid || !allRecommendations.length) return;
  recommendedGrid.innerHTML = '';

  const visible = allRecommendations.slice(0, recDisplayCount);
  const recCountBadge = document.getElementById('recCountBadge');
  if (recCountBadge) {
    recCountBadge.textContent = `${allRecommendations.length.toLocaleString()} Recommended Videos`;
  }

  visible.forEach(rec => {
    const card = document.createElement('article');
    card.className = 'video-card';
    card.style.cursor = 'pointer';
    card.innerHTML = `
      <div class="thumb-container">
        <img src="${rec.thumbnail_url || rec.poster_url}" alt="${escapeHtml(rec.title)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80'">
        <span class="badge-duration">${rec.duration || '10:00'}</span>
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

  const sentinel = document.getElementById('recSentinel');
  if (sentinel) {
    sentinel.style.display = recDisplayCount >= allRecommendations.length ? 'none' : 'flex';
  }
}

function setupWatchInfiniteScroll() {
  const sentinel = document.getElementById('recSentinel');
  if (!sentinel) return;

  if (recObserver) recObserver.disconnect();

  recObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isRecLoading && recDisplayCount < allRecommendations.length) {
      isRecLoading = true;
      recDisplayCount += 12;
      renderRecCards();
      setTimeout(() => { isRecLoading = false; }, 300);
    }
  }, { rootMargin: '300px' });

  recObserver.observe(sentinel);
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
// ExoClick VAST 4.3 Pre-Roll & Pause Ad Player Engine
// ==========================================================================
const VAST_URLS = [
  "https://s.magsrv.com/v1/vast.php?idz=6051450",
  "https://s.magsrv.com/v1/vast.php?idz=6050694",
  "https://s.magsrv.com/v1/vast.php?idz=6051448"
];
const SKIP_COUNTDOWN = 5;

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
      adVideo.setAttribute('referrerpolicy', 'no-referrer');
      adVideo.setAttribute('playsinline', '');
      adVideo.setAttribute('webkit-playsinline', '');
      adVideo.playsInline = true;
      adVideo.muted = true; // Muted by default so mobile browsers allow instant VAST ad playback!
      adVideo.src = adMediaUrl;

      if (trackingEvents.clickThrough) {
        adVideo.style.cursor = 'pointer';
        const handleAdClick = (e) => {
          if (e) e.stopPropagation();
          window.open(trackingEvents.clickThrough, '_blank');
        };
        adVideo.onclick = handleAdClick;
        adVideo.ontouchstart = handleAdClick;
      }

      const startAdPlay = () => {
        const p = adVideo.play();
        if (p !== undefined) {
          p.then(() => {
            if (playerLoader) playerLoader.classList.add('hidden');
          }).catch(err => {
            console.warn('Mobile VAST ad playback interaction required:', err.message);
            // If mobile browser restricts video autoplay even when muted, enable tap-to-start or end ad
            if (playerLoader) playerLoader.classList.add('hidden');
          });
        }
      };

      startAdPlay();

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
          skipBtn.innerText = "Skip Ad ▶";
          skipBtn.classList.add('active');

          const handleSkip = (e) => {
            if (e) {
              e.preventDefault();
              e.stopPropagation();
            }
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

// Video Pause Ad Integration (Zone 6049564)
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

window.showPauseAd = showPauseAd;
window.closePauseAd = closePauseAd;







