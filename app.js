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

let trendingVideos = [];
let currentTrendingIndex = 0;
let trendingAutoTimer = null;
let currentHourlySeed = '';
let current15MinSeed = '';

/**
 * Deterministic Hourly & 15-Minute Seed Generators
 */
function getHourlySeed() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}-${d.getUTCHours()}`;
}

function get15MinSeed() {
  const d = new Date();
  const quarter = Math.floor(d.getUTCMinutes() / 15);
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}-${d.getUTCHours()}-${quarter}`;
}

/**
 * Seeded Pseudo-Random Array Shuffler
 */
function seededShuffle(array, seedStr) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const rng = function() {
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };

  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Update items per page according to responsive screen width
 */
function updateItemsPerPage() {
  itemsPerPage = window.innerWidth <= 768 ? 10 : 20;
  if (deviceBadge) {
    const mode = window.innerWidth <= 768 ? 'Mobile' : 'Desktop';
    deviceBadge.innerHTML = `<i class="fa-solid fa-desktop"></i> ${itemsPerPage} items / page (${mode})`;
  }
}

/**
 * Initialize App Data, Hourly/15-Min Shufflers & Responsive Rules
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

  // Store active seeds
  currentHourlySeed = getHourlySeed();
  current15MinSeed = get15MinSeed();

  // 1-Hour Homepage Auto-Shuffle
  videosData = seededShuffle(videosData, currentHourlySeed);
  filteredVideos = [...videosData];

  // 15-Minute Trending Carousel Auto-Shuffle with 8 diverse category videos
  updateTrendingSelection();

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

  // Schedule auto-shuffle check every minute
  setInterval(checkAutoShuffleTimers, 60000);
}

/**
 * Update Trending Video Selection (8 videos from diverse categories)
 */
function updateTrendingSelection() {
  const shuffledForTrending = seededShuffle([...videosData], current15MinSeed);
  const categoryMap = new Map();
  trendingVideos = [];

  for (const vid of shuffledForTrending) {
    const cat = vid.category || 'General';
    if (!categoryMap.has(cat) || trendingVideos.length >= 6) {
      categoryMap.set(cat, true);
      trendingVideos.push(vid);
    }
    if (trendingVideos.length >= 8) break;
  }

  if (trendingVideos.length < 8) {
    trendingVideos = shuffledForTrending.slice(0, 8);
  }
}

/**
 * Check if 1-Hour or 15-Min timer interval has rotated
 */
function checkAutoShuffleTimers() {
  const newHourlySeed = getHourlySeed();
  const new15MinSeed = get15MinSeed();

  let shouldRenderGrid = false;
  let shouldRenderTrending = false;

  if (newHourlySeed !== currentHourlySeed) {
    currentHourlySeed = newHourlySeed;
    videosData = seededShuffle(videosData, currentHourlySeed);
    if (!searchInput || !searchInput.value.trim()) {
      filteredVideos = [...videosData];
      shouldRenderGrid = true;
    }
  }

  if (new15MinSeed !== current15MinSeed) {
    current15MinSeed = new15MinSeed;
    updateTrendingSelection();
    shouldRenderTrending = true;
  }

  if (shouldRenderTrending) {
    currentTrendingIndex = 0;
    renderTrendingCarousel();
  }

  if (shouldRenderGrid) {
    renderCurrentPage();
  }
}

/**
 * Render Current Page Video Grid & Pagination
 */
