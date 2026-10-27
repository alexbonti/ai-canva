import { chromium } from "/Users/alessiobonti/dev/ai-canva/client/node_modules/playwright-core/index.mjs";
const APP = process.env.APP_URL || "http://localhost:5173";
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
await ctx.addInitScript(() => { try { localStorage.clear(); } catch {} });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));
await page.goto(APP, { waitUntil: "load" });
await page.waitForFunction(() => !!window.__dsh && window.__dsh.useAuthStore.getState().loading === false, null, { timeout: 30000 });
await page.evaluate(() => window.__dsh.useAuthStore.setState({ user: { uid: "demo-validate", email: "demo@example.com", displayName: "Demo", photoURL: "" }, loading: false }));
await page.waitForFunction(() => !!document.querySelector(".app-bar") && !!document.querySelector("[data-sidebar]"), null, { timeout: 20000 });
await page.waitForTimeout(1200);

const log = [];
const say = (m) => console.log(new Date().toISOString().slice(11, 19), m);
async function add(type, patch) {
  const id = await page.evaluate(({ type, patch }) => {
    const st = window.__dsh.useBoardStore;
    st.getState().addBox(type, { x: 80 + st.getState().nodes.length * 380, y: 120 });
    const id = st.getState().nodes[st.getState().nodes.length - 1].id;
    st.getState().updateBoxData(id, patch || {});
    return id;
  }, { type, patch });
  return id;
}
async function wire(a, b) {
  await page.evaluate(({ a, b }) => window.__dsh.useBoardStore.setState({ edges: [...window.__dsh.useBoardStore.getState().edges, { id: "e" + a + b, source: a, target: b, type: "route" }] }), { a, b });
}
async function runAndWait(id, timeoutMs) {
  const t0 = Date.now();
  await page.evaluate((id) => { window.__dsh.useBoardStore.getState().runBox(id).catch(() => {}); }, id);
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    last = await page.evaluate((id) => {
      const s = window.__dsh.useBoardStore.getState();
      const d = s.boxData[id] || {};
      return { status: d.status, error: d.error || "", output: (d.output || "").length, code: (d.code || "").length, tokens: d.tokens ? d.tokens.totalTokens : 0 };
    }, id);
    if (last.status === "done" || last.status === "success" || last.status === "error") break;
    await page.waitForTimeout(1500);
  }
  return { ...last, ms: Date.now() - t0 };
}

const IDEA_TEXT = "A weeknight dinner planner for a family of four: decide the week's meals on Sunday, one shared shopping list, and a reshuffle button when plans change.";
const idea = await add("idea", { content: IDEA_TEXT, output: IDEA_TEXT });
const research = await add("research", {});
await wire(idea, research);
say("running research…");
const r = await runAndWait(research, 180000);
say("research: " + JSON.stringify(r));
log.push({ step: "research", ...r });
const prd = await add("prd", {});
await wire(research, prd);
say("running prd…");
const p = await runAndWait(prd, 240000);
say("prd: " + JSON.stringify(p));
log.push({ step: "prd", ...p });
const ui = await add("ui", { content: "A calm weekly meal-planning page for a family: this week's dinners as a list, a shared shopping list, and one reshuffle action." });
say("running ui-design…");
const u = await runAndWait(ui, 180000);
say("ui: " + JSON.stringify(u));
log.push({ step: "ui-design", ...u, brief: await page.evaluate((id) => ((window.__dsh.useBoardStore.getState().boxData[id] || {}).designBrief || "").length, ui) });
console.log(JSON.stringify({ log, errors }, null, 1));
await browser.close();
