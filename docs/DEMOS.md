# Demo workflows

Seven short, reliable demo scripts for AI Canva. Each one is a **workflow you build live in
3–10 minutes**, uses the built-in box prompts (nothing to author beforehand), and runs on the
local stack with **Ollama only** — no fal.ai, no Stitch, no Firebase deploy.

They are written for whoever is driving: a facilitator opening a workshop, a teammate showing the
product, or you rehearsing on your own. Every step names the button or field, the exact text to
paste, and what the audience should notice.

Two things keep the guides honest: [`client/demo-scripts.mjs`](../client/demo-scripts.mjs) replays
all seven demos with mocked models and asserts the outcomes (see *Keeping the demos current* at the
end), and the boards themselves can be made re-usable as facilitator **template boards** without
writing any code.

| # | Demo | Time | Boxes | Best for | The payoff |
|---|------|------|-------|----------|------------|
| 0 | Team warm-up | 4 min | Note, Checklist, Timer, Chatbot | Workshops (first 5 minutes) | Everyone is on one board and the companion can see it |
| 1 | One idea, four boxes | 8 min | Idea → Research → PRD → Code | Anyone | A one-line idea becomes a working prototype |
| 2 | A pitch deck in three boxes | 5 min | Idea → Research → Slides | Product / founders | A 10-slide deck with speaker notes, downloadable |
| 3 | A designed page in one box | 4 min | UI Design | Designers | A complete HTML page in ~10 seconds |
| 4 | Read a repo, then change it safely | 8 min | Code Map, Code Edit | Developers | A briefing and a reviewable `.patch` for a real repo |
| 5 | The gated pipeline | 10 min | Intent → Spec → Plan | Enterprise / teaching | Nothing advances without a human approval |
| 6 | Agent: one prompt, a whole pipeline | 6 min | Agent | "Wow" slot | The board builds and runs its own boxes |

**Pick by audience:** non-technical / mixed → 1 then 3. Product people → 2. Engineers → 4.
Buyers / architects → 5. A room that needs a laugh → 6. A workshop → 0 first.

---

## Before any demo — the 5-minute kit

1. **Start the stack and check it.**
   ```bash
   npm run dev                          # terminal 1 (server + Vite)
   curl -s localhost:3001/api/health    # expect {"status":"ok", ...}
   ```
   The app is at **http://localhost:5173**. `ollamaKey: "configured"` is the only AI provider the
   demos below need.
2. **Warm the model.** The first Ollama call after idle loads the model (~10–30 s extra). Before
   the audience arrives, add a **Chatbot**, click the figure, send `hi`, wait for the reply, then
   delete it (✕). Everything after that is fast.
3. **Sign in first.** The canvas is behind the landing page. Sign in with your Google account
   *before* the session starts; workshop guests can use a seat code from the Facilitator Dashboard
   instead (no accounts needed).
4. **Make a fresh board.** In the pine bar open **Boards (N) → New Board**, then click the title
   and name it after the demo ("Weeknight dinner planner").
5. **Clear the stage.** Close the *How to use* card (✕) so it doesn't cover boxes; leave **View:
   All boxes**; press the **fit-view** button (bottom-left controls) as you add boxes so the
   pipeline stays framed.
6. **Pace the runs.** Run **one box at a time** — the local model handles a queue poorly, and the
   demo reads better when each output lands while you're talking about the previous one.
7. **Check the network-dependent surface once.** Code previews use Sandpack (assets from
   `codesandbox.io`); UI Design and Stitch previews are self-contained. If the room's network is
   locked down, plan Demo 1 around **UI Design** rather than Code.
8. **Don't deploy on a live connection you don't trust.** Publishing (**Deploy**) creates a real
   public site; keep it as an optional finale and know that anonymous sites expire in 24 h.
   **Keep Stitch out of the agenda** — it is a 40 s+ provider call with its own model quirks.

### Measured on the local stack

