import { chromium } from "/Users/alessiobonti/dev/ai-canva/client/node_modules/playwright-core/index.mjs";
const APP = process.env.APP_URL || "http://localhost:4173";
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });

async function measure(name, signedIn, width = 1440, height = 900) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Performance.enable");
  const client = await ctx.newCDPSession(page);
  await client.send("Performance.enable");

  await page.goto(APP, { waitUntil: "load" });
  if (signedIn) {
    const hasHooks = await page.evaluate(() => !!window.__dsh);
    if (!hasHooks) { await ctx.close(); return { name, skipped: "no dev hooks in this build" }; }
    await page.waitForFunction(() => !!window.__dsh && window.__dsh.useAuthStore.getState().loading === false, null, { timeout: 30000 });
    await page.evaluate(() => window.__dsh.useAuthStore.setState({ user: { uid: "perf", email: "p@e.co", displayName: "P", photoURL: "" }, loading: false }));
    await page.waitForFunction(() => !!document.querySelector(".app-bar"), null, { timeout: 20000 });
  }
  await page.waitForTimeout(2500);

  const nav = await page.evaluate(() => {
    const n = performance.getEntriesByType("navigation")[0];
    return n ? {
      ttfb: Math.round(n.responseStart),
      domContentLoaded: Math.round(n.domContentLoadedEventEnd),
      load: Math.round(n.loadEventEnd),
    } : null;
  });
  const paint = await page.evaluate(() => {
    const p = performance.getEntriesByType("paint").map((e) => ({ name: e.name, t: Math.round(e.startTime) }));
    return p;
  });
  const lcp = await page.evaluate(() => new Promise((resolve) => {
    let value = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) value = Math.round(e.startTime);
    }).observe({ type: "largest-contentful-paint", buffered: true });
    setTimeout(() => resolve(value), 600);
  }));
  const cls = await page.evaluate(() => new Promise((resolve) => {
    let sum = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) sum += e.value;
    }).observe({ type: "layout-shift", buffered: true });
    setTimeout(() => resolve(Number(sum.toFixed(4))), 600);
  }));
  const resources = await page.evaluate(() => {
    const rs = performance.getEntriesByType("resource");
    const byType = {};
    let transferred = 0, encoded = 0;
    for (const r of rs) {
      transferred += r.transferSize || 0;
      encoded += r.encodedBodySize || 0;
      const k = r.initiatorType;
      byType[k] = (byType[k] || 0) + (r.transferSize || 0);
    }
    return { count: rs.length, transferredKB: Math.round(transferred / 1024), encodedKB: Math.round(encoded / 1024), byType };
  });
  const longTasks = await page.evaluate(() => new Promise((resolve) => {
    const tasks = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) tasks.push(Math.round(e.duration));
    }).observe({ type: "longtask", buffered: true });
    setTimeout(() => resolve({ count: tasks.length, max: Math.max(0, ...tasks), total: tasks.reduce((a, b) => a + b, 0) }), 800);
  }));
  const mem = await page.evaluate(() => (performance.memory ? { usedMB: Math.round(performance.memory.usedJSHeapSize / 1048576) } : null));
  const nodes = await page.evaluate(() => document.querySelectorAll("*").length);
  await ctx.close();
  return { name, nav, paint, lcp, cls, resources, longTasks, mem, domNodes: nodes };
}

const results = [];
for (let i = 0; i < 2; i++) results.push(await measure("landing-desktop" + (i ? "-run2" : ""), false));
results.push(await measure("landing-mobile", false, 390, 844));
results.push(await measure("workspace", true));
results.push(await measure("workspace-mobile", true, 390, 844));
console.log(JSON.stringify(results, null, 1));
await browser.close();
