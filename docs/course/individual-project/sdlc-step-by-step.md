# SDLC Step-by-Step Workbook — Build Your Box from Problem to Tested

> **Course:** AI-Assisted Software Project · **Project:** "One Student, One Box" (see `brief.md`)
> **Mode:** Individual — you own exactly **one** box
> **Four phases:** Study the problem → Design the solution → Implement the box → Test it
> **Budget:** 30 hours · **Weighting:** Research **70%** · Build **30%** (the demo is inside the build mark)
> **Assumes:** the app already runs on your machine — `npm run dev` works.
> **This is also your workbook:** every **✍️ Your work** section is yours to fill in — research, diagrams,
> prompts, test results, report drafts, reflection.

**Start here.** This document tells you **what to do and in what order** — and it is where you **write your
work**. You do not need to invent a process: follow the four phases, do the tasks, fill in the ✍️ sections.

| Document | What it gives you |
|----------|-------------------|
| `brief.md` | **What you are marked on** — the box menu, the deliverables, the rubric |
| `sdlc-step-by-step.md` *(this file)* | **The order of work + your workbook** — 4 phases, 34 tasks with "done when", and the ✍️ sections you fill in |
| `sprint-tasks.md` | **The 3-week schedule** — the same 30 hours cut into weeks with checkpoints and deadlines |
| `../05_how_to_build_a_box.md` | **The code, file by file** — how to add a box to AI Canva (used in Phase 3) |

**How to use it:** open your board → **+ Add Box → Collaboration → Checklist** → paste one phase block
(from §8) into **Add a task…**. Tick tasks as you finish them and tick as you go.

> **The one rule that matters:** **finish a phase before you start the next.** Students who skip Phase 1
> (the research) and start coding lose the 70% half of the mark. Coding is only 30%.

---

## How to use this workbook

**My name / student ID**

> ✍️ _Write here._

You have three ways to use it — pick one and stay with it:

| If you are… | Use | What happens to your answers |
|-------------|-----|------------------------------|
| Working in a **browser** | `sdlc-step-by-step.html` | Type straight into the grey boxes: they **save themselves in that browser** as you type, and **⬇ Download answers (.md)** gives you a Markdown file you can paste into your report |
| Working on **paper** | `sdlc-step-by-step.html` printed (🖨 Print / PDF) | Every ✍️ box prints as a blank space to write in |
| Working in the **repo** | `sdlc-step-by-step.md` | Edit the file and write under each ✍️ heading — your answers live with your code and go into the PR |

> ⚠️ **Autosave is per-browser, not a cloud.** Your answers live in that one browser on that one computer
> and are **not** shared with your instructor or your teammates. **Download the `.md` (or print the PDF) at
> the end of every session** — that file is your submission, and it is the only copy that survives a browser
> reset. Never clear your browser data without exporting first.

**Where your answers go** — each phase ends with a ✍️ section that collects that phase's evidence:

| Phase | ✍️ Section | What you record there |
|-------|-----------|------------------------|
| **1. Study the problem** | §2 → *Your work — Phase 1* | Box choice · problem statement · user + success criteria · research question · annotated bibliography (3 sources) · problem diagram · report §1–2 draft |
| **2. Design the solution** | §3 → *Your work — Phase 2* | Inputs/outputs · both prompts · the two design diagrams · guardrails · design-decisions table · build plan |
| **3. Implement the box** | §4 → *Your work — Phase 3* | Build record · branch + PR link · what broke and how you fixed it · demo evidence |
| **4. Test it** | §5 → *Your work — Phase 4* | Fixes after user testing · report §5–6 · reflection (the 6 scenarios and 3 user tests are recorded in §6) |
| **Hand-in** | §12 → *Submission* | Links to report, PR and board, plus the final checklist |

Your ✍️ answers **are** your report in pieces: §1–2 in Phase 1, §3–4 material in Phase 2, §5–6 in Phase 4.
Assemble them at the end — that is what makes the 70% research mark easy instead of a last-night panic.

---

## 1. The four phases at a glance

