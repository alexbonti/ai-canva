import { useState } from "react";
import { useBoardStore } from "../store/boardStore.js";
import { useUserBoxesStore } from "../store/userBoxesStore.js";
import { BOX_TYPES } from "../types.js";
import type { BoxType, BoxCategory, BoxRole } from "../types.js";
import CustomBoxModal from "./CustomBoxModal.js";
import { Icon, BOX_ICON } from "./ui/Icon.js";
import { LINE_COLORS, lineCategoryFor } from "../lib/lines.js";

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const SECTIONS: { title: string; category: BoxCategory }[] = [
  { title: "Inputs", category: "input" },
  // The gated SDLC pipeline (stages 1-6, in order). Kept next to Inputs because
  // an Idea box is the usual seed for stage 1.
  { title: "SDLC", category: "sdlc" },
  { title: "Workers", category: "worker" },
  { title: "Companions", category: "companion" },
  { title: "Collaboration", category: "collab" },
  { title: "Custom", category: "custom" },
];

/** Role filters shown as a dropdown at the top of the palette. */
const ROLE_STORAGE_KEY = "ai-canva:sidebar-role";

/** The selectable role profiles (must stay in sync with the <option> list). */
const ROLES: BoxRole[] = ["designer", "developer", "product", "sdlc"];

const ROLE_LABELS: Record<BoxRole, string> = {
  everyone: "Everyone",
  designer: "Designer",
  developer: "Developer",
  product: "Product",
  sdlc: "SDLC",
};

export default function Sidebar({ open, onToggle }: SidebarProps) {
  const addBox = useBoardStore((s) => s.addBox);
  const addCustomBox = useBoardStore((s) => s.addCustomBox);
  const customDefs = useUserBoxesStore((s) => s.defs);
  const removeCustomDef = useUserBoxesStore((s) => s.remove);
  const [showCustomModal, setShowCustomModal] = useState(false);

  const [role, setRole] = useState<"all" | BoxRole>(() => {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem(ROLE_STORAGE_KEY) : null;
    return ROLES.includes(stored as BoxRole) ? (stored as BoxRole) : "all";
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
          className="sidebar-tab absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-card shadow-float rounded-l-md w-8 h-16 flex items-center justify-center text-ink-muted hover:text-ink hover:bg-paper-raised transition border border-r-0 border-rule"
          title="Show panel"
        >
          <Icon name="panelLeft" size={15} />
        </button>
      )}

      {/* Sidebar panel */}
      <aside
        aria-label="Box palette"
        className={
          "absolute right-0 top-0 bottom-0 z-20 bg-paper-raised border-l border-rule " +
          "transition-transform duration-300 ease-paper flex flex-col " +
          (open ? "translate-x-0" : "translate-x-full")
        }
        style={{ width: "232px" }}
        data-sidebar=""
      >
        {/* Header */}
        <div className="flex items-center justify-between pl-3.5 pr-2 h-12 border-b border-rule flex-shrink-0">
          <span className="label-caps text-ink">Add Box</span>
          <button
            onClick={onToggle}
            className="box-icon-btn"
            title="Hide panel"
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        {/* Role filter */}
        <div className="px-3 py-2.5 border-b border-rule flex-shrink-0">
          <label htmlFor="palette-role" className="label-caps mb-1 block text-ink-muted">View</label>
          <select
            id="palette-role"
            value={role}
            onChange={(e) => selectRole(e.target.value as "all" | BoxRole)}
            className="w-full h-8 rounded-sm border border-rule bg-card px-2 text-[12.5px] font-medium text-ink-soft focus:border-pine focus:outline-none focus:ring-2 focus:ring-signal/30 transition"
            title="Filter which boxes appear in the palette"
          >
            <option value="all">All boxes</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>

        {/* Scrollable palette */}
        <div className="flex-1 min-h-0 overflow-y-auto py-2">
          {SECTIONS.map((section) => {
            // The static "custom" meta is a runtime fallback, never a
            // palette item — the Custom section lists the user's saved
            // definitions instead.
            const boxes = boxesByCategory(section.category).filter(([t]) => t !== "custom");
            const isCustom = section.category === "custom";
            if (!isCustom && boxes.length === 0) return null;
            const lineColor = LINE_COLORS[section.category] || LINE_COLORS.custom;
            return (
              <div key={section.title} className="mb-1">
                {/* Section = a line on the map: swatch, caps name, hairline. */}
                <h3 className="flex items-center gap-2 px-3.5 pt-2.5 pb-1.5">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: lineColor }}
                    aria-hidden
                  />
                  <span className="label-caps text-ink-muted">{section.title}</span>
                  <span className="flex-1 h-px bg-rule" aria-hidden />
                </h3>
                <div>
                  {boxes.map(([type, meta]) => (
                    <button
                      key={type}
                      onClick={() => handleAdd(type)}
                      className="palette-row w-full flex items-center gap-2.5 px-3.5 py-[7px] text-left transition-colors hover:bg-card focus:outline-none focus-visible:bg-card"
                      title={meta.description}
                    >
                      <span
                        className="flex items-center justify-center flex-shrink-0"
                        style={{ color: lineColor }}
                      >
                        {BOX_ICON[type] ? (
                          <Icon name={BOX_ICON[type]} size={15} />
                        ) : (
                          <span className="text-[13px] leading-none">{meta.icon}</span>
                        )}
                      </span>
                      <span className="flex-1 text-[12.5px] font-medium text-ink-soft truncate">
                        {meta.label}
                      </span>
                    </button>
                  ))}
                  {isCustom && (
                    <>
                      {/* The user's saved custom box templates — click to add
                          an instance to the board; the delete button removes the template
                          (boxes already on boards are unaffected). */}
                      {customDefs.map((def) => (
                        <div key={def.id} className="relative group">
                          <button
                            onClick={() => addCustomBox(def)}
                            className="palette-row w-full flex items-center gap-2.5 px-3.5 py-[7px] text-left transition-colors hover:bg-card focus:outline-none focus-visible:bg-card"
                            title={def.description || "Add this custom box"}
                          >
                            <span
                              className="w-5 h-5 rounded-sm flex items-center justify-center text-[11px] flex-shrink-0"
                              style={{ backgroundColor: def.color + "1F" }}
                            >
                              {def.icon}
                            </span>
                            <span className="flex-1 text-[12.5px] font-medium text-ink-soft truncate">
                              {def.label}
                            </span>
                          </button>
                          <button
                            onClick={() => removeCustomDef(def.id)}
                            className="touch-visible absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full text-[11px] text-ink-muted hover:text-state-error hover:bg-error-wash opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                            title="Delete this template (boards keep their copies)"
                          >
                            <Icon name="x" size={10} />
                          </button>
                        </div>
                      ))}
                      {customDefs.length === 0 && (
                        <p className="text-[11px] text-ink-muted px-3.5 py-1 leading-snug">
                          Your own reusable AI boxes — saved to your profile.
                        </p>
                      )}
                      <div className="px-3 pt-1.5 pb-2">
                        <button
                          onClick={() => setShowCustomModal(true)}
                          className="palette-row w-full flex items-center gap-2 px-2.5 py-2 rounded-sm border border-dashed border-rule-strong text-left transition-colors hover:border-pine hover:bg-card"
                          title="Create a custom box"
                        >
                          <Icon name="plus" size={12} className="text-pine" />
                          <span className="flex-1 text-[12px] font-medium text-pine truncate">
                            New Custom Box
                          </span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Create Custom Box dialog */}
      {showCustomModal && <CustomBoxModal onClose={() => setShowCustomModal(false)} />}
    </>
  );
}
