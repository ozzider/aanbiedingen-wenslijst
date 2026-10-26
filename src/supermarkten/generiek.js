import { fetchHtml, haalIngebedJson, vindLdJsonProducten, vindProductachtigeObjecten } from "./http.js";

/**
 * Bouwt een best-effort fetcher voor een supermarkt waarvoor geen (bekende) echte API
 * bestaat: haalt de aanbiedingenpagina op en zoekt naar een ingebedde JSON-datablob
 * (zoals __NEXT_DATA__, gebruikelijk bij met Next.js gebouwde sites).
 *
 * Dit is inherent fragiel: als de website verandert (andere opbouw, anti-bot-bescherming,
 * region-lock op Nederlandse IP's) levert dit gewoon een lege lijst op. Zie README.md.
 */
export function maakHtmlFetcher({ supermarkt, url, scriptId = "__NEXT_DATA__", naamVelden, prijsVelden }) {
  return async function haalAanbiedingen() {
    try {
      const html = await fetchHtml(url);
      const data = haalIngebedJson(html, scriptId);
      if (!data) {
        console.warn(
          `[${supermarkt}] geen "${scriptId}"-datablob gevonden op ${url} - site-opbouw is waarschijnlijk anders. ` +
            "Zie README.md voor hoe je dit aanpast."
        );
        return [];
      }
      const gevonden = vindProductachtigeObjecten(data, { naamVelden, prijsVelden });
      if (gevonden.length === 0) {
        console.warn(`[${supermarkt}] datablob gevonden maar geen producten (met prijs) herkend. Zet DEBUG=1 voor details.`);
      }
      return gevonden.map((item) => ({ ...item, supermarkt }));
    } catch (err) {
      console.warn(`[${supermarkt}] kon aanbiedingen niet ophalen:`, err.message);
      return [];
    }
  };
}

/**
 * Bouwt een fetcher die de gestandaardiseerde schema.org "Product"-data uit
 * <script type="application/ld+json">-blokken op de pagina haalt. Stabieler dan een
 * framework-specifieke datablob (zoals __NEXT_DATA__), omdat het een SEO-standaard is.
 */
export function maakLdJsonFetcher({ supermarkt, url }) {
  return async function haalAanbiedingen() {
    try {
      const html = await fetchHtml(url);
      const gevonden = vindLdJsonProducten(html);
      if (gevonden.length === 0) {
        console.warn(`[${supermarkt}] geen schema.org Product-data (ld+json) gevonden op ${url}.`);
      }
      return gevonden.map((item) => ({ ...item, supermarkt }));
    } catch (err) {
      console.warn(`[${supermarkt}] kon aanbiedingen niet ophalen:`, err.message);
      return [];
    }
  };
}
