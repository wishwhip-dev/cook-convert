"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeftRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShareButton } from "@/components/share-button";
import { identity } from "@/app/identity";
import { renderShareCard } from "@/lib/share";
import { database, type ConversionRow } from "@/lib/db";
import { useStoredQuery } from "@/lib/storage/react";
import {
  addConversion,
  clearConversions,
  getLastConversion,
  listRecentConversions,
  saveLastConversion,
} from "@/lib/data/conversions";
import {
  convertValue,
  describeAmount,
  formatAmount,
  formatGrams,
  FALLBACK_INGREDIENT,
  getIngredient,
  INGREDIENTS,
  parseAmount,
  UNITS,
  UNIT_LABELS,
  UNIT_SHORT,
  type AmountFailure,
  type ParsedAmount,
  type Unit,
} from "@/lib/data/ingredients";

type FormValues = { value: string; fromUnit: Unit; toUnit: Unit; ingredientId: string };

/** What a first visit opens on, before anything has been converted. */
const DEFAULT_FORM: FormValues = {
  value: "1",
  fromUnit: "cups",
  toUnit: "grams",
  ingredientId: "all-purpose-flour",
};

const QUICK_CHIPS: readonly { label: string; values: FormValues }[] = [
  { label: "1 cup flour to grams", values: { value: "1", fromUnit: "cups", toUnit: "grams", ingredientId: "all-purpose-flour" } },
  { label: "250 g butter to cups", values: { value: "250", fromUnit: "grams", toUnit: "cups", ingredientId: "butter" } },
  { label: "2 cups sugar to grams", values: { value: "2", fromUnit: "cups", toUnit: "grams", ingredientId: "granulated-sugar" } },
  { label: "0.5 tsp salt to grams", values: { value: "0.5", fromUnit: "teaspoons", toUnit: "grams", ingredientId: "salt" } },
  { label: "500 ml milk to cups", values: { value: "500", fromUnit: "millilitres", toUnit: "cups", ingredientId: "milk" } },
  { label: "1 tbsp honey to tsp", values: { value: "1", fromUnit: "tablespoons", toUnit: "teaspoons", ingredientId: "honey" } },
];

const AMOUNT_MESSAGES: Record<AmountFailure, string> = {
  empty: "Enter a number to convert",
  invalid: "Enter a number, like 250 or 0.5",
  negative: "Negative amounts don\u2019t work here — enter a number from zero up",
};

const errorText = (error: unknown): string =>
  error instanceof Error && error.message ? error.message : "unknown error";

