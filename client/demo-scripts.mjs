/**
 * Rehearsal suite for the seven demo workflows in `docs/DEMOS.md`.
 *
 * The guides are the source of truth for what a facilitator does on stage. This
 * script is their executable twin: for every demo it builds the SAME board (same
 * box types, same wiring, often the same paste text) and asserts the outcome the
 * guide promises, so a rename or a broken pipeline shows up as a failed demo
 * instead of a broken demo *in front of people*.
 *
 *   node demo-scripts.mjs        # all seven
 *   node demo-scripts.mjs 3      # only demo 3
 *   node demo-scripts.mjs 1,4    # a subset
 *
 * Requirements: the dev app running on localhost:5173 (`npm run dev` at the repo
 * root), playwright-core + system Chrome. `/api/generate`, `/api/repo-digest`
 * and the chatbot/agent model calls are mocked at the page level, so this needs
 * no Ollama, no GitHub and no Firebase — it runs in seconds and costs nothing.
 *
 * Deliberately NOT covered here (covered elsewhere): the live model latency and
 * token counts (measured on the real stack, recorded in docs/DEVLOG.md), Sandpack
 * preview (needs codesandbox, .impeccable/validate-demo.mjs), here.now deploys
 * (ui-smoke DP checks) and real cross-user collaboration (e2e Part 2/3).
 */
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const APP = process.env.APP_URL || "http://localhost:5173";
const only = process.argv[2] ? process.argv[2].split(",").map((s) => s.trim()) : null;

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✅ PASS" : "❌ FAIL"} — ${name}${detail ? ` (${detail})` : ""}`);
};

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message.slice(0, 160)));

await page.goto(APP, { waitUntil: "load" });
await page.waitForTimeout(1500);

// Dev-only hooks (stripped from prod builds) — the same fake-user bootstrap the
// other live suites use, so no real auth or Firestore is needed.
await page.evaluate(() => {
  window.__dsh.useAuthStore.setState({
    user: { uid: "demo-runner", email: "demo@test.local", displayName: "Demo Runner", photoURL: "" },
    loading: false,
  });
});
await page.waitForTimeout(1200);

