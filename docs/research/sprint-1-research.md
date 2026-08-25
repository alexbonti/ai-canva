# Sprint 1 Research

## Team research question

How can an AI-assisted whiteboard workflow help a non-specialist turn an early cloud application idea into clearer security requirements, identify likely gaps against the NIST Cybersecurity Framework, and receive cautious next-step guidance?

## User scenario and box data flow

**Target user:** A university researcher or small project owner planning a cloud application that will handle sensitive data, but who is not an Azure or cybersecurity specialist.

**Scenario:** The user describes their proposed application and the data it will handle. The workflow helps them clarify security requirements, identify areas that may need further attention, then presents clear next actions. It is guidance only and does not claim to provide a compliance assessment or replace professional security advice.

**Working flow:**

1. **Security Requirements Elicitor** receives a plain-language application description and returns draft functional, non-functional and security requirements, plus follow-up questions where information is missing.
2. **NIST CSF 2.0 Gap Checker** receives the application description and/or the drafted requirements. It returns relevant NIST CSF functions or categories, possible gaps, and questions or next actions. It must not claim that the application is compliant or non-compliant.
3. **Security Advisor** receives the application description and the prior outputs. It returns prioritised, plain-language security recommendations, clearly noting uncertainty, assumptions and the need for human review.

---

## Security Requirements Elicitor

### Current working box brief

- **Intended user:** A project owner with an early idea for a cloud application.
- **Purpose:** Turn an informal app description into a clearer set of draft security requirements and follow-up questions.
- **Input:** Plain-language description of the app, users, data and proposed cloud services.
- **Output:** Draft functional, non-functional and security requirements, plus follow-up questions.
- **Guardrails:** State assumptions. Do not invent system facts. Treat the output as a draft for human review.
- **Draft prompt direction:** Ask concise clarification questions first if key details are missing, then structure the draft requirements by category.

### Sources

#### Source 1

- **Citation and link:**
- **Finding (1-2 sentences):**
- **Design use (1 sentence):**

#### Source 2

- **Citation and link:**
- **Finding (1-2 sentences):**
- **Design use (1 sentence):**

#### Source 3

- **Citation and link:**
- **Finding (1-2 sentences):**
- **Design use (1 sentence):**

---

## NIST CSF 2.0 Gap Checker

### Current working box brief

- **Intended user:** A project owner who wants to understand which security areas should be considered for a proposed application.
- **Purpose:** Map the supplied description or requirements to relevant NIST CSF 2.0 areas and highlight likely gaps or questions.
- **Input:** Application description and/or draft requirements from the Security Requirements Elicitor.
- **Output:** Relevant NIST CSF functions or categories, possible gaps, and suggested next questions or actions.
- **Guardrails:** Do not present results as an audit, certification or compliance decision. Explain that the result depends on the supplied information.
- **Draft prompt direction:** Identify relevant NIST CSF 2.0 areas, distinguish missing information from an actual gap, and use plain language.

### Sources

#### Source 1

- **Citation and link:**
- **Finding (1-2 sentences):**
- **Design use (1 sentence):**

#### Source 2

- **Citation and link:**
- **Finding (1-2 sentences):**
- **Design use (1 sentence):**

#### Source 3

- **Citation and link:**
- **Finding (1-2 sentences):**
- **Design use (1 sentence):**

---

## Security Advisor

### Current working box brief

- **Intended user:** A non-specialist who needs understandable security next steps after reviewing their proposed application.
- **Purpose:** Convert the earlier outputs into a prioritised list of practical security recommendations.
- **Input:** Application description plus the outputs from the Requirements Elicitor and NIST Gap Checker.
- **Output:** Prioritised recommendations, short explanations and suggested next actions.
- **Guardrails:** Make assumptions visible. Avoid absolute safety claims. Direct the user to a qualified human or official guidance for high-risk decisions.
- **Draft prompt direction:** Prioritise the most important actions, explain why they matter, and indicate where more information or human review is needed.

### Sources

#### Source 1

- **Citation and link:**
- **Finding (1-2 sentences):**
- **Design use (1 sentence):**

#### Source 2

- **Citation and link:**
- **Finding (1-2 sentences):**
- **Design use (1 sentence):**

#### Source 3

- **Citation and link:**
- **Finding (1-2 sentences):**
- **Design use (1 sentence):**

---

## Evidence and hand-off

- Add this document to Git in a pull request before the end of Sprint 1.
- Link the relevant commit or pull request in each Planner card.
- Box owners should use their completed brief when scaffolding their box in Week 3.
