import { useEffect, useRef, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import Canvas from "./components/Canvas.js";
import Toolbar from "./components/Toolbar.js";
import Sidebar from "./components/Sidebar.js";
import LandingPage from "./components/LandingPage.js";
import { useBoardStore } from "./store/boardStore.js";
import { useAuthStore } from "./store/authStore.js";
import { signInWithGoogle, signOutUser } from "./lib/auth.js";
import { BOX_TYPES } from "./types.js";
import type { BoxType } from "./types.js";

export default function App() {
  const addBox = useBoardStore((s) => s.addBox);
  const seedingRef = useRef(false);

  // Auth state
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);

  // Board state
  const currentBoardId = useBoardStore((s) => s.currentBoardId);
  const boardTitle = useBoardStore((s) => s.boardTitle);
  const saveStatus = useBoardStore((s) => s.saveStatus);
  const boardList = useBoardStore((s) => s.boardList);
  const createNewBoard = useBoardStore((s) => s.createNewBoard);
  const loadBoardFromFirestore = useBoardStore((s) => s.loadBoardFromFirestore);
  const setBoardTitle = useBoardStore((s) => s.setBoardTitle);
  const refreshBoardList = useBoardStore((s) => s.refreshBoardList);
  const deleteCurrentBoard = useBoardStore((s) => s.deleteCurrentBoard);
  const clearBoard = useBoardStore((s) => s.clearBoard);

  const [showBoardList, setShowBoardList] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Initialize auth listener on mount
  useEffect(() => {
    const unsubscribe = useAuthStore.getState().init();
    return unsubscribe;
  }, []);

  // When user logs in, load their most recent board or create one
  useEffect(() => {
    if (!user || authLoading || currentBoardId) return;
    const initBoard = async () => {
      await refreshBoardList();
      const boards = useBoardStore.getState().boardList;
      if (boards.length > 0) {
        await loadBoardFromFirestore(boards[0].id);
      } else {
        await createNewBoard("My First Board");
      }
    };
    initBoard();
  }, [user, authLoading, currentBoardId, refreshBoardList, loadBoardFromFirestore, createNewBoard]);

  // Seed a starter board on first load (localStorage mode only, when not logged in)
  useEffect(() => {
    if (seedingRef.current || authLoading || user) return;
    seedingRef.current = true;
    const state = useBoardStore.getState();
    if (state.nodes.length > 0) return;
    const ideaId = addBox("idea", { x: 80, y: 200 });
    useBoardStore.getState().updateBoxData(ideaId, {
      content: "An AI-powered meal planning app that creates weekly menus based on dietary preferences and grocery sales.",
    });
    const researchId = addBox("research", { x: 480, y: 200 });
    useBoardStore.getState().onConnect({
      source: ideaId, target: researchId,
      sourceHandle: null, targetHandle: null,
    } as any);
  }, [addBox, authLoading, user]);

  const handleAddBox = (type: BoxType) => { addBox(type); };

  const handleClearBoard = () => {
    if (!confirm("Clear the entire board? This removes all boxes.")) return;
    useBoardStore.setState({ nodes: [], edges: [], boxData: {} });
    clearBoard();
  };

  const handleLogout = async () => {
    await signOutUser();
    setShowBoardList(false);
  };

  const handleNewBoard = async () => {
    await createNewBoard("Untitled Board");
    setShowBoardList(false);
  };

  const handleLoadBoard = async (boardId: string) => {
    await loadBoardFromFirestore(boardId);
    setShowBoardList(false);
  };

  const handleDeleteBoard = async () => {
    if (!confirm("Delete this board from the cloud? Local cache will remain.")) return;
    await deleteCurrentBoard();
  };

  const saveLabel = saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : saveStatus === "error" ? "Save failed" : "Idle";
  const saveColor = saveStatus === "saving" ? "text-blue-400" : saveStatus === "saved" ? "text-green-400" : saveStatus === "error" ? "text-red-400" : "text-slate-400";

  // === Render ===

  // Loading state
  if (authLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl animate-spin">🎨</span>
          <span className="text-sm text-slate-400">Loading...</span>
        </div>
      </div>
    );
  }

  // Not logged in — show landing page
  if (!user) {
    return <LandingPage />;
  }

  // Logged in — show the app
  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎨</span>
          <h1 className="text-lg font-bold text-slate-800">AI Canva</h1>
          {currentBoardId ? (
            <input
              type="text"
              value={boardTitle}
              onChange={(e) => setBoardTitle(e.target.value)}
              className="text-sm font-medium text-slate-600 bg-transparent border-b border-slate-200 focus:outline-none focus:border-blue-400 px-1 w-48"
              placeholder="Board title..."
            />
          ) : (
            <span className="text-xs text-slate-400">Loading board...</span>
          )}
          {currentBoardId && (
            <span className={"text-xs " + saveColor}>{"💾 " + saveLabel}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition " + (sidebarOpen ? "bg-slate-200 text-slate-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}
            title="Toggle add-box panel"
          >
            {"+ Add " + (sidebarOpen ? "✕" : "☰")}
          </button>
          <button
            onClick={handleClearBoard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
            title="Clear board"
          >
            🗑 Clear
          </button>
          <div className="flex items-center gap-1.5 ml-2">
            <div className="relative">
              <button
                onClick={() => setShowBoardList(!showBoardList)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                {"📋 Boards (" + boardList.length + ") ▾"}
              </button>
              {showBoardList && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 w-72 max-h-96 overflow-y-auto z-30">
                  <button
                    onClick={handleNewBoard}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 border-b border-slate-100"
                  >
                    ➕ New Board
                  </button>
                  {boardList.length === 0 && (
                    <div className="px-4 py-3 text-xs text-slate-400">No boards yet.</div>
                  )}
                  {boardList.map((b) => (
                    <div
                      key={b.id}
                      className={"flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50 cursor-pointer border-b border-slate-50 " + (b.id === currentBoardId ? "bg-blue-50" : "")}
                      onClick={() => handleLoadBoard(b.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-700 truncate">{b.title}</div>
                        <div className="text-xs text-slate-400">{new Date(b.updatedAt).toLocaleDateString() + " · " + (Array.isArray(b.nodes) ? b.nodes.length : 0) + " boxes"}</div>
                      </div>
                      {b.id === currentBoardId && <span className="text-blue-500 text-xs">current</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {currentBoardId && (
              <button
                onClick={handleDeleteBoard}
                className="px-2 py-1.5 rounded-lg text-sm text-slate-500 bg-slate-100 hover:bg-red-50 hover:text-red-500 transition"
                title="Delete current board"
              >
                🗑
              </button>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100">
              <img src={user.photoURL || ""} alt="" className="w-6 h-6 rounded-full" />
              <span className="text-xs text-slate-600 max-w-[120px] truncate">{user.email}</span>
              <button
                onClick={handleLogout}
                className="text-xs text-slate-400 hover:text-red-500 ml-1"
                title="Sign out"
              >
                ⏻
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 relative">
        <ReactFlowProvider>
          <Canvas />
          <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
          <Toolbar />
        </ReactFlowProvider>
      </div>
    </div>
  );
}