// ---------------------------------------------------------------------------
// Deterministic model + repository mocks.
//
// One universal mock, keyed on the box's system prompt (stock prompts identify
// each box type) and on the fixed prompt templates for change requests. The
// fixtures below are what each demo's guide promises the audience: a research
// brief, a 10-slide deck, one HTML page, a change set, the three SDLC
// artifacts, an agent plan.
// ---------------------------------------------------------------------------
const installMocks = () => page.evaluate(() => {
  const original = window.fetch;
  const fence = String.fromCharCode(96).repeat(3);
  const json = (obj) => new Response(JSON.stringify(obj), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
  const text = (content) => json({
    content, model: "rehearsal-mock", truncated: false,
    usage: { promptTokens: 12, completionTokens: 24, totalTokens: 36 },
  });

  window.__demo = {
    calls: 0,
    prompts: [],
    systems: [],
    agentQueue: [],
    agentCursor: 0,
    repoRequests: [],
  };

  // The demo-4 repository: Hello-World as the guide names it.
  const files = {
    "README.md": "# Hello World\n\nThis is a demo repository used by the AI Canva demos.\n",
    "src/app.ts": "export const main = () => 1;\n",
  };

  window.__demoFixture = { files };

  window.fetch = async (url, opts) => {
    const u = typeof url === "string" ? url : url.url;

    if (u.includes("/api/repo-digest")) {
      const body = JSON.parse(opts?.body || "{}");
      const asked = Array.isArray(body.paths) ? body.paths : [];
      window.__demo.repoRequests.push({ repoUrl: body.repoUrl || "", paths: asked });
      const digest = [
        "Repository: octocat/Hello-World@master",
        "",
        "## File tree",
        "",
        "README.md",
        "src/",
        "  app.ts",
        "",
        "## File contents",
        "",
        "### README.md (0.1 KB)",
        "",
        fence + "md",
        files["README.md"],
        fence,
        "",
      ].join("\n");
      return json({
        ok: true,
        repo: "octocat/Hello-World",
        branch: "master",
        digest,
        files: 2,
        treeEntries: 2,
        chars: 420,
        truncated: false,
        notes: [],
        contents: asked.map((p) => ({ path: p, content: files[p] || "", clipped: false })),
        missing: asked.filter((p) => !(p in files)),
      });
    }

    if (!u.includes("/api/generate")) return original(url, opts);

    const body = JSON.parse(opts?.body || "{}");
    const system = body.systemPrompt || "";
    const prompt = body.userPrompt || "";
    window.__demo.calls++;
    window.__demo.prompts.push(prompt);
    window.__demo.systems.push(system);

    // Demo 6 — the Agent controller: replay the scripted action plan, one
    // action per turn, and finish on the last one.
    if (system.includes("autonomous AI agent")) {
      const queue = window.__demo.agentQueue;
      const action = queue[Math.min(window.__demo.agentCursor++, queue.length - 1)];
      return text(JSON.stringify(action));
    }

    // Demo 1 / 3 — AI change requests are identified by their fixed templates,
    // and MUST still return a complete artifact (the app rejects fragments).
    if (prompt.includes("Here is the current code of a working prototype")) {
      return text([
        "function App() {",
        "  const [n, setN] = React.useState(0);",
        "  return (",
        '    <main style={{ fontFamily: "system-ui", padding: 24, color: "#1f2937" }}>',
        '      <h1 style={{ fontWeight: 500, letterSpacing: "-0.02em" }}>This week',
        "        <span style={{ color: \"#2f5d50\" }}> v2</span></h1>",
        '      <p style={{ color: "#5b6168" }}>Calmer headings, one reshuffle action.</p>',
        '      <button onClick={() => setN(n + 1)}>Reshuffle plan ({n})</button>',
        "    </main>",
        "  );",
        "}",
        "const root = ReactDOM.createRoot(document.getElementById('root'));",
        "root.render(<App />);",
      ].join("\n"));
    }
    if (prompt.includes("Here is the current HTML page")) {
      return text([
        "<!DOCTYPE html>",
        '<html lang="en">',
        "<head>",
        '  <meta charset="utf-8">',
        "  <title>Weeknight dinner planner v2</title>",
        "  <style>",
        "    body { margin: 0; font-family: system-ui, sans-serif; background: #f2ede1; color: #1f2320; }",
        "    header { background: #123229; color: #f2ede1; padding: 28px 20px; }",
        "    main { max-width: 700px; margin: 0 auto; padding: 24px 20px; }",
        "    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #d8d2c4; }",
        "    button { background: #e8a33d; border: 0; padding: 10px 16px; font-weight: 600; cursor: pointer; }",
        "  </style>",
        "</head>",
        "<body>",
        "  <header><h1>This week's dinners</h1></header>",
        "  <main>",
        "    <p>Monday — roast chicken · Tuesday — pasta · Wednesday — soup</p>",
        "    <div class=\"row\"><span>Shopping list</span><span>12 items</span></div>",
        "    <button>Reshuffle week</button>",
        "  </main>",
        "</body>",
        "</html>",
      ].join("\n"));
    }

    // Demo 2 — Slides: the contract is a JSON array of {title, bullets, notes}.
    if (system.includes("pitch deck creator")) {
      const titles = [
        "Problem", "Solution", "Market Size", "Product", "Business Model",
        "Traction", "Competition", "Team", "Financials", "Ask",
      ];
      return text(JSON.stringify(titles.map((title, i) => ({
        title,
        bullets: [`Point about ${title.toLowerCase()}`, "Why it matters this year", "What we do differently"],
        notes: `Speaker note for slide ${i + 1}: keep it to 30 seconds.`,
      }))));
    }

    // Demo 1 — Code: a complete prototype (App + mount, per isCompletePrototype).
    if (system.includes("You are a React developer")) {
      return text([
        "function App() {",
        "  const [n, setN] = React.useState(0);",
        "  const [planned, setPlanned] = React.useState(['Roast chicken', 'Pasta', 'Soup']);",
        "  return (",
        '    <main style={{ fontFamily: "system-ui", padding: 24, color: "#1f2937", maxWidth: 560 }}>',
        "      <h1 style={{ fontWeight: 500, letterSpacing: \"-0.02em\" }}>This week's dinners</h1>",
        '      <ul style={{ listStyle: "none", padding: 0 }}>',
        "        {planned.map((meal, i) => (",
        '          <li key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e5e7eb" }}>',
        "            <span>{meal}</span><span style={{ color: \"#6b7280\" }}>{(i + 1) * 2} items</span>",
        "          </li>",
        "        ))}",
        "      </ul>",
        "      <button onClick={() => { setPlanned([...planned].reverse()); setN(n + 1); }}>",
        "        Reshuffle week ({n})",
        "      </button>",
        "    </main>",
        "  );",
        "}",
        "const root = ReactDOM.createRoot(document.getElementById('root'));",
        "root.render(<App />);",
      ].join("\n"));
    }

    // Demo 3 — UI Design stage 1 (brief) then stage 2 (one HTML page).
    if (system.includes("senior product designer")) {
      return text([
        "# Design brief — weekly meal planner",
        "",
        "**Page:** a calm weekly meal-planning page for a family of four.",
        "",
        "**Sections**",
        "1. This week's dinners — a ruled list of five dinners with a day label and a short note.",
        "2. Shared shopping list — twelve items with checkboxes, grouped by aisle.",
        "3. One reshuffle action — a single primary button under the list.",
        "",
        "**Palette** #f2ede1, #ffffff, #1f2320, #123229",
        "",
        "**Layout** a single centered column, max 700px, generous spacing.",
      ].join("\n"));
    }
    if (prompt.includes("Build the page described by this design brief")) {
      return text([
        "<!DOCTYPE html>",
        '<html lang="en">',
        "<head>",
        '  <meta charset="utf-8">',
        '  <meta name="viewport" content="width=device-width, initial-scale=1">',
        "  <title>Weekly meal planner</title>",
        "  <style>",
        "    :root { --paper: #f2ede1; --ink: #1f2320; --pine: #123229; --signal: #e8a33d; }",
        "    body { margin: 0; background: var(--paper); color: var(--ink); font-family: system-ui, sans-serif; }",
        "    main { max-width: 700px; margin: 0 auto; padding: 32px 20px; }",
        "    h1 { font-size: 30px; letter-spacing: -0.02em; }",
        "    ul { list-style: none; padding: 0; }",
        "    li { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #d8d2c4; }",
        "    button { background: var(--pine); color: var(--paper); border: 0; padding: 10px 18px; font-weight: 600; cursor: pointer; }",
        "  </style>",
        "</head>",
        "<body>",
        "  <main>",
        "    <h1>Weekly meal plan</h1>",
        "    <ul>",
        "      <li><span>Monday</span><span>Roast chicken</span></li>",
        "      <li><span>Tuesday</span><span>Pasta with greens</span></li>",
        "      <li><span>Wednesday</span><span>Soup and bread</span></li>",
        "    </ul>",
        "    <p>Shopping list: 12 items, shared with the family.</p>",
        "    <button>Reshuffle week</button>",
        "  </main>",
        "</body>",
        "</html>",
      ].join("\n"));
    }

    // Demo 4 — Code Map orientation brief.
    if (system.includes("codebase orientation brief")) {
      return text([
        "# Code Map: octocat/Hello-World",
        "",
        "## What this codebase is",
        "A tiny sample repository that prints a greeting — the classic GitHub demo repo.",
        "",
        "## Tech stack",
        "No build system; a README and one TypeScript helper.",
        "",
        "## Where to start reading",
        "1. README.md",
      ].join("\n"));
    }

    // Demo 4 — Code Edit triage (only reached when no files are pinned) then the
    // change set. The app computes the diff and patch from this JSON.
    if (system.includes("You plan code changes")) {
      return text(fence + "json\n" + JSON.stringify({ files: ["README.md"], plan: "document the project" }) + "\n" + fence);
    }
    if (system.includes("careful engineer making a focused change")) {
      const nextReadme = [
        "# Hello World",
        "",
        "This is a demo repository used by the AI Canva demos.",
        "",
        "## Usage",
        "",
        "Copy the project to your machine and open it to run the demo.",
        "",
      ].join("\n");
      return text(fence + "json\n" + JSON.stringify({
        summary: "document how to use the project",
        changes: [{ path: "README.md", operation: "update", content: nextReadme, reason: "the guide's change request asks for a Usage section" }],
        notes: ["not compiled or tested"],
      }) + "\n" + fence);
    }

    // Demo 5 — the three SDLC stages. The fixtures deliberately include one
    // unresolved question and one decision with no named test: the app, not the
    // model, is what forces those gates.
    if (system.includes("Stage 1 (Intent)")) {
      return text([
        "# Add a Reshuffle week action",
        "",
        "## Problem statement",
        "Families plan dinners on Sunday, then plans change mid-week.",
        "",
        "## Proposed outcome",
        "One action suggests a new set of dinners and keeps the shopping list in sync.",
        "",
        "## Affected users / systems",
        "The meal planner page and the shopping list.",
        "",
        "## Constraints",
        "Must not lose items the family already ticked off.",
        "",
        "## Open questions",
        "- Which dinners count as fixed?",
        "- What happens to a checked shopping item when the week changes?",
      ].join("\n"));
    }
    if (system.includes("Stage 2 (Spec)")) {
      return text([
        "# Spec: Reshuffle week",
        "",
        "## Decisions",
        "### Decision 1 — Dinners are replaceable except pinned ones",
        "Only unpinned dinners change; a pinned dinner keeps its day.",
        "",
        "### Decision 2 — Shopping list keeps checked items",
        "Ticked items stay ticked; new ingredients are appended.",
        "",
        "## Unresolved",
        "⚠ Rollout order for the three regions is unknown",
      ].join("\n"));
    }
    if (system.includes("Stage 3 (Plan)")) {
      return text([
        "# Plan: Reshuffle week",
        "",
        "## Files to change",
        "- client/src/components/MealPlan.tsx — the reshuffle action",
        "",
        "## Implementation order",
        "1. Add the reshuffle action.",
        "",
        "## Tests",
        "- Dinners are replaceable except pinned ones → proves Decision 1",
        "",
        "## Risks",
        "The shopping list is shared state.",
      ].join("\n"));
    }

    // Demo 0 — the chatbot reads the board snapshot it is given.
    if (system.includes("small AI companion")) {
      return text("I can see the board: an agenda, a checklist and a running timer. Start with the team name, then the problem statement.");
    }

    // Demo 1/2 — Research and PRD stock prompts.
    if (system.includes("thorough research assistant")) {
      return text([
        "# Research: weeknight dinner planning",
        "",
        "## Key findings",
        "- Families decide meals weekly but replan 2-3 times a week.",
        "- The shopping list is the real source of friction, not the recipes.",
        "",
        "## Market landscape",
        "Meal-planning apps exist, but few keep the list in sync with the plan.",
        "",
        "## Risks",
        "- Syncing a plan and a list invites confusing partial states.",
      ].join("\n"));
    }
    if (system.includes("You are a product manager")) {
      return text([
        "# PRD: Weeknight dinner planner",
        "",
        "## Product Overview",
        "A weekly dinner plan for a family of four with one shared shopping list.",
        "",
        "## Problem Statement",
        "Deciding meals and shopping for them are two disconnected chores.",
        "",
        "## Core Features",
        "- P0: weekly dinner list with day labels",
        "- P0: shared shopping list with checkboxes",
        "- P1: reshuffle the week",
        "",
        "## User Stories",
        "As a parent, I want to decide the week on Sunday so that weeknights are calm.",
        "",
        "## Success Metrics",
        "- The family completes the weekly plan in under five minutes.",
      ].join("\n"));
    }

    return text("# Artifact\nUnrecognised prompt in the rehearsal mock.");
  };

  window.__restoreFetch = () => { window.fetch = original; };
});
await installMocks();

// ---------------------------------------------------------------------------
// Small helpers shared by every demo.
// ---------------------------------------------------------------------------
const resetBoard = () => page.evaluate(() => {
  const st = window.__dsh.useBoardStore;
  st.setState({ nodes: [], edges: [], boxData: {} });
  window.__demo = { calls: 0, prompts: [], systems: [], agentQueue: [], agentCursor: 0, repoRequests: [] };
});

const addBox = (type, patch = {}) => page.evaluate(({ type, patch }) => {
  const st = window.__dsh.useBoardStore;
  const id = st.getState().addBox(type, { x: 80, y: 120 });
  if (patch && Object.keys(patch).length) st.getState().updateBoxData(id, patch);
  return id;
}, { type, patch });

const connect = (from, to) => page.evaluate(({ from, to }) => window.__dsh.useBoardStore.getState().connectBoxes(from, to), { from, to });

const boxState = (id) => page.evaluate((boxId) => {
  const d = window.__dsh.useBoardStore.getState().boxData[boxId] || {};
  return {
    status: d.status || "idle",
    error: d.error || "",
    output: d.output || "",
    code: d.code || "",
    codeVersion: d.codeVersion || 0,
    codeVersions: (d.codeVersions || []).length,
    designBrief: d.designBrief || "",
    slides: (d.slides || []).length,
    tokens: d.tokens ? d.tokens.totalTokens : 0,
    repoMeta: d.repoMeta || null,
    changeSet: d.changeSet || [],
    editMeta: d.editMeta || null,
    sdlcGate: d.sdlcGate || "",
    sdlcVersions: (d.sdlcVersions || []).map((v) => v.version),
    sdlcOpenItems: d.sdlcOpenItems || [],
    sdlcGaps: d.sdlcGaps || [],
    sdlcApprovedBy: d.sdlcApprovedBy || "",
    sdlcApprovedVersion: d.sdlcApprovedVersion ?? null,
    agentSteps: (d.agentSteps || []).length,
    chatMessages: d.chatMessages || [],
    timerStartedAt: d.timerStartedAt || 0,
    checklistItems: (d.checklistItems || []).length,
    content: d.content || "",
  };
}, id);

/** Run a box the way the ▶ Run button does, then wait for the run to settle. */
const run = async (id, timeoutMs = 20000) => {
  await page.evaluate((boxId) => {
    window.__dsh.useBoardStore.getState().runBox(boxId).catch(() => {});
  }, id);
  const deadline = Date.now() + timeoutMs;
  let state = await boxState(id);
  while (Date.now() < deadline) {
    state = await boxState(id);
    if (state.status === "done" || state.status === "error") return state;
    await page.waitForTimeout(120);
  }
  return state;
};

const nodeText = (match) => page.evaluate((needle) => {
  const node = [...document.querySelectorAll(".box-node")].find((n) => n.innerText.includes(needle));
  return node ? node.innerText : "";
}, match);

/** Click a box's 💾 Save button and read the downloaded file. */
const saveOutcome = async (needle) => {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.evaluate((label) => {
      const node = [...document.querySelectorAll(".box-node")].find((n) => n.innerText.includes(label));
      if (!node) throw new Error("box not found for save: " + label);
      const btn = [...node.querySelectorAll("button")].find((b) => b.textContent.trim() === "💾 Save");
      if (!btn) throw new Error("no 💾 Save button on " + label);
      btn.click();
    }, needle),
  ]);
  const file = await download.path();
  const text = file ? await readFile(file, "utf8") : "";
  return { filename: download.suggestedFilename(), text };
};

