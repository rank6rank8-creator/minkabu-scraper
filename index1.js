const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

  await page.goto('https://fx.minkabu.jp/indicators', { waitUntil: 'domcontentloaded' });

  // 👇 待機（page.waitForTimeout の代用）
  await new Promise(resolve => setTimeout(resolve, 5000));

  const html = await page.content();
  console.log(html); // HTMLの中にテーブルがあるか確認

  await browser.close();
})();
