import { chromium } from "/Users/alessiobonti/dev/ai-canva/client/node_modules/playwright-core/index.mjs";
import { readFile } from "node:fs/promises";
const APP = process.env.APP_URL || "http://localhost:5173";
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
await ctx.addInitScript(() => { try { localStorage.clear(); } catch {} });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message.slice(0, 200)));
await page.goto(APP, { waitUntil: "load" });
await page.waitForFunction(() => !!window.__dsh && window.__dsh.useAuthStore.getState().loading === false, null, { timeout: 30000 });
await page.evaluate(() => window.__dsh.useAuthStore.setState({ user: { uid: "fix", email: "alessio@example.com", displayName: "Alessio", photoURL: "" }, loading: false }));
await page.waitForFunction(() => !!document.querySelector(".app-bar"), null, { timeout: 20000 });
await page.waitForTimeout(2000);

const HTML = '<!DOCTYPE html>\n<html><head><meta charset="utf-8"><title>Dinner planner</title></head><body><h1 id="headline">Weeknight plan</h1><p>A page the UI box built.</p></body></html>';

const ids = await page.evaluate((html) => {
  const st = window.__dsh.useBoardStore;
  st.setState({ nodes: [], edges: [], boxData: {} });
  const positions = { ui: [40, 40], legacyUi: [480, 40], code: [900, 40], stitch: [1280, 40] };
  const mk = (slot, type, patch) => {
    st.getState().addBox(type, { x: positions[slot][0], y: positions[slot][1] });
    const id = st.getState().nodes[st.getState().nodes.length - 1].id;
    st.getState().updateBoxData(id, patch);
    return id;
  };
  return {
    ui: mk("ui", "ui", { code: html, output: html, designBrief: "brief", status: "success" }),
    legacyUi: mk("legacyUi", "ui", { code: 'function App() { return <main><h1>Legacy UI</h1></main>; }\nReactDOM.createRoot(document.getElementById("root")).render(<App />);', output: "", status: "success" }),
    code: mk("code", "code", { code: 'import React from "react";\nexport default function App() { return <h1>Code box</h1>; }', output: "", status: "success" }),
    stitch: mk("stitch", "stitch", { code: '<!DOCTYPE html><html><body><h1 id="stitch">Stitch screen</h1></body></html>', output: "", status: "success" }),
  };
}, HTML);
await page.waitForTimeout(800);

// Frame the nodes so we can screenshot the UI box later.
await page.evaluate(() => { const vp = document.querySelector(".react-flow__viewport"); if (vp) vp.style.transform = "translate(20px, 20px) scale(0.75)"; });
await page.waitForTimeout(400);

const results = {};

// 1) Modern UI HTML preview renders the page (not a Babel error).
{
  const node = await page.$(`[data-id="${ids.ui}"]`);
  await (await node.$("button:has-text('Preview')"))?.click();
  await page.waitForTimeout(1800);
  const frame = page.frames().find((f) => f !== page.mainFrame() && f.url() === "about:srcdoc");
  results.uiPreviewText = frame ? (await frame.evaluate(() => document.body?.innerText?.trim())) : "NO FRAME";
  await node.screenshot({ path: ".impeccable/review/fix-ui-html-preview.png" });
  // 2) Modern UI HTML download is the page itself.
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 5000 }), (await node.$("button[title='Download as HTML']"))?.click()]);
  const path = await dl.path();
  const content = await readFile(path, "utf8");
  results.uiDownload = { filename: dl.suggestedFilename(), startsWithDoc: content.trimStart().startsWith("<!DOCTYPE html>"), htmlCount: (content.match(/<html/gi) || []).length, babelWrapper: content.includes("text/babel") };
}

// 3) Legacy UI (JSX) preview still wraps into the React preview.
{
  const node = await page.$(`[data-id="${ids.legacyUi}"]`);
  await (await node.$("button:has-text('Preview')"))?.click();
  await page.waitForTimeout(1500);
  const frame = page.frames().filter((f) => f !== page.mainFrame() && f.url() === "about:srcdoc");
  results.legacyFrames = frame.length;
}

// 4) Code box download keeps the React wrapper.
{
  const node = await page.$(`[data-id="${ids.code}"]`);
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 5000 }), (await node.$("button[title='Download as HTML']"))?.click()]);
  const content = await readFile(await dl.path(), "utf8");
  results.codeDownload = { startsWithDoc: content.trimStart().startsWith("<!DOCTYPE html>"), babelWrapper: content.includes("text/babel") };
}

// 5) Stitch download is raw HTML.
{
  const node = await page.$(`[data-id="${ids.stitch}"]`);
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 5000 }), (await node.$("button[title='Download as HTML']"))?.click()]);
  const content = await readFile(await dl.path(), "utf8");
  results.stitchDownload = { raw: content.includes('id="stitch"'), babelWrapper: content.includes("text/babel") };
}

results.errors = errors;
console.log(JSON.stringify(results, null, 1));
await browser.close();
