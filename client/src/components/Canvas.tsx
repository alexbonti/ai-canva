import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
  useViewport,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type ReactFlowInstance,
} from "@xyflow/react";
import { useBoardStore } from "../store/boardStore.js";
import { AREA_COLORS } from "../types.js";
import { lineColorFor } from "../lib/lines.js";
import { isValidAreaSize, normalizeRect } from "../lib/areas.js";
import { Icon } from "./ui/Icon";
import { Button } from "./ui/Button.js";
import BoxNode from "./BoxNode.js";
import AreaNode from "./AreaNode.js";
import Cursors from "./Cursors.js";
import RouteEdge from "./RouteEdge.js";

const edgeTypes = { route: RouteEdge };

const nodeTypes = {
  agent: BoxNode,
  chatbot: BoxNode,
  idea: BoxNode,
  research: BoxNode,
  summarize: BoxNode,
  image: BoxNode,
  documents: BoxNode,
  cartoon: BoxNode,
  slides: BoxNode,
  code: BoxNode,
  codeedit: BoxNode,
  prd: BoxNode,
  devplan: BoxNode,
  codemap: BoxNode,
  ui: BoxNode,
  stitch: BoxNode,
  note: BoxNode,
  label: BoxNode,
  timer: BoxNode,
  checklist: BoxNode,
  "sdlc-intent": BoxNode,
  "sdlc-spec": BoxNode,
  "sdlc-plan": BoxNode,
  "sdlc-implement": BoxNode,
  "sdlc-review": BoxNode,
  "sdlc-merge": BoxNode,
  area: AreaNode,
  custom: BoxNode,
};

