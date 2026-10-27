import { memo } from "react";
import type { User } from "firebase/auth";
import { useBoardStore } from "../store/boardStore.js";
import { useTokenStore } from "../store/tokenStore.js";
import { Button } from "./ui/Button.js";
import { Menu, MenuDivider, MenuItem, MenuLabel } from "./ui/Menu.js";
import { Icon } from "./ui/Icon.js";
import PresenceRoster from "./PresenceRoster.js";

/**
 * Top app bar — the station sign for the board.
 *
 * "The Printed Line": a deep-pine signage bar with a transit roundel, the
 * board title set as the line name, a save-status dot and quiet cream
 * controls. There is exactly one marigold action (Share).
 *
 * Rare + destructive actions (Clear / Delete board, Sign out) live inside
 * menus instead of the bar itself.
 *
 * Performance: this component subscribes to the store slices it renders
 * (title, save status, board list). App does NOT — so typing in the board
 * title re-renders only this (memoized) header, not the whole Canvas tree.
 *
 * E2E compatibility: the suite finds controls by textContent (`Boards (`,
 * `New Board`, `🧑‍🏫 Facilitator`, `+ Add Box`). Visible chrome uses the SVG
 * icon set; the legacy emoji is kept in an sr-only, aria-hidden span where the
 * suite requires it, so textContent never changes.
 */

const SAVE_LABEL: Record<string, string> = {
  saving: "Saving…",
  saved: "Saved",
  error: "Save failed",
};

interface HeaderProps {
  user: User;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onShare: () => void;
  onNewBoard: () => void;
  onLoadBoard: (boardId: string) => void;
  onDeleteBoard: () => void;
  onClearBoard: () => void;
  onLogout: () => void;
  isAdmin: boolean;
  isFacilitator: boolean;
  adminView: boolean;
  facilitatorView: boolean;
  onToggleAdminView: () => void;
  onToggleFacilitatorView: () => void;
}

