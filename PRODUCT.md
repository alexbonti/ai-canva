# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Small product teams and the people inside them — product/PM, design, engineering — plus workshop
cohorts (a facilitator running a session, guests joining with a code). They work on a large shared
canvas, often on a laptop or iPad, sometimes side by side in a room. The job: take an early,
unformed idea and turn it into real artifacts (research, PRD, plan, deck, prototype, design) without
losing the thread of how they got there.

## Product Purpose

AI Canva is a collaborative AI whiteboard where each "box" is a step in a pipeline. Users place
boxes on a React Flow canvas, connect them, and run AI prompts whose output flows from box to box —
idea → research → PRD / slides / code / UI design. Success: a team can see the whole path from raw
idea to a shippable artifact on one board, together, and every artifact keeps its provenance.

## Positioning

The pipeline is visible and shared. Unlike a chat window, the work is laid out spatially: each step
is a box you can see, connect, re-run and hand to someone else; each downstream artifact is built
from what upstream boxes actually produced. Boxes also cover the SDLC stages (intent → spec → plan
→ implementation → review → merge) with human gates, so the board is the record, not just the
scratchpad.

## Operating Context

- Real-time multiplayer board: presence cursors, a roster, shared notes/checklists/timers.
- Boxes are run individually; long generations (up to 5 min) with streaming token accounting.
- Workshop mode: facilitator dashboard, templates, teams, seat codes, guest accounts without email.
- Frequently used on iPad (touch, hover-gated controls, scroll inside boxes).
- Offline/local mode exists (localStorage) — board saves are debounced and shown by a save status.
- The app is one long-lived canvas screen; side panels and modals are secondary surfaces.

## Capabilities and Constraints

- 26 built-in box types + user-created custom boxes; categories input / sdlc / worker / companion /
  collab / custom.
- React Flow canvas with boxes, connections, areas (background grouping rectangles), notes, labels,
  timers, checklists, and a Chatbot companion that lives on the board.
- AI providers: Ollama (text), fal.ai (images), Google Stitch (UI screens), here.now (publishing).
- Artifacts: markdown documents, slides, React code (Sandpack preview), self-contained HTML pages,
  patches, images — previewed, edited, versioned, downloadable, deployable.
- Roles are discovery filters, never permissions. Admin and facilitator are real permission layers.
- All UI strings the E2E suite clicks are load-bearing (e.g. `Boards (`, `New Board`, `Add Box`,
  `▶ Run`, `▶ Start`, `⏹ Stop`, `▭ Area`, `How to use`, palette labels as trailing text).
- The two backends (`server/`, `functions/`) are intentionally duplicated; the redesign must not
  change API behavior.

## Evidence on Hand

No real customer logos, testimonials, benchmarks or press. The landing page must not invent
commercial claims; demonstration boards may use clearly synthetic, plausible product content.
The box types, their outputs and the SDLC gates are real and can be shown truthfully.

## Product Principles

1. **The board is the record.** Every visual decision should help a newcomer read what happened and
   what comes next without opening anything.
2. **The work is the interface.** AI output, artifacts and states are the content; chrome stays
   quiet and gets out of the way.
3. **Familiar controls, distinctive surface.** Standard affordances for standard tasks; the
   product's character lives in type, palette, density and one signature move — never in invented
   controls.
4. **Built for a room and a tablet.** Legible at a glance, touch-sized, multiplayer-aware.
5. **Nothing is faked.** No invented proof, no decorative filler where an artifact belongs.

## Accessibility & Inclusion

- Standard focus rings on every control, keyboard-reachable menus (outside-click/Escape contract).
- Text contrast must hold for long reading sessions; touch targets on coarse pointers.
- No motion that hides content or blocks the task; no autoplay.
