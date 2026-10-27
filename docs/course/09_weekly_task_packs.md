# Weekly Task Packs — the Group Tracks (10 Hours per Student)

> **Course:** AI-Assisted Software Project
> **Assumption for this pack:** every student has **10 hours** this week, and **the project already runs** on
> their machine (`npm run dev` works) — so no setup/clone time is budgeted anywhere below.
> **This week = Week 1**, i.e. the first 10 of Sprint 1's 20 hours. Exit for the week: **the plan is locked
> and the scaffold is real** (boxes registered in `types.ts`, research questions written, pipeline drawn).
> **Companion doc:** `08_sprint_task_plan.md` (per-role tasks for all three sprints). This file is the
> *this-week* cut of it, with the hours spent explicitly.
> **Individual students:** they use `individual-project/` — brief + step-by-step SDLC workbook + 3-week
> sprint tasks — not this file.

---

## 1. How every task below is budgeted

| Marker | Meaning |
|--------|---------|
| 🔴 | **Must** — the week is a failure without it (≈6 h) |
| 🟡 | **Should** — finish these with a normal 10 h week (≈9 h) |
| 🔵 | **Stretch** — the last hour (10 h) |

**The cut line: if a student only gets ~6 hours this week, they do the 🔴 rows and nothing else.** Say that
out loud when you hand the pack out — it stops the "I ran out of time" conversation from being about
judgement calls.

Per student, everywhere in this file: **3 h shared team work + 7 h role work = 10 h** (group tracks only
— individual students follow `individual-project/sprint-tasks.md`).

---

## 2. Individual project — it has its own folder

The individual "One Student, One Box" project is not covered here any more: it has its own
**step-by-step SDLC guide** and **3-week sprint pack** (30 h) with the brief —
`individual-project/README.md`, `individual-project/brief.md`,
`individual-project/sdlc-step-by-step.md` and `individual-project/sprint-tasks.md`. This file is the
**group tracks'** week pack.

---

## 3. Group tracks — every member (3 h shared, then 7 h by role)

The four group tracks (cyber `03`, UX/Telstra Health `04`, Telstra Innovation `06`, NBN `07`) get the
**same shape** this week; only the domain rows differ.

### 3.1 Shared — all members (3 h)

| # | Task | Hrs | Priority | Done when |
|---|------|-----|----------|-----------|
| S1 | Read your brief end-to-end (overview, roles, feature menu, deliverables, sprints, rubric) | 1 | 🔴 | Every member knows the 3 roles and the minimum viable tool |
| S2 | Team meeting #1: lock roles (one owner each), agree the meeting rhythm, and agree that the **board is the task tracker** | 1 | 🔴 | Role table on the board has real names against every role |
| S3 | Choose your **3+ boxes (one per role)** and draw the demo pipeline on the team board (boxes, edges, one-line purpose each) | 1 | 🔴 | Pipeline visible on the board and the box list agreed by everyone |

### 3.2 Role work (7 h each)

**UX — 7 h**

| # | Task | Hrs | Priority |
|---|------|-----|----------|
| U1 | Sketch the canvas/box experience: how a non-expert moves through the pipeline, where each box's output gets read, empty/error states | 3 | 🔴 |
| U2 | Write a one-page UX brief for the 3 chosen boxes: who the user is, what they see, what a *good* output looks like | 3 | 🟡 |
| U3 | Research question + 3 sources for your angle | 1 | 🔵 |

**Business Analyst — 7 h**

| # | Task | Hrs | Priority |
|---|------|-----|----------|
| B1 | Requirements skeleton: user needs → chosen boxes → what each box must output (a traceable table) | 3 | 🔴 |
| B2 | Research question + 3 annotated sources for the report's problem/domain section | 3 | 🟡 |
| B3 | Review the Dev's `types.ts` PR: does every registered box answer a stated need? | 1 | 🔵 |

**Developer — 7 h**

| # | Task | Hrs | Priority |
|---|------|-----|----------|
| D1 | Register the 3 chosen boxes in `types.ts` — label, icon, colour, category, default prompt, system prompt — branch + PR | 4 | 🔴 |
| D2 | Write the `runBox` plan per box in the PR: input gathered, `{{variables}}` used, output shape, failure behaviour | 2 | 🟡 |
| D3 | Run one existing box end-to-end and walk the team through where the model call happens | 1 | 🔵 |

**Domain role — 7 h** (cybersecurity / health-domain / domain-business / 4th non-technical, per track)

| # | Task | Hrs | Priority |
|---|------|-----|----------|
| X1 | Shortlist the frameworks for each *check* box, with 2 sources each (start from the brief's framework table) | 3 | 🔴 |
| X2 | Write the **guardrails list**: what the tool must never claim, and what disclaimer each output needs | 3 | 🟡 |
| X3 | Verify the chosen boxes really cover author → check → guide (no role missing, no box doing two roles badly) | 1 | 🔵 |

**The Domain row, per track:**

| Track | X1 — frameworks to shortlist with sources |
|-------|-------------------------------------------|
| 🛡️ Cyber | NIST CSF / 800-30 / 800-53, ISO 27001, OWASP ASVS + Top 10, GDPR, STRIDE, FAIR |
| 🩺 UX (Telstra Health) | Nielsen's 10 heuristics, WCAG 2.2, cognitive load/COGA, patient safety, Australian health regulation & privacy |
| 💡 Telstra Innovation | JTBD, RICE/ICE, The Mom Test, feasibility & build-vs-buy, pre-mortems, FTO/IP basics |
| 🤝 NBN | INVEST + user stories, WCAG 2.2 (POUR), plain language/readability, traceability, ubiquitous language |

**Wednesday checkpoint (≈5 h in):** S1–S3 done, and **every** member has their research question written.
**Friday deliverable:** team board (roles + boxes + pipeline) · PR with `types.ts` entries + `runBox` plan ·
each member's 3 annotated sources · the role artefact (UX brief / BA requirements skeleton / Dev PR / Domain
framework shortlist + guardrails).

