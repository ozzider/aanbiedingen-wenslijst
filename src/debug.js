import "dotenv/config";
import { fetchHtml, fetchJson } from "./supermarkten/http.js";
import { haalAanbiedingen as ah } from "./supermarkten/ah.js";
import { haalAanbiedingen as jumbo } from "./supermarkten/jumbo.js";
import { haalAanbiedingen as lidl } from "./supermarkten/lidl.js";
import { haalAanbiedingen as plus } from "./supermarkten/plus.js";
import { haalAanbiedingen as aldi } from "./supermarkten/aldi.js";

// Diagnose-script: draait elke fetcher en laat zien wat er precies gevonden (of niet
// gevonden) wordt, zodat we zonder live site-toegang kunnen zien wat er aangepast moet
// worden. Dit script wijzigt niets, het logt alleen.

async function toonVoorbeeld(naam, fn) {
  console.log(`\n=== ${naam} ===`);
  try {
    const items = await fn();
    console.log(`${items.length} item(s) gevonden.`);
    items.slice(0, 12).forEach((item, i) => {
      console.log(`  ${i + 1}. "${item.naam}"${item.prijs ? ` - ${item.prijs}` : ""}`);
    });
  } catch (err) {
    console.log("Onverwachte fout:", err.message);
  }
}

async function onderzoekHtmlStructuur(naam, url) {
  console.log(`\n--- ruwe pagina-structuur: ${naam} (${url}) ---`);
  try {
    const html = await fetchHtml(url);
    console.log("HTML-lengte:", html.length);
    const scriptIds = [...html.matchAll(/<script[^>]*\bid="([^"]+)"/g)].map((m) => m[1]);
    console.log("Gevonden <script id=\"...\">:", [...new Set(scriptIds)].slice(0, 25));
    for (const patroon of ["__NEXT_DATA__", "__NUXT__", "window.__INITIAL_STATE__", "application/ld+json"]) {
      console.log(`  bevat "${patroon}":`, html.includes(patroon));
    }
  } catch (err) {
    console.log("Kon pagina niet ophalen:", err.message);
  }
}

async function onderzoekAh() {
  console.log("\n--- AH: welk endpoint werkt wel? ---");
  try {
    const token = await fetchJson("https://api.ah.nl/mobile-auth/v1/auth/token/anonymous", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: "appie" }),
    });
    console.log("Anonieme login gelukt:", Boolean(token.access_token));
    const kandidaten = [
      "https://api.ah.nl/mobile-services/bonuses/v1/android/promotions-shelves?size=100",
      "https://api.ah.nl/mobile-services/product-shelves/v1/bonus-shelves",
      "https://api.ah.nl/mobile-services/v1/bonuses",
      "https://api.ah.nl/mobile-services/product/search/v2?query=cola&size=5",
    ];
    for (const url of kandidaten) {
      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token.access_token}` },
        });
        console.log(` ${res.status}  ${url}`);
      } catch (err) {
        console.log(` fout   ${url} -> ${err.message}`);
      }
    }
  } catch (err) {
    console.log("Anonieme login mislukt:", err.message);
  }
}

async function dumpScriptSnippet(naam, url, scriptId, lengte = 600) {
  console.log(`\n--- ruwe inhoud van "${scriptId}" bij ${naam} (eerste ${lengte} tekens) ---`);
  try {
    const html = await fetchHtml(url);
    const regex = new RegExp(`<script\\b[^>]*\\bid="${scriptId}"[^>]*>([\\s\\S]*?)</script>`, "i");
    const match = html.match(regex);
    if (!match) {
      console.log("Niet gevonden.");
      return;
    }
    console.log(match[1].slice(0, lengte));
  } catch (err) {
    console.log("Kon pagina niet ophalen:", err.message);
  }
}

async function zoekPrijsveldNamen(naam, url, scriptId) {
  console.log(`\n--- mogelijke prijsvelden in "${scriptId}" bij ${naam} ---`);
  try {
    const html = await fetchHtml(url);
    const regex = new RegExp(`<script\\b[^>]*\\bid="${scriptId}"[^>]*>([\\s\\S]*?)</script>`, "i");
    const match = html.match(regex);
    if (!match) {
      console.log("Datablob niet gevonden.");
      return;
    }
    const tekst = match[1];
    const gevondenVelden = new Set();
    for (const m of tekst.matchAll(/"(\w*[Pp]rice\w*|\w*[Pp]rijs\w*|\w*[Dd]iscount\w*)"\s*:/g)) {
      gevondenVelden.add(m[1]);
    }
    console.log("Veldnamen met 'price'/'prijs'/'discount' erin:", [...gevondenVelden].slice(0, 30));
    const voorbeeld = tekst.match(/\{[^{}]{0,300}"(\w*[Pp]rice\w*)"[^{}]{0,100}\}/);
    if (voorbeeld) console.log("Voorbeeld-object:", voorbeeld[0]);
  } catch (err) {
    console.log("Kon pagina niet ophalen:", err.message);
  }
}

async function onderzoekLdJsonTypes(naam, url) {
  console.log(`\n--- welke @type's zitten er in de ld+json van ${naam}? ---`);
  try {
    const html = await fetchHtml(url);
    const blokken = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
    console.log(`${blokken.length} ld+json-blok(ken) gevonden.`);
    blokken.forEach((blok, i) => {
      try {
        const data = JSON.parse(blok[1]);
        const types = Array.isArray(data) ? data.map((d) => d["@type"]) : [data["@type"]];
        console.log(`  blok ${i + 1}: @type = ${JSON.stringify(types)}`);
      } catch {
        console.log(`  blok ${i + 1}: kon niet geparsed worden`);
      }
    });
  } catch (err) {
    console.log("Kon pagina niet ophalen:", err.message);
  }
}

async function main() {
  await toonVoorbeeld("Albert Heijn", ah);
  await toonVoorbeeld("Jumbo", jumbo);
  await toonVoorbeeld("Lidl", lidl);
  await toonVoorbeeld("Plus", plus);
  await toonVoorbeeld("Aldi", aldi);

  await onderzoekAh();
  await onderzoekHtmlStructuur("AH (bonus-pagina)", "https://www.ah.nl/bonus");
  await onderzoekHtmlStructuur("Jumbo", "https://www.jumbo.com/aanbiedingen");
  await onderzoekHtmlStructuur("Lidl", "https://www.lidl.nl/aanbiedingen");
  await onderzoekHtmlStructuur("Plus", "https://www.plus.nl/aanbiedingen");
  await onderzoekHtmlStructuur("Aldi", "https://www.aldi.nl/aanbiedingen.html");

  await dumpScriptSnippet("Jumbo", "https://www.jumbo.com/aanbiedingen", "__NUXT_DATA__");
  await onderzoekLdJsonTypes("Lidl", "https://www.lidl.nl/aanbiedingen");
  await zoekPrijsveldNamen("Aldi", "https://www.aldi.nl/aanbiedingen.html", "__NEXT_DATA__");
}

main();
