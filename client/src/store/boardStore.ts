import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge as rfAddEdge,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from "@xyflow/react";
import type { BoxData, BoxType, BoxStatus, Slide } from "../types.js";
import { BOX_TYPES } from "../types.js";
import { generate, generateImage } from "../lib/api.js";
import { fillPromptTemplate, getBoxOutput } from "../lib/prompts.js";
import { extractCode } from "../lib/code.js";
import { saveBoard, loadBoard, listBoards, deleteBoard, type BoardDoc } from "../lib/firestore.js";
import { useAuthStore } from "./authStore.js";

function makeId(): string {
  return `box-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Parses Claude's text response into a Slide[] array.
 * Handles JSON wrapped in markdown code blocks and extra text.
 */
function parseSlidesResponse(text: string): Slide[] {
  let jsonText = text.trim();

  // Strip markdown code block wrapper (```json ... ```)
  const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonText = codeBlockMatch[1].trim();
  }

  // Find the JSON array boundaries
  const arrayStart = jsonText.indexOf("[");
  const arrayEnd = jsonText.lastIndexOf("]");
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    jsonText = jsonText.slice(arrayStart, arrayEnd + 1);
  }

  try {
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((s) => s && typeof s.title === "string")
        .map((s) => ({
          title: String(s.title),
          bullets: Array.isArray(s.bullets)
            ? s.bullets.map((b: unknown) => String(b))
            : [],
          notes: s.notes ? String(s.notes) : undefined,
        }));
    }
  } catch {
    // JSON parse failed — fall through to error
  }

  throw new Error(
    "Could not parse slides from AI response. Expected a JSON array of slide objects."
  );
}

// Debounced save to Firestore — triggers 1s after the last change
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    useBoardStore.getState().saveToFirestore();
  }, 1000);
}

function defaultBoxData(type: BoxType): BoxData {
  const meta = BOX_TYPES[type];
  return {
    content: "",
    prompt: meta.defaultPrompt,
    systemPrompt: meta.defaultSystemPrompt,
    output: "",
    status: "idle" as BoxStatus,
    imageData: undefined,
    outputImage: undefined,
  };
}

interface BoardState {
  nodes: Node[];
  edges: Edge[];
  boxData: Record<string, BoxData>;

  // Board management (Firestore)
  currentBoardId: string | null;
  boardTitle: string;
  saveStatus: "idle" | "saving" | "saved" | "error";
  boardList: BoardDoc[];

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  addBox: (
    type: BoxType,
    position?: { x: number; y: number }
  ) => string;
  updateBoxData: (id: string, patch: Partial<BoxData>) => void;
  deleteBox: (id: string) => void;
  runBox: (id: string) => Promise<void>;

  setBoxStatus: (id: string, status: BoxStatus, error?: string) => void;

  // Board operations (Firestore)
  createNewBoard: (title?: string) => Promise<void>;
  loadBoardFromFirestore: (boardId: string) => Promise<void>;
  saveToFirestore: () => Promise<void>;
  setBoardTitle: (title: string) => void;
  refreshBoardList: () => Promise<void>;
  deleteCurrentBoard: () => Promise<void>;
  clearBoard: () => void;
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      boxData: {},
      currentBoardId: null,
      boardTitle: "Untitled Board",
      saveStatus: "idle",
      boardList: [],

      onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) });
        scheduleSave();
      },

      onEdgesChange: (changes) => {
        set({ edges: applyEdgeChanges(changes, get().edges) });
        scheduleSave();
      },

      onConnect: (connection) => {
        set({
          edges: rfAddEdge(
            { ...connection, animated: true },
            get().edges
          ),
        });
        scheduleSave();
      },

      addBox: (type, position) => {
        const id = makeId();
        const meta = BOX_TYPES[type];
        const node: Node = {
          id,
          type,
          position: position || {
            x: 200 + Math.random() * 200,
            y: 150 + Math.random() * 100,
          },
          data: { boxType: type, title: `${meta.label} Box` },
          style: { width: meta.defaultWidth, height: meta.defaultHeight },
        };

        set({
          nodes: [...get().nodes, node],
          boxData: {
            ...get().boxData,
            [id]: defaultBoxData(type),
          },
        });

        scheduleSave();
        return id;
      },

      updateBoxData: (id, patch) => {
        const current = get().boxData[id];
        if (!current) return;
        set({
          boxData: {
            ...get().boxData,
            [id]: { ...current, ...patch },
          },
        });
        scheduleSave();
      },

      deleteBox: (id) => {
        set({
          nodes: get().nodes.filter((n) => n.id !== id),
          edges: get().edges.filter(
            (e) => e.source !== id && e.target !== id
          ),
          boxData: Object.fromEntries(
            Object.entries(get().boxData).filter(([k]) => k !== id)
          ),
        });
        scheduleSave();
      },

      setBoxStatus: (id, status, error) => {
        get().updateBoxData(id, { status, error });
      },

      // --- Firestore board operations ---

      createNewBoard: async (title) => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        const boardId = makeId();
        const now = Date.now();
        await saveBoard({
          id: boardId,
          title: title || "Untitled Board",
          ownerId: user.uid,
          ownerEmail: user.email || "",
          nodes: [], edges: [], boxData: {},
          createdAt: now, updatedAt: now,
        });
        set({
          currentBoardId: boardId,
          boardTitle: title || "Untitled Board",
          nodes: [], edges: [], boxData: {},
          saveStatus: "saved",
        });
        get().refreshBoardList();
      },

      loadBoardFromFirestore: async (boardId) => {
        const board = await loadBoard(boardId);
        if (!board) return;
        set({
          currentBoardId: board.id,
          boardTitle: board.title,
          nodes: board.nodes as Node[],
          edges: board.edges as Edge[],
          boxData: board.boxData as Record<string, BoxData>,
          saveStatus: "saved",
        });
      },

      saveToFirestore: async () => {
        const state = get();
        const user = useAuthStore.getState().user;
        if (!user || !state.currentBoardId) return;
        set({ saveStatus: "saving" });
        try {
          // Strip imageData (base64 data URLs) from boxData before saving.
          // Base64 images can be 100-200KB each and would exceed Firestore's
          // 1MB document limit, causing the entire save (including outputImage
          // URLs) to fail. imageData is kept in localStorage for local display.
          const cleanBoxData = Object.fromEntries(
            Object.entries(state.boxData).map(([id, data]) => [
              id,
              { ...data, imageData: undefined } as BoxData,
            ])
          );
          await saveBoard({
            id: state.currentBoardId,
            title: state.boardTitle,
            ownerId: user.uid,
            ownerEmail: user.email || "",
            nodes: state.nodes,
            edges: state.edges,
            boxData: cleanBoxData,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          set({ saveStatus: "saved" });
        } catch (err) {
          console.error("Firestore save failed:", err);
          set({ saveStatus: "error" });
        }
      },

      setBoardTitle: (title) => {
        set({ boardTitle: title });
        scheduleSave();
      },

      refreshBoardList: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        try {
          const boards = await listBoards(user.uid);
          set({ boardList: boards });
        } catch (err) {
          console.error("Failed to list boards:", err);
        }
      },

      deleteCurrentBoard: async () => {
        const state = get();
        if (!state.currentBoardId) return;
        try {
          await deleteBoard(state.currentBoardId);
          set({
            currentBoardId: null,
            boardTitle: "Untitled Board",
            nodes: [], edges: [], boxData: {},
            saveStatus: "idle",
          });
          get().refreshBoardList();
        } catch (err) {
          console.error("Failed to delete board:", err);
        }
      },

      clearBoard: () => {
        set({
          nodes: [], edges: [], boxData: {},
          currentBoardId: null,
          boardTitle: "Untitled Board",
        });
      },

      runBox: async (id) => {
        const state = get();
        const node = state.nodes.find((n) => n.id === id);
        const data = state.boxData[id];

        if (!node || !data) return;
        if (data.status === "running") return;

        const boxType = (node.data.boxType || node.type) as BoxType;

        // Gather upstream inputs
        const incomingEdges = state.edges.filter((e) => e.target === id);

        // Separate image inputs from text inputs
        let inputImage: string | undefined;
        const textInputs: string[] = [];

        for (const edge of incomingEdges) {
          const sourceData = state.boxData[edge.source];
          if (sourceData) {
            // Check for image data (from Image Upload boxes)
            if (sourceData.imageData) {
              if (!inputImage) inputImage = sourceData.imageData;
            }
            // Gather text output
            const textOutput = getBoxOutput(
              sourceData.output,
              sourceData.content
            );
            if (textOutput) textInputs.push(textOutput);
          }
        }

        // Also include this box's own content (lets AI boxes work standalone)
        if (data.content && data.content.trim()) {
          textInputs.push(data.content.trim());
        }

        // Set running state
        get().setBoxStatus(id, "running");

        try {
          if (boxType === "cartoon") {
            // Image generation via fal.ai
            let prompt = data.prompt;
            if (textInputs.length > 0) {
              prompt = fillPromptTemplate(data.prompt, textInputs);
            }

            const result = await generateImage({
              prompt,
              imageUrl: inputImage,
            });

            if (result.error) throw new Error(result.error);

            get().updateBoxData(id, {
              outputImage: result.imageUrl,
              status: "done",
              error: undefined,
            });
          } else {
            // Text generation via Claude (research, summarize, slides)
            const filledPrompt = fillPromptTemplate(
              data.prompt,
              textInputs
            );

            const result = await generate({
              systemPrompt: data.systemPrompt,
              userPrompt: filledPrompt,
            });

            if (result.error) throw new Error(result.error);

            if (boxType === "slides") {
              // Parse Claude's JSON output into a slide deck
              const slides = parseSlidesResponse(result.content);
              get().updateBoxData(id, {
                output: result.content,
                slides,
                status: "done",
                error: undefined,
              });
            } else if (boxType === "code") {
              // Extract component code from Claude's response
              const code = extractCode(result.content);
              // Validate: the code must contain a render call to actually work
              if (!code.includes("ReactDOM.createRoot") && !code.includes("ReactDOM.render")) {
                throw new Error(
                  "Generated code is incomplete (missing ReactDOM render call). Try simplifying the requirements or re-run."
                );
              }
              get().updateBoxData(id, {
                output: result.content,
                code,
                status: "done",
                error: undefined,
              });
            } else {
              // Store text output (research, summarize)
              get().updateBoxData(id, {
                output: result.content,
                status: "done",
                error: undefined,
              });
            }
          }
        } catch (err: any) {
          get().setBoxStatus(id, "error", err.message || "Generation failed");
        }
      },
    }),
    {
      name: "ai-canva-board",
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        boxData: state.boxData,
        currentBoardId: state.currentBoardId,
        boardTitle: state.boardTitle,
      }),
    }
  )
);