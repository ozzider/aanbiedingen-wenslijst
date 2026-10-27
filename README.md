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
6. Voor volledig automatisch wekelijks versturen: zie **"Automatisch laten draaien"** hieronder.
   (`npm start` draait ook lokaal continu op het moment uit `CRON_SCHEMA` in `.env`, maar dat
   vereist dat je computer continu aan blijft staan.)

## Automatisch laten draaien (GitHub Actions)

Dit project bevat een GitHub Actions-workflow (`.github/workflows/wekelijkse-folder.yml`) die
wekelijks vanzelf `npm run run-now` draait, zonder dat je computer hoeft aan te staan.

1. Ga naar je repo op GitHub -> **Settings** -> **Secrets and variables** -> **Actions** ->
   **New repository secret**, en voeg deze secrets toe (de waarden staan in je `.env`):
   `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `MAIL_TO`.
2. Push je wijzigingen (de workflow werkt pas als dat bestand op GitHub staat).
3. Test het: ga naar de **Actions**-tab op GitHub -> "Wekelijkse aanbiedingenfolder" ->
   **Run workflow** om 'm direct een keer handmatig te starten, in plaats van te wachten op
   maandag.
4. De standaardtijd is elke maandag 07:00 UTC (ca. 08:00/09:00 Nederlandse tijd, afhankelijk
   van zomer-/wintertijd). Wil je een ander moment? Pas de `cron`-regel in dat workflow-bestand
   aan (GitHub-cron-tijden zijn altijd in UTC, niet in Nederlandse tijd).

**Belangrijk:** `data/wenslijst.json` staat (bewust, omdat deze repo privé is) gewoon in git,
want GitHub Actions start elke keer met een verse download van de repo en heeft dus geen
toegang tot bestanden die alleen lokaal op je computer staan. Dit betekent: na elke
`npm run wenslijst -- add/remove` moet je ook `git add data/wenslijst.json`, committen en
pushen, anders gebruikt de automatische wekelijkse run nog je oude lijst.

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
reverse-engineered methodes (gevonden via de Netwerk-tab van de browser) die kunnen stoppen
met werken als een website verandert. Status (oktober 2026):

- **Albert Heijn** — werkt. Gebruikt AH's eigen GraphQL-endpoint (`www.ah.nl/gql`,
  `bonusCategories`-query), hetzelfde endpoint dat de website zelf gebruikt. Geen account nodig.
- **Jumbo** — werkt. Jumbo levert geen los netwerkverzoek met productdata; alles zit al
  servergerenderd in de pagina, geserialiseerd met de `devalue`-library (Nuxt's eigen
  dataformaat). `src/supermarkten/jumbo.js` ontcijfert dat en leest
  `data.nuTab.activeTab.runtimes[].sections[].promotions[]` uit.
- **Lidl** — nog niet werkend; moet nog uitgezocht worden (devtools-speurwerk zoals bij AH/Jumbo).
- **Plus** — zit achter bot-detectie (Imperva/Incapsula): de pagina geeft maar ~15KB HTML terug
  in plaats van de echte inhoud. Waarschijnlijk is hiervoor een echte browser nodig (Playwright),
  zie hieronder.
- **Aldi** — nog niet werkend; eerdere poging vond alleen categorienamen, geen producten met prijs.

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
