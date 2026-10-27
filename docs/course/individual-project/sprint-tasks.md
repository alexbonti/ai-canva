# Individual Project — Sprint Tasks (3 weeks, 30 hours)

> **Course:** AI-Assisted Software Project · **Project:** "One Student, One Box" (see `brief.md`)
> **Mode:** Individual — each student owns exactly **one** box
> **Sprint:** **3 weeks × 10 h/week = 30 hours**
> **Weighting:** Research **70%** · Build **30%** (the demo is inside the build mark)
> **Assumes:** the app already runs — `npm run dev` works — so no setup or clone time is budgeted below.

Everything here maps onto the brief: the same three deliverables (§6), the same rubric, no extra marks.
The tasks are ordered so the **research is never left for the last week** — it is 70% of the grade.

---

## 1. The sprint at a glance

| Week | Focus | Exit — the week is done when… |
|------|-------|------------------------------|
| **Week 1** | Choose it, prove you need it, register it | Box locked · research question written · 3 annotated sources · box registered in `types.ts` with a PR open · demo pipeline sketched on a board |
| **Week 2** | Make it run | Prompt templated · `runBox` branch produces real output · the demo pipeline runs end-to-end · empty/error paths handled · guardrails tested · report sections 1–2 drafted |
| **Week 3** | Justify it, demo it | Full 2,000–2,500 word report · rehearsed 5-minute demo · box connected into the class mega-pipeline · reflection submitted |

**No model call is required in Week 1.** Week 1 is research and scaffold on purpose: the box earns its
30% in Week 2, and the report that earns the other 70% is written across all three weeks.

---

## 2. How the hours are cut

| Marker | Meaning |
|--------|---------|
| 🔴 | **Must** — the week fails without it (6 h) |
| 🟡 | **Should** — finish these in a normal week (3 h) |
| 🔵 | **Stretch** — the last hour (1 h) |

**The cut line: if you only get ~6 hours in a week, do the 🔴 rows and nothing else** — and tell your
instructor which rows you traded off, rather than reporting "10 hours" with the must-dos unfinished.

Each week totals exactly **10 h** (6 🔴 + 3 🟡 + 1 🔵) and the three weeks total **30 h**.

---

## 3. Week 1 — choose it, prove you need it, register it (10 h)

| ID | Task | Hrs | | Done when |
|----|------|-----|-|-----------|
| IP-W1-01 | Read `brief.md` end-to-end, including the rubric — internalise that **research is 70%** of the mark | 1 | 🔴 | You can name the 3 rubric rows you are weakest on right now |
| IP-W1-02 | Shortlist 3 boxes from the brief's menu that fit a problem you actually care about; write a one-line research question for each | 1.5 | 🟡 | 3 candidate boxes, each with a one-line question |
| IP-W1-03 | Lock **one** box and write the research question as a paragraph: what problem, for whom, why it matters | 1 | 🔴 | Written on your board where the instructor can read it |
| IP-W1-04 | Find 3 credible sources and write a ~150-word annotated entry for each (what it says, why it matters to your question) | 3 | 🔴 | An annotated bibliography with 3 full references |
| IP-W1-05 | Build the pipeline sketch on a board: 💡 Idea (your problem) → **your box** → 🔍 Summarize, connected | 1 | 🔴 | 3 boxes and their edges on the canvas, ready to run next week |
| IP-W1-06 | Register the box in `types.ts`: `BoxType` + a `BOX_TYPES` entry — label, icon, colour, category, default prompt, default system prompt | 1.5 | 🟡 | The box appears in the **+ Add Box** palette and can be placed on the canvas |
| IP-W1-07 | Write the report skeleton: the 6 section headings plus 3 bullets on what goes in each; paste your 3 sources into a reference list | 1 | 🔵 | A skeleton file exists with headings, bullets and a reference list |

**10 h · Wednesday checkpoint:** IP-W1-01 and IP-W1-03 — box locked, question written.
**Friday deliverable:** board with the pipeline sketch · PR open with the `types.ts` entry · research
question + annotated bibliography.

---

