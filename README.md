# Aanbiedingen-wenslijst

Houd een wenslijst bij van producten die je wilt. Elke week wordt automatisch gecheckt of
een van die producten in de aanbieding is bij Albert Heijn, Jumbo, Lidl, Plus of Aldi, en
krijg je een persoonlijke e-mail-"folder" met alleen de treffers.

## Starten

1. Installeer [Node.js](https://nodejs.org) (versie 20 of hoger).
2. Open een terminal in deze map en typ:
   ```bash
   npm install
   ```
3. Kopieer `.env.example` naar `.env` en vul je SMTP-gegevens in (bijvoorbeeld een Gmail
   app-wachtwoord, zie de comments in dat bestand).
4. Beheer je wenslijst:
   ```bash
   npm run wenslijst -- add "pindakaas"
   npm run wenslijst -- add "wasmiddel"
   npm run wenslijst -- list
   npm run wenslijst -- remove "wasmiddel"
   ```
5. Test direct een run (haalt nu de aanbiedingen op en verstuurt meteen een e-mail):
   ```bash
   npm run run-now
   ```
6. Laat 'm wekelijks automatisch draaien (moet continu blijven draaien, bv. op een thuisserver,
   Raspberry Pi of in de cloud):
   ```bash
   npm start
   ```
   Het moment waarop de wekelijkse e-mail verstuurd wordt, stel je in met `CRON_SCHEMA` in `.env`
   (standaard elke maandag 08:00).

## Hoe zit het in elkaar?

| Bestand | Wat doet het? |
|---|---|
| `src/wenslijst.js` | Wenslijst lezen/schrijven in `data/wenslijst.json`. |
| `src/cli.js` | Commandoregel: wenslijst beheren en een run starten. |
| `src/supermarkten/*.js` | Eén module per supermarkt die de actuele aanbiedingen opzoekt. |
| `src/matcher.js` | Vergelijkt wenslijst-items met aanbiedingen (ook als de naam niet exact gelijk is). |
| `src/mailer.js` | Zet de treffers om in een nette HTML-e-mail en verstuurt die. |
| `src/index.js` | De hele run: aanbiedingen ophalen -> matchen -> e-mail versturen. |
| `src/scheduler.js` | Draait `src/index.js` elke week op het moment uit `CRON_SCHEMA`. |

## Belangrijk: hoe betrouwbaar is het ophalen per supermarkt?

Supermarkten hebben geen officiële, publieke API voor aanbiedingen. Dit project gebruikt
reverse-engineered/best-effort methodes die kunnen stoppen met werken als een website
verandert. Op basis van onderzoek (oktober 2026):

- **Albert Heijn** — de betrouwbaarste optie. Gebruikt de (onofficiële) mobiele AH-API:
  een anonieme inlog-token ophalen en daarmee de bonus-aanbiedingen opvragen
  (`src/supermarkten/ah.js`). Geen account nodig.
- **Jumbo** — heeft een mobiele API, maar die lijkt alleen te werken vanaf Nederlandse
  IP-adressen en zit achter Cloudflare. Dit project scraped daarom best-effort de
  aanbiedingenpagina. Werkt dat niet, dan geeft het netjes een lege lijst terug (geen crash).
- **Lidl** — geen bekende publieke API; best-effort scrape van de aanbiedingenpagina.
- **Plus** — zit achter bot-detectie (Imperva/Incapsula). De simpele scrape-aanpak werkt
  hier mogelijk niet; daarvoor is waarschijnlijk een echte browser nodig (zie hieronder).
- **Aldi** — geen bekende publieke API; best-effort scrape, niet eerder bevestigd te werken.

**Elke supermarkt faalt onafhankelijk**: als één website niet meewerkt, krijg je gewoon de
treffers van de andere supermarkten, in plaats van dat de hele run stopt.

### Als een supermarkt niet (meer) werkt

1. Zet `DEBUG=1` in je `.env` en draai `npm run run-now` opnieuw: je krijgt dan meer informatie
   in de console over wat er mis ging (bv. geen `__NEXT_DATA__`-blob meer gevonden, of een
   andere HTTP-status).
2. Open de aanbiedingenpagina van die supermarkt in je browser, bekijk de paginabron
   (rechtermuisknop -> "Bekijk paginabron" of de Netwerk-tab van de devtools) en kijk of de
   URL in `src/supermarkten/<winkel>.js` nog klopt, en of de veldnamen (`naamVelden`,
   `prijsVelden`) nog overeenkomen met wat je in de JSON ziet.
3. Voor een site met zware bot-bescherming (zoals Plus) is de HTML-scrape-aanpak misschien
   niet genoeg. Een robuustere (maar zwaardere) oplossing is Playwright gebruiken om de
   pagina echt te laten renderen in een headless browser en daarna de HTML uit te lezen —
   vraag me gerust om dat toe te voegen als je dat wilt.

## Privacy & gebruik

Dit is voor persoonlijk, niet-commercieel gebruik. De aanpak maakt gebruik van
niet-gedocumenteerde endpoints/HTML-structuur van de supermarktwebsites; die kunnen zonder
aankondiging veranderen. Draai de wekelijkse check niet vaker dan nodig om de sites niet
onnodig te belasten.
