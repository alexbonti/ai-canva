import { useEffect, useRef, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import Canvas from "./components/Canvas.js";
import Toolbar from "./components/Toolbar.js";
import Sidebar from "./components/Sidebar.js";
import NewBoardModal from "./components/NewBoardModal.js";
import ShareModal from "./components/ShareModal.js";
import LandingPage from "./components/landing/LandingPage.js";
import AdminBoard from "./components/AdminBoard.js";
import FacilitatorBoard from "./components/FacilitatorBoard.js";
import GuestProfileModal from "./components/GuestProfileModal.js";
import PresenceRoster from "./components/PresenceRoster.js";
import { isFacilitator } from "./lib/admin.js";
import { addBoardMember } from "./lib/firestore.js";
import { signInWithWorkshopCode } from "./lib/auth.js";
import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore";
import { db } from "./lib/firebase.js";
import { useUserBoxesStore } from "./store/userBoxesStore.js";
import { useBoardStore } from "./store/boardStore.js";
import { useAuthStore } from "./store/authStore.js";
import { useTokenStore } from "./store/tokenStore.js";
import { signInWithGoogle, signOutUser } from "./lib/auth.js";
import { isAdmin, updateUserProfile, heartbeat } from "./lib/admin.js";
import { fetchUserTokenTotal } from "./lib/firestore.js";
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
  const unsubscribeFromBoard = useBoardStore((s) => s.unsubscribeFromBoard);
  const cleanupPresence = useBoardStore((s) => s.cleanupPresence);
  const subscribeToBoardUpdates = useBoardStore((s) => s.subscribeToBoardUpdates);

  const [showBoardList, setShowBoardList] = useState(false);
  const [isFacilitatorUser, setIsFacilitatorUser] = useState(false);
  const [facilitatorView, setFacilitatorView] = useState(false);
  // Guest workshop join: the pending team info awaiting profile completion.
  const [pendingJoin, setPendingJoin] = useState<{
    isNew: boolean;
    teamId: string;
    workshopId: string;
    teamName: string;
    workshopName: string;
    boardId: string;
  } | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNewBoardModal, setShowNewBoardModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [adminView, setAdminView] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  const totalTokens = useTokenStore((s) => s.totalTokens);
  const fmtTokens = (n: number) => n.toLocaleString("en-US");

  // Initialize auth listener on mount
  useEffect(() => {
    const unsubscribe = useAuthStore.getState().init();
    return unsubscribe;
  }, []);

  // On login: record the user profile, check admin status, and start a
  // heartbeat so the admin board can show "active now" users.
  useEffect(() => {
    if (!user) {
      setIsAdminUser(false);
      setAdminView(false);
      useTokenStore.getState().reset();
      useUserBoxesStore.setState({ defs: [] });
      return;
    }
    useUserBoxesStore.getState().load();
    updateUserProfile(user).catch(() => {});
    isAdmin(user.uid).then(setIsAdminUser).catch(() => {});
    isFacilitator(user.uid).then(setIsFacilitatorUser).catch(() => {});
    // Seed the user's cumulative token count from Firestore.
    fetchUserTokenTotal(user.uid).then((n) => useTokenStore.getState().setTotal(n));
    const timer = setInterval(() => heartbeat(user).catch(() => {}), 60000);
    return () => clearInterval(timer);
  }, [user]);

  // Cleanup presence on page close
  useEffect(() => {
    const handler = () => cleanupPresence();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [cleanupPresence]);

  // Workshop guests returning with a complete profile skip the modal and land
  // directly on their team board (new guests get the modal via render below).
  useEffect(() => {
    if (!user || !pendingJoin || pendingJoin.isNew) return;
    const info = pendingJoin;
    const go = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      const name = (snap.data()?.displayName as string) || "";
      if (name) {
        setPendingJoin(null);
        await loadBoardFromFirestore(info.boardId);
      }
      // else: keep pendingJoin so the modal renders for returning guests
      // that never finished their profile.
    };
    go();
  }, [user, pendingJoin, loadBoardFromFirestore]);

  // Auto-open the join modal when the URL carries ?code=XXXX.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = (params.get("code") || "").toUpperCase();
    if (/^[A-Z2-9]{8}$/.test(code)) {
      setJoinCode(code);
      setShowJoinModal(true);
    }
  }, []);

  // When user logs in, load the right board and set up real-time subscription.
  // ALWAYS calls loadBoardFromFirestore (which sets up onSnapshot) — even when
  // currentBoardId is already set from localStorage. Without this, the board
  // loads from localStorage but has no real-time listener.
  const initRef = useRef(false);
  useEffect(() => {
    if (!user || authLoading || initRef.current) return;
    initRef.current = true;
    const initBoard = async () => {
      // Read currentBoardId directly from the store (not from React closure)
      // to avoid stale closure issues with the persist middleware
      const storedBoardId = useBoardStore.getState().currentBoardId;
      // Check URL param first (shared links)
      const params = new URLSearchParams(window.location.search);
      const urlBoardId = params.get("board");
      // Always refresh the board list so the header count is correct on load,
      // regardless of whether a stored/URL board short-circuits below.
      await refreshBoardList();
      if (urlBoardId) {
        await loadBoardFromFirestore(urlBoardId);
        return;
      }
      // Board from localStorage — reload from Firestore to set up subscription
      if (storedBoardId) {
        await loadBoardFromFirestore(storedBoardId);
        return;
      }
      // No board yet — auto-load most recent or create new. Workshop guests
      // (custom-token users with no auth email) skip the auto-create: the
      // join flow loads their team board instead.
      if (!user.email) return;
      const boards = useBoardStore.getState().boardList;
      if (boards.length > 0) {
        await loadBoardFromFirestore(boards[0].id);
      } else {
        await createNewBoard("My First Board");
      }
    };
    initBoard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // Auto-subscribe to board updates whenever currentBoardId changes.
  // This is the SINGLE source of truth for subscription management —
  // works for loadBoard, createNewBoard, and any other board switch.
  useEffect(() => {
    if (!user || !currentBoardId) return;
    subscribeToBoardUpdates();
    return () => unsubscribeFromBoard();
  }, [currentBoardId, user, subscribeToBoardUpdates, unsubscribeFromBoard]);

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
    unsubscribeFromBoard();
    await signOutUser();
    setShowBoardList(false);
  };

  const handleNewBoard = () => {
    setShowBoardList(false);
    setShowNewBoardModal(true);
  };

  const handleCreateBoard = async (name: string) => {
    await createNewBoard(name);
    setShowNewBoardModal(false);
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

  // Workshop code join (guests): redeems the code via the join endpoint —
  // a Firebase custom token signs the guest in with a durable uid. The
  // profile modal then asks for a name before landing them on the team board.
  const handleJoinCode = async () => {
    if (joinCode.length !== 8) return;
    setJoining(true);
    setJoinError("");
    try {
      const info = await signInWithWorkshopCode(joinCode);
      setPendingJoin(info);
      // onAuthChange will flip `user` and render the app; the modal shows then.
    } catch (err: any) {
      setJoinError(err?.message || "Could not join — check the code and try again.");
    } finally {
      setJoining(false);
    }
  };

  const saveGuestProfile = async (name: string, email: string) => {
    if (!user || !pendingJoin) return;
    await setDoc(
      doc(db, "users", user.uid),
      { displayName: name, email, guest: true, namePickedAt: Date.now() },
      { merge: true }
    );
    if (pendingJoin.boardId) {
      await addBoardMember(pendingJoin.boardId, user.uid, email || undefined).catch(() => {});
    }
    const info = pendingJoin;
    setPendingJoin(null);
    await loadBoardFromFirestore(info.boardId);
  };

  // Not logged in — show landing page with the workshop code entry.
  if (!user) {
    return (
      <div className="relative">
        <LandingPage />
        {/* Workshop guest join — no account needed, just a seat code. */}
        {!showJoinModal && (
          <button
            onClick={() => setShowJoinModal(true)}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 transition"
          >
            🎟️ Have a workshop code?
          </button>
        )}
        {showJoinModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>🎟️</span> Join your workshop
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Enter the code your facilitator gave you — no account needed.
              </p>
              <input
                autoFocus
                className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-center font-mono text-lg tracking-[0.3em] uppercase focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="CODE"
                maxLength={8}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleJoinCode()}
              />
              {joinError && <p className="mt-2 text-xs text-red-600">{joinError}</p>}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setJoinError("");
                    setShowJoinModal(false);
                  }}
                  className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Sign in instead
                </button>
                <button
                  onClick={handleJoinCode}
                  disabled={joinCode.length !== 8 || joining}
                  className="flex-1 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-50"
                >
                  {joining ? "Joining…" : "Join"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
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
          {/* Presence roster + Share button */}
          {currentBoardId && (
            <div className="flex items-center gap-1.5">
              <PresenceRoster />
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                👥 Share
              </button>
            </div>
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
                onClick={() => {
                  if (!showBoardList) refreshBoardList();
                  setShowBoardList(!showBoardList);
                }}
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
            {isAdminUser && (
              <button
                onClick={() => {
                  setFacilitatorView(false);
                  setAdminView(!adminView);
                }}
                className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition " + (adminView ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
                title="Admin board"
              >
                🛠️ Admin
              </button>
            )}
            {(isAdminUser || isFacilitatorUser) && (
              <button
                onClick={() => {
                  setAdminView(false);
                  setFacilitatorView(!facilitatorView);
                }}
                className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition " + (facilitatorView ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
                title="Facilitator dashboard — templates, workshops, teams"
              >
                🧑‍🏫 Facilitator
              </button>
            )}
            <div
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-xs text-slate-500"
              title={"Your total LLM tokens used: " + fmtTokens(totalTokens)}
            >
              ⚡ <span className="font-semibold text-slate-600 tabular-nums">{fmtTokens(totalTokens)}</span> tok
            </div>
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
        {adminView ? (
          <AdminBoard user={user} onBack={() => setAdminView(false)} />
        ) : facilitatorView ? (
          <FacilitatorBoard
            user={user}
            onBack={() => setFacilitatorView(false)}
            onOpenBoard={(boardId) => {
              setFacilitatorView(false);
              loadBoardFromFirestore(boardId);
            }}
          />
        ) : (
          <ReactFlowProvider>
            <Canvas />
            <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
            <Toolbar />
          </ReactFlowProvider>
        )}
      </div>
      {/* Workshop guest profile step (new joins or unfinished profiles) */}
      {user && pendingJoin && (
        <GuestProfileModal
          teamName={pendingJoin.teamName}
          workshopName={pendingJoin.workshopName}
          onSave={saveGuestProfile}
        />
      )}
      <NewBoardModal
        open={showNewBoardModal}
        onClose={() => setShowNewBoardModal(false)}
        onCreate={handleCreateBoard}
      />
      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
}