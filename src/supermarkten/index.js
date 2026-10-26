import { haalAanbiedingen as ah } from "./ah.js";
import { haalAanbiedingen as jumbo } from "./jumbo.js";
import { haalAanbiedingen as lidl } from "./lidl.js";
import { haalAanbiedingen as plus } from "./plus.js";
import { haalAanbiedingen as aldi } from "./aldi.js";

const FETCHERS = { ah, jumbo, lidl, plus, aldi };

/** Haalt de aanbiedingen van alle supermarkten op. Eén kapotte fetcher blokkeert de rest niet. */
export async function haalAlleAanbiedingen() {
  const namen = Object.keys(FETCHERS);
  const resultaten = await Promise.allSettled(namen.map((naam) => FETCHERS[naam]()));

  const alleAanbiedingen = [];
  resultaten.forEach((resultaat, i) => {
    if (resultaat.status === "fulfilled") {
      alleAanbiedingen.push(...resultaat.value);
    } else {
      console.warn(`[${namen[i]}] onverwachte fout:`, resultaat.reason?.message || resultaat.reason);
    }
  });
  return alleAanbiedingen;
}
