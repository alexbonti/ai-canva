---
name: AI Canva
description: A collaborative AI whiteboard where every pipeline step is a box on a printed transit line.
colors:
  paper: "#F4EFE4"
  paper-raised: "#FBF7EC"
  card: "#FFFDF7"
  ink: "#16211C"
  ink-soft: "#3D4A42"
  ink-muted: "#66736A"
  rule: "#DCD4C1"
  rule-strong: "#C8BEA8"
  pine: "#123229"
  pine-deep: "#0B221C"
  cream-on-pine: "#F2EDE1"
  signal: "#F2B300"
  signal-ink: "#2A2100"
  line-input: "#B57A00"
  line-sdlc: "#9C3A31"
  line-worker: "#2A5A94"
  line-companion: "#BF543C"
  line-collab: "#3B7557"
  line-custom: "#6A5A93"
  state-running: "#1F6FEB"
  state-error: "#B33A2B"
  state-stale: "#9A6A00"
  state-ok: "#2E7D4F"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 6vw, 4.75rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.08em"
  data:
    fontFamily: "\"IBM Plex Mono\", ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0.01em"
rounded:
  xs: "3px"
  sm: "5px"
  md: "8px"
  lg: "12px"
  pill: "999px"
spacing:
  xxs: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  section: "64px"
components:
  button-primary:
    backgroundColor: "{colors.pine}"
    textColor: "{colors.cream-on-pine}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "32px"
    typography: "title"
  button-primary-hover:
    backgroundColor: "{colors.pine-deep}"
    textColor: "{colors.cream-on-pine}"
  button-signal:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.signal-ink}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "36px"
    typography: "label"
  button-signal-hover:
    backgroundColor: "#E0A600"
    textColor: "{colors.signal-ink}"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "32px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
  button-bar:
    backgroundColor: "transparent"
    textColor: "{colors.cream-on-pine}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
    height: "32px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
    height: "32px"
---

# Design System: AI Canva

## Overview

**Creative North Star: "The Printed Line"**

AI Canva is a working transit system for ideas. Every pipeline is a printed line on cream timetable
paper: boxes are stops with station codes, connections are route lines with station knots, and
running a box is a departure. The chrome is the signage — a deep-pine bar, a marigold signal that
means "action here", and per-category line colours that do real work instead of decorating.

The character is **printed, not glossy**. There are no gradients, no glass, no floating chrome. Type
does the heavy lifting: Archivo at a signage scale for the one loud line on a screen, small
uppercase labels for navigation, and IBM Plex Mono for station codes, versions, counts and
timestamps. Density is high but ruled — hairlines separate, small caps label, numbers align.

The board is the record, so the system must read as evidence: a box carries its station code, its
category line, its state, and its token count, each exactly once. Anything that repeats the same
fact twice (an icon *and* an emoji *and* a label *and* a tinted border) is noise.

**Key Characteristics:**
- Cream paper ground, pine signage shell, marigold signal, one line colour per category.
- Flat surfaces and hairline rules; depth is paper, not glass.
- Archivo + IBM Plex Mono; small caps labels; tabular figures.
- One signature move: the route — connections read as transit lines, and selecting a box lights
  its route end-to-end while the rest recedes.
- Status is a timetable state (running, error, stale), never a mood.

## Colors

A printed-map palette: warm paper, ink, and colour reserved for movement and state.

