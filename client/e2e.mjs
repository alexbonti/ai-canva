/**
 * E2E test run for AI Canva against the REAL dev app (http://localhost:5173)
 * with the REAL backend (/api → Express:3001 → Ollama).
 *
 * What is real here: the full app UI (landing, sidebar, canvas, boxes), the
 * zustand stores, the run flow (Run button → runBox → POST /api/generate →
 * Ollama → markdown output + token badge), the timer/note/label features.
 * What is synthetic: Google auth (a fake user is seeded via the dev-only
 * window.__dsh hooks) and Firestore persistence (skipped — currentBoardId
 * stays null, so board saves/subscriptions no-op). Firebase permission
 * errors in the console are expected noise from the fake user.
 *
 * Run: node e2e.mjs   (from client/, dev server on 5173 must be running)
 */
import { chromium } from "playwright-core";

const APP = "http://localhost:5173";
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✅ PASS" : "❌ FAIL"} — ${name}${detail ? ` (${detail})` : ""}`);
};
const safe = async (name, fn) => { try { return await fn(); } catch (e) { return check(name, false, "ERROR: " + e.message.slice(0, 60)); } };

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message.slice(0, 120)));

const bodyText = () => page.evaluate(() => document.body.innerText);

// ---------- T1: Landing page (logged out) ----------
await page.goto(APP, { waitUntil: "load" });
await page.waitForTimeout(2500);
check("T1 landing renders", /Visual AI pipelines/.test(await bodyText()) && /Build AI pipelines/.test(await bodyText()));
check("T1 landing hides app canvas", !(await page.$(".react-flow")));
check("T1 no page errors on landing", pageErrors.length === 0, pageErrors.join(" | ").slice(0, 80));

// ---------- T2: Enter the app with a seeded user ----------
const FAKE = { uid: "e2e-fake-uid", email: "e2e@test.local", displayName: "E2E Tester", photoURL: "" };
await page.evaluate((u) => {
  window.__dsh.useAuthStore.setState({ user: u, loading: false });
}, FAKE);
await page.waitForTimeout(2000);
check("T2 app shell renders after login", !!(await page.$(".react-flow")) && /Add Box/.test(await bodyText()));
check("T2 palette sections: Inputs/Workers/Collaboration", /INPUTS/i.test(await bodyText()) && /WORKERS/i.test(await bodyText()) && /COLLABORATION/i.test(await bodyText()));
check("T2 starter board seeded (idea + research)", await safe("T2 starter", async () => {
  const nodes = await page.evaluate(() => window.__dsh.useBoardStore.getState().nodes);
  const types = nodes.map((n) => n.data.boxType || n.type);
  return types.includes("idea") && types.includes("research");
}));

// Wrap updateBoxData to count writes (timer transition discipline).
await page.evaluate(() => {
  const s = window.__dsh.useBoardStore.getState();
  const orig = s.updateBoxData;
  window.__e2e = { updateCalls: 0 };
  window.__dsh.useBoardStore.setState({
    updateBoxData: (id, patch) => {
      window.__e2e.updateCalls++;
      return orig(id, patch);
    },
  });
});

