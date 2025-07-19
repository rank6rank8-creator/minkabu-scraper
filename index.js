import { scrapeIndicators } from "./scrape.js";
import { writeToSpreadsheet } from "./spreadsheet.js";

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