export function Converter() {
  const [draft, setDraft] = useState<FormValues | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const { data: last } = useStoredQuery(database, getLastConversion);
  const { data: history, isLoading: historyLoading } = useStoredQuery(database, listRecentConversions);

  // While the visitor has typed nothing, the form shows the remembered last conversion once the
  // database has opened (the server render, and the first client render, show the defaults).
  const values = draft ?? (last
    ? { value: String(last.value), fromUnit: last.fromUnit, toUnit: last.toUnit, ingredientId: last.ingredientId }
    : DEFAULT_FORM);

  const ingredient = getIngredient(values.ingredientId) ?? INGREDIENTS[0]!;
  const parsed = parseAmount(values.value);
  // Zero when the input is not a valid amount — the answer area shows the message instead.
  const answer = parsed.ok ? convertValue(parsed.value, values.fromUnit, values.toUnit, ingredient) : 0;

  const historyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (historyTimer.current) clearTimeout(historyTimer.current); }, []);

  /** Apply a change to the form, remember the conversion, and queue it into the history. */
  const applyChange = (partial: Partial<FormValues>) => {
    const next = { ...values, ...partial };
    setDraft(next);

    const nextParsed = parseAmount(next.value);
    const nextIngredient = getIngredient(next.ingredientId);
    if (!nextParsed.ok || !nextIngredient) return;
    const converted = convertValue(nextParsed.value, next.fromUnit, next.toUnit, nextIngredient);
    const entry = {
      value: nextParsed.value,
      fromUnit: next.fromUnit,
      toUnit: next.toUnit,
      ingredientId: nextIngredient.id,
    };
    // The last conversion is written straight away, so even a quick reload opens on it.
    saveLastConversion(entry).catch((error) => toast.error(`Could not save your last conversion: ${errorText(error)}`));
    // The history is written once the typing settles, so "250" lands as one entry, not three.
    if (historyTimer.current) clearTimeout(historyTimer.current);
    historyTimer.current = setTimeout(() => {
      addConversion({ ...entry, result: converted })
        .catch((error) => toast.error(`Could not save to the history: ${errorText(error)}`));
    }, 900);
  };

  const swap = () => applyChange({ fromUnit: values.toUnit, toUnit: values.fromUnit });

  const restore = (row: ConversionRow) =>
    applyChange({ value: String(row.value), fromUnit: row.fromUnit, toUnit: row.toUnit, ingredientId: row.ingredientId });

  const clearHistory = async () => {
    try {
      await clearConversions();
      setConfirmClear(false);
      toast.success("History cleared");
    } catch (error) {
      toast.error(`Could not clear the history: ${errorText(error)}`);
    }
  };

  const answerText = parsed.ok
    ? `${formatAmount(answer)} ${UNIT_SHORT[values.toUnit]}`
    : AMOUNT_MESSAGES[parsed.reason];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-6 p-6">
          {/* The answer comes first and large: it is the thing the eye lands on. */}
          <div aria-live="polite" aria-atomic="true">
            {parsed.ok ? (
              <>
                <p className="break-words text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">
                  {formatAmount(answer)}{" "}
                  <span className="text-2xl font-medium text-muted-foreground sm:text-3xl">{UNIT_SHORT[values.toUnit]}</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                  {describeAmount(parsed.value, values.fromUnit)} of {ingredient.name} = {answerText}
                </p>
              </>
            ) : (
              <p className={`text-2xl font-medium sm:text-3xl ${parsed.reason === "negative" ? "text-destructive" : "text-muted-foreground"}`}>
                {answerText}
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
              {ingredient.name}: 1 cup = {formatGrams(ingredient.perCup)} g, 1 tbsp = {formatGrams(ingredient.perTablespoon)} g, 1 tsp = {formatGrams(ingredient.perTeaspoon)} g, 1 ml = {ingredient.density.toFixed(3)} g
            </p>
          </div>

          {parsed.ok ? (
            <ShareButton
              label="Share conversion"
              cacheKey={`${values.value}|${values.fromUnit}|${values.toUnit}|${values.ingredientId}`}
              title={`${describeAmount(parsed.value, values.fromUnit)} of ${ingredient.name} = ${answerText}`}
              text={`Converted with ${identity.name}`}
              filename="kitchen-convert.png"
              makeImage={() =>
                renderShareCard({
                  title: answerText,
                  subtitle: `${describeAmount(parsed.value, values.fromUnit)} of ${ingredient.name}`,
                  lines: [
                    `${UNIT_LABELS[values.fromUnit]} to ${UNIT_LABELS[values.toUnit]}`,
                    `1 ${UNIT_SHORT[values.fromUnit]} = ${formatAmount(convertValue(1, values.fromUnit, values.toUnit, ingredient))} ${UNIT_SHORT[values.toUnit]}`,
                    `1 cup = 16 tbsp = 48 tsp = 236.6 ml`,
                  ],
                })
              }
            />
          ) : null}

          <form
            aria-label="Set up a conversion"
            className="grid gap-4"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                value={values.value}
                onChange={(event) => applyChange({ value: event.target.value })}
                inputMode="decimal"
                autoComplete="off"
                placeholder="e.g. 250"
                className="h-11 text-lg"
              />
              <p className="text-xs text-muted-foreground">Use a point for decimals, like 0.5</p>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2 sm:gap-3">
              <div className="grid gap-2">
                <Label htmlFor="from-unit">From</Label>
                <Select value={values.fromUnit} onValueChange={(unit) => applyChange({ fromUnit: unit as Unit })}>
                  <SelectTrigger id="from-unit" className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>{UNIT_LABELS[unit]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Swap the from and to units"
                title="Swap units"
                className="h-11 w-11"
                onClick={swap}
              >
                <ArrowLeftRight aria-hidden="true" />
              </Button>
              <div className="grid gap-2">
                <Label htmlFor="to-unit">To</Label>
                <Select value={values.toUnit} onValueChange={(unit) => applyChange({ toUnit: unit as Unit })}>
                  <SelectTrigger id="to-unit" className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>{UNIT_LABELS[unit]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ingredient">Ingredient</Label>
              <Select value={values.ingredientId} onValueChange={(id) => applyChange({ ingredientId: id })}>
                <SelectTrigger id="ingredient" className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INGREDIENTS.map((entry) => (
                    <SelectItem key={entry.id} value={entry.id}>{entry.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </form>

          <div>
            <p className="text-sm font-medium">Quick conversions</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {QUICK_CHIPS.map((chip) => (
                <Button
                  key={chip.label}
                  type="button"
                  variant="secondary"
                  className="h-9 rounded-full px-3.5 text-sm"
                  onClick={() => applyChange(chip.values)}
                >
                  {chip.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Recent conversions</h2>
            {history && history.length > 0 ? (
              <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={() => setConfirmClear(true)}>
                Clear history
              </Button>
            ) : null}
          </div>
          {historyLoading ? (
            <p className="text-sm text-muted-foreground">Loading your history…</p>
          ) : !history || history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No conversions yet</p>
          ) : (
            <ul className="mt-1 divide-y">
              {history.map((row) => {
                const rowIngredient = getIngredient(row.ingredientId);
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      title="Restore this conversion"
                      onClick={() => restore(row)}
                      className="flex w-full items-center justify-between gap-2 rounded-sm px-1 py-2.5 text-left text-sm hover:bg-accent"
                    >
                      <span>
                        {describeAmount(row.value, row.fromUnit)} {rowIngredient?.name ?? row.ingredientId} = {formatAmount(row.result)} {UNIT_SHORT[row.toUnit]}
                        <span className="sr-only"> — restore this conversion</span>
                      </span>
                      <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear the history?</DialogTitle>
            <DialogDescription>
              This removes the saved conversions and the remembered last conversion from this browser. It cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClear(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => void clearHistory()}>Clear history</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
