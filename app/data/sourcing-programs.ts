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
    slug: "wholesale-walking-shoes",
    eyebrow: "WHOLESALE WALKING SHOES · B2B SOURCING",
    title: "Wholesale walking shoes for importers and online sellers",
    description:
      "Compare documented knit, textile and mesh walking-shoe styles, build a multi-style shortlist and request a quantity-based commercial review.",
    buyerIntent:
      "Importers, wholesalers, distributors and marketplace sellers selecting existing styles for a market test or repeatable assortment.",
    pathLabel: "Existing-style wholesale review",
    projectPath: "base_style_adaptation",
    productCodes: ["BQ009", "BQ001", "BQ002", "BQ004", "BQ012", "BQ024"],
    benefits: [
      {
        title: "Current online product selection",
        copy: "Compare product code, construction, size direction, colors and real images before contacting sales, or send another target style.",
      },
      {
        title: "Multi-style quote list",
        copy: "Place up to 12 styles in one sourcing brief with quantity, color and size notes for each line.",
      },
      {
        title: "Sample-first decisions",
        copy: "Use the sample stage to verify the selected product and agreed requirements before bulk-order confirmation.",
      },
    ],
    briefItems: [
      "Target market and sales channel",
      "Style codes or product links",
      "Estimated pairs per style",
      "Required colors and size ratio",
      "Packing or labeling request",
      "Destination and required timing",
    ],
    workflow: [
      {
        title: "Shortlist existing styles",
        copy: "Use documented product pages and the compare tool to narrow the range around your channel and customer.",
      },
      {
        title: "Submit one buying brief",
        copy: "Add quantity, color, size, packing, destination and trade-term preference so the reply can address commercial decisions.",
      },
      {
        title: "Review samples and quotation",
        copy: "Availability, specifications, sample arrangement, price and timing are confirmed style by style in writing.",
      },
    ],
    faq: [
      {
        question: "Can I request several styles in one quotation?",
        answer:
          "Yes. Add up to 12 styles to the quote list and enter the quantity, colors and sizes for each product line.",
      },
      {
        question: "Are website photos and catalogue details a final quotation?",
        answer:
          "No. They support product discovery. Price, availability, specifications, packing, freight and timing are confirmed in a written quotation.",
      },
      {
        question: "Can colors and sizes be mixed?",
        answer:
          "A mixed assortment can be reviewed against the selected style, current availability, order quantity and size ratio. It is not confirmed until written into the quotation.",
      },
      {
        question: "How does the order become official?",
        answer:
          "After specification and sample decisions, the parties confirm a written quotation and create the agreed Alibaba Trade Assurance order or bilateral contract.",
      },
    ],
    evidenceBoundary:
      "Priority styles are presented as sourcing starting points, not as claims of sales volume. Product availability and commercial terms remain order-specific.",
  },
  {
    slug: "private-label-walking-shoes",
    eyebrow: "PRIVATE LABEL WALKING SHOES · EXISTING STYLE PATH",
    title: "Private-label walking shoes built from a documented base style",
    description:
      "Start from an existing Beiqiang product reference, then discuss feasible logo, color, labeling and packing changes around your market and quantity.",
    buyerIntent:
      "Brand, private-label, retail-chain and e-commerce buyers who want to adapt an existing product direction instead of developing every component from zero.",
    pathLabel: "Existing-style adaptation",
    projectPath: "base_style_adaptation",
    productCodes: ["BQ001", "BQ002", "BQ009", "BQ004", "BQ012", "BQ024"],
    benefits: [
      {
        title: "Start with physical evidence",
        copy: "Each recommended base style has a product code, gallery, documented attributes and a list of facts that still require confirmation.",
      },
      {
        title: "Define branding precisely",
        copy: "Share the intended logo position, label, insole, box or packing direction so feasibility can be checked against the product.",
      },
      {
        title: "Approve before bulk",
        copy: "Color, branding, material direction and packaging need written approval and, where applicable, sample evidence before production.",
      },
    ],
    briefItems: [
      "Base style code or reference",
      "Target market and retail channel",
      "Expected quantity and color count",
      "Logo files and intended positions",
      "Label and packaging requirements",
      "Required launch or arrival window",
    ],
    workflow: [
      {
        title: "Choose a base style",
        copy: "Shortlist the closest existing construction and explain what should remain unchanged and what should be adapted.",
      },
      {
        title: "Review branding feasibility",
        copy: "The product, component and packing requirements are checked against quantity, process and available production options.",
      },
      {
        title: "Approve the agreed version",
        copy: "Use written specifications and physical sample review where required before confirming the bulk order.",
      },
    ],
    faq: [
      {
        question:
          "Does private label mean every change is automatically available?",
        answer:
          "No. Logo, color, label, material and packing requests are reviewed by style and quantity before they become confirmed specifications.",
      },
      {
        question: "What logo file should I prepare?",
        answer:
          "A vector file is preferred for production review. Also share the intended position, size, colors and any brand-use requirements.",
      },
      {
        question: "Can I use the product photos as an approved sample?",
        answer:
          "No. Website images identify a product direction. The approved product, color and branding version must be confirmed separately.",
      },
      {
        question: "Is accepting a quotation the same as placing an order?",
        answer:
          "No. Acceptance records commercial intent. The order becomes official only through the agreed Trade Assurance order or signed contract workflow.",
      },
    ],
    evidenceBoundary:
      "The page describes a review path, not a guarantee that every logo, material, color or packaging request is feasible at every quantity.",
  },
  {
    slug: "oem-knit-shoes",
    eyebrow: "OEM KNIT SHOES · TECHNICAL DEVELOPMENT INTAKE",
    title: "OEM knit walking-shoe development starts with a controlled brief",
    description:
      "Share the buyer target, reference, tech pack or physical sample so construction, materials, components, testing needs and development risk can be reviewed before quotation.",
    buyerIntent:
      "Footwear brands and technical development buyers whose project may require a new last, tooling, sole, material system, performance target, NDA or confidential tech pack.",
    pathLabel: "Technical product development",
    projectPath: "technical_development",
    productCodes: ["BQ001", "BQ002", "BQ004", "BQ009", "BQ012", "BQ019"],
    benefits: [
      {
        title: "Separate targets from facts",
        copy: "Buyer target values remain development requirements until supported by sample, component confirmation or formal test evidence.",
      },
      {
        title: "Record development inputs",
        copy: "Attach a tech pack, reference image or file to the private inquiry record instead of scattering critical requirements across messages.",
      },
      {
        title: "Keep revision evidence",
        copy: "The buyer status page can retain messages, quotations, reviewed documents and next actions under one private reference.",
      },
    ],
    briefItems: [
      "Tech pack, sketch or physical-sample context",
      "Target market and intended use",
      "Last, fit and size requirements",
      "Upper, lining and outsole direction",
      "Target values and requested test method",
      "Quantity, timing, NDA and destination",
    ],
    workflow: [
      {
        title: "Classify the project",
        copy: "Identify whether an existing construction can be adapted or whether new development, tooling or supplier validation is required.",
      },
      {
        title: "Confirm feasibility boundaries",
        copy: "Separate buyer targets, confirmed capability, fixed items and results that can exist only after sampling or testing.",
      },
      {
        title: "Define the sample decision",
        copy: "Agree the sample purpose, deliverables, acceptance criteria and exclusions before treating the project as quotation-ready.",
      },
    ],
    faq: [
      {
        question:
          "Can Beiqiang guarantee my target hardness, rebound or test result before sampling?",
        answer:
          "No. A target remains a buyer requirement until the relevant construction, component, finished sample and test evidence support an actual result.",
      },
      {
        question: "Can I send a confidential tech pack?",
        answer:
          "The inquiry flow supports private file upload and an NDA requirement flag. Confidentiality terms and review scope still need written confirmation before sensitive development work.",
      },
      {
        question: "Is a reference sole proof of a finished-shoe result?",
        answer:
          "No. A reference component, complete sample and formal test report are different evidence levels and must be described separately.",
      },
      {
        question: "When can the factory quote an OEM project?",
        answer:
          "A useful quotation requires enough confirmed information about construction, materials, components, quantity, sizes, packing, testing and delivery expectations.",
      },
    ],
    evidenceBoundary:
      "Reference products show relevant construction directions only. They do not prove that a new technical target, test result, tooling change or formulation is already available.",
  },
];

export function getSourcingProgram(slug: string) {
  return sourcingPrograms.find((program) => program.slug === slug);
}
