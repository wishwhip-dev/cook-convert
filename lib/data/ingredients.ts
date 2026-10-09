/**
 * The ingredient data and the conversion maths behind the app.
 *
 * Every ingredient carries the weights cooks actually use — grams per cup, per tablespoon and per
 * teaspoon (spoon-and-level measures, from standard kitchen charts) — and its bulk density in
 * grams per millilitre, which is exactly its grams-per-cup spread over the millilitres in a cup.
 * Deriving density that way keeps every column of the reference table consistent: a cup of flour
 * is 16 tablespoons of flour and 236.6 ml of flour, whichever way you come at it.
 *
 * This module is the single source of truth: the ingredient select and the reference table both
 * render from it, and nothing here knows about React or the database.
 */

/** The five units the converter works in. */
export const UNITS = ["cups", "grams", "millilitres", "tablespoons", "teaspoons"] as const;
export type Unit = (typeof UNITS)[number];

/** US customary cup, the one recipes mean unless they say otherwise. */
export const MILLILITRES_PER_CUP = 236.588;
export const TABLESPOONS_PER_CUP = 16;
export const TEASPOONS_PER_CUP = 48;

/** How each unit is written in a sentence like "240 g". */
export const UNIT_SHORT: Record<Unit, string> = {
  cups: "cups",
  grams: "g",
  millilitres: "ml",
  tablespoons: "tbsp",
  teaspoons: "tsp",
};

/** The plain unit names shown in the selects. */
export const UNIT_LABELS: Record<Unit, string> = {
  cups: "Cups",
  grams: "Grams",
  millilitres: "Millilitres",
  tablespoons: "Tablespoons",
  teaspoons: "Teaspoons",
};

type RawIngredient = {
  id: string;
  name: string;
  /** Grams in one level cup. */
  perCup: number;
  perTablespoon: number;
  perTeaspoon: number;
};

const RAW_INGREDIENTS: readonly RawIngredient[] = [
  { id: "all-purpose-flour", name: "All-purpose flour", perCup: 120, perTablespoon: 7.5, perTeaspoon: 2.5 },
  { id: "bread-flour", name: "Bread flour", perCup: 127, perTablespoon: 7.94, perTeaspoon: 2.65 },
  { id: "cake-flour", name: "Cake flour", perCup: 130, perTablespoon: 8.13, perTeaspoon: 2.71 },
  { id: "whole-wheat-flour", name: "Whole-wheat flour", perCup: 113, perTablespoon: 7.06, perTeaspoon: 2.35 },
  { id: "almond-flour", name: "Almond flour", perCup: 96, perTablespoon: 6, perTeaspoon: 2 },
  { id: "granulated-sugar", name: "Granulated sugar", perCup: 200, perTablespoon: 12.5, perTeaspoon: 4.17 },
  { id: "brown-sugar", name: "Brown sugar (packed)", perCup: 220, perTablespoon: 13.75, perTeaspoon: 4.58 },
  { id: "icing-sugar", name: "Icing sugar", perCup: 120, perTablespoon: 7.5, perTeaspoon: 2.5 },
  { id: "cocoa-powder", name: "Cocoa powder", perCup: 100, perTablespoon: 6.25, perTeaspoon: 2.08 },
  { id: "butter", name: "Butter", perCup: 227, perTablespoon: 14.19, perTeaspoon: 4.73 },
  { id: "margarine", name: "Margarine", perCup: 227, perTablespoon: 14.19, perTeaspoon: 4.73 },
  { id: "vegetable-oil", name: "Vegetable oil", perCup: 218, perTablespoon: 13.63, perTeaspoon: 4.54 },
  { id: "olive-oil", name: "Olive oil", perCup: 216, perTablespoon: 13.5, perTeaspoon: 4.5 },
  { id: "milk", name: "Milk (whole)", perCup: 244, perTablespoon: 15.25, perTeaspoon: 5.08 },
  { id: "double-cream", name: "Double (heavy) cream", perCup: 238, perTablespoon: 14.88, perTeaspoon: 4.96 },
  { id: "sour-cream", name: "Sour cream", perCup: 240, perTablespoon: 15, perTeaspoon: 5 },
  { id: "yoghurt", name: "Yoghurt (plain)", perCup: 245, perTablespoon: 15.31, perTeaspoon: 5.1 },
  { id: "water", name: "Water", perCup: 236.59, perTablespoon: 14.79, perTeaspoon: 4.93 },
  { id: "honey", name: "Honey", perCup: 340, perTablespoon: 21.25, perTeaspoon: 7.08 },
  { id: "maple-syrup", name: "Maple syrup", perCup: 322, perTablespoon: 20.13, perTeaspoon: 6.71 },
  { id: "golden-syrup", name: "Golden syrup", perCup: 348, perTablespoon: 21.75, perTeaspoon: 7.25 },
  { id: "peanut-butter", name: "Peanut butter", perCup: 258, perTablespoon: 16.13, perTeaspoon: 5.38 },
  { id: "rolled-oats", name: "Rolled oats", perCup: 90, perTablespoon: 5.63, perTeaspoon: 1.88 },
  { id: "white-rice", name: "White rice (uncooked)", perCup: 185, perTablespoon: 11.56, perTeaspoon: 3.85 },
  { id: "salt", name: "Salt (fine table)", perCup: 273, perTablespoon: 17.06, perTeaspoon: 5.69 },
  { id: "baking-powder", name: "Baking powder", perCup: 220, perTablespoon: 13.75, perTeaspoon: 4.58 },
  { id: "baking-soda", name: "Baking soda", perCup: 230, perTablespoon: 14.38, perTeaspoon: 4.79 },
  { id: "active-dry-yeast", name: "Active dry yeast", perCup: 144, perTablespoon: 9, perTeaspoon: 3 },
  { id: "cornflour", name: "Cornflour (cornstarch)", perCup: 128, perTablespoon: 8, perTeaspoon: 2.67 },
  { id: "chocolate-chips", name: "Chocolate chips", perCup: 170, perTablespoon: 10.63, perTeaspoon: 3.54 },
  { id: "raisins", name: "Raisins", perCup: 145, perTablespoon: 9.06, perTeaspoon: 3.02 },
  { id: "chopped-walnuts", name: "Walnuts (chopped)", perCup: 113, perTablespoon: 7.06, perTeaspoon: 2.35 },
  { id: "desiccated-coconut", name: "Desiccated coconut", perCup: 80, perTablespoon: 5, perTeaspoon: 1.67 },
  { id: "grated-parmesan", name: "Parmesan (grated)", perCup: 90, perTablespoon: 5.63, perTeaspoon: 1.88 },
];

