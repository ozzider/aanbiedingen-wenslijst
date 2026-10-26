import "dotenv/config";
import { verstuurFolder } from "./mailer.js";

// Stuurt de folder-e-mail met voorbeelddata, los van de echte supermarkt-fetchers.
// Handig om de opmaak te checken in je eigen inbox zonder op werkende fetchers te wachten.

const matches = new Map([
  [
    "pindakaas",
    [
      {
        supermarkt: "Albert Heijn",
        naam: "Calve pindakaas naturel 650g",
        prijs: "2 voor €5,98",
        omschrijving: "div. varianten",
      },
      { supermarkt: "Jumbo", naam: "Jumbo pindakaas 350g", prijs: "€1,49" },
    ],
  ],
  ["cola", [{ supermarkt: "Lidl", naam: "Coca-Cola flesjes 6x1,5L", prijs: "€6,99" }]],
]);

await verstuurFolder(matches);
console.log(`Testmail met voorbeelddata verstuurd naar ${process.env.MAIL_TO}.`);
