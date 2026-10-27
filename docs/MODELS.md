# Models — single source of truth

One page answering "which AI model handles which part of the app, how do I switch it, and what
has changed." If you change a model, **update the table and append to the change log below**.

---

## The model map (current)

| Concern | Used by | Provider | Model | Override | Defined in |
|---------|---------|----------|-------|----------|------------|
| **All text generation** | Research, Summarize, PRD, Dev Plan, Slides, Code, UI Design, Agent, Chatbot, custom boxes, agent run-box calls | Ollama (Cloud **or** local daemon) | `deepseek-v4.1-flash:1017` *(default — no override set)* | `OLLAMA_MODEL` | `server/src/ollama.ts` + `functions/src/ollama.ts` |
| **UI screens** | Stitch UI box | Google Stitch (Gemini under the hood) | first working id from `STITCH_MODEL_CANDIDATES`: `GEMINI_3_5_FLASH_LITE` → `GEMINI_3_8_FLASH` → provider default | `STITCH_MODEL` (tried first) | `server/src/stitch.ts` + `functions/src/stitch.ts` |
| **Image, image→image** | Cartoon Profile box (when an Image box is connected) | fal.ai | `fal-ai/qwen-image-edit` | none — hardcoded | `server/src/fal.ts` + `functions/src/fal.ts` |
| **Image, text→image** | Cartoon Profile box (no Image box connected) | fal.ai | `fal-ai/flux/schnell` | none — hardcoded | `server/src/fal.ts` + `functions/src/fal.ts` |

> There is currently **no Anthropic / OpenAI usage anywhere in the code**. An unused
> `ANTHROPIC_API_KEY` that had been sitting in `server/.env` / `functions/.env` was removed on
> 2026-02-08 — if you ever wire up another provider, document it in this file.

## Provider configuration

