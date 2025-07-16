const puppeteer = require('puppeteer');
const { google } = require('googleapis');

async function scrapeEconomicIndicators() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://fx.minkabu.jp/indicators?country=all', { waitUntil: 'networkidle2' });

  const data = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.economicCalendarTable tbody tr'));
    return rows.map(row => {
      const date = row.querySelector('.date')?.innerText.trim() || '';
      const name = row.querySelector('.event')?.innerText.trim() || '';
      const actual = row.querySelector('.actual')?.innerText.trim() || '';
      return [date, name, actual];
    });
  });

  await browser.close();
  return data;
}

async function authorize() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return await auth.getClient();
}

async function updateSheet(values) {
  const authClient = await authorize();
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  const spreadsheetId = process.env.SPREADSHEET_ID;

  // 1行目はヘッダー
  const header = [['日時', '指標名', '結果']];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: '経済指標!A1',
    valueInputOption: 'RAW',
    requestBody: {
      values: header.concat(values),
    },
  });

  console.log('✅ スプレッドシートを更新しました');
}

(async () => {
  console.log('📥 スクレイピング開始...');
  const scrapedData = await scrapeEconomicIndicators();

  console.log('📤 スプレッドシート更新中...');
  await updateSheet(scrapedData);
})();