| Phase | The question it answers | What you produce | Hours | Lands in |
|-------|------------------------|------------------|-------|----------|
| **1. Study the problem** | What problem, for whom, and is it real? | Problem statement · research question · 3 annotated sources · problem diagram · report §1–2 draft | **9** | Week 1 |
| **2. Design the solution** | What exactly will the box do — and why this way? | Pipeline sketch · input/output table · prompt draft · 2 design diagrams · guardrails · design-decisions table | **6** | Week 1–2 |
| **3. Implement the box** | Does it actually work in AI Canva? | A registered box that runs, survives bad input, is clean, and is in a PR | **7** | Week 2 |
| **4. Test it** | Do **real users** get value from it? | Test log · 3 user tests · 2 fixes · report §5–6 · demo rehearsal | **8** | Week 3 |

**30 hours total.** Markers: 🔴 **must** · 🟡 **should** · 🔵 **stretch**.

```text
   PHASE 1            PHASE 2             PHASE 3            PHASE 4
 Study the   ──▶   Design the   ──▶   Implement the  ──▶   Test it
  problem           solution             box                (real users)
      │                 │                  │                   │
      └── report §1–2   └── report §3–4    └── the 30% build   └── report §5–6
                                                                   + demo
                          └────── every phase feeds the 70% report ──────┘
```

---

## 2. Phase 1 — Study the problem (9 h)

**Why this phase exists:** 70% of your mark is the research. Before you build anything, you must be able to
say — in one sentence — *who* has a problem, *what* goes wrong today, and *why* an AI box would help.

| ID | Task | Hrs | | Done when |
|----|------|-----|-|-----------|
| P1-01 | Read `brief.md` and the rubric end-to-end; note the 3 rubric rows you are weakest on | 1 | 🔴 | You can name your 3 weakest rubric rows |
| P1-02 | Shortlist 3 boxes from the brief's menu that fit a problem you actually care about; write a one-line research question for each | 1 | 🟡 | 3 candidate boxes, each with a one-line question |
| P1-03 | Lock **one** box and write the problem statement: who has the problem, what goes wrong today, why it matters | 1 | 🔴 | 3–5 sentences, written on your board where the instructor can read them |
| P1-04 | Find 3 credible sources; write a ~150-word annotated entry for each (what it says, why it matters to your question) | 3 | 🔴 | An annotated bibliography with 3 full references |
| P1-05 | Name your **user** and your 3 **success criteria** — what a "good output" must contain to be useful | 0.5 | 🔴 | One user + 3 criteria you can test against in Phase 4 |
| P1-06 | Draw the **problem diagram**: what happens today, step by step, without your box | 0.5 | 🔴 | One labelled diagram (see §7) |
| P1-07 | Write your research question as **one sentence** + the evidence that would answer it | 0.5 | 🟡 | A question in the "For [user]… does…" form (§7) |
| P1-08 | Write-up: report §1 (problem & motivation) + §2 (domain context), ~800 words, cited | 1.5 | 🟡 | Draft in your report, citations in the reference list |

**You hand in (Phase 1):** problem statement · research question · annotated bibliography (3 sources) ·
problem diagram · report §1–2 draft.

**Phase 1 is done when you can answer all four, in one sentence each:**

- [ ] Who is the user, and where do they hit the problem?
- [ ] What do they do today instead — and what is wrong with that?
- [ ] What would "better" look like, measurably? (your 3 success criteria)
- [ ] What is your research question, and what evidence would answer it?

### ✍️ Your work — Phase 1 (fill this in)

In the HTML workbook these are type-in boxes that save themselves as you type; on paper they are the space to
write. Write these as **proper sentences** — this section *is* your report §1–2, not notes to yourself.

**1. The box I chose** *(and why, in 1–2 lines)*

> ✍️ _Write here._

**2. Problem statement** *(3–5 sentences: who has the problem, what goes wrong today, why it matters)*

> ✍️ _Write here._

**3. My user** *(be specific — "a student with a rough project idea", not "users")*

> ✍️ _Write here._

**4. Success criteria** — how I will know a "good output" when I see one. Each one must be checkable in Phase 4.

| # | Criterion (what the output must contain or do) | How I will check it |
|---|-----------------------------------------------|---------------------|
| 1 | | |
| 2 | | |
| 3 | | |

