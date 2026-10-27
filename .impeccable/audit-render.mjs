import { chromium } from "/Users/alessiobonti/dev/ai-canva/client/node_modules/playwright-core/index.mjs";
const APP = process.env.APP_URL || "http://localhost:5173";
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
await ctx.addInitScript(() => { try { localStorage.clear(); } catch {} });
const page = await ctx.newPage();
const pageErrors = [];
const consoleErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message.slice(0, 300)));
page.on("console", (m) => {
  if (m.type() === "error") {
    const t = m.text();
    if (/Missing or insufficient permissions|FirebaseError|Failed to load resource/.test(t)) return;
    consoleErrors.push(t.slice(0, 300));
  }
});
await page.goto(APP, { waitUntil: "load" });
await page.waitForFunction(() => !!window.__dsh && window.__dsh.useAuthStore.getState().loading === false, null, { timeout: 30000 });
await page.evaluate(() => window.__dsh.useAuthStore.setState({ user: { uid: "audit", email: "alessio@example.com", displayName: "Alessio", photoURL: "" }, loading: false }));
await page.waitForFunction(() => !!document.querySelector(".app-bar"), null, { timeout: 20000 });
await page.waitForTimeout(2000);

const TYPES = ["agent","chatbot","idea","research","summarize","image","documents","cartoon","slides","code","codeedit","prd","devplan","codemap","ui","stitch","note","label","timer","checklist","custom","sdlc-intent","sdlc-spec","sdlc-plan","sdlc-implement","sdlc-review","sdlc-merge"];
const report = await page.evaluate((types) => {
  const st = window.__dsh.useBoardStore;
  const s = st.getState();
  // remove starter boxes so only the audit board remains
  const startIds = new Set(s.nodes.map((n) => n.id));
  st.setState({ nodes: [], edges: [] });
  const added = [];
  const t0 = performance.now();
  types.forEach((type, i) => {
    const before = st.getState().nodes.length;
    try {
      st.getState().addBox(type, { x: 40 + (i % 6) * 300, y: 40 + Math.floor(i / 6) * 420 });
    } catch (e) {
      added.push({ type, addError: String(e) });
      return;
    }
    const nodes = st.getState().nodes;
    if (nodes.length === before) { added.push({ type, added: false }); return; }
    const id = nodes[nodes.length - 1].id;
    added.push({ type, id, added: true });
  });
  // Seed representative data so every branch of BoxNode renders.
  const u = st.getState().updateBoxData;
  const md = "## Heading\n\nSome **bold** text and a list:\n\n- one\n- two\n\n`inline code` and a [link](https://example.com).";
  for (const a of added) {
    if (!a.id) continue;
    const patch = { status: "success", output: md, tokens: { promptTokens: 120, completionTokens: 80, totalTokens: 200 } };
    if (a.type === "idea") patch.content = "A board that keeps the pipeline visible.";
    if (a.type === "research" || a.type === "summarize" || a.type === "prd" || a.type === "devplan" || a.type === "codemap" || a.type === "codeedit") patch.prompt = "Do the thing";
    if (a.type === "image") patch.imageData = "data:image/svg+xml;base64," + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="120" height="80" fill="#123229"/></svg>');
    if (a.type === "documents") patch.documents = [{ id: "d1", name: "brief.md", size: 1200, ext: "md", url: "", text: "# Brief\nhello", chars: 14, truncated: false, error: "" }];
    if (a.type === "cartoon") { patch.imageData = "data:image/svg+xml;base64," + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="120" height="80" fill="#F2B300"/></svg>'); patch.outputImage = patch.imageData; }
    if (a.type === "slides") patch.slides = [
      { title: "The gap", bullets: ["Teams open 4–6 tools", "AI chat loses the thread", "The canvas keeps it visible"], notes: "Speaker note here." },
      { title: "The route", bullets: ["Idea → Research → PRD → Code"], notes: "" },
    ];
    if (a.type === "code") patch.code = 'import React from "react";\nexport default function App() {\n  return <main style={{padding:24}}><h1>Hi</h1></main>;\n}\n';
    if (a.type === "ui") { patch.code = "<!doctype html><html><body style='font-family:system-ui;padding:24px'><h1>UI design</h1><p>Generated page</p></body></html>"; patch.designBrief = "A compact brief."; }
    if (a.type === "stitch") { patch.code = "<!doctype html><html><body style='font-family:system-ui;padding:24px'><h1>Stitch</h1></body></html>"; patch.stitchMeta = { modelId: "m", status: "done", screenId: "s", error: "" }; }
    if (a.type === "checklist") patch.checklistItems = [
      { id: "c1", text: "One", done: true, assignee: "alessio@example.com", createdBy: "alessio@example.com", createdAt: 1, doneBy: "alessio@example.com", doneAt: 2 },
      { id: "c2", text: "Two", done: false, assignee: "", createdBy: "alessio@example.com", createdAt: 1, doneBy: "", doneAt: 0 },
    ];
    if (a.type === "timer") { patch.timerStatus = "paused"; patch.timerRemainingMs = 195000; patch.timerDurationMs = 300000; patch.timerStartedAt = 0; patch.timerStartedBy = "alessio@example.com"; }
    if (a.type === "chatbot") patch.chatMessages = [
      { id: "m1", role: "user", text: "Hi", by: "Alessio", at: 1 },
      { id: "m2", role: "assistant", text: "Hello from Chat Pal.", by: "Chat Pal", at: 2 },
    ];
    if (a.type === "label") patch.labelColor = "#FBE6A2";
    if (a.type === "note") { patch.content = "A printed note about the route."; patch.authorEmail = "alessio@example.com"; patch.authorName = "Alessio"; }
    if (a.type === "agent") patch.agentSteps = [{ id: "audit-1", turn: 1, action: "add_box", label: "Add Research", detail: "research", at: 1 }];
    if (a.type === "custom") { patch.prompt = "Custom prompt"; }
    if (a.type.startsWith("sdlc-")) { patch.sdlcVersions = [{ version: 1, text: md, createdAt: 1, createdBy: "alessio@example.com", note: "first" }]; patch.sdlcHistory = [{ type: "run", at: 1, by: "alessio@example.com", detail: "" }]; patch.sdlcGate = "approved"; patch.sdlcApprovedAt = 2; patch.sdlcApprovedBy = "alessio@example.com"; patch.sdlcFeedback = ""; patch.sdlcOpenItems = []; patch.sdlcDecisions = []; patch.sdlcFindings = []; patch.sdlcGaps = []; patch.sdlcDeviation = ""; patch.sdlcGateRequired = true; patch.skills = ""; patch.sdlcCodeVersion = 0; }
    try { u(a.id, patch); } catch (e) { a.patchError = String(e); }
  }
  const elapsed = performance.now() - t0;
  return { added, elapsed: Math.round(elapsed), nodeCount: st.getState().nodes.length };
}, TYPES);

await page.waitForTimeout(2500);
const dom = await page.evaluate(() => {
  const nodes = Array.from(document.querySelectorAll(".react-flow__node"));
  return {
    nodeEls: nodes.length,
    boxNodes: document.querySelectorAll(".box-node").length,
    annotationEls: document.querySelectorAll(".note-node, .label-node, .chatbot-node").length,
    errorTexts: Array.from(document.querySelectorAll(".box-node")).filter((n) => /Something went wrong|Error rendering/i.test(n.textContent || "")).length,
    emptyBoxes: Array.from(document.querySelectorAll(".box-node")).filter((n) => (n.textContent || "").trim().length < 4).length,
  };
});
await page.evaluate(() => {
  const vp = document.querySelector(".react-flow__viewport");
  if (vp) vp.style.transform = "translate(10px, 10px) scale(0.42)";
});
await page.waitForTimeout(600);
await page.screenshot({ path: ".impeccable/review/audit-all-boxes.png" });
console.log(JSON.stringify({ report, dom, pageErrors, consoleErrors }, null, 1));
await browser.close();
