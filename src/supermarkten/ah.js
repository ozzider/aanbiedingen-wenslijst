import { fetchJson } from "./http.js";

// Albert Heijn's eigen website gebruikt een GraphQL-endpoint (gevonden via de
// Netwerk-tab van de browser op www.ah.nl/bonus, niet de verouderde mobiele API die
// hier eerder stond en 404 gaf). Geen inlog nodig voor deze query.
const GQL_URL = "https://www.ah.nl/gql";

const QUERY = `query bonusCategories($input: PromotionSearchInput, $periodStart: String, $periodEnd: String, $propertyCodes: [String!]) {
  bonusCategories(filterSet: WEB_CATEGORIES, input: $input) {
    id
    title
    type
    taxonomyId
    promotions {
      ...promotion
      __typename
    }
    __typename
  }
}

fragment productBase on Product {
  id
  title
  brand
  icons
  webPath
  isSample
  isSponsored
  isMedicine
  isMedicalDevice
  highlight
  shopType
  properties(codes: $propertyCodes) {
    code
    values
    __typename
  }
  salesUnitSize
  additionalInformation
  externalShop {
    url
    __typename
  }
  listPrice {
    amount
    currency
    __typename
  }
  __typename
}

fragment productImageRendition on ProductImageRendition {
  url
  __typename
}

fragment productAvailability on ProductAvailability {
  maxUnits
  availabilityLabel
  isOrderable
  isVisible
  __typename
}

fragment productPriceDiscount on ProductPriceDiscountV2 {
  description
  promotionType
  segmentType
  subtitle
  smartLabel
  theme
  wasPriceVisible
  productCount
  multipleItemPromotion
  __typename
}

fragment productPrice on ProductPriceV2 {
  now {
    amount
    __typename
  }
  was {
    amount
    __typename
  }
  discount {
    ...productPriceDiscount
    __typename
  }
  pantryPromotionLabels {
    topText
    centerText
    bottomText
    emphasis
    title
    variant
    size
    __typename
  }
  __typename
}

fragment productVariant on ProductVariant {
  label
  type
  product {
    ...productBase
    priceV2(displayComponent: PRODUCT_CARD) {
      ...productPrice
      __typename
    }
    imagePack {
      small {
        ...productImageRendition
        __typename
      }
      __typename
    }
    availability {
      ...productAvailability
      __typename
    }
    tradeItem {
      gtin
      gtinRevisions
      __typename
    }
    __typename
  }
  __typename
}

fragment productCard on Product {
  ...productBase
  highlights
  taxonomyPath {
    id
    __typename
  }
  imagePack {
    small {
      ...productImageRendition
      __typename
    }
    __typename
  }
  availability {
    ...productAvailability
    __typename
  }
  priceV2(
    periodStart: $periodStart
    periodEnd: $periodEnd
    forcePromotionVisibility: true
    displayComponent: PRODUCT_CARD
  ) {
    ...productPrice
    __typename
  }
  tradeItem {
    gtin
    gtinRevisions
    __typename
  }
  variant {
    ...productVariant
    __typename
  }
  variants {
    ...productVariant
    __typename
  }
  __typename
}

fragment promotion on Promotion {
  id
  title
  subtitle
  category
  exampleText
  storeOnly
  productCount
  salesUnitSize
  webPath
  exceptionRule
  promotionType
  segmentType
  periodDescription
  periodStart
  periodEnd
  extraDescriptions
  activationStatus
  product {
    ...productCard
    __typename
  }
  products {
    taxonomyPath {
      id
      __typename
    }
    __typename
  }
  promotionLabels {
    topText
    centerText
    bottomText
    emphasis
    title
    variant
    __typename
  }
  images {
    url
    title
    width
    height
    __typename
  }
  price {
    label
    now {
      amount
      __typename
    }
    was {
      amount
      __typename
    }
    __typename
  }
  __typename
}`;

function naarDatum(d) {
  return d.toISOString().slice(0, 10);
}

/** Geeft de maandag van de huidige bonusweek, en het ISO-weeknummer daarvan. */
function huidigeBonusperiode() {
  const nu = new Date();
  const dag = nu.getDay() || 7; // zondag = 0 -> 7
  const maandag = new Date(nu);
  maandag.setDate(nu.getDate() - (dag - 1));
  const zondag = new Date(maandag);
  zondag.setDate(maandag.getDate() + 6);

  // ISO-weeknummer van de maandag
  const iso = new Date(maandag);
  iso.setHours(0, 0, 0, 0);
  iso.setDate(iso.getDate() + 3 - ((iso.getDay() + 6) % 7));
  const jaarStart = new Date(iso.getFullYear(), 0, 1);
  const weekNummer = Math.ceil(((iso - jaarStart) / 86400000 + 1) / 7);

  return { periodStart: naarDatum(maandag), periodEnd: naarDatum(zondag), weekNummer };
}

function prijsTekst(price) {
  if (!price) return undefined;
  // price.now.amount staat al in hele euro's (dus NIET delen door 100 - dat gaf
  // bijvoorbeeld "€0,06" voor een fles wijn in plaats van de echte €5,99).
  if (price.now?.amount != null) {
    return `€${price.now.amount.toFixed(2).replace(".", ",")}`;
  }
  // price.label is alleen bruikbaar als er geen numerieke prijs is (anders staat er
  // soms iets generieks als "Adviesprijs" in plaats van een bedrag).
  if (price.label) return price.label;
  return undefined;
}

export async function haalAanbiedingen() {
  const { periodStart, periodEnd, weekNummer } = huidigeBonusperiode();

  try {
    const data = await fetchJson(GQL_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/graphql-response+json,application/json;q=0.9",
        origin: "https://www.ah.nl",
        referer: "https://www.ah.nl/bonus",
        "x-client-name": "ah-bonus",
        "x-client-platform-type": "Web",
      },
      body: JSON.stringify({
        operationName: "bonusCategories",
        variables: {
          periodStart,
          periodEnd,
          input: {
            periodStart,
            periodEnd,
            orderId: null,
            weekNumber: weekNummer,
            supplierBoosted: null,
            states: ["NONE", "ACTIVATED", "ASSIGNED"],
            spotlight: null,
            showAllPromotionSegments: null,
            segmentType: ["NEGATE_PREMIUM"],
            promotionType: null,
            id: null,
            hqId: null,
            hideVariants: true,
            forcePromotionVisibility: true,
            filterUnavailableProducts: null,
            productIds: null,
          },
        },
        query: QUERY,
      }),
    });

    const categorieen = data?.data?.bonusCategories || [];
    const resultaat = [];
    const gezien = new Set();
    for (const categorie of categorieen) {
      for (const promo of categorie.promotions || []) {
        const naam = promo.title?.trim();
        if (!naam) continue;
        const key = naam.toLowerCase();
        if (gezien.has(key)) continue;
        gezien.add(key);
        resultaat.push({
          supermarkt: "Albert Heijn",
          naam,
          prijs: prijsTekst(promo.price),
          omschrijving: promo.subtitle || promo.periodDescription || undefined,
        });
      }
    }

    if (resultaat.length === 0) {
      console.warn(
        "[AH] GraphQL-verzoek gaf antwoord maar geen enkele promotie gevonden. Zet DEBUG=1 om de ruwe respons te zien."
      );
      if (process.env.DEBUG) console.warn(JSON.stringify(data).slice(0, 2000));
    }
    return resultaat;
  } catch (err) {
    console.warn("[AH] kon aanbiedingen niet ophalen:", err.message);
    return [];
  }
}
