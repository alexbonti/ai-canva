# AI Canva — NBN Cross-Functional Collaboration Tool — Group Brief

> **Course:** AI-Assisted Software Project · **Project type:** Group
> **Team:** 4 members with complementary skills — **UX, Business Analyst (BA), Developer(s), a 4th non-technical role (Product/Content/Research)**
> **Tool:** AI Canva, repurposed as a **cross-functional collaboration accelerator** for **NBN**
> **Weighting:** Build 40% · Research & Design 40% · Teamwork & Demo 20%

---

## 1. Overview

Your team will turn **AI Canva** — a visual pipeline tool where users place "boxes" on a canvas and AI content flows box-to-box — into a **cross-functional collaboration tool** for **NBN**.

The goal is to help NBN explore how **UX designers, BAs and other non-technical roles** (product, content, research, policy) can **work together and collaborate faster** — sharing context, aligning on requirements, handing off work, and reducing friction — **without writing any code**.

The tool provides three kinds of boxes:
1. **Collaboration/Alignment boxes** — help non-technical roles author shared artifacts (requirements, user stories, UX briefs, journey maps, handoff docs, a shared glossary).
2. **Review/Quality boxes** — help roles check each other's work (requirements completeness, accessibility, plain-language, cross-role consistency).
3. **An assistant** — tailored helpers that reduce friction (translate jargon between roles, prepare handoffs, capture decisions).

> **Example use case:** a team is redesigning the **outage-status page** for residential customers. The tool helps them: draft user stories → map the customer journey → translate BA jargon into plain language for the content writer → prepare a handoff for the UX designer → then run accessibility and cross-role consistency checks.

---

## 2. The team & how skills divide the work

This is a **group project** — you build the tool together, and each member contributes through their skill.

| Role | Skill focus | What they own |
|------|-------------|----------------|
| **UX** | Design, usability, accessibility | The artifact boxes (journey map, UX brief), the a11y review box, canvas experience, demo polish |
| **Business Analyst** | Requirements, process, research | The requirements boxes (user stories, INVEST audit, clarification), the research/justification |
| **Developer(s)** | Code, integration, AI wiring | The shared plumbing (`runBox` pattern, `BoxNode` renders), implementing the boxes, wiring the AI backend |
| **4th non-technical role** (Product/Content/Research) | Content, plain language, domain | The "glue" boxes (jargon translation, plain-language, glossary, decision capture) that reduce cross-role friction |

> **Key principle:** everyone contributes to the *research and design* (the "why") AND the *build* (the "how"). The role split is about **ownership and depth**, not isolation — you review each other's work.

---

## 3. What the tool must do (feature set)

Build a working tool with **at least one box from each of the three roles**. The full menu your team can choose from:

### Role 1 — Collaboration / Alignment (author shared artifacts)
| Box | What it does | Method / focus |
|-----|--------------|----------------|
| 🧩 **Story Forge** | Drafts INVEST-quality user stories (`As a… I want… so that…`) with acceptance criteria | User stories / INVEST / 3 Cs |
| 🧭 **Journey Mapper** | Turns research into a customer journey map (stages, emotions, pain points) | Journey mapping / service design |
| 📦 **Handoff Brief** | Packages one role's output into a clean handoff doc for the next role | Handoff / definition of done |
| 📚 **Context Vault** | Builds a shared glossary + context of terms/acronyms/decisions | Ubiquitous language / controlled vocab |

### Role 2 — Review / Quality (check each other's work)
| Box | What it does | Method / focus |
|-----|--------------|----------------|
| 🧪 **INVEST Auditor** | Scores user stories against INVEST, flags weak ones with fixes | INVEST / requirements quality |
| ♿ **A11y Lens** | Reviews a brief/map/content against WCAG 2.2 (POUR) | WCAG / inclusive design |
| 🗣️ **Plain-Speak Check** | Rewrites jargon-heavy content into plain language + a jargon report | Plain language / readability |
| ✅ **Alignment Check** | Compares two role artifacts (e.g. UX brief vs BA requirements) for agreement/drift | Requirements traceability |

### Role 3 — Assistant (reduce friction)
| Box | What it does |
|-----|--------------|
| 🔁 **Jargon Translator** | Translates an artifact from one role's language into another's (BA → plain, UX → acceptance criteria) |
| 🤝 **Handoff Helper** | Interactive assistant that prepares work for the next role (asks questions, fills gaps) |
| 🗒️ **Decision Log** | Captures decisions, rationale, owners from meeting notes → a searchable log |
| ❓ **Clarifier** | Takes a vague requirement and elicits clarity (5 Whys, targeted questions) |

