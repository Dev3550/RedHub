const { fetchHtml } = require('./utils');

async function checkSiteStats() {
  console.log('🔍 Fetching main target stats...');

  // 1. Search Query stats
  const searchHtml = await fetchHtml('https://xhaccess.com/search/xhamsters');
  if (searchHtml) {
    const match = searchHtml.match(/id=['"]initials-script['"]>window\.initials\s*=\s*(\{.*?\});/s);
    if (match) {
      const data = JSON.parse(match[1]);
      console.log('\n--- SEARCH STATS ---');
      console.log('Title Summary:', data.searchTitleSummaryComponent?.resultCount);
      console.log('Categories Count in Filter:', data.filters?.categoriesSelectorProps?.options?.length);
      console.log('Categories List:', data.filters?.categoriesSelectorProps?.options?.map(o => o.label).slice(0, 15).join(', '));
    }
  }

  // 2. Date Filtered - Last Week Stats
  const weeklyHtml = await fetchHtml('https://xhaccess.com/search/xhamsters?date=weekly');
  if (weeklyHtml) {
    const match = weeklyHtml.match(/id=['"]initials-script['"]>window\.initials\s*=\s*(\{.*?\});/s);
    if (match) {
      const data = JSON.parse(match[1]);
      console.log('\n--- LAST WEEK NEW VIDEOS STATS ---');
      console.log('Last Week Result Count:', data.searchTitleSummaryComponent?.resultCount);
    }
  }

  // 3. Main Categories Page
  const catHtml = await fetchHtml('https://xhaccess.com/categories');
  if (catHtml) {
    const match = catHtml.match(/id=['"]initials-script['"]>window\.initials\s*=\s*(\{.*?\});/s);
    if (match) {
      const data = JSON.parse(match[1]);
      console.log('\n--- TOTAL CATEGORIES PAGE STATS ---');
      console.log('Categories Count:', data.categoriesListProps?.categories?.length || data.categoriesProps?.categories?.length);
    }
  }
}

checkSiteStats();
