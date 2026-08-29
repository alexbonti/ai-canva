# AI Canva — Project Memory

This file is auto-loaded into the AI agent's context at the start of every session (DeepSeek
Harness reads `AGENTS.md` / `CLAUDE.md` from the project root). It captures durable project
knowledge so it survives across sessions. Keep it current — it is the first thing an agent reads.

## What this project is

**AI Canva** is a collaborative, AI-powered whiteboard for building visual AI pipelines. Users
place "boxes" on a React Flow canvas, connect them, and run AI prompts that flow content from box
to box — from an Idea, through Research, to PRD / Slides / Code / UI Design / Stitch UI.

- **Client:** React + Vite + React Flow canvas, Zustand store, Tailwind CSS.
- **Backend:** Node/Express for local dev; the same API packaged as a Firebase Cloud Function for
  production.
- **AI providers:** Ollama (LLM text), fal.ai (image generation), Google Stitch (UI screens).
- **Persistence & collaboration:** Firebase — Google Auth, Firestore (boards, presence, live
  cursors), Storage (board images). localStorage is an offline cache.

## Repository layout

| Path | Purpose |
|------|---------|
| `client/` | React + Vite frontend. Entry `client/src/`, store at `client/src/store/boardStore.ts`. |
| `server/` | Local Express dev backend (`/api/generate`, `/api/generate-image`, `/api/stitch-generate`, `/api/health`). |
| `functions/` | Same API as a Firebase Cloud Function (`onRequest`) for production. Also hosts `src/stitchJobs.ts` (the async Stitch Cloud Task worker). |
| `scripts/deploy.sh` | One-command production deploy (build client, build Functions, deploy Hosting + Functions + rules). |
| `docs/` | Guides: `OVERVIEW`, `ONBOARDING`, `ARCHITECTURE`, `BOX_TYPES`, `API`, `DEPLOYMENT`, `OSS_READINESS`, plus `docs/course/` teaching materials. |
| `firebase.json`, `firestore.rules`, `storage.rules` | Firebase config and security rules. |

## Key commands

```bash
npm run dev            # run server + client together (concurrently)
npm run dev:server     # local Express backend only
npm run dev:client     # Vite client only
npm run install:all    # npm install in both server/ and client/
npm test               # run server + client unit tests (Vitest)
npm run test:watch    # watch mode for both server and client tests
npm run deploy         # = bash scripts/deploy.sh (production Firebase deploy)
```

## Architecture notes

- **Two backends, one API surface.** The API logic is duplicated in `server/` (local Express) and
  `functions/` (Cloud Function) because Cloud Functions runs in the Firebase environment while the
  local server runs in Node. Both use the same SDKs. Keep them in sync when changing endpoints.
- **Single Zustand store** (`client/src/store/boardStore.ts`) owns the whole board: `nodes`/`edges`
  (React Flow graph), `boxData` (per-box content/prompts/status/output — kept separate from the
  graph objects so it serializes cleanly to Firestore), and board/collaboration metadata.
- **`runBox(id)`** is the orchestrator: gathers upstream inputs from incoming edges, builds
  `NamedInput[]` for prompt templating, then branches by box type (cartoon → fal.ai, stitch →
  Google Stitch, slides → Ollama + JSON parsing, code/ui → Ollama + code extraction, else Ollama
  text).
- **Stitch is asynchronous.** Stitch generation is slow (40s+) and exceeded the ~60s Firebase
  Hosting rewrite timeout, so the deployed box previously reported "Request failed" even though the
  screen was created in Stitch. `POST /api/stitch-generate` now returns a `jobId` immediately; the
  client polls `GET /api/stitch-status/:jobId` until the job is `done`/`error`. The client-side
  `generateStitchUI(prompt)` in `client/src/lib/api.ts` hides this (start + poll). Local dev uses an
  in-memory job store in `server/src/app.ts`; production uses Firestore (`stitchJobs/{jobId}`, no
  client access) plus a Cloud Task worker `processStitchJob` in `functions/src/stitchJobs.ts`.
  `stitch.ts` caps prompt length (6000) and uses the fast `GEMINI_3_FLASH` model (`STITCH_MODEL`).
  Keep the two backends' stitch endpoints in sync.