Run on this repo's dev stack with `deepseek-v4.1-flash:1017` (2026-10-26): Research over an Idea
**31.6 s** / 5.9k tokens; PRD over that Research **24.1 s** / 7.7k tokens; a Code prototype from a
description **12.0 s** / 4.3k tokens (Sandpack bundling adds a few seconds); the UI Design two-step
brief→page **7.6 s** / 3.2k tokens (860-character brief). Treat those as the pacing baseline: a
laptop that is also screen-sharing will be slower, and a cold model adds ~10–30 s to the first run.

### Talking points that work in every demo

- **The route is the story.** Click any box: its incoming/outgoing lines light up, unrelated lines
  recede, and the station codes (`IDEA-01`, `RES-01`, …) show where an artifact came from.
- **Provenance is visible.** Every AI box shows `in · out · total tok` after a run — "you can see
  what each step cost, on the box".
- **Everything is ordinary.** Boxes the Agent creates, SDLC versions, generated code — all editable,
  rerunnable and saveable. Nothing is a black box.
- **Offline-ish, private by default.** Prompts run through your own Ollama on this machine; boards
  are persisted to your Firebase project, not a model vendor.

---

## Demo 0 — Team warm-up (4 minutes)

**Shows:** a shared board, live collaboration and a companion that can read the room's work.
**Boxes:** Note, Checklist, Timer, Chatbot — all in the palette, no AI runs needed (the chatbot is
one small model call).

1. New board named after the workshop day. Add a **Note** (Collaboration section) and type the agenda:
   `1) intros  2) the problem  3) build  4) demo at 15:30`.
2. Add a **Checklist** (Collaboration section) and paste this into its **add field** — one paste,
   every line becomes a task:
   ```
   - [ ] Pick a team name
   - [ ] Agree the problem statement
   - [ ] Build the first box
   - [ ] Demo to the room
   ```
3. Add a **Timer** (Collaboration section), set it to `10:00` and press **Start**. Point out that
   every person on the board sees the same countdown because only state changes sync — the ticking
   itself is local.
4. Add the **Chatbot** (Companions section) — a stick figure stands at the bottom-centre of the
   view. Click the figure, then ask:
   ```
   What's on this board? What should we do first?
   ```
   It answers from a live snapshot of the boxes. Rename it (title at the top of the panel) and give
   it a personality (🧠) if you want a second laugh.
5. If you have a second window (same board URL in another browser window or another signed-in
   user), type in the Note and show the change land live, and tick a checklist item — the row shows
   `✓ <name>` attribution.

**If it stalls:** the Chatbot needs the local model; everything else is instant and offline-safe.

---

## Demo 1 — One idea, four boxes (8 minutes) · the headline

**Shows:** the full idea → artifact pipeline, routes, token provenance and a live prototype.
**Boxes:** Idea, Research, PRD, Code. **Runs:** 3.

1. Add an **Idea** (Inputs) and paste:
   ```
   A weeknight dinner planner for a family of four: decide the week's meals on Sunday, one shared shopping list, and a reshuffle button when plans change.
   ```
2. Add a **Research** (Workers). Connect them: hover the Idea box, drag from the small dot on its
   **right edge** to the dot on the **left edge** of the Research box. The route draws with an elbow
   and a station knot. Press **▶ Run** on Research.
   → In ~30 s it fills with Markdown: findings, context, risks.
3. Add a **PRD** (Workers) and connect **Research → PRD**. Run it.
   → In ~25 s: overview, problem, users, P0/P1/P2 features, user stories, metrics.
4. Add a **Code** (Workers) and connect **PRD → Code**. Run it.
   → In ~15–45 s the box shows **Code / Preview**, and the preview renders a real interactive
   React prototype after Sandpack finishes bundling (a few seconds; it needs internet — see the
   fallback note below). **Maximise** opens code + preview side by side.
5. (Optional, 60 s) In the Code box's **"Request a change…"** field type
   `Make the headings calmer and add a reshuffle button to the meal list.` → **Apply change**.
   Show the diff and the `v2` version badge: the previous code is still there under 🕘 history, and
   ↩ Revert is one click.

**Talk track while it runs:** "Four boxes, three runs, about 90 seconds of model time. Every arrow is a
real hand-off — the PRD literally received the research text, and you can open any box and read
exactly what it got." Click the selected route to show focus/dimming.

