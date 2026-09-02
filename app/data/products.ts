import catalogImages from "./catalog-images.json" with { type: "json" };
import { verifiedProducts } from "./verified-products.ts";
import {
  type CatalogDirection,
  productMatchesCatalogDirection,
} from "../lib/catalog-filtering.ts";

export type CollectionSlug =
  | "wide-toe-box"
  | "knit-slip-on"
  | "breathable-lace-up"
  | "high-top-shoes"
  | "kids-shoes"
  | "extended-size-shoes"
  | "fleece-lined-shoes";

export type Product = {
  code: string;
  slug: string;
  sourceModel: string;
  name: string;
  shortDescription: string;
  group: string;
  closure: "Slip-On" | "Lace-Up";
  upper: string;
  sole: string;
  size: string;
  colors: string[];
  collections: CollectionSlug[];
  fitEvidence?: "wide_toe_verified" | "regular_fit" | "unconfirmed";
  tier: "A" | "B" | "C" | "D" | "E" | "New";
  buyerFit: string;
  highlights: string[];
  confirmBeforeQuote: string[];
  images: string[];
  alibabaProductId?: string;
};

function images(slug: string) {
  const files = (catalogImages as Record<string, string[]>)[slug];
  if (!files)
    throw new Error(
      `Missing generated image manifest entry for ${slug}. Run npm run catalog:sync.`,
    );
  return files.map((name) => `/catalog/${slug}/${name}.jpg`);
}

const commonConfirm = [
  "Order quantity and size ratio",
  "Current color availability",
  "Packing and target timing",
];
const unconfirmedSole =
  "Cushion-profile sole; material confirmed before quotation";