const runDemo = async (number, title, fn) => {
  if (only && !only.includes(String(number))) return;
  console.log(`\n──── Demo ${number} — ${title} ────`);
  await resetBoard();
  await fn();
};

// ===========================================================================
// Demo 0 — Team warm-up (Note, Checklist, Timer, Chatbot)
// ===========================================================================
await runDemo(0, "Team warm-up", async () => {
  const noteId = await addBox("note", { content: "1) intros  2) the problem  3) build  4) demo at 15:30" });
  const checklistId = await addBox("checklist");
  const timerId = await addBox("timer");
  const chatbotId = await addBox("chatbot");

  // Paste a Markdown list into the checklist's add field — the guide's gesture.
  await page.waitForTimeout(250);
  const pasted = await page.evaluate(() => {
    const node = [...document.querySelectorAll(".box-node")].find((n) => n.innerText.includes("Checklist"));
    if (!node) return { ok: false, why: "no checklist node" };
    const input = node.querySelector("input.checklist-add-input");
    if (!input) return { ok: false, why: "no add input" };
    const data = new DataTransfer();
    data.setData("text/plain", "- [ ] Pick a team name\n- [ ] Agree the problem statement\n- [ ] Build the first box\n- [ ] Demo to the room");
    input.focus();
    input.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
    return { ok: true };
  });
  await page.waitForTimeout(300);
  const checklist = await boxState(checklistId);
  check(
    "DEMO0-1 a pasted task list becomes four checklist rows",
    pasted.ok && checklist.checklistItems === 4,
    `items=${checklist.checklistItems} ${pasted.why || ""}`
  );

  // Start the timer through the real control.
  const timerStarted = await page.evaluate(() => {
    const node = [...document.querySelectorAll(".box-node")].find((n) => n.innerText.includes("Timer"));
    if (!node) return false;
    const btn = [...node.querySelectorAll("button")].find((b) => /Start/.test(b.textContent));
    if (!btn) return false;
    btn.click();
    return true;
  });
  await page.waitForTimeout(300);
  const timer = await boxState(timerId);
  check("DEMO0-2 the timer starts and records a shared start time", timerStarted && timer.timerStartedAt > 0);

  const note = await boxState(noteId);
  check("DEMO0-3 the agenda note renders on the board", note.content.startsWith("1) intros"));

  // The companion answers from the board snapshot.
  await page.evaluate((boxId) => window.__dsh.useBoardStore.getState().sendChatMessage(boxId, "What's on this board? What should we do first?"), chatbotId);
  await page.waitForTimeout(600);
  const chat = await boxState(chatbotId);
  const last = chat.chatMessages[chat.chatMessages.length - 1] || {};
  check(
    "DEMO0-4 the Chatbot replies from the board (user message + assistant reply)",
    chat.chatMessages.length >= 2 && last.role === "bot" && /board/i.test(last.text || ""),
    `${chat.chatMessages.length} messages`
  );
  const chatbotPrompt = await page.evaluate(() => window.__demo.prompts.find((p) => p.includes("board snapshot")) || window.__demo.prompts[window.__demo.prompts.length - 1] || "");
  check(
    "DEMO0-5 the chatbot was given the board snapshot and the question",
    chatbotPrompt.includes("What's on this board?"),
    chatbotPrompt.slice(0, 80).replace(/\n/g, " ")
  );
});

