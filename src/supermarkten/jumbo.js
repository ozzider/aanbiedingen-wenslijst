import { maakHtmlFetcher } from "./generiek.js";

// Jumbo heeft een mobiele API (mobileapi.jumbo.com) die in projecten op GitHub wordt gebruikt,
// maar die lijkt alleen vanaf Nederlandse IP-adressen te werken en achter Cloudflare te zitten.
// Als best-effort alternatief: de aanbiedingenpagina scrapen.
export const haalAanbiedingen = maakHtmlFetcher({
  supermarkt: "Jumbo",
  url: "https://www.jumbo.com/aanbiedingen",
  naamVelden: ["title", "name"],
  prijsVelden: ["priceLabel", "price", "displayPrice"],
});
