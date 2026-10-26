import { laadWenslijst } from "./wenslijst.js";
import { haalAlleAanbiedingen } from "./supermarkten/index.js";
import { vindMatches } from "./matcher.js";
import { verstuurFolder, renderFolderTekst } from "./mailer.js";

/** Haalt alle aanbiedingen op, matcht ze tegen de wenslijst en verstuurt de folder per e-mail. */
export async function maakEnVerstuurFolder() {
  const wenslijst = await laadWenslijst();
  if (wenslijst.length === 0) {
    console.log("Wenslijst is leeg, geen folder om te versturen.");
    return;
  }

  console.log(`Aanbiedingen ophalen voor ${wenslijst.length} wenslijst-item(s)...`);
  const aanbiedingen = await haalAlleAanbiedingen();
  console.log(`${aanbiedingen.length} aanbieding(en) gevonden in totaal.`);

  const matches = vindMatches(wenslijst, aanbiedingen);
  console.log(renderFolderTekst(matches));

  await verstuurFolder(matches);
  console.log(`Folder verstuurd naar ${process.env.MAIL_TO}.`);
}