function renderCurrentPage() {
  if (videoCountBadge) {
    videoCountBadge.textContent = `${filteredVideos.length.toLocaleString()} Videos Available`;
  }

  if (filteredVideos.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    if (videoGrid) videoGrid.innerHTML = '';
    if (paginationWrapper) paginationWrapper.classList.add('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (paginationWrapper) paginationWrapper.classList.remove('hidden');

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageVideos = filteredVideos.slice(start, end);

  if (videoGrid) {
    videoGrid.innerHTML = '';
    pageVideos.forEach(video => {
      const card = document.createElement('article');
      card.className = 'video-card';
      card.innerHTML = `
        <div class="thumb-container">
          <img src="${video.thumbnail_url || video.poster_url}" alt="${escapeHtml(video.title)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80'">
          <span class="badge-duration">${video.duration || '10:00'}</span>
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

      card.onclick = () => {
        window.open(`watch.html?id=${encodeURIComponent(video.id)}`, '_blank');
      };

      videoGrid.appendChild(card);
    });
  }

  renderPagination();
}

/**
 * Render Pagination Navigation Buttons
 */
function renderPagination() {
  if (!pageNumbers) return;
  pageNumbers.innerHTML = '';

  const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);

  if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
  if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;

  if (totalPages <= 1) return;

  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement('button');
    btn.className = `page-num ${i === currentPage ? 'active' : ''}`;
    btn.textContent = i;
    btn.onclick = () => goToPage(i);
    pageNumbers.appendChild(btn);
  }
}

/**
 * Navigate to specific page
 */
function goToPage(page) {
  currentPage = page;
  renderCurrentPage();
  if (catalogHeader) {
    catalogHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Render 8 Auto-Scrolling Trending Videos Carousel
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
      window.open(`watch.html?id=${encodeURIComponent(video.id)}`, '_blank');
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
      startTrendingAutoPlay();
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
 * Render Visual Category Cards inside Categories Modal
 */
function renderVisualCategoriesModal() {
  const visualGrid = document.getElementById('visualCategoriesGrid');
  if (!visualGrid) return;
  visualGrid.innerHTML = '';

  // Get all unique category chips defined in DOM
  const chips = Array.from(document.querySelectorAll('.chip'))
    .map(chip => chip.getAttribute('data-category'))
    .filter(cat => cat && cat !== 'all' && cat !== 'trending');

  chips.forEach(categoryName => {
    const catLower = categoryName.toLowerCase();

    // Filter videos matching this category
    const matchingVideos = videosData.filter(v => {
      if (v.category && v.category.toLowerCase() === catLower) return true;
      if (Array.isArray(v.categories) && v.categories.some(c => c.toLowerCase() === catLower)) return true;
      if (v.title) {
        const titleLower = v.title.toLowerCase();
        if (catLower === 'mom' && (titleLower.includes('mom') || titleLower.includes('bhabhi') || titleLower.includes('stepmom'))) return true;
        if (titleLower.includes(catLower)) return true;
      }
      return false;
    });

    const count = matchingVideos.length;
    // Get thumbnail from first matching video or fallback
    const sampleThumb = matchingVideos.length > 0
      ? (matchingVideos[0].thumbnail_url || matchingVideos[0].poster_url)
      : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80';

    const card = document.createElement('div');
    card.className = 'visual-category-card';
    card.innerHTML = `
      <img src="${sampleThumb}" alt="${escapeHtml(categoryName)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80'">
      <div class="visual-category-overlay">
        <h4 class="visual-category-title">${escapeHtml(categoryName)}</h4>
        <span class="visual-category-count">${count.toLocaleString()} Videos</span>
      </div>
    `;

    card.onclick = () => {
      selectCategoryByName(categoryName);
      closeCategoriesModal();
    };

    visualGrid.appendChild(card);
  });
}

function selectCategoryByName(catName) {
  const catLower = catName.toLowerCase();

  // Set active chip in bar
  document.querySelectorAll('.chip').forEach(c => {
    if (c.getAttribute('data-category').toLowerCase() === catLower) {
      c.classList.add('active');
    } else {
      c.classList.remove('active');
    }
  });

  if (catName === 'all') {
    filteredVideos = [...videosData];
  } else if (catName === 'trending') {
    filteredVideos = [...videosData].sort((a, b) => (b.views || 0) - (a.views || 0));
  } else {
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
  if (catalogHeader) {
    catalogHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function openCategoriesModal() {
  const modal = document.getElementById('categoriesModal');
  if (!modal) return;
  renderVisualCategoriesModal();
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeCategoriesModal() {
  const modal = document.getElementById('categoriesModal');
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

/**
 * Filter Videos via Search Query
 */
function handleSearch() {
  if (!searchInput) return;
  const query = searchInput.value.trim().toLowerCase();
  
  if (clearSearchBtn) {
    if (query.length > 0) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }
  }

  filteredVideos = videosData.filter(v => 
    (v.title && v.title.toLowerCase().includes(query)) || 
    (v.channel && v.channel.toLowerCase().includes(query))
  );

  currentPage = 1;
  renderCurrentPage();
}

/**
 * Event Listeners
 */
function setupEventListeners() {
  // Navbar Action Buttons
  const navTrendingBtn = document.getElementById('navTrendingBtn');
  const navCategoriesBtn = document.getElementById('navCategoriesBtn');
  const closeCategoriesModalBtn = document.getElementById('closeCategoriesModalBtn');
  const categoriesModal = document.getElementById('categoriesModal');

  if (navTrendingBtn) {
    navTrendingBtn.addEventListener('click', () => {
      selectCategoryByName('trending');
    });
  }

  if (navCategoriesBtn) {
    navCategoriesBtn.addEventListener('click', () => {
      openCategoriesModal();
    });
  }

  if (closeCategoriesModalBtn) {
    closeCategoriesModalBtn.addEventListener('click', () => {
      closeCategoriesModal();
    });
  }

  if (categoriesModal) {
    categoriesModal.addEventListener('click', (e) => {
      if (e.target === categoriesModal) {
        closeCategoriesModal();
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

  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) goToPage(currentPage - 1);
    });
  }

  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
      if (currentPage < totalPages) goToPage(currentPage + 1);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      handleSearch();
    });
  }

  if (resetSearchBtn) {
    resetSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      filteredVideos = [...videosData];
      currentPage = 1;
      renderCurrentPage();
    });
  }

  // Category chip filtering
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const targetChip = e.target.closest('.chip');
      if (!targetChip) return;
      const cat = targetChip.getAttribute('data-category');
      selectCategoryByName(cat);
    });
  });
}

function formatViews(num) {
  if (!num || isNaN(num)) return '10K+';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function cleanHotTubeBranding(str) {
  if (!str) return 'HotTube Video';
  return str.replace(/(xHamster|xHamsters|xNXX|Pornhub|XVideos|FreePornVideo)/gi, 'HotTube').trim();
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Launch App on DOM ready
document.addEventListener('DOMContentLoaded', initApp);
