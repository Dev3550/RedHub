// ==========================================================================
// HotTube Web Application Logic & HLS Streaming Engine
// ==========================================================================

// Embedded Scraped Catalog Data Fallback (from d:\redhub\sample_videos.json)
const FALLBACK_CATALOG = [
  {
    "index": 1,
    "id": "27671902",
    "title": "Step Sister and Step Brother shared bed and Hard Rough Fuck",
    "duration": "7:48",
    "duration_seconds": 468,
    "thumbnail_url": "https://ic-vt-nss.xhpingcdn.com/a/OTk4ZjQyMjIwYjJlYmY1NWEzN2FhM2M2ZDZjZDkyMjk/s(w:526,h:298),webp/027/671/902/1280x720.17600221.jpg",
    "poster_url": "https://ic-vt-nss.xhpingcdn.com/a/MjI1YzI0YmVjMTQxMTViZDhkNmU3MTBiMDkwMTdiZmI/s(w:1280,h:720),webp/027/671/902/1280x720.17600221.jpg",
    "page_url": "https://xhaccess.com/videos/step-sister-and-step-brother-shared-bed-and-hard-rough-fuck-xhHesPv",
    "video_stream_url": "https://video-nss.xhpingcdn.com/6jGgdiUQfQLz9UimjsbVjA==,1789210800/media=hls4/multi=256x144:144p:,426x240:240p:,854x480:480p:,1280x720:720p:,1920x1080:1080p:/027/671/902/_TPL_.av1.mp4.m3u8",
    "views": 21358612,
    "channel": "Shashi X"
  },
  {
    "index": 2,
    "id": "30390704",
    "title": "Exam time stepbrother and stepsister common problem first on HotTube",
    "duration": "7:59",
    "duration_seconds": 479,
    "thumbnail_url": "https://ic-vt-nss.xhpingcdn.com/a/ZDkxZGY5MzdmNzRkZmUzOWQ3MThlMzRiODcyODQ4ZTc/s(w:526,h:298),webp/030/390/704/1280x720.17866827.jpg",
    "poster_url": "https://ic-vt-nss.xhpingcdn.com/a/MzczNmM4MTVkYTM0YWMyYjJlZmY4N2UyOTVjNzZhZTc/s(w:1280,h:720),webp/030/390/704/1280x720.17866827.jpg",
    "page_url": "https://xhaccess.com/videos/exam-time-stepbrother-and-stepsister-common-problem-first-on-xhamster-xhYBCOh",
    "video_stream_url": "https://video-nss-a.xhpingcdn.com/j0K1P7z9AU6yTVP-3embmw==,1789210800/media=hls4/multi=256x144:144p:,426x240:240p:,854x480:480p:,1280x720:720p:,1920x1080:1080p:/030/390/704/_TPL_.av1.mp4.m3u8",
    "views": 4854086,
    "channel": "Dogimaster"
  },
  {
    "index": 3,
    "id": "30505032",
    "title": "Ain't No Fun if the Homies Can't Get None",
    "duration": "44:27",
    "duration_seconds": 2667,
    "thumbnail_url": "https://ic-vt-nss.xhpingcdn.com/a/NDk3ODNhNDJjYjk0ZTc5NDFmNDdjMTEyYmEzMzI3NjQ/s(w:526,h:298),webp/030/505/032/v2/526x298.259.webp",
    "poster_url": "https://ic-vt-nss.xhpingcdn.com/a/YjRlMGVkZjdkZGExNmQyYTYzM2I0MmUyNDFhOWIwN2Q/s(w:1280,h:720),webp/030/505/032/v2/2560x1440.259.webp",
    "page_url": "https://xhaccess.com/videos/aint-no-fun-if-the-homies-cant-get-none-xhxE9vz",
    "video_stream_url": "https://video-nss.xhpingcdn.com/A-2KuZYmQbIoXj9TCTRrFA==,1789210800/media=hls4/multi=256x144:144p:,426x240:240p:,854x480:480p:,1280x720:720p:,1920x1080:1080p:,3840x2160:2160p:/030/505/032/_TPL_.av1.mp4.m3u8",
    "views": 991724,
    "channel": "Jonathan Jordan XXX"
  },
  {
    "index": 4,
    "id": "29628466",
    "title": "New Indian beautyfull Muslim Desi girls hot video com",
    "duration": "7:33",
    "duration_seconds": 453,
    "thumbnail_url": "https://ic-vt-nss.xhpingcdn.com/a/YmVlOGU1NzI5NjU0ZDRjZDQ5NmEzZDg4ZDY4MTc6NmI/s(w:526,h:298),webp/029/628/466/v2/526x298.216.webp",
    "poster_url": "https://ic-vt-nss.xhpingcdn.com/a/NjNhMWY3NTY1NWY3N2U0YzI1NjU3OGVmNmIxZjA1MTQ/s(w:1280,h:720),webp/029/628/466/v2/2560x1440.216.webp",
    "page_url": "https://xhaccess.com/videos/new-indian-beautyfull-muslim-desi-girls-hot-porn-sex-xxx-video-xnxx-video-xvideo-pornhub-video-xhamster-video-com-xhZmYvh",
    "video_stream_url": "https://video-am.xhpingcdn.com/KSAJE0k0bHM9AmkO60HjBA==,1789210800/media=hls4/multi=256x144:144p:,426x240:240p:,854x480:480p:,1280x720:720p:/029/628/466/_TPL_.av1.mp4.m3u8",
    "views": 14764412,
    "channel": "Friend wife "
  },
  {
    "index": 5,
    "id": "29987005",
    "title": "I'm making a video of my very sexy boyfriend but my horny stepbrother puts his cock in my vagina",
    "duration": "9:14",
    "duration_seconds": 554,
    "thumbnail_url": "https://ic-vt-nss.xhpingcdn.com/a/Mzg2YTQ4MzAxYTM2YTJlMTYyYTU2MTM5ZDEyM2QyNjA/s(w:526,h:298),webp/029/987/005/v2/526x298.203.webp",
    "poster_url": "https://ic-vt-nss.xhpingcdn.com/a/OWUxNDNlODkyYzAwMDcxZjMwZTgzMjYyMGIzZDQwOTc/s(w:1280,h:720),webp/029/987/005/v2/2560x1440.203.webp",
    "page_url": "https://xhaccess.com/videos/im-making-a-video-of-my-very-sexy-boyfriend-but-my-horny-stepbrother-puts-his-cock-in-my-vagina-xhYLjK0",
    "video_stream_url": "https://video-nss.xhpingcdn.com/gpB-aieh7VtvYqcG_CjESg==,1789210800/media=hls4/multi=256x144:144p:,426x240:240p:,854x480:480p:,1280x720:720p:,1920x1080:1080p:/029/987/005/_TPL_.av1.mp4.m3u8",
    "views": 3617202,
    "channel": "Bellota"
  }
];

