const { google } = require('googleapis');

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

async function updateSheet() {
  const authClient = await authorize();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  const spreadsheetId = process.env.SPREADSHEET_ID;

  // 👇 ここに Puppeteer でスクレイピングした結果を代入するよう拡張してください
  const values = [
    ['日時', '指標名', '結果'],
    ['2025/07/16 10:00', 'GDP速報', '3.2%'],
    ['2025/07/16 14:00', '雇用統計', '250k'],
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: '経済指標!A1',
    valueInputOption: 'RAW',
    requestBody: {
      values: values,
    },
  });

  console.log('✅ スプレッドシートを更新しました');
}

(async () => {
  console.log('📥 スクレイピング開始...');
  // TODO: Puppeteerなどでスクレイピングする処理をここに追加

  console.log('📤 スプレッドシート更新中...');
  await updateSheet();
})();