**5. Research question** *(one sentence — use the form in §7)*

> ✍️ _Write here._

**6. The evidence that would answer it** *(what you would have to see to say yes, no, or mixed)*

> ✍️ _Write here._

**7. Annotated bibliography** — 3 credible sources, ~150 words each: what it says, and why it matters to *your*
question. (Add rows if you use more sources.)

| # | Full reference (author, year, title, source, link) | What it says + why it matters to my question |
|---|---------------------------------------------------|----------------------------------------------|
| 1 | | |
| 2 | | |
| 3 | | |

**8. Problem diagram** — what happens today, without your box. Draw it by hand and photograph it, or build it
on your AI Canva board and paste a screenshot.

> ✍️ _Diagram here — title · boxes = nouns · arrows = verbs, labelled · legend_

*(Caption — what this diagram shows:)*

> ✍️ _Write here._

**9. Report §1 — Problem & motivation** *(draft, ~400 words, with citations)*

> ✍️ _Write here._

**10. Report §2 — Domain context** *(draft, ~400 words, with citations)*

> ✍️ _Write here._

---

## 3. Phase 2 — Design the solution (6 h)

**Why this phase exists:** design is where the marks for *rationale* and *alternatives* (25% of the report)
are earned. It is also much cheaper to change a drawing than to change working code.

| ID | Task | Hrs | | Done when |
|----|------|-----|-|-----------|
| P2-01 | Sketch the demo pipeline on your board: 💡 Idea → **your box** → 🔍 Summarize, connected | 0.5 | 🔴 | 3 boxes and their edges on the canvas |
| P2-02 | Define the inputs and the output in a table: input name / where it comes from / which output section it feeds | 0.5 | 🔴 | A filled input–output table |
| P2-03 | Draft the `defaultPrompt` and `defaultSystemPrompt` using `{{inputs}}` / `{{input_1}}` / `{{Box Name}}` | 1 | 🔴 | Prompts readable by someone else; every variable explained |
| P2-04 | Draw **two design diagrams**: (a) the box in the pipeline, (b) the decision/data flow — input → prompt → model → output contract → guardrail → what the user sees | 1.5 | 🔴 | 2 labelled diagrams (§7) |
| P2-05 | Decide the **guardrails**: what the box must refuse, flag or warn about — and how the user sees it | 0.5 | 🔴 | A list of *trigger → what the box does → what the user sees* |
| P2-06 | Fill the **design-decisions table**: choice / why / what you rejected (this is report §3 + §4) | 1 | 🟡 | At least 4 rows, each with a rejected alternative |
| P2-07 | Plan the build: the exact files you will touch, in the order you will touch them | 0.5 | 🟡 | A 5-line build plan |
| P2-08 | Show your design to one classmate for a 5-minute sanity check | 0.5 | 🔵 | One thing you changed because of their question |

**You hand in (Phase 2):** the board with the demo pipeline · input/output table · prompt draft ·
2 design diagrams · guardrail list · design-decisions table · build plan.

**A design-decisions table looks like this** — it becomes report §3 and §4 almost word for word:

| Decision | What I chose | Why | What I rejected, and why |
|----------|--------------|-----|--------------------------|
| Output format | Fixed 4-section Markdown with a verdict line | Users must act on it in under a minute | Free-form prose — too hard to scan |
| Provider | The app's existing text model | One extra provider = one more failure point | A second model + a merge step — too complex for one box |
| No input | Refuse with a clear message | A blank answer looks like a bug | Letting the model guess — dishonest |

### ✍️ Your work — Phase 2 (fill this in)

**1. Inputs and outputs** — what goes in and what comes out. One row per input; start with the main one.

| Input (what it is) | Where it comes from (which box) | Which output section it feeds |
|--------------------|--------------------------------|-------------------------------|
| _e.g. the idea text_ | _💡 Idea box_ | _Verdict_ |
| | | |
| | | |

**2. My `defaultPrompt`** *(the final text, with `{{inputs}}` / `{{input_1}}` / `{{Box Name}}` where they belong)*

> ✍️ _Write here._

**3. My `defaultSystemPrompt`** *(the role, the tone, the rules it must follow)*

> ✍️ _Write here._

