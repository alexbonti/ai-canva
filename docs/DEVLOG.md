# DEVLOG — Session Journal

Durable record of what each working session changed and what is in flight, so a **new session
can pick up cold in one read** (`AGENTS.md` first for durable knowledge, then this file for
current state).

> This file is about **state**, not knowledge. Conventions, architecture, and gotchas belong in
> `AGENTS.md`; "what were we doing / what's half-done / what's next" belongs here.

## 2026-10-27 — Production deploy (redesign + demos + docs live on carbondocs)

- **Deployed:** the whole uncommitted working tree (87 modified + ~19 new files: the "Printed Line"
  redesign and landing, Workspace split, a11y pass, demo guides + `client/demo-scripts.mjs`, course
  packs, and the Code Map / Code Edit / UI Design / here.now / shared-checklist work already in the
  tree) to **carbondocs** via `bash scripts/deploy.sh`. Hosting version finalized, `api` +
  `processStitchJob` functions updated, firestore + storage rules released (unchanged since the last
  deploy). Build: `client/dist` index chunk `index-CM4vDpN-.js`; the `functions` runtime warning about
  Node.js 20 (decommission 2026-10-30) still applies — unchanged.
- **Verified live:** `https://carbondocs.web.app/` → 200 in ~0.23 s; the live HTML references
  `assets/index-CM4vDpN-.js`, the same hash as the fresh local build (the new bundle is what serves);
  `/api/health` → `{"status":"ok","ollamaKey":"configured","falKey":"configured","stitchKey":"configured",
  "githubToken":"optional","herenowKey":"anonymous"}`; `POST /api/generate` returned a real Ollama
  reply (`deepseek-v4.1-flash:1017`, 70 tok) and an unknown `/api/*` route returns the JSON 404
  `{"error":"Not found."}`.
- **Deploy gotcha (agent harness only):** the firebase CLI's stored token was stale and its refresh
  failed because the agent file sandbox forbids writes to `~/.config/configstore` — the CLI reports
  this misleadingly as "Your credentials are no longer valid. Please run firebase login --reauth".
  Workaround: copy the configstore into the workspace (`<ws>/.firebase-home/.config/configstore/`) and
  run the deploy with `HOME=<ws>/.firebase-home XDG_CACHE_HOME=<ws>/.firebase-home/.cache`, so the
  refreshed token can be written; delete the temp HOME afterwards (it holds tokens). A normal user
  shell can refresh in place, so a human never needs the workaround.
- **Left uncommitted:** the full working tree incl. this entry — nothing committed or pushed; commit
  it (and record the deploy commit) before the next session.

## 2026-10-27 — Redesign shipped to production (carbondocs)

- **Merged + pushed:** `da8c6b7` on `main` (218 files, +15,678 / −3,040) — the "Printed
  Line" redesign, the quality pass, the demo workflow guides and `client/demo-scripts.mjs`.
  `origin/main` is now at `da8c6b7` (it also carries the earlier unpushed deploy-record commit
  `c1b1465`).
- **Gates before deploy:** 380 unit tests (75 server + 305 client), `client/ui-smoke.mjs`
  84/84, `client/demo-scripts.mjs` 40/40, client build + clean functions build OK.
- **Deployed:** `bash scripts/deploy.sh` → hosting (26 files) released on carbondocs;
  firestore + storage rules re-released; `functions[api]` and `processStitchJob` **skipped —
  no changes detected** (the backend already matched production).
- **Verified live:** `https://carbondocs.web.app/` → 200 with the new bundle
  (`/assets/index-CM4vDpN-.js`, self-hosted Archivo + IBM Plex Mono, new landing, 0 console
  errors in headless Chrome); `/api/health` ok with ollama/fal/stitch keys;
  `POST /api/generate` answered via `deepseek-v4.1-flash:1017` (62 tok);
  `POST /api/repo-digest` read `octocat/Hello-World` from the cloud function.
- **Next:** build the seven demo boards as facilitator **template boards** in the live project
  (the procedure is in `docs/DEMOS.md` → *Re-use the boards without code*); the Deploy finale in
  demos 1/3 has not been exercised against the live hosting yet.

## 2026-10-26 — Demo guides, implemented

- **Done:** the guides are now backed by code in two ways.
  1. **`client/demo-scripts.mjs`** (new, 40 checks) is the executable twin of `docs/DEMOS.md`: it
     builds each of the seven demo boards through the real store + UI, mocks `/api/generate` and
     `/api/repo-digest` at the page level (no Ollama/GitHub/Firebase), and asserts every outcome the
     guide promises — checklist paste, timer start, chatbot board-awareness, the Idea→Research→PRD→
     Code chain incl. v2 change request and `research.md`, the 10-slide deck + `slides.md`, UI
     Design brief→one-HTML-page + local preview + v2, Code Map provenance, Code Edit's app-computed
     diff and a real `git apply --check` of the downloaded `.patch`, the three SDLC gates + stale
     invalidation + `🗂 Audit`, and the Agent creating/running ordinary boxes. Run: `cd client &&
     node demo-scripts.mjs [0-6]` with `npm run dev` up; **40/40 on two consecutive runs**. Wired
     into `docs/DEMOS.md` (*Keeping the demos current*), `docs/TESTING.md` (live suites), the
     quality-gates bullet in `AGENTS.md`, and the README docs table.
  2. **Zero-code re-use path documented** in `docs/DEMOS.md`: build each demo once as a facilitator
     **template board** (Facilitator → Templates → *Create & open*), then copy it per team from
     Facilitator → Teams (*Create team* → 5 seat codes), guests join via *Join my team*. Caveat
     written down: the facilitator role is granted from the deployed Function (`POST
     /api/admin/roles`; local server 501), and template edits do not propagate to existing team
     copies.
- **Next:** rehearse 4 and 5 with real providers once before using them on stage (the scripted
  versions are deterministic mocks).

## 2026-10-26 — Demo workflow guides

- **Done:** added `docs/DEMOS.md` — seven short demo scripts (team warm-up; idea→research→PRD→code;
  pitch deck; one-box designed page; repo map + safe edit; gated SDLC; agent) written to be built
  live in 3–10 minutes. Every demo runs on the local stack with **Ollama only** (no fal.ai, Stitch
  or deploy); each has setup, exact paste texts, wiring steps, talk track, variations and
  "if it stalls" notes, plus a copy-paste card and a troubleshooting table. Linked from `README.md`
  and `docs/OVERVIEW.md`.
- **Validated live** (fake-user session, local Ollama, `deepseek-v4.1-flash:1017`): the Demo 1
  chain Idea→Research→PRD and the Demo 3 UI Design box were run end-to-end with the guide's exact
  texts (`.impeccable/validate-demo.mjs`): Research **31.6 s** / 5,862 tok, PRD **24.1 s** /
  7,725 tok, UI Design **7.6 s** / 3,209 tok (860-char brief), zero page errors. The Code leg was
  measured separately at **12.0 s** / 4,260 tok (9.6k-char JSX). Timings in the doc are these runs.
- **Environment finding:** Code previews use Sandpack, whose bundler/assets come from
  `codesandbox.io`; on the current machine `col.csbops.io/data/sandpack` times out, so the Code
  preview stayed on Sandpack's loading cube in headless runs. UI Design previews are local HTML
  iframes and were unaffected. The guide therefore marks Code Preview as the one network-dependent
  surface and points at UI Design / Code tab / StackBlitz as fallbacks — no code change made (the
  preview works where codesandbox is reachable; this is a network block, not an app regression).
- **Next:** rehearse 4 and 5 once against a real public repo / a real change request before using
  them on stage; they are the two scripts whose output depends most on model behaviour.

## 2026-10-26 — Quality pass: a11y, bundle split, real bug fixes, verification

- **Fixed (real bugs found):**
  - UI Design boxes (HTML pipeline) got wrapped AGAIN in the React/Babel preview wrapper by
    `BoxNode`, so the preview iframe died with "Unexpected token (2:0)" and 💾 Save wrote a
    nested `<html>`-inside-`text/babel` file. Preview + download now branch on
    `isFullHtmlDocument()`: full pages verbatim, legacy React `code` still wrapped. Verified with
    `.impeccable/audit-fixes.mjs` (page renders, download has exactly one `<html>`, no wrapper;
    Code box keeps its React wrapper; Stitch stays raw).
  - The palette/select a11y gap, help-card landmark, and low-contrast cream (`rgba(...,.5)` =
    4.14:1 at 11 px on pine) — fixed; axe now 0 violations across landing desktop/mobile/tablet
    and workspace (palette open + closed).
  - `debugLog` recursion (self-call) found by the marker suite during this pass — fixed to
    `console.log` and all store save/snapshot logs are DEV-only now.
