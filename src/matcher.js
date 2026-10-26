function normaliseer(tekst) {
  return tekst
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

const STOPWOORDEN = new Set(["de", "het", "een", "van", "en", "met", "in", "op"]);

function kernwoorden(woorden) {
  const kern = woorden.filter((w) => !STOPWOORDEN.has(w));
  return kern.length ? kern : woorden;
}

/**
 * Een wenslijst-item ("gestreepte tandpasta", "verse zalm") matcht een aanbieding
 * als alle kernwoorden van het wenslijst-item in de productnaam van de aanbieding voorkomen.
 */
// Twee woorden zijn "hetzelfde" als ze gelijk zijn, of als het ene woord het andere is
// plus een kort meervouds-/verbuigingsstaartje (bv. "cola" <-> "cola's", "appel" <-> "appels").
// Een losse substring-check zou "cola" ook in "chocolade" laten matchen, dus dat vermijden we.
function zelfdeWoord(a, b) {
  if (a === b) return true;
  const [kort, lang] = a.length <= b.length ? [a, b] : [b, a];
  return lang.startsWith(kort) && lang.length - kort.length <= 2;
}

function matcht(wensItem, aanbiedingsNaam) {
  const wensWoorden = kernwoorden(normaliseer(wensItem));
  const aanbiedingWoorden = normaliseer(aanbiedingsNaam);
  return wensWoorden.every((woord) => aanbiedingWoorden.some((aw) => zelfdeWoord(woord, aw)));
}

/**
 * @param {string[]} wenslijst
 * @param {{supermarkt: string, naam: string, prijs?: string, omschrijving?: string, url?: string}[]} aanbiedingen
 * @returns {Map<string, object[]>} wensItem -> lijst van matchende aanbiedingen
 */
export function vindMatches(wenslijst, aanbiedingen) {
  const resultaat = new Map();
  for (const wensItem of wenslijst) {
    const treffers = aanbiedingen.filter((a) => matcht(wensItem, a.naam));
    if (treffers.length) resultaat.set(wensItem, treffers);
  }
  return resultaat;
}
