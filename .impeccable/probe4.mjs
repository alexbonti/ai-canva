import { chromium } from "/Users/alessiobonti/dev/ai-canva/client/node_modules/playwright-core/index.mjs";
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
await page.goto("http://127.0.0.1:5183", { waitUntil: "load" });
await page.waitForFunction(() => !!window.__dsh, null, { timeout: 30000 });
await page.evaluate(() => window.__dsh.useAuthStore.setState({ user: { uid: "u", email: "a@b.c", displayName: "A", photoURL: "" }, loading: false }));
await page.waitForTimeout(2500);
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.trim() === "Idea");
  btn?.click();
});
await page.waitForTimeout(600);
const out = await page.evaluate(async () => {
  const st = window.__dsh.useBoardStore;
  const s = st.getState();
  const node = s.nodes.find((n) => (n.data.boxType || n.type) === "idea");
  const before = JSON.parse(JSON.stringify(st.getState().boxData[node.id] || {}));
  s.updateBoxData(node.id, { content: "HELLO CONTENT", output: "HELLO CONTENT", status: "success" });
  await new Promise((r) => setTimeout(r, 300));
  const after = JSON.parse(JSON.stringify(st.getState().boxData[node.id] || {}));
  return { id: node.id, beforeContent: before.content, afterContent: after.content, keys: Object.keys(after).slice(0, 8), ta: document.querySelector("textarea")?.value };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
