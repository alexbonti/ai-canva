# Finish review — "The Printed Line" redesign (2026-10-25)

Scope: workspace canvas + landing page. Direction locked in `direction-round.md` (#4, transit line +
timetable). System committed in `DESIGN.md` / `.impeccable/design.json`. Local trial only; nothing
deployed.

## Evidence

- Screenshots: `.impeccable/review/line-board.png`, `line-card.png`, `line-box-*.png` (incl.
  `line-box-image.png`, `line-box-code-tab.png`, `line-box-code-preview.png`,
  `line-box-checklist-empty.png`), `line-landing-desktop-hero.png`,
  `line-landing-desktop-full.png`, `line-landing-mobile-hero.png`, `line-landing-mobile-full.png`,
  `line-annotations.png`, `line-tablet.png`, `line-empty.png`.
- Mechanical detector (`impeccable detect`, URL scan of the running landing page):
  - source scan of `client/src/components client/src/index.css client/src/landing.css` → `[]`
  - `http://localhost:5173` @ 1440×900 → 1 finding: `cream-palette` (accepted, below)
  - `http://localhost:5173` @ 390×844 → 1 finding: `cream-palette` (same)
- Regression net: `tsc --noEmit` clean, **305/305** client unit tests, `ui-smoke.mjs` **84/84**,
  `check-markers.mjs` all exact E2E text markers true.

## Craft-floor audit (after the fix pass)

| Rule | Verdict | Evidence |
|---|---|---|
| No gradients / glass / glows / bevels | ✅ | flat paper fills, hairline borders, one flat shadow on floating chrome only |
| No coloured `border-left` rails | ✅ | category colour lives in the station dot, header wash, edge line, palette icon |
| No emoji / unicode glyphs as UI icons | ✅ | every chrome icon is `ui/Icon.tsx` (Lucide, 1.75 stroke); timer, Run, Area, slide nav, delete, help copy and menu marks all SVG now. Legacy glyphs survive only inside `sr-only aria-hidden` spans so E2E text markers stay exact |
| Mono only for codes / counts / times | ✅ | `.data-mono` for station codes, token counts, timers, versions; body/labels in Archivo |
| Marigold ≤ 5 % of surface | ✅ | Share / one primary CTA / signal marks / focus ring only; on mobile the nav keeps only Sign in so one marigold CTA shows at a time |
| Hairlines over shadows | ✅ | `--rule` 1px everywhere; cards nearly flat |
| One loud display line | ✅ | workspace: board title; landing: "Build AI pipelines." |
| Category colour only | ✅ | `LINE_COLORS` per category; no per-type rainbow |
| Functional text ≥ 11 px | ✅ | `.label-caps`/`.data-mono` 11 px; landing body ≥ 11.5–12 px; code blocks exempt |

Accepted finding: **cream-palette** (page background `#F4EFE4`). This is the committed brand
direction chosen in the direction round (printed timetable paper); deliberate and consistent across
app + landing.

## Fixes applied after the fresh-context review

1. Unicode glyphs replaced by icons — `▶ Run`, timer `Start/Pause/Stop/Resume`, `▭ Area`, `✕`
   delete, slide `▶`, help-copy `▶`/`⚙`/`●`, menu `●`; marker-bearing controls keep the glyph in an
   `sr-only` span so `textContent` is still exactly `▶ Run` / `⏹ Stop` / `▭ Area`.
2. Emoji chrome removed — `📁 Change Image` → image icon, `👁 Preview` → eye icon, boot splash
   `🎨` on slate-900 → pine ground with the transit roundel.
3. Old-system drift removed inside boxes — dropzones are paper-raised with a dashed hairline (no
   emerald hover, no `border-2`), code/preview tabs share one pine/cream recipe, prompt fields use
   one marigold focus ring (no blue/pink), CodeMirror frame pine-deep, Sandpack preview light.
4. Checklist empty state prints `0 tasks` once, hides the 0 % rule, and shows a single first-task
   line.
5. Checklist no longer repeats the ticker name when it equals the assignee.
6. Role columns say `N in view` instead of an ambiguous `N / 26`.
7. Timer and checklist progress rules both use the collab line colour (marigold stays signal-only).
8. Chatbot auto-placement clamps to the canvas area left of the open palette panel.
9. `DESIGN.md` responsive wording matches the real behaviour (collapse to a tab, not automatic).
10. Landing: nav CTA hides below 900 px (hero owns the primary action), workshop entry is a
    full-width sticky bar on mobile with reserved bottom padding, footer meta at the 11 px floor,
    line-key count never breaks.

## Responsive / legibility

- 1440: no horizontal overflow; board columns non-overlapping; header holds at ~5 controls.
- 1024: canvas + palette work; first-run help card is the only overlay, dismissible.
- 390: single marigold CTA in view; hero stacks; route sheet stays legible (ruled station rows, not
  nested cards); workshop bar is one line and never hides the footer.
- Contrast: ink `#16211C` on paper `#F4EFE4` ≈ 13:1; muted `#66736A` ≈ 4.9:1 at 11–12 px.

## Findings

1. **nit — landing station description clamp:** a long description can end mid-thought in its
   two-line clamp. Cosmetic; `text-wrap: pretty` is on paragraphs.
2. **nit — hero left column** has empty space at 1440 because the route sheet is taller. Composition
   tradeoff of the printed-sheet hero; keeping it.
3. **accepted — Admin/Facilitator dashboards** are type-checked and field-reviewed but not visually
   smoke-tested (needs admin SDK / facilitator token).

## Disposition

**ship** — no blockers, no should-fix items left. Local trial on `http://localhost:5173`;
production deploy intentionally not run (user asked to try locally first).
