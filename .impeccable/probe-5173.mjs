import { chromium } from "/Users/alessiobonti/dev/ai-canva/client/node_modules/playwright-core/index.mjs";
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
const res = await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
const info = await page.evaluate(() => ({
  title: document.title,
  nav: !!document.querySelector(".lp-nav"),
  h1: document.querySelector("h1")?.textContent?.trim(),
  cream: getComputedStyle(document.body).backgroundColor,
  font: getComputedStyle(document.body).fontFamily,
}));
console.log(JSON.stringify({ status: res.status(), ...info, errors }));
await browser.close();
