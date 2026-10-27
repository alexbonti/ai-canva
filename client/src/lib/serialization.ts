import type { BoxData } from "../types.js";

/**
 * Recursively removes `undefined` values from a plain JSON-ish value.
 *
 * Firestore rejects `undefined` ANYWHERE inside a document value — not just at
 * the top level — and the rejection fails the whole board save. A parser that
 * leaves an optional key set to `undefined` (the Slides box did exactly that
 * for `notes`) is enough to silently stop every box's work from persisting, so
 * the serialization layer strips nested `undefined` defensively instead of
 * trusting every writer to be careful.
 */
function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const cleaned: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (entry === undefined) continue;
      cleaned[key] = stripUndefinedDeep(entry);
    }
    return cleaned as T;
  }
  return value;
}

/**
 * Cleans per-box data before persisting to Firestore.
 *
 * - Drops `undefined` values, at the top level AND nested inside arrays/objects
 *   (Firestore's updateDoc rejects them anywhere).
 * - Strips base64 `imageData` (can exceed Firestore's 1MB document limit) but
 *   keeps already-uploaded image URLs (strings not starting with `data:`).
 *
 * Extracted from boardStore so the serialization rules can be unit-tested.
 */
export function cleanBoxDataForFirestore(
  boxData: Record<string, BoxData>
): Record<string, Record<string, unknown>> {
  return Object.fromEntries(
    Object.entries(boxData).map(([id, data]) => {
      const cleaned: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        if (value === undefined) continue;
        // Strip base64 imageData (too large for Firestore) but keep URLs.
        if (
          key === "imageData" &&
          typeof value === "string" &&
          value.startsWith("data:")
        ) {
          continue;
        }
        cleaned[key] = stripUndefinedDeep(value);
      }
      return [id, cleaned];
    })
  );
}

/** Message shown on a box whose run was cut off by a reload / lost connection. */
export const INTERRUPTED_RUN_MESSAGE =
  "This run was interrupted (the page was reloaded or the connection dropped). Run the box again.";

/**
 * Repairs per-box data when a board is loaded from persistence (localStorage
 * rehydration or Firestore).
 *
 * A `status: "running"` box is only meaningful while the JS that started it is
 * still alive: `runBox` refuses to start a run on a box that reports `running`,
 * and nothing else ever clears the flag. So a reload, a closed tab or a lost
 * connection in the middle of a model call used to leave the box permanently
 * dead — Run disabled, for every collaborator, across every reload. Treat any
 * persisted/fetched `running` status as an interrupted run: the error is shown
 * on the box and Run works again.
 *
 * Live snapshot updates are deliberately NOT normalized — another user may be
 * mid-run, and their box must keep showing "running" until their run ends.
 */
export function normalizeBoxDataForLoad(
  boxData: Record<string, BoxData>
): Record<string, BoxData> {
  let changed = false;
  const normalized: Record<string, BoxData> = {};
  for (const [id, data] of Object.entries(boxData || {})) {
    if (data && data.status === "running") {
      normalized[id] = {
        ...data,
        status: "error",
        error: INTERRUPTED_RUN_MESSAGE,
      };
      changed = true;
    } else {
      normalized[id] = data;
    }
  }
  return changed ? normalized : boxData;
}