const originalProducts: Product[] = [
  {
    code: "BQ001",
    slug: "bq001",
    sourceModel: "BQ-001",
    name: "Wide Toe Box Knit Slip-On Walking Shoes",
    shortDescription:
      "Roomy-toe knit slip-on direction for comfort-footwear sourcing.",
    group: "Wide Toe Box Walking Shoes",
    closure: "Slip-On",
    upper: "Knitted textile upper",
    sole: "EVA",
    size: "EU 36-46",
    colors: ["Black White", "All Black", "White"],
    collections: ["wide-toe-box", "knit-slip-on"],
    fitEvidence: "wide_toe_verified",
    tier: "B",
    buyerFit: "Comfort-footwear importers and wholesalers",
    highlights: [
      "Verified wide toe box shape",
      "Easy slip-on construction",
      "Three neutral color directions",
    ],
    confirmBeforeQuote: commonConfirm,
    images: images("bq001"),
    alibabaProductId: "10000042821848",
  },
  {
    code: "BQ002",
    slug: "bq002",
    sourceModel: "BQ-002",
    name: "Extra Wide Toe Box Knit Slip-On Walking Shoes",
    shortDescription:
      "Extra-roomy grey knit range for wide-fit comfort assortments.",
    group: "Wide Toe Box Walking Shoes",
    closure: "Slip-On",
    upper: "Knitted textile upper",
    sole: "EVA",
    size: "EU 36-46",
    colors: ["Grey White", "Grey Black", "Grey Khaki"],
    collections: ["wide-toe-box", "knit-slip-on"],
    fitEvidence: "wide_toe_verified",
    tier: "B",
    buyerFit: "Wide-fit footwear and online-channel buyers",
    highlights: [
      "Verified wide toe box shape",
      "Grey-led color assortment",
      "Easy slip-on construction",
    ],
    confirmBeforeQuote: commonConfirm,
    images: images("bq002"),
    alibabaProductId: "10000042896165",
  },
  {
    code: "BQ003",
    slug: "bq003",
    sourceModel: "R1218",
    name: "Summer Stretch-Fabric Lace-Up Casual Shoes",
    shortDescription:
      "Light, open-knit lace-up style for summer casual assortments.",
    group: "Breathable Knit Casual Shoes",
    closure: "Lace-Up",
    upper: "Stretch fabric upper",
    sole: "EVA sole",
    size: "EU 35-45",
    colors: ["White", "Grey", "Pink", "Black White", "All Black"],
    collections: ["breathable-lace-up"],
    tier: "D",
    buyerFit: "Summer footwear wholesalers and online sellers",
    highlights: [
      "Confirmed stretch-fabric upper",
      "Mesh lining recorded in the product package",
      "Five color directions",
    ],
    confirmBeforeQuote: ["Exact material execution for the selected order", ...commonConfirm],
    images: images("bq003"),
    alibabaProductId: "1601815020244",
  },
  {
    code: "BQ004",
    slug: "bq004",
    sourceModel: "A502",
    name: "Lightweight Knit Slip-On Casual Shoes",
    shortDescription:
      "Flexible easy-on knit style for marketplace assortment testing.",
    group: "Breathable Knit Casual Shoes",
    closure: "Slip-On",
    upper: "Knitted stretch-fabric upper",
    sole: "EVA sole",
    size: "EU 35-45",
    colors: [
      "Grey Black",
      "Light Blue",
      "Orange Black",
      "Black White",
      "All Black",
    ],
    collections: ["knit-slip-on"],
    tier: "B",
    buyerFit: "Marketplace sellers and lightweight-casual buyers",
    highlights: [
      "Source image shows about 177g per shoe",
      "Mesh lining recorded in Alibaba trunk",
      "Five color directions",
    ],
    confirmBeforeQuote: ["Exact material execution for the selected order", ...commonConfirm],
    images: images("bq004"),
    alibabaProductId: "10000043201799",
  },
  {
    code: "BQ005",
    slug: "bq005",
    sourceModel: "A503",
    name: "Summer Hollow-Knit Lace-Up Walking Shoes",
    shortDescription:
      "Breathable lace-up direction for men and women casual ranges.",
    group: "Breathable Knit Casual Shoes",
    closure: "Lace-Up",
    upper: "Hollow-knit stretch-fabric upper",
    sole: "EVA sole",
    size: "EU 35-45",
    colors: ["Black", "Grey", "Pink", "White"],
    collections: ["breathable-lace-up"],
    tier: "C",
    buyerFit: "Summer casual importers and online sellers",
    highlights: [
      "Open-knit upper appearance",
      "Mesh lining recorded in Alibaba trunk",
      "Four color directions",
    ],
    confirmBeforeQuote: ["Exact material execution for the selected order", ...commonConfirm],
    images: images("bq005"),
    alibabaProductId: "10000043200726",
  },
  {
    code: "BQ006",
    slug: "bq006",
    sourceModel: "M8811",
    name: "Autumn Winter Chunky Knit Lace-Up Shoes",
    shortDescription:
      "Chunky lace-up style with regular and selected fleece-lined options.",
    group: "Winter Casual Walking Shoes",
    closure: "Lace-Up",
    upper: "Knitted textile upper",
    sole: unconfirmedSole,
    size: "EU 35-45",
    colors: [
      "Black White",
      "White Grey",
      "All Black",
      "All White",
      "White Green",
      "White Purple",
      "White Pink",
    ],
    collections: ["breathable-lace-up"],
    tier: "D",
    buyerFit: "Autumn and winter casual-footwear buyers",
    highlights: [
      "Chunky sole profile",
      "Seven color directions",
      "Selected fleece-lined options",
    ],
    confirmBeforeQuote: [
      "Fleece option by selected color",
      "Outsole and lining materials",
      ...commonConfirm,
    ],
    images: images("bq006"),
    alibabaProductId: "10000043734620",
  },
  {
    code: "BQ007",
    slug: "bq007",
    sourceModel: "L0017",
    name: "Breathable Textile Slip-On Walking Shoes",
    shortDescription:
      "Easy-on walking style with elastic-lace appearance and five colors.",
    group: "Slip-On Walking Shoes",
    closure: "Slip-On",
    upper: "Knitted textile upper",
    sole: "EVA + PEBA foamed sole structure",
    size: "EU 35-45",
    colors: ["White", "All Black", "Black White", "White Khaki", "Orange"],
    collections: ["knit-slip-on"],
    tier: "C",
    buyerFit: "Casual-walking importers and wholesalers",
    highlights: [
      "EVA + PEBA foamed structure recorded in the source package",
      "Elastic-lace appearance",
      "Five color directions",
    ],
    confirmBeforeQuote: ["Exact foam execution for the selected order", ...commonConfirm],
    images: images("bq007"),
    alibabaProductId: "1601825070472",
  },
  {
    code: "BQ008",
    slug: "bq008",
    sourceModel: "L1009",
    name: "Mesh Thick-Sole Athletic Walking Shoes",
    shortDescription:
      "Lace-up mesh athletic style supporting a broader sport-casual range.",
    group: "Athletic Walking Shoes",
    closure: "Lace-Up",
    upper: "Mesh textile upper",
    sole: unconfirmedSole,
    size: "EU 36-45",
    colors: ["Black White", "Grey Green", "White Black", "All Black"],
    collections: ["breathable-lace-up"],
    tier: "E",
    buyerFit: "Athletic-casual wholesalers and online sellers",
    highlights: [
      "Thick sole silhouette",
      "Four color directions",
      "Athletic lace-up profile",
    ],
    confirmBeforeQuote: ["Outsole and lining materials", ...commonConfirm],
    images: images("bq008"),
    alibabaProductId: "1601825021825",
  },
  {
    code: "BQ009",
    slug: "bq009",
    sourceModel: "L1026",
    name: "Breathable Knit Stretch-Fabric Lace-Up Walking Shoes",
    shortDescription:
      "Breathable knitted stretch-fabric direction with an EVA sole and four color options.",
    group: "Athletic Walking Shoes",
    closure: "Lace-Up",
    upper: "Knitted stretch-fabric upper",
    sole: "EVA sole",
    size: "EU 35-45",
    colors: ["Black White", "Orange", "Mint Green", "All Black"],
    collections: ["breathable-lace-up"],
    tier: "A",
    buyerFit: "Athletic-footwear importers and online channels",
    highlights: [
      "Mesh lining recorded in Alibaba trunk",
      "Black-and-white hero direction",
      "Four distinct color directions",
    ],
    confirmBeforeQuote: ["Exact material execution for the selected order", ...commonConfirm],
    images: images("bq009"),
    alibabaProductId: "1601825074604",
  },
  {
    code: "BQ010",
    slug: "bq010",
    sourceModel: "R1601",
    name: "Stretch Fabric Toe-Cap Lace-Up Walking Shoes",
    shortDescription:
      "Low-top stretch-fabric style with a distinct toe-cap construction.",
    group: "Lace-Up Casual Walking Shoes",
    closure: "Lace-Up",
    upper: "Stretch fabric upper",
    sole: "EVA sole",
    size: "EU 35-45",
    colors: ["White Sole Black", "All Black"],
    collections: ["breathable-lace-up"],
    tier: "C",
    buyerFit: "Casual and skate-style footwear buyers",
    highlights: [
      "Confirmed stretch-fabric upper",
      "Mesh lining recorded in the product package",
      "Toe-cap visual difference",
    ],
    confirmBeforeQuote: ["Exact material execution for the selected order", ...commonConfirm],
    images: images("bq010"),
    alibabaProductId: "1601825160204",
  },
  {
    code: "BQ011",
    slug: "bq011",
    sourceModel: "A002",
    name: "Men's Textile Slip-On Walking Shoes",
    shortDescription:
      "Straightforward men's easy-on walking style for daily assortments.",
    group: "Men Slip-On Walking Shoes",
    closure: "Slip-On",
    upper: "Textile upper",
    sole: unconfirmedSole,
    size: "EU 39-45",
    colors: ["Grey Black", "Grey White", "Light Grey"],
    collections: ["knit-slip-on"],
    tier: "C",
    buyerFit: "Men's casual-footwear importers",
    highlights: [
      "Men's size direction",
      "Three grey-led colors",
      "Daily easy-on profile",
    ],
    confirmBeforeQuote: ["Outsole and lining materials", ...commonConfirm],
    images: images("bq011"),
    alibabaProductId: "10000043725883",
  },
  {
    code: "BQ012",
    slug: "bq012",
    sourceModel: "M8506",
    name: "Breathable Knit Chunky Lace-Up Walking Shoes",
    shortDescription:
      "Chunky lace-up knit style for daily walking and travel ranges.",
    group: "Breathable Knit Sneakers",
    closure: "Lace-Up",
    upper: "Knitted stretch-fabric upper",
    sole: "EVA sole",
    size: "EU 39-44",
    colors: ["Black White", "Black Black", "Red White"],
    collections: ["breathable-lace-up"],
    tier: "B",
    buyerFit: "Walking-sneaker importers and marketplace sellers",
    highlights: [
      "Source image shows about 246g per shoe",
      "Mesh lining recorded in Alibaba trunk",
      "Three color directions",
    ],
    confirmBeforeQuote: ["Exact material execution for the selected order", ...commonConfirm],
    images: images("bq012"),
    alibabaProductId: "10000043744505",
  },
  {
    code: "BQ013",
    slug: "bq013",
    sourceModel: "T55836",
    name: "Soft Textile Slip-On Walking Shoes",
    shortDescription:
      "Minimal solid-color easy-on style for simple casual ranges.",
    group: "Soft Slip-On Walking Shoes",
    closure: "Slip-On",
    upper: "Soft textile upper",
    sole: unconfirmedSole,
    size: "To be confirmed",
    colors: ["Wine Red", "Black", "Grey"],
    collections: ["knit-slip-on"],
    tier: "D",
    buyerFit: "Value-focused wholesalers and casual buyers",
    highlights: [
      "Soft upper appearance",
      "Three solid colors",
      "Minimal easy-on profile",
    ],
    confirmBeforeQuote: [
      "Size range",
      "Outsole and lining materials",
      ...commonConfirm,
    ],
    images: images("bq013"),
    alibabaProductId: "10000043763325",
  },
  {
    code: "BQ014",
    slug: "bq014",
    sourceModel: "A507",
    name: "Autumn Winter Stretch Slip-On Walking Shoes",
    shortDescription:
      "Stretch-textile easy-on style with optional fleece-lined variants.",
    group: "Winter Slip-On Walking Shoes",
    closure: "Slip-On",
    upper: "Stretch textile upper",
    sole: unconfirmedSole,
    size: "EU 35-45",
    colors: ["White", "Black White", "Black"],
    collections: ["knit-slip-on"],
    tier: "New",
    buyerFit: "Autumn and winter footwear collections",
    highlights: [
      "Stretch textile upper",
      "Regular or fleece-lined direction",
      "Three neutral colors",
    ],
    confirmBeforeQuote: [
      "Fleece availability by color",
      "Outsole and lining materials",
      ...commonConfirm,
    ],
    images: images("bq014"),
  },
  {
    code: "BQ015",
    slug: "bq015",
    sourceModel: "R1811",
    name: "Autumn Winter Textile Lace-Up Walking Shoes",
    shortDescription:
      "Textile lace-up style with regular and optional fleece-lined variants.",
    group: "Winter Casual Walking Shoes",
    closure: "Lace-Up",
    upper: "Textile upper",
    sole: unconfirmedSole,
    size: "EU 35-45",
    colors: ["Grey White", "Black", "Black White"],
    collections: ["breathable-lace-up"],
    tier: "C",
    buyerFit: "Seasonal casual footwear buyers",
    highlights: [
      "Lace-up construction",
      "Regular or fleece-lined direction",
      "Three neutral colors",
    ],
    confirmBeforeQuote: [
      "Fleece availability by color",
      "Outsole and lining materials",
      ...commonConfirm,
    ],
    images: images("bq015"),
    alibabaProductId: "1601839073314",
  },
  {
    code: "BQ016",
    slug: "bq016",
    sourceModel: "201",
    name: "Kids Knit Slip-On Walking Shoes",
    shortDescription:
      "Kids easy-on knit style for school and daily casual assortments.",
    group: "Kids Slip-On Walking Shoes",
    closure: "Slip-On",
    upper: "Knitted textile upper",
    sole: unconfirmedSole,
    size: "EU 31-40",
    colors: ["Black", "Pink", "Zebra Stripe"],
    collections: ["knit-slip-on"],
    tier: "E",
    buyerFit: "Kids-footwear importers and wholesalers",
    highlights: [
      "Kids size direction",
      "Three visual variants",
      "Easy-on profile",
    ],
    confirmBeforeQuote: [
      "Kids compliance and age positioning",
      "Outsole and lining materials",
      ...commonConfirm,
    ],
    images: images("bq016"),
    alibabaProductId: "10000044021584",
  },
  {
    code: "BQ017",
    slug: "bq017",
    sourceModel: "A008",
    name: "Quilted Textile Lace-Up Walking Shoes",
    shortDescription:
      "Diamond-texture lace-up style for visual assortment differentiation.",
    group: "Quilted Casual Walking Shoes",
    closure: "Lace-Up",
    upper: "Quilted textile upper",
    sole: unconfirmedSole,
    size: "EU 35-45",
    colors: ["Grey", "White", "Black White", "All Black"],
    collections: ["breathable-lace-up"],
    tier: "D",
    buyerFit: "Visual assortment and casual-footwear buyers",
    highlights: [
      "Quilted diamond texture",
      "Four color directions",
      "Lace-up construction",
    ],
    confirmBeforeQuote: ["Outsole and lining materials", ...commonConfirm],
    images: images("bq017"),
    alibabaProductId: "10000044034049",
  },
  {
    code: "BQ018",
    slug: "bq018",
    sourceModel: "A116",
    name: "Lightweight Knit Lace-Up Walking Shoes",
    shortDescription:
      "Lavender-led knit lace-up style for color-driven assortment testing.",
    group: "Lightweight Knit Walking Shoes",
    closure: "Lace-Up",
    upper: "Knitted textile upper",
    sole: unconfirmedSole,
    size: "EU 35-45",
    colors: ["Lavender", "Cream", "Black", "Black White"],
    collections: ["breathable-lace-up"],
    tier: "E",
    buyerFit: "Online sellers testing color-led products",
    highlights: [
      "Lavender hero direction",
      "Four color options",
      "Light casual silhouette",
    ],
    confirmBeforeQuote: [
      "Closure/lace construction",
      "Outsole and lining materials",
      ...commonConfirm,
    ],
    images: images("bq018"),
    alibabaProductId: "10000044007878",
  },
  {
    code: "BQ019",
    slug: "bq019",
    sourceModel: "A206",
    name: "Honeycomb-Knit Lace-Up Casual Walking Shoes",
    shortDescription:
      "Honeycomb-texture upper and cloud-like sole silhouette for visual distinction.",
    group: "Breathable Knit Casual Shoes",
    closure: "Lace-Up",
    upper: "Breathable knitted upper",
    sole: unconfirmedSole,
    size: "EU 35-45",
    colors: ["Black", "Cream", "Light Grey", "White"],
    collections: ["breathable-lace-up"],
    tier: "D",
    buyerFit: "Casual-sneaker wholesalers and marketplaces",
    highlights: [
      "Honeycomb upper texture",
      "Cloud-like sole profile",
      "Four neutral colors",
    ],
    confirmBeforeQuote: ["Outsole and lining materials", ...commonConfirm],
    images: images("bq019"),
    alibabaProductId: "10000044041008",
  },
  {
    code: "BQ020",
    slug: "bq020",
    sourceModel: "A218",
    name: "Summer Hollow-Knit Lace-Up Walking Shoes",
    shortDescription:
      "Open-knit summer lace-up style with four neutral color directions.",
    group: "Summer Breathable Walking Shoes",
    closure: "Lace-Up",
    upper: "Hollow knitted textile upper",
    sole: unconfirmedSole,
    size: "EU 35-45",
    colors: ["Black White", "All Black", "Grey", "White"],
    collections: ["breathable-lace-up"],
    tier: "New",
    buyerFit: "Summer casual-footwear importers",
    highlights: ["Open-knit texture", "Four neutral colors", "Lace-up profile"],
    confirmBeforeQuote: ["Outsole and lining materials", ...commonConfirm],
    images: images("bq020"),
  },
  {
    code: "BQ021",
    slug: "bq021",
    sourceModel: "K6212",
    name: "All-Black Knit Slip-On Walking Shoes",
    shortDescription:
      "Black-led easy-on style with wave-sole visual differentiation.",
    group: "Winter Slip-On Walking Shoes",
    closure: "Slip-On",
    upper: "Stretch textile upper",
    sole: unconfirmedSole,
    size: "EU 35-45",
    colors: ["Black White", "All Black", "White", "Blue", "Grey"],
    collections: ["knit-slip-on"],
    tier: "C",
    buyerFit: "Men's and workday-casual footwear buyers",
    highlights: [
      "All-black hero direction",
      "Wave-sole appearance",
      "Five color directions",
    ],
    confirmBeforeQuote: [
      "Season/lining option",
      "Outsole material",
      ...commonConfirm,
    ],
    images: images("bq021"),
    alibabaProductId: "1601838963947",
  },
  {
    code: "BQ022",
    slug: "bq022",
    sourceModel: "A2208",
    name: "Striped Knit Slip-On Walking Shoes",
    shortDescription:
      "Ribbed stripe upper for a clearly differentiated easy-on assortment.",
    group: "Striped Knit Slip-On Shoes",
    closure: "Slip-On",
    upper: "Striped knitted upper",
    sole: unconfirmedSole,
    size: "EU 35-45",
    colors: ["Black", "Black White Stripe", "Light Grey"],
    collections: ["knit-slip-on"],
    tier: "C",
    buyerFit: "Visual assortment and casual-footwear buyers",
    highlights: [
      "Striped ribbed upper",
      "Three color directions",
      "Easy-on construction",
    ],
    confirmBeforeQuote: ["Outsole and lining materials", ...commonConfirm],
    images: images("bq022"),
    alibabaProductId: "10000043991998",
  },
  {
    code: "BQ023",
    slug: "bq023",
    sourceModel: "A505",
    name: "Soft Knit Slip-On Walking Shoes",
    shortDescription:
      "Soft knit easy-on style with a brown-collar visual option.",
    group: "Soft Slip-On Walking Shoes",
    closure: "Slip-On",
    upper: "Soft knitted upper",
    sole: unconfirmedSole,
    size: "EU 35-45",
    colors: ["Black", "Grey", "Brown"],
    collections: ["knit-slip-on"],
    tier: "D",
    buyerFit: "Casual footwear wholesalers",
    highlights: [
      "Brown collar detail",
      "Three neutral colors",
      "Easy-on profile",
    ],
    confirmBeforeQuote: ["Outsole and lining materials", ...commonConfirm],
    images: images("bq023"),
    alibabaProductId: "10000044041031",
  },
  {
    code: "BQ024",
    slug: "bq024",
    sourceModel: "A830",
    name: "Men's Heathered Knit Slip-On Walking Shoes",
    shortDescription:
      "Men's heathered-grey easy-on style for commercial casual assortments.",
    group: "Men Slip-On Walking Shoes",
    closure: "Slip-On",
    upper: "Knitted stretch-fabric upper",
    sole: "EVA sole",
    size: "EU 37-45",
    colors: ["Dark Grey", "Light Grey", "Yellow Sole", "All Black"],
    collections: ["knit-slip-on"],
    tier: "B",
    buyerFit: "Men's casual footwear importers",
    highlights: [
      "Men's easy-on assortment direction",
      "Mesh lining recorded in Alibaba trunk",
      "Four commercial color directions",
    ],
    confirmBeforeQuote: ["Exact material execution for the selected order", ...commonConfirm],
    images: images("bq024"),
    alibabaProductId: "10000044004948",
  },
  {
    code: "BQ025",
    slug: "bq025",
    sourceModel: "A1689",
    name: "Low-Cut Chevron Knit Slip-On Shoes",
    shortDescription:
      "Low-cut easy-on style with chevron texture and speckled-sole direction.",
    group: "Low Cut Slip-On Walking Shoes",
    closure: "Slip-On",
    upper: "Low-cut knitted upper",
    sole: unconfirmedSole,
    size: "EU 35-45",
    colors: ["Light Grey", "Black White", "All Black"],
    collections: ["knit-slip-on"],
    tier: "D",
    buyerFit: "Casual footwear and marketplace buyers",
    highlights: [
      "Chevron knit texture",
      "Speckled-sole direction",
      "Three neutral colors",
    ],
    confirmBeforeQuote: ["Outsole and lining materials", ...commonConfirm],
    images: images("bq025"),
    alibabaProductId: "10000044024484",
  },
  {
    code: "BQ026",
    slug: "bq026",
    sourceModel: "T5828",
    name: "Breathable Eyelet Knit Lace-Up Walking Shoes",
    shortDescription:
      "Light lace-up profile with a visible eyelet construction.",
    group: "Lightweight Knit Walking Shoes",
    closure: "Lace-Up",
    upper: "Breathable knitted upper",
    sole: unconfirmedSole,
    size: "EU 35-45",
    colors: ["Black", "White", "Grey", "Red", "Pink"],
    collections: ["breathable-lace-up"],
    tier: "D",
    buyerFit: "Broad color-assortment wholesalers",
    highlights: [
      "Visible eyelet construction",
      "Five color directions",
      "Low-cut lace-up profile",
    ],
    confirmBeforeQuote: [
      "Eyelet and upper material composition",
      "Outsole and lining materials",
      ...commonConfirm,
    ],
    images: images("bq026"),
    alibabaProductId: "10000044011929",
  },
  {
    code: "BQ027",
    slug: "bq027",
    sourceModel: "K6116",
    name: "Cream Knit Wave-Sole Lace-Up Walking Shoes",
    shortDescription:
      "Cream-led lace-up knit style with diagonal texture and wave-sole appearance.",
    group: "Knit Casual Walking Shoes",
    closure: "Lace-Up",
    upper: "Knitted textile upper",
    sole: unconfirmedSole,
    size: "EU 35-45",
    colors: ["Cream", "Black", "Black White", "Grey"],
    collections: ["breathable-lace-up"],
    tier: "D",
    buyerFit: "Neutral-tone casual footwear buyers",
    highlights: [
      "Cream hero direction",
      "Diagonal knit texture",
      "Wave-sole appearance",
    ],
    confirmBeforeQuote: ["Outsole and lining materials", ...commonConfirm],
    images: images("bq027"),
    alibabaProductId: "10000044028277",
  },
  {
    code: "BQ028",
    slug: "bq028",
    sourceModel: "BISCUIT",
    name: "Shell-Toe Knit Slip-On Walking Shoes",
    shortDescription:
      "Shell-toe easy-on style with a visible chevron outsole pattern.",
    group: "Winter Slip-On Walking Shoes",
    closure: "Slip-On",
    upper: "Knitted textile upper",
    sole: unconfirmedSole,
    size: "EU 35-45",
    colors: ["Black White", "Grey", "Apricot", "White", "Blue"],
    collections: ["knit-slip-on"],
    tier: "C",
    buyerFit: "Casual-footwear importers seeking shape differentiation",
    highlights: [
      "Shell-toe construction",
      "Chevron outsole pattern",
      "Five color directions",
    ],
    confirmBeforeQuote: [
      "Season/lining option",
      "Outsole material",
      ...commonConfirm,
    ],
    images: images("bq028"),
    alibabaProductId: "1601839105416",
  },
  {
    code: "BQ029",
    slug: "bq029",
    sourceModel: "A025",
    name: "High-Top Sock Knit Walking Shoes",
    shortDescription:
      "High-top sock silhouette for seasonal and fashion-casual assortments.",
    group: "High Top Sock Walking Shoes",
    closure: "Slip-On",
    upper: "High-top knit textile upper",
    sole: unconfirmedSole,
    size: "EU 35-45",
    colors: ["Black White", "All Black"],
    collections: ["knit-slip-on"],
    tier: "C",
    buyerFit: "Seasonal casual-footwear and online buyers",
    highlights: [
      "High-top sock silhouette",
      "Two black-led colors",
      "Easy-on construction",
    ],
    confirmBeforeQuote: [
      "Season and lining",
      "Outsole material",
      ...commonConfirm,
    ],
    images: images("bq029"),
    alibabaProductId: "1601839062659",
  },
  {
    code: "BQ030",
    slug: "bq030",
    sourceModel: "A811",
    name: "Kids Mesh Lace-Up Walking Shoes",
    shortDescription:
      "Kids lace-up mesh style with bright color directions for school and casual use.",
    group: "Kids Walking Shoes",
    closure: "Lace-Up",
    upper: "Breathable mesh upper",
    sole: unconfirmedSole,
    size: "EU 31-40",
    colors: ["Pink", "Purple", "Grey", "Green"],
    collections: ["breathable-lace-up"],
    tier: "E",
    buyerFit: "Kids-footwear importers and wholesalers",
    highlights: [
      "Kids size direction",
      "Four color directions",
      "Lace-up mesh profile",
    ],
    confirmBeforeQuote: [
      "Kids compliance and age positioning",
      "Outsole and lining materials",
      ...commonConfirm,
    ],
    images: images("bq030"),
    alibabaProductId: "1601839050756",
  },
  {
    code: "BQ031",
    slug: "bq031",
    sourceModel: "ZX2116",
    name: "Wide Toe Box Knit Lace-Up Walking Shoes",
    shortDescription:
      "Verified wide-toe knit lace-up direction with an extended EU 38-47 size range.",
    group: "Wide Toe Box and Large Size Walking Shoes",
    closure: "Lace-Up",
    upper: "Stretch knitted textile upper",
    sole: "EVA",
    size: "EU 38-47",
    colors: [
      "All Black",
      "Black White",
      "Grey White",
      "Off White",
      "Green White",
    ],
    collections: ["wide-toe-box", "breathable-lace-up"],
    fitEvidence: "wide_toe_verified",
    tier: "New",
    buyerFit:
      "Wide-fit and large-size footwear importers, wholesalers and brand buyers",
    highlights: [
      "Verified product-level wide toe box direction",
      "Extended EU 38-47 size range",
      "Five reviewed color directions",
    ],
    confirmBeforeQuote: [
      "Lining material and exact upper composition",
      "Physical sample fit and size ratio",
      ...commonConfirm,
    ],
    images: images("bq031"),
    alibabaProductId: "10000046439033",
  },
];