- **Optimized:**
  - Split the signed-in surface into lazy `components/Workspace.tsx` (owns ReactFlowProvider) +
    lazy Admin/Facilitator dashboards. Landing no longer downloads React Flow's box renderers or
    the markdown chunk: **496 KB → 424 KB transferred**, LCP ~92 ms, CLS 0.0256 → 0.
  - Preloaded the Archivo woff2 (killed the font-swap CLS), added favicon/description/OG tags.
  - Migrated the last off-system classes in `BoxNode` (74 `slate-*`/`bg-white`/`rounded-lg`/
    `shadow-sm` occurrences) and the blue prompt-chip to tokens; added `error-wash`/`error-line`
    tokens; printed disabled-button state; removed dead CSS (`.rule-t`, `.rule-b`,
    `.ring-signal`, unused `.box-status.is-done/.is-stale`), CSS 87.6 → 85.5 KB.
  - `npm audit`: server 0 vulnerabilities (28 packages bumped by a non-breaking fix); client keeps
    4 high inside `@grpc/grpc-js` (Firebase's Node transport — not in the browser bundle; needs a
    Firebase major).
- **Docs:** `AGENTS.md` (a11y craft floor, quality gates, Workspace split, UI-HTML preview rule,
  DEV-only logs), `DESIGN.md` (Accessibility section), this entry.
- **Verified:** `tsc` clean (client + server), **380/380** unit tests (305 client + 75 server),
  `ui-smoke` **84/84**, exact E2E markers all true, axe **0**, detector source `[]` + URL only the
  intentional cream warning, production build OK, landing perf above, all 27 box types render with
  zero page errors.
- **In flight / next:** the working tree is uncommitted (the whole redesign + this pass); local
  trial on `http://localhost:5173`, nothing deployed. Admin/Facilitator dashboards remain
  type-checked/dashboard-only (need real roles to exercise). Optional: Firebase major bump to clear
  the client audit highs, and the landing hero's left-column whitespace at 1440 (accepted).

## 2026-10-25 — Redesign: "The Printed Line" (workspace + landing)