// ===========================================================================
// Demo 1 — One idea, four boxes (Idea → Research → PRD → Code)
// ===========================================================================
await runDemo(1, "One idea, four boxes", async () => {
  const ideaText = "A weeknight dinner planner for a family of four: decide the week's meals on Sunday, one shared shopping list, and a reshuffle button when plans change.";

  const ideaId = await addBox("idea", { content: ideaText });
  const researchId = await addBox("research");
  await connect(ideaId, researchId);
  const research = await run(researchId);
  check("DEMO1-1 Research runs from the Idea and lands a Markdown brief", research.status === "done" && research.output.startsWith("# Research"), research.error || research.output.slice(0, 50));

  const researchPrompt = await page.evaluate(() => window.__demo.prompts.find((p) => p.includes("A weeknight dinner planner")) || "");
  check("DEMO1-2 the Idea text is what the Research box actually received", researchPrompt.includes(ideaText));

  const prdId = await addBox("prd");
  await connect(researchId, prdId);
  const prd = await run(prdId);
  check(
    "DEMO1-3 PRD runs from the Research hand-off",
    prd.status === "done" && prd.output.startsWith("# PRD") && prd.output.includes("P0:"),
    prd.error || prd.output.slice(0, 40)
  );

  const codeId = await addBox("code");
  await connect(prdId, codeId);
  const code = await run(codeId);
  check(
    "DEMO1-4 Code builds a complete React prototype (App + mount)",
    code.status === "done" && /function\s+App|const\s+App/.test(code.code) && /ReactDOM\.createRoot/.test(code.code) && code.codeVersion === 1,
    code.error || `${code.code.length} chars`
  );
  check(
    "DEMO1-5 every run records its token usage on the box",
    research.tokens > 0 && prd.tokens > 0 && code.tokens > 0,
    `${research.tokens} / ${prd.tokens} / ${code.tokens}`
  );

  // The optional "Request a change…" beat: a new version, never an overwrite.
  await page.evaluate((boxId) => window.__dsh.useBoardStore.getState().updateBoxData(boxId, { changePrompt: "Make the headings calmer and add a reshuffle button to the meal list." }), codeId);
  await page.evaluate((boxId) => window.__dsh.useBoardStore.getState().applyChangeRequest(boxId), codeId);
  await page.waitForTimeout(800);
  const changed = await boxState(codeId);
  check(
    "DEMO1-6 Apply change appends v2 and keeps v1 recoverable",
    changed.status === "done" && changed.codeVersion === 2 && changed.codeVersions === 2 && /v2/.test(changed.code),
    `v${changed.codeVersion}, ${changed.codeVersions} versions`
  );

  // 💾 Save hands the audience a real Markdown artifact.
  const savedResearch = await saveOutcome("Research");
  check("DEMO1-7 💾 Save downloads the research as research.md", savedResearch.filename === "research.md" && savedResearch.text.startsWith("# Research"), savedResearch.filename);
});

