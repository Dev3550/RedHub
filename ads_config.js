// ==========================================================================
// HotTube Adsterra & JuicyAds Ad Management Configuration
// ==========================================================================

const ADS_CONFIG = {
  // Master Ad Switches
  enabled: true,
  show_header_banner: true,
  show_native_grid_ads: true,
  show_player_modal_ad: true,
  show_popunder: true,

  // Frequency: Insert 1 native ad card after every N video cards (Default: 4)
  native_ad_frequency: 4,

  // 1. Adsterra Configuration
  adsterra: {
    enabled: true,
    // Header Banner 728x90 / 320x50
    header_banner_key: "YOUR_ADSTERRA_HEADER_KEY",
    // Native Banner Key
    native_grid_key: "YOUR_ADSTERRA_NATIVE_KEY",
    // Popunder Script URL
    popunder_url: "//pl123456.highcpmgate.com/adsterra_popunder.js"
  },

  // 2. JuicyAds Configuration
  juicyads: {
    enabled: true,
    // JuicyAds Header Banner Zone ID
    header_zone_id: "YOUR_JUICYADS_HEADER_ZONE_ID",
    // JuicyAds Video Player Banner Zone ID
    player_zone_id: "YOUR_JUICYADS_PLAYER_ZONE_ID",
    // JuicyAds Popunder Code
    popunder_id: "YOUR_JUICYADS_POPUNDER_ID"
  }
};

/**
 * Render Header Banner Ad
 */
function renderHeaderAd() {
  if (!ADS_CONFIG.enabled || !ADS_CONFIG.show_header_banner) return;
  const container = document.getElementById('headerAdSlot');
  if (!container) return;

  container.innerHTML = `
    <div class="ad-container header-ad">
      <span class="ad-label"><i class="fa-solid fa-rectangle-ad"></i> ADVERTISEMENT</span>
      <div class="ad-placeholder-box">
        <p class="ad-text"><strong>Adsterra / JuicyAds 728x90 Banner Slot</strong></p>
        <span class="ad-subtext">Replace <code>YOUR_ADSTERRA_HEADER_KEY</code> in <code>ads_config.js</code> with your live ad tag</span>
      </div>
    </div>
  `;
}

/**
 * Generate Native Ad Card HTML for Video Grid
 */
function getNativeAdCardHtml(index) {
  if (!ADS_CONFIG.enabled || !ADS_CONFIG.show_native_grid_ads) return '';

  return `
    <article class="video-card native-ad-card">
      <div class="thumb-container ad-thumb">
        <div class="ad-badge-overlay"><i class="fa-solid fa-bolt"></i> SPONSORED AD</div>
        <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80" alt="Sponsored Ad">
      </div>
      <div class="card-content">
        <span class="ad-sponsor-label">Adsterra / JuicyAds Native</span>
        <h3 class="card-title">🔥 Stream Unlimited Premium HD Videos - Click Here</h3>
        <div class="card-meta">
          <span class="card-channel"><i class="fa-solid fa-rectangle-ad"></i> Sponsored Partner</span>
          <span class="btn-ad-action">Visit Ad <i class="fa-solid fa-arrow-up-right-from-square"></i></span>
        </div>
      </div>
    </article>
  `;
}

/**
 * Initialize Popunder Script Trigger
 */
function initPopunderAd() {
  if (!ADS_CONFIG.enabled || !ADS_CONFIG.show_popunder) return;

  // Insert Popunder script if provided
  if (ADS_CONFIG.adsterra.popunder_url && !ADS_CONFIG.adsterra.popunder_url.includes('YOUR_')) {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = ADS_CONFIG.adsterra.popunder_url;
    document.head.appendChild(script);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderHeaderAd();
  initPopunderAd();
});
