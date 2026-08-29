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
| `functions/` | Same API as a Firebase Cloud Function (`onRequest`) for production. |
| `scripts/deploy.sh` | One-command production deploy (build client, build Functions, deploy Hosting + Functions + rules). |
| `docs/` | Guides: `OVERVIEW`, `ONBOARDING`, `ARCHITECTURE`, `BOX_TYPES`, `API`, `DEPLOYMENT`, `OSS_READINESS`, plus `docs/course/` teaching materials. |
| `firebase.json`, `firestore.rules`, `storage.rules` | Firebase config and security rules. |

## Key commands

```bash
npm run dev            # run server + client together (concurrently)
npm run dev:server     # local Express backend only
npm run dev:client     # Vite client only
npm run install:all    # npm install in both server/ and client/
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
  `createdAt`, `lastActive`) and heartbeats `lastActive` every ~60s. This powers the user counts and
  "active now" metric.
- **Stats endpoint:** `GET /api/admin/stats` (see `docs/API.md`). It verifies the caller's ID token
  + admin role, then computes counts via Firestore `count()` and storage usage via the Admin SDK.
- **Production-only:** the endpoint is implemented in `functions/` (uses `firebase-admin`). The
  local `server/` returns `501` because it has no service account — this is an **intentional
  deviation** from the server/functions duplication rule.
- **Client files:** `client/src/lib/admin.ts` (isAdmin/profile/heartbeat/fetchAdminStats) and
  `client/src/components/AdminBoard.tsx` (the dashboard UI).

## Conventions & gotchas

- **Adding a new box type:** see `docs/BOX_TYPES.md` and `docs/course/05_how_to_build_a_box.md`.
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