// ---------- T3: Add boxes through the REAL sidebar palette ----------
const addBoxViaPalette = async (label) => {
  const before = await page.evaluate(() => window.__dsh.useBoardStore.getState().nodes.length);
  const clicked = await page.evaluate((l) => {
    // Palette buttons render as <span>icon</span><span>Label</span>.
    const btn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent.trim().endsWith(l)
    );
    if (!btn) return false;
    btn.click();
    return true;
  }, label);
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => window.__dsh.useBoardStore.getState().nodes.length);
  return clicked && after === before + 1;
};
check("T3 add Note via palette", await safe("T3 Note", () => addBoxViaPalette("Note")));
check("T3 add Label via palette", await safe("T3 Label", () => addBoxViaPalette("Label")));
check("T3 add Timer via palette", await safe("T3 Timer", () => addBoxViaPalette("Timer")));
check("T3 add Idea via palette", await safe("T3 Idea", () => addBoxViaPalette("Idea")));
check("T3 add Research via palette", await safe("T3 Research", () => addBoxViaPalette("Research")));
check("T3 note renders as post-it annotation", !!(await page.$(".note-node")));
check("T3 label renders as floating chip", !!(await page.$(".label-pill")));
check("T3 timer shows 05:00 default", /05:00/.test(await bodyText()));
check("T3 idea textareas present", (await page.$$("textarea[placeholder*='your idea']")).length >= 2);
check("T3 Run buttons only on research boxes", await safe("T3 run count", async () => {
  const st = await page.evaluate(() => {
    const s = window.__dsh.useBoardStore.getState();
    return {
      research: s.nodes.filter((n) => (n.data.boxType || n.type) === "research").length,
      runBtns: Array.from(document.querySelectorAll("button")).filter((b) => /▶ Run/.test(b.textContent)).length,
    };
  });
  return st.runBtns === st.research && st.research >= 2;
}));

// ---------- T4: Note end-to-end ----------
await safe("T4 note flow", async () => {
  const ta = await page.$(".note-textarea");
  if (!ta) return check("T4 note flow", false, "no textarea");
  await page.evaluate(() => {
    const el = document.querySelector(".note-textarea");
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
    setter.call(el, "E2E: demo notes work!");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForTimeout(400);
  const found = await page.evaluate(() => {
    const s = window.__dsh.useBoardStore.getState();
    return Object.values(s.boxData).some((b) => b.content === "E2E: demo notes work!");
  });
  check("T4 note typing persists to store", found);
  check("T4 note shows author attribution", /E2E Tester/.test(await bodyText()));
});

// ---------- T5: Label end-to-end ----------
await safe("T5 label flow", async () => {
  await page.evaluate(() => document.querySelector(".label-pill").click());
  await page.waitForTimeout(300);
  const input = await page.$("input[placeholder='Label text…']");
  check("T5 label click-to-edit opens", !!input);
  if (input) {
    await input.fill("Sprint 1 Goals");
    await input.press("Enter");
    await page.waitForTimeout(400);
  }
  const saved = await page.evaluate(() => {
    const s = window.__dsh.useBoardStore.getState();
    return Object.values(s.boxData).some((b) => b.content === "Sprint 1 Goals");
  });
  check("T5 label text saved", saved);
  check("T5 label pill shows new text", /Sprint 1 Goals/.test(await bodyText()));
});

// ---------- T6: Timer end-to-end ----------
await safe("T6 timer flow", async () => {
  // duration 10s, started through the real UI
  await page.evaluate(() => {
    const inp = document.querySelector("input[placeholder='MM:SS']");
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(inp, "10");
    inp.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForTimeout(200);
  const before = await page.evaluate(() => window.__e2e.updateCalls);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) => /▶ Start/.test(b.textContent));
    btn && btn.click();
  });
  await page.waitForTimeout(1200);
  const running = await page.evaluate((b) => {
    const s = window.__dsh.useBoardStore.getState();
    const t = Object.values(s.boxData).find((x) => x.timerStatus === "running");
    return { running: !!t, startedBy: t?.timerStartedBy, calls: window.__e2e.updateCalls - b };
  }, before);
  check("T6 timer starts (running in store)", running.running);
  check("T6 timer records starter", running.startedBy === "e2e@test.local");
  check("T6 exactly 1 store write on Start", running.calls === 1, `writes=${running.calls}`);
  const d1 = (await bodyText()).match(/\b00:0\d\b/)[0];
  await page.waitForTimeout(1500);
  const d2 = (await bodyText()).match(/\b00:0\d\b/)[0];
  const tickWrites = await page.evaluate(() => window.__e2e.updateCalls);
  check("T6 digits tick down", d1 !== d2, `${d1} → ${d2}`);
  check("T6 zero writes while ticking", tickWrites - before === 1, `total extra=${tickWrites - before}`);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) => /⏹ Stop/.test(b.textContent));
    btn && btn.click();
  });
  await page.waitForTimeout(400);
  const s1 = ((await bodyText()).match(/\b00:0\d\b/) || ["00:00"])[0];
  await page.waitForTimeout(1300);
  const s2 = ((await bodyText()).match(/\b00:0\d\b/) || ["00:00"])[0];
  const stopped = await page.evaluate(() =>
    Object.values(window.__dsh.useBoardStore.getState().boxData).some((b) => b.timerStatus === "stopped")
  );
  check("T6 Stop freezes the display", s1 === s2 && stopped, `${s1} == ${s2}`);
});

