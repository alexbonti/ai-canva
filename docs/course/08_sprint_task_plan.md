# Sprint Task Plan — Assigning Tasks to the Students

> **Course:** AI-Assisted Software Project
> **Who this is for:** the instructor / facilitator handing out and tracking the work
> **Covers:** the five project tracks — the individual capstone (`02`) and the four group briefs (`03`, `04`, `06`, `07`)
> **How to use it:** every task table below has a matching **paste-ready Checklist block** (§5) that goes
> straight into a Checklist box on the team's board, so students see, own, tick and get credited for their tasks.

---

## 1. The five project tracks

| Track | Brief | Mode | Work shape | Where the tasks come from |
|-------|-------|------|-----------|---------------------------|
| 🧑‍🎓 **One Student, One Box** | `individual-project/brief.md` | Individual | 1 box per student + a 2,000–2,500 word research report | Its own folder: `individual-project/sprint-tasks.md` (3-week sprint, 30 h) |
| 🛡️ **Cybersecurity & Compliance** | `03_cyber_group_brief.md` | Group (4–5) | ≥3 boxes (one per role: design / check / assistant) + 3,000–4,000 word report | 3 sprints, 8 weeks |
| 🩺 **UX Support Tool (Telstra Health)** | `04_ux_health_group_brief.md` | Group (4) | ≥3 boxes (design / check / assistant) + team report | 3 sprints, 8 weeks |
| 💡 **Telstra Innovation Lab** | `06_telstra_innovation_brief.md` | Group (4) | ≥3 boxes (design / check / assistant) + team report | 3 sprints, 8 weeks |
| 🤝 **NBN Collaboration Tool** | `07_nbn_collab_brief.md` | Group (4) | ≥3 boxes (author / review / assistant) + team report | 3 sprints, 8 weeks |

**Group sprint spine (all four group briefs):** Sprint 1 = Weeks 1–2 (20 hrs/student) · Sprint 2 = Weeks 3–5
(30 hrs/student) · Sprint 3 = Weeks 6–8 (30 hrs/student). Each student is budgeted **10 hrs/week**.

> ⚠️ **Timeline discrepancy to settle before you hand this out:** the individual brief ends at **Week 10**
> (M5, mega-pipeline) while the intro message says *"3 sprints (8 weeks)"*. Decide which is authoritative
> and fix whichever doc is wrong — students get confused when the two disagree.

---

## 2. How to actually give the tasks to students

Pick one route, or both:

| Route | What the student sees | Tracking you get |
|-------|----------------------|------------------|
| **A. In-app Checklist** (recommended) | The task list on their team board, live, shared with the whole team | Per-task tick, who ticked it and when, assignee, progress bar |
| **B. Printed / HTML handout** | This plan's per-track tables, as a PDF/print-out | Nothing automatic — collect it in class |
| **C. Both** | Checklist for tracking + handout for the briefing | Best: they read the *why* on paper, tick the *what* in the app |

### 2.1 Route A — set up the team boards (facilitator path)

You need an account that is **admin or facilitator** (grant it from the Admin board, or
`POST /api/admin/roles`). Once granted, the header shows the **🧑‍🏫 Facilitator** button.

1. **Create one template board per track.** Header → *Facilitator* → **Templates** tab → create a
   template board per track (e.g. *"Cyber — Sprint tasks"*). Templates stay out of the normal board list.
2. **Add the task list to the template.** Open the template board → **+ Add Box** → **Collaboration** →
   **Checklist**. In the box's **Add a task…** field, paste that track's block from §5 — a multi-line
   paste becomes one task per line, keeping `- [x]` marks if you paste them.
3. **Create the workshop.** *Facilitator* → **Workshops** tab → new workshop for the class.
4. **Create one team per student team.** *Facilitator* → **Teams** tab → create the team from the
   track's template. Each team gets its own **copy** of the board (so Team A's ticks never touch
   Team B's) plus a **per-seat join code**.
5. **Hand each team its join code** (one code per seat, up to 5 seats).
6. **Students join:** landing page → **🎟️ Have a workshop code?** → paste the code → pick a name
   (**and an email — see the caveat below**) → **Join my team** → their team board opens with the
   checklist already on it.
