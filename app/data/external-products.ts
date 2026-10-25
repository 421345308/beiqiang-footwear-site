import catalogImages from "./catalog-images.json" with { type: "json" };
import type { Product } from "./products.ts";

const confirmations = ["Color and size quantities", "Material specifications and sample fit", "Branding, packing and delivery requirements"];
const gallery = (slug: string) => (catalogImages as Record<string, string[]>)[slug].map(name => `/catalog/${slug}/${name}.jpg`);
// Website projection of the product-centre records, reviewed 2026-10-25.
// Material chemistry and performance are not inferred from photographs.
export const externalProducts: Product[] = [
{
  "code": "BQ-C2627",
  "sizeNote": "Each paired label is one size option; confirm sample insole length before market-size conversion.",
  "sourceModel": "2627BSK",
  "name": "Platform Clogs with Pivot Heel Strap",
  "shortDescription": "Closed-toe clogs with ventilation openings, a raised sole profile and a pivoting heel strap. Five photographed color options.",
  "group": "Clogs and Vented Casual Shoes",
  "closure": "Slip-On",
  "upper": "EVA upper",
  "sole": "Material to be confirmed",
  "size": "35–36 / 37–38 / 39–40",
  "colors": [
    "Blue",
    "Khaki",
    "Beige",
    "Light Pink",
    "Black"
  ],
  "collections": [
    "clogs-and-vented-shoes"
  ],
  "fitEvidence": "unconfirmed",
  "tier": "New",
  "buyerFit": "Casual footwear retailers and seasonal assortment buyers",
  "highlights": [
    "Pivoting heel strap",
    "Vented upper and raised sole profile",
    "Three paired size labels"
  ],
  "confirmBeforeQuote": [
    "Paired size labels and sample insole length",
    "Separate outsole and lining specifications",
    "Color and size quantities",
    "Branding, packing and delivery requirements"
  ],
  "alibabaProductId": "1601969885846",
  "slug": "bq-c2627",
  "images": gallery("bq-c2627")
},
{
  "code": "BQ-CA67",
  "sizeNote": "Each paired label is one size option; confirm sample insole length before market-size conversion.",
  "sourceModel": "A67",
  "name": "Closed-Heel Vented Slip-On Shoes",
  "shortDescription": "EVA-upper casual shoes with a covered heel, side openings and moulded lace-look detailing. The lace-look detail is not adjustable lacing.",
  "group": "Clogs and Vented Casual Shoes",
  "closure": "Slip-On",
  "upper": "EVA upper",
  "sole": "Material to be confirmed",
  "size": "36–37 / 38–39 / 40–41 / 42–43 / 44–45",
  "colors": [
    "Black",
    "Grey",
    "Khaki"
  ],
  "collections": [
    "clogs-and-vented-shoes"
  ],
  "fitEvidence": "unconfirmed",
  "tier": "New",
  "buyerFit": "Casual footwear retailers and seasonal assortment buyers",
  "highlights": [
    "Covered heel and side openings",
    "Moulded lace-look detail; slip-on construction",
    "Five paired size labels"
  ],
  "confirmBeforeQuote": [
    "Paired size labels and sample insole length",
    "Separate outsole and lining specifications",
    "Color and size quantities",
    "Branding, packing and delivery requirements"
  ],
  "alibabaProductId": "1601969861694",
  "slug": "bq-ca67",
  "images": gallery("bq-ca67")
},
{
  "code": "BQ-M858",
  "sizeNote": "Supplier size labels; confirm sample insole length before market-size conversion.",
  "sourceModel": "K858",
  "name": "Buckle Mules with Suede-Effect Upper",
  "shortDescription": "Closed-toe, open-heel mules with a buckle strap and a suede-effect upper. Available in photographed black, sand and brown options.",
  "group": "Buckle Mule Shoes",
  "closure": "Slip-On",
  "upper": "Suede-effect upper; composition to be confirmed",
  "sole": "Material to be confirmed",
  "size": "35–45",
  "colors": [
    "Black",
    "Sand",
    "Brown"
  ],
  "collections": [
    "mule-shoes"
  ],
  "fitEvidence": "unconfirmed",
  "tier": "New",
  "buyerFit": "Casual footwear retailers and mule assortment buyers",
  "highlights": [
    "Closed toe and open heel",
    "Buckle strap with visible adjustment holes",
    "Supplier size labels 35–45"
  ],
  "confirmBeforeQuote": [
    "Supplier size labels and sample insole length",
    "Upper composition, footbed and outsole materials",
    "Color and size quantities",
    "Branding, packing and delivery requirements"
  ],
  "alibabaProductId": "1601969853888",
  "slug": "bq-m858",
  "images": gallery("bq-m858")
},
  {
    code: "BQ-LQ059", slug: "bq-lq059", sourceModel: "059",
    name: "Panelled Lace-Up Casual Shoes",
    shortDescription: "Low-top casual shoes with loop eyelets, broad upper panels and a contrasting heel panel.",
    group: "Lace-Up Casual Shoes", closure: "Lace-Up", upper: "Panelled upper; composition to be confirmed", sole: "Material to be confirmed",
    size: "EU 36-48", colors: ["Black", "Brown", "Dark Grey"], collections: ["extended-size-shoes"],
    fitEvidence: "unconfirmed", tier: "New", buyerFit: "Casual footwear retailers and wholesalers",
    highlights: ["Loop-style lace eyelets", "Low collar and contrasting heel panel", "EU 36–48 size range"], confirmBeforeQuote: confirmations,
    images: gallery("bq-lq059"), alibabaProductId: "1601972951733",
  },
  {
    code: "BQ-LQ060", slug: "bq-lq060", sourceModel: "060",
    name: "Mesh-Panel Lace-Up Casual Shoes",
    shortDescription: "Layered low-top shoes with mesh side panels, fabric lace loops and a contrasting toe overlay.",
    group: "Lace-Up Casual Shoes", closure: "Lace-Up", upper: "Mesh panels and overlays; composition to be confirmed", sole: "Material to be confirmed",
    size: "EU 36-48", colors: ["Black Brown", "Black", "Black Grey"], collections: ["extended-size-shoes"],
    fitEvidence: "unconfirmed", tier: "New", buyerFit: "Casual footwear retailers and wholesalers",
    highlights: ["Mesh side inserts", "Fabric lace loops", "EU 36–48 size range"], confirmBeforeQuote: confirmations,
    images: gallery("bq-lq060"), alibabaProductId: "1601972944790",
  },
  {
    code: "BQ-LQ2597", slug: "bq-lq2597", sourceModel: "2597",
    name: "Wide Toe Box Mesh Lace-Up Casual Shoes",
    shortDescription: "Wide toe box casual shoes with a ribbed mesh upper, two side bands and a low-profile brown sole.",
    group: "Wide Toe Box Casual Shoes", closure: "Lace-Up", upper: "Mesh upper with overlays; composition to be confirmed", sole: "Material to be confirmed",
    size: "EU 39-48", colors: ["Black", "White Red", "Grey"], collections: ["wide-toe-box", "extended-size-shoes"],
    fitEvidence: "wide_toe_verified", tier: "New", buyerFit: "Wide toe box footwear retailers and wholesalers",
    highlights: ["Wide toe box", "Ribbed mesh and two side bands", "EU 39–48 size range"], confirmBeforeQuote: confirmations,
    images: gallery("bq-lq2597"), alibabaProductId: "1601973797610",
  },
];
