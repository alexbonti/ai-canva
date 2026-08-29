import { useState } from "react";
import { useBoardStore } from "../store/boardStore.js";
import { BOX_TYPES } from "../types.js";
import type { BoxType, BoxCategory, BoxRole } from "../types.js";

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const SECTIONS: { title: string; category: BoxCategory }[] = [
  { title: "Inputs", category: "input" },
  { title: "Workers", category: "worker" },
  { title: "Custom", category: "custom" },
];

/** Role filters shown as a dropdown at the top of the palette. */
const ROLE_STORAGE_KEY = "ai-canva:sidebar-role";

export default function Sidebar({ open, onToggle }: SidebarProps) {
  const addBox = useBoardStore((s) => s.addBox);

  const [role, setRole] = useState<"all" | BoxRole>(() => {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem(ROLE_STORAGE_KEY) : null;
    return stored === "designer" || stored === "developer" || stored === "product" ? stored : "all";
  });

  const handleAdd = (type: BoxType) => {
    addBox(type);
  };

  const selectRole = (next: "all" | BoxRole) => {
    setRole(next);
    if (typeof localStorage !== "undefined") {
      if (next === "all") localStorage.removeItem(ROLE_STORAGE_KEY);
      else localStorage.setItem(ROLE_STORAGE_KEY, next);
    }
  };

  /** True when a box should appear under the active role filter.
   *  `everyone` boxes are shared scaffolding and show in every view. */
  const boxVisible = (meta: typeof BOX_TYPES[BoxType]) =>
    role === "all" || meta.roles.includes("everyone") || meta.roles.includes(role);

  const boxesByCategory = (cat: BoxCategory) =>
    (Object.entries(BOX_TYPES) as [BoxType, typeof BOX_TYPES[BoxType]][])
      .filter(([, meta]) => meta.category === cat && boxVisible(meta));

  return (
    <>
      {/* Collapsed tab — shows when sidebar is hidden */}
      {!open && (
        <button
          onClick={onToggle}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white shadow-lg rounded-l-xl w-8 h-16 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition border border-r-0 border-slate-200"
          title="Show panel"
        >
          <span className="text-lg">◀</span>
        </button>
      )}

      {/* Sidebar panel */}
      <div
        className={"absolute right-0 top-0 bottom-0 z-20 bg-white shadow-xl border-l border-slate-200 transition-transform duration-300 " + (open ? "translate-x-0" : "translate-x-full")}
        style={{ width: "220px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-slate-100">
          <span className="text-sm font-bold text-slate-700">Add Box</span>
          <button
            onClick={onToggle}
            className="text-slate-400 hover:text-slate-600 transition w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100"
            title="Hide panel"
          >
            ✕
          </button>
        </div>

        {/* Role filter */}
        <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/60">
          <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <span>View</span>
          </label>
          <select
            value={role}
            onChange={(e) => selectRole(e.target.value as "all" | BoxRole)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-700 focus:border-blue-400 focus:outline-none"
            title="Filter which boxes appear in the palette"
          >
            <option value="all">🧩 All boxes</option>
            <option value="designer">🎨 Designer</option>
            <option value="developer">💻 Developer</option>
            <option value="product">📊 Product</option>
          </select>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto p-3 space-y-4" style={{ maxHeight: "calc(100% - 105px)" }}>
          {SECTIONS.map((section) => {
            const boxes = boxesByCategory(section.category);
            const isCustom = section.category === "custom";
            if (!isCustom && boxes.length === 0) return null;
            return (
              <div key={section.title}>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                  {section.title}
                </h3>
                <div className="space-y-1.5">
                  {boxes.map(([type, meta]) => (
                    <button
                      key={type}
                      onClick={() => handleAdd(type)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition border-l-[3px] bg-slate-50 hover:bg-slate-100 text-slate-700"
                      style={{ borderLeftColor: meta.color }}
                    >
                      <span className="text-base flex-shrink-0">{meta.icon}</span>
                      <span className="flex-1 text-left">{meta.label}</span>
                    </button>
                  ))}
                  {isCustom && (
                    <button
                      disabled
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition border-l-[3px] border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60"
                      title="Coming soon"
                    >
                      <span className="text-base flex-shrink-0">➕</span>
                      <span className="flex-1 text-left">Add Custom</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}