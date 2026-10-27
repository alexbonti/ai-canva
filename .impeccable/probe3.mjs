import { chromium } from "/Users/alessiobonti/dev/ai-canva/client/node_modules/playwright-core/index.mjs";
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://127.0.0.1:5183", { waitUntil: "load" });
await page.waitForTimeout(1500);
await page.evaluate(() => window.__dsh.useAuthStore.setState({ user: { uid: "u", email: "a@b.c", displayName: "A", photoURL: "" }, loading: false }));
await page.waitForTimeout(2000);
const html = await page.evaluate(() => {
  const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent.trim() === "Idea");
  return b ? b.innerHTML.slice(0, 400) : "none";
});
console.log(html);
await browser.close();
