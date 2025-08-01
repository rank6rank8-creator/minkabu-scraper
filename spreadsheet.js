import { google } from "googleapis";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

export async function writeToSpreadsheet(data) {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(process.cwd(), "credentials.json"),
    scopes: SCOPES,
  });

  const client = await auth.getClient();

  const sheets = google.sheets({ version: "v4", auth: client });

  // シート全体をクリア（空白化）
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: "経済指標", // シート名だけ指定で全セルクリア
  });

  // データをA1から上書き
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "経済指標!A1",
    valueInputOption: "RAW",
    requestBody: {
      values: data,
    },
  });

  console.log("✅ スプレッドシート更新完了");
}
