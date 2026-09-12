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

// Hero Banner Elements
const heroBackdrop = document.getElementById('heroBackdrop');
const heroTitle = document.getElementById('heroTitle');
const heroChannel = document.getElementById('heroChannel');
const heroViews = document.getElementById('heroViews');
const heroDuration = document.getElementById('heroDuration');
const heroPlayBtn = document.getElementById('heroPlayBtn');

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

  // Check search query parameter in URL (e.g. index.html?search=desi)
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get('search');
  if (searchParam && searchInput) {
    searchInput.value = searchParam;
    handleSearch();
  }

  renderHeroBanner(videosData[0]);
  renderCurrentPage();
  setupEventListeners();
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
 * Render Video Catalog Grid for Current Page
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

  pageItems.forEach(video => {
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

    // Direct Navigation to Watch Page (watch.html?id=<video_id>)
    card.onclick = () => {
      window.location.href = `watch.html?id=${encodeURIComponent(video.id)}`;
    };

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

  heroPlayBtn.onclick = () => {
    window.location.href = `watch.html?id=${encodeURIComponent(video.id)}`;
  };
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
          if (v.title) {
            const titleLower = v.title.toLowerCase();
            if (catLower === 'mom' && (titleLower.includes('mom') || titleLower.includes('bhabhi') || titleLower.includes('stepmom'))) return true;
            return titleLower.includes(catLower);
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
