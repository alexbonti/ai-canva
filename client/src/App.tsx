import { useEffect, useRef } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import Canvas from "./components/Canvas.js";
import Toolbar from "./components/Toolbar.js";
import { useBoardStore } from "./store/boardStore.js";
import { BOX_TYPES } from "./types.js";
import type { BoxType } from "./types.js";

export default function App() {
  const addBox = useBoardStore((s) => s.addBox);
  const seedingRef = useRef(false);

  // Seed a starter board on first load ONLY if there is no persisted state.
  // Uses a ref guard so React StrictMode double-mounting cannot trigger
  // a second seed, and reads the live store state (not the closure)
  // so already-rehydrated localStorage data is respected.
  useEffect(() => {
    if (seedingRef.current) return;
    seedingRef.current = true;

    const state = useBoardStore.getState();
    if (state.nodes.length > 0) return; // board already exists (from localStorage)

    const ideaId = addBox("idea", { x: 80, y: 200 });
    useBoardStore.getState().updateBoxData(ideaId, {
      content: "An AI-powered meal planning app that creates weekly menus based on dietary preferences and grocery sales.",
    });

    const researchId = addBox("research", { x: 480, y: 200 });
    // Connect idea -> research
    useBoardStore.getState().onConnect({
      source: ideaId,
      target: researchId,
      sourceHandle: null,
      targetHandle: null,
    } as any);
  }, [addBox]);

  const handleAddBox = (type: BoxType) => {
    addBox(type);
  };

  const handleReset = () => {
    if (!confirm("Clear the entire board? This cannot be undone.")) return;
    // Clear persisted state and reset the store
    useBoardStore.setState({ nodes: [], edges: [], boxData: {} });
    localStorage.removeItem("ai-canva-board");
    // Re-seed the starter board
    seedingRef.current = false;
    const ideaId = addBox("idea", { x: 80, y: 200 });
    useBoardStore.getState().updateBoxData(ideaId, {
      content: "An AI-powered meal planning app that creates weekly menus based on dietary preferences and grocery sales.",
    });
    const researchId = addBox("research", { x: 480, y: 200 });
    useBoardStore.getState().onConnect({
      source: ideaId,
      target: researchId,
      sourceHandle: null,
      targetHandle: null,
    } as any);
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎨</span>
          <h1 className="text-lg font-bold text-slate-800">AI Canva</h1>
          <span className="text-xs text-slate-400 ml-2">
            Visual AI pipeline builder
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {(Object.keys(BOX_TYPES) as BoxType[]).map((type) => (
            <button
              key={type}
              onClick={() => handleAddBox(type)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition hover:opacity-90"
              style={{ backgroundColor: BOX_TYPES[type].color }}
            >
              <span>{BOX_TYPES[type].icon}</span>
              <span>+ {BOX_TYPES[type].label}</span>
            </button>
          ))}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition ml-2"
            title="Clear board and start over"
          >
            🗑 Reset
          </button>
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 relative">
        <ReactFlowProvider>
          <Canvas />
          <Toolbar />
        </ReactFlowProvider>
      </div>
    </div>
  );
}