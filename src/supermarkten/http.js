const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

async function fetchMetTimeout(url, opts = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...opts,
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, ...(opts.headers || {}) },
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson(url, opts) {
  const res = await fetchMetTimeout(url, opts);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

export async function fetchHtml(url, opts) {
  const res = await fetchMetTimeout(url, opts);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

/** Haalt een JSON-blob op die veel sites (vaak Next.js) in een <script>-tag in de HTML meeleveren. */
export function haalIngebedJson(html, scriptId = "__NEXT_DATA__") {
  const regex = new RegExp(`<script id="${scriptId}"[^>]*>([\\s\\S]*?)</script>`, "i");
  const match = html.match(regex);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

/**
 * Doorzoekt een (willekeurig genest) JSON-object op dingen die op een product lijken:
 * een veld met de productnaam + een prijsveld. Nuttig als de exacte vorm van een
 * website-JSON-blob niet vooraf bekend is (en dus kan wijzigen zonder dat de code breekt).
 *
 * Een prijsveld is standaard VERPLICHT: zonder die eis matchen ook menu-items en
 * categorienamen (die toevallig ook een "title"-veld hebben, maar geen prijs).
 */
export function vindProductachtigeObjecten(data, { naamVelden, prijsVelden, max = 1000, vereistPrijs = true }) {
  const gevonden = [];
  const gezien = new Set();

  function bezoek(node) {
    if (gevonden.length >= max || node == null || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) bezoek(item);
      return;
    }
    const naamVeld = naamVelden.find((v) => typeof node[v] === "string" && node[v].trim());
    const prijsVeld = prijsVelden?.find((v) => node[v] != null && node[v] !== "");
    if (naamVeld && (!vereistPrijs || prijsVeld != null)) {
      const naam = node[naamVeld].trim();
      const key = naam.toLowerCase();
      if (naam.length > 1 && !gezien.has(key)) {
        gezien.add(key);
        gevonden.push({
          naam,
          prijs: prijsVeld != null ? String(node[prijsVeld]) : undefined,
          omschrijving:
            typeof node.subtitle === "string"
              ? node.subtitle
              : typeof node.shelfSubtitle === "string"
                ? node.shelfSubtitle
                : undefined,
        });
      }
    }
    for (const key of Object.keys(node)) bezoek(node[key]);
  }

  bezoek(data);
  return gevonden;
}

/**
 * Haalt alle schema.org "Product"-objecten uit <script type="application/ld+json">-blokken.
 * Dit is een gestandaardiseerd SEO-formaat dat veel winkels gebruiken en dat (anders dan een
 * framework-specifieke datablob) meestal stabieler blijft tussen site-updates.
 */
export function vindLdJsonProducten(html) {
  const blokken = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  const gevonden = [];
  const gezien = new Set();

  function verwerk(obj) {
    if (obj == null || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      for (const item of obj) verwerk(item);
      return;
    }
    const type = obj["@type"];
    const isProduct = type === "Product" || (Array.isArray(type) && type.includes("Product"));
    if (isProduct && typeof obj.name === "string") {
      const naam = obj.name.trim();
      const key = naam.toLowerCase();
      const offers = Array.isArray(obj.offers) ? obj.offers[0] : obj.offers;
      const prijs = offers?.price != null ? `${offers.price}${offers.priceCurrency ? " " + offers.priceCurrency : ""}` : undefined;
      if (naam && prijs && !gezien.has(key)) {
        gezien.add(key);
        gevonden.push({ naam, prijs, omschrijving: obj.description || undefined });
      }
    }
    if (Array.isArray(obj["@graph"])) verwerk(obj["@graph"]);
    for (const key of Object.keys(obj)) {
      if (key !== "@graph" && typeof obj[key] === "object") verwerk(obj[key]);
    }
  }

  for (const blok of blokken) {
    try {
      verwerk(JSON.parse(blok[1]));
    } catch {
      // ongeldige/afgebroken JSON in dit blok overslaan
    }
  }
  return gevonden;
}
