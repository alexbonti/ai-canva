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
{ "content": "string" }
```

**Errors**

| Status | When |
|--------|------|
| `400` | `userPrompt` missing or not a string |
| `500` | Ollama call failed (e.g. missing `OLLAMA_API_KEY`) |

The model defaults to `deepseek-v4-flash` and can be overridden with `OLLAMA_MODEL`. Requests go to
`{OLLAMA_HOST}/api/chat` (default `https://ollama.com` for Ollama Cloud) authenticated with
`OLLAMA_API_KEY`.

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
