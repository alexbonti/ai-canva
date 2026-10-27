import { chromium } from "/Users/alessiobonti/dev/ai-canva/client/node_modules/playwright-core/index.mjs";
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { try { localStorage.clear(); } catch {} });
const page = await ctx.newPage();
await page.goto("http://127.0.0.1:5183", { waitUntil: "load" });
await page.waitForFunction(() => !!window.__dsh, null, { timeout: 30000 });
await page.waitForFunction(() => window.__dsh.useAuthStore.getState().loading === false, null, { timeout: 20000 });
await page.evaluate(() => window.__dsh.useAuthStore.setState({ user: { uid: "m", email: "m@e.com", displayName: "M", photoURL: "" }, loading: false }));
await page.waitForFunction(() => !!document.querySelector(".app-bar"), null, { timeout: 15000 });
await page.waitForTimeout(2400);
await page.evaluate(() => { const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent.trim().endsWith("Research")); b?.click(); });
await page.waitForTimeout(500);
await page.evaluate(() => {
  const st = window.__dsh.useBoardStore; const s = st.getState();
  const r = s.nodes.find((n) => (n.data.boxType || n.type) === "research");
  st.getState().updateBoxData(r.id, { output: "# Brief\n\nSome research text.", status: "success", tokens: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } });
});
await page.waitForTimeout(900);
const out = await page.evaluate(() => {
  const boxes = Array.from(document.querySelectorAll(".box-node")).map((b) => ({
    title: b.querySelector(".box-name")?.textContent,
    actions: Array.from(b.querySelectorAll("button")).map((x) => ({ t: JSON.stringify(x.textContent), title: x.title })),
  }));
  return { boxes, boxData: Object.values(window.__dsh.useBoardStore.getState().boxData).map((d) => d.status) };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
