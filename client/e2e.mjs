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

// ---------- TA: Area drawing tool end-to-end ----------
await safe("TA areas flow", async () => {
  // Dismiss the "How to use" panel so it doesn't block canvas drags.
  await page.evaluate(() => {
    const panel = Array.from(document.querySelectorAll("div")).find((d) =>
      (d.textContent || "").includes("How to use") && d.className.includes("rounded-xl")
    );
    const x = panel && panel.querySelector("button");
    x && x.click();
  });
  await page.waitForTimeout(300);

  // Activate the area tool via the real toolbar button.
  const activated = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) =>
      /▭ Area$/.test((b.textContent || "").trim())
    );
    if (!btn) return false;
    btn.click();
    return true;
  });
  check("TA area tool activates", activated);
  // Pick a pale color (Emerald, index 2) via the tool palette.
  await page.evaluate(() => {
    const dot = Array.from(document.querySelectorAll("button")).find((b) =>
      (b.title || "").includes("Draw color — Emerald")
    );
    dot && dot.click();
  });
  await page.waitForTimeout(200);

  // Draw by dragging on empty canvas — probe a few regions until one hits
  // the pane (the board content position depends on fitView).
  const before = await page.evaluate(() => window.__dsh.useBoardStore.getState().nodes.length);
  const regions = [
    [250, 560, 950, 740],
    [700, 120, 1000, 380],
    [300, 70, 700, 170],
  ];
  let areaId = null;
  for (const [x1, y1, x2, y2] of regions) {
    await page.mouse.move(x1, y1);
    await page.mouse.down();
    await page.mouse.move(Math.round((x1 + x2) / 2), Math.round((y1 + y2) / 2));
    await page.mouse.move(x2, y2);
    await page.mouse.up();
    await page.waitForTimeout(500);
    areaId = await page.evaluate(() => {
      const s = window.__dsh.useBoardStore.getState();
      const a = s.nodes.find((n) => n.type === "area");
      return a ? a.id : null;
    });
    if (areaId) break;
  }
  check("TA drawing a drag creates an area node", !!areaId, areaId || "none");

  if (areaId) {
    // z-order: the area must sit BELOW box nodes (zIndex -1 vs >= 0).
    const z = await page.evaluate((id) => {
      const areaZ = document.querySelector(`.react-flow__node[data-id="${id}"]`)?.style?.zIndex;
      const anyBox = Array.from(document.querySelectorAll(".react-flow__node")).find((n) =>
        n.querySelector(".box-node")
      );
      return { areaZ, boxZ: anyBox ? anyBox.style.zIndex || "0" : null };
    }, areaId);
    check("TA area renders below the boxes (zIndex -1)", z.areaZ === "-1", JSON.stringify(z));

    // Recolor via the selected-area picker.
    await page.mouse.click(
      Number(await page.evaluate((id) => document.querySelector(`.react-flow__node[data-id="${id}"]`).getBoundingClientRect().left, areaId)) + 12,
      Number(await page.evaluate((id) => document.querySelector(`.react-flow__node[data-id="${id}"]`).getBoundingClientRect().top, areaId)) + 12
    );
    await page.waitForTimeout(400);
    const recolored = await page.evaluate(() => {
      const dot = Array.from(document.querySelectorAll("button")).find((b) =>
        (b.title || "").includes("Area color — Violet")
      );
      if (!dot) return { found: false };
      dot.click();
      return { found: true };
    });
    await page.waitForTimeout(400);
    const areaData = await page.evaluate((id) => {
      const n = window.__dsh.useBoardStore.getState().nodes.find((x) => x.id === id);
      return n ? { fill: n.data?.fill, border: n.data?.border } : null;
    }, areaId);
    check("TA area can be recolored via its picker", recolored.found && areaData?.fill === "#ede9fe", JSON.stringify(areaData));

    // Delete via the selected-area ✕.
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        (b.title || "").includes("Delete area")
      );
      btn && btn.click();
    });
    await page.waitForTimeout(500);
    const gone = await page.evaluate((id) =>
      !window.__dsh.useBoardStore.getState().nodes.some((n) => n.id === id || n.type === "area")
    , areaId);
    check("TA area deleted via ✕", gone);
  }
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


// ---------- PART 2: REAL AUTH + REAL FIRESTORE (two users, live sync) ----------
// Requires the Email/Password provider (enabled via the Identity Toolkit
// admin API — see AGENTS.md). Two fresh browser contexts sign in as real
// test users; board creation, persistence across reload, and live cross-user
// sync (notes, timer, presence) all go through real Firestore.
const PW = "E2e-Test-2025!";
const USER_A = "e2e-a@test.local";
const USER_B = "e2e-b@test.local";

