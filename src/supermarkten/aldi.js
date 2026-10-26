import { maakHtmlFetcher } from "./generiek.js";

// Geen bekende publieke API voor aldi.nl gevonden; best-effort scrape van de aanbiedingenpagina.
export const haalAanbiedingen = maakHtmlFetcher({
  supermarkt: "Aldi",
  url: "https://www.aldi.nl/aanbiedingen.html",
  naamVelden: ["title", "name"],
  prijsVelden: ["price", "priceFormatted"],
});
