import nodemailer from "nodemailer";

function escapeHtml(tekst) {
  return String(tekst)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderKaart(aanbieding) {
  const prijs = aanbieding.prijs ? `<span class="prijs">${escapeHtml(aanbieding.prijs)}</span>` : "";
  const omschrijving = aanbieding.omschrijving
    ? `<div class="omschrijving">${escapeHtml(aanbieding.omschrijving)}</div>`
    : "";
  return `
    <tr>
      <td class="item">
        <div class="naam">${escapeHtml(aanbieding.naam)}</div>
        ${omschrijving}
      </td>
      <td class="winkel">${escapeHtml(aanbieding.supermarkt)}</td>
      <td class="prijs-cel">${prijs}</td>
    </tr>`;
}

function renderSectie(wensItem, aanbiedingen) {
  return `
    <h2>${escapeHtml(wensItem)}</h2>
    <table class="aanbiedingen">
      ${aanbiedingen.map(renderKaart).join("\n")}
    </table>`;
}

export function renderFolderHtml(matches) {
  const secties = [...matches.entries()].map(([item, aanbiedingen]) => renderSectie(item, aanbiedingen));
  const datum = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });

  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8" />
<style>
  body { font-family: Arial, Helvetica, sans-serif; background: #f4f4f1; color: #222; margin: 0; padding: 24px; }
  .folder { max-width: 640px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .datum { color: #777; font-size: 13px; margin-bottom: 24px; }
  h2 { font-size: 16px; margin: 24px 0 8px; border-bottom: 2px solid #e4572e; padding-bottom: 4px; }
  table.aanbiedingen { width: 100%; border-collapse: collapse; }
  table.aanbiedingen tr { border-bottom: 1px solid #eee; }
  table.aanbiedingen td { padding: 10px 4px; vertical-align: top; }
  .naam { font-weight: bold; }
  .omschrijving { color: #555; font-size: 13px; margin-top: 2px; }
  .winkel { color: #777; font-size: 13px; white-space: nowrap; }
  .prijs-cel { text-align: right; white-space: nowrap; }
  .prijs { color: #e4572e; font-weight: bold; }
  .leeg { color: #777; font-style: italic; }
</style>
</head>
<body>
  <div class="folder">
    <h1>Jouw persoonlijke aanbiedingenfolder</h1>
    <div class="datum">${datum}</div>
    ${secties.length ? secties.join("\n") : '<p class="leeg">Deze week staat niets van je wenslijst in de aanbieding.</p>'}
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
