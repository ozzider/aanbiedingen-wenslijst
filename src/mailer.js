import nodemailer from "nodemailer";

// Herkenbare merkkleur per supermarkt voor het badge-label. Onbekende/toekomstige
// winkels vallen terug op een neutrale grijstint.
const WINKEL_KLEUREN = {
  "Albert Heijn": "#04adef",
  Jumbo: "#b9a206",
  Lidl: "#0050aa",
  Plus: "#e2001a",
  Aldi: "#00529c",
};

function winkelKleur(naam) {
  return WINKEL_KLEUREN[naam] || "#555555";
}

function escapeHtml(tekst) {
  return String(tekst)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderKaart(aanbieding, isLaatste) {
  const kleur = winkelKleur(aanbieding.supermarkt);
  const omschrijving = aanbieding.omschrijving
    ? `<div class="omschrijving">${escapeHtml(aanbieding.omschrijving)}</div>`
    : "";
  const prijs = aanbieding.prijs
    ? `<span class="prijs-badge">${escapeHtml(aanbieding.prijs)}</span>`
    : "";
  return `
  <tr>
    <td class="kaart${isLaatste ? " kaart-laatste" : ""}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <span class="winkel-badge" style="background:${kleur};">${escapeHtml(aanbieding.supermarkt)}</span>
            <div class="naam">${escapeHtml(aanbieding.naam)}</div>
            ${omschrijving}
          </td>
          <td class="prijs-cel">${prijs}</td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function renderSectie(wensItem, aanbiedingen) {
  const aantal = aanbiedingen.length;
  const telling = aantal === 1 ? "1 aanbieding" : `${aantal} aanbiedingen`;
  return `
  <tr>
    <td class="sectie-kop">
      <span class="sectie-titel">${escapeHtml(wensItem)}</span>
      <span class="sectie-telling">${telling}</span>
    </td>
  </tr>
  <tr>
    <td>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="kaarten">
        ${aanbiedingen.map((a, i) => renderKaart(a, i === aanbiedingen.length - 1)).join("\n")}
      </table>
    </td>
  </tr>`;
}

function renderLegeStaat() {
  return `
  <tr>
    <td class="leeg">
      <div class="leeg-emoji">🛒</div>
      <div class="leeg-titel">Niks van je wenslijst in de aanbieding</div>
      <div class="leeg-tekst">Volgende week checken we het weer automatisch voor je.</div>
    </td>
  </tr>`;
}

export function renderFolderHtml(matches) {
  const secties = [...matches.entries()].map(([item, aanbiedingen]) => renderSectie(item, aanbiedingen));
  const datum = new Date().toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const aantalTreffers = [...matches.values()].reduce((som, lijst) => som + lijst.length, 0);
  const preheader =
    aantalTreffers > 0
      ? `${aantalTreffers} aanbieding${aantalTreffers === 1 ? "" : "en"} van je wenslijst deze week`
      : "Deze week geen treffers - volgende week weer een nieuwe check";

  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, Helvetica, sans-serif; background: #eef1ee; color: #1c1c1c; margin: 0; padding: 0; }
  .buiten { width: 100%; padding: 24px 12px; }
  .folder { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .kop { background: linear-gradient(135deg, #1b6e45, #2f9e63); padding: 28px 28px 24px; color: #ffffff; }
  .kop-emoji { font-size: 28px; margin-bottom: 4px; }
  .kop h1 { font-size: 20px; margin: 0 0 4px; font-weight: 700; }
  .kop .datum { font-size: 13px; opacity: 0.85; text-transform: capitalize; }
  .inhoud { padding: 8px 28px 28px; }
  .sectie-kop { padding: 24px 0 10px; border-bottom: 2px solid #1b6e45; }
  .sectie-titel { font-size: 15px; font-weight: 700; color: #1c1c1c; text-transform: capitalize; }
  .sectie-telling { float: right; font-size: 12px; color: #888; font-weight: 400; }
  table.kaarten { margin-top: 4px; }
  .kaart { padding: 14px 0; border-bottom: 1px solid #f0f0ee; }
  .kaart-laatste { border-bottom: none; }
  .winkel-badge { display: inline-block; color: #ffffff; font-size: 10px; font-weight: 700; letter-spacing: 0.3px; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; margin-bottom: 6px; }
  .naam { font-size: 14px; font-weight: 600; color: #1c1c1c; line-height: 1.35; }
  .omschrijving { font-size: 12.5px; color: #777; margin-top: 2px; }
  .prijs-cel { text-align: right; vertical-align: top; white-space: nowrap; width: 90px; }
  .prijs-badge { display: inline-block; background: #fff2e8; color: #c24a00; font-size: 13px; font-weight: 700; padding: 5px 10px; border-radius: 8px; }
  .leeg { text-align: center; padding: 40px 16px; }
  .leeg-emoji { font-size: 36px; margin-bottom: 8px; }
  .leeg-titel { font-size: 15px; font-weight: 700; color: #1c1c1c; margin-bottom: 4px; }
  .leeg-tekst { font-size: 13px; color: #888; }
  .voettekst { text-align: center; padding: 20px 12px 0; font-size: 11.5px; color: #9a9a9a; }
  @media (max-width: 480px) {
    .kop, .inhoud { padding-left: 18px; padding-right: 18px; }
  }
</style>
</head>
<body>
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</span>
  <div class="buiten">
    <div class="folder">
      <div class="kop">
        <div class="kop-emoji">🛍️</div>
        <h1>Jouw persoonlijke aanbiedingenfolder</h1>
        <div class="datum">${datum}</div>
      </div>
      <div class="inhoud">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${secties.length ? secties.join("\n") : renderLegeStaat()}
        </table>
      </div>
    </div>
    <div class="voettekst">Automatisch gegenereerd op basis van jouw wenslijst</div>
  </div>
</body>
</html>`;
}

export function renderFolderTekst(matches) {
  if (matches.size === 0) return "Deze week staat niets van je wenslijst in de aanbieding.";
  const regels = [];
  for (const [item, aanbiedingen] of matches) {
    regels.push(`\n${item.toUpperCase()}`);
    for (const a of aanbiedingen) {
      const prijs = a.prijs ? ` - ${a.prijs}` : "";
      regels.push(`  - [${a.supermarkt}] ${a.naam}${prijs}`);
    }
  }
  return regels.join("\n");
}

export async function verstuurFolder(matches) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: process.env.MAIL_TO,
    subject: `Jouw aanbiedingenfolder - ${new Date().toLocaleDateString("nl-NL")}`,
    text: renderFolderTekst(matches),
    html: renderFolderHtml(matches),
  });
}