- **Local server is split for testability.** `server/src/app.ts` exports `createApp()` (the Express
  app + all routes + the in-memory stitch job store) with **no side effects at import**;
  `server/src/index.ts` is the bootstrap that calls `createApp()`, finds a port, writes
  `.server-port`, and listens. Write route tests against `createApp()` via supertest instead of
  starting the server.
- **Client pure logic lives in `client/src/lib/`** and is unit-tested: prompt templating
  (`prompts.ts`), code/HTML wrapping (`code.ts`), slides JSON parsing (`slides.ts`), and Firestore
  save serialization (`serialization.ts`). `boardStore.ts` imports these rather than inlining them.
- **Prompt templating** references connected inputs by name: `{{Box Name}}`, `{{input_1}}`,
  `{{inputs}}`.
- **11 box types:** Idea, Image, Research, Summarize, PRD, Dev Plan, Cartoon Profile, Slides, Code,
  UI Design, Stitch UI. A "custom" category is reserved on the sidebar for future boxes.

## Admin board

Admins can view system-wide usage (total users, active users, new users/boards in 7 days, storage
used) via an "Admin" button in the header.

- **Admin designation:** a doc at `admins/{uid}` marks a user as admin (add it manually via the
  Firebase console or a script). The client reads `admins/{uid}` (rules allow self-read) to show the
  Admin button; the server re-verifies.
- **User tracking:** the client writes `users/{uid}` on login (email, displayName, photoURL,
  `createdAt`, `lastActive`) and heartbeats `lastActive` every ~60s. This powers the "active now"
  metric.
- **Stats endpoint:** `GET /api/admin/stats` (see `docs/API.md`). It verifies the caller's ID token
  + admin role, then computes: total/new users from **Firebase Auth** (`listUsers`), active users
  from the `users` collection heartbeat, board counts via Firestore `count()`, and storage usage
  via the Admin SDK.
- **User management:** the admin board also lists all users and can block/unblock accounts:
  `GET /api/admin/users` (paginated) and `POST /api/admin/users/:uid/status` (`{ disabled }`),
  which call `auth.listUsers` / `auth.updateUser`. An admin cannot block their own account.
- **Admin auth helper:** `requireAdmin(req)` in `functions/src/index.ts` verifies the ID token +
  admin role for all `/api/admin/*` routes.

## Token usage tracking

The app reports per-call LLM token usage and tracks cumulative usage per user and across the system.

- **Source:** Ollama's non-streaming `/api/chat` response includes `prompt_eval_count` (input) and
  `eval_count` (output). `generateContent` in both `server/src/ollama.ts` and `functions/src/ollama.ts`
  returns `{ content, model, promptTokens, completionTokens, totalTokens }`, and `/api/generate`
  returns those counts under `usage`.
- **Per-box display:** each text AI box stores `tokens` in its `BoxData` and shows "in · out / total
  tok" in the box footer after running.