export default function Canvas() {
  const nodes = useBoardStore((s) => s.nodes);
  const edges = useBoardStore((s) => s.edges);
  const onNodesChange = useBoardStore((s) => s.onNodesChange);
  const onEdgesChange = useBoardStore((s) => s.onEdgesChange);
  const onConnect = useBoardStore((s) => s.onConnect);
  const updateCursorPosition = useBoardStore((s) => s.updateCursorPosition);
  const cleanupPresence = useBoardStore((s) => s.cleanupPresence);

  const { screenToFlowPosition } = useReactFlow();

  // Track mouse movement and update presence
  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      if (pos) {
        updateCursorPosition(pos.x, pos.y);
      }
    },
    [screenToFlowPosition, updateCursorPosition]
  );

  // Touch mirror of the presence cursor — iPads never fire mousemove, so
  // collaborators would otherwise not see where the tablet user is pointing.
  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      const pos = screenToFlowPosition({ x: t.clientX, y: t.clientY });
      if (pos) {
        updateCursorPosition(pos.x, pos.y);
      }
    },
    [screenToFlowPosition, updateCursorPosition]
  );

  // Cleanup presence on unmount
  useEffect(() => {
    return () => cleanupPresence();
  }, [cleanupPresence]);

  // === Chatbot auto-placement ===
  // Chatbots added from the palette carry data.autoPlace; on the effect tick
  // (and after every store update — it early-returns when none are pending)
  // each one is placed at the BOTTOM-CENTER of the current viewport, offset
  // horizontally so multiple companions don't stack.
  const placeChatbot = useBoardStore((s) => s.placeChatbot);
  useEffect(() => {
    const place = () => {
      const st = useBoardStore.getState();
      const pending = st.nodes.filter(
        (n) => n.type === "chatbot" && (n.data as Record<string, unknown> | undefined)?.autoPlace
      );
      if (pending.length === 0) return;
      const el = document.querySelector(".react-flow");
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Keep the "bottom-centre" spot inside the part of the canvas the user can
      // actually see — the palette panel (232px, right side) may be open.
      const sidebar = document.querySelector("[data-sidebar]");
      const sidebarVisible =
        !!sidebar && sidebar.getBoundingClientRect().left < rect.right - 8;
      const usableWidth = rect.width - (sidebarVisible ? 232 : 0);
      const alreadyHere = st.nodes.filter((n) => n.type === "chatbot").length - pending.length;
      pending.forEach((b, i) => {
        const pos = screenToFlowPosition({
          x: rect.left + usableWidth / 2 + (alreadyHere + i) * 150,
          y: rect.top + rect.height - 130,
        });
        if (pos) placeChatbot(b.id, pos);
      });
    };
    place();
    return useBoardStore.subscribe(place);
  }, [placeChatbot, screenToFlowPosition]);

  // === Area drawing tool ===
  const addArea = useBoardStore((s) => s.addArea);
  const [areaTool, setAreaTool] = useState(false);
  const [areaColorIdx, setAreaColorIdx] = useState(0);
  const [draft, setDraft] = useState<{ start: { x: number; y: number }; current: { x: number; y: number } } | null>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  // Begin a draft on pane mousedown while the tool is active; track the drag
  // with window listeners so the rectangle keeps following the cursor even
  // outside the pane.
  const onCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!areaTool) return;
      // Only start on empty canvas — not on an existing node/area.
      const target = e.target as HTMLElement;
      if (!target.classList.contains("react-flow__pane")) return;
      const p = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setDraft({ start: p, current: p });
      e.preventDefault();
    },
    [areaTool, screenToFlowPosition]
  );

  useEffect(() => {
    if (!draft) return;
    const track = (clientX: number, clientY: number) => {
      const d = draftRef.current;
      if (!d) return;
      setDraft({ ...d, current: screenToFlowPosition({ x: clientX, y: clientY }) });
    };
    const onMove = (e: MouseEvent) => track(e.clientX, e.clientY);
    const commit = () => {
      const d = draftRef.current;
      setDraft(null);
      if (!d) return;
      const rect = normalizeRect(d.start, d.current);
      if (isValidAreaSize(rect)) {
        const c = AREA_COLORS[areaColorIdx] || AREA_COLORS[0];
        addArea(rect, c.fill, c.border);
      }
    };
    const onTouchMove = (e: Event) => {
      const te = e as TouchEvent;
      if (te.touches.length !== 1) return;
      te.preventDefault();
      track(te.touches[0].clientX, te.touches[0].clientY);
    };
    const onTouchCancel = () => setDraft(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", commit);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", commit);
    window.addEventListener("touchcancel", onTouchCancel);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", commit);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", commit);
      window.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [draft !== null, areaColorIdx, addArea, screenToFlowPosition]);

  // Touch mirror of onCanvasMouseDown — iPads never fire the synthesized
  // mousedown on the pane (React Flow's touch handlers suppress it), so the
  // Area tool needs its own touchstart listener while it is active.
  useEffect(() => {
    if (!areaTool) return;
    const pane = document.querySelector<HTMLElement>(".react-flow__pane");
    if (!pane) return;
    const onTouchStart = (e: Event) => {
      const te = e as TouchEvent;
      if (te.touches.length !== 1) return;
      const target = te.target as HTMLElement;
      if (!target.classList.contains("react-flow__pane")) return;
      const t = te.touches[0];
      const p = screenToFlowPosition({ x: t.clientX, y: t.clientY });
      setDraft({ start: p, current: p });
      te.preventDefault();
    };
    pane.addEventListener("touchstart", onTouchStart, { passive: false });
    return () => pane.removeEventListener("touchstart", onTouchStart);
  }, [areaTool, screenToFlowPosition]);

  // Escape cancels an in-progress draft and deactivates the tool.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setDraft(null);
      setAreaTool(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const draftRect = draft ? normalizeRect(draft.start, draft.current) : null;

  // === The route: edges as transit lines ===
  // Subscribe to a *string* of running box ids (zustand bails out unless the
  // string changes), so a streaming output does not re-render the canvas.
  const runningIds = useBoardStore((s) => {
    let out = "";
    for (const id in s.boxData) {
      if (s.boxData[id]?.status === "running") out += id + ",";
    }
    return out;
  });
  const selectedNodeId = useMemo(
    () => nodes.find((n) => n.selected)?.id ?? null,
    [nodes]
  );
  const routeEdges = useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const running = new Set(runningIds.split(",").filter(Boolean));
    return edges.map((edge) => {
      const source = byId.get(edge.source);
      const color = lineColorFor(
        ((source?.data as Record<string, unknown> | undefined)?.boxType as string) ||
          source?.type
      );
      const touchesSelection =
        !!selectedNodeId &&
        (edge.source === selectedNodeId || edge.target === selectedNodeId);
      return {
        ...edge,
        type: "route",
        // Our own dash-march marks a running source; React Flow's generic
        // `animated` style would dash every route.
        animated: false,
        data: {
          ...(edge.data || {}),
          color,
          focused: touchesSelection,
          dimmed: !!selectedNodeId && !touchesSelection,
          running: running.has(edge.source),
        },
      };
    });
  }, [edges, nodes, selectedNodeId, runningIds]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={routeEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onMouseMove={onMouseMove}
      onMouseDown={onCanvasMouseDown}
      onTouchMove={onTouchMove}
      // Double-tap / double-click zoom is surprising on touch — the pinch
      // gesture already covers zooming.
      zoomOnDoubleClick={false}
      // While the area tool is active, dragging draws a rectangle instead of
      // panning the canvas or moving nodes.
      panOnDrag={!areaTool}
      nodesDraggable={!areaTool}
      className={areaTool ? "area-tool-active" : undefined}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      proOptions={{ hideAttribution: true }}
      // Treat every node as a "no wheel" zone: when the cursor is over a box,
      // trackpad scroll / pinch must not zoom the canvas (it would fight the
      // box's own scrolling). Zooming still works over empty canvas space.
      noWheelClassName="react-flow__node"
    >
      <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="#D8CFBA" />
      <Controls />
      <Cursors />
      {/* Area drawing tool */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        <Button
          size="xs"
          variant={areaTool ? "primary" : "secondary"}
          onClick={() => { setAreaTool((t) => !t); setDraft(null); }}
          title="Draw a rectangular area under the boxes"
          className="shadow-float"
        >
          <span className="sr-only" aria-hidden>▭ </span>
          <Icon name="area" size={12} />
          {areaTool ? "Drawing — Esc to stop" : "Area"}
        </Button>
        {areaTool && (
          <div className="flex items-center gap-1.5 rounded-md bg-card px-2 py-1.5 shadow-float border border-rule">
            {AREA_COLORS.map((c, i) => (
              <button
                key={c.fill}
                onClick={() => setAreaColorIdx(i)}
                title={`Draw color — ${c.name}`}
                className={
                  "w-5 h-5 rounded-sm border transition hover:scale-110 " +
                  (i === areaColorIdx ? "scale-110 border-ink" : "border-rule-strong")
                }
                style={{ backgroundColor: c.fill, borderColor: i === areaColorIdx ? c.border : undefined }}
              />
            ))}
          </div>
        )}
      </div>
      {/* Draft rectangle preview (viewport-transformed like Cursors) */}
      {draftRect && <AreaDraft rect={draftRect} />}
      <MiniMap
        pannable
        zoomable
        bgColor="#FBF7EC"
        maskColor="rgba(22,33,28,0.06)"
        nodeStrokeColor="#DCD4C1"
        nodeStrokeWidth={1}
        nodeColor={(node: Node) => {
          if (node.type === "area") {
            // Areas are flat land on the map — use their border shade.
            return (node.data as any)?.border || "#DCD4C1";
          }
          if (node.type === "custom") {
            return (node.data as any)?.customColor || "#6A5A93";
          }
          return lineColorFor(
            ((node.data as Record<string, unknown> | undefined)?.boxType as string) || node.type
          );
        }}
      />
    </ReactFlow>
  );
}

/** In-progress area rectangle, transformed with the viewport like Cursors. */
function AreaDraft({ rect }: { rect: { x: number; y: number; width: number; height: number } }) {
  const viewport = useViewport();
  return (
    <div
      className="absolute inset-0 pointer-events-none z-20"
      style={{
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        transformOrigin: "0 0",
      }}
    >
      <div
        className="absolute rounded-md"
        style={{
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
          backgroundColor: "rgba(242, 179, 0, 0.07)",
          border: "1.5px dashed #B57A00",
        }}
      />
    </div>
  );
}
