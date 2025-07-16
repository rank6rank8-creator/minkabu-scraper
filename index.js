const puppeteer = require('puppeteer');
const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1SkMkQgf_E232fleM8Fv96FoPH3h7Dc7NYLjGfYBHVLw';
const SHEET_NAME = '経済指標';

async function scrapeData() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // GitHub Actions環境向け
  });
  const page = await browser.newPage();

  await page.goto('https://minkabu.jp/kalender', { waitUntil: 'networkidle2' });

  // 必要な情報だけスクレイピング（例としてテーブルの行を抽出）
  const data = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('table.kalender-table tbody tr')];
    return rows.map(row => {
      const cells = row.querySelectorAll('td');
      return Array.from(cells).map(cell => cell.innerText.trim());
    });
  });

  await browser.close();
  return data;
}

async function authorize() {
  const credentials = JSON.parse(fs.readFileSync('credentials.json'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // トークンの保存はGitHub Actionsではしないので環境変数等で渡す場合は別途対応が必要
  // ここではアクセストークンの自動取得済みトークンがない場合はエラーになる想定

  // ここではservice accountやOAuth2の仕組みを使ってアクセストークンを取得済みと仮定

  // 例：環境変数にアクセストークンを入れているなら
  // oAuth2Client.setCredentials({ access_token: process.env.ACCESS_TOKEN });

  // もしくは、事前にトークンファイルを用意して読み込むなどの実装が必要

  // 簡易版：トークンファイルtoken.jsonを読み込む方法
  try {
    const token = fs.readFileSync('token.json');
    oAuth2Client.setCredentials(JSON.parse(token));
  } catch (err) {
    console.error('トークンファイルが見つかりません。');
    throw err;
  }

  return oAuth2Client;
}

async function updateSheet(data) {
  const auth = await authorize();
  const sheets = google.sheets({ version: 'v4', auth });

  // シートの指定範囲にデータをセット
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2`, // データ開始位置
    valueInputOption: 'RAW',
    requestBody: {
      values: data,
    },
  });
}

(async () => {
  try {
    console.log('スクレイピング開始...');
    const data = await scrapeData();

    console.log('スプレッドシート更新...');
    await updateSheet(data);

    console.log('処理完了');
  } catch (e) {
    console.error(e);
  }
})();
