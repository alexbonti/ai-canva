import { chromium } from "/Users/alessiobonti/dev/ai-canva/client/node_modules/playwright-core/index.mjs";
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { try { localStorage.clear(); } catch {} });
const page = await ctx.newPage();
await page.goto("http://127.0.0.1:5183", { waitUntil: "load" });
await page.waitForFunction(() => !!window.__dsh && window.__dsh.useAuthStore.getState().loading === false, null, { timeout: 20000 });
await page.evaluate(() => window.__dsh.useAuthStore.setState({ user: { uid: "a", email: "a@b.c", displayName: "A", photoURL: "" }, loading: false }));
await page.waitForFunction(() => !!document.querySelector(".app-bar"), null, { timeout: 15000 });
await page.waitForTimeout(2200);
await page.evaluate(() => { const b = Array.from(document.querySelectorAll("button")).find((y) => y.textContent.trim().endsWith("UI Design")); b?.click(); });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const st = window.__dsh.useBoardStore; const s = st.getState();
  const ui = s.nodes.find((n) => (n.data.boxType || n.type) === "ui");
  s.updateBoxData(ui.id, { status: "error", error: "The provider timed out after 300s. Your prompt and connected inputs are kept — run it again." });
});
await page.waitForTimeout(600);
const out = await page.evaluate(() => {
  const banner = document.querySelector(".box-node .text-state-error");
  const body = banner?.closest(".box-body");
  const rect = (el) => { const r = el.getBoundingClientRect(); return { w: r.width, h: r.height, x: r.x }; };
  return { banner: banner && rect(banner), body: body && rect(body), cs: banner && getComputedStyle(banner).overflow, textW: banner && banner.scrollWidth };
});
console.log(JSON.stringify(out, null, 1));
const box = await page.$(".box-node");
if (box) await box.screenshot({ path: ".impeccable/review/line-ui-error.png" });
await browser.close();
