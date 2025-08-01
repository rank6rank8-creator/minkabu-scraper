import { google } from "googleapis";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import iconv from "iconv-lite";

dotenv.config(); 

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const OUTPUT_DIR = "./output";

export async function writeToSpreadsheet(data) {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(process.cwd(), "credentials.json"),
    scopes: SCOPES,
  });

  const client = await auth.getClient();

  const sheets = google.sheets({ version: "v4", auth: client });

  // 先に全体をクリア
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: "経済指標", // シート名だけ指定で全セルクリアされる
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "経済指標!A1",
    valueInputOption: "RAW",
    requestBody: {
      values: data,
    },
  });

 // CSV文字列に変換
  const csvRows = data.map((row) =>
    row.map((cell) => String(cell).replace(/,/g, "")).join(",")
  );
  const csvText = csvRows.join("\n");

  // Shift_JISに変換
  const shiftJISBuffer = iconv.encode(csvText, "Shift_JIS");

  // 保存先パス
  const outputPath = path.join(OUTPUT_DIR, "shift_jis.csv");

  // ファイル出力
  fs.writeFileSync(outputPath, shiftJISBuffer);

  console.log(`✅ CSV saved as Shift_JIS at: ${outputPath}`);
}