7. **Run it from the board each day:** students tick tasks off, rename a task by clicking its text,
   pick an owner in the **＋ assign** dropdown, reorder with ▲▼, and **📋 Copy** exports the list as a
   Markdown checklist (that export is exactly the *"evidence of collaboration / task tracking"* the
   group briefs' teamwork mark asks for). **🧹 Clear done** at a sprint boundary if you want a clean
   board for the next sprint.

> **Local vs deployed:** granting the facilitator role (`POST /api/admin/roles`) needs the Firebase
> Admin SDK, so it returns **501 on the local dev server** — do it from the deployed site (or the
> Firebase console). Guest joining *does* work on `localhost`: the dev server proxies
> `/api/workshop/join` to the deployed function, so you can rehearse the whole flow locally.

### 2.2 What the app does and doesn't do (verified against the code)

- The list is **shared and live** — one list per Checklist box, everyone on the board sees the same
  tasks; writes are last-write-wins, like a Note.
- A tick records **who** ticked it and **when** (`✓ alice` next to the task), and a **progress bar**
  shows *"2 of 5 done"*. Good enough to grade the *task tracking* part of the teamwork mark.
- **Caps:** max **200 tasks per board**, **500 characters per task** — keep a sprint's list to ~20–25
  tasks and clear finished ones between sprints.
- **Guest caveat (matters for workshop students):** the **＋ assign** dropdown and the `✓ name`
  attribution are email-based (board owner + collaborators + people currently on the board). A student
  who joins with a **seat code** has no auth email, so:
  - their tick shows **no name**, and
  - they only appear as an assignable person **if they typed an email** at the profile step (that email
    is stored on the board's collaborator list; it is never used to log them in).
  Students who sign in with a **Google account** have none of these limits. If you want seat-code guests
  to be properly assignable and credited, that needs a small code change (use the guest's uid + chosen
  name for checklist identity) — ask for it and it's a contained fix.
- The Checklist box is a **collaboration box**: no AI, no Run button, no connectors. It's a to-do list
  that lives on the board, nothing more.

---

## 3. Individual project — its own folder

The individual **"One Student, One Box"** project has moved out of this course-wide handout into its own
folder, so there is exactly one place for its brief and its tasks:

- **Brief:** `individual-project/brief.md` (+ the print handout `brief.html`)
- **Step-by-step workbook:** `individual-project/sdlc-step-by-step.md` — the same project in classic SDLC
  order (study the problem → design the solution → implement → test, including user testing), 34 tasks with
  "done when" checks and the ✍️ sections where the student records their research, diagrams, prompts, test
  results and reflection (`sdlc-step-by-step.html` is the fillable, autosaving version)
- **Sprint tasks:** `individual-project/sprint-tasks.md` — a **3-week sprint (30 h)** cut week by week, with
  Wednesday checkpoints, Friday deliverables and paste-ready Checklist blocks
- **Index:** `individual-project/README.md`

Everything below (§4 onwards) is the **group tracks** (cyber, UX/Telstra Health, Telstra Innovation, NBN).

---

## 4. Group tracks — sprint tasks by role

All four group briefs share the same spine and the same rubric shape (**Build 40% · Research & Design 40%
· Teamwork & Demo 20%**). Roles differ per track; the *pattern* is identical: **author → check → guide**.

| Sprint | Weeks | Hrs/student | Exit criterion (from the briefs) |
|--------|-------|-------------|----------------------------------|
| **Sprint 1** — Research & scaffold | 1–2 | 20 | A clear plan and a scaffolded repo |
| **Sprint 2** — Main build | 3–5 | 30 | A working tool with all boxes chaining |
| **Sprint 3** — Finish, report & demo | 6–8 | 30 | Final report + live demo + evidence of collaboration |

### 4.1 Sprint 1 — every track (same tasks, role-owned)

| ID | Task | Owner | Due | Done when |
|----|------|-------|-----|-----------|
| S1-01 | Read your brief + `01_what_is_ai_canva.md` + `05_how_to_build_a_box.md`; get `npm run dev` working | **All** | Wk 1 | Every member can add a box and ▶ Run it locally |
| S1-02 | Lock team roles and write each role's owner + weekly availability on the board | **All** | Wk 1 | Role table filled in with real names; nobody owns two roles silently |
| S1-03 | Choose your **3+ boxes (one per role)** and draw the demo pipeline on the team board | **All** | Wk 2 | Pipeline drawn (boxes + edges) and the box list agreed |
| S1-04 | Register the chosen boxes in `types.ts` with draft prompts | **Dev** (others review) | Wk 2 | Boxes show up in the palette; PR open with the entries |
| S1-05 | Research question + 3 sources **per member** | **All** | Wk 2 | 12+ sources collected into the report's shared reference list |
| S1-06 | Sprint 1 demo: walk through the plan + the scaffolded repo (15 min) | **All** | Wk 2 | Facilitator signs off on the plan and the pipeline |
| S1-07 | **UX:** sketch the canvas/box experience — how a non-expert navigates and where each box's output shows | UX | Wk 2 | 2–3 sketched screens or a wireframe set on the board |
| S1-08 | **BA:** requirements doc skeleton + map each user need to a chosen box | BA | Wk 2 | Requirements doc started, traceable need → box |
| S1-09 | **Dev:** branch/PR workflow set up + backend running locally (model env documented) | Dev | Wk 2 | Each dev can push a branch and run a prompt through the local API |
| S1-10 | **Domain:** shortlist the frameworks/standards the *check* boxes must cite + the guardrails list | Domain | Wk 2 | Frameworks named per check box; "what the tool must never claim" written down |

**The Domain task, per track** (this is where the four briefs differ):

| Track | Domain role | Frameworks / standards to shortlist in S1-10 |
|-------|-------------|---------------------------------------------|
| 🛡️ Cyber | Cybersecurity | NIST CSF / 800-30 / 800-53, ISO 27001, OWASP ASVS + Top 10, GDPR, STRIDE, FAIR |
| 🩺 UX (Telstra Health) | Health/Domain Expert | Nielsen's 10 heuristics, WCAG 2.2, cognitive load / COGA, patient-safety review, Australian health regulation & privacy |
| 💡 Telstra Innovation | Domain/Business Expert | JTBD, RICE/ICE scoring, The Mom Test, feasibility & build-vs-buy, pre-mortems, FTO/IP basics |
| 🤝 NBN | 4th non-technical (Product/Content/Research) | User stories + INVEST, WCAG 2.2 (POUR), plain-language/readability, requirements traceability, ubiquitous language |

### 4.2 Sprint 2 — the main build (all four tracks)

| ID | Task | Owner | Due | Done when |
|----|------|-------|-----|-----------|
| S2-01 | Implement the `runBox` branch for **box #1** end-to-end (inputs → model → usable output) | Dev | Wk 3 | Box #1 produces real output on demand |
| S2-02 | **Mid-sprint check:** at least one box fully working end-to-end | **All** | Wk 4 | Demonstrated to the facilitator, not just claimed |
| S2-03 | Implement the remaining boxes; wire the AI backend and output formatting | Dev | Wk 5 | Every chosen box runs and returns well-formed output |
| S2-04 | Box UI: output layout, empty/error states, and how the box reads at a glance | UX | Wk 5 | A teammate can use each box without being told how |
| S2-05 | Write the domain-research section of the team report (frameworks + why they matter) | BA | Wk 5 | Section drafted with citations |
| S2-06 | Verify each *check* box cites the right framework and states its limits | Domain | Wk 5 | No check box gives false assurance; limits written into the prompt/output |
| S2-07 | Build the full demo pipeline from the brief's §4 (the complete author → check → guide flow) | **All** | Wk 5 | The whole chain runs end-to-end on a real scenario |
| S2-08 | Sprint 2 demo + update the task board | **All** | Wk 5 | Working tool with all boxes chaining (sprint exit criterion) |

### 4.3 Sprint 3 — finish, report & demo (all four tracks)

| ID | Task | Owner | Due | Done when |
|----|------|-------|-----|-----------|
| S3-01 | Fix everything the Sprint 2 demo exposed; **freeze scope** (no new boxes after this) | **All** | Wk 6 | The tool is stable; the box list is fixed |
| S3-02 | Write the team report, 3,000–4,000 words, all 6 sections (problem, domain research, design rationale, alternatives, ethics & limits, team reflection) | **All** (BA leads) | Wk 7 | Report submitted with a real reference list |
| S3-03 | Collect **evidence of collaboration**: PRs, reviews, and this board's task history | **All** | Wk 7 | Exported checklist + PR links attached to the submission |
| S3-04 | Rehearse + polish the live demo on a real scenario (the brief's example use case) | UX (all rehearse) | Wk 8 | A full dry run with no fixes mid-demo |
| S3-05 | Final demo, report hand-in, completed task board | **All** | Wk 8 | Build + research + teamwork marks all have evidence |

---

## 5. Paste-ready Checklist blocks

Paste the whole block into a Checklist box's **Add a task…** field (a multi-line paste imports one task
per line). Each line is a self-contained task with its ID, owner and due week — students can rename, assign
and tick them in place. For **group** tracks use the Sprint 1 block of that track, then paste §4.2's block
at the Sprint 2 boundary and §4.3's at the Sprint 3 boundary.

### 5.1 Individual project — see its own folder

The individual project's paste blocks live in `individual-project/sprint-tasks.md` §7 — one
block per week of its 3-week sprint. Use those; the blocks below are the **group** tracks.

### 5.2 Cybersecurity & Compliance — Sprint 1

```markdown
- [ ] CY-S1-01 (Wk1) Read the cyber brief + the two guides; get npm run dev working for every member
- [ ] CY-S1-02 (Wk1) Lock team roles (UX / BA / Dev / Cyber) and write each owner + availability on the board
- [ ] CY-S1-03 (Wk2) Choose 3+ boxes, one per role, and draw the design -> check -> assistant demo pipeline
- [ ] CY-S1-04 (Wk2) Dev: register the chosen boxes in types.ts with draft prompts (PR open)
- [ ] CY-S1-05 (Wk2) Everyone: research question + 3 sources per member into the shared reference list
- [ ] CY-S1-06 (Wk2) Sprint 1 demo: walk the plan + scaffolded repo, get facilitator sign-off
- [ ] CY-S1-07 (Wk2) UX: sketch how a non-expert navigates the tool and where each box's output shows
- [ ] CY-S1-08 (Wk2) BA: requirements doc skeleton, mapping each user need to a chosen box
- [ ] CY-S1-09 (Wk2) Dev: branch/PR workflow set up + backend running locally with the AI model wired
- [ ] CY-S1-10 (Wk2) Cyber: shortlist the frameworks (NIST CSF/800-30/800-53, ISO 27001, OWASP ASVS + Top 10, GDPR, STRIDE, FAIR) and write the guardrails list
```

### 5.3 UX Support Tool (Telstra Health) — Sprint 1

```markdown
- [ ] UXH-S1-01 (Wk1) Read the Telstra Health brief + the two guides; get npm run dev working for every member
- [ ] UXH-S1-02 (Wk1) Lock team roles (UX / BA / Dev / Health-Domain) and write each owner + availability on the board
- [ ] UXH-S1-03 (Wk2) Choose 3+ boxes, one per role, and draw the design -> check -> guide demo pipeline
- [ ] UXH-S1-04 (Wk2) Dev: register the chosen boxes in types.ts with draft prompts (PR open)
- [ ] UXH-S1-05 (Wk2) Everyone: research question + 3 sources per member into the shared reference list
- [ ] UXH-S1-06 (Wk2) Sprint 1 demo: walk the plan + scaffolded repo, get facilitator sign-off
- [ ] UXH-S1-07 (Wk2) UX: sketch how a senior designer navigates the tool and reads each box's output
- [ ] UXH-S1-08 (Wk2) BA: requirements doc skeleton for the design -> check pipeline
- [ ] UXH-S1-09 (Wk2) Dev: branch/PR workflow set up + backend running locally with the AI model wired
- [ ] UXH-S1-10 (Wk2) Health-Domain: shortlist the methods (Nielsen heuristics, WCAG 2.2, cognitive load/COGA, patient safety, Australian health regulation) and the guardrails list
```

### 5.4 Telstra Innovation Lab — Sprint 1

```markdown
- [ ] TI-S1-01 (Wk1) Read the Innovation Lab brief + the two guides; get npm run dev working for every member
- [ ] TI-S1-02 (Wk1) Lock team roles (UX / BA / Dev / Domain-Business) and write each owner + availability on the board
- [ ] TI-S1-03 (Wk2) Choose 3+ boxes, one per role, and draw the design -> check -> guide demo pipeline
- [ ] TI-S1-04 (Wk2) Dev: register the chosen boxes in types.ts with draft prompts (PR open)
- [ ] TI-S1-05 (Wk2) Everyone: research question + 3 sources per member into the shared reference list
- [ ] TI-S1-06 (Wk2) Sprint 1 demo: walk the plan + scaffolded repo, get facilitator sign-off
- [ ] TI-S1-07 (Wk2) UX: sketch the opportunity/scorecard visualisations and the canvas experience
- [ ] TI-S1-08 (Wk2) BA: market-research synthesis skeleton + the scorecard weighting you'll use
- [ ] TI-S1-09 (Wk2) Dev: branch/PR workflow set up + backend running locally with the AI model wired
- [ ] TI-S1-10 (Wk2) Domain-Business: shortlist the methods (JTBD, RICE/ICE, The Mom Test, feasibility & build-vs-buy, pre-mortems, FTO/IP basics) and the guardrails list
```

### 5.5 NBN Collaboration Tool — Sprint 1

```markdown
- [ ] NBN-S1-01 (Wk1) Read the NBN brief + the two guides; get npm run dev working for every member
- [ ] NBN-S1-02 (Wk1) Lock team roles (UX / BA / Dev / 4th non-technical) and write each owner + availability on the board
- [ ] NBN-S1-03 (Wk2) Choose 3+ boxes, one per role, and draw the author -> review -> hand-off demo pipeline
- [ ] NBN-S1-04 (Wk2) Dev: register the chosen boxes in types.ts with draft prompts (PR open)
- [ ] NBN-S1-05 (Wk2) Everyone: research question + 3 sources per member into the shared reference list
- [ ] NBN-S1-06 (Wk2) Sprint 1 demo: walk the plan + scaffolded repo, get facilitator sign-off
- [ ] NBN-S1-07 (Wk2) UX: sketch the artifact boxes (journey map, UX brief) and the canvas experience
- [ ] NBN-S1-08 (Wk2) BA: requirements skeleton (user stories + acceptance criteria) and the traceability view
- [ ] NBN-S1-09 (Wk2) Dev: branch/PR workflow set up + backend running locally with the AI model wired
- [ ] NBN-S1-10 (Wk2) 4th role: shortlist the methods (INVEST, WCAG 2.2 POUR, plain language/readability, alignment checks, ubiquitous language) and the guardrails list
```

### 5.6 Any group track — Sprint 2 (paste at the start of Week 3)

```markdown
- [ ] G-S2-01 (Wk3) Dev: implement the runBox branch for box #1 end-to-end (inputs -> model -> usable output)
- [ ] G-S2-02 (Wk4) MID-SPRINT CHECK: at least one box fully working end-to-end, demonstrated to the facilitator
- [ ] G-S2-03 (Wk5) Dev: implement the remaining boxes; wire the backend and the output formatting
- [ ] G-S2-04 (Wk5) UX: box UI — output layout, empty/error states, readable at a glance
- [ ] G-S2-05 (Wk5) BA: draft the domain-research section of the team report (frameworks + why they matter)
- [ ] G-S2-06 (Wk5) Domain: verify each check box cites the right framework and states its limits
- [ ] G-S2-07 (Wk5) All: build the full demo pipeline from the brief (author -> check -> guide)
- [ ] G-S2-08 (Wk5) All: sprint 2 demo + update the task board
```

### 5.7 Any group track — Sprint 3 (paste at the start of Week 6)

```markdown
- [ ] G-S3-01 (Wk6) All: fix everything the sprint-2 demo exposed; FREEZE SCOPE (no new boxes)
- [ ] G-S3-02 (Wk7) All (BA leads): write the team report, 3,000-4,000 words, all 6 sections
- [ ] G-S3-03 (Wk7) All: collect evidence of collaboration — PRs, reviews, and this board's task history
- [ ] G-S3-04 (Wk8) UX + all: rehearse and polish the live demo on the brief's real scenario
- [ ] G-S3-05 (Wk8) All: final demo, report hand-in, task board complete
```

---

## 6. Instructor's per-sprint routine

| When | What you do | Evidence you keep |
|------|-------------|-------------------|
| Start of sprint | Paste that sprint's block onto each team board and open the seats/codes | Board screenshots per team |
| Mid-sprint (S2 only) | Watch the **mid-sprint check**: one box running end-to-end | A note of who demoed what |
| End of sprint | 15-minute team demo, then **📋 Copy** the checklist before **🧹 Clear done** | The exported Markdown = their task-tracking evidence |
| Weekly | Skim each board: unassigned tasks and untouched lists are your early-warning signal | Assign-blockers list for the next class |
| Final | Collect report + repo PRs + demo recording | Rubric scores: Build / Research / Teamwork & Demo |

---

## 7. Notes that keep this honest

- **Tasks map to the briefs' own criteria** — no hidden extra marks. If you change a rubric, change the
  matching task row here too.
- **The board is the artefact.** A team that finishes the tool but leaves an empty checklist has no
  task-tracking evidence for the 20% teamwork mark; remind them that ticking is graded, not decorative.
- **Caps:** 200 tasks per Checklist box, 500 characters per task — clear done tasks between sprints so
  the board never fills up.
- **Guests:** seat-code students should type an **email** at the profile step, otherwise they can't be
  assigned tasks and their ticks are anonymous (see §2.2).