// ===========================================================================
// Demo 2 — A pitch deck in three boxes (Idea → Research → Slides)
// ===========================================================================
await runDemo(2, "A pitch deck in three boxes", async () => {
  const ideaId = await addBox("idea", { content: "A subscription app that turns a family's weeknight dinners into one shared shopping list, with a one-tap reshuffle when plans change." });
  const researchId = await addBox("research");
  await connect(ideaId, researchId);
  await run(researchId);

  const slidesId = await addBox("slides");
  await connect(researchId, slidesId);
  const slides = await run(slidesId);
  check(
    "DEMO2-1 Slides renders a 10-slide deck from the research",
    slides.status === "done" && slides.slides === 10 && slides.output.length > 0,
    slides.error || `${slides.slides} slides`
  );
  const deckText = await nodeText("Slides");
  check("DEMO2-2 the deck is navigable and shows speaker notes", /Problem/.test(deckText) && /1 \/ 10|2 \/ 10|10 \/ 10/.test(deckText), deckText.slice(0, 100).replace(/\n/g, " / "));

  const savedDeck = await saveOutcome("Slides");
  check(
    "DEMO2-3 💾 Save downloads the deck as slides.md with titles, bullets and notes",
    savedDeck.filename === "slides.md" && savedDeck.text.includes("## 1. Problem") && savedDeck.text.includes("Speaker note"),
    savedDeck.filename
  );
});