export const products: Product[] = [...originalProducts, ...verifiedProducts];

export type ProductCollection = {
  slug: CollectionSlug;
  direction: CatalogDirection;
  name: string;
  title: string;
  description: string;
  buyerIntent: string;
  selectionBasis: string;
  proofBoundary: string;
};

export const collections: ProductCollection[] = [
  {
    slug: "wide-toe-box",
    direction: "wide-toe-box",
    name: "Wide Toe Box",
    title: "Roomy-toe walking shoes",
    description:
      "Verified wide toe box styles for comfort-footwear importers, wholesalers and online sellers.",
    buyerIntent: "Buyers building a differentiated wide-fit comfort line.",
    selectionBasis: "Only styles with reviewed product-level wide-toe evidence are included.",
    proofBoundary: "This grouping is limited to the listed styles. It does not make every Beiqiang product wide-toe and does not imply a medical or orthopedic benefit.",
  },
  {
    slug: "knit-slip-on",
    direction: "knit-slip-on",
    name: "Easy-On Knit",
    title: "Knit slip-on walking shoes",
    description:
      "Easy-on textile and knit options for daily walking, travel and casual assortments.",
    buyerIntent:
      "Buyers prioritizing convenience, range breadth and sample testing.",
    selectionBasis: "Current products assigned to the easy-on knit and textile direction are shown together.",
    proofBoundary: "Closure and visible product direction come from reviewed product records. Exact materials, current colors, sizes and commercial terms remain style-specific confirmations.",
  },
  {
    slug: "breathable-lace-up",
    direction: "breathable-lace-up",
    name: "Breathable Lace-Up",
    title: "Breathable lace-up walking shoes",
    description:
      "Knit, mesh and textile lace-up styles with distinct silhouettes and color directions.",
    buyerIntent: "Buyers sourcing summer, athletic and casual lace-up ranges.",
    selectionBasis: "Current lace-up styles assigned to the knit, mesh or textile sourcing direction are included.",
    proofBoundary: "Breathable is a sourcing direction based on the relevant upper structure and product record; it is not a waterproof, medical or laboratory-performance claim.",
  },
  {
    slug: "high-top-shoes",
    direction: "high_top",
    name: "High-Top / Sock",
    title: "High-top and sock-style casual shoes for B2B sourcing",
    description: "Compare current higher-cut and sock-style silhouettes for seasonal, casual and differentiated footwear assortments.",
    buyerIntent: "Importers, wholesalers and online sellers reviewing higher-cut silhouettes before selecting samples.",
    selectionBasis: "Products are included when their reviewed name or group identifies a high-top or sock-style construction.",
    proofBoundary: "The grouping describes the recorded silhouette. Lining, warmth, exact upper materials, available colors, sizes and order terms require style-by-style confirmation.",
  },
  {
    slug: "kids-shoes",
    direction: "kids",
    name: "Kids Footwear",
    title: "Kids casual and walking shoe styles for wholesale review",
    description: "Review the current children’s footwear candidates in one place before discussing target age range, size ratio, colors and samples.",
    buyerIntent: "Children’s footwear importers, wholesalers and online sellers preparing a focused sourcing brief.",
    selectionBasis: "Only products whose reviewed product group identifies a kids direction are included.",
    proofBoundary: "A kids product grouping does not confirm age grading, compliance, current size availability or market suitability. Those requirements must be named and reviewed for the project.",
  },
  {
    slug: "extended-size-shoes",
    direction: "large_size",
    name: "Extended Size",
    title: "Walking shoe styles with documented extended EU size directions",
    description: "Compare current styles whose product records reach larger EU size directions, then confirm the exact size run and order ratio before quotation.",
    buyerIntent: "Buyers looking for walking and casual shoe candidates with a broader documented EU size direction.",
    selectionBasis: "The current product record must reach EU 46 or EU 47, or explicitly identify a large-size direction.",
    proofBoundary: "A documented size direction is not current stock or a confirmed production size run. Exact sizes, molds, fit, size ratio and availability remain project confirmations.",
  },
  {
    slug: "fleece-lined-shoes",
    direction: "fleece",
    name: "Fleece-Lined Options",
    title: "Walking shoe styles with documented fleece-lined color options",
    description: "Review styles whose current color records include a fleece-lined direction for cold-season assortment discussions.",
    buyerIntent: "Importers, wholesalers and online sellers reviewing cold-season options before sample and material confirmation.",
    selectionBasis: "At least one documented color option for the listed style includes a fleece-lined direction.",
    proofBoundary: "The fleece-lined direction may apply only to selected colors. Exact lining material, warmth, current availability, sizes and commercial terms must be confirmed before quotation.",
  },
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getCollection(slug: string) {
  return collections.find((collection) => collection.slug === slug);
}

export function productsInCollection(slug: CollectionSlug) {
  const collection = getCollection(slug);
  if (!collection) return [];
  return products.filter((product) =>
    productMatchesCatalogDirection(product, collection.direction),
  );
}
