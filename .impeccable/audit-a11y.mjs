import { chromium } from "/Users/alessiobonti/dev/ai-canva/client/node_modules/playwright-core/index.mjs";
const APP = process.env.APP_URL || "http://localhost:5173";
const AXE = "/Users/alessiobonti/dev/ai-canva/client/node_modules/axe-core/axe.min.js";
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });

async function scan(name, width, height, signedIn, prep) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  await ctx.addInitScript(() => { try { localStorage.clear(); } catch {} });
  const page = await ctx.newPage();
  await page.goto(APP, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  if (signedIn) {
    await page.waitForFunction(() => !!window.__dsh && window.__dsh.useAuthStore.getState().loading === false, null, { timeout: 30000 });
    await page.evaluate(() => window.__dsh.useAuthStore.setState({ user: { uid: "a11y", email: "alessio@example.com", displayName: "Alessio", photoURL: "" }, loading: false }));
    await page.waitForFunction(() => !!document.querySelector(".app-bar"), null, { timeout: 20000 });
    await page.waitForTimeout(1800);
  }
  if (prep) await prep(page);
  await page.waitForTimeout(500);
  await page.addScriptTag({ path: AXE });
  const res = await page.evaluate(async () => {
    const r = await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] },
      resultTypes: ["violations"],
    });
    return r.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.slice(0, 6).map((n) => ({ target: n.target.join(" "), summary: (n.failureSummary || "").split("\n").slice(0, 3).join(" | ") })),
      count: v.nodes.length,
    }));
  });
  await ctx.close();
  return { name, violations: res };
}

const out = [];
out.push(await scan("landing-desktop", 1440, 900, false));
out.push(await scan("landing-mobile", 390, 844, false));
out.push(await scan("workspace", 1440, 900, true));
out.push(await scan("workspace-palette-closed", 1440, 900, true, async (page) => {
  await page.evaluate(() => { document.querySelectorAll("button").forEach((b) => { if (b.title === "Hide help") b.click(); }); });
  await page.waitForTimeout(400);
  await page.evaluate(() => { const b = document.querySelector('[data-sidebar] button[title="Hide panel"]'); b?.click(); });
}));
out.push(await scan("landing-tablet", 820, 1180, false));
console.log(JSON.stringify(out, null, 1));
await browser.close();
