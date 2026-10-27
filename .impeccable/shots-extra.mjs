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

// ---- review extras: image box, code box tabs, checklist empty state ----
const addExtra = async (label) => {
  await page.evaluate((l) => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.trim().endsWith(l));
    btn?.click();
  }, label);
  await page.waitForTimeout(220);
};
await addExtra("Image");
await addExtra("Code");
await page.waitForTimeout(700);
await page.evaluate(() => {
  const st = window.__dsh.useBoardStore;
  const s = st.getState();
  const extras = {};
  for (const n of s.nodes) {
    const t = n.data.boxType || n.type;
    if (t === "image" || t === "code") extras[t] = n.id;
  }
  st.setState({
    nodes: s.nodes.map((n) => {
      const t = n.data.boxType || n.type;
      if (t === "image") return { ...n, position: { x: 40, y: 1000 } };
      if (t === "code") return { ...n, position: { x: 520, y: 1000 } };
      return n;
    }),
  });
  window.__extraIds = extras;
  const u = st.getState().updateBoxData;
  u(extras.code, {
    code: `import React from "react";\n\nexport default function App() {\n  return (\n    <main style={{ padding: 24, fontFamily: "system-ui" }}>\n      <h1>Weeknight plan</h1>\n      <ul>\n        <li>Miso noodles</li>\n        <li>Sheet-pan chicken</li>\n      </ul>\n    </main>\n  );\n}\n`,
    status: "done",
    output: "generated",
  });
});
await page.waitForTimeout(900);
await page.evaluate(() => {
  const vp = document.querySelector(".react-flow__viewport");
  if (vp) vp.style.transform = "translate(0px, -560px) scale(0.92)";
});
await page.waitForTimeout(500);

{
  const node = await page.$(`[data-id="${await page.evaluate(() => window.__extraIds.image)}"]`);
  await node?.screenshot({ path: OUT + "line-box-image.png" });
}
const codeId = await page.evaluate(() => window.__extraIds.code);
{
  const node = await page.$(`[data-id="${codeId}"]`);
  await (await node?.$("button:has-text('Code')"))?.click();
  await page.waitForTimeout(700);
  await node?.screenshot({ path: OUT + "line-box-code-tab.png" });
  await (await node?.$("button:has-text('Preview')"))?.click();
  await page.waitForTimeout(700);
  await node?.screenshot({ path: OUT + "line-box-code-preview.png" });
}

// Checklist with no tasks: header must not repeat the empty message.
{
  const chkId = await page.evaluate(() => window.__shotIds.checklist);
  const saved = await page.evaluate((id) => {
    const st = window.__dsh.useBoardStore;
    const items = st.getState().boxData[id]?.checklistItems ?? [];
    st.getState().setChecklistItems(id, []);
    return items;
  }, chkId);
  await page.waitForTimeout(600);
  const node = await page.$(`[data-id="${chkId}"]`);
  await node?.screenshot({ path: OUT + "line-box-checklist-empty.png" });
  await page.evaluate(({ id, saved }) => window.__dsh.useBoardStore.getState().setChecklistItems(id, saved), { id: chkId, saved });
  await page.waitForTimeout(300);
}

// Tablet: 1024 with the palette open (the default app view).
const tctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 2 });
await tctx.addInitScript(() => { try { localStorage.clear(); } catch {} });
const tablet = await tctx.newPage();
await tablet.goto(APP, { waitUntil: "load" });
await tablet.waitForFunction(() => !!window.__dsh, null, { timeout: 30000 });
await tablet.waitForFunction(() => window.__dsh.useAuthStore.getState().loading === false, null, { timeout: 20000 });
await tablet.evaluate(() => window.__dsh.useAuthStore.setState({ user: { uid: "shots", email: "alessio@example.com", displayName: "Alessio", photoURL: "" }, loading: false }));
await tablet.waitForFunction(() => !!document.querySelector(".app-bar"), null, { timeout: 15000 });
await tablet.waitForTimeout(2200);
await tablet.evaluate(() => {
  const st = window.__dsh.useBoardStore;
  const s = st.getState();
  const ids = {};
  for (const n of s.nodes) ids[n.data.boxType || n.type] = n.id;
  const keep = new Set(Object.values(ids).slice(0, 6));
  st.setState({ nodes: s.nodes.filter((n) => keep.has(n.id)), currentBoardId: "demo-board", boardTitle: "Q3 Product Line", saveStatus: "saved" });
});
await tablet.waitForTimeout(800);
await tablet.screenshot({ path: OUT + "line-tablet.png" });
console.log("extra shots done", JSON.stringify(await page.evaluate(() => window.__extraIds)));
await browser.close();