- **Persistence (client-side):** after each successful generate, the client writes a detailed
  `tokenUsage/{autoId}` doc (userId, boardId, boxId, boxType, model, prompt/completion/total,
  createdAt) and atomically bumps the user's rolling total in `usageTotals/{uid}` via Firestore
  `increment` (so concurrent calls don't lose updates).
- **Cumulative in the header:** `client/src/store/tokenStore.ts` (non-persisted) holds the logged-in
  user's session total, seeded from `usageTotals/{uid}` on login and incremented as calls run. A ⚡
  badge in the header shows it.
- **Admin aggregate:** `/api/admin/stats` sums `usageTotals` across all users and returns
  `tokens: { promptTokens, completionTokens, totalTokens }`, shown as a card in the AdminBoard
  Overview.
- **Per-user admin view:** `GET /api/admin/users` joins each user with their `usageTotals` doc and
  returns per-user `tokens`. The AdminBoard Users tab shows "Tokens ⬆" (input / `promptTokens`) and
  "Tokens ⬇" (output / `completionTokens`) columns — kept separate because they cost differently.
- **Rules:** a user can create/read their own `tokenUsage` docs and read/write their own
  `usageTotals` doc; the admin function reads aggregates via the Admin SDK.
- **Production-only:** the endpoint is implemented in `functions/` (uses `firebase-admin`). The
  local `server/` returns `501` because it has no service account — this is an **intentional
  deviation** from the server/functions duplication rule.
- **Client files:** `client/src/lib/admin.ts` (isAdmin/profile/heartbeat/fetchAdminStats) and
  `client/src/components/AdminBoard.tsx` (the dashboard UI).

## Testing (Vitest)

- **Run all:** `npm test` (server then client). **Watch:** `npm run test:watch`.
- **Server tests** (`server/src/*.test.ts`, supertest + Vitest): hit `createApp()` from
  `server/src/app.ts` with the AI modules (`ollama`/`fal`/`stitch`) mocked via `vi.mock`; they cover
  route validation, response shaping, the stitch job flow, and `generateContent` token parsing.
  Server test files are excluded from the `tsc` build via `exclude` in `server/tsconfig.json` — do
  not remove that.
- **Client tests** (`client/src/lib/*.test.ts`): pure functions only (prompts, code, slides,
  serialization) — no DOM, no Firebase. `client/vitest.config.ts` (node env) loads instead of
  `vite.config.ts` to avoid the dev-server proxy + build chunks.
- **No functions/ tests yet** — they need the Firebase emulator / Admin SDK; keep API logic in sync
  between `server` and `functions` by hand and cover the shared logic via `server` tests.

## Conventions & gotchas

- **Adding a new box type:** see `docs/BOX_TYPES.md` and `docs/course/05_how_to_build_a_box.md`.
- **Role filter (palette profiles):** each box type carries `roles: BoxRole[]`
  (`everyone`/`designer`/`developer`/`product`) in `client/src/types.ts`; the role chips in
  `Sidebar.tsx` filter which boxes appear in the "Add Box" palette. This is a discovery-only label —
  a pure UI filter, never a permission. Add sensible `roles` tags when adding a box; see
  `docs/BOX_TYPES.md`.
- **Landing page:** the logged-out entry is a full marketing page in
  `client/src/components/landing/` (`LandingPage.tsx` composes `LandingNav`, `LandingHero`,
  `LandingHowItWorks`, `LandingFeatures`, `LandingBoxes`, `LandingRoles`, `LandingCTA`,
  `LandingFooter`). It reuses `BOX_TYPES` for the box showcase, uses a `Reveal` scroll-fade wrapper
  (`useReveal.ts`), and keeps the dark indigo/cyan theme from `index.css` (`.landing-bg`,
  `.gradient-text`, `.glass-card`). `App.tsx` renders it when `!user`.
- **Code editor:** the Code / UI / Stitch boxes use an editable CodeMirror 6 editor
  (`client/src/components/CodeEditor.tsx`, `@uiw/react-codemirror` + `@codemirror/lang-javascript`
  + `@uiw/codemirror-theme-vscode`). It is **lazy-loaded** via `React.lazy` in `BoxNode.tsx` so
  CodeMirror (~500KB) is only fetched when a code box's Code tab opens. Edits call
  `updateBoxData(id, { code })` (Firestore save is already debounced 1s in `boardStore.ts`), so
  edits persist and the iframe preview reflects them live. A **⛶ Maximise** button on code boxes
  opens `client/src/components/CodeModal.tsx` — a full-screen split view (editable code left, live
  preview right) rendered via `createPortal` to `document.body` so it escapes React Flow's
  transformed node container. Both `CodeEditor` and `CodeModal` are lazy-loaded.
- **Real-project preview (Code box):** the `code` box type previews generated code as a **real
  React project** via Sandpack (`@codesandbox/sandpack-react`, `client/src/components/SandpackPreview.tsx`,
  lazy-loaded) using the lightweight **`react` template** (runtime environment — the heavier
  `vite-react` template fails to connect its bundler on localhost). `client/src/lib/project.ts`
  transforms the single generated JSX into a multi-file project: `toSandpackFiles` (for Sandpack:
  `/App.js`, `/index.js`, `/public/index.html`, `/package.json`, `/styles.css`) and `toReactProject`
  (a Vite project for StackBlitz). Both strip the `ReactDOM.createRoot` render call and add a React
  import. The `ui`/`stitch` boxes still use the lightweight CDN iframe preview. An **⚡ Open in
  StackBlitz** button (`@stackblitz/sdk`, `sdk.openProject`) opens the same project in a full IDE.
  `project.ts` is unit-tested in `client/src/lib/project.test.ts`. Note: Sandpack only sizes its
  inner preview to the provider wrapper's height — pass `style={{ height }}` to `SandpackProvider`
  in `SandpackPreview.tsx` (not just to `SandpackPreviewView`), or the preview collapses to a small
  default and the app is clipped to the top of the box. StackBlitz note: `toReactProject` (used by
  `toStackBlitzProject`) must use **non-leading-slash** file paths (`"App.jsx"`, `"index.jsx"`, …)
  because WebContainers throws `path should be a path.relative()'d string, but got "/"` on leading-slash
  keys, which made StackBlitz open blank (code never imported). Sandpack's `toSandpackFiles` still uses
  leading slashes (`/App.js`) — keep the two transforms' path conventions separate.
- **Code box: generated code MUST end up with a default export.** The box's system prompt makes the
  model "define a component called App" but never ask for an `export`. If the generated `App.js`
  has no default export, the Sandpack/StackBlitz entry's `import App from "./App"` resolves to
  `undefined`, and the preview iframe shows Sandpack's overlay **"Element type is invalid ...
  got: object ... mixed up default and named imports"**. `ensureDefaultExport()` in
  `client/src/lib/project.ts` appends `export default App;` (deduped) in both `toSandpackFiles` and
  `toReactProject` so the preview always resolves. Keep that guarantee when changing the transforms.
- **Lazy-load gotcha (shared chunks):** `SandpackPreview.tsx` is lazy-imported from **two** places
  (`BoxNode.tsx` and `CodeModal.tsx`), so Vite bundles it as a **shared chunk** whose module-namespace
  object is re-exported and picked up by the lazy transform as
  `import("./SandpackPreview-<hash>.js").then(c => c.k)` where `c.k` is `{ default: SandpackPreview }`.
  React 19 **always evaluates a lazy to the resolved value's `.default`** (`React.lazy` returns
  `payload._result.default`), so the **bare form is the correct one**:
  `lazy(() => import("./SandpackPreview.js"))`. It resolves to `{ default: Component }` and React
  unwraps the component fine. **Do NOT** wrap the import in `.then((m) => m.default)` — that resolves
  to the *bare component*, and React then reads `{Component}.default` → `undefined`, crashing with
  `"Element type is invalid. Received a promise that resolves to: undefined."` and a white/render-broken
  screen. This `.then()` "fix" regresses BOTH dev and prod even though the pre-fix bundle looked broken
  for other reasons. When a lazy import misbehaves, verify the resolved chunk export (`c.<named>` is
  `{ default: Comp }`) before assuming you must unwrap by hand — a bare `lazy(() => import("..."))`
  is the safe default.
