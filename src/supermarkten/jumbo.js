import { unflatten } from "devalue";
import { fetchHtml, haalIngebedJson, maakDevalueCatchAllRevivers, vindProductachtigeObjecten } from "./http.js";

// Jumbo levert geen los netwerkverzoek met productdata (bevestigd met DevTools: alle
// aanbiedingen staan al in de servergerenderde pagina). Nuxt (het framework van
// jumbo.com) seriliseert die data in "__NUXT_DATA__" met de devalue-library - diezelfde
// library gebruiken we hier om het weer in een normaal object terug te zetten.
const URL = "https://www.jumbo.com/aanbiedingen";

export async function haalAanbiedingen() {
  try {
    const html = await fetchHtml(URL);
    const ruw = haalIngebedJson(html, "__NUXT_DATA__");
    if (!ruw) {
      console.warn(`[Jumbo] geen "__NUXT_DATA__"-datablob gevonden op ${URL}.`);
      return [];
    }

    let data;
    try {
      data = unflatten(ruw, maakDevalueCatchAllRevivers());
    } catch (err) {
      console.warn(`[Jumbo] kon __NUXT_DATA__ niet ontcijferen: ${err.message}`);
      return [];
    }

    const gevonden = vindProductachtigeObjecten(data, {
      naamVelden: ["title", "name"],
      prijsVelden: ["price", "priceLabel", "currentPrice", "salePrice", "promoPrice"],
    });

    if (gevonden.length === 0) {
      console.warn(`[Jumbo] data ontcijferd maar geen producten (met prijs) herkend. Zet DEBUG=1 voor details.`);
      if (process.env.DEBUG) console.warn(JSON.stringify(data).slice(0, 2000));
    }

    return gevonden.map((item) => ({ ...item, supermarkt: "Jumbo" }));
  } catch (err) {
    console.warn("[Jumbo] kon aanbiedingen niet ophalen:", err.message);
    return [];
  }
}