// ===========================================================================
// Demo 3 — A designed page in one box (UI Design)
// ===========================================================================
await runDemo(3, "A designed page in one box", async () => {
  const uiId = await addBox("ui");
  await page.evaluate((boxId) =>
    window.__dsh.useBoardStore.getState().updateBoxData(boxId, {
      content: "A calm weekly meal-planning page for a family: this week's dinners as a list, a shared shopping list, and one reshuffle action.",
    }), uiId);
  const ui = await run(uiId);
  check("DEMO3-1 the box simplifies the request into a design brief", ui.designBrief.length > 100 && /Design brief/i.test(ui.designBrief), `${ui.designBrief.length} chars`);
  const isDoc = await page.evaluate((code) => /<!DOCTYPE\s+html/i.test(code) && /<\/html\s*>/i.test(code), ui.code);
  check(
    "DEMO3-2 the build is ONE self-contained HTML page (no framework, no build step)",
    ui.status === "done" && isDoc && /<style>/.test(ui.code) && !/<script\s+src=/.test(ui.code),
    ui.error || `${ui.code.length} chars`
  );
  const frames = await page.evaluate(() => [...document.querySelectorAll("iframe")].map((f) => ({
    title: f.getAttribute("title") || "",
    srcdoc: (f.getAttribute("srcdoc") || "").slice(0, 60),
    len: (f.getAttribute("srcdoc") || "").length,
    visible: !!(f.offsetWidth || f.offsetHeight),
  })));
  const previewDoc = await page.evaluate(() => {
    const frame = [...document.querySelectorAll("iframe")].find((f) => (f.getAttribute("srcdoc") || "").includes("Weekly meal plan"));
    return frame ? (frame.getAttribute("srcdoc") || "") : "";
  });
  check("DEMO3-3 the Preview tab renders the page locally", previewDoc.includes("Weekly meal plan"), `${previewDoc.length} chars · frames=${JSON.stringify(frames)}`);

  await page.evaluate((boxId) => window.__dsh.useBoardStore.getState().updateBoxData(boxId, {
    changePrompt: "Use a deep pine header with one marigold primary button, and make the dinner list feel like a timetable.",
  }), uiId);
  await page.evaluate((boxId) => window.__dsh.useBoardStore.getState().applyChangeRequest(boxId), uiId);
  await page.waitForTimeout(800);
  const changed = await boxState(uiId);
  check(
    "DEMO3-4 Apply change rewrites the page as v2 and keeps v1",
    changed.status === "done" && changed.codeVersion === 2 && changed.codeVersions === 2 && /Reshuffle week/.test(changed.code) && /#123229/.test(changed.code),
    `v${changed.codeVersion}`
  );
});