**4. Design diagram A — my box in the pipeline** *(draw it, or paste a screenshot of your board)*

> ✍️ _Diagram here — Idea → my box → Summarize, with the labels your users will see_

*(Caption:)*

> ✍️ _Write here._

**5. Design diagram B — the decision / data flow inside my box** *(input → prompt → model → output contract →
guardrail → what the user sees)*

> ✍️ _Diagram here_

*(Caption:)*

> ✍️ _Write here._

**6. My guardrails** — the box must not answer everything. One row per guardrail.

| Trigger (what goes wrong) | What the box does | What the user sees |
|---------------------------|-------------------|--------------------|
| _e.g. nothing connected_ | _refuses, does not call the model_ | _"Connect an Idea box first."_ |
| | | |
| | | |

**7. Design decisions** — at least 4 rows. This table becomes report §3 + §4, almost word for word.

| Decision | What I chose | Why | What I rejected, and why |
|----------|--------------|-----|--------------------------|
| | | | |
| | | | |
| | | | |
| | | | |

**8. Build plan** — the files I will touch, in the order I will touch them.

> ✍️ _Write here._

---

## 4. Phase 3 — Implement the box on AI Canva (7 h)

**Why this phase exists:** this is the 30% build mark. A box is **three touchpoints** in the code:
`types.ts` (it exists) · `runBox` in `boardStore.ts` (it runs) · optionally `BoxNode.tsx` (it looks good).
**The file-by-file code steps are in [`../05_how_to_build_a_box.md`](../05_how_to_build_a_box.md)** — keep it
open next to this page.

| ID | Task | Hrs | | Done when |
|----|------|-----|-|-----------|
| P3-01 | `git pull` on `main`, then create your branch `feature/<your-box>` — never work on `main` | 0.5 | 🔴 | `git status` is clean and you are on your branch |
| P3-02 | Register the box in `types.ts`: `BoxType` + a `BOX_TYPES` entry (label, icon, colour, category, both prompts) | 1 | 🔴 | The box appears in **+ Add Box** and drops onto the canvas |
| P3-03 | Wire the `runBox` branch: gather connected inputs → call the backend → shape the reply into your output format | 2 | 🔴 | ▶ Run produces real model output in the format you designed |
| P3-04 | Handle the empty-input and error paths so the box **never** shows a blank output | 1 | 🔴 | No input, and a forced error, both show a useful message |
| P3-05 | Run the demo pipeline end-to-end and fix what breaks | 1 | 🔴 | The pipeline runs with no manual fix-up |
| P3-06 | Clean the code: clear names, comments that explain *why*, no debug leftovers; commit in small chunks | 0.5 | 🟡 | The diff is small and readable by someone else |
| P3-07 | Open the PR: what changed, why, a screenshot of real output, the branch explained in 5 lines | 0.5 | 🟡 | The PR is readable by someone who has never seen your box |
| P3-08 | *Optional:* a custom render in `BoxNode.tsx` (score bars, cards, a verdict banner) | 0.5 | 🔵 | Someone can read the output at a glance without being told what it means |

**You hand in (Phase 3):** an open PR with the `types.ts` entry + the `runBox` branch · a screenshot of real
output · the working demo pipeline on your board.

> **Start plain, then decorate.** Get the text to work first (P3-02 → P3-05). Only then spend time on P3-08.
> A working simple box beats a broken clever one — that is the brief's own advice.

### ✍️ Your work — Phase 3 (fill this in)

**1. My branch** *(never work on `main`)*

> ✍️ _feature/…_

**2. Build record** — what I actually changed, file by file.

| File | What I changed there |
|------|----------------------|
| `client/src/types.ts` | |
| `client/src/store/boardStore.ts` | |
| | |
| | |

**3. What broke, and how I fixed it** — a failure you found and fixed is evidence of testing, not embarrassment.

| What went wrong | What I changed |
|-----------------|----------------|
| | |
| | |
| | |

**4. My PR** *(link)*

> ✍️ _Write here._

**5. Proof it works** *(where the screenshot / screen recording lives — or paste it here)*

> ✍️ _Write here._

---

## 5. Phase 4 — Test it: technical tests + user testing (8 h)

