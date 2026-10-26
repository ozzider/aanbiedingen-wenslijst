import { maakHtmlFetcher } from "./generiek.js";

// Lidl heeft geen bekende publieke API voor aanbiedingen; dit scraped de aanbiedingenpagina.
export const haalAanbiedingen = maakHtmlFetcher({
  supermarkt: "Lidl",
  url: "https://www.lidl.nl/aanbiedingen",
  naamVelden: ["title", "name", "fullTitle"],
  prijsVelden: ["price", "priceFormatted"],
});
