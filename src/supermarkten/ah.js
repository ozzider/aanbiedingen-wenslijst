import { fetchJson } from "./http.js";

// Onofficiële, niet-gedocumenteerde Albert Heijn-API (gebruikt door o.a. de AH-app).
// Kan zonder aankondiging wijzigen; dit is de bekendste, meest gebruikte reverse-engineered
// aanpak (anonieme member-token + de bonus/promotions-endpoint).
const AUTH_URL = "https://api.ah.nl/mobile-auth/v1/auth/token/anonymous";
const BONUS_URL = "https://api.ah.nl/mobile-services/bonuses/v1/android/promotions-shelves?size=100";

async function haalToken() {
  const data = await fetchJson(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId: "appie" }),
  });
  if (!data.access_token) throw new Error("geen access_token in AH-auth-respons");
  return data.access_token;
}

function* vindPromoties(node) {
  if (node == null || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) yield* vindPromoties(item);
    return;
  }
  const heeftTitel = typeof node.title === "string" && node.title.trim();
  const lijktOpPromotie = heeftTitel && (node.shelfDiscount || node.discountLabel || node.subtitle || node.shelfSubtitle);
  if (lijktOpPromotie) yield node;
  for (const key of Object.keys(node)) yield* vindPromoties(node[key]);
}

export async function haalAanbiedingen() {
  try {
    const token = await haalToken();
    const data = await fetchJson(BONUS_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const resultaat = [];
    const gezien = new Set();
    for (const promo of vindPromoties(data)) {
      const naam = promo.title.trim();
      const key = naam.toLowerCase();
      if (gezien.has(key)) continue;
      gezien.add(key);
      resultaat.push({
        supermarkt: "Albert Heijn",
        naam,
        prijs: promo.shelfDiscount || promo.discountLabel || undefined,
        omschrijving: promo.subtitle || promo.shelfSubtitle || undefined,
      });
    }

    if (resultaat.length === 0) {
      console.warn(
        "[AH] API gaf antwoord maar er werd geen enkele promotie gevonden - de JSON-vorm is waarschijnlijk gewijzigd. " +
          "Zet DEBUG=1 om de ruwe respons te zien."
      );
      if (process.env.DEBUG) console.warn(JSON.stringify(data).slice(0, 2000));
    }
    return resultaat;
  } catch (err) {
    console.warn("[AH] kon aanbiedingen niet ophalen:", err.message);
    return [];
  }
}
