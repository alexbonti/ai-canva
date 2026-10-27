# Quality review — 2026-10-26

Scope: the whole product after the "Printed Line" redesign (workspace + landing), local only —
**no deploy was run**. Method: automated suites + axe + bundle/perf measurement + manual render
review of every box type.

## Fixed in this pass

| Area | Finding | Fix |
|---|---|---|
| UI Design boxes | Preview tab + 💾 Save wrapped the stored full HTML page in the React/Babel wrapper → blank preview ("Unexpected token"), downloaded file nested `<html>` inside `text/babel`. | `BoxNode` now branches on `isFullHtmlDocument()` (raw page for HTML; wrapper only for legacy React `code`), matching `lib/deploy.ts`. Regression-tested by `.impeccable/audit-fixes.mjs`. |
| Diagnostics | Store save/snapshot `console.log` ran in production; the first cleanup attempt introduced a recursive `debugLog` helper (infinite stack) — caught by the marker suite. | DEV-only `debugLog` = `console.log` behind `import.meta.env.DEV`; verified. |
| Accessibility | axe: `meta-viewport` (no zoom), `color-contrast` (cream 0.50 on pine = 4.14:1 at 11 px), `label-title-only` (palette select), `region` (palette + help card not landmarks). | Viewport `viewport-fit=cover` (zoom enabled), cream ≥ 0.58, `<label htmlFor>`, `<aside aria-label>` + `role="complementary"`. **0 violations** on 5 scans. |
| Design-system drift | 74 off-system classes in `BoxNode` (`slate-*`, `bg-white`, `rounded-lg`, `shadow-sm`, `border-2`), blue prompt chip, raw error hexes. | Migrated to tokens; `error-wash`/`error-wash-hover`/`error-line` added; printed disabled-button state. |
| Performance | Landing (logged out) downloaded React Flow + markdown chunks; font swap caused CLS 0.0256. | Lazy `Workspace` (sole `ReactFlowProvider` importer) + lazy dashboards; preloaded Archivo woff2. **496 → 423 KB transferred, LCP 124 ms (localhost preview), CLS 0, 0 long tasks**. |
| Motion | The app had no `prefers-reduced-motion` handling (route march, save pulse, running pulse, chatbot bob). | Added a reduced-motion block in `index.css` (state colours/dashes stay, movement stops); landing already had one. |
| Hygiene | Dead CSS (`.rule-t`, `.rule-b`, `.ring-signal`, unused status dots); missing favicon/SEO tags. | Removed (CSS 87.6 → 85.5 KB); added favicon, description, OG/Twitter meta. |
| Dependencies | `npm audit`: server had 1 critical (`proxy-addr`) + 9 others. | `npm audit fix` (28 packages, non-breaking) → **server 0 vulnerabilities**; tests green. |

## Verified

- Types: `tsc --noEmit` clean in `client/` and `server/`.
- Unit: **380/380** (305 client + 75 server).
- UI regression: `client/ui-smoke.mjs` **84/84** (SDLC gates, stale invalidation, Audit/Save downloads, reload persistence, Code Map digest).
- E2E text markers: `▶ Run`, `💾 Save`, `▭ Area`, `⏹ Stop`, `Boards (` intact.
- Render: all 27 box types mount, zero page errors; manual screenshots of image/slides/documents/agent/research/SDLC/settings reviewed — one visual world, no cool-grey leftovers.
- axe: **0 violations** landing 1440/390/tablet + workspace palette open/closed.
- Detector: source scan returns only two `overused-font` warnings for the **legacy React preview wrapper**
  in `lib/code.ts` (a sandboxed iframe for generated user content that pulls Inter from Google Fonts —
  not product chrome); landing/workspace scan only the accepted cream-palette finding.
- Build: production `vite build` OK (2.6 s, dist 4.7 MB incl. fonts/PDF worker); landing bundle measured
  above (423 KB / 7 requests / 515 DOM nodes / 5 MB heap); app boots from a clean `npm run dev`
  (API health `ok`, Vite 5173 200).
- API parity: `server/` and `functions/` expose the same 12 routes; local health OK.

## Accepted / known (not defects)

- Cream-palette detector warning — the committed brand direction.
- Client audit keeps 4 highs inside `@grpc/grpc-js` (Firebase's Node transport, not in the browser bundle; requires a Firebase major bump).
- Admin/Facilitator dashboards type-checked but not exercised live (need real roles).
- Landing hero left-column whitespace at 1440 and the station-description clamp — cosmetic, accepted in the design review.
- `firebase` + a small React Flow helper chunk still load on the landing page because `App` imports `boardStore`; accepted tradeoff (the heavy Canvas tree is not downloaded).

## Reproduce

```bash
npm run dev                                   # http://localhost:5173, API :3001
npx tsc --noEmit -p client && npx tsc --noEmit -p server
npm test                                      # 380
cd client && node ui-smoke.mjs                # 84
cd .impeccable && node check-markers.mjs && node audit-a11y.mjs && node audit-render.mjs && node audit-fixes.mjs
cd client && npm run build && npx vite preview --port 4173   # perf: node .impeccable/audit-perf.mjs
```
