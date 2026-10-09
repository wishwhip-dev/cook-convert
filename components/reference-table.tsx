import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatGrams, INGREDIENTS } from "@/lib/data/ingredients";

/**
 * The numbers behind the conversions: every ingredient's weight per cup, per tablespoon, per
 * teaspoon and per millilitre. Static data, rendered on the server straight from
 * `lib/data/ingredients.ts`.
 */
export function ReferenceTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ingredient weights</CardTitle>
        <CardDescription>
          What one measure of each ingredient weighs. 1 cup = 16 tablespoons = 48 teaspoons = 236.6 ml.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-44">Ingredient</TableHead>
                <TableHead className="text-right">Per cup</TableHead>
                <TableHead className="text-right">Per tbsp</TableHead>
                <TableHead className="text-right">Per tsp</TableHead>
                <TableHead className="text-right">Per ml</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {INGREDIENTS.map((ingredient) => (
                <TableRow key={ingredient.id}>
                  <TableCell className="font-medium">{ingredient.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatGrams(ingredient.perCup)} g</TableCell>
                  <TableCell className="text-right tabular-nums">{formatGrams(ingredient.perTablespoon)} g</TableCell>
                  <TableCell className="text-right tabular-nums">{formatGrams(ingredient.perTeaspoon)} g</TableCell>
                  <TableCell className="text-right tabular-nums">{ingredient.density.toFixed(3)} g</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
