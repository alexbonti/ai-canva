import { chromium } from "/Users/alessiobonti/dev/ai-canva/client/node_modules/playwright-core/index.mjs";
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { try { localStorage.clear(); } catch {} });
const page = await ctx.newPage();
await page.goto("http://127.0.0.1:5183", { waitUntil: "load" });
await page.waitForFunction(() => !!window.__dsh && window.__dsh.useAuthStore.getState().loading === false, null, { timeout: 20000 });
await page.evaluate(() => window.__dsh.useAuthStore.setState({ user: { uid: "m", email: "m@e.com", displayName: "M", photoURL: "" }, loading: false }));
await page.waitForFunction(() => !!document.querySelector(".app-bar"), null, { timeout: 15000 });
await page.waitForTimeout(2400);
await page.evaluate(() => { const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent.trim().endsWith("Research")); b?.click(); });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const st = window.__dsh.useBoardStore; const s = st.getState();
  const r = s.nodes.find((n) => (n.data.boxType || n.type) === "research");
  st.getState().updateBoxData(r.id, { output: "# Brief\n\nSome research text.", status: "success", tokens: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } });
});
await page.waitForTimeout(900);
const out = await page.evaluate(() => {
  const b = Array.from(document.querySelectorAll(".box-node button")).find((x) => /Save/.test(x.textContent));
  if (!b) return { none: true };
  const t = b.textContent;
  return {
    text: JSON.stringify(t),
    len: t.length,
    codes: Array.from(t).map((c) => c.codePointAt(0).toString(16)),
    sr: JSON.stringify(b.querySelector(".sr-only")?.textContent),
    srCodes: Array.from(b.querySelector(".sr-only")?.textContent || "").map((c) => c.codePointAt(0).toString(16)),
    trimEq: b.textContent.trim() === "💾 Save",
    kids: Array.from(b.childNodes).map((n) => ({ type: n.nodeType, name: n.nodeName, value: JSON.stringify(n.nodeValue) })),
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
