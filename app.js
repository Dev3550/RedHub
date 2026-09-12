// ==========================================================================
// HotTube Home Page Logic & Catalog Engine (app.js)
// ==========================================================================

// Embedded Scraped Catalog Data Fallback (from d:\redhub\sample_videos.json)
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

let videosData = [];
let filteredVideos = [];
let currentPage = 1;
let itemsPerPage = 20; // Default desktop: 20 per page, mobile: 10 per page

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

// Trending Carousel Elements & State
const trendingCarouselTrack = document.getElementById('trendingCarouselTrack');
const trendingDots = document.getElementById('trendingDots');
const trendingPrevBtn = document.getElementById('trendingPrevBtn');
const trendingNextBtn = document.getElementById('trendingNextBtn');
const trendingPauseBtn = document.getElementById('trendingPauseBtn');

let trendingVideos = [];
let currentTrendingIndex = 0;
let trendingAutoTimer = null;
let isTrendingPaused = false;

/**
 * Initialize App Data & Responsive Rules
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

  // Get Top 6 videos sorted by views for Trending Section
  trendingVideos = [...videosData]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 6);

  // Check search query parameter in URL
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get('search');
  if (searchParam && searchInput) {
    searchInput.value = searchParam;
    handleSearch();
  }

  renderTrendingCarousel();
  renderCurrentPage();
  setupEventListeners();
}

/**
 * Render 5-6 Auto-Scrolling Trending Videos Carousel
 */
function renderTrendingCarousel() {
  if (!trendingCarouselTrack || !trendingVideos || trendingVideos.length === 0) return;

  trendingCarouselTrack.innerHTML = '';
  if (trendingDots) trendingDots.innerHTML = '';

  trendingVideos.forEach((video, idx) => {
    const card = document.createElement('div');
    card.className = 'trending-card';
    card.innerHTML = `
      <div class="thumb-box">
        <img src="${video.thumbnail_url || video.poster_url}" alt="${escapeHtml(video.title)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80'">
        <span class="trending-rank-tag">🔥 #${idx + 1} Trending</span>
        <span class="duration-badge">${video.duration || '00:00'}</span>
        <div class="play-overlay-icon">
          <div class="play-btn-circle">
            <i class="fa-solid fa-play"></i>
          </div>
        </div>
      </div>
      <div class="trending-card-info">
        <h3 class="trending-card-title">${escapeHtml(video.title)}</h3>
        <div class="trending-card-meta">
          <span class="trending-card-channel"><i class="fa-regular fa-circle-user"></i> ${escapeHtml(video.channel || 'HotTube Original')}</span>
          <span class="trending-card-views"><i class="fa-regular fa-eye"></i> ${formatViews(video.views)}</span>
        </div>
      </div>
    `;

    card.onclick = () => {
      window.location.href = `watch.html?id=${encodeURIComponent(video.id)}`;
    };

    trendingCarouselTrack.appendChild(card);

    // Indicator Dot
    if (trendingDots) {
      const dot = document.createElement('div');
      dot.className = `trending-dot ${idx === 0 ? 'active' : ''}`;
      dot.onclick = (e) => {
        e.stopPropagation();
        goToTrendingSlide(idx);
      };
      trendingDots.appendChild(dot);
    }
  });

  startTrendingAutoPlay();

  // Pause on hover
  const carouselWrapper = document.getElementById('trendingCarouselWrapper');
  if (carouselWrapper) {
    carouselWrapper.addEventListener('mouseenter', () => {
      stopTrendingAutoPlay();
    });
    carouselWrapper.addEventListener('mouseleave', () => {
      if (!isTrendingPaused) startTrendingAutoPlay();
    });
  }
}

/**
 * Slide to specific index in Trending Carousel
 */
function updateTrendingSlidePosition() {
  if (!trendingCarouselTrack) return;
  const cards = trendingCarouselTrack.querySelectorAll('.trending-card');
  if (!cards.length) return;

  const firstCard = cards[0];
  const cardWidth = firstCard.offsetWidth + 16; // width + gap
  const maxIndex = cards.length - 1;

  if (currentTrendingIndex > maxIndex) currentTrendingIndex = 0;
  if (currentTrendingIndex < 0) currentTrendingIndex = maxIndex;

  trendingCarouselTrack.style.transform = `translateX(-${currentTrendingIndex * cardWidth}px)`;

  // Update dots
  if (trendingDots) {
    const dots = trendingDots.querySelectorAll('.trending-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentTrendingIndex);
    });
  }
}

function goToTrendingSlide(index) {
  currentTrendingIndex = index;
  updateTrendingSlidePosition();
}

function nextTrendingSlide() {
  const maxIndex = trendingVideos.length - 1;
  currentTrendingIndex = currentTrendingIndex >= maxIndex ? 0 : currentTrendingIndex + 1;
  updateTrendingSlidePosition();
}

function prevTrendingSlide() {
  const maxIndex = trendingVideos.length - 1;
  currentTrendingIndex = currentTrendingIndex <= 0 ? maxIndex : currentTrendingIndex - 1;
  updateTrendingSlidePosition();
}

function startTrendingAutoPlay() {
  stopTrendingAutoPlay();
  trendingAutoTimer = setInterval(() => {
    nextTrendingSlide();
  }, 3500); // Autoscroll every 3.5 seconds
}

function stopTrendingAutoPlay() {
  if (trendingAutoTimer) {
    clearInterval(trendingAutoTimer);
    trendingAutoTimer = null;
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
  // Trending Carousel Controls
  if (trendingPrevBtn) {
    trendingPrevBtn.addEventListener('click', () => {
      prevTrendingSlide();
      if (!isTrendingPaused) startTrendingAutoPlay();
    });
  }

  if (trendingNextBtn) {
    trendingNextBtn.addEventListener('click', () => {
      nextTrendingSlide();
      if (!isTrendingPaused) startTrendingAutoPlay();
    });
  }

  if (trendingPauseBtn) {
    trendingPauseBtn.addEventListener('click', () => {
      isTrendingPaused = !isTrendingPaused;
      if (isTrendingPaused) {
        stopTrendingAutoPlay();
        trendingPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        trendingPauseBtn.title = "Resume Auto-scroll";
      } else {
        startTrendingAutoPlay();
        trendingPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        trendingPauseBtn.title = "Pause Auto-scroll";
      }
    });
  }

  // Screen resize handler for responsive pagination & slide positioning
  window.addEventListener('resize', () => {
    const prevPer = itemsPerPage;
    updateItemsPerPage();
    if (prevPer !== itemsPerPage) {
      renderCurrentPage();
    }
    updateTrendingSlidePosition();
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

  // Category chip filtering
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      const targetChip = e.target.closest('.chip');
      if (!targetChip) return;
      targetChip.classList.add('active');

      const cat = targetChip.getAttribute('data-category');

      if (cat === 'all') {
        filteredVideos = [...videosData];
      } else if (cat === 'trending') {
        filteredVideos = [...videosData].sort((a, b) => (b.views || 0) - (a.views || 0));
      } else {
        const catLower = cat.toLowerCase();
        filteredVideos = videosData.filter(v => {
          if (v.category && v.category.toLowerCase() === catLower) return true;
          if (Array.isArray(v.categories) && v.categories.some(c => c.toLowerCase() === catLower)) return true;
          if (v.title) {
            const titleLower = v.title.toLowerCase();
            if (catLower === 'mom' && (titleLower.includes('mom') || titleLower.includes('bhabhi') || titleLower.includes('stepmom'))) return true;
            if (titleLower.includes(catLower)) return true;
          }
          return false;
        });
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
