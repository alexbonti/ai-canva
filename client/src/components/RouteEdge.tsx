import { memo } from "react";
import { BaseEdge, getSmoothStepPath, type EdgeProps } from "@xyflow/react";

/**
 * The route — this redesign's signature move.
 *
 * A connection is not an arrow between two rectangles; it is a transit line
 * between two stops. It leaves the source as the source box's category line,
 * runs with rounded elbows over a paper casing (so it reads on the cream
 * ground), and arrives at a station knot at the target.
 *
 * Focus is a state, not an effect: when a box is selected, every route that
 * does not touch it recedes (opacity .18) and the selected box's own routes
 * are drawn a little heavier — "what feeds this?" answered without opening
 * anything. A running source box's line marches its dash.
 */
export interface RouteEdgeData {
  color?: string;
  /** The route touches the selected box. */
  focused?: boolean;
  /** Another box is selected and this route is not part of its line. */
  dimmed?: boolean;
  /** The source box is currently running. */
  running?: boolean;
}

function RouteEdgeInner({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps) {
  const d = (data || {}) as RouteEdgeData;
  const color = d.color || "#66736A";
  const opacity = d.dimmed ? 0.18 : 1;
  const weight = d.focused ? 3.4 : 2.6;

  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 14,
    offset: 18,
  });

  return (
    <g
      className={
        "route-edge" + (d.running ? " is-running" : "") + (d.dimmed ? " is-dimmed" : "")
      }
      style={{ opacity }}
    >
      {/* Paper casing: keeps a coloured line reading on a coloured ground. */}
      <path
        d={path}
        className="route-casing"
        fill="none"
        stroke="var(--paper)"
        strokeWidth={weight + 2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* BaseEdge keeps React Flow's interaction path (selection/clicks). */}
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth: weight,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        }}
      />
      {/* Station knot at the arrival end — the line terminates at a stop. */}
      <circle
        cx={targetX}
        cy={targetY}
        r={d.focused ? 4 : 3.2}
        fill="var(--card)"
        stroke={color}
        strokeWidth={2}
        pointerEvents="none"
      />
    </g>
  );
}

export default memo(RouteEdgeInner);
