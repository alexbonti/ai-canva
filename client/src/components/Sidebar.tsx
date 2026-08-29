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

/** Role filters shown as chips at the top of the palette. */
const ROLE_FILTERS: { id: "all" | BoxRole; label: string; icon: string }[] = [
  { id: "all", label: "All", icon: "🧩" },
  { id: "designer", label: "Designer", icon: "🎨" },
  { id: "developer", label: "Developer", icon: "💻" },
  { id: "product", label: "Product", icon: "📊" },
];

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
          <div className="flex items-center gap-1.5">
            {ROLE_FILTERS.map((f) => {
              const active = role === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => selectRole(f.id)}
                  title={`Show ${f.label} boxes (${active ? "active" : "click to filter"})`}
                  className={
                    "flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition " +
                    (active
                      ? "bg-slate-800 text-white shadow"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200")
                  }
                >
                  <span className="text-sm">{f.icon}</span>
                  <span className="hidden sm:inline">{f.label}</span>
                </button>
              );
            })}
          </div>
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