---

## 4. Paste-ready blocks for this week

Paste the block for the track into a **Checklist box** on that team's board (a multi-line paste imports one
task per line). Each member's 10 hours = the **shared rows** + **their own role's rows**. Then use
**＋ assign** to put a name on every row.

### 4.1 Individual project — Week 1 block is in its own folder

Use `individual-project/sprint-tasks.md` §7 (Week 1 block) for individual students.

### 4.2 Any group track — Week 1 shared (3 h per member)

```markdown
- [ ] W1-S1 (1h, ALL) Read your brief end-to-end: overview, roles, feature menu, deliverables, sprints, rubric
- [ ] W1-S2 (1h, ALL) Team meeting #1: lock roles with real names, set the meeting rhythm, agree the board is the task tracker
- [ ] W1-S3 (1h, ALL) Choose 3+ boxes (one per role) and draw the demo pipeline on the team board
- [ ] W1-U1 (3h, UX) Sketch the canvas/box experience: navigation, where each output is read, empty/error states
- [ ] W1-U2 (3h, UX) One-page UX brief for the 3 chosen boxes: user, what they see, what a good output looks like
- [ ] W1-U3 (1h, UX) Research question + 3 sources for your angle
- [ ] W1-B1 (3h, BA) Requirements skeleton: user needs -> chosen boxes -> required outputs (traceable table)
- [ ] W1-B2 (3h, BA) Research question + 3 annotated sources for the problem/domain section
- [ ] W1-B3 (1h, BA) Review the Dev's types.ts PR: does every box answer a stated need?
- [ ] W1-D1 (4h, DEV) Register the 3 chosen boxes in types.ts (label, icon, colour, category, prompts) — branch + PR
- [ ] W1-D2 (2h, DEV) Write the runBox plan per box in the PR: inputs, {{variables}}, output shape, failure behaviour
- [ ] W1-D3 (1h, DEV) Run one existing box end-to-end and show the team where the model call happens
- [ ] W1-X1 (3h, DOMAIN) Shortlist the frameworks for each check box, 2 sources each
- [ ] W1-X2 (3h, DOMAIN) Write the guardrails list: what the tool must never claim + each output's disclaimer
- [ ] W1-X3 (1h, DOMAIN) Verify the boxes cover author -> check -> guide (no role missing)
```

### 4.3 🛡️ Cybersecurity — Domain row only (paste in place of W1-X1)

```markdown
- [ ] W1-X1 (3h, DOMAIN) Shortlist NIST CSF/800-30/800-53, ISO 27001, OWASP ASVS + Top 10, GDPR, STRIDE, FAIR — 2 sources each
```

### 4.4 🩺 UX Support Tool (Telstra Health) — Domain row only

```markdown
- [ ] W1-X1 (3h, DOMAIN) Shortlist Nielsen heuristics, WCAG 2.2, cognitive load/COGA, patient safety, Australian health regulation — 2 sources each
```

### 4.5 💡 Telstra Innovation Lab — Domain row only

```markdown
- [ ] W1-X1 (3h, DOMAIN) Shortlist JTBD, RICE/ICE, The Mom Test, feasibility & build-vs-buy, pre-mortems, FTO/IP basics — 2 sources each
```

### 4.6 🤝 NBN Collaboration Tool — Domain row only

```markdown
- [ ] W1-X1 (3h, DOMAIN) Shortlist INVEST + user stories, WCAG 2.2 POUR, plain language/readability, traceability, ubiquitous language — 2 sources each
```

---

## 5. What you check on Friday (and the hour-count reality check)

| Track | Evidence you look for | Fail signal |
|-------|----------------------|-------------|
| All group tracks | Team board with named roles + 3+ boxes + drawn pipeline | Role table empty or duplicated roles |
| All group tracks | PR containing `types.ts` entries **and** the per-box `runBox` plan | "We'll register the boxes next week" |
| All group tracks | 3 annotated sources **per member** (not 3 per team) | 3 sources total across 4 people |
| All group tracks | One role artefact each (UX brief / BA skeleton / Dev PR / Domain shortlist + guardrails) | Domain artefact missing — the check boxes then have no framework behind them |

**Hour-count reality check:** this pack is 6 h of 🔴 work and 10 h of total work. If a team reports
"everyone did 10 hours" but the 🔴 rows aren't all ticked, the hours went somewhere else — ask which task
they traded off rather than accepting the total.

---

## 6. Repeating this pack next week

Week 2 (the second 10 h of Sprint 1) in the same shape, from `08_sprint_task_plan.md` §4.1:

- **Shared (3 h):** prompt drafts for the chosen boxes · finalise the demo pipeline · prepare the Sprint 1 demo (plan + scaffolded repo).
- **UX (7 h):** empty/error-state designs · first look at how the boxes' outputs will be laid out.
- **BA (7 h):** finish the traceable requirements table · draft the report's problem & motivation section.
- **Dev (7 h):** draft prompts with `{{inputs}}` / `{{input_1}}` / `{{Box Name}}` · one box's `runBox` branch started end-to-end.
- **Domain (7 h):** per-box guardrail text inside the prompts · framework citations formatted for the report.
- **Sprint 1 exit on Friday of Week 2:** facilitator signs off on the plan and the pipelined repo, then the
  Sprint 2 block (`08`, §5.6) goes on the board.