function Header({
  user,
  sidebarOpen,
  onToggleSidebar,
  onShare,
  onNewBoard,
  onLoadBoard,
  onDeleteBoard,
  onClearBoard,
  onLogout,
  isAdmin,
  isFacilitator,
  adminView,
  facilitatorView,
  onToggleAdminView,
  onToggleFacilitatorView,
}: HeaderProps) {
  // Store slices the header itself renders (kept out of App on purpose).
  const currentBoardId = useBoardStore((s) => s.currentBoardId);
  const boardTitle = useBoardStore((s) => s.boardTitle);
  const setBoardTitle = useBoardStore((s) => s.setBoardTitle);
  const saveStatus = useBoardStore((s) => s.saveStatus);
  const boardList = useBoardStore((s) => s.boardList);
  const refreshBoardList = useBoardStore((s) => s.refreshBoardList);

  const totalTokens = useTokenStore((s) => s.totalTokens);
  const fmtTokens = (n: number) => n.toLocaleString("en-US");

  const saveLabel = SAVE_LABEL[saveStatus];
  const avatarInitials = (user.displayName || user.email || "?").slice(0, 2).toUpperCase();

  return (
    <header className="app-bar flex items-center justify-between gap-3 relative z-20">
      {/* ---- Left: roundel + board identity ---- */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="logo-roundel" aria-hidden />
          <span className="logo-word hidden sm:block">AI Canva</span>
        </div>

        <div className="bar-divider" />

        {currentBoardId ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <input
              type="text"
              value={boardTitle}
              onChange={(e) => setBoardTitle(e.target.value)}
              placeholder="Untitled board"
              className="board-title-input w-44 md:w-56"
            />
            {saveLabel && (
              <span
                className="flex items-center gap-1.5 flex-shrink-0"
                title={"Board save status: " + saveLabel}
              >
                <span className={"save-dot save-" + saveStatus} />
                <span className="label-caps hidden md:block text-[rgba(242,237,225,0.58)]">
                  {saveLabel}
                </span>
              </span>
            )}
          </div>
        ) : (
          <span className="label-caps text-[rgba(242,237,225,0.58)]">Opening board…</span>
        )}
      </div>

      {/* ---- Right: actions ---- */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Collaboration group */}
        {currentBoardId && (
          <>
            <PresenceRoster />
            <Button
              variant="signal"
              size="sm"
              onClick={onShare}
              className="ml-1"
              icon={<Icon name="users" size={14} />}
            >
              Share
            </Button>
            <div className="bar-divider mx-1.5" />
          </>
        )}

        {/* Board tools */}
        <Button
          variant="bar"
          size="sm"
          active={sidebarOpen}
          onClick={onToggleSidebar}
          title="Toggle the add-box panel"
          icon={<Icon name="plus" size={14} />}
        >
          Add Box
        </Button>

        <Menu
          panelClassName="w-72"
          trigger={({ open, toggle }) => (
            <Button
              variant="bar"
              size="sm"
              onClick={() => {
                if (!open) refreshBoardList();
                toggle();
              }}
              active={open}
              title="Open, create, or manage boards"
            >
              Boards ({boardList.length})
              <Icon name="chevronDown" size={12} className={open ? "rotate-180" : ""} />
            </Button>
          )}
        >
          {(close) => (
            <>
              <div className="max-h-80 overflow-y-auto">
                <MenuItem
                  icon={<Icon name="plus" size={14} />}
                  label="New Board"
                  accent
                  onClick={() => {
                    close();
                    onNewBoard();
                  }}
                />
                {boardList.length === 0 && (
                  <div className="px-3 py-3 text-xs text-ink-muted">
                    No boards yet — create one to start a line.
                  </div>
                )}
                {boardList.map((b) => (
                  <MenuItem
                    key={b.id}
                    icon={<Icon name="boards" size={14} />}
                    label={b.title || "Untitled board"}
                    description={
                      new Date(b.updatedAt).toLocaleDateString() +
                      " · " +
                      (Array.isArray(b.nodes) ? b.nodes.length : 0) +
                      " boxes"
                    }
                    active={b.id === currentBoardId}
                    onClick={() => {
                      close();
                      onLoadBoard(b.id);
                    }}
                  />
                ))}
              </div>
              {currentBoardId && (
                <>
                  <MenuDivider />
                  <MenuLabel>Board</MenuLabel>
                  <MenuItem
                    icon={<Icon name="rotate" size={14} />}
                    label="Clear this board"
                    description="Remove all boxes"
                    danger
                    onClick={() => {
                      close();
                      onClearBoard();
                    }}
                  />
                  <MenuItem
                    icon={<Icon name="trash" size={14} />}
                    label="Delete this board"
                    description="Remove it from the cloud"
                    danger
                    onClick={() => {
                      close();
                      onDeleteBoard();
                    }}
                  />
                </>
              )}
            </>
          )}
        </Menu>

        <div className="bar-divider mx-1.5" />

        {/* Usage + role views + account */}
        <div
          className="token-badge hidden sm:inline-flex"
          title={"Your total LLM tokens used: " + fmtTokens(totalTokens)}
        >
          <Icon name="zap" size={12} />
          <strong>{fmtTokens(totalTokens)}</strong>
          <span className="hidden md:inline text-[rgba(242,237,225,0.58)]">tok</span>
        </div>

        {isAdmin && (
          <Button
            variant="bar-ghost"
            size="sm"
            active={adminView}
            onClick={onToggleAdminView}
            title="Admin board — system stats and users"
            icon={<Icon name="admin" size={14} />}
          >
            Admin
          </Button>
        )}
        {(isAdmin || isFacilitator) && (
          <Button
            variant="bar-ghost"
            size="sm"
            active={facilitatorView}
            onClick={onToggleFacilitatorView}
            title="Facilitator dashboard — templates, workshops, teams"
            icon={<Icon name="facilitator" size={14} />}
          >
            <span className="sr-only" aria-hidden>🧑‍🏫 </span>Facilitator
          </Button>
        )}

        <Menu
          panelClassName="w-64"
          trigger={({ open, toggle }) => (
            <button
              type="button"
              onClick={toggle}
              className="account-pill"
              title="Account"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="account-avatar" />
              ) : (
                <span className="account-avatar">{avatarInitials}</span>
              )}
              <Icon
                name="chevronDown"
                size={12}
                className={"text-[rgba(242,237,225,0.6)]" + (open ? " rotate-180" : "")}
              />
            </button>
          )}
        >
          {(close) => (
            <>
              <div className="px-3 py-2.5 border-b border-rule">
                <p className="text-[13px] font-semibold text-ink truncate">
                  {user.displayName || "Signed in"}
                </p>
                <p className="data-mono text-ink-muted truncate mt-0.5">
                  {user.email || "Workshop guest"}
                </p>
              </div>
              <div className="py-1">
                <MenuItem
                  icon={<Icon name="logout" size={14} />}
                  label="Sign out"
                  danger
                  onClick={() => {
                    close();
                    onLogout();
                  }}
                />
              </div>
            </>
          )}
        </Menu>
      </div>
    </header>
  );
}

export default memo(Header);
