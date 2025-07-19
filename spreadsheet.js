import { google } from "googleapis";
import path from "path";
import dotenv from "dotenv";
dotenv.config(); 

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

export async function writeToSpreadsheet(data) {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: SCOPES,
  });

  const client = await auth.getClient();

  const sheets = google.sheets({ version: "v4", auth: client });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "経済指標!A1",
    valueInputOption: "RAW",
    requestBody: {
      values: data,
    },
  });
}