### Ollama (text)
- **Endpoint:** `POST {OLLAMA_HOST}/api/chat` (streamed NDJSON, accumulated server-side).
- **Auth:** `Bearer OLLAMA_API_KEY` (cloud key from https://ollama.com/settings/keys). With
  `OLLAMA_HOST=http://localhost:11434` and no key, it talks to a local Ollama daemon instead.
- **Transport:** the call is **streamed** (`stream: true`, NDJSON) and accumulated server-side into
  one reply. A non-streamed long generation dies at ~60s (`fetch failed` / "remote end closed")
  because nothing keeps the connection alive — which is exactly what the 8–30k-token UI/Code replies
  trigger. The 300s deadline covers the whole generation; the browser still gets one JSON response.
- **Generation:** `options.num_predict: 32 768`; system + user message per call. The budget is
  deliberate: Code-box JSX replies reach ~10k tokens and vary run to run, and the old 8192 (then
  16 384) cap truncated verbose rolls mid-component (no `ReactDOM.createRoot` line → the box
  reported "code is incomplete"). The model stops with `done_reason: "stop"` when finished, so a
  higher ceiling costs nothing for a normal reply. `/api/generate` reports `truncated` when Ollama
  stopped with `done_reason: "length"`; the client turns that into a clear "ran out of output space"
  message instead of accepting partial code. Since 2026-10-23 the **UI Design box no longer asks for
  JSX**: it simplifies the request into a brief and then builds ~200 lines of plain HTML (~3k tokens,
  ~10 s), so it stays far below the cap.
- **Reasoning (`think`):** `deepseek-v4.1-flash:1017` is a **thinking** model — its reasoning arrives
  in the stream's `message.thinking` (never in `content`) and is counted in `eval_count`, so a 30k
  character reply can report ~23k output tokens. Both `ollama.ts` copies accept `GenerateOptions
  { think?: boolean }`, and `POST /api/generate` forwards an optional `think` field from the body.
  The UI Design box sends `think: false` for its brief, build and AI-change calls (measured on the
  same request: 64 s / 22.8k tokens with thinking vs 8 s / 3.3k without, same page quality; with it
  off the reply also stops wrapping the file in prose/fences). Other boxes keep the provider
  default (thinking on).
- **Tokens:** read from the response's `prompt_eval_count` / `eval_count` and reported back as
  `usage` on `/api/generate`.
- **Env vars:** `OLLAMA_API_KEY`, `OLLAMA_HOST` (default `https://ollama.com`), `OLLAMA_MODEL`
  (default `deepseek-v4.1-flash:1017`).

### Google Stitch (UI screens)
- **Auth:** `STITCH_API_KEY`.
- **Model ids are not stable.** The Stitch API validates `modelId` against a server-side enum that
  changes without an SDK release: `GEMINI_3_FLASH` (the old default) is now retired and rejected
  with "Request contains an invalid argument" — which silently broke the Stitch UI box. `stitch.ts`
  therefore tries the env override, then `GEMINI_3_5_FLASH_LITE`, then `GEMINI_3_8_FLASH`, then the
  provider default, remembers the first id that works, and retries transient stream drops once on a
  fresh SDK client. If Stitch changes models again, edit `STITCH_MODEL_CANDIDATES` in both backends;
  no SDK upgrade is required.
- **Prompt is capped at 6000 chars** so real pipelines (whole Research boxes piped in) don't
  produce a written spec instead of a UI screen.
- **Async:** the endpoint returns a `jobId`; the client polls (in-memory job store locally,
  Firestore + Cloud Task worker in production).

### fal.ai (images)
- **Auth:** `FAL_KEY`. Uploaded data-URLs go to fal storage first (the edit model needs a real URL).
- Image-to-image: `num_inference_steps: 30`, `guidance_scale: 4`.

## How to switch a model

1. **Local dev** — set the env var in `server/.env` (gitignored), restart `npm run dev`:
   ```bash
   OLLAMA_MODEL=<model-id>
   ```
   Verify with any box run: `/api/generate` responses echo the `model` used, and the box footer
   shows the token counts for that call.
2. **Production** — set the same var in `functions/.env` (note: `scripts/deploy.sh` only copies
   `OLLAMA_API_KEY` from `server/.env` — anything else you must add yourself), then `npm run deploy`.
3. **Changing a hardcoded default** — the API logic is **intentionally duplicated** between
   `server/` and `functions/` (see `AGENTS.md`): a default change must be made in **both** copies
   (`server/src/ollama.ts` *and* `functions/src/ollama.ts`, same for `fal.ts`/`stitch.ts`). The fal
   model IDs have no env override — editing both files is the only way.

## Where model usage is recorded (runtime observability)

- `/api/generate` and `/api/generate-image` responses include the `model` that served the call.
- The client writes a `tokenUsage/{id}` Firestore doc per successful call storing
  `model`, `boxType`, and prompt/completion/total tokens — so "what did we actually run" is
  queryable per user/board/call.
- Per-box token badges and the Admin board's token aggregates build on those docs.

## Choosing models for a live demo (booth)

- Prefer a **fast** text model — booth visitors give you ~5 minutes; first-call latency matters.
  Override locally via `OLLAMA_MODEL` without touching code.
- Keep Stitch out of the critical path (40s+); cartoons via `flux/schnell` are the quick visual
  payoff.

## Change log

- **2026-10-23** — **UI Design / Code output truncation fixed end to end.** Output budget
  8192 → **32 768** tokens, and the Ollama call now **streams** (`stream: true`, NDJSON accumulated
  server-side): a non-streamed 32k reply died at ~61s with `fetch failed` (remote end closed), so a
  bigger budget alone made long runs fail. `/api/generate` reports `truncated`, the client says the
  reply ran out of output space instead of accepting partial JSX, long-form client deadlines went to
  5 min and the production `api` function timeout to 300 s. Verified live: a 10-section dashboard
  design generated 27 646 tokens in 73 s (backend) / 25 260 tokens in 69 s (real box, complete
  preview).
- **2026-10-23** — Default text model pinned to **`deepseek-v4.1-flash:1017`** (a specific build
  tag of the same model — same behaviour, pinned revision). Changed the hardcoded default in both
  `server/src/ollama.ts` and `functions/src/ollama.ts`; `OLLAMA_MODEL` still overrides it. Verified
  live in dev: `/api/generate` echoes `"model":"deepseek-v4.1-flash:1017"`.
- **2026-09-13** — **Stitch UI box fixed.** Google retired the `GEMINI_3_FLASH` model id; every
  Stitch run failed with "Request contains an invalid argument" (the SDK's enum types are stale).
  `stitch.ts` now tries a candidate list (env override → `GEMINI_3_5_FLASH_LITE` →
  `GEMINI_3_8_FLASH` → provider default), retries a transient stream failure once, and creates a
  fresh `StitchToolClient` per attempt (the shared singleton transport dies after one failure).
  Verified live: `/api/stitch-generate` returned real HTML.
- **2026-02-08** — Default text model changed `deepseek-v4-flash` → **`deepseek-v4.1-flash`**
  (hardcoded default in both `server/src/ollama.ts` and `functions/src/ollama.ts`; env templates
  and docs updated to match). **Deployed to `carbondocs` the same day — verified live:**
  `POST /api/generate` on https://carbondocs.web.app responds with
  `"model":"deepseek-v4.1-flash"`.
- **2026-02-08** — Documented the initial state: text = Ollama `deepseek-v4-flash` (default),
  Stitch = `GEMINI_3_FLASH`, fal.ai = `fal-ai/qwen-image-edit` / `fal-ai/flux/schnell`. No env
  overrides active. Removed the unused `ANTHROPIC_API_KEY` from `server/.env` / `functions/.env`.