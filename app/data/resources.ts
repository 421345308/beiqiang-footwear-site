export type ResourceSection = { heading: string; copy: string[]; bullets?: string[] };

export type BuyerResource = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  audience: string;
  readingTime: string;
  updated: string;
  introduction: string;
  outcome: string;
  sections: ResourceSection[];
  checklist: string[];
  relatedProductCodes: string[];
  nextStep: string;
};

export const buyerResources: BuyerResource[] = [
  {
    "slug": "footwear-rfq-checklist",
    "title": "Footwear RFQ Checklist: How to Ask for a Shoe Quotation",
    "description": "What to include in your first email to a shoe manufacturer: style, quantity, size mix, branding, samples and delivery destination.",
    "eyebrow": "BUYING GUIDE",
    "audience": "For footwear buyers and brands",
    "readingTime": "4-minute guide",
    "updated": "2026-09-08",
    "introduction": "You do not need a finished tech pack to ask about an existing shoe. A clear reference, an estimated quantity and a destination give the supplier a useful starting point. The details below help turn that first conversation into a quotation you can compare.",
    "outcome": "Use the example below as a starting point. Replace the numbers with your own and leave undecided items clearly marked.",
    "sections": [
      {
        "heading": "Start with the shoe and the customer",
        "copy": [
          "Send a product code, link or reference image. Explain where you sell and who the shoes are for. If you are comparing several styles, give each one a separate line; do not combine their quantities."
        ]
      },
      {
        "heading": "Break quantity down by style, color and size",
        "copy": [
          "A request for 300 pairs is incomplete if the order could mean one color or six. Give an estimate per color and size. For example, 120 pairs split across EU 39–44 might be 10/20/30/30/20/10. This is an illustration, not a recommended size ratio or a Beiqiang minimum."
        ]
      },
      {
        "heading": "Say what you want to change",
        "copy": [
          "Separate an unchanged shoe from a logo, color, insole or packaging change. If you want a specific material or test result, identify it as a requirement to be checked—not a specification already agreed. Ask for product, customization, sample and shipping costs to be stated separately."
        ]
      },
      {
        "heading": "Example: a first inquiry",
        "copy": [
          "Hello Beiqiang, we sell casual footwear online in Germany. We are considering BQ009, with an initial estimate of 300 pairs across two colors. Our size ratio is not yet final. We would like to discuss a logo on the insole and individual shoe boxes. Please confirm possible colors and sizes, the minimum order, sample options and what information you need for a quotation. We can provide the delivery address once the style is agreed.",
          "This example is not a quotation, a confirmed order or a statement of availability. If market access or documentation is required, raise it before ordering."
        ]
      },
      {
        "heading": "Before comparing two quotations",
        "copy": [
          "Check that both cover the same shoe, color mix, size mix, packaging, quantity and destination. Ask which charges are excluded and how long the quotation remains valid. A lower unit price is not necessarily a lower delivered cost."
        ]
      }
    ],
    "checklist": [
      "Style or reference",
      "Quantity and size mix",
      "Sample version and changes",
      "Branding and packing",
      "Destination and timing",
      "Questions still to confirm"
    ],
    "relatedProductCodes": [
      "BQ001",
      "BQ003",
      "BQ009",
      "BQ024"
    ],
    "nextStep": "Send a reference, quantity and destination. We can clarify the remaining details together."
  },
  {
    "slug": "shoe-sample-approval-checklist",
    "title": "Shoe Sample Approval Checklist Before Bulk Production",
    "description": "Check fit, construction, materials, logo and packing on a shoe sample, then write a clear approval or revision request.",
    "eyebrow": "BUYING GUIDE",
    "audience": "For footwear buyers and brands",
    "readingTime": "4-minute guide",
    "updated": "2026-09-08",
    "introduction": "A sample helps you decide whether to place an order. But “looks good” leaves too much open: does it approve the fit, the color, the branding, or all three? Keep a simple record of the exact sample and what you checked.",
    "outcome": "Finish with a clear decision: approved items, changes needed and anything still untested.",
    "sections": [
      {
        "heading": "Identify the sample",
        "copy": [
          "Record the style code, color, size, date and revision. Photograph both shoes and keep the specification with them. If the next sample changes, give it a new revision so everyone knows which version you mean."
        ]
      },
      {
        "heading": "Check appearance and workmanship",
        "copy": [
          "Compare left and right shoes, stitching, seams, bonding, upper-to-sole alignment, logo position and surface finish. Photograph a concern close up and on the whole shoe, so the factory can locate it."
        ]
      },
      {
        "heading": "Try the fit; do not rely on the size label",
        "copy": [
          "Record who tried the shoe, the size used and what happened at the toe, instep and heel. A visual toe shape does not prove a wide last. One wearer or one size does not settle fit across the entire size range."
        ]
      },
      {
        "heading": "Keep performance tests separate",
        "copy": [
          "Feeling a sole by hand does not establish its hardness, density or rebound. Where a technical value matters, agree a test method and record the actual result. A reference component is not the same as a tested finished shoe."
        ]
      },
      {
        "heading": "Write a useful revision note",
        "copy": [
          "Example: “Sample BQ009, black/white, EU42, revision A: appearance accepted; heel feels loose during our fitting. Please review fit before a revised sample. Logo and packaging have not been reviewed. Bulk production is not approved.” This is an illustrative note, not a finding about BQ009."
        ]
      }
    ],
    "checklist": [
      "Style or reference",
      "Quantity and size mix",
      "Sample version and changes",
      "Branding and packing",
      "Destination and timing",
      "Questions still to confirm"
    ],
    "relatedProductCodes": [
      "BQ001",
      "BQ002",
      "BQ010",
      "BQ012"
    ],
    "nextStep": "Choose a style and tell us what you need the sample to demonstrate."
  },
  {
    "slug": "private-label-walking-shoes-sourcing-guide",
    "title": "Private Label Walking Shoes: From First Idea to Order",
    "description": "How to start a private-label walking shoe range using an existing style, with practical decisions on branding, samples, minimums and packaging.",
    "eyebrow": "BUYING GUIDE",
    "audience": "For footwear buyers and brands",
    "readingTime": "4-minute guide",
    "updated": "2026-09-08",
    "introduction": "Your own shoe brand does not always need an entirely new shoe. Starting from an existing style lets you focus the discussion on fit, branding and packaging. A new last or sole is a different development project, with different questions and costs.",
    "outcome": "Decide whether you need an existing-style adaptation or a new design before asking for a price.",
    "sections": [
      {
        "heading": "Choose the base shoe first",
        "copy": [
          "Look at construction, closure, materials and intended fit before choosing a logo position. Shortlist two or three styles and ask about sample availability. Product photos alone cannot tell you how a shoe fits."
        ]
      },
      {
        "heading": "Make a simple change list",
        "copy": [
          "List what stays unchanged and what you want to alter: logo, upper color, insole, label or box. Send logo artwork with dimensions and placement. Ask the supplier to confirm each change separately rather than assuming “private label” includes everything."
        ]
      },
      {
        "heading": "Ask about the minimums behind the order",
        "copy": [
          "A shoe, custom-color material and printed box may have different minimum quantities. Ask how each affects your first batch. Reducing color variants or keeping an existing component can be discussed, but does not guarantee a particular minimum or price."
        ]
      },
      {
        "heading": "Approve the product and the presentation",
        "copy": [
          "Review the shoe sample, artwork and packing requirements. Keep the agreed version and revision notes. If a box or logo is still undecided, do not treat it as approved simply because you like the shoe."
        ]
      },
      {
        "heading": "Place the order with the details attached",
        "copy": [
          "Confirm quantities by color and size, specifications, sample reference, packing, price, payment terms and schedule. Beiqiang’s website is not a card checkout: formal transactions use the agreed Alibaba Trade Assurance order or bilateral contract."
        ]
      }
    ],
    "checklist": [
      "Style or reference",
      "Quantity and size mix",
      "Sample version and changes",
      "Branding and packing",
      "Destination and timing",
      "Questions still to confirm"
    ],
    "relatedProductCodes": [
      "BQ001",
      "BQ002",
      "BQ004",
      "BQ024"
    ],
    "nextStep": "Pick a base shoe, list the changes you want and send your expected quantity."
  }
];
export function getBuyerResource(slug: string) { return buyerResources.find(r => r.slug === slug); }
