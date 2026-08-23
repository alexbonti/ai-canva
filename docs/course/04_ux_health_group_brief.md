# AI Canva — UX Design Support Tool for Telstra Health — Group Brief

> **Course:** AI-Assisted Software Project · **Project type:** Group
> **Team:** 4 members with complementary skills — **UX, Business Analyst (BA), Developer(s), Health/Domain Expert**
> **Tool:** AI Canva, repurposed as a **UX design support tool** for a senior UX designer at Telstra Health
> **Weighting:** Build 40% · Research & Design 40% · Teamwork & Demo 20%

---

## 1. Overview

Your team will turn **AI Canva** — a visual pipeline tool where users place "boxes" on a canvas and AI content flows box-to-box — into a **UX design support tool** for a **senior UX designer at Telstra Health**.

The designer wants to explore how to better use AI in her daily work. Your tool helps her with the real, day-to-day tasks of a UX designer working on **healthcare products** — where the users may be patients, clinicians, or carers with very different levels of digital and health literacy.

The tool provides three kinds of boxes:
1. **Design boxes** — help author UX artifacts (research synthesis, personas, journey maps, wireframes, plain-language health content).
2. **Check boxes** — audit/vet a design against standards (usability heuristics, accessibility/WCAG, cognitive load, patient safety, clinical workflow).
3. **An assistant** — a tailored AI assistant that guides the designer through UX tasks with healthcare context in mind.

> **Example use case:** the designer is working on a telehealth booking flow. The tool helps her: synthesise her research notes → build personas (with health-literacy profiles) → map the patient journey → sketch wireframes → audit them against heuristics and WCAG → review for patient-safety risks — and a UX Coach guides her through each step.

---

## 2. The team & how skills divide the work

This is a **group project** — you build the tool together, and each member contributes through their skill.

| Role | Skill focus | What they own |
|------|-------------|----------------|
| **UX** | Design, usability, accessibility | The Design boxes (personas, journeys, wireframes), the canvas experience, how a designer navigates the tool, demo polish |
| **Business Analyst** | Requirements, process, research | The Check boxes (heuristics, accessibility, cognitive load), the research/justification, mapping designer needs to features |
| **Developer(s)** | Code, integration, AI wiring | Implementing the boxes (`types.ts`, `runBox`, `BoxNode`), the shared scaffold, JSON/iframe render plumbing, wiring the AI backend |
| **Health/Domain Expert** | Healthcare UX, safety, regulation | The Assistant boxes (UX Coach, Health UX Advisor), the healthcare-specific research angles, verifying the tool's health advice is sound |

> **Key principle:** everyone contributes to the *research and design* (the "why") AND the *build* (the "how"). The role split is about **ownership and depth**, not isolation — you review each other's work.

---

## 3. What the tool must do (feature set)

Build a working tool with **at least one box from each of the three roles**. The full menu your team can choose from:

### Role 1 — Design UX artifacts (authoring)
| Box | What it does | Method / focus |
|-----|--------------|----------------|
| 🧵 **Insight Weaver** | Synthesises raw research notes into themed, evidence-backed insights with quotes | Thematic analysis / affinity mapping |
| 🧬 **Persona Forge** | Builds evidence-based personas with digital & health-literacy profiles | Personas / JTBD / health literacy |
| 🗺️ **Journey Mapper** | Generates a service-design journey map with emotions, pain points, handoffs | Service design / journey mapping |
| ✏️ **Wireframe Sketcher** | Turns a flow into low-fidelity wireframes with annotations | Wireframing / information hierarchy |
| 🗣️ **Plain-Language Writer** | Rewrites clinical content into plain-language health copy at a target reading level | Health literacy / teach-back |

### Role 2 — Check / evaluate UX (audit)
| Box | What it does | Method / focus |
|-----|--------------|----------------|
| 🔍 **Heuristic Auditor** | Audits a design against Nielsen's 10 heuristics + healthcare-specific ones | Nielsen heuristics / severity |
| ♿ **Accessibility Auditor** | Audits against WCAG 2.2 + health-specific accessibility needs | WCAG / inclusive design |
| 🧠 **Cognitive Load Checker** | Estimates cognitive load per step, flags overload points | Cognitive load theory / COGA |
| 🩺 **Patient Safety Reviewer** | Reviews for patient-safety risks (ambiguous instructions, missing warnings, dangerous defaults) | Patient safety / safety-critical UI |
| 🏥 **Clinician Workflow Analyzer** | Analyses a design against real clinical workflows (handovers, interruptions, time pressure) | Clinical workflow / contextual design |

### Role 3 — Assistant (tailored guidance)
| Box | What it does |
|-----|--------------|
| 🎓 **UX Coach** | Guides the designer through a UX task step-by-step (asks questions, suggests methods, critiques drafts) |
| 🩺 **Health UX Advisor** | Injects healthcare-UX knowledge (accessibility, health literacy, privacy, clinical context, Australian regulation) as a "second opinion" |

> **Minimum viable tool:** at least **3 boxes — one from each role** (e.g. Persona Forge + Heuristic Auditor + UX Coach) that chain together in a working pipeline. A working, well-researched 3-box tool beats a broken 6-box one.

---

## 4. How the boxes fit together (the demo pipeline)

The three roles form a **loop**: design → check → guide. Your demo should show a complete flow:

```
Research notes → 🧵 Insight Weaver → 🧬 Persona Forge → 🗺️ Journey Mapper
        → ✏️ Wireframe Sketcher → 🔍 Heuristic Auditor → ♿ Accessibility Auditor
        → 🩺 Patient Safety Reviewer → 🎓 UX Coach (guides the fix)
```

