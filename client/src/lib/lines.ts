import { BOX_TYPES } from "../types.js";
import type { BoxCategory, BoxType } from "../types.js";

/**
 * Line colours — the board's one colour system (DESIGN.md, "The Printed Line").
 *
 * A box's identity is its category line, never a per-type rainbow: inputs are
 * amber, the SDLC stages oxblood, workers blue, companions coral, collaboration
 * green, custom boxes violet. These colours are used for the station dot, the
 * header wash, the route line and the minimap.
 */
export const LINE_COLORS: Record<BoxCategory, string> = {
  input: "#B57A00",
  sdlc: "#9C3A31",
  worker: "#2A5A94",
  companion: "#BF543C",
  collab: "#3B7557",
  custom: "#6A5A93",
};

/** Short station-code prefixes — the monospace code shown on each box. */
const STATION_PREFIX: Record<string, string> = {
  agent: "AGT",
  chatbot: "PAL",
  idea: "IDE",
  image: "IMG",
  documents: "DOC",
  research: "RES",
  summarize: "SUM",
  prd: "PRD",
  devplan: "DPL",
  codemap: "CMP",
  codeedit: "CED",
  cartoon: "CAR",
  slides: "SLD",
  code: "COD",
  ui: "UID",
  stitch: "STI",
  note: "NTE",
  label: "LBL",
  timer: "TMR",
  checklist: "CHK",
  custom: "CUS",
  "sdlc-intent": "INT",
  "sdlc-spec": "SPC",
  "sdlc-plan": "PLN",
  "sdlc-implement": "IMP",
  "sdlc-review": "REV",
  "sdlc-merge": "MRG",
};

/** The category line a box type belongs to (unknown types fall back to custom). */
export function lineCategoryFor(type: BoxType | string | undefined | null): BoxCategory {
  if (!type) return "custom";
  const meta = BOX_TYPES[type as BoxType];
  return (meta?.category as BoxCategory) || "custom";
}

/** The line colour for a box type (used for edges, dots, minimap, handles). */
export function lineColorFor(type: BoxType | string | undefined | null): string {
  return LINE_COLORS[lineCategoryFor(type)] || LINE_COLORS.custom;
}

/**
 * The station code shown in a box header: `RES-02` — prefix plus the box's
 * 1-based index among boxes of the same type on the board. Stable enough to
 * read as a line reference and cheap to compute.
 */
export function stationCode(type: BoxType | string | undefined | null, index: number): string {
  const prefix = STATION_PREFIX[type || ""] || "BOX";
  const n = Math.max(1, index);
  return prefix + "-" + String(n).padStart(2, "0");
}
