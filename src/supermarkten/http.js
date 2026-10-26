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
 * een veld met de productnaam + optioneel een prijsveld. Nuttig als de exacte vorm van
 * een website-JSON-blob niet vooraf bekend is (en dus kan wijzigen zonder dat de code breekt).
 */
export function vindProductachtigeObjecten(data, { naamVelden, prijsVelden = [], max = 1000 }) {
  const gevonden = [];
  const gezien = new Set();

  function bezoek(node) {
    if (gevonden.length >= max || node == null || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) bezoek(item);
      return;
    }
    const naamVeld = naamVelden.find((v) => typeof node[v] === "string" && node[v].trim());
    if (naamVeld) {
      const naam = node[naamVeld].trim();
      const key = naam.toLowerCase();
      if (naam.length > 1 && !gezien.has(key)) {
        gezien.add(key);
        const prijsVeld = prijsVelden.find((v) => node[v] != null && node[v] !== "");
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
