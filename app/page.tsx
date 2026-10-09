import { Converter } from "@/components/converter";
import { DataCard } from "@/components/data-card";
import { ReferenceTable } from "@/components/reference-table";
import { INGREDIENTS } from "@/lib/data/ingredients";
import { identity } from "./identity";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-10 sm:px-6">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{identity.name}</h1>
        <p className="mt-2 text-balance text-muted-foreground">
          Cups, grams, millilitres, tablespoons and teaspoons for {INGREDIENTS.length} everyday
          ingredients. Type an amount and the answer is here before you finish — and the last
          conversion is remembered for next time.
        </p>
      </header>
      <div className="flex flex-col gap-6">
        <Converter />
        <ReferenceTable />
        <DataCard />
      </div>
      <footer className="mt-10 text-sm text-muted-foreground">
        Measures are level and US-style: 1 cup = 236.6 ml. Weights are typical chart values — for
        fussy baking, weigh.
      </footer>
    </main>
  );
}
