# AI Canva

A collaborative AI-powered whiteboard where you build visual pipelines of AI steps. Place boxes on a canvas, connect them, and run AI prompts that flow content from box to box.

## Quick Start

### 1. Add your API keys

```bash
cp server/.env.example server/.env
# Edit server/.env and replace the placeholders with your real keys:
# ANTHROPIC_API_KEY=sk-ant-your-real-key-here
# FAL_KEY=your-fal-key-here
```

- Anthropic key: https://console.anthropic.com/
- fal.ai key: https://fal.ai/dashboard/keys

### 2. Install dependencies (first time only)

```bash
npm install              # root (concurrently)
cd server && npm install # server deps
cd client && npm install # client deps
```

Or from root: `npm run install:all`

### 3. Run the app

```bash
npm run dev
```

This starts both servers:
- **Client (Vite):** http://localhost:5173 — open this in your browser
- **Server (Express):** http://localhost:3001 — API proxy for Claude

### Automatic Port Detection

Both the server and client automatically detect if their default port is in use and switch to the next available one:

- **Server** (default `3001`): If port 3001 is occupied, it increments until it finds a free port (3002, 3003, ...). The actual port is written to `.server-port` in the project root.
- **Client** (default `5173`): Vite's `strictPort: false` makes it auto-increment if 5173 is taken (5174, 5175, ...).
- **Proxy coordination**: The client reads `.server-port` at startup (polling for up to 10 seconds) so its `/api` proxy always points to the server's actual port — even if the server had to switch.

You'll see a warning in the console if a port was switched, e.g.:
```
[server] Port 3001 was in use — switched to 3003
```

You can override the server's preferred port via the `PORT` environment variable in `server/.env`.

## How It Works

### Box Types

| Box | Icon | Description |
|-----|------|-------------|
| **Idea** | 💡 | Free-text input. No AI — just write your idea. This is the seed. |
| **Research** | 🔍 | Takes input from connected boxes, runs a customizable Claude prompt, outputs research findings. |
| **Summarize** | 📋 | Combines multiple upstream inputs into a concise AI-generated summary. |
| **Image** | 🖼️ | Upload an image. The image becomes input for downstream boxes. No AI. |
| **Cartoon Profile** | 🎨 | Generate cartoon profile pictures via fal.ai. Connect an Image box for image-to-image, or an Idea box for text-to-image fallback. |
| **Slides** | 📊 | Generate a visual pitch deck from research. Takes input from connected boxes, outputs navigable slides with prev/next. |
| **Code** | 💻 | Generate a React prototype from research. Live preview in an iframe, with Code/Preview tabs, copy, and download. |
| **PRD** | 📄 | Generate a Product Requirements Document from research. Structures findings into features, user stories, and specs — ideal input for the Code box. |

### Building a Pipeline

1. Click **+ Idea**, **+ Research**, **+ PRD**, **+ Summarize**, **+ Image**, **+ Cartoon Profile**, **+ Slides**, or **+ Code** in the top bar to add a box
2. Write your idea in an Idea Box, or upload an image in an Image Box
3. Drag from a box right edge (●) to another box left edge (●) to connect them
4. Click **▶ Run** on any AI box (Research, Summarize, Cartoon, Slides, Code) to generate output
5. Click **⚙** on any AI box to edit its prompt template
6. **Resize boxes**: Click a box, then drag the corner/edge handles to resize it

### Prompt Templates

AI boxes use prompt templates with variables that get filled from connected inputs:

- `{{input_1}}` — first upstream box output
- `{{input_2}}` — second upstream box output
- `{{input}}` — alias for `{{input_1}}`
- `{{inputs}}` — all inputs concatenated with labels

Each AI box also has a **System Prompt** that sets Claude role/behavior.

### Example Pipelines

**Text research pipeline:**
```
Idea Box ──▶ Research Box ──▶ Summarize Box
             Research Box 2 ──┘
```

1. Write an idea in the Idea Box
2. Connect it to a Research Box and click Run — Claude researches the topic
3. Connect multiple Research Boxes to a Summarize Box and click Run — Claude synthesizes them

**Cartoon profile pipeline (image-to-image):**
```
Image Box ──▶ Cartoon Profile Box
```

1. Upload a photo in the Image Box
2. Connect it to a Cartoon Profile Box and click Run — fal.ai cartoonifies the photo

**Cartoon profile pipeline (text-to-image fallback):**
```
Idea Box ──▶ Cartoon Profile Box
```

1. Describe a character in the Idea Box
2. Connect it to a Cartoon Profile Box and click Run — fal.ai generates a cartoon from text

**Pitch deck pipeline:**
```
Idea Box ──▶ Research Box ──▶ Slides Box
```

1. Write an idea and connect it to a Research Box — Claude researches the topic
2. Connect the Research Box to a Slides Box and click Run — Claude generates a visual pitch deck
3. Navigate slides with ◀ ▶ buttons

**React prototype pipeline:**
```
Idea Box ──▶ Research Box ──▶ Code Box
```

1. Write an idea and connect it to a Research Box
2. Connect the Research Box to a Code Box and click Run — Claude generates a React component
3. Switch between Code and Preview tabs to see the source and live result
4. Click Copy to copy the code, or Save to download a self-contained HTML file

**Full product pipeline (recommended for code generation):**
```
Idea Box ──▶ Research Box ──▶ PRD Box ──▶ Code Box
```

1. Write an idea and connect it to a Research Box — Claude researches the topic
2. Connect the Research Box to a PRD Box and click Run — Claude generates a structured Product Requirements Document
3. Connect the PRD Box to a Code Box and click Run — Claude generates a React prototype from the specific requirements
4. The PRD gives the Code box much better input than raw research alone

## Persistence

The board (boxes, connections, content, prompts) auto-saves to browser localStorage. Refresh the page and your board is restored.

## Tech Stack

- **Canvas:** React Flow (@xyflow/react) — draggable nodes, connections, pan/zoom
- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS + Zustand
- **Backend:** Express + @anthropic-ai/sdk (Claude) + fal.ai REST API (image generation)
- **Persistence:** localStorage (browser)

## Roadmap (Phase 2+)

- Real-time multi-user collaboration (Yjs CRDT + WebSocket)
- Additional box types: Mind Map, Outline, Critique, Decision, Tasks, Slides, Code, Image
- Auto-run mode (boxes regenerate when inputs change)
- Streaming output (token-by-token)
- Server-side board persistence (database)
- Export board as image / JSON

## Project Structure

```
ai-canva/
├── client/                 # Vite React app
│   ├── src/
│   │   ├── components/
│   │   │   ├── Canvas.tsx        # React Flow canvas
│   │   │   ├── BoxNode.tsx       # Unified box node (all types)
│   │   │   └── Toolbar.tsx       # Help overlay
│   │   ├── store/
│   │   │   └── boardStore.ts     # Zustand store (state + localStorage + run logic)
│   │   ├── lib/
│   │   │   ├── api.ts            # Backend API client
│   │   │   └── prompts.ts        # Prompt template filling
│   │   ├── types.ts              # Box types, metadata, interfaces
│   │   ├── App.tsx               # Main app layout
│   │   └── main.tsx              # Entry point
│   └── package.json
├── server/                 # Express API
│   ├── src/
│   │   ├── index.ts              # Express app + /api/generate
│   │   └── claude.ts             # Anthropic SDK wrapper
│   └── package.json
└── package.json            # Workspace root
```