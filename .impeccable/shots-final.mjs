import { chromium } from "/Users/alessiobonti/dev/ai-canva/client/node_modules/playwright-core/index.mjs";
const APP = process.env.APP_URL || "http://localhost:5173";
const OUT = ".impeccable/review/";
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });

// Landing (logged out), 1440 desktop.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(APP, { waitUntil: "load" });
  await page.waitForSelector("text=Build AI pipelines.", { timeout: 30000 });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: OUT + "final-landing.png" });
  await page.screenshot({ path: OUT + "final-landing-full.png", fullPage: true });
  await ctx.close();
}

// Workspace with a curated pipeline.
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 2 });
await ctx.addInitScript(() => { try { localStorage.clear(); } catch {} });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message.slice(0, 200)));
await page.goto(APP, { waitUntil: "load" });
await page.waitForFunction(() => !!window.__dsh && window.__dsh.useAuthStore.getState().loading === false, null, { timeout: 30000 });
await page.evaluate(() => window.__dsh.useAuthStore.setState({ user: { uid: "final", email: "alessio@example.com", displayName: "Alessio", photoURL: "" }, loading: false }));
await page.waitForFunction(() => !!document.querySelector(".app-bar") && !!document.querySelector("[data-sidebar]"), null, { timeout: 20000 });
await page.waitForTimeout(1200);
const hide = await page.$('button[title="Hide help"]'); if (hide) await hide.click();
const tokens = { promptTokens: 1280, completionTokens: 940, totalTokens: 2220 };
const ids = await page.evaluate((tokens) => {
  const st = window.__dsh.useBoardStore;
  st.setState({ nodes: [], edges: [], boxData: {}, boardTitle: "Product pipeline", currentBoardId: "final", saveStatus: "saved" });
  const add = (type, x, y, patch) => {
    st.getState().addBox(type, { x, y });
    const id = st.getState().nodes[st.getState().nodes.length - 1].id;
    st.getState().updateBoxData(id, patch || {});
    return id;
  };
  const idea = add("idea", 40, 120, { content: "A calm weekly planning ritual for small remote teams.", output: "A calm weekly planning ritual for small remote teams." });
  const research = add("research", 450, 120, { status: "success", tokens, prompt: "Research the space for {{Idea Box}}", output: "## What the space looks like\n\n- Weekly planning is where small remote teams lose a day.\n- Tools are scattered across docs, boards and chat.\n\n**The opening:** one shared board that shows the week as a route." });
  const prd = add("prd", 860, 120, { status: "success", tokens, output: "A weekly planner that turns one idea into a shipped prototype: plan, research, spec, build.", prompt: "Write a PRD for {{Research Box}}" });
  const code = add("code", 450, 520, { status: "success", tokens, output: "", prompt: "Build the prototype from {{PRD Box}}" });
  st.setState({ edges: [
    { id: "e1", source: idea, target: research, type: "route" },
    { id: "e2", source: research, target: prd, type: "route" },
    { id: "e3", source: prd, target: code, type: "route" },
  ] });
  return { idea, research, prd, code };
}, tokens);
await page.waitForTimeout(3000);
await page.evaluate(() => window.__dsh.useBoardStore.setState({ saveStatus: "saved" }));
const hidePanel = await page.$('button[title="Hide panel"]');
if (hidePanel) await hidePanel.click();
await page.waitForTimeout(700);
const fit = await page.$('button[title="Fit view"], .react-flow__controls-fitview');
if (fit) await fit.click();
await page.waitForTimeout(1200);
await page.screenshot({ path: OUT + "final-workspace.png" });
console.log(JSON.stringify({ ids, errors, sidebar: !!(await page.$("[data-sidebar]")) }));
await browser.close();
