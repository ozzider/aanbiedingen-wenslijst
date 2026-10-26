import "dotenv/config";
import { laadWenslijst, voegToe, verwijder } from "./wenslijst.js";
import { maakEnVerstuurFolder } from "./index.js";

const [commando, ...rest] = process.argv.slice(2);
const argument = rest.join(" ").trim();

async function main() {
  switch (commando) {
    case "add": {
      if (!argument) return console.error('Gebruik: npm run wenslijst -- add "product"');
      const { toegevoegd, items } = await voegToe(argument);
      console.log(toegevoegd ? `Toegevoegd: "${argument}"` : `Stond al op de lijst: "${argument}"`);
      console.log("Wenslijst:", items);
      break;
    }
    case "remove": {
      if (!argument) return console.error('Gebruik: npm run wenslijst -- remove "product"');
      const { verwijderd, items } = await verwijder(argument);
      console.log(verwijderd ? `Verwijderd: "${argument}"` : `Stond niet op de lijst: "${argument}"`);
      console.log("Wenslijst:", items);
      break;
    }
    case "list": {
      const items = await laadWenslijst();
      if (items.length === 0) console.log("Wenslijst is leeg.");
      else items.forEach((item) => console.log(`- ${item}`));
      break;
    }
    case "run": {
      await maakEnVerstuurFolder();
      break;
    }
    default: {
      console.log(`Gebruik:
  npm run wenslijst -- add "product"      voeg een product toe aan je wenslijst
  npm run wenslijst -- remove "product"   verwijder een product
  npm run wenslijst -- list               toon de wenslijst
  npm run run-now                         haal nu alle aanbiedingen op en verstuur de folder`);
    }
  }
}

main().catch((err) => {
  console.error("Er ging iets mis:", err);
  process.exit(1);
});
