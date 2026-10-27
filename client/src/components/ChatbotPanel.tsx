import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import { useBoardStore } from "../store/boardStore.js";
import { chatbotName } from "../lib/chatbot.js";
import StickFigure from "./StickFigure.js";
import { Button } from "./ui/Button.js";
import { Icon } from "./ui/Icon.js";

interface ChatbotPanelProps {
  id: string;
  onClose: () => void;
}

/** The one field recipe every dialog/sheet in "The Printed Line" uses. */
const FIELD =
  "w-full rounded-sm border border-rule bg-card px-2.5 text-[12.5px] text-ink " +
  "placeholder:text-ink-muted focus:outline-none focus:border-pine focus:ring-2 focus:ring-signal/30";

/** Transcript timestamps are data, so they stay in the mono face. */
const stamp = (at: number) =>
  new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/**
 * The chat panel for a Chatbot companion, portaled to document.body (like
 * CodeModal) so it escapes React Flow's transformed node container.
 * Header: companion figure + editable name + personality editor + clear/close.
 * Body: a ruled transcript — user turns on raised paper, companion turns on
 * card stock with a coral station dot; several board members share one bot.
 */
export default function ChatbotPanel({ id, onClose }: ChatbotPanelProps) {
  const boxData = useBoardStore((s) => s.boxData[id]);
  const nodeTitle = useBoardStore(
    (s) => (s.nodes.find((n) => n.id === id)?.data?.title as string) || ""
  );
  const sendChatMessage = useBoardStore((s) => s.sendChatMessage);
  const clearChat = useBoardStore((s) => s.clearChat);
  const setBoxName = useBoardStore((s) => s.setBoxName);
  const updateBoxData = useBoardStore((s) => s.updateBoxData);

  const [draft, setDraft] = useState("");
  const [showPersona, setShowPersona] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const name = chatbotName(nodeTitle);
  const busy = boxData?.status === "running";
  const hasError = boxData?.status === "error";
  const messages = boxData?.chatMessages || [];

  // Keep the transcript scrolled to the newest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, busy]);

  // Escape closes the panel (outside-click intentionally does not — a chat
  // window stays put until dismissed).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!boxData) return null;

  const send = () => {
    const t = draft.trim();
    if (!t || busy) return;
    setDraft("");
    sendChatMessage(id, t);
  };

  /**
   * Retry a failed reply: drop the trailing exchange (the user message(s)
   * with no bot answer) and re-send the text.
   */
  const retry = () => {
    const msgs = boxData.chatMessages || [];
    let lastBot = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === "bot") { lastBot = i; break; }
    }
    const failed = msgs.slice(lastBot + 1);
    const text = failed
      .filter((m) => m.role === "user")
      .map((m) => m.text)
      .join("\n");
    updateBoxData(id, { chatMessages: msgs.slice(0, lastBot + 1) });
    if (text) sendChatMessage(id, text);
  };

  return createPortal(
    <div
      data-testid="chatbot-panel"
      className="fixed z-50 flex flex-col overflow-hidden rounded-md border border-rule bg-card shadow-float"
      style={{ right: 16, bottom: 16, width: 360, height: "min(560px, calc(100vh - 96px))" }}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex flex-shrink-0 items-center gap-1.5 border-b border-rule px-2.5 py-2">
        <StickFigure size={26} tone="#BF543C" busy={busy} hideShadow />
        <input
          value={name}
          onChange={(e) => setBoxName(id, e.target.value)}
          className={
            "h-7 min-w-0 flex-1 rounded-sm border border-transparent bg-transparent px-1 " +
            "text-[13px] font-semibold text-ink transition-colors hover:bg-paper-raised " +
            "focus:border-pine focus:bg-card focus:outline-none focus:ring-2 focus:ring-signal/30"
          }
          title="Rename this companion"
          aria-label="Companion name"
        />
        {/* .box-icon-btn is defined after Tailwind's utilities, so the pressed
            fill has to come from the custom properties, not a utility class. */}
        <button
          onClick={() => setShowPersona((v) => !v)}
          aria-pressed={showPersona}
          aria-label="Personality"
          title="Personality — describe who this companion is"
          className="box-icon-btn"
          style={
            showPersona
              ? { backgroundColor: "var(--paper-raised)", color: "var(--ink)" }
              : undefined
          }
        >
          <Icon name="wand" size={14} />
        </button>
        <button
          onClick={() => clearChat(id)}
          aria-label="Clear conversation"
          title="Clear conversation"
          className="box-icon-btn"
        >
          <Icon name="trash" size={14} />
        </button>
        <button
          onClick={onClose}
          aria-label="Close chat"
          title="Close chat"
          className="box-icon-btn"
        >
          <Icon name="x" size={15} />
        </button>
      </div>

      {/* Personality editor */}
      {showPersona && (
        <div className="flex-shrink-0 border-b border-rule bg-paper-raised px-3 py-2">
          <p className="label-caps mb-1 text-ink-muted">Personality</p>
          <textarea
            className={FIELD + " min-h-[60px] resize-y py-2 text-[11.5px] leading-[1.5]"}
            placeholder="e.g. A sarcastic senior designer who still gives genuinely useful advice; short sentences; loves questioning assumptions."
            value={boxData.personality || ""}
            onChange={(e) => updateBoxData(id, { personality: e.target.value })}
          />
          {!boxData.personality && (
            <p className="mt-1 text-[11px] leading-snug text-ink-muted">
              Describe who this companion is and how it talks. Empty = a friendly default
              brainstorm buddy.
            </p>
          )}
        </div>
      )}

      {/* Transcript — a ruled log, not a bubble thread */}
      <div ref={scrollRef} data-testid="chat-transcript" className="min-h-0 flex-1 overflow-y-auto">
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={
                "border-b border-rule px-3 py-2 " + (isUser ? "bg-paper-raised" : "bg-card")
              }
            >
              <div className="mb-1 flex items-center gap-1.5">
                {isUser ? (
                  <span className="label-caps truncate text-ink-muted">{m.by || "you"}</span>
                ) : (
                  <>
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-pill bg-line-companion"
                      aria-hidden
                    />
                    <span className="label-caps text-ink-muted">companion</span>
                  </>
                )}
                <span className="data-mono ml-auto flex-shrink-0 text-ink-muted">
                  {stamp(m.at)}
                </span>
              </div>
              {isUser ? (
                <p className="whitespace-pre-wrap break-words text-[13px] leading-[1.5] text-ink">
                  {m.text}
                </p>
              ) : (
                <div className="markdown-output text-[12.5px]">
                  <ReactMarkdown>{m.text}</ReactMarkdown>
                </div>
              )}
            </div>
          );
        })}

        {busy && (
          <div className="flex items-center gap-2 border-b border-rule bg-card px-3 py-2.5">
            <span className="h-2 w-2 flex-shrink-0 rounded-pill bg-line-companion" aria-hidden />
            <span className="chatbot-dots" aria-hidden>
              <span /><span /><span />
            </span>
            <span className="label-caps text-ink-muted">thinking</span>
          </div>
        )}

        {messages.length === 0 && !busy && (
          <div className="px-5 py-8 text-center">
            <p className="text-[12.5px] font-medium text-ink">Say hello to {name}.</p>
            <p className="mx-auto mt-1 max-w-[230px] text-[11px] leading-snug text-ink-muted">
              {name} can see what's on this board — ask what to do next, or just talk it through.
            </p>
          </div>
        )}
      </div>

      {/* Error + retry */}
      {hasError && !busy && (
        <div className="flex flex-shrink-0 items-center gap-2 border-t border-rule bg-error-wash px-3 py-1.5">
          <Icon name="alert" size={13} className="text-state-error" />
          <span
            className="min-w-0 flex-1 truncate text-[11.5px] text-state-error"
            title={boxData.error}
          >
            {boxData.error}
          </span>
          <Button variant="secondary" size="xs" onClick={retry}>
            Retry
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="flex flex-shrink-0 items-end gap-2 border-t border-rule px-3 py-2">
        <textarea
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={`Message ${name}…`}
          aria-label={`Message ${name}`}
          className={FIELD + " min-h-[32px] max-h-[96px] flex-1 resize-none py-1.5"}
        />
        <Button
          variant="primary"
          onClick={send}
          disabled={busy || !draft.trim()}
          icon={<Icon name="arrowRight" size={14} />}
        >
          {busy ? "…" : "Send"}
        </Button>
      </div>

      {/* Token usage footer */}
      {boxData.tokens && (
        <div className="flex flex-shrink-0 items-center justify-end gap-1.5 border-t border-rule bg-paper-raised px-3 py-1 text-ink-muted">
          <Icon name="zap" size={10} />
          <span className="data-mono">
            {boxData.tokens.totalTokens.toLocaleString()} tok total
          </span>
        </div>
      )}
    </div>,
    document.body
  );
}
