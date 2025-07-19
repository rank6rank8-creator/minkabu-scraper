import puppeteer from "puppeteer";

export async function scrapeIndicators() {
  console.log("🌐 Puppeteer起動中...");
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
  const page = await browser.newPage();

  console.log("🧭 新しいページを開いています...");
  await page.goto("https://fx.minkabu.jp/indicators?country=all", {
    waitUntil: "networkidle2",
  });

  console.log("⏳ 経済指標のロードを待機中...");
  await page.waitForFunction(() => {
    const rows = document.querySelectorAll("table tbody tr");
    return rows.length > 3;
  }, { timeout: 10000 });

  console.log("🔍 経済指標データを取得中...");

  const rows = await page.$$eval("table", (tables) => {
	const allData = [];

    tables.forEach((table) => {
      const caption = table.querySelector("caption.tbl__caption");
      const tbody = table.querySelector("tbody");
      if (!caption || !tbody) return;

      const rawDate = caption.textContent?.trim() || "";
      const year = rawDate.match(/(\d{4})年/)?.[1];
      const month = rawDate.match(/(\d{2})月/)?.[1];
      const day = rawDate.match(/(\d{2})日/)?.[1];
      const dateText = year && month && day ? `${year}-${month}-${day}` : "";

      const rows = Array.from(tbody.querySelectorAll("tr"));

      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll("td"));
        const texts = cells.map((cell) => cell.textContent?.trim() || "");

        const indicatorName = texts[2] || "";
        const countryMatch = indicatorName.split("・")[0] || "";

        const starSvgsYellow = row.querySelectorAll('td:nth-child(4) svg.i-star.yellow');
        const starSvgsAmber = row.querySelectorAll('td:nth-child(4) svg.i-star.amber');
        const starSvgsRed = row.querySelectorAll('td:nth-child(4) svg.i-star.red');

        let stars = 0;
        if (starSvgsYellow.length !== 0) {
          stars = starSvgsYellow.length;
        } else if (starSvgsAmber.length !== 0) {
          stars = starSvgsAmber.length;
        } else if (starSvgsRed.length !== 0) {
          stars = starSvgsRed.length;
        } else {
          return;
        }

        allData.push([
          dateText,
          texts[0],       // 時間
          countryMatch,   // 国
          indicatorName,  // 指標名
          stars,          // 重要度
          texts[4],       // 前回ドル円変動幅
          texts[5],       // 前回
          texts[6],       // 予想
          texts[7],       // 結果
        ]);
      });
    });

    return allData;
  });

  await browser.close();

  const header = ["日付", "時間", "国", "指標名", "重要度", "前回ドル円変動幅", "前回", "予想", "結果"];
  return [header, ...rows];
}
