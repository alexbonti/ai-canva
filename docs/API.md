# Backend API

The API surface is identical between the **local Express server** (`server/`) and the
**Firebase Cloud Function** (`functions/`). The client talks to it through the `/api` prefix
(proxied by Vite during development, or rewritten to the Cloud Function in production).

> **Security note:** These endpoints are **not authenticated** today. Anyone who can reach the
> server/function can trigger paid AI generations. Rate-limit or protect them before exposing a
> public deployment (see [OSS_READINESS.md](OSS_READINESS.md)).

## Endpoints

### `GET /api/health`

Lightweight health check. Returns which API keys are configured.

**Response**

```json
{
  "status": "ok",
  "ollamaKey": "configured" | "missing",
  "falKey": "configured" | "missing",
  "stitchKey": "configured" | "missing"
}
```

### `POST /api/generate`

Generate text via the **Ollama** backend. Used by all text-based AI boxes (Research, Summarize,
PRD, Dev Plan, Slides, Code, UI Design).

**Request body**

```json
{
  "systemPrompt": "string (optional, defaults to 'You are a helpful assistant.')",
  "userPrompt": "string (required)"
}
```

**Response** — `200`

```json
{
  "content": "string",
  "model": "deepseek-v4-flash",
  "usage": { "promptTokens": 120, "completionTokens": 450, "totalTokens": 570 }
}
```

`usage` reports the model's **token usage** for this call (`promptTokens` = input, `completionTokens`
= output) from Ollama's `prompt_eval_count` / `eval_count`. The client displays this per box and
persists it to Firestore (see "Token usage" below).

**Errors**

| Status | When |
|--------|------|
| `400` | `userPrompt` missing or not a string |
| `500` | Ollama call failed (e.g. missing `OLLAMA_API_KEY`) |

The model defaults to `deepseek-v4-flash` and can be overridden with `OLLAMA_MODEL`. Requests go to
`{OLLAMA_HOST}/api/chat` (default `https://ollama.com` for Ollama Cloud) authenticated with
`OLLAMA_API_KEY`.

### Token usage persistence

Token usage is recorded **client-side** (the client already knows the authenticated user), in two
places in Firestore:

- `tokenUsage/{autoId}` — one doc per call with `userId`, `boardId`, `boxId`, `boxType`, `model`,
  `promptTokens`, `completionTokens`, `totalTokens`, `createdAt`. Detailed history / aggregation.
- `usageTotals/{uid}` — per-user **rolling totals** (`promptTokens`, `completionTokens`,
  `totalTokens`, `updatedAt`) updated atomically via Firestore `increment`, so concurrent calls
  don't lose updates. The header's ⚡ count reads this.

Rules: a user can create/read their own `tokenUsage` docs and read/write their own `usageTotals`
doc. The admin function reads aggregate totals via the Admin SDK (bypasses rules).

### `POST /api/generate-image`

Generates a cartoon profile image with fal.ai. Used by the **Cartoon Profile** box.

- With `imageUrl` → image-to-image via `fal-ai/qwen-image-edit`.
- Without `imageUrl` → text-to-image via `fal-ai/flux/schnell`.

**Request body**

```json
{
  "prompt": "string (optional; defaults to 'Cartoon style profile picture')",
  "imageUrl": "string (optional; a public URL or base64 data URL)"
}
```

**Response** — `200`

```json
{ "imageUrl": "string" }
```

**Errors**

| `400` | Neither `prompt` nor `imageUrl` provided |
| `500` | fal.ai call failed (e.g. missing `FAL_KEY`) |

### `POST /api/stitch-generate`

Generates a UI screen with Google Stitch. Used by the **Stitch UI** box.

**Request body**

```json
{ "prompt": "string (required)" }
```

**Response** — `200`

```json
{
  "html": "string",
  "imageUrl": "string"
}
```

**Errors**

| `400` | `prompt` missing or not a string |
| `500` | Stitch call failed (e.g. missing `STITCH_API_KEY`) |

### `GET /api/admin/stats`

Admin-only. Returns system-wide usage stats (users, boards, storage). Requires the caller to be
an admin (a doc must exist at `admins/{uid}`) and to send a Firebase ID token.

**Auth**

```
Authorization: Bearer <Firebase ID token>
```

**Response** — `200`

```json
{
  "generatedAt": 1234567890,
  "users": { "total": 42, "activeLast5m": 3, "newLast7d": 5 },
  "boards": { "total": 12, "newLast7d": 2 },
  "storage": { "bytes": 123456, "files": 8 },
  "tokens": { "promptTokens": 1000, "completionTokens": 4500, "totalTokens": 5500 }
}
```

**Errors**

| Status | When |
|--------|------|
| `401` | Missing or invalid ID token |
| `403` | Caller is not an admin |
| `500` | Stats computation failed |
| `501` | Local dev server (admin stats are production-only) |

> **Note:** This endpoint is only implemented in the **Cloud Function** (`functions/`), which uses
> the Firebase Admin SDK. The local dev server (`server/`) returns `501` because it has no service
> account. Stats are computed server-side so sensitive aggregates are never exposed to client
> Firestore rules.
>
> **User counts:** `total` and `newLast7d` are counted from **Firebase Auth** (`listUsers`), the
> authoritative source of registered users. `activeLast5m` counts users whose `lastActive`
> heartbeat (written by the client to the `users` collection) is within the last 5 minutes.

### `GET /api/admin/users?pageToken=...`

Admin-only. Lists registered users from Firebase Auth (paginated, up to 200 per page).

**Auth**

```
Authorization: Bearer <Firebase ID token>
```

**Response** — `200`

```json
{
  "users": [
    {
      "uid": "abc123",
      "email": "user@example.com",
      "displayName": "Jane Doe",
      "photoURL": "https://...",
      "disabled": false,
      "createdAt": "2024-01-01T12:00:00.000Z",
      "lastSignIn": "2024-05-01T12:00:00.000Z"
    }
  ],
  "nextPageToken": "token-or-null"
}
```

Pass `nextPageToken` in `?pageToken=` to fetch the next page.

**Errors:** `401` missing/invalid token, `403` not an admin, `500` failure.

### `POST /api/admin/users/:uid/status`

Admin-only. Blocks (`{ "disabled": true }`) or unblocks (`{ "disabled": false }`) a user's account
via `auth.updateUser`. An admin cannot block their own account.

**Auth:** same `Authorization: Bearer <Firebase ID token>`.

**Request body**

```json
{ "disabled": true }
```

**Response** — `200`

```json
{ "uid": "abc123", "disabled": true }
```

**Errors**

| Status | When |
|--------|------|
| `400` | Trying to block your own account |
| `401` | Missing/invalid token |
| `403` | Not an admin |
| `404` | User not found |
| `500` | Update failed |

---

## Environment variables

| Variable            | Required for      | Description                                    |
| ------------------- | ----------------- | ---------------------------------------------- |
| `OLLAMA_API_KEY`    | Text boxes        | Ollama Cloud API key (https://ollama.com/settings/keys) |
| `OLLAMA_MODEL`      | Optional          | Model name (default `deepseek-v4-flash`)      |
| `OLLAMA_HOST`       | Optional          | Ollama host (default `https://ollama.com`)     |
| `FAL_KEY`           | Cartoon box       | fal.ai API key                                 |
| `STITCH_API_KEY`    | Stitch UI box     | Google Stitch API key                          |
| `PORT`              | Optional (server) | Preferred server port (default `3001`)         |

Copy the templates from `server/.env.example` / `functions/.env.example` into `.env` and fill in
real values.
