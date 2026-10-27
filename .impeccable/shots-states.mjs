import { chromium } from "/Users/alessiobonti/dev/ai-canva/client/node_modules/playwright-core/index.mjs";
const APP = process.env.APP_URL || "http://localhost:5173";
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await ctx.addInitScript(() => { try { localStorage.clear(); } catch {} });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(APP, { waitUntil: "load" });
await page.waitForFunction(() => !!window.__dsh && window.__dsh.useAuthStore.getState().loading === false, null, { timeout: 20000 });
await page.evaluate(() => window.__dsh.useAuthStore.setState({ user: { uid: "a", email: "a@b.c", displayName: "A", photoURL: "" }, loading: false }));
await page.waitForFunction(() => !!document.querySelector(".app-bar"), null, { timeout: 15000 });
await page.waitForTimeout(2400);
await page.evaluate(() => { document.querySelectorAll("button").forEach((b) => { if (b.title === "Hide help") b.click(); }); });
await page.waitForTimeout(500);

const added = await page.evaluate(() => {
  const st = window.__dsh.useBoardStore;
  const s = st.getState();
  const keep = s.nodes.filter((n) => n.type !== "image" && !(n.data?.boxType === "image"));
  if (keep.length !== s.nodes.length) st.setState({ nodes: keep, edges: s.edges });
  const before = st.getState().nodes.length;
  s.addBox("image", { x: 1050, y: 620 });
  s.addBox("code", { x: 760, y: 980 });
  return { before, after: st.getState().nodes.length };
});

await page.waitForTimeout(900);
const ids = await page.evaluate(() => {
  const st = window.__dsh.useBoardStore;
  const nodes = st.getState().nodes;
  const img = nodes.find((n) => (n.data?.boxType || n.type) === "image");
  const code = nodes.find((n) => (n.data?.boxType || n.type) === "code");
  window.__dsh.useBoardStore.getState().updateBoxData(code.id, {
    code: `import React from "react";\n\nexport default function App() {\n  return (\n    <main style={{ padding: 24, fontFamily: "system-ui" }}>\n      <h1>Weeknight plan</h1>\n      <ul>\n        <li>Miso noodles</li>\n        <li>Sheet-pan chicken</li>\n      </ul>\n    </main>\n  );\n}\n`,
    status: "done",
    output: "generated",
  });
  return { img: img.id, code: code.id };
});

// Frame the two new boxes
await page.evaluate(() => {
  const vp = document.querySelector(".react-flow__viewport");
  if (vp) vp.style.transform = "translate(-620px,-520px) scale(0.9)";
});
await page.waitForTimeout(700);
for (const [name, id] of Object.entries(ids)) {
  const el = await page.$(`[data-id="${id}"]`);
  if (el) await el.screenshot({ path: `.impeccable/review/line-box-${name}.png` });
}
// Code box tab states: code / preview
const codeNode = await page.$(`[data-id="${ids.code}"]`);
if (codeNode) {
  const previewBtn = await codeNode.$("button:has-text('Preview')");
  await previewBtn?.click();
  await page.waitForTimeout(1200);
  await codeNode.screenshot({ path: ".impeccable/review/line-box-code-preview.png" });
}
await page.screenshot({ path: ".impeccable/review/line-states-board.png" });
console.log(JSON.stringify({ added, errors }));
await browser.close();
