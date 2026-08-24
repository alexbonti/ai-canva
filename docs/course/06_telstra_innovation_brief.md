# AI Canva — Telstra Innovation Lab Accelerator — Group Brief

> **Course:** AI-Assisted Software Project · **Project type:** Group
> **Team:** 4 members with complementary skills — **UX, Business Analyst (BA), Developer(s), Domain/Business Expert**
> **Tool:** AI Canva, repurposed as an **Innovation Accelerator** for **Telstra's Innovation Lab**
> **Weighting:** Build 40% · Research & Design 40% · Teamwork & Demo 20%

---

## 1. Overview

Your team will turn **AI Canva** — a visual pipeline tool where users place "boxes" on a canvas and AI content flows box-to-box — into an **Innovation Accelerator** for Telstra's Innovation Lab.

The goal is to help the lab **innovate faster** — market research, rapid prototyping, idea validation, and getting from concept to prototype quickly, using evidence rather than guesswork.

The tool provides three kinds of boxes:
1. **Design boxes** — help author innovation artifacts (market research synthesis, pain discovery, opportunity scoring, competitive teardown, prototyping briefs).
2. **Check boxes** — audit/vet an innovation (desirability, market-size sanity, feasibility, risk, freedom-to-operate).
3. **An assistant** — a tailored assistant that guides the innovator through the process.

> **Example use case:** a squad has an idea for a new consumer service. The tool helps them: synthesise the market → mine the customer pain (JTBD) → score the opportunity → produce a rapid-prototyping brief → then check it against desirability, market size, feasibility, risk, and IP before a go/no-go decision.

---

## 2. The team & how skills divide the work

This is a **group project** — you build the tool together, and each member contributes through their skill.

| Role | Skill focus | What they own |
|------|-------------|----------------|
| **UX** | Design, usability, rapid prototyping | The prototyping brief, journey/opportunity visualisations, canvas experience, demo polish |
| **Business Analyst** | Market research, requirements, scoring | Market synthesis, pain mining, opportunity scorecard, the research/justification |
| **Developer(s)** | Code, integration, AI wiring | Implementing the boxes (`types.ts`, `runBox`, `BoxNode`), shared scaffold, JSON/iframe render plumbing |
| **Domain/Business Expert** | Innovation method, feasibility, IP | The check boxes (feasibility, risk, FTO), the innovation-method research, go/no-go decision |

> **Key principle:** everyone contributes to the *research and design* (the "why") AND the *build* (the "how"). The role split is about **ownership and depth**, not isolation — you review each other's work.

---

## 3. What the tool must do (feature set)

Build a working tool with **at least one box from each of the three roles**. The full menu your team can choose from:

### Role 1 — Design innovation artifacts (authoring)
| Box | What it does | Method / focus |
|-----|--------------|----------------|
| 📡 **Market Pulse** | Synthesises market research into a landscape brief (segments, growth drivers, Telstra context) | Market research synthesis / TAM-SAM-SOM |
| ⛏️ **Pain Miner** | Maps customer Jobs-to-be-Done: jobs, ranked pains, gains, "struggling moment" | JTBD / customer problem interviews |
| 🎯 **Opportunity Scorecard** | Scores an opportunity against a weighted rubric → ranked verdict | RICE / ICE / weighted scoring |
| 🧨 **Teardown** | Competitive teardown of rivals → white space + differentiation wedge | Competitive analysis / Porter's five forces |
| 🧪 **Prototype Brief** | Converts validated problem into a one-page rapid-prototyping brief | Rapid prototyping / design sprints |

