import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BESTAND = path.join(__dirname, "..", "data", "wenslijst.json");

export async function laadWenslijst() {
  try {
    const tekst = await readFile(BESTAND, "utf8");
    return JSON.parse(tekst);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function slaOp(items) {
  await writeFile(BESTAND, JSON.stringify(items, null, 2) + "\n", "utf8");
}

export async function voegToe(naam) {
  const items = await laadWenslijst();
  if (items.some((item) => item.toLowerCase() === naam.toLowerCase())) {
    return { toegevoegd: false, items };
  }
  items.push(naam);
  await slaOp(items);
  return { toegevoegd: true, items };
}

export async function verwijder(naam) {
  const items = await laadWenslijst();
  const nieuw = items.filter((item) => item.toLowerCase() !== naam.toLowerCase());
  const verwijderd = nieuw.length !== items.length;
  if (verwijderd) await slaOp(nieuw);
  return { verwijderd, items: nieuw };
}