// ===========================================================================
// Demo 4 — Read a repo, then change it safely (Code Map, Code Edit)
// ===========================================================================
await runDemo(4, "Read a repo, then change it safely", async () => {
  const mapId = await addBox("codemap", { repoUrl: "https://github.com/octocat/Hello-World" });
  const map = await run(mapId);
  check("DEMO4-1 Code Map reads the repository and writes an orientation brief", map.status === "done" && map.output.startsWith("# Code Map"), map.error || map.output.slice(0, 40));
  check(
    "DEMO4-2 the box records what it actually read (repo, branch, files, chars)",
    map.repoMeta && map.repoMeta.repo === "octocat/Hello-World" && map.repoMeta.branch === "master" && map.repoMeta.files === 2 && map.repoMeta.chars > 0,
    JSON.stringify(map.repoMeta && { repo: map.repoMeta.repo, branch: map.repoMeta.branch, files: map.repoMeta.files })
  );
  const mapText = await nodeText("Code Map");
  check("DEMO4-3 the provenance line is visible on the box", /octocat\/Hello-World@master/.test(mapText) && /2 files of 2/.test(mapText), mapText.slice(0, 80).replace(/\n/g, " / "));

  const editId = await addBox("codeedit", {
    repoUrl: "https://github.com/octocat/Hello-World",
    filesToEdit: "README.md",
    content: "Add a short \"Usage\" section to the README explaining how to copy the project and run it, and keep the existing heading.",
  });
  const edit = await run(editId);
  check("DEMO4-4 Code Edit produces a change set for the file it read", edit.status === "done" && edit.changeSet.length === 1 && edit.changeSet[0].path === "README.md" && edit.changeSet[0].added > 0, edit.error || JSON.stringify(edit.changeSet.map((c) => c.path)));
  check(
    "DEMO4-5 the app computed the diff itself (the model never writes the patch)",
    edit.output.startsWith("# Change set") && edit.output.includes("```diff") && /\+.*Usage/.test(edit.output)
  );
  const editText = await nodeText("Code Edit");
  check("DEMO4-6 the box shows the change set, the diff and the apply hint", /\+/.test(editText) && /git apply code-changes\.patch/.test(editText), editText.slice(0, 90).replace(/\n/g, " / "));

  // The guide's step 4 verbatim: save the patch, `git apply --check` it.
  const patch = await saveOutcome("Code Edit");
  check("DEMO4-7 💾 Save downloads code-changes.patch", patch.filename === "code-changes.patch" && patch.text.includes("diff --git a/README.md b/README.md"), patch.filename);

  let applied = "";
  try {
    const dir = mkdtempSync(join(tmpdir(), "ai-canva-demo4-"));
    writeFileSync(join(dir, "README.md"), "# Hello World\n\nThis is a demo repository used by the AI Canva demos.\n");
    writeFileSync(join(dir, "code-changes.patch"), patch.text);
    execFileSync("git", ["init", "-q"], { cwd: dir, stdio: "pipe" });
    execFileSync("git", ["apply", "--check", "code-changes.patch"], { cwd: dir, stdio: "pipe" });
    execFileSync("git", ["apply", "code-changes.patch"], { cwd: dir, stdio: "pipe" });
    applied = await readFile(join(dir, "README.md"), "utf8");
  } catch (err) {
    applied = "ERROR: " + String(err && err.message ? err.message : err).slice(0, 120);
  }
  check(
    "DEMO4-8 the downloaded patch passes `git apply --check` and applies cleanly",
    applied.includes("## Usage") && !applied.startsWith("ERROR"),
    applied.startsWith("ERROR") ? applied : "applied into a temp repo"
  );
});

// ===========================================================================
// Demo 5 — The gated pipeline (Intent → Spec → Plan)
// ===========================================================================
await runDemo(5, "The gated pipeline", async () => {
  const intentId = await addBox("sdlc-intent", {
    content: "Add a \"Reshuffle week\" action to the meal planner. It should suggest a new set of dinners while keeping the shopping list in sync, and explain what changed.",
  });
  const specId = await addBox("sdlc-spec");
  const planId = await addBox("sdlc-plan");
  await connect(intentId, specId);
  await connect(specId, planId);

  const intent = await run(intentId);
  const intentLocked = await page.evaluate((boxId) => window.__dsh.useBoardStore.getState().setSdlcGateRequired(boxId, false) === false, intentId);
  check(
    "DEMO5-1 Intent produces v1, keeps its open questions visible and cannot auto-advance",
    intent.status === "done" && intent.sdlcVersions.join() === "1" && intent.sdlcGate === "pending"
      && /## Open questions/.test(intent.output) && (intent.output.match(/^- /gm) || []).length >= 2 && intentLocked,
    intent.error || `${(intent.output.match(/^- /gm) || []).length} questions, hard gate locked=${intentLocked}`
  );

  // The gate bar's Approve button, through the real UI.
  const approved = await page.evaluate(() => {
    const node = [...document.querySelectorAll(".box-node")].find((n) => n.innerText.includes("1 · Intent"));
    const btn = node && [...node.querySelectorAll("button")].find((b) => b.textContent.trim() === "Approve");
    if (!btn) return false;
    btn.click();
    return true;
  });
  await page.waitForTimeout(400);
  const approvedIntent = await boxState(intentId);
  check(
    "DEMO5-2 Approve records who approved which version (the audit trail)",
    approved && approvedIntent.sdlcGate === "approved" && approvedIntent.sdlcApprovedVersion === 1 && approvedIntent.sdlcApprovedBy === "Demo Runner",
    `gate=${approvedIntent.sdlcGate} by=${approvedIntent.sdlcApprovedBy}`
  );

  const spec = await run(specId);
  check("DEMO5-3 Spec runs only after the Intent approval", spec.status === "done" && spec.output.startsWith("# Spec"), spec.error || spec.output.slice(0, 40));
  check(
    "DEMO5-4 the app sees the unresolved question itself and forces the gate",
    spec.sdlcOpenItems.length === 1 && /Rollout order/.test(spec.sdlcOpenItems[0]) && await page.evaluate((boxId) => window.__dsh.useBoardStore.getState().setSdlcGateRequired(boxId, false) === false, specId),
    JSON.stringify(spec.sdlcOpenItems)
  );

  await page.evaluate((boxId) => window.__dsh.useBoardStore.getState().approveArtifact(boxId), specId);
  const plan = await run(planId);
  check("DEMO5-5 Plan runs after the Spec approval", plan.status === "done" && plan.output.startsWith("# Plan"), plan.error || plan.output.slice(0, 40));
  check(
    "DEMO5-6 the app cross-checks every spec decision against a named test",
    plan.sdlcGaps.length === 1 && /Shopping list keeps checked items/.test(plan.sdlcGaps[0]),
    JSON.stringify(plan.sdlcGaps)
  );

  await page.evaluate((boxId) => window.__dsh.useBoardStore.getState().approveArtifact(boxId), planId);
  await page.waitForTimeout(300);

  // 🗂 Audit — the artifact the guide says you can hand to an auditor.
  const [auditDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.evaluate(() => {
      const node = [...document.querySelectorAll(".box-node")].find((n) => n.innerText.includes("3 · Plan"));
      const btn = node && [...node.querySelectorAll("button")].find((b) => b.textContent.trim().includes("Audit"));
      if (!btn) throw new Error("no Audit button on the plan box");
      btn.click();
    }),
  ]);
  const auditText = await readFile(await auditDownload.path(), "utf8");
  check(
    "DEMO5-8 🗂 Audit downloads the whole chain with approvals, versions and a JSON appendix",
    auditDownload.suggestedFilename().startsWith("sdlc-audit-") && /## 1 · Intent/.test(auditText) && /Approved by Demo Runner/.test(auditText) && /## Machine-readable record/.test(auditText),
    auditDownload.suggestedFilename()
  );

  // The trust loop: regenerate the approved Intent → downstream approvals stale.
  await page.evaluate((boxId) => window.__dsh.useBoardStore.getState().requestChanges(boxId, "Make the reshuffle explain which dinners changed and why."), intentId);
  const intentV2 = await run(intentId);
  const specAfter = await boxState(specId);
  const planAfter = await boxState(planId);
  check(
    "DEMO5-7 regenerating Intent appends v2 and marks downstream approvals stale",
    intentV2.sdlcVersions.join() === "1,2" && intentV2.sdlcGate === "pending" && specAfter.sdlcGate === "stale" && planAfter.sdlcGate === "stale",
    `intent=${intentV2.sdlcGate} spec=${specAfter.sdlcGate} plan=${planAfter.sdlcGate}`
  );
});