let videosData = [];
let filteredVideos = [];
let currentPage = 1;
let itemsPerPage = 20; // Default desktop: 20 per page, mobile: 10 per page
let hlsInstance = null;
let isModalOpen = false;

// DOM Elements
const videoGrid = document.getElementById('videoGrid');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const videoCountBadge = document.getElementById('videoCountBadge');
const deviceBadge = document.getElementById('deviceBadge');
const emptyState = document.getElementById('emptyState');
const resetSearchBtn = document.getElementById('resetSearchBtn');
const catalogHeader = document.getElementById('catalogHeader');

// Pagination Elements
const paginationWrapper = document.getElementById('paginationWrapper');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageNumbers = document.getElementById('pageNumbers');

// Hero Banner Elements
const heroBackdrop = document.getElementById('heroBackdrop');
const heroTitle = document.getElementById('heroTitle');
const heroChannel = document.getElementById('heroChannel');
const heroViews = document.getElementById('heroViews');
const heroDuration = document.getElementById('heroDuration');
const heroPlayBtn = document.getElementById('heroPlayBtn');

// Player Modal Elements
const playerModal = document.getElementById('playerModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const hlsVideoPlayer = document.getElementById('hlsVideoPlayer');
const playerLoader = document.getElementById('playerLoader');
const modalVideoTitle = document.getElementById('modalVideoTitle');
const modalChannel = document.getElementById('modalChannel');
const modalViews = document.getElementById('modalViews');
const modalDuration = document.getElementById('modalDuration');

/**
 * Initialize App Data & Responsive Pagination Rules
 */
async function initApp() {
  updateItemsPerPage();

  try {
    const res = await fetch('./sample_videos.json');
    if (res.ok) {
      videosData = await res.json();
    } else {
      videosData = FALLBACK_CATALOG;
    }
  } catch (_) {
    videosData = FALLBACK_CATALOG;
  }

  if (!videosData || videosData.length === 0) {
    videosData = FALLBACK_CATALOG;
  }

  // Clean third-party branding to 100% HotTube
  videosData = videosData.map(v => ({
    ...v,
    title: cleanHotTubeBranding(v.title)
  }));

  filteredVideos = [...videosData];

  renderHeroBanner(videosData[0]);
  renderCurrentPage();
  setupEventListeners();

  // Check URL hash for direct video playback (e.g. #watch-27671902)
  if (window.location.hash.startsWith('#watch-')) {
    const videoId = window.location.hash.replace('#watch-', '');
    const targetVideo = videosData.find(v => String(v.id) === String(videoId));
    if (targetVideo) {
      openPlayerModal(targetVideo, false);
    }
  }
}

/**
 * Clean all third-party branding to HotTube
 */
function cleanHotTubeBranding(text) {
  if (!text) return '';
  return text
    .replace(/(xHamster|xHamsters|xNXX|Pornhub|XVideos)/gi, 'HotTube')
    .trim();
}

/**
 * Determine items per page based on screen width (Desktop: 20, Mobile: 10)
 */
function updateItemsPerPage() {
  const isMobile = window.innerWidth <= 768;
  itemsPerPage = isMobile ? 10 : 20;

  if (deviceBadge) {
    deviceBadge.innerHTML = isMobile 
      ? `<i class="fa-solid fa-mobile-screen"></i> 10 per page (Mobile)` 
      : `<i class="fa-solid fa-desktop"></i> 20 per page (Desktop)`;
  }
}

/**
 * Render Video Catalog Grid for Current Page with Native Ad Placements
 */
function renderCurrentPage() {
  videoGrid.innerHTML = '';

  const totalItems = filteredVideos.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  if (totalItems === 0) {
    emptyState.classList.remove('hidden');
    paginationWrapper.classList.add('hidden');
    videoCountBadge.textContent = '0 Videos';
    return;
  }

  emptyState.classList.add('hidden');
  videoCountBadge.textContent = `${totalItems} Videos Available`;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const pageItems = filteredVideos.slice(startIndex, endIndex);

  const nativeAdFreq = (typeof ADS_CONFIG !== 'undefined' && ADS_CONFIG.native_ad_frequency) ? ADS_CONFIG.native_ad_frequency : 4;

  pageItems.forEach((video, idx) => {
    // Inject Native Ad Card every N items
    if (idx > 0 && idx % nativeAdFreq === 0 && typeof getNativeAdCardHtml === 'function') {
      const adWrapper = document.createElement('div');
      adWrapper.innerHTML = getNativeAdCardHtml(idx);
      if (adWrapper.firstElementChild) {
        videoGrid.appendChild(adWrapper.firstElementChild);
      }
    }

    const card = document.createElement('article');
    card.className = 'video-card';
    card.innerHTML = `
      <div class="thumb-container">
        <img src="${video.thumbnail_url}" alt="${escapeHtml(video.title)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80'">
        <span class="badge-duration">${video.duration}</span>
        <div class="play-overlay">
          <div class="play-icon-btn">
            <i class="fa-solid fa-play"></i>
          </div>
        </div>
      </div>
      <div class="card-content">
        <h3 class="card-title">${escapeHtml(video.title)}</h3>
        <div class="card-meta">
          <span class="card-channel"><i class="fa-regular fa-circle-user"></i> ${escapeHtml(video.channel || 'HotTube Creator')}</span>
          <span class="card-views"><i class="fa-regular fa-eye"></i> ${formatViews(video.views)}</span>
        </div>
      </div>
    `;

    card.onclick = () => openPlayerModal(video);
    videoGrid.appendChild(card);
  });

  renderPaginationControls(totalPages);
}

/**
 * Render Pagination Controls (Prev, Page Numbers, Next)
 */
function renderPaginationControls(totalPages) {
  if (totalPages <= 1) {
    paginationWrapper.classList.add('hidden');
    return;
  }

  paginationWrapper.classList.remove('hidden');
  prevPageBtn.disabled = (currentPage === 1);
  nextPageBtn.disabled = (currentPage === totalPages);

  pageNumbers.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    const numBtn = document.createElement('button');
    numBtn.className = `num-btn ${i === currentPage ? 'active' : ''}`;
    numBtn.textContent = i;
    numBtn.onclick = () => goToPage(i);
    pageNumbers.appendChild(numBtn);
  }
}