- **Client Firebase config** lives in `client/src/lib/firebase.ts` (hardcoded `firebaseConfig`).
  For open hosting, prefer `VITE_FIREBASE_*` env vars at build time (see `docs/OSS_READINESS.md`).
- **Deploying:** follow `docs/DEPLOYMENT.md` or the `ai-canva-deploy` skill
  (`.dsh/skills/ai-canva-deploy/SKILL.md`). Requires Firebase CLI logged in and real API keys
  (Ollama, optionally fal.ai + Google Stitch).
- **Keep `server/` and `functions/` API logic in sync** — they are intentionally duplicated.

## Docs to keep in mind

- `docs/ARCHITECTURE.md` — deep dive into client, backend, and Firebase layers.
- `docs/API.md` — backend endpoints and environment variables.
- `docs/DEPLOYMENT.md` — production deploy steps.
- `docs/course/` — teaching/learning materials (briefs + how-to guides, each also as an HTML
  handout for print/PDF).

## Maintenance rule (IMPORTANT)

**Update this file whenever a feature is implemented or the architecture/conventions change.**
This file is the durable project memory that agents load at the start of every session. When you
add, change, or remove a feature, keep this file in sync in the same change:

- Add/update the box type, endpoint, directory, or command that changed.
- Update the box-type list, architecture notes, or conventions if they changed.
- Keep the "Repository layout" and "Key commands" tables accurate.

If a change is too small to warrant a doc update, at least note it here so the knowledge is not
lost. Treat this file as living documentation, not a static snapshot.
