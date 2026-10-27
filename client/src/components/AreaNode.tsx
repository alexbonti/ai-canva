import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { useBoardStore } from "../store/boardStore.js";
import { AREA_COLORS } from "../types.js";
import { Icon } from "./ui/Icon.js";

/**
 * A drawn rectangular area — a zone on the map. It sits UNDER the boxes
 * (created via zIndex -1 by `addArea` in boardStore) and renders as a flat,
 * committed colour field with a hairline boundary, so the paper ground still
 * reads through it (DESIGN.md, "The Paper-Shows-Through Rule"). When selected
 * it shows a palette and a delete button; areas can be moved by dragging and
 * deleted with the keyboard.
 */
function AreaNodeInner({ id, data, selected }: NodeProps) {
  const setAreaColor = useBoardStore((s) => s.setAreaColor);
  const deleteBox = useBoardStore((s) => s.deleteBox);

  const fill = (data?.fill as string) || AREA_COLORS[0].fill;
  const border = (data?.border as string) || AREA_COLORS[0].border;

  return (
    <div
      className="w-full h-full rounded-md"
      style={{ backgroundColor: fill, border: `1px solid ${border}` }}
      title="Area — drag to move, select to recolor"
    >
      {selected && (
        <>
          {/* Color picker — very light shades only, so areas never compete
              with the boxes on top of them. */}
          <div className="nodrag absolute -top-10 left-0 flex items-center gap-1.5 rounded-md bg-card px-2 py-1.5 shadow-float border border-rule">
            {AREA_COLORS.map((c) => (
              <button
                key={c.fill}
                onClick={() => setAreaColor(id, c.fill, c.border)}
                title={`Area color — ${c.name}`}
                className={
                  "area-color-dot w-5 h-5 rounded-sm border transition hover:scale-110 " +
                  (fill === c.fill ? "border-ink scale-110" : "border-rule-strong")
                }
                style={{ backgroundColor: c.fill, borderColor: fill === c.fill ? c.border : undefined }}
              />
            ))}
          </div>
          {/* Delete */}
          <button
            onClick={() => deleteBox(id)}
            title="Delete area"
            className="box-delete nodrag absolute -top-3.5 -right-3.5 w-6 h-6 rounded-full bg-card text-ink-muted hover:text-state-error text-[13px] shadow-float border border-rule flex items-center justify-center"
          >
            <Icon name="x" size={12} />
          </button>
        </>
      )}
    </div>
  );
}

export default memo(AreaNodeInner);