**Variations:** swap the Code box for **UI Design** to get a single HTML page instead of a React
prototype (Demo 3); put a **Dev Plan** between PRD and Code for a tidier build; press **💾 Save** on
Research or PRD to hand the audience a real Markdown file.

**If it stalls:** if Code reports the reply was incomplete, run it again (local models occasionally
drop the render call); the box keeps working. Don't run Research and PRD simultaneously.
**Code's Preview is the only part of this demo that needs the internet** — Sandpack loads its
bundler from `codesandbox.io`. Check it once on the demo network. If it spins, show the **Code**
tab instead ("here is the actual JSX"), press **Open in StackBlitz**, or switch the finale to
**Demo 3** — UI Design previews a self-contained local page, no external service.

---

## Demo 2 — A pitch deck in three boxes (5 minutes)

**Shows:** structured JSON output rendered as a navigable deck. **Boxes:** Idea, Research, Slides.
**Runs:** 2 (+1 if you regenerate).

1. Add an **Idea** and paste a startup framing (the Slides prompt expects a pitch):
   ```
   A subscription app that turns a family's weeknight dinners into one shared shopping list, with a one-tap reshuffle when plans change.
   ```
2. Add **Research**, connect **Idea → Research**, **▶ Run** (~20–40 s).
3. Add **Slides**, connect **Research → Slides**, **▶ Run** (~40–90 s).
   → The box becomes a deck: title bar, 3–5 bullets, speaker notes, `1 / 10` navigation.
4. Flip through two slides with the arrows, then press **💾 Save** — it downloads a Markdown deck
   (`slides.md`) with titles, bullets and notes.
5. Optionally open **⚙** on Slides and point at the prompt: the slide structure (Problem, Solution,
   Market, …) is editable text, not code — "the deck format is a prompt you own".

**Variation:** change the Idea to a product feature request and edit the Slides prompt's slide list
to `Problem / What we built / How it works / Metrics / Ask` before running — the demo doubles as
"bring your own deck template".

**If it stalls:** Slides must return only a JSON array; a malformed reply is reported as an error
rather than a broken deck. Hit Run again.

---

## Demo 3 — A designed page in one box (4 minutes)

**Shows:** the two-step UI Design pipeline — brief, then one self-contained HTML page.
**Boxes:** UI Design (optionally an Idea or Research upstream). **Runs:** 1.

1. Add a **UI Design** (Workers). Paste into its description:
   ```
   A calm weekly meal-planning page for a family: this week's dinners as a list, a shared shopping list, and one reshuffle action.
   ```