function goToPage(page) {
  currentPage = page;
  renderCurrentPage();
  if (catalogHeader) {
    catalogHeader.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Render Hero Banner
 */
function renderHeroBanner(video) {
  if (!video) return;
  heroBackdrop.style.backgroundImage = `url('${video.poster_url || video.thumbnail_url}')`;
  heroTitle.textContent = video.title;
  heroChannel.innerHTML = `<i class="fa-regular fa-circle-user"></i> ${video.channel || 'HotTube Original'}`;
  heroViews.innerHTML = `<i class="fa-regular fa-eye"></i> ${formatViews(video.views)} views`;
  heroDuration.innerHTML = `<i class="fa-regular fa-clock"></i> ${video.duration}`;

  heroPlayBtn.onclick = () => openPlayerModal(video);
}

/**
 * Open Video Player Modal and Push History State
 */
function openPlayerModal(video, updateHistory = true) {
  if (!video) return;

  if (updateHistory) {
    history.pushState({ modalOpen: true, videoId: video.id }, '', '#watch-' + video.id);
  }
  isModalOpen = true;

  modalVideoTitle.textContent = video.title;
  modalChannel.innerHTML = `<i class="fa-regular fa-circle-user"></i> ${video.channel || 'HotTube Creator'}`;
  modalViews.innerHTML = `<i class="fa-regular fa-eye"></i> ${formatViews(video.views)} views`;
  modalDuration.innerHTML = `<i class="fa-regular fa-clock"></i> ${video.duration}`;
  hlsVideoPlayer.poster = video.poster_url || video.thumbnail_url;

  playerLoader.classList.remove('hidden');
  playerModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  const streamUrl = video.video_stream_url;

  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }

  if (Hls.isSupported() && streamUrl) {
    hlsInstance = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
    });

    hlsInstance.loadSource(streamUrl);
    hlsInstance.attachMedia(hlsVideoPlayer);

    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
      playerLoader.classList.add('hidden');
      hlsVideoPlayer.play().catch(e => console.warn('Autoplay prevented:', e.message));
    });

    hlsInstance.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        playerLoader.classList.add('hidden');
        console.error('HLS Fatal Error:', data);
      }
    });

  } else if (hlsVideoPlayer.canPlayType('application/vnd.apple.mpegurl') && streamUrl) {
    hlsVideoPlayer.src = streamUrl;
    hlsVideoPlayer.addEventListener('loadedmetadata', () => {
      playerLoader.classList.add('hidden');
      hlsVideoPlayer.play();
    });
  } else {
    playerLoader.classList.add('hidden');
    console.warn('HLS not supported natively or stream missing.');
  }
}