> **Minimum viable tool:** at least **3 boxes — one from each role** (e.g. Story Forge + A11y Lens + Jargon Translator) that chain together in a working pipeline. A working, well-researched 3-box tool beats a broken 6-box one.

---

## 4. How the boxes fit together (the demo pipeline)

The three roles form a **loop**: author → check → translate/hand off. Your demo should show a complete flow:

```
💡 Idea ──▶ 🔍 Research ──▶ 📄 PRD ──▶ 🧩 Story Forge ──▶ 🧭 Journey Mapper
                                        │
                                        ├──▶ 🧪 INVEST Auditor ──▶ 🧩 Story Forge (re-draft)
                                        │
                                        └──▶ 🔁 Jargon Translator ──▶ 📦 Handoff Brief ──▶ 🎨 UX Brief
                                                                                          │
                                                                                          └──▶ ♿ A11y Lens ──▶ ✅ Alignment Check
```

Each box plugs into AI Canva through the **shared scaffold** (3 touchpoints):
1. `types.ts` — register the box (name, icon, colour, default prompt)
2. `boardStore.ts` — the `runBox` branch (what happens on Run)
3. `BoxNode.tsx` — (optional) custom rendering (story cards, journey strip, severity lists)

---

## 5. Deliverables

### A. Working tool (Build — 40%)
- [ ] At least 3 boxes (one per role) wired into the scaffold
- [ ] A working demo pipeline (author → check → translate/hand off)
- [ ] Clean, readable, commented code; runs locally (`npm run dev`)

### B. Research & design report (40%)
A team report (e.g. 3,000–4,000 words) covering:
1. **Problem & motivation** — how could AI help NBN's non-technical roles collaborate faster?
2. **Domain research** — the requirements/UX/collaboration methods you used (user stories/INVEST, journey mapping, plain language, WCAG, handoffs).
3. **Design rationale** — why your boxes, prompts, and outputs are designed the way they are.
4. **Alternatives** — other approaches (manual, collaboration tools, generic AI) and why your tool adds value.
5. **Ethics & limits** — invented acceptance criteria, biased journey maps, AI fabricating "confirmed" decisions, and the guardrails you built in.
6. **Team reflection** — how each skill contributed.

### C. Demo & teamwork (20%)
- A live demo of the tool on a realistic NBN scenario
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
- [ ] Lock team roles (UX / BA / Dev / 4th role)
- [ ] Choose your 3+ boxes (one per role) and the demo pipeline
- [ ] Research question + 3 sources per member
- [ ] Register boxes in `types.ts` + draft prompts
- **Exit:** a clear plan and a scaffolded repo

### Sprint 2 — Main build (3 weeks, 30 hrs)
- [ ] Implement `runBox` branches for all chosen boxes
- [ ] Wire the AI backend; boxes produce real output
- [ ] Build the demo pipeline (author → check → translate/hand off)
- [ ] Mid-sprint check: at least one box fully working end-to-end
- **Exit:** a working tool with all boxes chaining

### Sprint 3 — Finish, report & demo (3 weeks, 30 hrs)
- [ ] Polish: error handling, custom rendering, edge cases
- [ ] Write the research & design report (3,000–4,000 words)
- [ ] Prepare the live demo on a realistic NBN scenario
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
| **Demo** (10%) | Compelling live demo on a realistic scenario | Demo works | Demo weak/fails |

### Research & Design (40%)
| Criteria | Excellent | Good | Needs work |
|----------|-----------|------|------------|
| **Problem & motivation** (8%) | Precise, clearly argued | Stated, general | Vague |
| **Domain research** (8%) | Deep, current, well-cited methods | Solid sources | Few sources |
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
- **Collaboration/requirements accuracy matters** — the BA and 4th-role members must verify the tool's output is sound. A user story that invents constraints, or a "decision" the AI fabricated, is a real error.
- **Be honest about limits** — acknowledge where AI collaboration advice is *not* trustworthy (it can invent acceptance criteria, bias journey maps, and fabricate "confirmed" answers).
- **Every skill contributes to research AND build** — no one is "just the coder" or "just the designer."

---

## 9. Good luck

You're building a tool that could genuinely help NBN's non-technical teams align, hand off, and deliver faster. The combination of your skills — UX, analysis, development, and a non-technical domain lens — is exactly what a real cross-functional NBN team looks like. Design it well, build it soundly, and justify every choice.
