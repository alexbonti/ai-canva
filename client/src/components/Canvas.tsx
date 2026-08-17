import { useCallback } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import { useBoardStore } from "../store/boardStore.js";
import BoxNode from "./BoxNode.js";

const nodeTypes = {
  idea: BoxNode,
  research: BoxNode,
  summarize: BoxNode,
  image: BoxNode,
  cartoon: BoxNode,
  slides: BoxNode,
  code: BoxNode,
  prd: BoxNode,
};

export default function Canvas() {
  const nodes = useBoardStore((s) => s.nodes);
  const edges = useBoardStore((s) => s.edges);
  const onNodesChange = useBoardStore((s) => s.onNodesChange);
  const onEdgesChange = useBoardStore((s) => s.onEdgesChange);
  const onConnect = useBoardStore((s) => s.onConnect);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      defaultEdgeOptions={{
        animated: true,
        style: { stroke: "#94a3b8", strokeWidth: 2 },
      }}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} />
      <Controls />
      <MiniMap
        pannable
        zoomable
        nodeColor={(node: Node) => {
          const colors: Record<string, string> = {
            idea: "#fbbf24",
            research: "#60a5fa",
            summarize: "#a78bfa",
            image: "#34d399",
            cartoon: "#f472b6",
            slides: "#fb923c",
            code: "#22d3ee",
            prd: "#818cf8",
          };
          return colors[node.type || ""] || "#94a3b8";
        }}
      />
    </ReactFlow>
  );
}