/**
 * Close Video Player Modal
 */
function closePlayerModal(fromPopState = false) {
  playerModal.classList.add('hidden');
  document.body.style.overflow = '';
  hlsVideoPlayer.pause();
  hlsVideoPlayer.src = '';

  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }

  isModalOpen = false;

  if (!fromPopState && window.location.hash.startsWith('#watch-')) {
    history.pushState(null, '', window.location.pathname + window.location.search);
  }
}

/**
 * Filter Videos via Search Query
 */
function handleSearch() {
  const query = searchInput.value.trim().toLowerCase();
  
  if (query.length > 0) {
    clearSearchBtn.classList.remove('hidden');
  } else {
    clearSearchBtn.classList.add('hidden');
  }

  filteredVideos = videosData.filter(v => 
    v.title.toLowerCase().includes(query) || 
    (v.channel && v.channel.toLowerCase().includes(query))
  );

  currentPage = 1;
  renderCurrentPage();
}

/**
 * Event Listeners
 */
function setupEventListeners() {
  // Screen resize handler for responsive pagination
  window.addEventListener('resize', () => {
    const prevPer = itemsPerPage;
    updateItemsPerPage();
    if (prevPer !== itemsPerPage) {
      renderCurrentPage();
    }
  });

  // Mobile / Browser Back Button Interceptor (popstate)
  window.addEventListener('popstate', (e) => {
    if (isModalOpen) {
      closePlayerModal(true);
    }
  });

  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) goToPage(currentPage - 1);
  });

  nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
    if (currentPage < totalPages) goToPage(currentPage + 1);
  });

  searchInput.addEventListener('input', handleSearch);

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    handleSearch();
  });

  resetSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    handleSearch();
  });

  closeModalBtn.addEventListener('click', () => closePlayerModal(false));

  playerModal.addEventListener('click', (e) => {
    if (e.target === playerModal) {
      closePlayerModal(false);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !playerModal.classList.contains('hidden')) {
      closePlayerModal(false);
    }
  });

  // Category chip filtering
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');

      const cat = e.target.getAttribute('data-category');
      if (cat === 'all') {
        filteredVideos = [...videosData];
      } else if (cat === 'trending') {
        filteredVideos = [...videosData].sort((a, b) => b.views - a.views);
      } else if (cat === 'popular') {
        filteredVideos = videosData.filter(v => v.views > 1000000);
      } else if (cat === 'hd' || cat === 'recent') {
        filteredVideos = [...videosData];
      }
      currentPage = 1;
      renderCurrentPage();
    });
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

// Launch App on DOM ready
document.addEventListener('DOMContentLoaded', initApp);
