import fs from "fs";
import { scrapeIndicators } from "./scrape.js";
import { writeToSpreadsheet } from "./spreadsheet.js";

// credentials.json を Secrets から動的に生成
const credPath = "./credentials.json";
  const client_email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const private_key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!client_email || !private_key) {
    console.log("❌ GOOGLE_SERVICE_ACCOUNT_EMAIL または GOOGLE_PRIVATE_KEY が設定されていません");
    process.exit(1);
  }

  const credentials = {
    type: "service_account",
    client_email,
    private_key,
  };

  // ここでファイルを書き出す
  fs.writeFileSync(credPath, JSON.stringify(credentials));
  console.log("📝 credentials.json を Secrets から生成しました");

console.log("🚀 スクレイピング処理を開始します");

(async () => {
  try {
    const data = await scrapeIndicators();
    console.log("📋 経済指標一覧:");
    console.log(data.map(row => row.join(",")).join("\n"));

    console.log("📤 スプレッドシートへの書き込みを開始します");
    await writeToSpreadsheet(data);
    console.log("✅ 完了しました！");
  } catch (err) {
    console.error("❌ エラーが発生しました:", err);
  }
})();
