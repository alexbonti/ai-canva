# Direction round — AI Canva redesign (2026-10-25)

Mode: workspace = **Operate**, landing = **Persuade**. Platform web. Build path: **code-led**
(no image generation available). Seed: `seed:01128499d098bf97` (assigned index 4).

## Grounded list (ordered by resonance)

1. **Sheet set** — an architectural drawing set: paper white, ultramarine linework, safety-orange
   markup, title blocks and sheet numbers. Why: pipelines are issued sets of drawings; each
   artifact is a sheet with a revision. Look: white ground, hairline black/blue linework, condensed
   caps labels, sheet-number strip on every box.
2. **Card catalogue** — the library drawer: manila cards, typewriter labels, provenance stamps,
   "see also" references. Why: the board is the record; every box is a catalogued artifact.
   Look: manila ground, ink typewriter labels, oxblood index rules, punched hole.
3. **Museum wall** — exhibition labels on a warm white wall: object first, tombstone label second.
   Why: artifacts and provenance are the product. Look: warm white, large display type, tiny
   tombstone labels with type/model/date/tokens.
4. **Transit line + timetable** ← ASSIGNED — a printed route diagram on cream timetable paper:
   deep pine signage shell, marigold signal, station codes, hairline timetable rules. Why: the
   pipeline is a line with stops, states and a "you are here". Look: cream paper, pine ink,
   per-category line colors, tabular figures.
5. **Risograph workshop** — two overprint inks on cream stock: fluorescent pink + teal, halftone
   fields, registration marks, chunky grotesk. Why: workshop/student culture; areas can overprint.
6. **Field guide plates** — numbered plates with serif captions, fine rules, margin notes. Why:
   each box is a specimen with a plate number. Look: cream, serif captions, ink rules.
7. **Call sheet / storyboard** — production schedule: condensed caps, tabular times, scene slates.
   Why: the board is a shooting schedule. Look: paper, black ink, highlighter accents.

## Assigned direction — "Line"

**World:** public transport diagram + printed timetable.

**Why it resonates:** product teams already navigate a pipeline; a transit line makes sequence,
interchange and arrival legible at a glance without adding a single new control.

**The world gives four things only (Operate rule):**
- **Type:** Archivo (signage grotesk, tabular figures) for UI and display; IBM Plex Mono for station
  codes, token counts, versions and timestamps. Labels in small uppercase caps, 1.5 tracking.
- **Palette:** cream timetable paper (#F4EFE4), card stock (#FFFCF5), pine ink (#14201B) and deep
  pine shell (#123229); marigold signal (#F2B300) for the one primary action and selection;
  per-category line colors (input marigold, SDLC oxblood, worker blue, companion coral, collab
  green, custom violet). State colors (running blue, error red, stale amber) sit on top.
- **Density:** hairline 1px rules, 2-line box headers, tabular numerals, small labels.
- **Signature move — the route:** connections render as thick transit lines with a station knot at
  the target; selecting a box lights its route end-to-end and dims the rest of the network.

**First viewport (app):** pine app bar with a roundel mark, board title as the line name, small-caps
actions; cream canvas with a faint dot grid; boxes as cream cards with a category line tab, station
code (`RES-02`), status chip and a mono token footer; palette panel in cream with category line
swatches; a selected box's route lit in its line color while other edges recede.

**First viewport (landing):** cream paper, a huge Archivo headline set as a timetable caption, and
a real route map as the hero object — Idea → Research → PRD → Code drawn as a line with station
cards and one artifact panel; the nav is a cream strip with pine type, no gradient, no glass.

**Raises (from the hand it beat, named by donor):**
- **Focus path** (vertical-feed challenger): selecting a box dims every unrelated route, so the
  selected line owns the board.
- **Hairline density** (Japanese high-density challenger): 1px rules, tight 2-line headers, compact
  metadata, no 28px icon tile padding out every palette row.
- **Committed land** (zoo-map challenger): Areas are flat committed color fields with the paper
  showing through, named like a park zone — not pastel rectangles with a border.
- **Change holds** (boarding-pass challenger): a changed state (running/error/stale) keeps its
  signal color and label until re-read; it never silently fades to neutral.
- **Scale contrast** (type-specimen challenger): tiny mono labels against one large display line —
  the board title and landing headline carry the scale; UI labels stay small.
- **Type as a code** (Saville challenger, declined): box type appears once — station code + line
  color — never the emoji/label/type/status chorus.

**Honest risk:** the transit diagram is a designer cliché. It earns its place only if the route is
functional (selection, states, sequence) and the typography is precise; color must be systematic
(one line per category) or the board turns into a toy map.

## Challenger verdicts (decided before borrowing)

| # | Challenger | Verdict | Kept discipline |
|---|------------|---------|-----------------|
| 1 | Vertical video feed | declined | focus path |
| 2 | Boarding pass + gate board | competitive | change holds / mono tabular |
| 3 | Japanese high-density | declined | hairline density |
| 4 | Zoo & gardens guide map | competitive | committed flat land |
| 5 | Saville catalogue sleeve | declined | type as a code |
| 6 | Variable font specimen | declined | scale contrast |

## Pick card — "Sheet set"

My top-ranked grounded direction (not assigned). White drafting paper, ultramarine ink, safety
orange markup; every box is a sheet with a number and a title block; connections are leader lines.
Honest risk: familiar to design/engineering audiences and adjacent to blue-on-white design tools.

## Standing exit

The category standard, played straight at full fidelity: calm neutral canvas, one accent, soft
cards, Linear/Figma-level restraint. Available, never recommended.