// ===========================================================================
// Demo 6 — Agent: one prompt, a whole pipeline
// ===========================================================================
await runDemo(6, "Agent: one prompt, a whole pipeline", async () => {
  await page.evaluate(() => {
    window.__demo.agentQueue = [
      { action: "add_box", ref: "r1", boxType: "research", title: "Dinner planner research", prompt: "Research weeknight dinner planning for busy families." },
      { action: "add_box", ref: "r2", boxType: "prd", title: "Dinner planner PRD", prompt: "Write a PRD from the research above." },
      { action: "connect", from: "r1", to: "r2" },
      { action: "run_box", box: "r1" },
      { action: "run_box", box: "r2" },
      { action: "finish", answer: "# Done\n\nBuilt a Research → PRD pipeline for the dinner planner and ran both boxes." },
    ];
  });
  const agentId = await addBox("agent");
  await page.evaluate((boxId) =>
    window.__dsh.useBoardStore.getState().updateBoxData(boxId, {
      content: "Research the idea of a weeknight dinner planner for busy families and write a PRD for it. Keep it focused: one research box and one PRD box, then summarise the result.",
    }), agentId);

  const agent = await run(agentId, 30000);
  check("DEMO6-1 the Agent finishes with a final answer", agent.status === "done" && /Research/.test(agent.output) && agent.output.includes("# Done"), agent.error || agent.output.slice(0, 40));
  check("DEMO6-2 the step timeline is recorded on the box", agent.agentSteps >= 5, `${agent.agentSteps} steps`);

  const created = await page.evaluate(() => {
    const st = window.__dsh.useBoardStore.getState();
    const types = st.nodes.map((n) => n.data?.boxType || n.type);
    const byType = (t) => st.nodes.filter((n) => (n.data?.boxType || n.type) === t);
    return {
      research: byType("research").length,
      prd: byType("prd").length,
      researchOutput: byType("research")[0] ? (st.boxData[byType("research")[0].id].output || "").slice(0, 40) : "",
      prdOutput: byType("prd")[0] ? (st.boxData[byType("prd")[0].id].output || "").slice(0, 40) : "",
      edges: st.edges.length,
    };
  });
  check("DEMO6-3 the boxes it created are ordinary boxes on the board", created.research === 1 && created.prd === 1 && created.edges >= 1, JSON.stringify(created));
  check(
    "DEMO6-4 the Agent ran those boxes (their outputs exist)",
    created.researchOutput.startsWith("# Research") && created.prdOutput.startsWith("# PRD"),
    `${created.researchOutput} | ${created.prdOutput}`
  );
});

// ---------------------------------------------------------------------------
const realErrors = pageErrors.filter((e) => !/Missing or insufficient permissions/i.test(e));
check("Z1 no unexpected page errors", realErrors.length === 0, realErrors.join(" | ").slice(0, 200));

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} demo checks passed`);
if (failed.length) {
  console.log("failed: " + failed.map((f) => f.name).join(", "));
  process.exit(1);
}
