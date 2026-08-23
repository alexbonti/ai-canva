# Cybersecurity & Compliance Support Tool — Group Project Brief

> **Course:** AI-Assisted Software Project · **Project type:** Group
> **Team:** 4–5 members with complementary skills — **UX, Business Analyst (BA), Developer(s), Cybersecurity**
> **Tool:** AI Canva, repurposed as a **cybersecurity & compliance support tool**
> **Weighting:** Build 40% · Research & Design 40% · Teamwork & Demo 20%

---

## 1. Overview

Your team will turn **AI Canva** — a visual pipeline tool where users place "boxes" on a canvas and AI content flows box-to-box — into a **cybersecurity & compliance support tool**.

The tool helps people who need to:
- **Design** security policies and cybersecurity use cases / project proposals, and
- **Check / vet** those use cases and proposals against real standards and frameworks.

The tool provides three kinds of boxes:
1. **Design boxes** — help author a use case (asset inventory, threat model, policy draft, security requirements).
2. **Check boxes** — audit/vet a use case against frameworks (NIST, ISO 27001, OWASP, GDPR, risk scoring, gap analysis).
3. **An assistant** — a tailored AI assistant that guides users through designing and checking.

> **Example use case:** A team is "moving customer data to a new cloud vendor." The tool helps them: map the assets involved → model the threats → draft a policy → check it against NIST/GDPR → score the risk → and an assistant guides them through each step.

---

## 2. The team & how skills divide the work

This is a **group project** — you build the tool together, and each member contributes through their skill. The work is split by role, not by "who codes the most."

| Role | Skill focus | What they own in the project |
|------|-------------|------------------------------|
| **UX** | Design, usability, accessibility | The canvas experience, box UI, how a non-expert navigates the tool, the assistant's conversation design, demo polish |
| **Business Analyst (BA)** | Requirements, process, research | The use-case design boxes, the research/justification, mapping user needs to features, the project's requirements doc |
| **Developer(s)** | Code, integration, AI wiring | Implementing the boxes in code (`types.ts`, `runBox`, `BoxNode`), wiring the AI backend, making it all run |
| **Cybersecurity** | Security domain expertise | The check boxes (NIST/GDPR/OWASP/risk), threat modeling, ensuring the tool's security advice is technically sound |

> **Key principle:** everyone contributes to the *research and design* (the "why"), and everyone contributes to the *build* (the "how"). The role split is about **ownership and depth**, not isolation — you review each other's work.

---

## 3. What the tool must do (feature set)

Your team builds a working tool with **at least one box from each of the three roles**, and ideally more. The full menu your team can choose from:

### Role 1 — Design use cases (authoring)
| Box | What it does | Framework |
|-----|--------------|-----------|
| 🛡️ **Asset Mapper** | Turns a proposal into an asset & data inventory (classified by sensitivity/criticality) | ISO 27001 / NIST 800-30 |
| 🧠 **Threat Modeler** | Applies STRIDE to produce threats, attack vectors, mitigations | STRIDE / MITRE ATT&CK |
| 📜 **Policy Drafter** | Drafts a security policy with purpose, scope, roles, clauses | SANS / NIST 800-53 |
| 🔐 **Security Requirements Elicitor** | Extracts testable "SHALL" security requirements | CIA / SQUARE / ASVS |
| 🚨 **Incident Response Planner** | Drafts an IR plan following the incident lifecycle | NIST 800-61 / SANS PICERL |

### Role 2 — Check use cases (audit / vet)
| Box | What it does | Framework |
|-----|--------------|-----------|
| ✅ **NIST CSF Checker** | Audits against the 5 NIST functions, produces coverage + gaps | NIST CSF |
| 🌍 **GDPR Compliance Checker** | Vets against GDPR obligations + DPIA triggers | GDPR |
| 🕸️ **OWASP ASVS Auditor** | Audits an app against ASVS levels + Top 10 | OWASP ASVS / Top 10 |
| 🎯 **Risk Scorer** | Scores risk (likelihood × impact), produces a risk register | NIST 800-30 / FAIR |
| 🧩 **Gap Analyzer** | Compares against a target framework, produces a gap report | ISO 27001 / SOC 2 / CIS |

### Role 3 — Assistant (guidance)
| Box | What it does |
|-----|--------------|
| 🤝 **Security Advisor** | Interviews the user and recommends the right next box / next step |
| 🧭 **Compliance Navigator** | Helps choose the right framework for the context (industry, data, geography) |

