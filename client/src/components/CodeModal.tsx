import { useState, useEffect, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import CodeEditor from "./CodeEditor.js";
import { wrapCodeInHtml } from "../lib/code.js";
import { toUiPreviewHtml } from "../lib/uidesign.js";
import { Button } from "./ui/Button.js";
import { Icon } from "./ui/Icon.js";
import type { BoxType } from "../types.js";

// Sandpack is heavy; lazy-load it so it only loads when a Code box is maximised.
// Use the bare lazy form (React.lazy unwraps the import's default export); do not
// chain `.then((m) => m.default)` — see BoxNode.tsx and AGENTS.md.
const SandpackPreview = lazy(() => import("./SandpackPreview.js"));

interface CodeModalProps {
  onClose: () => void;
  boxType: BoxType;
  code: string;
  onChange: (code: string) => void;
  title: string;
}

/** Small-caps pane caption on the card stock strip. */
function PaneCaption({ icon, children }: { icon: "code" | "eye"; children: string }) {
  return (
    <div className="flex flex-shrink-0 items-center gap-1.5 border-b border-rule bg-paper-raised px-3 py-1.5 text-ink-muted">
      <Icon name={icon} size={12} />
      <span className="label-caps">{children}</span>
    </div>
  );
}

/** The shared paper loading state (no spinner emoji). */
function PreviewLoading() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-card/95 text-[12px] text-ink-muted">
      <Icon name="loader" size={16} className="animate-spin" />
      <span>Loading preview…</span>
    </div>
  );
}

/**
 * Full-screen split view for a code box: editable code on the left, live
 * preview on the right. Rendered via a portal to document.body so it escapes
 * React Flow's transformed node container.
 *
 * Chrome is a pine header strip (box title + a cream Close control) over a
 * warm paper split, divided by a single hairline.
 */
export default function CodeModal({ onClose, boxType, code, onChange, title }: CodeModalProps) {
  const [previewLoading, setPreviewLoading] = useState(true);

  // Escape closes the split view — except while the code editor has focus,
  // where Escape belongs to CodeMirror (it dismisses the autocomplete popup).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest(".cm-editor")) return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Debounce the code fed to the preview: every keystroke changes `code`, and
  // rebuilding the Sandpack project (or the iframe srcDoc) per keystroke
  // restarts the bundler constantly — the preview never settles. The editor
  // stays live; the preview trails by ~400ms.
  const [previewCode, setPreviewCode] = useState(code);
  useEffect(() => {
    const t = setTimeout(() => setPreviewCode(code), 400);
    return () => clearTimeout(t);
  }, [code]);

  const isStitch = boxType === "stitch";
  const srcDoc = isStitch
    ? previewCode
    : boxType === "ui"
    ? toUiPreviewHtml(previewCode)
    : wrapCodeInHtml(previewCode);

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-paper">
      {/* Pine header strip */}
      <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-pine-line bg-pine px-4 py-2">
        <div className="flex min-w-0 items-center gap-2 text-cream">
          <Icon name="panel" size={14} className="text-cream/70" />
          <span className="truncate text-[13px] font-semibold tracking-[-0.01em]">{title}</span>
        </div>
        <Button
          variant="bar"
          onClick={onClose}
          icon={<Icon name="x" size={14} />}
          title="Close the split view"
        >
          Close
        </Button>
      </div>

      {/* Split view */}
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2">
        {/* Code pane */}
        <div className="flex min-h-0 flex-col border-b border-rule md:border-b-0 md:border-r">
          <PaneCaption icon="code">Code</PaneCaption>
          <div className="min-h-0 flex-1 p-2">
            <CodeEditor value={code} onChange={onChange} height="100%" />
          </div>
        </div>

        {/* Preview pane */}
        <div className="flex min-h-0 flex-col">
          <PaneCaption icon="eye">Preview</PaneCaption>
          <div className="relative m-2 min-h-0 flex-1 overflow-hidden rounded-sm border border-rule bg-card">
            {boxType === "code" ? (
              <Suspense fallback={<PreviewLoading />}>
                <SandpackPreview code={previewCode} height="100%" />
              </Suspense>
            ) : (
              <>
                {previewLoading && <PreviewLoading />}
                <iframe
                  srcDoc={srcDoc}
                  onLoad={() => setPreviewLoading(false)}
                  className="absolute inset-0 h-full w-full border-0"
                  sandbox="allow-scripts allow-popups allow-forms allow-same-origin allow-modals"
                  title="Preview"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