**Why this phase exists:** *you* know how your box is supposed to work — your users don't. Testing is where
you find out whether the box is actually usable, and it gives you the evidence for report §5 and §6.

There are **two kinds of testing**, and you must do both:

1. **Technical testing** (P4-01, P4-02) — does it survive bad input? Six scenarios in §6.
2. **User testing** (P4-03 → P4-06) — can three real people use it without you explaining it?

| ID | Task | Hrs | | Done when |
|----|------|-----|-|-----------|
| P4-01 | Technical self-test: run the **6 scenarios** in §6 and tick every one | 1 | 🔴 | All 6 run, and you wrote down what happened |
| P4-02 | Record every failure: what you saw, what you changed | 0.5 | 🔴 | A test log covering the failures you found |
| P4-03 | Write the **user-test plan**: 3 users, ONE realistic task, what you will watch, what counts as success | 0.5 | 🔴 | A one-page plan including the exact words you will say |
| P4-04 | Run **3 user sessions** (15–20 min each): say nothing, help only after 2 minutes of being stuck, take notes + exact quotes | 1.5 | 🔴 | Notes for U1, U2, U3 |
| P4-05 | Log the results in the user-test table (§6): what they did, where they hesitated, what they expected | 0.5 | 🔴 | The table filled in for 3 users |
| P4-06 | Fix the **top 2 problems** users hit, then re-test with at least 1 user | 1.5 | 🔴 | Before/after evidence for both fixes |
| P4-07 | Write-up: report §5 (ethics & limits) — include what users misunderstood and what the box must never be used for | 0.5 | 🟡 | Section drafted with your **own** test evidence |
| P4-08 | Write-up: report §6 — answer your research question, using your test results as evidence | 1 | 🟡 | A clear yes / no / mixed answer with evidence |
| P4-09 | Final check: your box runs inside the class **mega-pipeline**; clean diff; write the 200–300 word reflection | 0.5 | 🟡 | Box runs in the assembled class pipeline; reflection written |
| P4-10 | Rehearse the 5-minute demo once, end to end, with no fix-ups | 0.5 | 🔵 | One clean run-through |

**You hand in (Phase 4):** test log · 3 user-test records · 2 fixes with before/after · report §5–6 ·
reflection · a rehearsed demo.

> **Say this, then stop talking:** *"I'm testing the box, not you. There are no wrong answers — please think
> aloud as you go. I won't help unless you're stuck for two minutes."*
> Then watch and write. Every time you explain your box, you hide a bug from yourself.
>
> **Be fair to your users:** ask permission first, record results as **U1 / U2 / U3** (no real names), keep no
> personal data in your report, and delete any recordings when the project is marked.

### ✍️ Your work — Phase 4 (fill this in)

Fill the two tables in **§6** first — your **6 technical scenarios** (§6a) and your **3 user tests** (§6b) —
then complete the rest here.

**1. What I changed after user testing** — the top 2 problems users hit, and the before/after.

| Problem users hit (from §6b) | What I changed | Evidence it is better (re-test result) |
|------------------------------|----------------|----------------------------------------|
| | | |
| | | |

**2. Report §5 — Ethics & limits** *(draft: harms, bias, what the box must never be used for, what users
misunderstood)*

> ✍️ _Write here._

**3. Report §6 — My answer to the research question** *(restate the question, give a clear yes / no / mixed
answer, then the evidence from your own tests)*

> ✍️ _Write here._

**4. Reflection** *(200–300 words: what you learned, what the AI got right and wrong, what you would change)*

> ✍️ _Write here._

---

## 6. The test pack (copy these tables into your report)

### 6a. The 6 technical scenarios (P4-01)

| # | Scenario | What you do | Pass looks like |
|---|----------|-------------|-----------------|
| 1 | **Happy path** | An Idea box with a real input → ▶ Run | Output contains every section your design promised |
| 2 | **No input** | Run the box with nothing connected | A clear message — not a blank box, not a crash |
| 3 | **Huge input** | Paste a whole document (a few thousand words) | It still answers, or says it is too long — it never hangs |
| 4 | **Off-topic input** | Feed it something unrelated (e.g. a recipe) | It says it is out of scope, or handles it gracefully |
| 5 | **Two upstream boxes** | Connect a second input | Both inputs are used, and you can tell which is which |
| 6 | **Run twice** | Run, change the input, Run again | The output updates — no stale leftovers |

