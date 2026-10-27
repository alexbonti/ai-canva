import { chromium } from "/Users/alessiobonti/dev/ai-canva/client/node_modules/playwright-core/index.mjs";
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page = await browser.newPage();
page.on("response", async (r) => { if (r.status() >= 400) console.log(r.status(), r.url(), (await r.text().catch(() => "")).slice(0, 300)); });
await page.goto("http://127.0.0.1:5183", { waitUntil: "load" });
await page.waitForTimeout(3000);
await browser.close();
