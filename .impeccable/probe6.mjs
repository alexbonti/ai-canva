import { chromium } from "/Users/alessiobonti/dev/ai-canva/client/node_modules/playwright-core/index.mjs";
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://127.0.0.1:5183", { waitUntil: "load" });
await page.waitForFunction(() => !!window.__dsh, null, { timeout: 30000 });
await page.evaluate(() => window.__dsh.useAuthStore.setState({ user: { uid: "u", email: "a@b.c", displayName: "A", photoURL: "" }, loading: false }));
await page.waitForTimeout(2500);
for (const l of ["Idea","Research","PRD","UI Design","Note","Checklist","Timer"]) {
  await page.evaluate((l) => { const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent.trim().endsWith(l)); b?.click(); }, l);
  await page.waitForTimeout(200);
}
const info = await page.evaluate(() => {
  const st = window.__dsh.useBoardStore;
  const s = st.getState();
  return s.nodes.map((n) => ({ t: n.data.boxType || n.type, x: n.position?.x, y: n.position?.y, hasData: !!s.boxData[n.id], hidden: n.hidden || false }));
});
console.log(JSON.stringify(info, null, 0));
await browser.close();