2. **▶ Run.** It simplifies the request into a ~160-word design brief, then builds the page. On the
   local stack this is **under 10 s** (the box turns the model's reasoning pass off for this
   workflow — that's the speed trick).
3. The box shows **Preview** with a real page. Click **Code** to show it is one plain HTML file —
   inline styles, no framework, no build step. Switch to **Maximise** for a bigger view.
4. (Optional) In **"Request a change…"**:
   `Use a deep pine header with one marigold primary button, and make the dinner list feel like a timetable.`
   → **Apply change** → show the new version and the diff.
5. (Optional finale) **Deploy** (in the box's **Live site** strip) → a live `https://…here.now/`
   URL in ~10 s. Say the honest bit:
   anonymous sites expire in 24 h; with a key they're permanent.

**Variation:** connect a **Research** box upstream first — UI Design reads the connected research
and still simplifies it, which is the story: "it does not try to design from a wall of text."

**If it stalls:** the preview is sandboxed; a full HTML document previews verbatim, a legacy
React-based generation is wrapped automatically. If the preview is blank after Apply change, open
🕘 history and revert — the old page is intact.

---

## Demo 4 — Read a repo, then change it safely (8 minutes)

**Shows:** repo orientation and a change set the audience can trust. **Boxes:** Code Map, Code
Edit. **Runs:** 2–3 model calls plus GitHub reads server-side.

> Public repositories need no setup. For a private repo, put `GITHUB_TOKEN=…` in `server/.env` and
> restart — the browser never talks to GitHub itself.

1. Add a **Code Map** (Workers). In its **Repository** field paste a small public repo:
   ```
   github.com/octocat/Hello-World
   ```
   **▶ Run** (~30–60 s). The box records what was read (`repo@branch · N files of M · chars · when`)
   and writes the brief: what it is, entry points, structure, risks, where to start reading.
   Point at the provenance line: "it tells you what it actually opened, and it is not allowed to
   pretend it read something it didn't."
2. Add a **Code Edit** (Workers). Repository:
   ```
   github.com/octocat/Hello-World
   ```
   Change request:
   ```
   Add a short "Usage" section to the README explaining how to copy the project and run it, and keep the existing heading.
   ```
   (Optionally list `README` in **Files to change** — otherwise it triages the repo tree itself.)
   **▶ Run** (~40–90 s).
3. The panel shows the proposed **whole-file** change, `+added −removed`, a diff view, and a per-file
   editor. The key line for the audience: **"the model never writes the diff — the app computes it,
   so the patch is exactly what you reviewed."**
4. **💾 Save** downloads `code-changes.patch`. In a terminal:
   ```bash
   git apply --check code-changes.patch
   ```
   Nothing was pushed, no branch, no token — the repo is untouched.
5. (Optional) For a bigger repo (e.g. `github.com/chalk/chalk`), show the triage step: it names the
   files that matter, reads them in full, and refuses to edit a file it could only partially read.

**Variation:** connect an **SDLC Plan** upstream and Code Edit takes its file list from the plan —
a good bridge into Demo 5.

**If it stalls:** "repository not read" is an honest, designed state (bad URL, private repo, rate
limit) — the demo becomes "it says what it couldn't do" rather than a failure. Check the URL is
`github.com/owner/repo`, not a deep link to a file.

---

## Demo 5 — The gated pipeline (10 minutes)

**Shows:** human approval as a product feature — nothing advances until a person signs off.
**Boxes:** 1 · Intent, 2 · Spec, 3 · Plan (SDLC section). **Runs:** 3 (+1 for the version loop).

1. Add **1 · Intent** and paste the change request:
   ```
   Add a "Reshuffle week" action to the meal planner. It should suggest a new set of dinners while keeping the shopping list in sync, and explain what changed.
   ```
   **▶ Run** (~40–70 s). The artifact has a problem/outcome section and a list of **open questions**
   — the model is required to keep every unresolved question visible instead of guessing.
2. Point at the gate bar: `Awaiting approval (v1)`. Show the ⚙ toggle is **disabled** with
   "Stage 1 (Intent) is always a hard gate", then press **Approve**. The badge records who
   approved which version and when — that is the audit trail.
3. Add **2 · Spec**, connect **Intent → Spec**, **▶ Run**. Each open question becomes a
   `### Decision N`. If anything is still unresolved the gate says so and **stays gated** — the app
   counts the items itself; the model isn't trusted with that. Approve when you're happy.
4. Add **3 · Plan**, connect **Spec → Plan**, **▶ Run**. The plan must name a test per spec decision;
   the app cross-checks that and forces the gate if a decision has no test. Open the generated plan
   and read out one `Decision → test` pair.
5. Show the trust loop: on Intent press **Request changes**, type
   `Make the reshuffle explain which dinners changed and why.` and press **Send back** → **▶ Run**
   again → it adds `v2`; any downstream **approved** stage flips to `↻ stale` because its approval
   referred to an older artifact. Approvals never silently carry over.
6. **🗂 Audit** downloads the whole chain — artifacts, versions, approvals (who/when), findings —
   as one Markdown document, with a JSON appendix. That's the artifact you hand to an auditor.

**Talk track:** "The whiteboard cannot run your CI or merge a PR — and it doesn't claim to. It
produces the record a human merges, with every decision traceable to a person and a version."

**If it stalls:** Run refused with `🔒 … is not approved` is the feature, not an error — approve the
upstream stage (or connect the boxes in stage order). Non-SDLC boxes never block anything.

---

## Demo 6 — Agent: one prompt, a whole pipeline (6 minutes)

**Shows:** the board as an agent workspace. **Boxes:** Agent only. **Runs:** many small ones.

1. Add an **Agent** (Workers, first row). Paste the task:
   ```
   Research the idea of a weeknight dinner planner for busy families and write a PRD for it. Keep it focused: one research box and one PRD box, then summarise the result.
   ```
2. **▶ Run.** Watch the live step timeline in the box: `Plan the pipeline` → `Add Research` →
   `Connect` → `Run Research` → `Add PRD` … The boxes it creates are ordinary boxes on the canvas —
   select them, rerun them, edit them.
3. When it finishes, read the final answer, then take over: open the Research box it made and press
   Run yourself to prove it's just a normal box.
4. **⏹ Stop** is cooperative — it halts the loop between turns; an in-flight model call finishes
   first. Show it as the safety valve.

**Caveat to say out loud:** the controller is only as good as the local model's JSON discipline.
It retries and degrades to an honest answer rather than hanging, but two runs can look different.
For a scripted demo, rehearse once; for a mixed audience, Demo 1 is the reliable version of the
same story.

**If it stalls:** if the model produces unparseable actions twice it is coached, then the raw reply
is kept as the answer — rerun with a shorter, more explicit task.

---

## Copy-paste card

Everything you need to paste, in one place.

```
— Demo 0 —
Agenda:   1) intros  2) the problem  3) build  4) demo at 15:30
Checklist:
- [ ] Pick a team name
- [ ] Agree the problem statement
- [ ] Build the first box
- [ ] Demo to the room

— Demo 1 —
Idea:     A weeknight dinner planner for a family of four: decide the week's meals on Sunday, one shared shopping list, and a reshuffle button when plans change.
Change:   Make the headings calmer and add a reshuffle button to the meal list.

— Demo 2 —
Idea:     A subscription app that turns a family's weeknight dinners into one shared shopping list, with a one-tap reshuffle when plans change.

— Demo 3 —
UI:       A calm weekly meal-planning page for a family: this week's dinners as a list, a shared shopping list, and one reshuffle action.
Change:   Use a deep pine header with one marigold primary button, and make the dinner list feel like a timetable.

— Demo 4 —
Repo:     github.com/octocat/Hello-World
Change:   Add a short "Usage" section to the README explaining how to copy the project and run it, and keep the existing heading.

— Demo 5 —
Intent:   Add a "Reshuffle week" action to the meal planner. It should suggest a new set of dinners while keeping the shopping list in sync, and explain what changed.
Changes:  Make the reshuffle explain which dinners changed and why.

— Demo 6 —
Agent:    Research the idea of a weeknight dinner planner for busy families and write a PRD for it. Keep it focused: one research box and one PRD box, then summarise the result.
```

---

## Troubleshooting while people are watching

| Symptom | What it means | What to do |
|---|---|---|
| **▶ Run** is disabled and a `🔒 … not approved` message shows | An SDLC stage upstream hasn't been approved for its latest version | Approve the upstream stage (**Approve**), or connect stages in order |
| Run does nothing / spins forever | The API or Ollama isn't up | `curl -s localhost:3001/api/health`; check the `npm run dev` terminal; warm the model again |
| `Request failed` / timeout | Provider took too long or the call was interrupted | Rerun that box; don't queue three runs at once |
| Box says **run interrupted** after a reload | A run only exists while the page that started it is alive | Press Run again — nothing is lost |
| **Preview** is a spinner | UI/HTML preview warming up, or Sandpack can't reach `codesandbox.io` | Wait ~10 s; for Code, check the network or show the **Code** tab / **Maximise**; UI Design previews locally |
| **SAVE FAILED** in the pine bar | The board can't reach Firestore (expired sign-in / offline) | Runs still work; sign in again to sync. Don't start a demo while it's showing |
| Code Map says the repository was **not read** | Bad/private URL or GitHub rate limit | Public `github.com/owner/repo` only; add `GITHUB_TOKEN` for private repos |
| Slides box shows an error instead of a deck | Model returned non-JSON | Rerun; the box reports it instead of rendering a broken deck |
| Output looks thin/lazy | Cold model or a weak local model | Warm it, rerun, or switch `OLLAMA_MODEL` in `server/.env` |
| Agent wanders off task | The controller model isn't following the JSON protocol | Stop it, shorten the task, or demo Demo 1 instead |

---

## Keeping the demos current

### Verify them in code (no model calls, a few seconds)

`client/demo-scripts.mjs` is the executable twin of this file: for every demo it builds the same
board, with the guide's box types and wiring, and asserts the outcome the guide promises.

```bash
cd client
node demo-scripts.mjs        # all seven demos — 40 checks
node demo-scripts.mjs 3      # one demo
node demo-scripts.mjs 1,4    # a subset
```

It drives the real dev app on `localhost:5173` (so `npm run dev` must be up) and mocks
`/api/generate` + `/api/repo-digest` at the page level — **no Ollama, no GitHub, no Firebase, no
keys**, and it costs nothing to run before a session. What it proves, per demo:

| Demo | Checks |
|---|---|
| 0 | a pasted list becomes four checklist rows; the timer starts and shares its start time; the Chatbot replies from the board snapshot |
| 1 | Idea text reaches Research; Research → PRD → Code; the prototype is complete (App + mount); tokens recorded; Apply change appends v2; `research.md` downloads |
| 2 | a 10-slide deck renders with notes and saves as `slides.md` |
| 3 | a design brief is written first, then ONE self-contained HTML page; the local preview renders it; Apply change makes v2 |
| 4 | Code Map records what it read; Code Edit's change set and app-computed diff; the saved `.patch` passes **`git apply --check`** in a temp repo |
| 5 | Intent's open questions + hard gate; Approve records who/when; Spec's unresolved item forces its gate; Plan's missing-test gap; v2 makes downstream approvals stale; Audit exports the chain |
| 6 | the Agent finishes, its steps are logged, and the boxes it created/ran are ordinary boxes |

When you change a demo (a box renamed, a step reordered, a prompt replaced), update the matching
assertion in the same change — the check name tells you which promise broke
(`DEMO4-8 the downloaded patch passes git apply --check`).

Deliberately **not** rehearsed there, because other suites own them: live model latency and token
counts (measured numbers above and in `docs/DEVLOG.md`), Sandpack's code preview (needs
`codesandbox.io`), here.now deploys (`client/ui-smoke.mjs` DP checks) and real cross-user
collaboration (`client/e2e.mjs`).

### Re-use the boards without code: templates + teams

There is no board import/export or "duplicate", so the re-usable form of a demo is a facilitator
**template board**: build each demo once, then copy it per team. This path uses Firebase (templates,
teams and guest seat codes are cloud features) while the demos themselves stay local.

1. **Get the facilitator role once.** An admin grants it with `POST /api/admin/roles` on the
   *deployed* Function (the local server answers `501`); the header then shows **🧑‍🏫 Facilitator**.
2. **Open Facilitator → Templates.** Type a name — `Demo 1 — Weeknight dinner planner` — and press
   **Create & open**. That creates an ordinary board flagged as a template; templates are hidden
   from the normal **Boards** list.
3. **Build the demo on that board** exactly as this guide describes, then leave it saved (boards
   auto-save). One template per demo keeps the set tidy; `Open` re-opens it, `Unlist` turns it back
   into a regular board, `Delete` removes it.
4. **Run a session:** Facilitator → **Workshops** → name + **Create**. Then → **Teams**, pick the
   workshop, pick the template, name the team, press **Create team**. That copies the template into
   a fresh team board with **5 seat codes** — the template stays pristine.
5. **Hand out seat codes.** Participants open the landing page → **Join my team** → enter the code
   → pick a name. Each team works on its own copy; you can watch every team board from Teams.
6. **Next session:** same template, new team names. Edits to a template do **not** flow into teams
   that already exist (they are copies), so fix the template before creating teams.

## After the demo

- Keep the boards: they're ordinary boards in the **Boards (N)** menu (rename one "Demo — dinner
  planner" so it's easy to find), and they double as templates for the next session.
- Clean up throwaway boxes (✕ on the box header) rather than clearing the board.
- If you published a site, remember the claim link is shown once (🔑 toggle in the box) and
  anonymous sites expire in 24 h.
- Want the same workflow for a cohort? See *Re-use the boards without code* above: a facilitator
  template board copies into one team board per team, so the rehearsed demo becomes everyone's
  starting point.
