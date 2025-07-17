const puppeteer = require('puppeteer');
const { google } = require('googleapis');

// スプレッドシート設定
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = 'Sheet1'; // 必要に応じて変更

(async () => {
  console.log('🚀 スクレイピング処理を開始します');

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  console.log('🌐 Puppeteer起動中...');
  console.log('🧭 新しいページを開いています...');
  await page.goto('https://fx.minkabu.jp/indicators?country=all', { waitUntil: 'networkidle0' });
  console.log('📡 ページにアクセス中: https://fx.minkabu.jp/indicators?country=all');

  console.log('🔍 経済指標データを取得中...');

  const data = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('div.indicator-table > table > tbody > tr'));
    return rows.map(row => {
      const cols = row.querySelectorAll('td');
      return {
        date: cols[0]?.innerText.trim(),
        time: cols[1]?.innerText.trim(),
        country: cols[2]?.innerText.trim(),
        indicator: cols[3]?.innerText.trim(),
        importance: cols[4]?.innerText.trim(),
        result: cols[5]?.innerText.trim(),
        forecast: cols[6]?.innerText.trim(),
        previous: cols[7]?.innerText.trim()
      };
    });
  });

  console.log(`✅ ${data.length} 件の指標を取得しました`);

  await browser.close();

  console.log('📤 スプレッドシートへの書き込みを開始します');

  // Google Sheets 認証と書き込み
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  console.log('📄 Googleスプレッドシートに接続中...');
  console.log('🔐 Google認証情報を読み込み中...');

  const authClient = await auth.getClient();
  console.log('🔑 Google認証に成功しました');

  const values = data.map(row => [
    row.date, row.time, row.country, row.indicator,
    row.importance, row.result, row.forecast, row.previous
  ]);

  console.log('📌 データを書き込む準備中...');
  console.log(`📝 ${values.length} 件のデータを書き込みます`);

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:H`,
    valueInputOption: 'RAW',
    requestBody: {
      values: values,
    },
  });

  console.log('✅ スプレッドシートを更新しました');
  console.log('🏁 全ての処理が完了しました');
})();
