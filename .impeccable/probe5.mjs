import { chromium } from "/Users/alessiobonti/dev/ai-canva/client/node_modules/playwright-core/index.mjs";
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
await page.goto("http://127.0.0.1:5183", { waitUntil: "load" });
await page.waitForFunction(() => !!window.__dsh, null, { timeout: 30000 });
await page.evaluate(() => window.__dsh.useAuthStore.setState({ user: { uid: "u", email: "a@b.c", displayName: "A", photoURL: "" }, loading: false }));
await page.waitForTimeout(2500);
for (const l of ["Idea", "Research", "PRD", "UI Design", "Note", "Checklist", "Timer"]) {
  const found = await page.evaluate((l) => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.trim().endsWith(l));
    if (btn) btn.click();
    return !!btn;
  }, l);
  await page.waitForTimeout(250);
  const types = await page.evaluate(() => window.__dsh.useBoardStore.getState().nodes.map((n) => n.data.boxType || n.type));
  console.log(l, found, JSON.stringify(types));
}
await browser.close();
