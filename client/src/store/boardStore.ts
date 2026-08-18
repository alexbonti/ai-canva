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
import {
  saveBoard, loadBoard, listBoards, listSharedBoards, deleteBoard,
  subscribeToBoard, subscribeToPresence, updatePresence, removePresence,
  shareBoard as fsShareBoard, unshareBoard as fsUnshareBoard,
  updateBoardData,
  type BoardDoc,
} from "../lib/firestore.js";
import type { PresenceUser } from "../types.js";
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

// === Collaboration helpers ===

const CURSOR_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e", "#14b8a6"];

function getInitials(email: string): string {
  const name = email.split("@")[0];
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getColorForEmail(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

// Track last local save time to prevent onSnapshot echo
let lastSaveTime = 0;

// Throttle presence updates to max 1 write per 200ms
let presenceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPresence: { x: number; y: number } | null = null;

// Subscription cleanup functions
let boardUnsub: (() => void) | null = null;
let presenceUnsub: (() => void) | null = null;

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
  collaborators: string[];
  activeUsers: PresenceUser[];

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

  // Collaboration
  subscribeToBoardUpdates: () => void;
  unsubscribeFromBoard: () => void;
  shareBoard: (emails: string[]) => Promise<void>;
  unshareBoard: (email: string) => Promise<void>;
  updateCursorPosition: (x: number, y: number) => void;
  cleanupPresence: () => void;
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
      collaborators: [],
      activeUsers: [],

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
          collaborators: [],
          nodes: [], edges: [], boxData: {},
          createdAt: now, updatedAt: now,
        });
        set({
          currentBoardId: boardId,
          boardTitle: title || "Untitled Board",
          collaborators: [],
          nodes: [], edges: [], boxData: {},
          saveStatus: "saved",
        });
        get().refreshBoardList();
      },

      loadBoardFromFirestore: async (boardId) => {
        // Unsubscribe from previous board if any
        get().unsubscribeFromBoard();
        const board = await loadBoard(boardId);
        if (!board) return;
        set({
          currentBoardId: board.id,
          boardTitle: board.title,
          collaborators: board.collaborators || [],
          nodes: board.nodes as Node[],
          edges: board.edges as Edge[],
          boxData: board.boxData as Record<string, BoxData>,
          saveStatus: "saved",
          activeUsers: [],
        });
        // Start real-time subscription + presence
        get().subscribeToBoardUpdates();
      },

      saveToFirestore: async () => {
        const state = get();
        const user = useAuthStore.getState().user;
        if (!user || !state.currentBoardId) return;
        set({ saveStatus: "saving" });
        lastSaveTime = Date.now();
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
          // Use updateBoardData (not saveBoard) so we do NOT overwrite
          // ownerId/ownerEmail/createdAt — collaborators can save without claiming ownership
          await updateBoardData(state.currentBoardId, {
            title: state.boardTitle,
            collaborators: state.collaborators,
            nodes: state.nodes,
            edges: state.edges,
            boxData: cleanBoxData,
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
          const [owned, shared] = await Promise.all([
            listBoards(user.uid),
            user.email ? listSharedBoards(user.email) : Promise.resolve([]),
          ]);
          // Merge, deduplicate by id, sort by updatedAt desc
          const seen = new Set<string>();
          const all = [...owned, ...shared].filter((b) => {
            if (seen.has(b.id)) return false;
            seen.add(b.id);
            return true;
          });
          set({ boardList: all.sort((a, b) => b.updatedAt - a.updatedAt) });
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
        get().unsubscribeFromBoard();
        set({
          nodes: [], edges: [], boxData: {},
          currentBoardId: null,
          boardTitle: "Untitled Board",
          collaborators: [],
          activeUsers: [],
        });
      },

      // === Collaboration actions ===

      subscribeToBoardUpdates: () => {
        const state = get();
        if (!state.currentBoardId) return;
        const boardId = state.currentBoardId;
        console.log("[store] Subscribing to board updates:", boardId);

        // Subscribe to board document changes (real-time sync)
        boardUnsub = subscribeToBoard(boardId, (board) => {
          // Skip echo — if we just saved locally, ignore the snapshot
          if (Date.now() - lastSaveTime < 2000) return;
          set({
            nodes: board.nodes as Node[],
            edges: board.edges as Edge[],
            boxData: board.boxData as Record<string, BoxData>,
            boardTitle: board.title,
            collaborators: board.collaborators || [],
          });
        });

        // Subscribe to presence (live cursors)
        presenceUnsub = subscribeToPresence(boardId, (users) => {
          set({ activeUsers: users });
        });
      },

      unsubscribeFromBoard: () => {
        if (boardUnsub) { boardUnsub(); boardUnsub = null; }
        if (presenceUnsub) { presenceUnsub(); presenceUnsub = null; }
        get().cleanupPresence();
        set({ activeUsers: [] });
      },

      shareBoard: async (emails) => {
        const state = get();
        if (!state.currentBoardId) return;
        const user = useAuthStore.getState().user;
        if (!user || user.uid !== state.currentBoardId && state.collaborators === undefined) return;
        // Only owner can share — check via board ownership
        try {
          await fsShareBoard(state.currentBoardId, emails);
          set({ collaborators: [...get().collaborators, ...emails] });
        } catch (err) {
          console.error("Failed to share board:", err);
        }
      },

      unshareBoard: async (email) => {
        const state = get();
        if (!state.currentBoardId) return;
        try {
          await fsUnshareBoard(state.currentBoardId, email);
          set({ collaborators: get().collaborators.filter((e) => e !== email) });
        } catch (err) {
          console.error("Failed to unshare:", err);
        }
      },

      updateCursorPosition: (x, y) => {
        const state = get();
        if (!state.currentBoardId) return;
        const user = useAuthStore.getState().user;
        if (!user) return;

        pendingPresence = { x, y };
        if (presenceTimer) return; // already scheduled

        presenceTimer = setTimeout(async () => {
          presenceTimer = null;
          if (!pendingPresence) return;
          const { x, y } = pendingPresence;
          pendingPresence = null;
          const boardId = get().currentBoardId;
          if (!boardId) return;
          try {
            await updatePresence(boardId, user.uid, {
              userId: user.uid,
              email: user.email || "",
              displayName: user.displayName || user.email || "",
              initials: getInitials(user.email || user.uid),
              color: getColorForEmail(user.email || user.uid),
              cursorX: x,
              cursorY: y,
            });
          } catch {
            // ignore — presence is best-effort
          }
        }, 200);
      },

      cleanupPresence: () => {
        const state = get();
        const user = useAuthStore.getState().user;
        if (!state.currentBoardId || !user) return;
        if (presenceTimer) { clearTimeout(presenceTimer); presenceTimer = null; }
        removePresence(state.currentBoardId, user.uid).catch(() => {});
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