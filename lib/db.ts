/**
 * This application's database.
 *
 * The reusable half of the setup is in `lib/storage/` and is not edited. This file is the half
 * that describes the product: which tables exist, what is indexed, and how the schema has changed
 * over time.
 *
 * This is the first release, so version 1 is entirely ours — the starter's example tables and
 * seed were replaced, not migrated away from.
 */
import { defineDatabase } from "@/lib/storage/database";
import type { Unit } from "@/lib/data/ingredients";

/** One entry in the conversion history. */
export type ConversionRow = {
  id: string;
  /** The amount that was converted. */
  value: number;
  fromUnit: Unit;
  toUnit: Unit;
  ingredientId: string;
  /** The answer in `toUnit`, kept with the row so the list can show it without recomputing. */
  result: number;
  /** Epoch millis. Indexed, because the history is ordered by it. */
  createdAt: number;
};

/**
 * The conversion the form opens on — value, units and ingredient — so a reload puts you back
 * where you were. A single fixed-id row, rewritten on every conversion.
 */
export type LastConversionRow = {
  id: "last";
  value: number;
  fromUnit: Unit;
  toUnit: Unit;
  ingredientId: string;
  updatedAt: number;
};

/** Ids are generated here so the data layer never depends on an auto-increment round trip. */
export function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const database = defineDatabase<{
  conversions: ConversionRow;
  lastConversion: LastConversionRow;
}>({
  // Part of the origin's storage identity. Renaming it does not migrate anything — it points the
  // application at a different, empty database and abandons the old one in place. That is exactly
  // what you want on a first build, and never what you want afterwards.
  name: "kitchen-convert",
  versions: [
    // Only the primary key and the properties queried on. History rows are read newest-first via
    // `createdAt`; `lastConversion` is always fetched by its fixed id.
    { version: 1, stores: { conversions: "id, createdAt", lastConversion: "id" } },
  ],
  // No seed: the converter opens on a sensible default conversion, and an empty history says so.
});