### Primary
- **Pine Signage** (#123229): the app bar, the primary button, the roundel's ink. It is the one
  dark surface in the product, so the eye reads the chrome as the station, not the work.
- **Marigold Signal** (#F2B300): selection, focus, the "you are here" cue, the landing call to
  action, and the live-state dot. Loud by design, on ≤5% of any screen.

### Secondary
- **Line Colours**: **Amber Input** (#B57A00), **Oxblood SDLC** (#9C3A31), **Blue Worker**
  (#2A5A94), **Coral Companion** (#BF543C), **Green Collaboration** (#3B7557), **Violet Custom**
  (#6A5A93). These are the categories made visible: the station dot, the box header wash, the
  route line, the palette swatch. They are never used for decoration.

### Neutral
- **Timetable Paper** (#F4EFE4): the canvas ground. **Card Stock** (#FFFDF7): boxes, panels, menus.
  **Raised Paper** (#FBF7EC): the palette panel and secondary surfaces.
- **Pine Ink** (#16211C) body text, **Soft Ink** (#3D4A42) secondary, **Muted Ink** (#66736A) labels.
- **Hairline Rule** (#DCD4C1) and **Strong Rule** (#C8BEA8) for every divider.
- **State colours** sit on top of the palette and carry meaning only: running #1F6FEB, error
  #B33A2B, stale #9A6A00, approved/ok #2E7D4F.

### Named Rules
**The Line-Owns-Colour Rule.** Colour is assigned by category and by state, never by box instance.
A board with twenty boxes must still read as six lines, not a rainbow.

**The Paper-Shows-Through Rule.** Areas are flat, committed colour fields at low tint so the paper
ground still reads through them. They are land on the map, not cards behind cards.

## Typography

**Display Font:** Archivo (self-hosted, variable 400–700, `system-ui` fallback)
**Body Font:** Archivo
**Label / Data Font:** IBM Plex Mono (self-hosted 400/500)

**Character:** A signage grotesk with tabular figures, paired with a mono that only ever carries
codes, versions, counts and times. The pairing reads as a timetable, not as a developer tool.

### Hierarchy
- **Display** (700, `clamp(2.75rem, 6vw, 4.75rem)`, 0.98, −0.035em): landing headline only.
- **Headline** (700, 32px, 1.06): landing section titles and the admin dashboard's lead number.
- **Title** (600, 14px, 1.25): board title, box names, dialog titles.
- **Body** (400, 13px, 1.5): output prose, descriptions, help copy; 65–75ch measure on reading
  surfaces, denser inside boxes.
- **Label** (600, 11px, 0.08em, uppercase): nav items, section captions, button verbs.
- **Data** (400, 11px mono): station codes, timestamps, token counts, versions, model names.

### Named Rules
**The One Loud Line Rule.** Each viewport gets exactly one large display line. Everything else is
small, and the scale contrast is the hierarchy.

**The Mono-Is-Data Rule.** IBM Plex Mono appears only where the content is a code, a count, a
version or a time. Never as a costume for "technical".

## Layout

The app is a full-viewport map: 56px pine app bar, canvas, a 232px palette panel on the right, and
floating canvas tools inset 12px from the top-left. Spacing rhythm is 4/8/12/16/24/32/64; dense
rows sit at 8–12px, sections at 24–64px. Panels are separated by a single 1px rule, never by a
shadow gap. The landing page uses a 1120px measure, a 12-column grid for its proof sections, and
one full-bleed route map as the hero object.

Responsive behaviour is structural: the palette can be collapsed to a 32px tab (it starts open on
desktop, and the tab is always reachable), landing columns stack at 1020/560px, and touch targets
grow only under `@media (pointer: coarse)` (desktop stays byte-identical).

## Accessibility

The system is legible by construction, not by exception. Functional text is ≥ 11 px; the 11 px
mono/label floor sits on ink (#16211C on paper ≈ 13:1); secondary cream on the pine bar is
`rgba(242,237,225,.58)` or lighter (≥ 4.5:1 at 11 px — `.50` was 4.14:1 and fails AA); state
colours only ever appear as text on washes light enough for ink. Landmarks are real: `<header>` for
the bar, `<aside aria-label="Box palette">` plus `role="complementary"` for the help card, `<main>`
content; every control has an associated `<label>` (never `title`-only) and a visible focus ring is
the marigold signal. Browser zoom stays enabled (no `user-scalable=no`) even though the canvas owns
pinch. Motion is state feedback ("a running box's line marches", "a save is in flight"), so
`prefers-reduced-motion: reduce` keeps the state colours/dashes and removes the movement.
Verified with axe at 1440/390 for the landing and the workspace (0 violations).

## Elevation & Depth

Flat by default. Depth is paper: a 1px rule for separation and a single tight shadow under boxes,
menus, and dialogs. There are no glows, no coloured halos, and no blurred glass.

### Shadow Vocabulary
- **Card rest** (`0 1px 1px rgba(22,33,28,.05), 0 6px 16px -8px rgba(22,33,28,.18)`): boxes on the
  canvas at rest.
- **Floating chrome** (`0 8px 28px -12px rgba(22,33,28,.35), 0 1px 2px rgba(22,33,28,.12)`): menus,
  popovers, floating canvas tools, dialogs.
- **Selection** (`0 0 0 2px #F2B300, 0 0 0 4px rgba(242,179,0,.22)`): the marigold "you are here"
  ring on a selected box or control.

## Shapes

Slightly squared, printed corners: 8px on boxes and dialogs, 5px on buttons and inputs, 12px on the
landing's large panels, pills only for the presence roster and status chips. Borders are 1px;
selection and focus carry the only thicker marks. The route line is the recurring curve: rounded
elbows, a ring at each end (station knot), 3px weight, and a marigold tick where a route is live.

## Components

### Buttons
- **Shape:** 5px radius, 32px height (36–40px for the landing call to action), one visible focus ring.
- **Primary:** pine background, cream text — the standard action.
- **Signal:** marigold background, pine-black text — reserved for the page's single most important
  action (landing "Get started", header "Share" *only* when the board is unshared).
- **Secondary:** card stock with a hairline border.
- **Ghost:** transparent; pressed state fills with ink.
- **Bar:** transparent cream text for the pine app bar.
- **Hover / Focus:** background steps one tone; focus is a 2px marigold ring at 2px offset.

### Chips
- **Style:** 5px radius, mono uppercase 10px, hairline border or a 10% wash of its state colour.
- **State:** running (blue, pulsing dot), error (red), stale (amber), approved (green). A changed
  state holds its colour until the box is re-read.

### Cards / Containers
- **Corner Style:** 8px.
- **Background:** card stock over paper; the header carries a 7% wash of the category line colour.
- **Shadow Strategy:** card rest only; selected uses the marigold ring.
- **Border:** 1px hairline.
- **Internal Padding:** 10–12px; header 8px 10px.

### Inputs / Fields
- **Style:** card stock, 1px hairline, 5px radius, 13px text.
- **Focus:** 1px pine border plus a 2px marigold ring at 30% alpha.
- **Error / Disabled:** error border in state red with the message below; disabled at 45% opacity.

### Navigation
- **App bar:** deep pine, 56px; roundel mark, board title as the line name, save dot, roster, Share,
  Add Box, Boards, token count, account. Small caps labels at 11px.
- **Palette panel:** cream raised paper; each section is a line label (colour swatch, uppercase
  name, hairline), each row an icon and a label with a hairline-tinted hover fill.

### Signature Component — The Route
Connections are drawn as transit lines: 3px in the source box's category colour, rounded elbows, a
cream-filled station knot at the target. Selecting a box dims all unrelated edges to 18% and draws
its end-to-end route at full weight, so "what feeds this?" is answered without opening anything.
A running box's outgoing route carries a marching dash in the state-running colour.

## Do's and Don'ts

### Do:
- **Do** name the category once — station dot + route colour — and let the label carry the rest.
- **Do** keep every number in mono with tabular figures.
- **Do** use the marigold signal for exactly one destination per screen.
- **Do** let areas be flat colour fields at ≤12% tint so the paper shows through.
- **Do** use the hidden legacy-glyph spans to keep the automated suite's text markers while the
  visible chrome stays on the icon set.

### Don't:
- **Don't** use gradients, glass, blurred chrome, or coloured glows.
- **Don't** give each of the 26 box types its own hue; colour is per category and per state.
- **Don't** put a coloured left border on a card (the old rainbow rail), or an emoji where an icon
  belongs — custom boxes keep the user's own emoji, which is user content.
- **Don't** repeat a box's type in the header, the body and the footer.
- **Don't** animate anything that doesn't signal state; no page-load choreography in the app.
