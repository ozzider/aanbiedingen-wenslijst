import { maakHtmlFetcher } from "./generiek.js";

// Let op: plus.nl zit achter bot-bescherming (Imperva/Incapsula). Dit werkt mogelijk niet
// zonder een echte browser (zie README.md voor een alternatief met Playwright).
export const haalAanbiedingen = maakHtmlFetcher({
  supermarkt: "Plus",
  url: "https://www.plus.nl/aanbiedingen",
  naamVelden: ["title", "name"],
  prijsVelden: ["price", "priceFormatted"],
});
