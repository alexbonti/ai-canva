import { useState } from "react";
import { useBoardStore } from "../store/boardStore.js";
import { useUserBoxesStore } from "../store/userBoxesStore.js";
import { BOX_TYPES } from "../types.js";
import type { BoxType, BoxCategory, BoxRole } from "../types.js";
import CustomBoxModal from "./CustomBoxModal.js";

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const SECTIONS: { title: string; category: BoxCategory }[] = [
  { title: "Inputs", category: "input" },
  { title: "Workers", category: "worker" },
  { title: "Collaboration", category: "collab" },
  { title: "Custom", category: "custom" },
];

/** Role filters shown as a dropdown at the top of the palette. */
const ROLE_STORAGE_KEY = "ai-canva:sidebar-role";

export default function Sidebar({ open, onToggle }: SidebarProps) {
  const addBox = useBoardStore((s) => s.addBox);
  const addCustomBox = useBoardStore((s) => s.addCustomBox);
  const customDefs = useUserBoxesStore((s) => s.defs);
  const removeCustomDef = useUserBoxesStore((s) => s.remove);
  const [showCustomModal, setShowCustomModal] = useState(false);

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
            // The static "custom" meta is a runtime fallback, never a
            // palette item — the Custom section lists the user's saved
            // definitions instead.
            const boxes = boxesByCategory(section.category).filter(([t]) => t !== "custom");
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
                    <>
                      {/* The user's saved custom box templates — click to add
                          an instance to the board; ✕ removes the template
                          (boxes already on boards are unaffected). */}
                      {customDefs.map((def) => (
                        <div key={def.id} className="relative group">
                          <button
                            onClick={() => addCustomBox(def)}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition border-l-[3px] bg-slate-50 hover:bg-slate-100 text-slate-700"
                            style={{ borderLeftColor: def.color }}
                            title={def.description || "Add this custom box"}
                          >
                            <span className="text-base flex-shrink-0">{def.icon}</span>
                            <span className="flex-1 text-left truncate">{def.label}</span>
                          </button>
                          <button
                            onClick={() => removeCustomDef(def.id)}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full text-[10px] text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                            title="Delete this template (boards keep their copies)"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {customDefs.length === 0 && (
                        <p className="text-[11px] text-slate-400 px-1 leading-snug">
                          Create your own reusable AI boxes — saved to your profile.
                        </p>
                      )}
                      <button
                        onClick={() => setShowCustomModal(true)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition border-l-[3px] border-indigo-400 bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                        title="Create a custom box"
                      >
                        <span className="text-base flex-shrink-0">✨</span>
                        <span className="flex-1 text-left">New Custom Box</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Custom Box dialog */}
      {showCustomModal && <CustomBoxModal onClose={() => setShowCustomModal(false)} />}
    </>
  );
}