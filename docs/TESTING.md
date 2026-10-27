# Testing

The project uses **Vitest** for both the local server and the client. Tests are lightweight — pure
functions and route/API behavior — and run without a browser, Firebase, or network access.

## Running

```bash
npm test            # server tests, then client tests (one-shot)
npm run test:watch  # both in watch mode (concurrently)
```

Per package:

```bash
npm test --prefix server
npm test --prefix client
```

## What's covered

### Server (`server/src/*.test.ts`) — supertest + Vitest

- `app.test.ts` exercises `createApp()` (the Express router) directly via supertest:
  - validation (e.g. `POST /api/generate` without `userPrompt` → 400)
  - response shaping (`/api/generate` returns content + token usage)
  - the asynchronous stitch flow (`POST /api/stitch-generate` → `GET /api/stitch-status/:id`
    transitions `queued` → `done`)
  - `GET /api/admin/stats` returns `501` locally
  - External providers (`ollama`, `fal`, `stitch`) are mocked with `vi.mock` so no real calls are made.
- `ollama.test.ts` mocks `global.fetch` to cover `generateContent`:
  - token-count parsing (`prompt_eval_count` / `eval_count` → structured usage)
  - correct host / model / bearer auth in the request
  - non-OK and empty-response error paths

### Client (`client/src/lib/*.test.ts`) — pure functions

- `prompts.test.ts` — `fillPromptTemplate` (all variable forms) + `getBoxOutput`
- `code.test.ts` — `extractCode` (markdown fences) + HTML wrappers
- `slides.test.ts` — `parseSlidesResponse` (plain JSON, fenced, prose-wrapped, malformed)
- `serialization.test.ts` — `cleanBoxDataForFirestore` (strips `undefined` and base64 `imageData`)

## Live browser suites (need `npm run dev` up)

Not part of `npm test` — these drive the real app with playwright-core + system Chrome:

| Suite | What it proves | Needs |
|---|---|---|
| `client/ui-smoke.mjs` (84 checks) | SDLC gates, Code Map, Code Edit, code change requests, deploys, downloads — all mocked at the page level | dev app only |
| `client/demo-scripts.mjs` (40 checks) | the seven demo workflows in `docs/DEMOS.md` still produce what the guide promises | dev app only |
| `client/e2e.mjs` (106 checks) | real auth, real Firestore, cross-user sync, facilitator/guest flows | dev app + Firebase (Email/Password provider, fresh firebase-tools token) |

Run them from `client/`, e.g. `node demo-scripts.mjs` or `node ui-smoke.mjs`. See
`docs/DEMOS.md` → *Keeping the demos current* for what the demo suite asserts.

## Writing tests

- **Add a client test** next to the module, e.g. `client/src/lib/<name>.test.ts`. Keep it to pure
  logic; if the logic only exists inline in a component/store, extract it to a `lib/` module first
  (see `client/src/lib/slides.ts` and `serialization.ts` for examples).
- **Add a server test** in `server/src/*.test.ts`. Import `createApp` from `app.ts` and mock
  provider modules via `vi.mock`. Never start the server in a test.
- **Client test files** are type-checked by `tsc -b` as part of the build; cast test-only fixture
  objects (`as unknown as X`) if they aren't full typed shapes.
- **Server test files** are excluded from the production `tsc` build (`exclude` in
  `server/tsconfig.json`) — keep them under `server/src/` so Vitest picks them up.

## Coverage gaps / future work

- No tests yet for `functions/` — they require the Firebase emulator + Admin SDK.
- No React component / DOM tests (e.g. `boxStore.runBox` orchestration) — would need jsdom +
  mocking Firestore/auth.
- The shared logic between `server/` and `functions/` is intentionally duplicated; it is covered
  here via the `server` suite, so keep the two in sync when changing that logic.