export type Ingredient = RawIngredient & {
  /** Bulk density: grams per millilitre, i.e. the cup weight spread over the ml in a cup. */
  density: number;
};

const roundTo = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export const INGREDIENTS: Ingredient[] = RAW_INGREDIENTS.map((raw) => ({
  ...raw,
  density: roundTo(raw.perCup / MILLILITRES_PER_CUP, 4),
}));

const byId = new Map(INGREDIENTS.map((ingredient) => [ingredient.id, ingredient]));

export function getIngredient(id: string): Ingredient | undefined {
  return byId.get(id);
}

// Used when a saved history row names an ingredient this build no longer ships.
export const FALLBACK_INGREDIENT = INGREDIENTS[0]!;

/** Grams in `value` of the unit, for this ingredient. */
export function toGrams(value: number, unit: Unit, ingredient: Ingredient): number {
  switch (unit) {
    case "grams":
      return value;
    case "cups":
      return value * ingredient.perCup;
    case "tablespoons":
      return value * ingredient.perTablespoon;
    case "teaspoons":
      return value * ingredient.perTeaspoon;
    case "millilitres":
      return value * ingredient.density;
  }
}

/** The value of `grams` expressed in the unit, for this ingredient. */
export function fromGrams(grams: number, unit: Unit, ingredient: Ingredient): number {
  switch (unit) {
    case "grams":
      return grams;
    case "cups":
      return grams / ingredient.perCup;
    case "tablespoons":
      return grams / ingredient.perTablespoon;
    case "teaspoons":
      return grams / ingredient.perTeaspoon;
    case "millilitres":
      return grams / ingredient.density;
  }
}

export function convertValue(value: number, from: Unit, to: Unit, ingredient: Ingredient): number {
  return fromGrams(toGrams(value, from, ingredient), to, ingredient);
}

/**
 * How much text to type for `value` in the unit: two decimals or fewer, trailing zeros trimmed,
 * and enough precision on very small amounts that 0.5 tsp of salt does not come out as "0".
 */
export function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const abs = Math.abs(value);
  let decimals = abs >= 10_000 ? 0 : abs >= 100 ? 1 : 2;
  let text = roundTo(value, decimals).toFixed(decimals);
  if (Number(text) === 0 && abs > 0) {
    decimals = abs < 0.0001 ? 6 : 4;
    text = roundTo(value, decimals).toFixed(decimals);
  }
  if (text.includes(".")) text = text.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  return text;
}

/** "2 cups", "1 cup", "250 g" — an amount spoken aloud. */
export function describeAmount(value: number, unit: Unit): string {
  const n = formatAmount(value);
  if (unit === "cups") return `${n} ${value === 1 ? "cup" : "cups"}`;
  return `${n} ${UNIT_SHORT[unit]}`;
}

/** A table weight: the stored value with trailing zeros trimmed ("273", "2.5", "236.59"). */
export function formatGrams(value: number): string {
  const text = value.toFixed(2);
  return text.includes(".") ? text.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "") : text;
}

export type ParsedAmount = { ok: true; value: number } | { ok: false; reason: "empty" | "invalid" | "negative" };

/**
 * What the amount box holds. Empty and unparseable text give no answer rather than a wrong one,
 * and negatives are refused — a cook never measures minus two cups.
 */
export function parseAmount(text: string): ParsedAmount {
  const cleaned = text.trim().replace(",", ".");
  if (!cleaned) return { ok: false, reason: "empty" };
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return { ok: false, reason: "invalid" };
  if (value < 0) return { ok: false, reason: "negative" };
  return { ok: true, value };
}
