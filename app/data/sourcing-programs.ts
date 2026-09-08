export type SourcingProgram = {
  slug:
    | "wholesale-walking-shoes"
    | "private-label-walking-shoes"
    | "oem-knit-shoes";
  eyebrow: string;
  title: string;
  description: string;
  buyerIntent: string;
  pathLabel: string;
  projectPath: "base_style_adaptation" | "technical_development";
  productCodes: string[];
  benefits: { title: string; copy: string }[];
  briefItems: string[];
  workflow: { title: string; copy: string }[];
  faq: { question: string; answer: string }[];
  evidenceBoundary: string;
};

export const sourcingPrograms: SourcingProgram[] = [
  {
    "slug": "wholesale-walking-shoes",
    "eyebrow": "WHOLESALE SHOES",
    "title": "Wholesale walking shoes for your next collection",
    "description": "Buy casual and walking shoes for your store, distribution business or online range. Compare styles, request samples and get a quotation for your color and size mix.",
    "buyerIntent": "For wholesalers, importers and online sellers buying existing shoe styles.",
    "pathLabel": "Wholesale order",
    "projectPath": "base_style_adaptation",
    "productCodes": [
      "BQ009",
      "BQ001",
      "BQ002",
      "BQ004",
      "BQ012",
      "BQ024"
    ],
    "benefits": [
      {
        "title": "Choose a practical assortment",
        "copy": "Compare slip-ons, lace-ups and selected wide-toe styles. Use the product code to keep different shoes and colors clear."
      },
      {
        "title": "Ask about a trial order",
        "copy": "Tell us the quantity you want per style and color. We check the minimum and available size mix instead of assuming every combination can be supplied."
      },
      {
        "title": "Check a sample before committing",
        "copy": "Ask which sample is available, what it costs and whether it matches the version you would order in bulk."
      }
    ],
    "briefItems": [
      "Target market and sales channel",
      "Style codes or product links",
      "Estimated pairs per style",
      "Required colors and size ratio",
      "Packing or labeling request",
      "Destination and required timing"
    ],
    "workflow": [
      {
        "title": "Select styles",
        "copy": "Add up to 12 styles to your quote list, or send a reference and describe the customers you sell to."
      },
      {
        "title": "Compare a written quotation",
        "copy": "We confirm the style, quantity, specifications, packing and delivery arrangements. Ask us to separate product and shipping charges so you know what is included."
      },
      {
        "title": "Confirm the sample and order",
        "copy": "Record any sample changes, agree the final details, then place the order through the agreed Trade Assurance or contract process."
      }
    ],
    "faq": [
      {
        "question": "Can I mix styles, colors and sizes?",
        "answer": "You can request a mixed order. List pairs per style and color, plus your size ratio. We check each line before confirming the order; availability is not the same for every combination."
      },
      {
        "question": "What is the MOQ for wholesale shoes?",
        "answer": "Send the specific style and the number of pairs you want. We confirm the minimum and available colors and sizes in the quotation. Branding or custom packing can have additional minimums."
      },
      {
        "question": "What if I do not know my size ratio yet?",
        "answer": "Tell us your intended market and size range, and mark the ratio as undecided. Confirm the final pairs per size before placing the order; size labels alone do not establish fit."
      },
      {
        "question": "Are these shoes in stock?",
        "answer": "A catalogue entry is not a stock reservation. We check current availability and dispatch or production timing for your selected styles before you order."
      }
    ],
    "evidenceBoundary": "Start with existing styles below. Current colors, sizes, quantities and delivery timing are checked when we prepare your quotation."
  },
  {
    "slug": "private-label-walking-shoes",
    "eyebrow": "PRIVATE-LABEL SHOES",
    "title": "Private-label walking shoes for your brand",
    "description": "Start your private-label shoe range with an existing Beiqiang style. Discuss your logo, colors, labels and packaging, then confirm samples and order details.",
    "buyerIntent": "For brands and retailers adding their identity to an existing casual or walking shoe.",
    "pathLabel": "Brand an existing style",
    "projectPath": "base_style_adaptation",
    "productCodes": [
      "BQ001",
      "BQ002",
      "BQ009",
      "BQ004",
      "BQ012",
      "BQ024"
    ],
    "benefits": [
      {
        "title": "Keep the shoe, change the branding",
        "copy": "Choose a base style first. Tell us which parts should stay the same and where you want your logo."
      },
      {
        "title": "Quote the changes separately",
        "copy": "Logo method, color, insole, labels and shoe boxes can affect cost and minimum quantities. We discuss the options before you commit."
      },
      {
        "title": "Approve the version you will sell",
        "copy": "Check the agreed branding and packaging along with the shoe. Keep the approved sample and artwork as the reference for your order."
      }
    ],
    "briefItems": [
      "Base style code or reference",
      "Target market and retail channel",
      "Expected quantity and color count",
      "Logo files and intended positions",
      "Label and packaging requirements",
      "Required launch or arrival window"
    ],
    "workflow": [
      {
        "title": "Choose a base shoe",
        "copy": "Send the product code and intended market. If you have not chosen a style, share a few references and explain what matters most."
      },
      {
        "title": "Agree the branding details",
        "copy": "Send your logo artwork, size and placement, preferred colors and packing requirements. We confirm feasibility, minimums and sample costs."
      },
      {
        "title": "Check samples, then place the order",
        "copy": "Review fit, appearance, logo and packing. Confirm revisions and the production version in writing before approving bulk production."
      }
    ],
    "faq": [
      {
        "question": "Can you put my logo on the shoes?",
        "answer": "We can review your logo request for the selected style. Send the artwork, intended location, size and colors. The suitable method, cost and minimum quantity are confirmed before sampling."
      },
      {
        "question": "Do I need a new mold for private label?",
        "answer": "Not necessarily. A project using an existing construction may need branding changes only. A new sole shape or last can require separate development. We identify that before quoting the work."
      },
      {
        "question": "Can I start with a small batch?",
        "answer": "Tell us your planned quantity per style and color. We check what is feasible; custom materials, colors and packaging may have their own minimums. No universal small-batch minimum applies to every design."
      },
      {
        "question": "What should I send first?",
        "answer": "A base style or reference image, expected quantity, sales market and a short list of changes. You can send detailed logo artwork after the direction is agreed."
      }
    ],
    "evidenceBoundary": "Logo, color and packaging options depend on the shoe and order quantity. We confirm the exact changes, sample costs and schedule before work begins."
  },
  {
    "slug": "oem-knit-shoes",
    "eyebrow": "CUSTOM FOOTWEAR DEVELOPMENT",
    "title": "Custom knit shoes: discuss your design with our factory",
    "description": "Have a shoe design or sample you want to develop? Share your construction, fit and material requirements with Beiqiang before agreeing development and sampling.",
    "buyerIntent": "For footwear brands with a design, technical brief or physical reference sample.",
    "pathLabel": "Custom shoe development",
    "projectPath": "technical_development",
    "productCodes": [
      "BQ001",
      "BQ002",
      "BQ004",
      "BQ009",
      "BQ012",
      "BQ019"
    ],
    "benefits": [
      {
        "title": "Find out what can be reused",
        "copy": "We first compare your requirements with existing constructions. Changing a logo is different from changing a last, sole or material formulation."
      },
      {
        "title": "Understand the work before paying",
        "copy": "Agree what needs development, any tooling, the sample deliverables and exclusions. Do not assume a reference image describes a production-ready shoe."
      },
      {
        "title": "Test the requirement that matters",
        "copy": "If you need a specific hardness, rebound or fit, define the measurement and test method. Results are confirmed from the relevant sample or test, not promised from a drawing."
      }
    ],
    "briefItems": [
      "Tech pack, sketch or physical-sample context",
      "Target market and intended use",
      "Last, fit and size requirements",
      "Upper, lining and outsole direction",
      "Target values and requested test method",
      "Quantity, timing, NDA and destination"
    ],
    "workflow": [
      {
        "title": "Share a non-confidential outline",
        "copy": "Describe the shoe, intended use, quantities and essential requirements. If you need an NDA, agree confidentiality terms before sharing sensitive designs."
      },
      {
        "title": "Review construction and costs",
        "copy": "Discuss which parts can use existing components and which need new development. Confirm sample scope, any tooling charges and what cannot be changed."
      },
      {
        "title": "Review the sample against your brief",
        "copy": "Record actual fit, construction and any test results. Agree revisions and outstanding questions before treating the sample as approved for bulk production."
      }
    ],
    "faq": [
      {
        "question": "Can you manufacture any design I send?",
        "answer": "Not every design will fit our available processes or components. We review your brief and explain what can be adapted, what needs further development and what we cannot confirm."
      },
      {
        "question": "Can you guarantee a target test result?",
        "answer": "No result is guaranteed from a brief alone. Agree the test method and acceptance criteria, then evaluate the relevant component or finished sample. A component result is not automatically a finished-shoe result."
      },
      {
        "question": "Can I send a confidential tech pack?",
        "answer": "Contact us with a general outline and your confidentiality requirements first. Agree the NDA and who may review the files before sending sensitive material."
      },
      {
        "question": "When will I receive a development quotation?",
        "answer": "Once the design, materials, components, quantity and sample requirements are clear enough to price. Missing technical details or supplier checks may need to be resolved first."
      }
    ],
    "evidenceBoundary": "The styles below are existing construction references, not a promise that a new design, sole, mold or performance requirement can be produced."
  }
];

export function getSourcingProgram(slug: string) { return sourcingPrograms.find(p => p.slug === slug); }