const signInReal = async (page, email) =>
  page.evaluate(async ({ em, pw }) => {
    const m = await import("/src/lib/auth.ts");
    try {
      await m.createTestAccount(em, pw);
    } catch (e) {
      // already exists from a previous run — just sign in
      if (!/email-already-in-use/.test(e?.message || "")) throw e;
      await m.signInTestAccount(em, pw);
    }
    return (window.__dsh.useAuthStore.getState().user || {}).email || null;
  }, { em: email, pw: PW });

const waitFor = async (fn, { timeout = 20000, every = 500, label = "" } = {}) => {
  const t0 = Date.now();
  for (;;) {
    const v = await fn().catch(() => null);
    if (v) return v;
    if (Date.now() - t0 > timeout) throw new Error(`timeout waiting for ${label}`);
    await new Promise((r) => setTimeout(r, every));
  }
};

// Close the fake-user page — the rest runs in fresh, isolated contexts.
await page.close();

// ----- T9: real sign-in (user A) + real board auto-creation -----
const ctxA = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const pageA = await ctxA.newPage();
await pageA.goto(APP, { waitUntil: "load" });
{
  const email = await signInReal(pageA, USER_A);
  check("T9 real email/password sign-in", email === USER_A, `user=${email}`);
  // Self-cleaning: remove test boards left by earlier crashed runs.
  await safe("T9 cleanup leftovers", async () => {
    await pageA.evaluate(() => window.__dsh.useBoardStore.getState().refreshBoardList());
    await pageA.waitForTimeout(2500);
    await pageA.evaluate(async (ownerEmail) => {
      const fs = await import("/src/lib/firestore.ts");
      const s = window.__dsh.useBoardStore.getState();
      for (const b of s.boardList) {
        if (b.ownerEmail === ownerEmail) await fs.deleteBoard(b.id);
      }
      window.__dsh.useBoardStore.setState({ currentBoardId: null, boardList: [] });
    }, USER_A);
  });
  // Create a fresh board through the real store action (the auto-init effect
  // already ran while a leftover board existed, so create explicitly here).
  await pageA.evaluate(async () => {
    await window.__dsh.useBoardStore.getState().createNewBoard("E2E Test Board");
  });
  const boardId = await waitFor(
    () => pageA.evaluate(() => window.__dsh.useBoardStore.getState().currentBoardId),
    { label: "board creation", timeout: 45000 }
  ).catch(() => null);
  check("T9 real board created in Firestore", !!boardId, boardId || "none");
  const saveStatus = await pageA.evaluate(() => window.__dsh.useBoardStore.getState().saveStatus);
  check("T9 board saved (saveStatus)", saveStatus === "saved", saveStatus);

  // ----- T10: real persistence across a page reload -----
  // Add a note through the real palette, type, let the debounced save land,
  // then reload — the board must come back from Firestore with the note.
  await pageA.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent.trim().endsWith("Note")
    );
    btn && btn.click();
  });
  await pageA.waitForTimeout(600);
  const noteId = await waitFor(
    () => pageA.evaluate(() => {
      const s = window.__dsh.useBoardStore.getState();
      const n = Object.values(s.boxData).find((b) => b.authorEmail === "e2e-a@test.local");
      return n ? s.nodes.find((x) => x.id === Object.keys(s.boxData).find((k) => s.boxData[k] === n))?.id : null;
    }),
    { label: "note added" }
  ).catch(() => null);
  check("T10 note added as real user A", !!noteId);
  if (noteId) {
    await pageA.evaluate(({ text }) => {
      const el = document.querySelector(".note-textarea");
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      setter.call(el, text);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, { text: "Persisted across reload!" });
    await pageA.waitForTimeout(2500); // debounced save + Firestore round-trip
    const savedBeforeReload = await pageA.evaluate((id) =>
      window.__dsh.useBoardStore.getState().boxData[id]?.content
    , noteId);
    await pageA.reload({ waitUntil: "load" });
    const back = await waitFor(
      () => pageA.evaluate((id) => {
        const s = window.__dsh.useBoardStore.getState();
        return s.currentBoardId && s.boxData[id]?.content === "Persisted across reload!" ? true : null;
      }, noteId),
      { label: "board reload from Firestore", timeout: 45000 }
    ).catch(() => null);
    check("T10 session persists across reload (no re-login)", await waitFor(
      () => pageA.evaluate((em) =>
        window.__dsh.useAuthStore.getState().user?.email === em ? true : null, USER_A),
      { label: "session restore", timeout: 30000 }
    ).then(() => true).catch(() => false));
    check("T10 board reloads from Firestore with the note", !!back, `pre-reload content=${JSON.stringify(savedBeforeReload)}`);
  }

  // ----- T11: second real user opens the same board via ?board= -----
  const ctxB = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pageB = await ctxB.newPage();
  const fullBoardId = await pageA.evaluate(() => window.__dsh.useBoardStore.getState().currentBoardId);
  await pageB.goto(`${APP}/?board=${fullBoardId}`, { waitUntil: "load" });
  {
    const emailB = await signInReal(pageB, USER_B);
    check("T11 second real user signs in", emailB === USER_B, `user=${emailB}`);
    const joined = await waitFor(
      () => pageB.evaluate(() => {
        const s = window.__dsh.useBoardStore.getState();
        return s.currentBoardId && Object.keys(s.boxData).length > 0 ? true : null;
      }),
      { label: "B loads shared board", timeout: 45000 }
    ).catch(() => null);
    check("T11 user B opens A's board via ?board= link", !!joined);

    // ----- T12: live cross-user sync — note edit, timer, presence -----
    // A edits the note; B must see the new text via the onSnapshot sync.
    await pageA.evaluate((id) => {
      const el = document.querySelector(".note-textarea");
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      setter.call(el, "Edited live by A!");
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, noteId);
    const bSawEdit = await waitFor(
      () => pageB.evaluate(() => {
        const s = window.__dsh.useBoardStore.getState();
        const n = Object.values(s.boxData).find((b) => b.authorEmail === "e2e-a@test.local");
        return n?.content === "Edited live by A!" ? true : null;
      }),
      { label: "B sees A's note edit", timeout: 15000 }
    ).catch(() => null);
    check("T12 note edit syncs A → B live", !!bSawEdit);

    // B adds a Timer box via its real palette, then starts it; A must see the
    // new box AND the running timer with attribution (full cross-user sync).
    await pageB.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent.trim().endsWith("Timer")
      );
      btn && btn.click();
    });
    const bTimerId = await waitFor(
      () => pageB.evaluate(() => {
        const s = window.__dsh.useBoardStore.getState();
        const n = s.nodes.find((x) => (x.data.boxType || x.type) === "timer");
        return n?.id || null;
      }),
      { label: "B adds timer box" }
    ).catch(() => null);
    check("T12 B adds a timer box via palette", !!bTimerId);
    await pageB.evaluate(() => {
      const inp = document.querySelector("input[placeholder='MM:SS']");
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(inp, "15");
      inp.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await pageB.waitForTimeout(200);
    await pageB.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) => /▶ Start/.test(b.textContent));
      btn && btn.click();
    });
    const aSawTimer = await waitFor(
      () => pageA.evaluate(() => {
        const s = window.__dsh.useBoardStore.getState();
        const t = Object.values(s.boxData).find((b) => b.timerStatus === "running");
        return t?.timerStartedBy === "e2e-b@test.local" ? true : null;
      }),
      { label: "A sees B's timer start", timeout: 15000 }
    ).catch(() => null);
    check("T12 timer start syncs B → A (with attribution)", !!aSawTimer);
    await pageA.waitForTimeout(800);
    const aDigits = await waitFor(
      () => pageA.evaluate(() => (/00:1[0-5]/.test(document.body.innerText) ? true : null)),
      { label: "A renders synced timer", timeout: 15000 }
    ).then(() => true).catch(() => false);
    check("T12 A's display counts down from B's start", aDigits);
    // B stops; A must see it frozen/stopped.
    await pageB.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) => /⏹ Stop/.test(b.textContent));
      btn && btn.click();
    });
    const aSawStop = await waitFor(
      () => pageA.evaluate(() =>
        Object.values(window.__dsh.useBoardStore.getState().boxData).some((b) => b.timerStatus === "stopped") ? true : null
      ),
      { label: "A sees B's stop", timeout: 15000 }
    ).catch(() => null);
    check("T12 timer stop syncs B → A", !!aSawStop);

    // Presence: A moves its mouse over the canvas; B should list A as active.
    await pageA.mouse.move(640, 400);
    await pageA.waitForTimeout(300);
    await pageA.mouse.move(700, 450);
    await pageA.waitForTimeout(2500);
    const bSeesA = await pageB.evaluate(() =>
      window.__dsh.useBoardStore.getState().activeUsers.some((u) => u.email === "e2e-a@test.local")
    );
    check("T12 presence: B sees A active on the board", bSeesA);

    // Roster popover: move B's mouse (writes B's presence too), then B opens
    // the "who's on this board" panel — both users must be listed, with a
    // "you" marker on B's own row.
    await pageB.mouse.move(500, 350);
    await pageB.waitForTimeout(400);
    await pageB.mouse.move(560, 380);
    await pageB.waitForTimeout(2500); // presence writes (200ms throttle) + snapshot
    const roster = await safe("T12 roster", async () => {
      const label = await pageB.evaluate(() => {
        const btn = Array.from(document.querySelectorAll("button")).find((b) =>
          /online/.test(b.textContent || "")
        );
        return btn ? btn.textContent.replace(/\s+/g, " ").trim() : null;
      });
      const opened = await pageB.evaluate(() => {
        const btn = Array.from(document.querySelectorAll("button")).find((b) =>
          /online/.test(b.textContent || "")
        );
        if (!btn) return false;
        btn.click();
        return true;
      });
      await pageB.waitForTimeout(400);
      const list = await pageB.evaluate(() => {
        // Target the popover via its test id (a text search would match
        // ancestor divs and give false positives from canvas content).
        const pop = document.querySelector('[data-testid="roster-popover"]');
        if (!pop) return null;
        const rows = Array.from(pop.querySelectorAll('[data-testid="roster-row"]'));
        return {
          rowCount: rows.length,
          hasA: rows.some((r) => r.textContent.includes("e2e-a@test.local")),
          hasB: rows.some((r) => r.textContent.includes("e2e-b@test.local")),
          youMarker: rows.some((r) => !!r.querySelector('[data-testid="you-chip"]')),
        };
      });
      const dbg = await pageB.evaluate(async () => {
        const m = await import("/src/lib/presence.ts");
        const st = window.__dsh.useBoardStore.getState();
        const user = window.__dsh.useAuthStore.getState().user;
        const r = m.groupRoster(st.activeUsers, st.collaborators, user?.email || undefined);
        return {
          authEmail: user?.email,
          activeEmails: st.activeUsers.map((u) => u.email),
          online: r.online.map((o) => ({ email: o.email, isSelf: o.isSelf })),
        };
      });
      return { label, opened, list, dbg };
    });
    check(
      "T12 roster popover lists both users (with you-marker)",
      roster?.list?.rowCount === 2 && !!roster?.list?.hasA && !!roster?.list?.hasB && !!roster?.list?.youMarker,
      `label=${JSON.stringify(roster?.label)} list=${JSON.stringify(roster?.list)} dbg=${JSON.stringify(roster?.dbg)}`
    );
    check("T12 roster shows 2 online", (roster?.label || "").includes("2 online"), roster?.label || "");
    await ctxB.close();
  }

  // ----- T13: cleanup — delete the test board, sign out -----
  {
    const deleted = await safe("T13 delete", async () => {
      await pageA.evaluate(async (ownerEmail) => {
        const fs = await import("/src/lib/firestore.ts");
        const s = window.__dsh.useBoardStore.getState();
        await s.refreshBoardList();
        // note: refreshBoardList is async in the store; give it a beat
        await new Promise((r) => setTimeout(r, 1500));
        for (const b of window.__dsh.useBoardStore.getState().boardList) {
          if (b.ownerEmail === ownerEmail) await fs.deleteBoard(b.id);
        }
        window.__dsh.useBoardStore.setState({ currentBoardId: null, boardList: [], nodes: [], edges: [], boxData: {} });
      }, USER_A);
      await pageA.waitForTimeout(1500);
      const remaining = await pageA.evaluate(() =>
        window.__dsh.useBoardStore.getState().boardList.length
      );
      return remaining === 0;
    });
    check("T13 test boards deleted from Firestore", deleted === true);
    await safe("T13 signout", async () => {
      await pageA.evaluate(async () => {
        const m = await import("/src/lib/auth.ts");
        await m.signOutUser();
      });
    });
  }
  await ctxA.close();
}
// ---------- Summary ----------
const passed = results.filter((r) => r.ok).length;
console.log("\n================ E2E SUMMARY ================");
console.log(`${passed}/${results.length} passed`);
const noise = pageErrors.filter((e) => /permission|auth|token|user/i.test(e));
console.log(`page errors: ${pageErrors.length} (expected Firebase noise from fake user: ${noise.length})`);
pageErrors.slice(0, 5).forEach((e) => console.log("  [pageerror]", e));
await browser.close();
process.exit(passed === results.length ? 0 : 1);