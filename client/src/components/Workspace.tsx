/**
 * The signed-in board view: canvas + palette + floating canvas tools.
 *
 * Kept in its own module and lazy-loaded by App so the landing page does not
 * ship React Flow (or the markdown renderer used inside boxes) to a logged-out
 * visitor — this module is the only importer of `<ReactFlowProvider>`.
 */
import { ReactFlowProvider } from "@xyflow/react";
import Canvas from "./Canvas.js";
import Sidebar from "./Sidebar.js";
import Toolbar from "./Toolbar.js";

export default function Workspace({
  sidebarOpen,
  onToggleSidebar,
}: {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}) {
  return (
    <ReactFlowProvider>
      <Canvas />
      <Sidebar open={sidebarOpen} onToggle={onToggleSidebar} />
      <Toolbar />
    </ReactFlowProvider>
  );
}