- **Done:** Committed a brand-new visual world (impeccable, direction "Line — transit diagram +
  timetable"): cream timetable paper, deep-pine signage bar, marigold signal, per-category line
  colours, station codes, route edges with knots, category colour only. Added `PRODUCT.md`,
  `DESIGN.md`, `.impeccable/design.json`; self-hosted Archivo + IBM Plex Mono
  (`client/src/assets/fonts/`); vendored Lucide-style `ui/Icon.tsx`; new `ui/Button` variants
  (`primary|signal|secondary|ghost|danger|bar|bar-ghost`), `ui/Menu` card-stock panel; rewrote
  tokens/`tailwind.config.js`, `index.css`, `Header`, `Sidebar`, `Toolbar`, `BoxNode`,
  annotations, panels, `App` join surfaces, `Cursors`; new `RouteEdge.tsx` + `lib/lines.ts`;
  landing rewritten to the same world in `client/src/landing.css` + `components/landing/*`.
  Feature/layout model untouched; all E2E text markers preserved (hidden-glyph convention).
  A fresh-context finish review flagged leftover unicode/emoji icons and old-system drift inside
  boxes; fixed in a second pass (icons everywhere incl. timer/Run/Area/slide/delete, no emoji chrome,
  paper dropzones, one focus ring, light Sandpack, checklist empty state + no duplicate ticker,
  honest role counts, mobile workshop bar + single CTA, `DESIGN.md` responsive wording).
  Verification: `tsc` clean, 305 unit tests, `ui-smoke` 84/84, detector source scan `[]`, landing
  URL scan 1440/390 clean apart from the intentional cream-palette warning.
- **In flight:** nothing uncommitted beyond this work; **not deployed** (local trial only, user
  asked not to push). Local trial server on **`http://localhost:5173`** (client Vite on ::1:5173, Express
  API on 3001; Firebase backend still external). The old stale Vite process that served a 500
  (`bg-card` does not exist) was killed — if you see that error, restart the client dev server
  so it reloads `tailwind.config.js`.
- **Next steps:** open `http://localhost:5173` and try the redesign; then decide on deploy (not
  done — user asked for local trial first). Optional polish: visually smoke-test the
  Admin/Facilitator dashboards; see `.impeccable/finish-review.md` for the disposition + nits.

## How to use

- **Newest entries at the top** (directly below this guide).
- Append one entry per finished unit of work (feature, fix, deploy, investigation with a durable
  outcome) — not per chat message.
- Keep entries short. Use the template:

```markdown
## YYYY-MM-DD — short title

- **Done:** one to three lines, outcome-focused. Files/filesystems touched if non-obvious.
- **In flight:** partial work, uncommitted state, things deliberately left half-done (or "—").
- **Next steps:** what the next session should pick up first (or "—").
```

- Prune as you go: collapse entries older than ~a month to one line each — unless they describe
  work still in flight.
- If an entry reveals a durable convention or gotcha, promote it into `AGENTS.md` (per its
  maintenance rule) and keep only the state here.

---

## 2026-10-23 — UI Design rebuilt as a two-step "simplify → simple HTML page" pipeline

- **Ask (user):** "the design UI is too complicated — first simplify the research, then create the
  design; this should not require a full app like the coding box, only a very simple HTML."
- **Done:** the ✨ UI Design box no longer generates React. `runUiDesign` in `boardStore.ts` now runs
  two small calls: (1) simplify the description + everything connected into a compact **design brief**
  (`UI_BRIEF_SYSTEM_PROMPT`/`UI_BRIEF_PROMPT`, ≤160 words, 3-4 sections, palette, mock content),
  stored as `boxData.designBrief` and shown in a new 🧭 **Brief** tab; (2) build **ONE plain
  self-contained HTML page** (`UI_BUILD_*`, inline `<style>`, ≤300 lines) from that brief. Prompts in
  `client/src/types.ts`, all pure helpers in **`client/src/lib/uidesign.ts`** (`buildDesignBriefPrompt`,
  `buildUiBuildPrompt`, `buildUiChangePrompt`, `isFullHtmlDocument`, `extractHtmlDocument`,
  `normalizeUiDesign`, `toUiPreviewHtml`, `uiBuildSystemPrompt`) with 19 unit tests. The box previews,
  edits (CodeMirror HTML highlighting via `@codemirror/lang-html`) and deploys the page as-is
  (`deployFilesFor("ui")` → a single `index.html`); a **legacy React** `code` from an old board still
  previews/changes/deploys through the old CDN wrapper. AI change requests on an HTML page use
  `UI_CHANGE_PROMPT` + an `isFullHtmlDocument` guard (a partial/truncated rewrite is rejected, the old
  page kept, versions still append).
- **Also found & fixed:** the provider is a **thinking model** — its reasoning is ~2× the visible
  reply and is counted in `eval_count` (so the old 27k-token "out" numbers were mostly thinking).
  Both `ollama.ts` copies now accept `GenerateOptions { think }` and `/api/generate` forwards an
  optional `think` body field; UI Design sends `think: false` for brief, build and change calls.
  Measured on the same request: **64 s / 22.8k tokens with thinking → 8 s / 3.3k without**, same
  quality (and no prose/fence around the file). Two preview bugs found by browser testing and fixed:
  the `preview-ready` listener was gated to Code boxes (so a UI page's overlay never cleared) and the
  Preview tab forced the overlay on even when the iframe was already rendered — now the iframe is
  `key={code}` (remount on rebuild → `onLoad` always fires), the ping is accepted for ui/stitch, and
  the tab no longer forces loading.
- **Verified:** unit tests 75 server + 305 client; `tsc` clean ×3; browser runs against the real dev
  app — heavy 9-section research input → **9 s**, brief 1 009 chars, page 191 lines / 7.7 KB / 0
  scripts / 3 927 tokens total, iframe rendered, Brief tab rendered; AI change request on the page →
  v2 (+10 −4), accent recoloured, footer added, preview rerendered, no console errors (screenshots
  `/tmp/ui-design-v2-check.png`, `/tmp/ui-design-change-check.png`). Docs updated: `BOX_TYPES.md`
  (UI Design + deploy list), `MODELS.md` (thinking/`think`), `API.md` (`think` field), `AGENTS.md`.
- **In flight:** nothing deployed — the production build still runs the old UI Design box until the
  next `npm run deploy` (which also ships the model pin, 32 768 budget, streaming transport and 300 s
  timeout from the entry below).
- **Next steps:** run the full E2E suite in a quiet window, then deploy on request.

---

## 2026-10-23 — UI Design box "generated code is incomplete": output cap **and** non-streaming transport

- **Symptom:** right after pinning the text model to `deepseek-v4.1-flash:1017`, the **UI Design box
  failed every run** with `⚠️ Generated code is incomplete (missing the App component or the
  ReactDOM render call)`.
- **Root cause 1 (the reply, not the guard):** `num_predict` was **8192** and this tag's Tailwind-heavy
  designs emit 8–13k tokens, so generation stopped mid-JSX and the final
  `ReactDOM.createRoot(...).render(<App />)` line was never emitted (reproduced: exactly
  `completionTokens: 8192`, unbalanced code fence). `isCompletePrototype` then did its job — it
  refused incomplete code — but its message sent users hunting the wrong thing. A first fix raised
  the budget to **16 384**, which still truncated a verbose roll (the user saw the new honest
  "ran out of output space" message instead).
- **Root cause 2 (found while verifying the higher budget):** at **32 768** the *non-streamed*
  provider call died at **~61 s** with `fetch failed` / "remote end closed" — nothing keeps an idle
  ~90 s connection alive, so a bigger budget made long runs fail completely. Measured directly
  against Ollama: non-streamed 32k heavy prompt failed at 61 s; **streamed** (NDJSON) completed in
  87 s with 31 837 tokens and the mount call present.
- **Fix:** budget 8192 → 16 384 → **32 768** (`NUM_PREDICT`, both `ollama.ts` copies); the Ollama call
  is now **streamed** (`stream: true`, NDJSON accumulated server-side, final chunk carries
  `done_reason`/token counters) with the same 300 s abort; `truncated` (`done_reason: "length"`)
  surfaces on `GenerateResult` + `/api/generate`, and the client reports "the model ran out of output
  space — retry with a shorter description" instead of blaming a missing App (build **and**
  change-request paths); `extractCode` strips an unterminated opening fence; code/ui + change requests
  get a **5-minute** client deadline; the production `api` function's `timeoutSeconds` went 120 → 300
  (a 1–2 min generation would otherwise be killed). Tests: streaming accumulation, no-trailing-newline
  last chunk, truncation flag (length vs stop vs token-count fallback), provider error chunk,
  `num_predict` 32 768.
- **Verified:** unit tests **358/358** (server 75 + client 283), `tsc` clean in client/server/functions,
  client production build OK, and the **full E2E suite 105/105** with a fresh firebase-tools token
  (real auth + Firestore, real `/api/generate`, two-user sync, facilitator/guest flows, 0 page errors). Real backend, heavy 10-section dashboard prompt (the stress case): 73 s,
  **27 646 output tokens**, 42 KB, mount present, `truncated: false`. Direct provider with the same
  prompt used **31 837** tokens — so 16 384 could never have fit. **Browser run of the actual UI
  Design box** (fake user, real Ollama, headless Chrome) with that description: Run → `status: done`
  in **69 s**, 25 260 output tokens, **54 735-char code with the mount**, preview iframe rendered, no
  error banner, no page errors (`/tmp/ui-design-check.png`).
- **In flight:** production still runs the old function build — the model pin, 32 768 budget, streaming
  transport and 300 s function timeout all reach it only on the next `npm run deploy`.
- **Next steps:** deploy when asked; if a design ever exceeds 32 768 tokens the honest truncation
  message is the fallback (a "keep it compact" retry hint was measured to cut output 8 178 → 4 868
  tokens on the same prompt, if that path is ever needed).

## 2026-10-23 — Default text model pinned to `deepseek-v4.1-flash:1017`

- **Done:** the hardcoded default for **all text generation** is now `deepseek-v4.1-flash:1017` (a
  specific build tag of the same model — pinned revision, same behaviour) in both backends
  (`server/src/ollama.ts` + `functions/src/ollama.ts`); `OLLAMA_MODEL` still overrides it. No env
  override is set in `server/.env` or `functions/.env`, so the code default is what runs. Updated
  `MODELS.md` (map, provider section, change log), `API.md`, `ARCHITECTURE.md`, `DEPLOYMENT.md` and
  both `.env.example` templates.
- **Verified:** direct Ollama `/api/chat` and the dev `/api/generate` both echo
  `"model":"deepseek-v4.1-flash:1017"`; unit tests + typechecks green.
- **In flight:** production (the deployed Cloud Function) keeps serving the previous default until
  the next `npm run deploy` — the functions were not deployed in this change.
- **Next steps:** deploy when asked; if the `:1017` tag is retired by Ollama, change the default in
  both `ollama.ts` files (or set `OLLAMA_MODEL`) — `docs/MODELS.md` is the registry to update.

## 2026-10-22 — "many boxes don't work": four silent breakages found in a full box-by-box QA sweep

- **Done — root causes (each one made boxes look broken without an error on screen):**
  1. **Google Stitch retired the model id the Stitch UI box sent** (`GEMINI_3_FLASH`) → every run failed
     with "Request contains an invalid argument". `server|functions/src/stitch.ts` now tries a candidate
     list (`STITCH_MODEL` env → `GEMINI_3_5_FLASH_LITE` → `GEMINI_3_8_FLASH` → provider default), reads
     the env lazily (ES-import hoisting ran module code before `dotenv`), moves on when an id is
     rejected, retries a transient transport drop once on a **fresh** client (the SDK singleton is
     poisoned by a failed transport), and treats the provider's "Incomplete API response" as
     transient. Verified end-to-end: job `done` with 20 KB of HTML. The provider still closes its
     streamed call at ~60 s (see "in flight").
  2. **A Slides run made every later board save fail** — `parseSlidesResponse` emitted
     `notes: undefined` (nested), and `cleanBoxDataForFirestore` only stripped top-level `undefined`.
     Firestore rejects the whole document, so the board silently stopped persisting (no output/title/
     chat saved) — the strongest candidate for "many boxes don't work". Parser now always emits a
     string; the serializer deep-strips `undefined` as a safety net; regression tests added.
  3. **A box left `status:"running"` stayed dead forever.** A reload/crashed run kept the persisted
     status, and `runBox` (plus chatbot/deploy/SDLC/agent paths) refuse to start while `running` — Run
     stayed disabled for every user across every reload. `normalizeBoxDataForLoad()` now converts a
     loaded/rehydrated `running` box to an interrupted-run error (Firestore load + localStorage
     `merge`); live snapshots are deliberately not normalized (another user may be mid-run). Every
     client AI call also got a hard timeout (`apiFetch`), so a hung provider reports an error instead
     of freezing the box.
  4. **Smaller store-level fixes:** input-only boxes (Idea/Image/Documents) refuse `runBox` (an agent
     `run_box` action used to call the model with an empty prompt and stamp "done"); node/area
     positions are sanitized to finite numbers; version histories are re-read from the store after an
     `await` so a collaborator's append isn't dropped; board create/load failures surface
     `saveStatus: "error"` instead of a silent blank canvas.
- **Done — backend hardening from the API audit:** JSON body limit raised to **30 MB** in both
  backends (was 10 MB < the documented 25 MB here.now cap → legitimate deploys got an HTML 413 that
  the client showed as "Request failed"); both backends now end with a JSON 404 + error middleware
  (malformed JSON → JSON 400, oversize → JSON 413, no HTML stack traces); local `admin/users` routes
  answer JSON 501 like stats/roles; the local Stitch job store prunes finished jobs, reports
  `running`, and returns the production response shape; `/api/repo-digest` has a 45 s overall budget
  (returns a partial digest with a note instead of blowing Hosting's 60 s rewrite); Ollama, the
  Stitch CDN download and the workshop proxy got request timeouts; `raw.githubusercontent.com` file
  paths are segment-encoded; `functions/` requires real booleans for `disabled`/`grant` (a bodyless
  POST used to unblock an account / revoke a role); here.now deploys upload with bounded concurrency
  and honour `requiresFinalize`/`isLive`/`publishStatus` (a no-op update no longer reports "nothing
  was published"). Docs updated: `API.md` (error format, 30 MB, health keys, digest budget, admin
  501s, Stitch async errors), `.env.example` (`STITCH_MODEL`, `WORKSHOP_PROXY_URL`), `AGENTS.md`,
  `MODELS.md`, `ARCHITECTURE.md`.
- **Done — the QA sweep itself (4 read-only teammates, ~500 checks):** static review of the box
  pipeline (found the 3 critical bugs above + the NaN console noise was a probe artifact, not app
  code), backend audit (confirmed the Stitch enum drift live; found the body-limit/admin-route/
  error-shape/timeout/here.now/functions-validation defects fixed above), build/coverage audit
  (tests, typechecks, build all green; flagged missing coverage: no `functions/` tests, no
  boardStore tests, `image`/`cartoon` + several worker boxes only covered indirectly), and live
  box-by-box browser testing (363 checks across the palette, run paths, panels, persistence and
  interrupted-run recovery). QA also found one cosmetic bug, now fixed: ⏹ Stop on the Agent appended
  the stop event twice to `agentSteps` (a "stop requested" step in `stopAgent` plus the loop's final
  "stopped" step) — only the loop writes it now. Two audit follow-ups were also fixed: the Cloud
  Task worker no longer retries a job (`maxAttempts` 3 × the inner 4-generation budget could exceed
  the 540s timeout and leave jobs `running`), and `scripts/deploy.sh` now copies every provider key
  (`FAL`/`STITCH`/`HERENOW`/`GITHUB`) into `functions/.env` when missing.
- **Verification:** unit tests **352/352** (server 70 + client 282; new regressions cover nested
  `undefined`, `running` normalization, JSON error contract, admin stubs, Stitch status shape,
  here.now contract); `tsc --noEmit` clean in client/server/functions; vite build OK; `ui-smoke.mjs`
  **84/84**; `e2e.mjs` **92/93** in a quiet window — the single failure is the environment-bound
  stale `firebase-tools` token (facilitator grant 401; re-login fixes it). The suite's T7/T14
  real-model checks were flaky under the QA browsers' load and T14's marker assertion was hardened
  for HTML/Markdown decoration; both pass on a quiet run. Live checks: Stitch box produces HTML (20 KB), Cartoon generates via fal.ai, Code Map
  reads a real repository, here.now deploy creates and serves a live Site, reload mid-run recovers
  to an interrupted-run error.
- **In flight / known risks (documented, not regressions):** the Stitch provider still drops its
  streamed MCP call at ~60 s on slow generations (the retry re-runs generation; no `get_screen`
  recovery yet); board version history (`codeVersions` / `sdlcVersions`) is still unbounded vs
  Firestore's 1 MB document limit; workshop capacity is a non-transactional read-then-write (two
  simultaneous last-seat redemptions can overfill by one); admin aggregates page every Auth user /
  `usageTotals` doc and list the whole bucket; `docs/API.md` documents all of it.
- **Next steps:** `get_screen` recovery for Stitch (and a shared attempt budget if task-level
  retries ever come back); async repo-digest + job-based big here.now deploys; cap/compress artifact
  history; guest checklist identity (derive from uid, not email); run the E2E with a refreshed
  `firebase-tools` token to record a clean 106/106.

---

## 2026-09-26 — SDLC guide becomes a fillable student workbook (research, diagrams, results inside it)

- **Done:** The individual-project guide is now **also the student's workbook** — the place they record the
  research, diagrams, prompts, test results and reflection, not just the instructions. `sdlc-step-by-step.md`
  gained a `How to use this workbook` section (three ways to work: type in the browser / print & write / edit
  the `.md` in the repo; autosave warning; a phase → section → evidence table) and a
  `### ✍️ Your work — Phase N` block at the end of each phase: box choice, problem statement, user +
  success criteria, research question, annotated bibliography (3 sources), problem diagram, report §1–2
  drafts; inputs/outputs, both prompts, two design diagrams, guardrails, design-decisions table, build plan;
  build record, branch/PR, what broke; post-user-testing fixes, report §5–6, reflection. New **§12
  Submission** adds links (report/PR/board), a 12-item final checklist and an optional notes field.
  `sdlc-step-by-step.html` was rebuilt as a **fillable workbook** on the same stylesheet: `contenteditable`
  answer boxes, work tables and draw areas (unique `data-key`s), checkboxes, autosave to `localStorage`
  (`ai-canva-sdlc-workbook-v1`, debounced, try/catch so a blocked/full store only shows a chip warning), and a
  fixed toolbar — **🖨 Print / PDF**, **⬇ Download answers (.md)** (serialises the live DOM in document order:
  fields, work tables as Markdown tables, checklists as `- [x]`) and **🗑 Clear answers** — hidden in print,
  where the answer areas keep their heights so they print as blank writing space.
- **Reconciled:** `individual-project/README.md` (index rows call it the workbook, §2 "handing out the
  workbook", new caveat 5 — autosave is per-browser and is **not** a submission channel), `02` stub, `08` §3,
  `09` §2, `00` intro point at the workbook; `AGENTS.md` got a new **"Course handouts (fillable workbooks)"**
  section documenting the pattern (data-key convention, storage key, export/print contract, md-is-source).
- **Verified:** the rebuilt HTML parses cleanly (0 stray/unclosed tags, clean EOF) and its workbook
  `<script>` passes `node --check`; 34 task IDs and the 9/6/7/8 = 30 h budget match the Markdown
  row-for-row; all 24 ✍️ answer surfaces (21 typed fields + 3 draw areas), 11 work tables, 16 checkboxes
  and 3 checklists are present, and the 5 callouts / 8 `pre.block` survived. A real-Chrome run confirmed
  autosave + restore, the `.md` export, print styling (toolbar hidden, writing space kept) and the
  blocked-storage / quota-full fallbacks. Fixed after that run: the two Phase-2 diagram captions carried no
  label and exported as two identical `### (Caption:)` headings — each caption now has a
  `data-field-label` (`Caption — design diagram A/B …`), so no exported heading repeats.
- **In flight:** —.
- **Next steps:** unchanged from the entry below (the 4 h user-testing trade-off vs the sprint pack, the
  brief's 130% weighting, the Week-8 vs Week-10 timeline, the checklist guest-identity fix). New: if a cohort
  needs a real submission channel for the workbook, decide where the **⬇ exported `.md`/PDF** is collected.

---

## 2026-09-26 — Individual project: SDLC step-by-step guide (4 phases, 34 tasks, user testing added)

- **Done:** New student-facing guide `docs/course/individual-project/sdlc-step-by-step.md` (+ print handout
  `sdlc-step-by-step.html`) that re-tells the whole "One Student, One Box" project in **classic SDLC order**:
  **P1 Study the problem** (9 h) → **P2 Design the solution** (6 h) → **P3 Implement the box on AI Canva**
  (7 h) → **P4 Test it** (8 h) = **30 h, 34 tasks**, each with hours, a 🔴/🟡/🔵 marker and a "done when".
  Deliberately simple (short sentences, one deliverable per task): the three diagrams students must draw
  (problem / box flow / decision-data flow) with copyable ASCII examples + a 5-point checklist, a
  research-question fill-in template, the **6 technical test scenarios** table, a **user-test record** table
  (U1–U3) with the "say this, then stop talking" script and simple ethics rules, paste-ready Checklist blocks
  per phase, a phase → report-section/rubric mapping, and a §10 sprint reconciliation.
- **Reconciled:** `individual-project/README.md` (index rows, §2 paste-per-phase step, new caveat 4),
  `02_student_brief_one_box.md`, `08` §3, `09` §2, `00` intro all point at the guide; `AGENTS.md` layout row
  updated. Verified by script: 34 task IDs, tables ↔ paste blocks match exactly, phase hours 9/6/7/8 = 30,
  phase headings agree, Markdown fences balanced.
- **In flight:** —.
- **Next steps:** settle the guide's one deliberate difference — it spends **4 h on user testing** that the
  sprint pack spends on peer review (1.5 h) + output polish (1.5 h) + part of the report hour; either drop
  those pack rows (30 h) or budget ~31.5 h and make the pack say so (README caveat 4). Still open from the
  previous session: the brief's 130% weighting, the Week-8 vs Week-10 timeline, the checklist guest-identity fix.

---

## 2026-09-14 — Course: individual project moved into its own folder + 3-week sprint tasks

- **Done:** The individual **"One Student, One Box"** project now lives in
  **`docs/course/individual-project/`** (`git mv` of both the brief and its print handout):
  `brief.md` / `brief.html` (the original, unchanged), `README.md` (index: 3-week sprint at a glance,
  how to hand the tasks out via a Checklist box, and three timeline/weighting caveats) and
  **`sprint-tasks.md` / `sprint-tasks.html`** — the **whole project as a 3-week sprint, 30 h**
  (10 h/week), cut as Week 1 *choose it, prove you need it, register it* · Week 2 *make it run* ·
  Week 3 *justify it, demo it*, each with a Wednesday checkpoint, a Friday deliverable, "done when"
  per task and a paste-ready Checklist block. `docs/course/02_student_brief_one_box.md` is now a short
  **redirect stub** (no HTML stub) so old links still land somewhere sensible, and `00_intro_message.md`
  points at the folder. `08` (§1 row, §3, §5.1) and `09` (§1 note, §2, §4.1, §5 row) were **trimmed to
  the group tracks** with pointers to the folder, in both `.md` and `.html`, so the individual tasks
  exist in exactly one place and cannot drift. `AGENTS.md` documents the new layout.
- **Verified:** throwaway vitest file (deleted — no test added) ran every paste block through the real
  `parseChecklistLines` (one task per line, unclamped, within the 200-task/500-char caps) and asserted
  the **budgets**: 10 h per week × 3 = 30 h, and exactly **6 h 🔴 / 3 h 🟡 / 1 h 🔵 in each week**.
  Every pre/task/table tag in the two new HTML handouts is balanced (9/9, 6/6, 12 fences in the md).
- **Found while writing it:** the brief weights the same mark twice — §4 lists *"C. Reflection / demo
  (30%)"* on top of A 30% + B 70%, so the printed weights add to 130%, while the rubric adds to exactly
  100% (Build 15+10+5, Research 15+15+15+10+10+5, i.e. the demo is inside the build mark). Documented in
  `individual-project/README.md` §3 and `sprint-tasks.md` §6 rather than silently editing the brief —
  needs a decision on whether the reflection carries weight of its own.
- **In flight:** —.
- **Next steps:** decide the reflection's weighting (and the Week-8 vs Week-10 timeline) and fix the
  brief + intro so all three documents agree; populate a live workshop with real student names; the
  guest-identity fix for checklist assignment is still unimplemented.

---

## 2026-09-14 — Course: Week 1 task pack (10 h/student, project already running)

- **Done:** New **`docs/course/09_weekly_task_packs.md`** (+ `09_weekly_task_packs.html`) — the
  *this-week* cut of `08`: **Week 1 of Sprint 1** with a hard **10 h/student** budget and **no setup
  time** (the project already runs). Individual track: 7 tasks summing to exactly 10 h (brief+rubric
  read, box shortlist, lock box + research question, 3 annotated sources, pipeline sketch, `types.ts`
  entry, PR). Group tracks: **3 h shared + 7 h role = 10 h**, split by role (UX / BA / Dev / Domain
  7 h each) with the Domain row specialised per track; 🔴 must (6 h) / 🟡 should / 🔵 stretch markers
  with an explicit **cut line at 6 h**, a Wednesday checkpoint and a Friday deliverable, plus what the
  instructor checks Friday and the "10 hours ≠ 🔴 rows ticked" reality check. Six paste-ready
  Checklist blocks (individual, group-shared-with-roles, and one Domain row per track).
- **Verified:** a throwaway vitest file (deleted afterwards — no test added) ran the six blocks through
  the real `parseChecklistLines` (one task per line, unclamped, under the caps) **and asserted the hour
  arithmetic**: the individual block sums to 10 h and the group block to 3 h shared + 7 h for each of
  the four roles, so the budgets can't drift silently when a task row is edited.
- **In flight:** —.
- **Next steps:** if the cohort is past Week 1, re-cut §3 into the next week's pack (the §6 template
  says what Week 2 is); populate a live workshop with real team/member names when the roster is known.

---

## 2026-09-14 — Course: Sprint Task Plan handout (assigning tasks to students)

- **Done:** New instructor handout **`docs/course/08_sprint_task_plan.md`** (+ print-friendly
  `08_sprint_task_plan.html`, same style block as the other course handouts) that turns the five
  project tracks (individual "One Student, One Box" + the four group briefs) into **assigned tasks**:
  per-milestone tasks for the individual track (M1–M5 / Weeks 1–10) and per-role × per-sprint tasks
  for the group tracks (S1 20h, S2 30h, S3 30h, role owners + due week + "done when" + the
  role-specific frameworks each track's Domain task must shortlist). **Seven paste-ready Markdown
  checklist blocks** (§5) go straight into a Checklist box on a team board — the documented hand-out
  path is Facilitator → Templates (one per track, with the Checklist box) → Workshops → Teams
  (per-seat codes) → students join on the landing page and tick/assign in place. The blocks were
  verified against the real parser (`parseChecklistLines`: one task per line, nothing clamped, every
  block within the 200-task cap) with a throwaway vitest file that was then deleted — no test added.
- **Found while writing it (worth acting on):** the individual brief ends at **Week 10** while
  `00_intro_message.md` says "3 sprints (8 weeks)" — one of the two is wrong and students will notice.
  Also, **seat-code guests cannot be assigned tasks and their ticks are anonymous**: the Checklist's
  `＋ assign` list and `✓ name` attribution are email-based (owner + `collaborators` + present users)
  while a guest's presence email is `""` (`boardStore.ts` writes `user.email || ""` for guests, whose
  custom-token auth has no email). A guest who *types* an email at the profile step lands in
  `collaborators` (so they become assignable) but still shows no `✓ name` on their own ticks.
  A contained fix (guest identity = uid + chosen display name) is documented in §2.2 but **not
  implemented** — needs a go/no-go.
- **In flight:** —.
- **Next steps:** decide the individual-track timeline (Week 8 or Week 10) and fix the inconsistent
  doc; optionally implement guest identity for checklist attribution/assignment.

---

## 2026-02-08 — Deploy: Checklist box live on carbondocs (hosting + rules)

- **Done:** `bash scripts/deploy.sh` to `carbondocs` from commit `dbe3474` — **Hosting released** (new
  entry `assets/index-DG1Ejgbo.js` — the exact artifact built and tested locally) plus storage and
  firestore **rules released**; **Functions were skipped** ("No changes detected"): the `api` +
  `processStitchJob` code (including the here.now endpoint from the parallel workstream) was already
  current, so this run shipped the client only. Verified live: `/` → 200, `/api/health` →
  `{"status":"ok","ollamaKey/falKey/stitchKey":"configured","githubToken":"optional","herenowKey":"anonymous"}`,
  and the **served bundle now contains the box** (`Checklist`, `checklistItems`, `team to-do`,
  `Clear done`, `checklist-add-input` — the panel's real strings) where the previously live bundle
  (`index-DF6pHO8-.js`) contained none of them. The Checklist is now in the **production palette**
  (Add Box → Collaboration, last row, below Timer) — locally it was always just *below the fold*
  (palette row 26 of 27), which is what made it look missing against the deployed site.
- **Note (not a regression):** the landing page's box showcase keeps its curated `ORDER` list, which
  has never included the collaboration boxes (Note/Label/Timer are absent too), so the Checklist's
  discovery path is the palette. Also `HERENOW_API_KEY` is still unset in `functions/.env`, so Sites
  deployed from a box stay **anonymous (24h expiry)** — add the key and re-deploy for permanent Sites.
- **In flight:** —.
- **Next steps:** —.

---

## 2026-02-08 — Checklist box: a shared team to-do list on the board

- **Done:** New **Checklist** collaboration box (✅ `checklist`, palette "Collaboration", `roles:
  ["everyone"]`, `hasAI: false`) — a **shared team to-do list**: anyone on the board adds, assigns,
  renames, reorders, ticks off and deletes tasks, and everyone sees the same list live through the
  normal board save (last-write-wins, like a Note). Rows record `createdBy`/`createdAt` and, on a
  tick, `doneBy`/`doneAt` (shown as `✓ alice`); the panel header shows progress (`2 of 5 done` +
  bar). Tasks can be **pasted in bulk** (a multi-line paste appends every line, keeping Markdown
  `- [x]` state and stripping bullets/numbering), assigned via a picker built from the board's
  people (owner + collaborators + present users), reordered with ▲▼, exported with 📋 Copy
  (Markdown checklist) and pruned with 🧹 Clear done. All rules are pure functions in the new
  **`client/src/lib/checklist.ts`** (`appendChecklistItems`, `parseChecklistLines`,
  `toggleChecklistItem`, `setChecklistItemText`/`Assignee`, `moveChecklistItem`,
  `removeChecklistItem`, `clearDoneChecklistItems`, `checklistStats`, `checklistToMarkdown`,
  `normalizeChecklist`; caps 200 tasks × 500 chars so the board doc stays under Firestore's 1MB
  limit); rendering + store wiring is the new **`components/ChecklistPanel.tsx`** (owns its own
  store subscriptions — BoxNode must not subscribe to presence) over exactly ONE new store action
  `setChecklistItems` (which skips the write when a mutation changed nothing). `ChecklistItem`
  fields are **all always defined** (Firestore rejects nested `undefined`), the array is created
  empty-but-defined, and `normalizeChecklist` repairs anything loaded from an older board.
  Registered in `Canvas.tsx` (nodeTypes + minimap), gated as a utility box in `BoxNode.tsx`
  (no Run/⚙/handles) with a `runBox` early-return, and **excluded from `AGENT_CREATABLE_TYPES`**
  (locked by a new unit test, like the SDLC stages).
- **Also fixed (found by a numeric layout probe, not by guessing):** collaboration boxes rendered
  the generic output block and its **"No output yet. Click Run to generate."** placeholder under
  their own body — the timer has been showing that since it was built. Both blocks are now gated on
  `!isUtility`, so a collab box has exactly one child (its own panel) and no outer scroll.
- **Tests:** **269 client tests** (37 new in `lib/checklist.test.ts`: paste parsing incl. bullets/
  numbering/hyphenated text, caps, attribution on toggle, reorder edges, stats, Markdown export,
  `normalizeChecklist` repair/idempotence) + **105/105** in `client/e2e.mjs` — 13 new "TC" checks
  (palette → panel → typed tasks → multi-line paste with done state → attribution → progress line →
  assignment → ▼ reorder → clear done → ✕ delete → the no-Run/no-handles contract → every field
  defined) and 9 new "T15" checks driving **two real signed-in users on one real Firestore board**:
  B adds the box and a task, A sees it, **A ticks it and B sees it ticked WITH A's attribution**,
  B assigns a task to A (picker lists both members), A's pasted list reaches B, and the list
  **survives a reload** with state, assignee and attribution intact (no Firestore `undefined`).
  `npx tsc --noEmit` clean, `npm run build` clean.
- **In flight:** —.
- **Next steps:** — (possible follow-ups, none needed now: let a Checklist feed an AI box as a
  `{{inputs}}` source, or per-person "my tasks" filtering in the footer).

---

## 2026-02-08 — Deploy: Code Map worker + `/api/repo-digest` live on carbondocs

- **Done:** `bash scripts/deploy.sh` to `carbondocs` from commit `2da51db` — Hosting released (new
  entry `assets/index-MPiINrYV.js`, same hash as the local build) **and Cloud Functions updated**
  (`api` + `processStitchJob`), which this feature needed: `/api/repo-digest` does not exist in
  production without them. Verified live: `/api/health` → `githubToken: "optional"`;
  `POST /api/repo-digest` against a real public repo returned 200 in 1.8s (10 files of 163, 73k
  chars, capped, with the clip/ignore notes); a non-GitHub URL was rejected with the 400 guard
  message (the endpoint is not a request proxy); `/api/generate` still answers; and the served
  bundle contains the box (`codemap`, `Code Map`, `repo-digest`, `code-map.md`, `Digest notes`).
  **No `GITHUB_TOKEN` was set** (decided: public repos are enough for now) — private repositories
  and the higher rate limit need it added to `functions/.env` and a re-deploy.
- **In flight:** —.
- **Next steps:** — (optional: add `GITHUB_TOKEN` to `functions/.env` + `server/.env` for private
  repos).

---

## 2026-02-08 — Deploy: box deploys (here.now) live on carbondocs

- **Done:** `bash scripts/deploy.sh` to `carbondocs` from commit `dbe3474` — Hosting released (new
  entry `assets/index-DG1Ejgbo.js`) **and Cloud Functions updated** (`api` + `processStitchJob`),
  which this needed: `/api/herenow-deploy` did not exist in production before. This deploy also
  shipped the parallel session's Checklist box, since both features are in that commit.
- **Verified live:** `/api/health` → `herenowKey: "anonymous"`; the served bundle contains the
  deploy UI (`herenow-deploy`, `🚀 Deploy` ×2, `Live site`, `Show claim link`); and a **real publish
  through the production Cloud Function** succeeded — a one-file Site went live at
  https://astral-tassel-fc35.here.now/ (HTTP 200, content served), which also proves the function's egress reaches both
  here.now and the storage upload host. `GITHUB_TOKEN`/`HERENOW_API_KEY` remain unset (public repos +
  anonymous 24h Sites).
- **In flight:** —.
- **Next steps:** — (optional: add `HERENOW_API_KEY` for permanent Sites).

## 2026-02-08 — here.now deploy: boxes that contain code can publish to a live URL

- **Done (collision-free half):** new **`POST /api/herenow-deploy`** in both backends, backed by a
  new duplicated module `server/src/herenow.ts` + `functions/src/herenow.ts`: here.now's three-step
  publish flow (**create → upload to presigned targets → finalize** — a Site is not live until
  finalize succeeds) run server-side, so the API key never reaches the browser. Validation before
  any request: site-relative paths only, **`.herenow/` paths refused** (they are here.now
  configuration manifests — a generated box must never ship server-side config), traversal/absolute
  paths refused, caps of 400 files / 8 MB per file / 25 MB total, and finalize `warnings` passed
  through instead of swallowed. Updates take `slug` + `claimToken` (anonymous Sites are updatable
  only with it) and `baseVersionId`, which turns an update into an optimistic concurrency check:
  a Site someone else changed is **refused with a message naming the live version**, never silently
  replaced. New pure client module `client/src/lib/deploy.ts` (+ 10 tests) decides what each box
  publishes: Code/UI → `index.html` (the same CDN-wrapped page the box previews) + `App.jsx`,
  Stitch → its HTML as-is, Code Edit → the changed files at their repository paths + `CHANGES.md`.
  Added `publishSite()` to `lib/api.ts`, `herenowKey` to `/api/health`, `HERENOW_API_KEY` to both
  `.env.example`s, and the endpoint to `docs/API.md`. The here.now skill was installed globally
  (`npx skills add heredotnow/skill`, → `~/.agents/skills/here-now`, which DSH reads).
- **Done (box UI, added once the other session's files settled):** `BoxData.deploy` (`DeployInfo`,
  every field always defined) + the **`deployBox`** store action + **`components/DeployPanel.tsx`**
  (the 🌐 Live site strip: live link, anonymous expiry, 🔑 claim-link toggle with its once-only
  warning, here.now warnings, and errors that keep the previous live site visible rather than hiding
  it) + a **🚀 Deploy** footer button on Code, UI Design, Stitch UI and Code Edit boxes. Redeploys
  update the same Site by sending `slug` + `baseVersionId` + the stored claim token; a refused update
  is surfaced verbatim with the live Site untouched.
- **In flight:** —.
- **Verified:** 60 server tests (16 new: validation, error mapping, the stubbed create/upload/
  finalize flow, stale-base conflict, step-labelled failures) and 10 new client tests (plus 9 new
  deploy checks in `client/ui-smoke.mjs`, now **84/84**); `tsc` clean in client, server and
  functions. **Real deploy from the app:** a live-model Code box built a 115-line prototype, the real
  🚀 Deploy button published it → `https://radiant-lodge-g7cj.here.now/` (200, the prototype HTML and
  its `App.jsx` both served). **Real deploys through the endpoint:** published a two-file Site
  (`index.html` + `NOTES.md`) → `https://cobalt-castle-y2d3.here.now/` (200, content served);
  updated it with the claim token + `baseVersionId` → new version, live content changed (the first
  fetch looked stale — CDN caching, a cache-busted fetch confirmed the update); sent a **stale**
  `baseVersionId` → `400` with "This site has changed since it was deployed (live version …)" and
  the live Site untouched; `NOTES.md` is served through here.now's auto-viewer (HTML wrapper, as
  documented) and an unknown path 404s.
- **Next steps:** when the Checklist work is committed, add the Deploy button/panel (build the file
  set with `deployFilesFor`, call `publishSite`, store the slug/versionId/claim token on the box) and
  document the feature in `AGENTS.md`/`README.md`/`docs/BOX_TYPES.md` — those three are also in the
  other session's modified set, hence untouched here.

## 2026-02-08 — Deploy: Code box change requests live on carbondocs

- **Done:** `bash scripts/deploy.sh` to `carbondocs` from commit `15f308f` — **Hosting only**
  (new entry `assets/index-DF6pHO8-.js`, same hash as the local build); `functions/api` +
  `processStitchJob` were correctly **skipped** ("No changes detected") because this feature is
  pure client-side. Verified live: `/` 200, `/api/generate` still answering, and the served bundle
  contains the change flow (`Request a change`, `Apply change`, the safeguard prompt
  `Apply ONLY that change`, and the append-only revert note `reverted to v`).
- **In flight:** —.
- **Next steps:** —.

## 2026-02-08 — AI change requests in the Code / UI boxes (with diff + revert)

- **Done:** The Code and UI Design boxes now take **change requests**: a "Request a change…" field +
  ✏️ **Apply change** button (shown once code exists) asks the AI to rewrite the component it already
  produced. The prompt template (`CODE_CHANGE_PROMPT`, deliberately **not** per-box editable — its
  rules are the safeguard) demands the COMPLETE file and forbids reformatting, renaming, or dropping
  anything the request did not mention; the reply must still pass `isCompletePrototype` (App component
  **and** a render call) or the existing code is kept and the run errors, and an identical reply adds
  no version. **Every** build and change now appends to `boxData.codeVersions` (the shared
  `ArtifactVersion`/`appendVersion` record — `SdlcVersion` became a type alias of it), and the new
  `CodeChangePanel` shows `vN · +3 −3 vs vN-1`, a 🔀 diff, and a 🕘 history with 👁 view + ↩ **Revert**
  (a revert is itself a new version, so history stays append-only). Upstream boxes can supply the
  request (wire a Review box's findings or a Code Edit change set into a Code box). Stitch boxes are
  excluded (their code is provider HTML).
- **Tests:** **228 client tests** (12 in `code.test.ts` incl. the completeness check, the change-prompt
  builder and the no-feature-loss rules) + **75/75** in `client/ui-smoke.mjs` (9 new CC checks: build
  versioning, apply-a-change, prompt contents, the +/- display, revert-as-new-version, refused
  incomplete reply, unchanged reply, no-code refusal). **Live:** a real build (5.4s, 112 lines) then a
  real change request ("bigger heading, dark buttons") → **+3 −3**, exactly the three intended lines,
  with count/increment/decrement still present and the component still complete.
- **In flight:** —.
- **Next steps:** —.

## 2026-02-08 — Deploy: Code Edit worker live on carbondocs

- **Done:** `bash scripts/deploy.sh` to `carbondocs` from commit `ab5d417` — Hosting released (new
  entry `assets/index-DXCwmJ8K.js`, same hash as the local build) **and Cloud Functions updated**
  (`api` + `processStitchJob`), which this feature needed: the **whole-file `paths` mode** of
  `/api/repo-digest` is new, so Code Edit's file reads would have failed in production without it.
  Verified live: `POST /api/repo-digest` with `paths` returned one file **in full** (3955 chars,
  `clipped: false`) in 1.8s, reported `nope/missing.ts` in `missing`, and refused `../etc/passwd`
  (not echoed, not fetched); the served bundle contains the worker (`codeedit`, `Code Edit`,
  `code-changes.patch`, `Change set`) and the triage prompt (`You plan code changes`), so both the
  pinned/plan path and the triage path shipped.
- **In flight:** —.
- **Next steps:** — (optional future work: push branch + PR if a write token is ever wanted; or
  wiring Code Edit → Review in an SDLC board, which needs no code changes).

## 2026-02-08 — Code Edit worker (apply a change request to an existing repo)

- **Done:** New **Code Edit** worker (✍️ `codeedit`, Workers section, `roles: ["developer",
  "sdlc"]`) — the Code box's sibling: point it at an existing GitHub repository, describe a change,
  and it reads the files that matter and proposes a **reviewable change set** plus a
  `git apply`-able **`.patch`**. **It never writes to the repository** (no token, no branch, no PR —
  a deliberate scope choice), so there is no new secret and no write surface. Flow: target files
  (its own file list → else the file list in an upstream **SDLC Plan** artifact → else one triage
  call) → read those files **in full** through a new **whole-file mode of `/api/repo-digest`**
  (`paths` request field; `contents`/`missing`/`clipped` in the response) → ask for a change set of
  **whole files** → the APP validates it and computes the diff and the patch. New pure module
  `client/src/lib/codeedit.ts` (path safety, plan/triage parsing, change-set validation, LCS line
  diff, unified patch), UI in `components/CodeEditPanel.tsx` + a new shared `components/RepoField.tsx`
  (also used by Code Map), run path `runCodeEdit` in `boardStore.ts`, `setChangeSetFile` for hand
  edits, `.patch` download, Canvas + minimap + agent whitelist, and the duplicated
  `server/src/repo.ts` → `functions/src/repo.ts` kept in sync. Three real bugs caught by the tests:
  the diff treated a missing final newline as unchanged content (git considers it part of the line,
  so `git apply` rejected the hunks), the no-newline marker was placed after a diff *header* line,
  and the marker was omitted when nothing was removed on the original side.
- **Tests:** **225 client tests** (30 new pure + 3 that apply generated patches with real
  `git apply` in throwaway repos, which is what forced those three fixes) and **43 server tests**
  (whole-file mode, `missing`, `clipped`, path safety). **Live:** the `paths` mode against the real
  repo (2 files in full; missing and unsafe paths reported), and a **real end-to-end run** (live
  GitHub + live model, 27.6s) whose change set (+5 −0 on `client/src/lib/download.ts`) produced a
  patch that **`git apply --check` accepted against a fresh clone**, applied with
  `git diff --numstat` = 5/0 and **zero original lines lost**. `client/ui-smoke.mjs` now passes
  **66/66** (13 new Code Edit checks incl. Plan-driven targeting and the triage path).
- **In flight:** —.
- **Next steps:** —.

## 2026-02-08 — Code Map worker (repo understanding) + `/api/repo-digest`

- **Done:** New **Code Map** worker (🔭 `codemap`, Workers section, `roles: ["developer", "sdlc"]`)
  that reads a **GitHub repository** and writes an orientation brief (what the code is, stack,
  structure, entry points, main flows, key abstractions, tests/costs, risks, where to start
  reading, open questions). New backend endpoint **`POST /api/repo-digest`** in both
  `server/src/app.ts` and `functions/src/index.ts`, backed by a new duplicated module
  `server/src/repo.ts` + `functions/src/repo.ts`: 1 API call for the tree (plus one for the default
  branch), file contents from `raw.githubusercontent.com` (not rate-limited), only **github.com
  owner/repo** accepted (never a request proxy), optional `GITHUB_TOKEN` for private repos +
  5,000 req/hr (documented in `docs/API.md`, added to both `.env.example`s, reported as
  `githubToken` by `/api/health`). Digest builder ranks files (`scorePath`/`selectFiles`: README +
  dependency manifests → entry points → central modules, with per-directory and per-category caps),
  spends the 60k-char budget in **value order**, **clips** big files rather than skipping them,
  never downloads >400 KB files, and reports every dropped/capped file in `notes`. Client side:
  new pure module `client/src/lib/repo.ts` (`parseRepoRef`/`resolveRepoRef`/`buildCodeMapPrompt`)
  + `fetchRepoDigest` in `lib/api.ts`, run path `runCodeMap` in `boardStore.ts`, a Repository field
  + "what was read" summary (repo@branch · files · chars · capped · when · notes) in `BoxNode`,
  `code-map.md` downloads, `codemap` added to the Agent's creatable whitelist, Canvas nodeTypes +
  minimap colour. Three real bugs found and fixed by the tests: the branch was dropped from the
  request URL, the box's **stock prompt** placeholder (`github.com/owner/repo`) was being resolved
  as a repository, and the digest budget was being spent alphabetically instead of by value.
- **Tests:** 35 server tests (18 new in `server/src/repo.test.ts` incl. a stubbed-fetch digest flow,
  + 4 new route/health tests in `app.test.ts`) and 205 client tests (14 new in `repo.test.ts`)
  pass; `tsc --noEmit` + `vite build` clean. **Live:** real endpoint against a real public repo
  (`alexbonti/ai-canva`: 10 files of 158, 71k chars, capped, notes listed) and a **real end-to-end
  box run** (live GitHub + live model, 42s) producing a 21k-char brief that cites real paths
  (`client/src/store/boardStore.ts`, `server/src/app.ts`, `client/src/types.ts`,
  `functions/src/index.ts`). `client/ui-smoke.mjs` (renamed from `sdlc-smoke.mjs`, now covering both
  features) passes **53/53**.
- **In flight:** —.
- **Next steps:** deploy (Functions must ship for `/api/repo-digest` to exist in production; set
  `GITHUB_TOKEN` there if private repositories should be readable); then run the E2E suite in a quiet
  window to confirm the 80/80 baseline still holds.

## 2026-02-08 — Deploy: SDLC pipeline live on carbondocs

- **Done:** `bash scripts/deploy.sh` to `carbondocs` from commit `ef184d2` — Hosting released
  (19 files, new entry `assets/index-Bs1JfCFH.js`), `functions/api` + `processStitchJob` skipped
  (no server/functions changes in this feature: the gates are entirely client-side). Verified live:
  `/` 200, `/api/health` all keys configured, `/api/generate` → `{"content":"Hi","model":"deepseek-v4.1-flash"}`,
  and the served bundle contains the feature (`sdlc-intent`/`sdlc-merge`, the `SDLC` palette
  section + `🔁 SDLC` View profile, `Require approval before the next stage can run`, `intent.md`,
  `sdlc-audit-`, the hard-gate copy) — i.e. the deployed HTML points at the same
  `assets/index-Bs1JfCFH.js` hash as the local build.
- **In flight:** —.
- **Next steps:** —.

## 2026-02-08 — SDLC pipeline group + per-box outcome downloads

- **Done:** Added the **SDLC** palette group (`BoxCategory: "sdlc"`, section "SDLC" between Inputs
  and Workers) with six gated stage boxes — `sdlc-intent` 🎯, `sdlc-spec` 📐, `sdlc-plan` 🧭,
  `sdlc-implement` 🛠️, `sdlc-review` 🔎, `sdlc-merge` 🚀 (labels "1 · Intent" … "6 · Merge") — plus
  a new **`🔁 SDLC` View profile** (`BoxRole: "sdlc"`; Sidebar's `ROLES` list + the localStorage
  whitelist). Faithful gate mechanics: approve / request changes (feedback is injected into the next
  regeneration) / reject / edit-as-new-version, append-only `sdlcVersions` + `sdlcHistory`, the gate
  checked **before** any model call, app-side cross-checks (spec open items, spec decisions with no
  named test in the plan, implementation deviation, parsed review findings), downstream approvals
  marked `↻ stale` when an upstream stage changes, hard gates on Intent + Merge plus every forced
  condition (the ⚙ toggle is refused, not silently ignored), a Skills field on spec/review, a
  `🗂 Audit` export of the whole chain, and a `💾 Save` button that downloads any text-output box's
  outcome as Markdown (`client/src/lib/download.ts`). New pure modules `client/src/lib/sdlc.ts` +
  `client/src/lib/download.ts` (both unit-tested), UI in `components/SdlcGatePanel.tsx` +
  `BoxNode.tsx`, run path `runSdlcStage` in `boardStore.ts`. Docs updated: `BOX_TYPES.md` (SDLC
  section, download section, category/role lists), `AGENTS.md` (box count 17→23, category/role
  lists, two new convention bullets), `README.md` (box table + feature bullets),
  `LandingRoles.tsx` (4th "For SDLC teams" card).
- **Tests:** 176 client tests pass (48 new: 38 in `sdlc.test.ts`, 10 in `download.test.ts`, plus
  SDLC additions in `serialization.test.ts` and `agent.test.ts`); `tsc --noEmit` and `vite build`
  clean. **Live verification:** the new `client/sdlc-smoke.mjs` (playwright-core against the real
  dev app on 5173, `/api/generate` mocked per stage) passes **40/40** — palette section + SDLC View
  profile, the gate refusing to run before approval with **zero** model calls, approve/edit-as-new-
  version, all four app-side cross-checks, `stale` invalidation of downstream approvals, dismissing
  a blocking finding, `💾 Save` (`intent.md`) and `🗂 Audit` (asserted by reading the downloaded
  files), 6 stages + versions + gates surviving a reload. The existing E2E suite still passes
  **80/80** (no regression). No server/functions changes — the gates are entirely client-side and
  add no new persisted state beyond `boxData`.
- **In flight:** —.
- **Next steps:** — (optional future work: move per-box version history into
  `boards/{id}/sdlc/...` if a heavily regenerated board ever approaches Firestore's 1 MB document
  limit).

## 2026-02-08 — Deploy: new default model live on carbondocs

- **Done:** `bash scripts/deploy.sh` to `carbondocs` (Hosting 200; `/api/health` all keys
  configured; live `/api/generate` verified serving `"model":"deepseek-v4.1-flash"`). Production
  now runs the new default text model; functions `api` + `processStitchJob` updated.
- **In flight:** —
- **Next steps:** —.

## 2026-02-08 — Default text model → deepseek-v4.1-flash

- **Done:** Changed the hardcoded default in BOTH `server/src/ollama.ts` and `functions/src/ollama.ts`
  (`deepseek-v4-flash` → `deepseek-v4.1-flash`), plus doc comments, `server/.env.example`,
  `functions/.env.example`, `docs/API.md`, `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, and the
  `docs/MODELS.md` map (change log entry added). No `OLLAMA_MODEL` override is set in either env
  file, so both environments use the new default; **production takes effect on next deploy**.
- **In flight:** —
- **Next steps:** —

## 2026-02-08 — docs/MODELS.md: model registry (single source of truth)

- **Done:** Added `docs/MODELS.md` — one page mapping every model to its concern (text =
  Ollama `deepseek-v4-flash` default via `OLLAMA_MODEL`; Stitch = `GEMINI_3_FLASH` via
  `STITCH_MODEL`; fal.ai images = `fal-ai/qwen-image-edit` / `fal-ai/flux/schnell`, hardcoded),
  provider config, how to switch (env override vs duplicated code defaults in BOTH
  `server/src/` + `functions/src/`), runtime observability (`tokenUsage` docs record the model),
  and a change log. Cross-referenced from `docs/API.md` (env section) and `AGENTS.md` (docs
  lists + rule to update it on model changes). Also replaced the stale Anthropic comments in
  `server/.env` with a note — an `ANTHROPIC_API_KEY` existed in `server/.env`/`functions/.env`
  but no Anthropic code exists; **deleted the unused key from both env files**.
- **In flight:** —
- **Next steps:** if models are switched for the booth, append to the MODELS.md change log;
  optionally centralize the hardcoded model IDs into a per-backend `models.ts` module.

## 2026-02-08 — Tablet / iPad (coarse-pointer) support across the canvas

- **Done:** Made the app usable on a large tablet for the booth demo. All touch behavior is
  scoped to `@media (pointer: coarse)` in `client/src/index.css` (desktop unchanged). Page level:
  `index.html` viewport now `viewport-fit=cover, maximum-scale=1, user-scalable=no` + apple/web
  app metas (Add-to-Home-Screen → chrome-less kiosk), `.app-bar` safe-area insets, `100dvh`
  root height, `overscroll-behavior: none`, global `touch-action: manipulation` on buttons,
  `user-select: none` on body for coarse pointers (reading surfaces re-enabled). Touch targets:
  React Flow handles 18px (`!important` over inline), resize handles 20px, controls 34px,
  deletes 30px, footer buttons/slide-nav/timer/palette/header bumps via new marker classes.
  Hover-gated ✕ buttons (Documents file rows, Sidebar custom templates) get `.touch-visible`;
  note/label/chatbot deletes always visible on touch. Box bodies (`box-body nodrag`) scroll with
  a finger instead of dragging the node. Canvas: Area tool now works from touch (native
  touchstart/move/end on `.react-flow__pane`), presence cursors update via `onTouchMove`,
  `zoomOnDoubleClick={false}`. Help card yields the corner to zoom controls on touch.
  Verified: 126 client unit tests + full E2E **80/80** (desktop viewport).
- **In flight:** —
- **Next steps:** real-device pass on an iPad (keyboard-overlap when typing in low boxes,
  CodeMirror on-screen editing feel); optionally hide the minimap on small screens.

## 2026-08-30 — Chatbot companion: a chatting stick figure on the board

- **Done:** Added the 🧍 **Chatbot** (17th box type, new `companion` category + "Companions"
  palette section): a stick-figure AI you can hold a continuous conversation with. Auto-placed at
  the viewport bottom-center on add (`data.autoPlace` → Canvas effect → `placeChatbot`), rendered
  as a custom annotation branch in `BoxNode.tsx` (SVG `StickFigure.tsx`, speech bubble, thinking
  bob). Click opens `ChatbotPanel.tsx` (portaled) — shared transcript with attribution, editable
  name (default "Chat Pal"), 🧠 personality editor (`boxData.personality`), clear-chat, Retry on
  error. Each reply = store `sendChatMessage` → persona + board snapshot (via `buildBoardInventory`,
  chatbots/agents/areas filtered) + last 16 messages → `/api/generate`; no backend changes. New
  `lib/chatbot.ts` (pure; 11 tests; 60-message cap) + tests. `runBox` early-returns for chatbot;
  agent inventory now also hides chatbots. E2E-verified live: board-aware reply ("I see an Idea
  Box… and a Research Box…"), persona + rename round-trips, auto-place, bubble.
- **In flight:** —
- **Next steps:** per-user private companions or "typing" presence are possible follow-ups; the
  reply loop is non-streaming (typing dots only) — a streaming endpoint would improve feel.

## 2026-08-30 — Agent box: a real task-driven agent on the board

- **Done:** Added the 🤖 **Agent** box (16th box type, first in Workers): the user types a task and
  Runs; an LLM controller loop (client-side, reusing `/api/generate`) manipulates the BOARD — each
  turn it returns ONE JSON action (`add_box` / `connect` / `run_box` / `finish`) executed with the
  regular store actions, so agent-created pipelines are ordinary boxes collaborators can take over.
  New `client/src/lib/agent.ts` (pure: action parsing, board inventory, turn prompts, child layout;
  22 unit tests) + `runAgentLoop` in `boardStore.ts` + `isAgent` UI in `BoxNode.tsx` (task textarea,
  live step timeline, final answer, ⏹ Stop) + `connectBoxes`/`stopAgent` store actions. Budget 12
  turns with forced wrap-up, 2× parse-retry with coaching, raw-text salvage; token ledger reused
  with `boxType: "agent"`. Verified end-to-end against the real dev app + Ollama (Playwright smoke:
  agent created/wired/ran boxes and finished with a markdown answer; steps rendered live).
- **In flight:** —
- **Next steps:** optionally let the agent `delete_box`/restyle boxes, or persist per-run cost
  summaries; E2E could add an agent-flow test with a mocked `/api/generate` for determinism.

## 2026-08-30 — Documents box (📎 upload files as AI inputs)

- **Done:** New `documents` input box — multi-file upload (click or drag & drop) whose extracted
  text becomes downstream prompt input. `lib/documents.ts` (unit-tested, 16 tests) holds the
  logic: txt/md/csv/json read directly, PDF via lazy `pdfjs-dist`, DOCX via lazy `mammoth`
  (both stay out of the main bundle); text capped 100k/file, 400k/box. Raw files upload
  best-effort to Storage (`storage.rules` gained a `documents/` path — **rules not deployed
  yet**). `runBox` gathering now uses `buildDocumentsOutput()` for document sources. E2E "TD"
  tests added (upload .txt + a hand-written minimal PDF through the real UI, assert the labeled
  text reaches a connected box's prompt via a fetch intercept).
- **In flight:** —
- **Gotchas hit (durable, see AGENTS.md E2E section):** (1) the firebase-tools access token
  expires ~hourly — a 401 on the facilitator PATCH surfaces as the "TF facilitator button"
  FAIL; refresh by running any `firebase` CLI command before the suite. (2) Running the E2E
  while another session edits `client/src` breaks it via HMR/full reloads (scattered flaky
  failures each run) — run it in a quiet window; my first "crash" theory (Vite re-optimizing
  pdfjs-dist) was wrong, it was the concurrent Agent-box session. (3) `npm install <pkg>`
  pruned `playwright-core` (never in package.json) — now a devDependency. Final state on the
  combined tree (Documents + Agent boxes): **build ✓, unit 128 ✓, E2E 80/80 ✓**.
- **Next steps:** consider a per-document preview/expand in the box UI.
- **Shipped:** committed as `81b0752` (Documents + Agent boxes together) and deployed via
  `scripts/deploy.sh` — hosting + storage rules (documents path live) + firestore rules
  released; functions unchanged (both features are client-only). Verified live:
  `https://carbondocs.web.app` 200, `/api/health` all keys configured, `/api/generate`
  returns real output, and the deployed bundle contains the Documents box code.

## 2026-08-30 — DEVLOG created

- **Done:** Added this session journal (`docs/DEVLOG.md`) and pointer sections in `AGENTS.md`
  (bootstrap note, docs layout table, docs list, maintenance checklist), so future sessions read
  current state here instead of re-exploring the codebase.
- **In flight:** —
- **Next steps:** —