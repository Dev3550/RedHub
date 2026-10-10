const { extractStreamDetails } = require('../utils');

async function test() {
  const result = await extractStreamDetails('https://xhaccess.com/videos/watch-this-sexy-blonde-amateur-teen-in-her-first-porn-xhKPnlp');
  console.log('Fixed stream details:', JSON.stringify(result, null, 2));
}

test();