## 4. Week 2 — make it run (10 h)

| ID | Task | Hrs | | Done when |
|----|------|-----|-|-----------|
| IP-W2-01 | Write the `defaultPrompt` using `{{inputs}}` / `{{input_1}}` / `{{Box Name}}`, and state the exact output format the box must return | 2 | 🔴 | Prompt written in the box's ⚙ panel, variables documented in a comment |
| IP-W2-02 | Implement the `runBox` branch: gather connected inputs → call the backend → post-process the reply into your format | 3 | 🔴 | ▶ Run produces real model output, shaped as you specified |
| IP-W2-03 | Run it on the demo pipeline; fix the empty-input and error paths so the box never shows a blank output | 1 | 🔴 | The pipeline runs end-to-end without a manual fix-up |
| IP-W2-04 | Guardrail tests: empty input, huge input (paste a whole document), off-topic input — record what happens in all three | 1.5 | 🟡 | 3 documented behaviours, each with what you'd change |
| IP-W2-05 | Draft report sections 1–2 (problem & motivation, domain context), ~800 words with citations | 1.5 | 🟡 | Draft in the skeleton, citations in the reference list |
| IP-W2-06 | Update the PR: what changed and why, a screenshot of real output, and the `runBox` branch explained in 5 lines | 1 | 🔵 | PR description readable by someone who has never seen your box |

**10 h · Mid-week checkpoint (≈5 h):** IP-W2-01 and IP-W2-02 — the box runs once, even badly.
**Friday deliverable:** working `runBox` branch + templated prompt + the pipeline running + guardrail notes
+ report sections 1–2.

---

## 5. Week 3 — justify it, demo it (10 h)

| ID | Task | Hrs | | Done when |
|----|------|-----|-|-----------|
| IP-W3-01 | Finish the report: sections 3–6 — design rationale, alternatives, ethics & limits, and the answer to your research question — to the full 2,000–2,500 words | 3.5 | 🔴 | Report complete, every claim cited, question answered explicitly |
| IP-W3-02 | Rehearse the 5-minute demo twice: your box in the pipeline plus the research answer | 1.5 | 🔴 | A full run-through with no fix-ups mid-demo |
| IP-W3-03 | Connect your box into the class **mega-pipeline** and check it composes with a neighbour's box | 1 | 🔴 | Your box runs inside the assembled class pipeline |
| IP-W3-04 | Peer review: read one classmate's report, give 3 specific comments — and act on the 3 you receive | 1.5 | 🟡 | Comments given and received; your report updated |
| IP-W3-05 | Output polish: make the output read well — headings, a verdict/score line, consistent formatting (a custom render is optional) | 1.5 | 🟡 | Someone else can read the output without being told what it means |
| IP-W3-06 | Final tidy + reflection: clean diff, final PR description, 200–300 word reflection ("what the AI got right/wrong, what I'd change"), submit report + links | 1 | 🔵 | Report + PR + board links + reflection submitted together |

**10 h · Exit:** the three deliverables are all in (§6).
**Friday deliverable:** the report, the demo, the merged/tidy PR, and the reflection.

---

## 6. What the sprint produces, and where it is marked

| Brief deliverable | Built in | Brief rubric rows it feeds |
|-------------------|----------|---------------------------|
| **A. Working box** | `types.ts` entry → W1 (IP-W1-06) · prompt template → W2 (IP-W2-01) · `runBox` branch → W2 (IP-W2-02) · demo pipeline → W2 (IP-W2-03) · clean code → W2/W3 | Functionality 15% · Scaffold integration 10% · Demo 5% (= Build 30%) |
| **B. Written research report** | Skeleton → W1 (IP-W1-07) · sections 1–2 → W2 (IP-W2-05) · sections 3–6 → W3 (IP-W3-01) | Problem & motivation 15% · Research & sources 15% · Design rationale 15% · Alternatives 10% · Ethics & limits 10% · Question answered 5% (= Research 70%) |
| **C. Demo & reflection** | Rehearsal → W3 (IP-W3-02) · mega-pipeline → W3 (IP-W3-03) · reflection → W3 (IP-W3-06) | Demo 5% (inside Build) · the reflection is evidence for Design rationale / Ethics & limits |

