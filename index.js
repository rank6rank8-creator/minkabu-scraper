const puppeteer = require('puppeteer');
const { google } = require('googleapis');

async function scrapeEconomicIndicators() {
  console.log('🌐 Puppeteer起動中...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });

  console.log('🧭 新しいページを開いています...');
  const page = await browser.newPage();

  const url = 'https://fx.minkabu.jp/indicators?country=all';
  console.log(`📡 ページにアクセス中: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle2' });

  console.log('🔍 経済指標データを取得中...');
  const data = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.economicCalendarTable tbody tr'));
    return rows.map(row => {
      const date = row.querySelector('.date')?.innerText.trim() || '';
      const name = row.querySelector('.event')?.innerText.trim() || '';
      const actual = row.querySelector('.actual')?.innerText.trim() || '';
      return [date, name, actual];
    });
  });

  console.log(`✅ ${data.length} 件の指標を取得しました`);
  await browser.close();
  return data;
}

async function authorize() {
  console.log('🔐 Google認証情報を読み込み中...');
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const client = await auth.getClient();
  console.log('🔑 Google認証に成功しました');
  return client;
}

async function updateSheet(values) {
  console.log('📄 Googleスプレッドシートに接続中...');
  const authClient = await authorize();
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  const spreadsheetId = process.env.SPREADSHEET_ID;

  console.log('📌 データを書き込む準備中...');
  const header = [['日時', '指標名', '結果']];
  const body = header.concat(values);

  console.log(`📝 ${body.length - 1} 件のデータを書き込みます`);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: '経済指標!A1',
    valueInputOption: 'RAW',
    requestBody: {
      values: body,
    },
  });

  console.log('✅ スプレッドシートを更新しました');
}

(async () => {
  try {
    console.log('🚀 スクレイピング処理を開始します');
    const scrapedData = await scrapeEconomicIndicators();

    console.log('📤 スプレッドシートへの書き込みを開始します');
    await updateSheet(scrapedData);

    console.log('🏁 全ての処理が完了しました');
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    console.error(error);
  }
})();