### Role 2 — Check / vet innovation (audit)
| Box | What it does | Method / focus |
|-----|--------------|----------------|
| ❤️ **Desirability Check** | Audits whether customers actually want it → Strong/Weak/Unproven | The Mom Test / willingness-to-pay |
| 📏 **Market Size Sanity Check** | Reconstructs bottom-up TAM/SAM/SOM, flags inflated numbers | Market sizing / "billion-dollar TAM" fallacy |
| 🚧 **Feasibility Gate** | Audits technical + operational feasibility (Go/Conditional/Blocked) | Telecom feasibility / build-vs-buy |
| 🛰️ **Risk Radar** | Risk & uncertainty review (likelihood, impact, mitigation) | Pre-mortems / risk matrices |
| ⚖️ **FTO Scan** | Flags patent/freedom-to-operate red flags (not legal advice) | FTO / IP basics / standards-essential patents |

### Role 3 — Assistant (guidance)
| Box | What it does |
|-----|--------------|
| 🧭 **Innovation Coach** | Guides the innovator: picks a method, frames a hypothesis, recommends next steps |
| 🔀 **Pivot-or-Persevere** | Synthesises all the checks into an evidence-based Pivot/Persevere/Kill decision |

> **Minimum viable tool:** at least **3 boxes — one from each role** (e.g. Pain Miner + Feasibility Gate + Innovation Coach) that chain together in a working pipeline. A working, well-researched 3-box tool beats a broken 6-box one.

---

## 4. How the boxes fit together (the demo pipeline)

The three roles form a **loop**: design → check → guide. Your demo should show a complete flow:

```
💡 Idea ──▶ Market Pulse ──▶ Pain Miner ──▶ Opportunity Scorecard ──▶ Prototype Brief
                                                                          │
                                                                          ▼
        Desirability Check ──┐                                    Feasibility Gate
        Market Size Sanity ──┼──▶ Pivot-or-Persevere ◀── Risk Radar
        FTO Scan ────────────┘

        🧭 Innovation Coach (floating guide, query at any step)
```

Each box plugs into AI Canva through the **shared scaffold** (3 touchpoints):
1. `types.ts` — register the box (name, icon, colour, default prompt)
2. `boardStore.ts` — the `runBox` branch (what happens on Run)
3. `BoxNode.tsx` — (optional) custom rendering (scorecard table, risk matrix, verdict card)

---

## 5. Deliverables

### A. Working tool (Build — 40%)
- [ ] At least 3 boxes (one per role) wired into the scaffold
- [ ] A working demo pipeline (design → check → assistant)
- [ ] Clean, readable, commented code; runs locally (`npm run dev`)

### B. Research & design report (40%)
A team report (e.g. 3,000–4,000 words) covering:
1. **Problem & motivation** — how could AI help Telstra's Innovation Lab innovate faster?
2. **Domain research** — the innovation methods you used (Lean Startup, JTBD, design thinking, rapid prototyping, FTO).
3. **Design rationale** — why your boxes, prompts, and outputs are designed the way they are.
4. **Alternatives** — other approaches (manual, GRC/innovation tools, generic AI) and why your tool adds value.
5. **Ethics & limits** — hallucinated market data, fabricated customer pains, false IP reassurance, the weight of a kill decision, and the guardrails you built in.
6. **Team reflection** — how each skill contributed.

### C. Demo & teamwork (20%)
- A live demo of the tool on a realistic Telstra innovation scenario
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
- [ ] Lock team roles (UX / BA / Dev / Domain)
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
- [ ] Prepare the live demo on a realistic innovation scenario
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
| **Domain research** (8%) | Deep, current, well-cited innovation methods | Solid sources | Few sources |
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
- **Innovation-method accuracy matters** — the domain/business member(s) must verify the tool's advice is sound. A market-size figure or FTO claim that's wrong is a real error, not a cosmetic one.
- **Be honest about limits** — acknowledge where AI innovation advice is *not* trustworthy (it can hallucinate market data, invent customer pains, and it is not a patent attorney).
- **Every skill contributes to research AND build** — no one is "just the coder" or "just the designer."

---

## 9. Good luck

You're building a tool that could genuinely help Telstra's Innovation Lab move from idea to prototype faster, with better evidence. The combination of your skills — UX, analysis, development, and business/innovation expertise — is exactly what a real innovation squad looks like. Design it well, build it soundly, and justify every choice.
