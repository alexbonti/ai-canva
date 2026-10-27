import { chromium } from "/Users/alessiobonti/dev/ai-canva/client/node_modules/playwright-core/index.mjs";
const APP = process.env.APP_URL || "http://localhost:5173";
const OUT = ".impeccable/review/";
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const errors = [];

async function newPage(width, height) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch {} });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));
  await page.goto(APP, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__dsh, null, { timeout: 30000 });
  await page.waitForFunction(() => window.__dsh.useAuthStore.getState().loading === false, null, { timeout: 20000 });
await page.evaluate(() => window.__dsh.useAuthStore.setState({ user: { uid: "shots", email: "alessio@example.com", displayName: "Alessio", photoURL: "" }, loading: false }));
await page.waitForFunction(() => !!document.querySelector(".app-bar"), null, { timeout: 15000 });
  await page.waitForTimeout(2200);
  return page;
}

const add = async (page, label) => {
  await page.evaluate((l) => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.trim().endsWith(l));
    btn?.click();
  }, label);
  await page.waitForTimeout(180);
};

const page = await newPage(1440, 900);
for (const l of ["Idea", "Research", "PRD", "UI Design", "Note", "Checklist", "Timer"]) await add(page, l);
await page.waitForTimeout(700);

// Keep the last box of each type (the ones we just added over any restored
// starter board), then lay them out as a clean transit diagram.
await page.evaluate(() => {
  const st = window.__dsh.useBoardStore;
  const s = st.getState();
  const ids = {};
  for (const n of s.nodes) ids[n.data.boxType || n.type] = n.id;
  window.__shotIds = ids;
  const keep = new Set(Object.values(ids));
  st.setState({ nodes: s.nodes.filter((n) => keep.has(n.id)) });
});
await page.waitForTimeout(500);

await page.evaluate(() => {
  const st = window.__dsh.useBoardStore;
  const ids = window.__shotIds;
  const pos = {
    idea: [40, 100], research: [420, 100], prd: [800, 100], note: [1140, 100],
    ui: [40, 560], checklist: [560, 560], timer: [930, 560],
  };
  st.setState({
    nodes: st.getState().nodes.map((n) => {
      const t = n.data.boxType || n.type;
      return pos[t] ? { ...n, position: { x: pos[t][0], y: pos[t][1] } } : n;
    }),
    edges: [
      { id: "e1", source: ids.idea, target: ids.research },
      { id: "e2", source: ids.research, target: ids.prd },
    ],
    boardTitle: "Q3 Product Line",
    saveStatus: "saved",
  });
  const u = st.getState().updateBoxData;
  u(ids.idea, { content: "A collaborative whiteboard where AI turns a rough idea into a shippable PRD, deck and prototype — one box at a time.", output: "A collaborative whiteboard where AI turns a rough idea into a shippable PRD, deck and prototype — one box at a time.", status: "success" });
  u(ids.research, { output: "## What teams actually do\n\n- Whiteboards are where product ideas begin — and where the work leaves the board.\n- Teams open 4–6 tools to get from idea to artifact.\n- AI chat drafts fast, then loses the thread.\n\n### The gap\nNobody can see the *pipeline* while it runs. This canvas keeps it visible: idea → research → PRD → build.", status: "success", tokens: { promptTokens: 1204, completionTokens: 830, totalTokens: 2034 } });
  u(ids.prd, { status: "running" });
  u(ids.ui, { status: "error", error: "The provider timed out after 300s. Your prompt and connected inputs are kept — run it again." });
  u(ids.checklist, { checklistItems: [
    { id: "c1", text: "Interview 5 product teams", done: true, assignee: "alessio@example.com", createdBy: "alessio@example.com", createdAt: Date.now(), doneBy: "alessio@example.com", doneAt: Date.now() },
    { id: "c2", text: "Draft the PRD skeleton", done: true, assignee: "sam@example.com", createdBy: "alessio@example.com", createdAt: Date.now(), doneBy: "sam@example.com", doneAt: Date.now() },
    { id: "c3", text: "Ship the landing page", done: false, assignee: "", createdBy: "alessio@example.com", createdAt: Date.now(), doneBy: "", doneAt: 0 },
  ] });
});
await page.waitForTimeout(800);
await page.evaluate(() => { document.querySelectorAll("button").forEach((b) => { if (b.title === "Hide help") b.click(); }); });
await page.waitForTimeout(300);
await page.evaluate(() => {
  const st = window.__dsh.useBoardStore;
  st.setState({
    nodes: st.getState().nodes.map((n) => ({ ...n, selected: n.id === window.__shotIds.research })),
    currentBoardId: "demo-board",
    boardTitle: "Q3 Product Line",
    saveStatus: "saved",
  });
});
await page.waitForTimeout(500);
// Frame the whole line for the composition read.
await page.evaluate(() => {
  const vp = document.querySelector(".react-flow__viewport");
  if (vp) vp.style.transform = "translate(24px, 34px) scale(0.8)";
});
await page.waitForTimeout(300);
const debug = await page.evaluate(() => Array.from(document.querySelectorAll(".react-flow__node")).map((el) => {
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
}));
console.log("nodes:", JSON.stringify(debug));
await page.screenshot({ path: OUT + "line-board.png" });

const rect = await page.evaluate(() => {
  const el = document.querySelector(".box-node.selected");
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
});
if (rect) await page.screenshot({ path: OUT + "line-card.png", clip: { x: Math.max(0, rect.x - 10), y: Math.max(0, rect.y - 10), width: rect.width + 20, height: rect.height + 20 } });
const rects = await page.evaluate(() => {
  const ids = window.__shotIds;
  const out = {};
  for (const [k, id] of Object.entries(ids)) {
    const el = document.querySelector(`.react-flow__node[data-id="${id}"]`);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    out[k] = { x: Math.max(0, r.x - 8), y: Math.max(0, r.y - 8), width: r.width + 16, height: r.height + 16 };
  }
  return out;
});
for (const [k, r] of Object.entries(rects)) {
  if (r.width > 4 && r.height > 4) await page.screenshot({ path: OUT + `line-box-${k}.png`, clip: r });
}

// Empty board
const empty = await newPage(1440, 900);
await empty.evaluate(() => { const st = window.__dsh.useBoardStore; st.setState({ currentBoardId: "demo-board", boardTitle: "Untitled board", saveStatus: "saved" }); });
await empty.waitForTimeout(900);
await empty.screenshot({ path: OUT + "line-empty.png" });

// Tablet
const tablet = await newPage(1024, 768);
await tablet.evaluate(() => { const st = window.__dsh.useBoardStore; st.setState({ currentBoardId: "demo-board", boardTitle: "Q3 Product Line", saveStatus: "saved" }); });
await tablet.waitForTimeout(900);
await tablet.screenshot({ path: OUT + "line-tablet.png" });

console.log("errors:", JSON.stringify(errors));
await browser.close();
