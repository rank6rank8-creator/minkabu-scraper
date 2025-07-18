require('dotenv').config();
const puppeteer = require('puppeteer');
const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = '経済指標'; // スプレッドシートのシート名

(async () => {
  console.log('🚀 スクレイピング処理を開始します');

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  console.log('🌐 Puppeteer起動中...');
  await page.goto('https://fx.minkabu.jp/indicators?country=all', {
    waitUntil: 'domcontentloaded',
  });

  console.log('🔍 経済指標データを取得中...');

  const data = await page.evaluate(() => {
    const rows = document.querySelectorAll('.eilist__list > li');
    const results = [];

    rows.forEach(row => {
      const time = row.querySelector('.eilist__time')?.textContent.trim() || '';
      const country = row.querySelector('.eilist__flag')?.getAttribute('title') || '';
      const title = row.querySelector('.eilist__event')?.textContent.trim() || '';
      const importance = row.querySelectorAll('.icn-importance').length;
      const previous = row.querySelectorAll('.eilist__data')[0]?.textContent.trim() || '';
      const forecast = row.querySelectorAll('.eilist__data')[1]?.textContent.trim() || '';
      const result = row.querySelectorAll('.eilist__data')[2]?.textContent.trim() || '';

      if (time && country && title) {
        results.push([time, country, title, importance, previous, forecast, result]);
      }
    });

    return results;
  });

  await browser.close();

  console.log(`✅ ${data.length} 件の指標を取得しました`);

  console.log('📤 スプレッドシートへの書き込みを開始します');

  const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2`,
    valueInputOption: 'RAW',
    resource: {
      values: data,
    },
  });

  console.log('✅ スプレッドシートを更新しました');
  console.log('🏁 全ての処理が完了しました');
})();
