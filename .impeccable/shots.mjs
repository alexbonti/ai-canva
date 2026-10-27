import { chromium } from "/Users/alessiobonti/dev/ai-canva/client/node_modules/playwright-core/index.mjs";
const APP = "http://localhost:5173";
const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.goto(APP, { waitUntil: "load" });
await page.waitForTimeout(2200);
await page.screenshot({ path: ".impeccable/review/incumbent-landing.png" });
await page.screenshot({ path: ".impeccable/review/incumbent-landing-full.png", fullPage: true });

const FAKE = { uid: "shots-uid", email: "alessio@example.com", displayName: "Alessio", photoURL: "" };
await page.evaluate((u) => { window.__dsh.useAuthStore.setState({ user: u, loading: false }); }, FAKE);
await page.waitForTimeout(2200);
// Add a few boxes so the board looks used
const addBox = async (label) => {
  await page.evaluate((l) => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.trim().endsWith(l));
    btn?.click();
  }, label);
  await page.waitForTimeout(400);
};
for (const l of ["Idea", "Research", "PRD", "UI Design", "Note", "Checklist", "Timer"]) await addBox(l);
await page.waitForTimeout(1200);
await page.screenshot({ path: ".impeccable/review/incumbent-app.png" });
// open a box panel / modal states
await page.evaluate(() => {
  const s = window.__dsh.useBoardStore.getState();
  s.updateBoxData(s.nodes.find(n=>n.data.boxType==="idea")?.id, { content: "A collaborative whiteboard where AI turns a rough idea into a shippable PRD, deck and prototype — one box at a time.", status: "success" });
  const r = s.nodes.find(n=>n.data.boxType==="research");
  s.updateBoxData(r.id, { content: "## Market snapshot\n\n- **Whiteboards** are where product ideas begin, but the work leaves the board.\n- Teams run 4–6 tools to get from idea to artifact.\n- AI chat tools draft fast, then lose the thread.\n\n### Where this fits\nA canvas that keeps the *pipeline* visible: idea → research → PRD → build.", status: "success", tokens: { prompt: 1204, completion: 830, total: 2034 } });
});
await page.waitForTimeout(1200);
await page.screenshot({ path: ".impeccable/review/incumbent-app-filled.png" });
await browser.close();
console.log("done");
