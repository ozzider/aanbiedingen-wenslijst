import { unflatten } from "devalue";
import { fetchHtml, haalIngebedJson, maakDevalueCatchAllRevivers } from "./http.js";

// Jumbo levert geen los netwerkverzoek met productdata (bevestigd met DevTools: alle
// aanbiedingen staan al in de servergerenderde pagina). Nuxt (het framework van
// jumbo.com) seriliseert die data in "__NUXT_DATA__" met de devalue-library - diezelfde
// library gebruiken we hier om het weer in een normaal object terug te zetten.
//
// De aanbiedingen zelf zitten op data.data.nuTab.activeTab.runtimes[].sections[].promotions[]
// (gevonden via het diagnose-script). Elke promotie heeft daar een vaste vorm:
// title, tags[].text (de actie, bv. "2+3 gratis"), durationTexts.shortTitle (geldigheid).
const URL = "https://www.jumbo.com/aanbiedingen";

function actieTekst(promo) {
  const teksten = (promo.tags || []).map((t) => t.text).filter(Boolean);
  return teksten.length ? teksten.join(", ") : undefined;
}

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

    const runtimes = data?.data?.nuTab?.activeTab?.runtimes || [];
    const resultaat = [];
    const gezien = new Set();
    for (const runtime of runtimes) {
      for (const sectie of runtime.sections || []) {
        for (const promo of sectie.promotions || []) {
          const naam = promo.title?.trim();
          if (!naam) continue;
          const key = promo.id || naam.toLowerCase();
          if (gezien.has(key)) continue;
          gezien.add(key);
          resultaat.push({
            supermarkt: "Jumbo",
            naam,
            prijs: actieTekst(promo),
            omschrijving: promo.subtitle || undefined,
            geldigheid: promo.durationTexts?.shortTitle || undefined,
          });
        }
      }
    }

    if (resultaat.length === 0) {
      console.warn(
        "[Jumbo] data ontcijferd maar geen promoties gevonden op het verwachte pad " +
          "(data.data.nuTab.activeTab.runtimes[].sections[].promotions[]) - site-structuur is " +
          "waarschijnlijk gewijzigd. Zet DEBUG=1 om de ruwe data te zien."
      );
      if (process.env.DEBUG) console.warn(JSON.stringify(data).slice(0, 2000));
    }

    return resultaat;
  } catch (err) {
    console.warn("[Jumbo] kon aanbiedingen niet ophalen:", err.message);
    return [];
  }
}
