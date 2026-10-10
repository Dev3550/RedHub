const { fetchHtml } = require('../utils');

async function inspect() {
  const url = 'https://xhaccess.com/videos/watch-this-sexy-blonde-amateur-teen-in-her-first-porn-xhKPnlp';
  const html = await fetchHtml(url);
  if (!html) {
    console.log('HTML fetch returned null');
    return;
  }

  console.log('HTML length:', html.length);
  const m3u8 = html.match(/https?:\\?\/\\?\/[^"' ]+\.m3u8[^"' ]*/gi);
  console.log('M3U8 Matches:', m3u8);

  const mp4s = html.match(/https?:\\?\/\\?\/[^"' ]+\.mp4[^"' ]*/gi);
  console.log('MP4 Matches:', mp4s ? mp4s.slice(0, 10) : null);

  const initialsMatch = html.match(/window\.initials\s*=\s*(\{.*?\});\s*<\/script>/s);
  if (initialsMatch) {
    try {
      const parsed = JSON.parse(initialsMatch[1]);
      console.log('Initials Keys:', Object.keys(parsed));
      if (parsed.videoModel) console.log('videoModel Keys:', Object.keys(parsed.videoModel));
      if (parsed.xplayerSettings) console.log('xplayerSettings Keys:', Object.keys(parsed.xplayerSettings));
      if (parsed.xplayerSettings?.sources) console.log('xplayerSettings.sources:', parsed.xplayerSettings.sources);
    } catch (e) {
      console.log('JSON parse error:', e.message);
    }
  }
}

inspect();