> ⚠️ **One thing to settle with your instructor:** the brief's §4 labels C as *"(30%)"* on top of A's 30%
> and B's 70%, which adds to 130%. The rubric adds to exactly 100% (Build 15+10+5, Research 15+15+15+10+10+5),
> so the demo is already inside the build mark and the "30%" on C is a duplicate. Treat the **rubric** as
> authoritative unless you are told otherwise.

---

## 7. Paste-ready task blocks (one per week)

Paste a whole block into a **Checklist box**'s **Add a task…** field on your board — a multi-line paste
imports one task per line. At the end of the week: **📋 Copy** (that export is your task-tracking evidence),
then **🧹 Clear done** and paste the next week's block.

### Week 1

```markdown
- [ ] IP-W1-01 (1h) Read brief.md end-to-end incl. the rubric — research is 70% of the mark
- [ ] IP-W1-02 (1.5h) Shortlist 3 boxes you'd care about + a one-line research question for each
- [ ] IP-W1-03 (1h) Lock ONE box + write your research question: problem, for whom, why it matters
- [ ] IP-W1-04 (3h) Find 3 credible sources + a ~150-word annotated entry for each
- [ ] IP-W1-05 (1h) Build the pipeline sketch: Idea -> your box -> Summarize, connected
- [ ] IP-W1-06 (1.5h) Register the box in types.ts: BoxType + BOX_TYPES entry (label, icon, colour, category, prompts)
- [ ] IP-W1-07 (1h) Write the report skeleton: 6 headings + 3 bullets each, plus the reference list
```

### Week 2

```markdown
- [ ] IP-W2-01 (2h) Write the defaultPrompt with {{inputs}} / {{input_1}} / {{Box Name}} + define the output format
- [ ] IP-W2-02 (3h) Implement the runBox branch: gather inputs -> call the backend -> post-process the reply
- [ ] IP-W2-03 (1h) Run the demo pipeline end-to-end; fix the empty-input and error paths
- [ ] IP-W2-04 (1.5h) Guardrail tests: empty, huge (whole document), off-topic input — record all 3 behaviours
- [ ] IP-W2-05 (1.5h) Draft report sections 1-2 (problem & motivation, domain context), ~800 words, cited
- [ ] IP-W2-06 (1h) Update the PR: what/why, a screenshot of real output, the runBox branch in 5 lines
```

### Week 3

```markdown
- [ ] IP-W3-01 (3.5h) Finish the report: sections 3-6 (design rationale, alternatives, ethics & limits, answer) to 2,000-2,500 words
- [ ] IP-W3-02 (1.5h) Rehearse the 5-minute demo twice: box in the pipeline + the research answer
- [ ] IP-W3-03 (1h) Connect your box into the class mega-pipeline and check it composes with a neighbour's box
- [ ] IP-W3-04 (1.5h) Peer review a classmate's report (3 comments) and act on the 3 you receive
- [ ] IP-W3-05 (1.5h) Output polish: headings, a verdict/score line, consistent formatting
- [ ] IP-W3-06 (1h) Final tidy + reflection (200-300 words) and submit report + PR + board links
```

---

## 8. What the instructor checks, week by week

| Week | Evidence | Fail signal |
|------|----------|-------------|
| 1 | Board pipeline sketch · PR open with the `types.ts` entry · research question · 3 annotated sources | Box chosen but no sources — that is the 70% half, deferred |
| 2 | `runBox` branch producing real output · templated prompt · guardrail notes · report sections 1–2 drafted | "It works on my machine" with no output shown in the PR |
| 3 | Full report (2,000–2,500 words, cited) · demo run · box in the mega-pipeline · reflection | Report left to the last night, or a demo that fails without a fix-up |

**Hour reality check:** each week is exactly 10 h (6 🔴 + 3 🟡 + 1 🔵). If a student reports a full week but
the 🔴 rows are unticked, ask which rows they traded off — that conversation is more useful than the total.