// ---------- T7: AI run end-to-end (real backend + Ollama) ----------
await safe("T7 run flow", async () => {
  // Fill the FIRST idea box and connect it to the FIRST research box, then
  // click that research box's real Run button.
  const ids = await page.evaluate(() => {
    const s = window.__dsh.useBoardStore.getState();
    const byType = (t) => s.nodes.find((n) => (n.data.boxType || n.type) === t);
    const idea = byType("idea"), research = byType("research");
    s.updateBoxData(idea.id, {
      content: "AI-powered meal planning app that creates weekly menus from dietary preferences",
      output: "AI-powered meal planning app that creates weekly menus from dietary preferences",
    });
    window.__dsh.useBoardStore.setState({
      edges: [{ id: "e2e-edge", source: idea.id, target: research.id }],
    });
    return { idea: idea.id, research: research.id };
  });
  const runClicked = await page.evaluate((rid) => {
    const btn = Array.from(
      document.querySelectorAll(`.react-flow__node[data-id="${rid}"] button`)
    ).find((b) => /▶ Run/.test(b.textContent));
    if (!btn) return false;
    btn.click();
    return true;
  }, ids.research);
  check("T7 Run button clicked on the connected research box", runClicked);
  let done = false, outLen = 0, tokens = null;
  for (let i = 0; i < 45; i++) {
    await page.waitForTimeout(2000);
    const st = await page.evaluate((rid) => {
      const s = window.__dsh.useBoardStore.getState();
      const b = s.boxData[rid];
      return b && b.status === "done" && b.output && b.output.length > 100
        ? { len: b.output.length, tokens: b.tokens } : null;
    }, ids.research);
    if (st) { done = true; outLen = st.len; tokens = st.tokens; break; }
  }
  check("T7 research generated via real /api/generate", done, `output ${outLen} chars`);
  check("T7 token usage recorded", !!tokens && tokens.totalTokens > 0, tokens ? `${tokens.totalTokens} tokens` : "none");
  const rendered = await page.evaluate((rid) => {
    const md = document.querySelector(`.react-flow__node[data-id="${rid}"] .markdown-output`);
    return md ? md.textContent.length : 0;
  }, ids.research);
  check("T7 markdown output rendered in the box", rendered > 100, `${rendered} chars visible`);
  check("T7 token badge visible in box footer", /tok/.test(await bodyText()));
});

// ---------- T8: API health through the real Vite proxy ----------
check("T8 /api/health via Vite proxy", await safe("T8 health", async () => {
  const health = await page.evaluate(() => fetch("/api/health").then((r) => r.json()));
  return health.status === "ok" && health.ollamaKey === "configured";
}));

// ---------- Summary ----------
const passed = results.filter((r) => r.ok).length;
console.log("\n================ E2E SUMMARY ================");
console.log(`${passed}/${results.length} passed`);
const noise = pageErrors.filter((e) => /permission|auth|token|user/i.test(e));
console.log(`page errors: ${pageErrors.length} (expected Firebase noise from fake user: ${noise.length})`);
pageErrors.slice(0, 5).forEach((e) => console.log("  [pageerror]", e));
await browser.close();
process.exit(passed === results.length ? 0 : 1);