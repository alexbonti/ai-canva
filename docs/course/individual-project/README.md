# Individual Project — "One Student, One Box"

> **Course:** AI-Assisted Software Project · **Mode:** Individual · **Sprint:** 3 weeks × 10 h = **30 hours**
> **Weighting (from the brief):** Research **70%** · Build **30%** (the demo sits inside the build mark)
> **Assumes:** the app already runs on the student's machine (`npm run dev`) — no setup time is budgeted.

This folder is everything a student (and the instructor) needs for the individual project — the brief, the
step-by-step **workbook**, the sprint tasks, and the print handouts.

| File | What it is | Who reads it |
|------|-----------|--------------|
| `README.md` | This index: the sprint at a glance, how to hand the tasks out, and the timeline caveats | Instructor |
| `brief.md` | **The original project brief** — the full "One Student, One Box" brief, unchanged | Student |
| `brief.html` | The same brief as a print-friendly handout (PDF/print) | Student |
| `sprint-tasks.md` | **The 3-week sprint task pack** — every task, hour by hour, week by week | Student + Instructor |
| `sprint-tasks.html` | The same task pack as a print-friendly handout | Student |
| `sdlc-step-by-step.md` | **The step-by-step workbook (source)** — the same project in classic SDLC order: study the problem → design the solution → implement the box → test it (34 tasks, phase by phase, with "done when") **plus the ✍️ sections where the student writes their work** | Student |
| `sdlc-step-by-step.html` | **The fillable workbook** — the same document with type-in boxes: autosaves in the browser, **⬇ Download answers (.md)**, and prints with blank space to write in | Student |

> The group projects are **not** in this folder. Their briefs stay at `docs/course/03`–`07`, and their
> tasks live in `docs/course/08_sprint_task_plan.md` and `docs/course/09_weekly_task_packs.md`.

---

## 1. The sprint at a glance (3 weeks, 10 h/week)

Each week is cut to **10 hours**: ~6 h of must-do, ~3 h of should-do and a final hour of stretch.
See `sprint-tasks.md` §2 for the priority markers and the cut line.

| Week | Focus | Exit — the week is done when… |
|------|-------|------------------------------|
| **Week 1** | Choose it, prove you need it, register it | One box locked, the research question written, 3 annotated sources, the box registered in `types.ts` (PR open), the demo pipeline sketched on a board |
| **Week 2** | Make it run | A templated prompt and a working `runBox` branch produce real output on the demo pipeline; empty/error paths handled; guardrails tested; report sections 1–2 drafted |
| **Week 3** | Justify it, demo it | The full 2,000–2,500 word report, a rehearsed 5-minute demo, the box connected into the class mega-pipeline, and the reflection submitted |

**The three deliverables it produces** (the brief's own §4): **A** a working box · **B** the written
research report · **C** the live demo + reflection. `sprint-tasks.md` §6 maps each deliverable to the week
it is finished in and to the rubric rows that mark it.

---

## 2. How to hand it out

1. Open the student's board (their own board, or a per-student board in a workshop).
2. **+ Add Box → Collaboration → Checklist.**
3. Paste that week's block from `sprint-tasks.md` §7 into the box's **Add a task…** field — a multi-line
   paste imports one task per line, keeping the hours and task IDs. If the cohort is working in **SDLC
   phases** rather than weeks, paste a phase block from `sdlc-step-by-step.md` §8 instead (same board, same
   checklist box — the two documents describe the same 30 h).
4. Tick as they go: the checkbox records **who** ticked it and **when**, and the progress bar shows how much
   of the week's 10 hours is accounted for. **📋 Copy** exports the list as Markdown for the submission.
5. At the end of each week, **📋 Copy** (evidence) then **🧹 Clear done**, and paste the next week's block.
   Caps: 200 tasks and 500 characters per task, so one week per box is comfortable.

> Seat-code guests can't be assigned tasks or credited on ticks (their identity has no email in the current
> implementation) — signed-in students are unaffected. See `../08_sprint_task_plan.md` §2.2 for the detail.

**Handing out the workbook.** Give students `sdlc-step-by-step.html`: it is the guide *and* the place they
record their work. The **✍️** boxes save in their own browser as they type, **⬇ Download answers (.md)**
exports everything as Markdown to drop into the report, and **🖨 Print / PDF** gives a paper version with
blank space to write in. Students working in the repo can instead edit `sdlc-step-by-step.md` and put their
answers in the same PR as their box — same sections, same questions.

---

## 3. Caveats worth knowing before you hand this out

1. **The brief's own milestone table spans 10 weeks** (M1 = Week 2 … M5 = Week 10), while this pack delivers
   the whole project in a **3-week sprint**. The pack is a compression: it keeps every deliverable and every
   rubric row, but drops the slack. If a cohort actually runs the full 10 weeks, stretch the weeks using the
   brief's milestone table (M1–M5) instead of this pack — and say so, because students will otherwise see two
   different timelines.
2. **The brief weights the same mark twice.** Its header says *Research 70% · Build 30%*, and the rubric
   agrees (Build 15+10+5 = 30; Research 15+15+15+10+10+5 = 70). But §4 lists a third bucket,
   *"C. Reflection / demo (30%)"*, which makes the printed weights add to 130%. The demo is already *inside*
   the build mark (Demo 5%), so the "30%" on C is a duplicate — worth fixing in `brief.md` once you decide
   whether the reflection carries any weight of its own.
3. **The course intro says "3 sprints (8 weeks)"** while the individual brief runs to Week 10. Whichever way
   you resolve it, make the two documents agree — students notice.
4. **User testing is new in `sdlc-step-by-step.md` and the sprint pack has no hours for it.** The guide
   spends 4 h on it (plan → 3 user sessions → log → fix top 2 + re-test). The pack's Week 3 spends those
   hours on *peer review* (1.5 h) + *output polish* (1.5 h) + part of the report hour. Decide which document
   is authoritative before handing the project out: either drop the pack's peer-review/polish rows in favour
   of user testing (30 h), or run both and budget ~31.5 h.
5. **The workbook's autosave is not a submission system.** It stores answers in each student's own browser
   (`localStorage`) — never uploaded, not shared with teammates or the instructor, and lost if they clear
   site data or switch computer. Tell students to **⬇ Download answers / 🖨 Print at the end of every
   session** and attach that file. If you need a real submission channel, collect the exported `.md`/PDF, or
   have repo students fill in `sdlc-step-by-step.md` inside their PR.

If you fix (2) or (3) in `brief.md`, keep `brief.html` in step; the Markdown is the source.