Each box plugs into AI Canva through the **shared scaffold** (the same 3 touchpoints):
1. `types.ts` — register the box (name, icon, colour, default prompt)
2. `boardStore.ts` — the `runBox` branch (what happens on Run)
3. `BoxNode.tsx` — (optional) custom rendering (persona cards, journey strip, severity table, risk matrix)

Because every box speaks the same `{{inputs}}` language, any box plugs into any pipeline.

---

## 5. Deliverables

### A. Working tool (Build — 40%)
- [ ] At least 3 boxes (one per role) wired into the scaffold
- [ ] A working demo pipeline (design → check → assistant)
- [ ] Clean, readable, commented code; runs locally (`npm run dev`)

### B. Research & design report (40%)
A team report (e.g. 3,000–4,000 words) covering:
1. **Problem & motivation** — how could AI help a senior UX designer at Telstra Health, and why?
2. **Domain research** — the UX methods and healthcare context you used (heuristics, WCAG, health literacy, patient safety, Australian regulation).
3. **Design rationale** — why your boxes, prompts, and outputs are designed the way they are.
4. **Alternatives** — other approaches (manual, other tools, generic AI) and why your tool adds value.
5. **Ethics & limits** — the danger of AI giving UX/health advice (false assurance, patient-safety risk, hallucinated quotes, privacy) and the guardrails you built in.
6. **Team reflection** — how each skill contributed.

### C. Demo & teamwork (20%)
- A live demo of the tool on a real healthcare UX scenario
- Evidence of collaboration (PRs, reviews, task tracking)

---

## 6. Sprints & timeline

The project runs over **3 sprints, 8 weeks total**. Each student can work **10 hours per week** (80 hours total per student; a team of 4 has ~320 team-hours).

| Sprint | Duration | Hours/student | Focus |
|--------|----------|---------------|-------|
| **Sprint 1** | 2 weeks (starting today) | 20 hrs | Research, team roles, box selection, scaffold |
| **Sprint 2** | 3 weeks | 30 hrs | Main build — implement the boxes |
| **Sprint 3** | 3 weeks | 30 hrs | Finish build, research report, demo |

### Sprint 1 — Research & scaffold (2 weeks, 20 hrs)
- [ ] Lock team roles (UX / BA / Dev / Health)
- [ ] Choose your 3+ boxes (one per role) and the demo pipeline
- [ ] Research question + 3 sources per member
- [ ] Register boxes in `types.ts` + draft prompts
- **Exit:** a clear plan and a scaffolded repo

### Sprint 2 — Main build (3 weeks, 30 hrs)
- [ ] Implement `runBox` branches for all chosen boxes
- [ ] Wire the AI backend; boxes produce real output
- [ ] Build the demo pipeline (design → check → assistant)
- [ ] Mid-sprint check: at least one box fully working end-to-end
- **Exit:** a working tool with all boxes chaining

### Sprint 3 — Finish, report & demo (3 weeks, 30 hrs)
- [ ] Polish: error handling, custom rendering, edge cases
- [ ] Write the research & design report (3,000–4,000 words)
- [ ] Prepare the live demo on a real healthcare UX scenario
- [ ] Collect teamwork evidence (PRs, reviews, task tracking)
- **Exit:** a finished tool, report, and demo

> **Sprint rule:** at the end of each sprint, demo what you have — even if it's rough. A working partial tool each sprint beats a broken "complete" one at the end.

---

## 7. Rubric

### Build (40%)
| Criteria | Excellent | Good | Needs work |
|----------|-----------|------|------------|
| **Functionality** (20%) | 3+ boxes run, chain together, produce sound output | Boxes work, minor issues | Broken or incomplete |
| **Scaffold integration** (10%) | Correctly wired, clean code | Wired, minor issues | Touchpoints incomplete |
| **Demo** (10%) | Compelling live demo on a real healthcare scenario | Demo works | Demo weak/fails |

### Research & Design (40%)
| Criteria | Excellent | Good | Needs work |
|----------|-----------|------|------------|
| **Problem & motivation** (8%) | Precise, clearly argued | Stated, general | Vague |
| **Domain research** (8%) | Deep, current, well-cited UX + health methods | Solid sources | Few sources |
| **Design rationale** (8%) | Justified choices with real reasoning | Reasonable | Choices unstated |
| **Alternatives** (8%) | Strong comparison | Some compared | Little comparison |
| **Ethics & limits** (8%) | Guardrails proposed, honest about AI limits | Limits mentioned | Risks ignored |

### Teamwork & Demo (20%)
| Criteria | Excellent | Good | Needs work |
|----------|-----------|------|------------|
| **Role contribution** (10%) | Each skill clearly contributed | Some imbalance | One person did most |
| **Collaboration** (10%) | PRs, reviews, clear division | Some collaboration | Little evidence |

---

## 8. Guidelines

- **Use AI to build** — that's the point. But you must be able to explain every box.
- **Healthcare UX accuracy matters** — the health/domain member(s) must verify the tool's advice is sound. A UX recommendation that ignores patient safety, health literacy, or Australian regulation is a real error, not a cosmetic one.
- **Be honest about limits** — acknowledge where AI UX advice is *not* trustworthy (it can't experience an interface, can't run a screen reader, can hallucinate quotes, and must never give clinical advice).
- **Every skill contributes to research AND build** — no one is "just the coder" or "just the designer."

---

## 9. Good luck

You're building a tool that could genuinely help a senior UX designer make better, safer, more accessible healthcare products. The combination of your skills — UX, analysis, development, and health domain knowledge — is exactly what a real health-tech product team looks like. Design it well, build it soundly, and justify every choice.
