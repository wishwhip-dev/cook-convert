# Plan

Goal: A quick unit converter for cooking: cups, grams, millilitres, tablespoons and teaspoons for common ingredients like flour, sugar and butter. Type a number, pick from and to units and the ingredient, see the answer instantly. Remember my last conversion across reloads.

1. The home page shows a converter: a labelled number input, a from-unit select, a to-unit select and an ingredient select, and the converted answer appears instantly as the number is typed — shown in large type as the first thing the eye lands on, with no submit button needed to see it.
2. A data module under lib/ holds at least 24 common cooking ingredients (all-purpose flour, bread flour, cake flour, granulated sugar, brown sugar, icing sugar, butter, margarine, vegetable oil, olive oil, milk, cream, water, honey, cocoa powder, rolled oats, rice, salt, baking powder, yeast, chocolate chips, yoghurt, maple syrup, peanut butter and more), each with its density in grams per millilitre plus its grams-per-cup, per-tablespoon and per-teaspoon weights; the ingredient select and reference table render from that module, not from inline constants.
3. Conversions work between any pair of the five units — cups, grams, millilitres, tablespoons, teaspoons — in both directions for the chosen ingredient, e.g. 2 cups of flour shows 240 g and 240 g of flour shows 2 cups, with sensible rounding (two decimals or fewer) and enough precision for small amounts that 0.5 teaspoons of salt shows about 3 g rather than 0 g.
4. A Swap button exchanges the from and to units and the answer recomputes; changing the ingredient or either unit also recomputes the answer immediately.
5. The last-used conversion — value, from unit, to unit and ingredient — is written to the Dexie database, and after reloading the page the form opens with those same values and the answer already shown.
6. The last 10 conversions are saved to the database and listed below the converter as a small history; before anything has been converted it shows a plain 'No conversions yet' message, and tapping an entry restores its value, units and ingredient into the form.
7. A reference table shows every ingredient's grams per cup, per tablespoon, per teaspoon and per millilitre, so the numbers behind the conversion are visible and checkable.
8. Non-numeric or empty input shows a plain message such as 'Enter a number to convert' instead of a wrong answer, a crash or a blank result; zero converts legitimately to zero; a negative number is rejected with a message; and a very large value like 999999 shows a result without breaking the layout or overflowing the page.
9. Four or more quick-start chips (e.g. '1 cup flour to grams', '250 g butter to cups') sit beside the form; tapping one fills the inputs and shows its answer.
10. The whole converter works from the keyboard: Tab reaches the number input, both selects and Swap, typing updates the answer, and the selects open and change with arrow keys and Enter.
11. A Share button next to the answer shares the conversion as an image or copies a link, with the outcome shown as text next to the button.
12. On a phone-sized screen the converter is a single column with the number input, selects and answer all visible and comfortably tappable without horizontal scrolling.
13. app/identity.ts gives the app a real name such as 'Kitchen Convert' with a description matching what it does, and the browser tab title shows that name.

These are the outcomes this task is judged against.