> **Minimum viable tool:** your team must deliver **at least 3 boxes — one from each role** (e.g. Asset Mapper + NIST Checker + Security Advisor) that chain together in a working pipeline. More boxes = more depth, but a working, well-researched 3-box tool beats a broken 6-box one.

---

## 4. How the boxes fit together (the demo pipeline)

The three roles form a **loop**: design → check → guide. Your demo should show a complete flow:

```
💡 Idea (raw proposal)
   └─▶ 🛡️ Asset Mapper (design) ──▶ 🧠 Threat Modeler (design) ──▶ 📜 Policy Drafter (design)
                                                                     └─▶ ✅ NIST Checker (check)
                                                                     └─▶ 🎯 Risk Scorer (check)
   └─▶ 🤝 Security Advisor (assistant)  ← guides the user at any step
```

Each box plugs into AI Canva through the **shared scaffold** (the same 3 touchpoints):
1. `types.ts` — register the box (name, icon, colour, default prompt)
2. `boardStore.ts` — the `runBox` branch (what happens on Run)
3. `BoxNode.tsx` — (optional) custom rendering (risk matrix, checklist, score badge)

Because every box speaks the same `{{inputs}}` language, any box plugs into any pipeline.

---

## 5. Deliverables

### A. Working tool (Build — 40%)
- [ ] At least 3 boxes (one per role) wired into the scaffold
- [ ] A working demo pipeline (design → check → assistant)
- [ ] Clean, readable, commented code
- [ ] The tool runs locally (`npm run dev`)

### B. Research & design report (40%)
A team report (e.g. 3,000–4,000 words) covering:
1. **Problem & motivation** — who needs a cybersecurity/compliance support tool, and why?
2. **Domain research** — the frameworks you used (NIST, ISO, GDPR, OWASP…) and why they matter.
3. **Design rationale** — why your boxes, prompts, and outputs are designed the way they are.
4. **Alternatives** — other approaches (manual, GRC tools, consultants) and why your tool adds value.
5. **Ethics & limits** — the danger of AI giving security/compliance advice (false assurance, legal weight, hallucinated controls) and the guardrails you built in.
6. **Team reflection** — how each skill contributed, what you learned.

### C. Demo & teamwork (20%)
- A live demo of the tool on a real use case
- Evidence of collaboration (PRs, reviews, task tracking)

---

## 6. Sprints & timeline

The project runs over **3 sprints, 8 weeks total**. Each student can work **10 hours per week** (80 hours total per student; a team of 4–5 has ~320–400 team-hours).

| Sprint | Duration | Hours/student | Focus |
|--------|----------|---------------|-------|
| **Sprint 1** | 2 weeks (starting today) | 20 hrs | Research, team roles, box selection, scaffold |
| **Sprint 2** | 3 weeks | 30 hrs | Main build — implement the boxes |
| **Sprint 3** | 3 weeks | 30 hrs | Finish build, research report, demo |

### Sprint 1 — Research & scaffold (2 weeks, 20 hrs)
- [ ] Lock team roles (UX / BA / Dev / Cyber)
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
- [ ] Prepare the live demo on a real use case
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
| **Demo** (10%) | Compelling live demo on a real use case | Demo works | Demo weak/fails |

### Research & Design (40%)
| Criteria | Excellent | Good | Needs work |
|----------|-----------|------|------------|
| **Problem & motivation** (8%) | Precise, clearly argued | Stated, general | Vague |
| **Domain research** (8%) | Deep, current, well-cited frameworks | Solid sources | Few sources |
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
- **Cybersecurity accuracy matters** — the cyber member(s) must verify the tool's security/compliance advice is technically sound. A wrong NIST control ID or a misjudged GDPR obligation is a real error, not a cosmetic one.
- **Be honest about limits** — the best projects acknowledge where AI security advice is *not* trustworthy (e.g. it can't truly verify code, it can hallucinate control IDs, it's not legal advice).
- **Every skill contributes to research AND build** — no one is "just the coder" or "just the designer."

---

## 9. Good luck

You're building a tool that could genuinely help people make better security decisions. The combination of your skills — UX, analysis, development, and cybersecurity — is exactly what a real security product team looks like. Design it well, build it soundly, and justify every choice.
