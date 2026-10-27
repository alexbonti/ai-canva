import { chromium } from "/Users/alessiobonti/dev/ai-canva/client/node_modules/playwright-core/index.mjs";
const APP = process.env.APP_URL || "http://127.0.0.1:5183";
const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message.slice(0, 200)));
page.on("console", (m) => { if (m.type() === "error" && !/permission|Firestore|firestore/.test(m.text())) errors.push("console: " + m.text().slice(0, 200)); });
await page.goto(APP, { waitUntil: "load" });
await page.waitForTimeout(1500);
const FAKE = { uid: "shots-uid", email: "alessio@example.com", displayName: "Alessio", photoURL: "" };
await page.evaluate((u) => { window.__dsh.useAuthStore.setState({ user: u, loading: false }); }, FAKE);
await page.waitForTimeout(2200);
const addBox = async (label) => {
  await page.evaluate((l) => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.trim().endsWith(l));
    btn?.click();
  }, label);
  await page.waitForTimeout(350);
};
for (const l of ["Idea", "Research", "PRD", "UI Design", "Note", "Checklist", "Timer"]) await addBox(l);
await page.waitForTimeout(800);
// fill realistic content + connect two boxes to see the route
await page.evaluate(() => {
  const s = window.__dsh.useBoardStore.getState();
  const by = (t) => s.nodes.find((n) => (n.data.boxType || n.type) === t);
  const idea = by("idea"), research = by("research"), prd = by("prd");
  s.updateBoxData(idea.id, { content: "A collaborative whiteboard where AI turns a rough idea into a shippable PRD, deck and prototype — one box at a time.", status: "success" });
  s.updateBoxData(research.id, { content: "## Market snapshot\n\n- **Whiteboards** are where product ideas begin, but the work leaves the board.\n- Teams run 4–6 tools to get from idea to artifact.\n- AI chat tools draft fast, then lose the thread.\n\n### Where this fits\nA canvas that keeps the *pipeline* visible: idea → research → PRD → build.", status: "success", tokens: { promptTokens: 1204, completionTokens: 830, totalTokens: 2034 } });
  s.updateBoxData(prd.id, { status: "running" });
  window.__dsh.useBoardStore.setState({ edges: [
    { id: "e1", source: idea.id, target: research.id },
    { id: "e2", source: research.id, target: prd.id, selected: true },
  ]});
});
await page.waitForTimeout(900);
await page.screenshot({ path: ".impeccable/review/line-app-1.png" });
// select research to show route focus
await page.evaluate(() => {
  const s = window.__dsh.useBoardStore.getState();
  const r = s.nodes.find((n) => (n.data.boxType || n.type) === "research");
  const st = window.__dsh.useBoardStore; st.setState({ nodes: st.getState().nodes.map((n) => ({ ...n, selected: n.id === r.id })) });
});
await page.waitForTimeout(500);
await page.screenshot({ path: ".impeccable/review/line-app-focus.png" });
// sidebar collapsed + help hidden
await page.evaluate(() => {
  document.querySelectorAll("button").forEach((b) => { if (b.title === "Hide help") b.click(); });
});
await page.waitForTimeout(300);
await page.screenshot({ path: ".impeccable/review/line-app-clean.png" });
console.log("errors:", JSON.stringify(errors, null, 1));
await browser.close();
