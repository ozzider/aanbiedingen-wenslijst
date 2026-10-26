import { maakLdJsonFetcher } from "./generiek.js";

// Lidl heeft geen bekende publieke API, maar de aanbiedingenpagina bevat wel
// schema.org Product-data (application/ld+json) - dat gebruiken we hier.
export const haalAanbiedingen = maakLdJsonFetcher({
  supermarkt: "Lidl",
  url: "https://www.lidl.nl/aanbiedingen",
});
