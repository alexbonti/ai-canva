import { chromium } from "/Users/alessiobonti/dev/ai-canva/client/node_modules/playwright-core/index.mjs";
const APP = process.env.APP_URL || "http://localhost:5173";
const OUT = ".impeccable/review/";
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 900, height: 760 }, deviceScaleFactor: 2 });
await ctx.addInitScript(() => { try { localStorage.clear(); } catch {} });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));
await page.goto(APP, { waitUntil: "load" });
await page.waitForFunction(() => !!window.__dsh && window.__dsh.useAuthStore.getState().loading === false, null, { timeout: 30000 });
await page.evaluate(() => window.__dsh.useAuthStore.setState({ user: { uid: "shots", email: "alessio@example.com", displayName: "Alessio", photoURL: "" }, loading: false }));
await page.waitForFunction(() => !!document.querySelector(".app-bar") && !!document.querySelector("[data-sidebar]"), null, { timeout: 20000 });
await page.waitForTimeout(1200);
const hide = await page.$('button[title="Hide help"]');
if (hide) await hide.click();
await page.waitForTimeout(300);

const md = "## What teams actually do\n\n- Whiteboards are where product ideas begin.\n- Teams open 4–6 tools to get from idea to artifact.\n\n**The gap:** nobody can see the pipeline while it runs.";
const tokens = { promptTokens: 1204, completionTokens: 830, totalTokens: 2034 };
const svg = await page.evaluate(() => "data:image/svg+xml;base64," + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" fill="#123229"/><circle cx="160" cy="100" r="46" fill="#F2B300"/></svg>'));
const cases = {
  image: { type: "image", patch: { imageData: svg, status: "success", output: "" } },
  slides: { type: "slides", patch: { status: "success", output: "", slides: [
    { title: "The gap", bullets: ["Teams open 4–6 tools", "AI chat loses the thread", "The canvas keeps it visible"], notes: "Open on the pain." },
    { title: "The route", bullets: ["Idea → Research → PRD → Code"], notes: "" }], tokens } },
  documents: { type: "documents", patch: { status: "success", output: "doc text", documents: [
    { id: "d1", name: "q3-brief.md", size: 2480, ext: "md", url: "", text: "# Brief\nhello", chars: 14, truncated: false, error: "" },
    { id: "d2", name: "interviews.pdf", size: 182400, ext: "pdf", url: "", text: "notes", chars: 5, truncated: false, error: "" }] } },
  agent: { type: "agent", patch: { status: "success", output: "Done — added Research and ran it.", agentSteps: [
    { id: "s1", type: "plan", label: "Plan the pipeline", at: 1 },
    { id: "s2", type: "add_box", label: "Add Research", detail: "research", at: 2 },
    { id: "s3", type: "connect", label: "Connect Idea → Research", at: 3 },
    { id: "s4", type: "run", label: "Run Research", boxId: "b", at: 4 },
    { id: "s5", type: "finish", label: "Answer the task", at: 5 }], tokens } },
  research: { type: "research", patch: { status: "success", output: md, tokens, prompt: "Research the market for {{Idea Box}}" } },
  sdlc: { type: "sdlc-intent", patch: { status: "success", output: md, sdlcVersions: [{ version: 1, text: md, createdAt: 1, createdBy: "alessio@example.com", note: "first" }], sdlcHistory: [{ type: "run", at: 1, by: "alessio@example.com", detail: "" }], sdlcGate: "approved", sdlcApprovedAt: 2, sdlcApprovedBy: "alessio@example.com", sdlcFeedback: "", sdlcOpenItems: [], sdlcDecisions: [], sdlcFindings: [], sdlcGaps: [], sdlcDeviation: "", sdlcGateRequired: true, skills: "", tokens } },
  settings: { type: "research", patch: { status: "success", output: md, tokens, prompt: "Research the market for {{Idea Box}}", settingsOpen: true } },
};
const results = {};
for (const [name, c] of Object.entries(cases)) {
  const id = await page.evaluate((c) => {
    const st = window.__dsh.useBoardStore;
    st.setState({ nodes: [], edges: [], boxData: {}, selectedNodeId: null });
    st.getState().addBox(c.type, { x: 120, y: 120 });
    const id = st.getState().nodes[st.getState().nodes.length - 1].id;
    st.getState().updateBoxData(id, c.patch);
    st.setState({ selectedNodeId: id });
    if (c.patch.settingsOpen) st.setState({ selectedNodeId: id });
    return id;
  }, c);
  await page.waitForTimeout(900);
  if (c.patch.settingsOpen) {
    const node = await page.$(`[data-id="${id}"]`);
    const gear = await node.$('button[title="Prompt settings"]');
    if (gear) await gear.click();
    await page.waitForTimeout(500);
  }
  const handle = await page.$(`[data-id="${id}"]`);
  const box = await handle.boundingBox();
  results[name] = { id, box };
  if (box) {
    const clip = { x: Math.max(0, box.x - 8), y: Math.max(0, box.y - 8), width: Math.min(880, box.width + 16), height: Math.min(740, box.height + 16) };
    await page.screenshot({ path: OUT + "line-box-" + name + ".png", clip });
  }
}
console.log(JSON.stringify({ results, errors }));
await browser.close();
