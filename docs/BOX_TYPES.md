# Box types reference

This document describes every box type. Metadata lives in `client/src/types.ts`
(`BOX_TYPES`), rendering in `client/src/components/BoxNode.tsx`, and the "run" behavior in
`client/src/store/boardStore.ts` (`runBox`).

Boxes fall into two categories:

- **Input boxes** (`category: "input"`) — no AI. They seed data into a pipeline.
- **Worker boxes** (`category: "worker"`) — run an AI step (Ollama, fal.ai, or Google Stitch).

> A third `custom` category is reserved in the sidebar but has no boxes yet ("Add Custom" is
> disabled).

---

## Input boxes

### 💡 Idea — `idea`

Free-text input. No AI. The seed of most pipelines. Its content becomes the output sent to
downstream boxes.

- **Inputs:** none (no target handle).
- **Outputs:** its text content.
- **Settings:** none (input box).

### 🖼️ Image — `image`

Upload an image. It's auto-resized to ≤1024px, compressed to JPEG, and uploaded to Firebase
Storage (if a board is loaded) so it syncs to collaborators. Downstream boxes receive a fetchable
URL.

- **Inputs:** none (no target handle).
- **Outputs:** an image URL (used as `imageData` input by Cartoon boxes).
- **Settings:** none (input box).

---

## Worker boxes

### 🔍 Research — `research`

Runs an AI prompt over connected inputs and returns structured research findings.

- **AI:** Ollama (text).
- **Inputs:** any connected box; defaults to `{{input_1}}`.
- **Output:** Markdown text.

### 📋 Summarize — `summarize`

Combines multiple upstream inputs into a concise AI summary.

- **AI:** Ollama (text).
- **Inputs:** multiple; defaults to `{{inputs}}`.
- **Output:** Markdown text.

### 📄 PRD — `prd`

Generates a Product Requirements Document — product overview, problem statement, target users,
core features with priorities, user stories, UI/UX guidelines, technical requirements, and
success metrics. Ideal input for the Code box.

- **AI:** Ollama (text).
- **Inputs:** typically Research; defaults to `{{inputs}}`.
- **Output:** Markdown document.

### 🗺️ Dev Plan — `devplan`

Transforms a PRD into a short, pragmatic development plan: components to build, state variables,
key functions, and a build order. Best fed by a PRD box, then fed into a Code box.

- **AI:** Ollama (text).
- **Inputs:** typically a PRD; defaults to `{{inputs}}`.
- **Output:** Markdown list.

### 🎨 Cartoon Profile — `cartoon`

Generates a cartoon avatar via fal.ai.

- **AI:** fal.ai (image).
- **Inputs:**
  - An **Image** box connected → image-to-image (`fal-ai/qwen-image-edit`).
  - Otherwise, an **Idea** box → text-to-image fallback (`fal-ai/flux/schnell`).
- **Output:** a generated image URL (`outputImage`).
- **Settings:** a "Prompt Template (text-to-image fallback)" — only used when no image is
  connected. No system prompt.

### 📊 Slides — `slides`

Generates a visual pitch deck. Ollama returns a JSON array; the app parses it into navigable
slides with prev/next and speaker notes.

- **AI:** Ollama (text).
- **Inputs:** `{{inputs}}`.
- **Output:** slides parsed from a JSON array of
  `{ title, bullets: string[], notes? }`.
- **Settings:** the prompt defines the slide structure; the model must output only a valid JSON
  array.

### 💻 Code — `code`

Generates a working React prototype. Output is validated to contain a `ReactDOM.createRoot(...)`
render call, wrapped in a self-contained HTML page, and previewed in a sandboxed iframe with
Code/Preview tabs, Copy, and Save (download).

- **AI:** Ollama (text).
- **Inputs:** `{{inputs}}` (best from PRD / Dev Plan).
- **Output:** `code` (the JSX) + `output` (the raw response).
- **Constraints:** no imports; use the `React.*` API; define an `App` component; keep mock data
  small (3–5 items).

### ✨ UI Design — `ui`

Generates polished, production-quality React UIs using **Tailwind CSS classes** + Google Fonts
(production-quality, Google Stitch style). Previewed in an iframe with Tailwind loaded.

- **AI:** Ollama (text).
- **Inputs:** `{{inputs}}`.
- **Output:** `code` (Tailwind-based JSX) + preview.
- **Settings:** same as Code box; system prompt emphasizes visual polish.

### 🧵 Stitch UI — `stitch`

Generates a UI screen using **Google Stitch** and returns polished, production-quality HTML
directly.

- **AI:** Google Stitch.
- **Inputs:** `{{inputs}}`.
- **Output:** `output` + `code` (the raw HTML), previewed directly in the iframe.

---

## Prompt template variables

All AI boxes support these in their prompt templates (see `lib/prompts.ts`):

| Variable | Meaning |
|----------|---------|
| `{{Box Name}}` | Output of a connected box matched by its name (case-insensitive). |
| `{{input_1}}` … `{{input_N}}` | Nth connected input, positional. |
| `{{input}}` | Alias for the first input. |
| `{{inputs}}` | All connected inputs, labeled and concatenated. |

## Role tags & the palette filter

Every box type carries `roles: BoxRole[]` (`"everyone" | "designer" | "developer" | "product"`)
used by the sidebar role chips in `client/src/components/Sidebar.tsx`. This is a **discovery-only
label**, not a permission:

- Boxes tagged `"everyone"` (Idea, Research, Summarize) are shared pipeline scaffolding and appear
  in every role view.
- Selecting the **Designer**, **Developer**, or **Product** chip filters the palette to boxes
  tagged with that role — plus all `"everyone"` boxes.
- The selection is persisted per user in `localStorage` (`ai-canva:sidebar-role`) so it acts like a
  lightweight profile. Filtering never hides boxes already on the canvas — it only declutters which
  ones you can add.
- Give a box multiple roles when it spans personas (e.g. `slides: ["product", "designer"]`).

Tagging a box does not affect collaboration, the canvas, or `runBox` — it is purely a UI filter.

## Adding a new box type

1. Add a `BoxType` union member and a `BOX_TYPES` entry in `client/src/types.ts` (including its
   `roles` tags — see above).
2. Register it in `Canvas.tsx` (`nodeTypes`) and the MiniMap color map.
3. Add a render/output branch in `BoxNode.tsx`.
4. Add run behavior in `boardStore.ts` `runBox()` (or route to an existing branch).
5. Add any new backend endpoint in `server/src/index.ts` **and** `functions/src/index.ts`.
6. Update the box-type tables in the README and this document.
