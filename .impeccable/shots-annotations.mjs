import { chromium } from "/Users/alessiobonti/dev/ai-canva/client/node_modules/playwright-core/index.mjs";
const APP = "http://localhost:5173";
const OUT = ".impeccable/review/";
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await ctx.addInitScript(() => { try { localStorage.clear(); } catch {} });
const page = await ctx.newPage();
const errs = []; page.on("pageerror", (e) => errs.push(e.message.slice(0, 200)));
await page.goto(APP, { waitUntil: "load" });
await page.waitForFunction(() => !!window.__dsh && window.__dsh.useAuthStore.getState().loading === false, null, { timeout: 20000 });
await page.evaluate(() => window.__dsh.useAuthStore.setState({ user: { uid: "a", email: "a@b.c", displayName: "A", photoURL: "" }, loading: false }));
await page.waitForFunction(() => !!document.querySelector(".app-bar"), null, { timeout: 15000 });
await page.waitForTimeout(2000);
const add = async (l) => { await page.evaluate((x) => { const b = Array.from(document.querySelectorAll("button")).find((y) => y.textContent.trim().endsWith(x)); b?.click(); }, l); await page.waitForTimeout(250); };
for (const l of ["Note", "Label", "Chatbot", "Checklist"]) await add(l);
await page.waitForTimeout(600);
await page.evaluate(() => {
  const st = window.__dsh.useBoardStore; const s = st.getState();
  const byType = (t) => s.nodes.find((n) => (n.data.boxType || n.type) === t);
  const note = byType("note"), label = byType("label"), chat = byType("chatbot");
  st.setState({ nodes: s.nodes.map((n) => {
    if (n.id === note.id) return { ...n, position: { x: 60, y: 80 } };
    if (n.id === label.id) return { ...n, position: { x: 420, y: 120 } };
    if (n.id === chat.id) return { ...n, position: { x: 700, y: 220 } };
    return n;
  }), currentBoardId: "demo", boardTitle: "Annotation check", saveStatus: "saved" });
  st.getState().updateBoxData(note.id, { content: "The canvas is the brief — every artefact keeps its provenance all the way from idea to shipped code." });
  st.getState().updateBoxData(chat.id, { messages: [
    { role: "assistant", text: "I'm on the board — ask me what this pipeline is missing.", by: "assistant", at: Date.now() },
    { role: "user", text: "What's the weakest link here?", by: "a@b.c", at: Date.now() },
    { role: "assistant", text: "Nothing downstream of Research has a plan. Add a PRD stop, then a Code Edit stop, and the line is continuous.", by: "assistant", at: Date.now() },
  ] });
});
await page.waitForTimeout(800);
await page.evaluate(() => { document.querySelectorAll("button").forEach((b) => { if (b.title === "Hide help") b.click(); }); });
await page.waitForTimeout(400);
await page.screenshot({ path: OUT + "line-annotations.png" });
console.log("errors:", JSON.stringify(errs));
await browser.close();