| # | Result (pass / fail) | What I saw | What I changed |
|---|----------------------|------------|----------------|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |
| 6 | | | |

### 6b. The user-test record (P4-04, P4-05)

The task you give the user: *"Here is an idea. Use this box, then tell me what you'd do next."*

| User | Finished the task? | Where they hesitated (what they said or did) | What they expected instead | What I changed |
|------|--------------------|---------------------------------------------|----------------------------|----------------|
| U1 | | | | |
| U2 | | | | |
| U3 | | | | |

**Count it as success only if** the user can use the box and act on the output **without you explaining
anything**. If you had to explain, write down the sentence you said — that sentence is your next fix (P4-06).

---

## 7. The three diagrams (and how to draw them simply)

You need **three diagrams** in total. Draw them on your **AI Canva board** (it is a whiteboard — boxes and
arrows *are* a diagram), or on paper and photograph them. One page each, maximum.

**Rules for every diagram:** a title · boxes are **nouns** · arrows are **verbs**, labelled · a legend if
you use colour · readable at a glance.

**1. Problem diagram (P1-06)** — what happens today, without your box:

```text
   TODAY (no box)                          WITH YOUR BOX
   ─────────────────                       ─────────────────
   idea in someone's head                  idea ──▶ [ YOUR BOX ] ──▶ a decision
        │                                                              they can act on
        ▼
   pasted into a general chatbot
        │
        ▼
   generic answer → they still don't know what to do
```

**2. Box flow diagram (P2-04a)** — where your box sits in a pipeline:

```text
   ┌──────────┐        ┌──────────────┐        ┌──────────────┐
   │ 💡 Idea  │ ─────▶ │  YOUR BOX    │ ─────▶ │ 🔍 Summarize │
   │ (input)  │        │ (does what?) │        │ (next step)  │
   └──────────┘        └──────────────┘        └──────────────┘
        user's            THE THING              proof it
        problem           YOU BUILD              composes
```

**3. Decision / data flow (P2-04b)** — what happens *inside* the box:

```text
   inputs ──▶ prompt template ──▶ model ──▶ output contract ──▶ guardrail ──▶ shown to user
   (which?)    (what it says)     (which?)   (exact format)      (what if    (where in
                                                                 it's wrong?) the box?)
```

**Your research question, in one sentence (P1-07)** — fill in the blanks:

> For **[user]** who **[situation]**, does **[your box's approach]** produce **[outcome]**, better than
> **[what they do today]**?

*Example:* "For **a student with a rough project idea** who **needs to know if it is worth pursuing**, does
**an LLM scoring it on desirability/feasibility/viability** produce **a judgement they trust**, better than
**asking a general chatbot for an opinion**?"

---

## 8. Paste-ready task blocks (one per phase)

Paste a whole block into a **Checklist box**'s **Add a task…** field on your board — a multi-line paste
imports one task per line. At the end of a phase: **📋 Copy** (that export is your evidence), then
**🧹 Clear done** and paste the next phase.

### Phase 1 — Study the problem

```markdown
- [ ] P1-01 (1h) Read brief.md + the rubric end-to-end; name your 3 weakest rubric rows
- [ ] P1-02 (1h) Shortlist 3 boxes you'd care about + a one-line research question for each
- [ ] P1-03 (1h) Lock ONE box + write the problem statement: who, what goes wrong today, why it matters
- [ ] P1-04 (3h) Find 3 credible sources + a ~150-word annotated entry for each
- [ ] P1-05 (0.5h) Name your user + 3 success criteria for a "good output"
- [ ] P1-06 (0.5h) Draw the problem diagram: what happens today without your box
- [ ] P1-07 (0.5h) Write the research question as ONE sentence + the evidence that would answer it
- [ ] P1-08 (1.5h) Write-up: report sections 1-2 (problem & motivation, domain context), ~800 words, cited
```

### Phase 2 — Design the solution

```markdown
- [ ] P2-01 (0.5h) Sketch the demo pipeline: Idea -> your box -> Summarize, connected
- [ ] P2-02 (0.5h) Define inputs + output: input name / where it comes from / which output section
- [ ] P2-03 (1h) Draft defaultPrompt + defaultSystemPrompt with {{inputs}} / {{input_1}} / {{Box Name}}
- [ ] P2-04 (1.5h) Draw 2 design diagrams: (a) the box in the pipeline, (b) the decision/data flow inside it
- [ ] P2-05 (0.5h) Decide the guardrails: trigger -> what the box does -> what the user sees
- [ ] P2-06 (1h) Fill the design-decisions table: choice / why / what you rejected (report 3-4)
- [ ] P2-07 (0.5h) Plan the build: the exact files you'll touch, in order
- [ ] P2-08 (0.5h) Show the design to one classmate for a 5-minute sanity check
```

### Phase 3 — Implement the box

```markdown
- [ ] P3-01 (0.5h) Pull main + branch feature/<your-box> (never work on main)
- [ ] P3-02 (1h) Register the box in types.ts: BoxType + BOX_TYPES entry (label, icon, colour, category, prompts)
- [ ] P3-03 (2h) Wire the runBox branch: gather inputs -> call the backend -> shape the reply
- [ ] P3-04 (1h) Handle the empty-input and error paths: the box must never show a blank output
- [ ] P3-05 (1h) Run the demo pipeline end-to-end and fix what breaks
- [ ] P3-06 (0.5h) Clean the code: names, why-comments, no debug leftovers; commit in small chunks
- [ ] P3-07 (0.5h) Open the PR: what/why, a screenshot of real output, the branch in 5 lines
- [ ] P3-08 (0.5h, optional) Custom render in BoxNode.tsx: score bars, cards or a verdict banner
```

### Phase 4 — Test it

```markdown
- [ ] P4-01 (1h) Technical self-test: run the 6 scenarios (happy, no input, huge, off-topic, 2 inputs, re-run)
- [ ] P4-02 (0.5h) Record every failure: what you saw, what you changed
- [ ] P4-03 (0.5h) Write the user-test plan: 3 users, ONE task, what you'll watch, what counts as success
- [ ] P4-04 (1.5h) Run 3 user sessions (15-20 min): say nothing, help after 2 min, take notes + exact quotes
- [ ] P4-05 (0.5h) Log the results: what they did, where they hesitated, what they expected
- [ ] P4-06 (1.5h) Fix the top 2 problems users hit, then re-test with at least 1 user
- [ ] P4-07 (0.5h) Write-up: report section 5 (ethics & limits), using what users misunderstood
- [ ] P4-08 (1h) Write-up: report section 6 - answer your research question with your test evidence
- [ ] P4-09 (0.5h) Final check: box in the class mega-pipeline, clean diff, 200-300 word reflection
- [ ] P4-10 (0.5h) Rehearse the 5-minute demo once, end to end, no fix-ups
```

---

## 9. Where each phase feeds the report (70% of your mark)

Nothing here is extra work: the report is written **while** you work, not at the end. Every section below has a
**✍️ box** in the phase where you produce its evidence — fill it in as you go, then assemble the report from
your own answers.

| Phase | Report sections it feeds | Rubric rows it earns |
|-------|--------------------------|----------------------|
| **1. Study the problem** | §1 Problem & motivation · §2 Domain context | Problem & motivation 15% · Research & sources 15% |
| **2. Design the solution** | §3 Design rationale · §4 Alternatives & trade-offs | Design rationale 15% · Alternatives 10% |
| **3. Implement the box** | evidence for §3 (the build proves the design) | Functionality 15% · Scaffold integration 10% |
| **4. Test it** | §5 Ethics & limits · §6 Answer to the research question | Ethics & limits 10% · Question answered 5% · Demo 5% (= inside Build) |

Your **diagrams** go in the report (or an appendix). Your **test log, user-test table and user quotes** are
the evidence that makes §5 and §6 credible — a report that says "users liked it" and shows nothing is worth
less than one that says "2 of 3 users could not find the Run button; I fixed the label".

---

## 10. How this fits the 3-week sprint (`sprint-tasks.md`)

Both documents describe the **same 30 hours and the same deliverables** — this one in the order a project is
really built (problem → design → build → test), the sprint pack in three 10-hour weeks with Wednesday and
Friday checkpoints. **Use the pack for your deadlines and this guide for the order of work.**

| Phase | Hours | Sprint week | The sprint pack's own rows |
|-------|-------|-------------|----------------------------|
| 1. Study the problem | 9 | Week 1 | `IP-W1-01`…`IP-W1-05`, plus the report §1–2 writing moved here |
| 2. Design the solution | 6 | Week 1–2 | `IP-W1-05` (pipeline sketch), `IP-W2-01` (prompt), design work new |
| 3. Implement the box | 7 | Week 2 | `IP-W2-01`…`IP-W2-03`, `IP-W2-06` |
| 4. Test it | 8 | Week 3 | guardrail tests (`IP-W2-04`) + writing/demo rows from `IP-W3-*` |
| **Total** | **30** | 3 weeks | 6 h 🔴 · 3 h 🟡 · 1 h 🔵 per week |

> ⚠️ **One deliberate difference — user testing.** This guide spends **4 h** on user testing
> (P4-03 → P4-06: plan, 3 sessions, logging, 2 fixes + re-test). The sprint pack does not contain those hours;
> it spends them on *peer review* (1.5 h) + *output polish* (1.5 h) + part of the report hour. If your cohort
> runs the pack as written, treat the pack's **peer review** and **output polish** rows as optional and use
> that time for user testing — or budget ~31.5 h if you want both. Decide which document is authoritative
> before you hand the project out, so students don't see two different totals.

*The other two known discrepancies (the brief's 130% weighting and the Week-8 vs Week-10 timeline) are
listed in `README.md` §3 — they are unchanged by this guide.*

---

## 11. Five rules that keep this simple

1. **Finish a phase before starting the next.** Design before you build; understand the problem before you
   design. Skipping Phase 1 is how the 70% gets lost.
2. **One box, no extras.** A working, well-researched simple box beats a broken complex one.
3. **Write while you work.** Every phase produces report material — Phase 1 §1–2, Phase 2 §3–4, Phase 4 §5–6.
4. **Test with people, not just by yourself.** You know how the box is *supposed* to work; your users don't,
   and that gap is the most valuable finding in the whole project.
5. **Keep everything.** Diagrams, screenshots, test logs, user quotes — they are your evidence, and evidence
   is what turns an opinion into research.

> **The finish line.** Your box runs in the class mega-pipeline, your three diagrams are in the report, your
> test log and user table show it was tested on real people, and your research question has an evidence-based
> answer. That is the whole project — and it is exactly what the rubric rewards.

---

## 12. Submission — fill this in and hand it over

**Links**

| What | Where |
|------|-------|
| Written report | |
| Pull request | |
| Board (demo pipeline) | |

**Final checklist** — tick every line before you submit.

- [ ] Report complete (2,000–2,500 words), every claim cited, my research question answered
- [ ] Every report section came from a ✍️ section I filled in (nothing written from scratch on the last night)
- [ ] All 6 technical scenarios recorded in §6a, including the ones that failed
- [ ] 3 user tests recorded in §6b, with exact quotes and what I changed
- [ ] The top 2 user problems fixed, and the fixes re-tested
- [ ] Box registered in `types.ts`, `runBox` branch wired, empty and error paths handled
- [ ] PR open, reviewed, with a screenshot of real output
- [ ] Box runs inside the class mega-pipeline
- [ ] 5-minute demo rehearsed, with no fix-ups
- [ ] All three diagrams in the report, each with a caption
- [ ] Reflection (200–300 words) written
- [ ] Workbook exported (⬇ Download answers / 🖨 Print) and stored with my submission

**Anything my instructor should know** *(optional)*

> ✍️ _Write here._

---

*AI Canva · `docs/course/individual-project/sdlc-step-by-step.md` — the Markdown version is the source and the
repo workbook; `sdlc-step-by-step.html` is the fillable print/type workbook (autosave + ⬇ Download answers).
Brief: `brief.md` · schedule: `sprint-tasks.md` · code steps: `../05_how_to_build_a_box.md`.*
