import { chromium } from "/Users/alessiobonti/dev/ai-canva/client/node_modules/playwright-core/index.mjs";
const APP = process.env.APP_URL || "http://localhost:5173";
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { try { localStorage.clear(); } catch {} });
const page = await ctx.newPage();
await page.goto(APP, { waitUntil: "load" });
await page.waitForFunction(() => !!window.__dsh, null, { timeout: 30000 });
await page.waitForFunction(() => window.__dsh.useAuthStore.getState().loading === false, null, { timeout: 20000 });
await page.evaluate(() => window.__dsh.useAuthStore.setState({ user: { uid: "m", email: "m@e.com", displayName: "M", photoURL: "" }, loading: false }));
await page.waitForFunction(() => !!document.querySelector(".app-bar"), null, { timeout: 15000 });
// The board surface is a lazy chunk now: wait for the palette + canvas nodes.
await page.waitForFunction(() => !!document.querySelector("[data-sidebar]"), null, { timeout: 20000 });
await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length >= 1, null, { timeout: 20000 });
await page.waitForTimeout(900);
// add research + timer + area via palette
const add = async (label) => {
  await page.evaluate((l) => { const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent.trim().endsWith(l)); b?.click(); }, label);
  await page.waitForTimeout(250);
};
for (const l of ["Idea", "Research", "Timer"]) await add(l);
await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length >= 3, null, { timeout: 15000 });
await page.waitForTimeout(700);
await page.evaluate(() => {
  const st = window.__dsh.useBoardStore;
  const s = st.getState();
  const research = s.nodes.find((n) => (n.data.boxType || n.type) === "research");
  st.getState().updateBoxData(research.id, { output: "# Brief\\n\\nSome research text.", status: "success", tokens: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } });
});
await page.waitForTimeout(600);
// A board id makes the header render Share / roster / token badge.
await page.evaluate(() => { const st = window.__dsh.useBoardStore; st.setState({ currentBoardId: "demo", boardTitle: "Demo", saveStatus: "saved" }); });
await page.waitForTimeout(400);
const result = await page.evaluate(() => {
  const text = document.body.innerText;
  const buttons = Array.from(document.querySelectorAll("button"));
  const helpCard = Array.from(document.querySelectorAll("div")).find((d) => (d.textContent || "").includes("How to use") && d.className.includes("rounded-xl"));
  const paletteRows = Array.from(document.querySelectorAll("button.palette-row"));
  const idea = document.querySelector("textarea[placeholder*='your idea']");
  const areaBtn = buttons.find((b) => /▭ Area$/.test((b.textContent || "").trim()));
  const runBtn = buttons.find((b) => /▶ Run/.test(b.textContent));
  const saveBtn = buttons.find((b) => b.textContent.trim() === "💾 Save");
  const startBtn = buttons.find((b) => /▶ Start/.test(b.textContent));
  const stopBtn = buttons.find((b) => /⏹ Stop/.test(b.textContent));
  const researchRow = paletteRows.find((b) => b.textContent.trim().endsWith("Research"));
  const boardsBtn = buttons.find((b) => (b.textContent || "").includes("Boards ("));
  const shareBtn = buttons.find((b) => /Share/.test(b.textContent || ""));
  const tokText = document.body.innerText.includes("tok");
  return {
    addBox: /Add Box/.test(text),
    boards: !!boardsBtn,
    share: !!shareBtn,
    helpCard: !!helpCard,
    paletteResearchEndsWith: !!researchRow,
    ideaPlaceholder: !!idea,
    areaButton: !!areaBtn,
    runButton: !!runBtn,
    saveButton: !!saveBtn,
    startButton: !!startBtn,
    stopButtonAgentOnly: !!stopBtn,
    tok: tokText,
    saveText: saveBtn ? JSON.stringify(saveBtn.textContent) : null,
    areaText: areaBtn ? JSON.stringify(areaBtn.textContent) : null,
  };
});
console.log(JSON.stringify(result, null, 1));
// menu labels
await page.evaluate(() => { const b = Array.from(document.querySelectorAll("button")).find((x) => (x.textContent || "").includes("Boards (")); b?.click(); });
await page.waitForTimeout(400);
const menu = await page.evaluate(() => {
  const t = document.body.innerText;
  return { newBoard: /New Board/.test(t) };
});
console.log("menu:", JSON.stringify(menu));
await browser.close();
