/**
 * The app's data access: the last conversion, and the conversion history.
 *
 * Components call these, never Dexie directly. Every function awaits the database — the browser's
 * own, or the in-memory stand-in — so callers never learn which one they got.
 */
import { database, newId, type ConversionRow, type LastConversionRow } from "@/lib/db";

export const HISTORY_LIMIT = 10;

/** The conversion the form should open on, or undefined before the first one is made. */
export async function getLastConversion(): Promise<LastConversionRow | undefined> {
  return (await (await database.ready()).lastConversion.get("last"));
}

export async function saveLastConversion(
  entry: Omit<LastConversionRow, "id" | "updatedAt">,
): Promise<void> {
  await (await database.ready()).lastConversion.put({ ...entry, id: "last", updatedAt: Date.now() });
}

/** The newest history entries, newest first, capped at ten. */
export async function listRecentConversions(): Promise<ConversionRow[]> {
  return (await (await database.ready()).conversions.orderBy("createdAt").reverse().limit(HISTORY_LIMIT).toArray());
}

/**
 * Add a conversion to the history, then trim anything beyond the newest ten. A repeat of the
 * newest entry is lifted to the top rather than written twice.
 */
export async function addConversion(entry: Omit<ConversionRow, "id" | "createdAt">): Promise<void> {
  const db = await database.ready();
  const newest = await db.conversions.orderBy("createdAt").reverse().limit(1).first();
  const isRepeat =
    newest !== undefined &&
    newest.value === entry.value &&
    newest.fromUnit === entry.fromUnit &&
    newest.toUnit === entry.toUnit &&
    newest.ingredientId === entry.ingredientId;

  if (isRepeat) {
    await db.conversions.put({ ...newest, result: entry.result, createdAt: Date.now() });
  } else {
    await db.conversions.put({ ...entry, id: newId(), createdAt: Date.now() });
  }

  const keys = await db.conversions.orderBy("createdAt").reverse().primaryKeys();
  const stale = keys.slice(HISTORY_LIMIT);
  if (stale.length > 0) await db.conversions.bulkDelete(stale as string[]);
}

/** Everything: the history and the remembered last conversion. */
export async function clearConversions(): Promise<void> {
  const db = await database.ready();
  await db.transaction("rw", db.conversions, db.lastConversion, async () => {
    await db.conversions.clear();
    await db.lastConversion.clear();
  });
}
