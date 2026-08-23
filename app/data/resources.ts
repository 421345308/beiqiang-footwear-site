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
    slug: "footwear-rfq-checklist",
    title: "Footwear RFQ Checklist for Importers and Wholesale Buyers",
    description: "Prepare a quotation-ready footwear brief covering style, quantity, size ratio, materials, packing, destination, timing and sample requirements.",
    eyebrow: "QUOTATION-READY BUYING BRIEF",
    audience: "Importers, wholesalers, sourcing agents and online sellers",
    readingTime: "8-minute buyer guide",
    updated: "2026-08-24",
    introduction: "A useful footwear quotation starts with a decision-ready buying brief. A supplier can discuss product direction from a photo or style code, but a final quotation still depends on the commercial and specification details below.",
    outcome: "Use this checklist to reduce avoidable clarification rounds while keeping every unknown item visible instead of guessing.",
    sections: [
      { heading: "1. Identify the exact product direction", copy: ["Use the supplier style code, source model, product link or a clearly labeled reference image. If several styles are being compared, list each one separately so quantities, colors and open questions are not mixed together."], bullets: ["Style code or product URL", "Target market and selling channel", "Existing style, modified style or new technical development", "Features that are required versus optional"] },
      { heading: "2. Give a realistic quantity and size ratio", copy: ["The total quantity alone is not enough for a shoe quotation. State the expected pairs per style, color and size range, even if the first ratio is only an estimate. Mark sample quantity separately from bulk quantity."], bullets: ["Pairs per style and color", "Size system and size range", "Indicative size ratio", "Sample pairs, sizes and colors"] },
      { heading: "3. Separate confirmed materials from buyer targets", copy: ["Describe required upper, lining, insole and outsole directions. If a material or performance value is a buyer target rather than an existing confirmed capability, label it as a target. Controlled hardness, density, rebound, compression set, stack height, drop, new tooling or laboratory tests require technical development review and sampling before any result can be stated."], bullets: ["Upper, lining, insole and outsole direction", "Color and trim requirements", "Logo method and placement", "Buyer targets that require feasibility review"] },
      { heading: "4. State packing, labeling and compliance needs", copy: ["Packing can change unit cost, carton configuration and timing. Share the destination-market labeling, barcode, polybag, shoebox, carton mark and documentation requirements that apply to your order. Do not assume a certificate or test exists for a style until it is confirmed in writing."], bullets: ["Shoebox or bulk-pack direction", "Barcode, labels and carton marks", "Destination-market requirements", "Required tests or documents and who accepts them"] },
      { heading: "5. Give the commercial route", copy: ["State the preferred trade term, destination and requested shipment or arrival window. EXW, FOB, FCA and DDP allocate cost and responsibility differently, so a request such as “best delivered price” needs the exact city, postal code and expected volume. Final price depends on the selected style, quantity, materials, size ratio, packing and order requirements."], bullets: ["Preferred EXW, FOB, FCA or DDP discussion", "Destination city, country and postal code where relevant", "Requested shipment or arrival window", "Preferred Alibaba Trade Assurance or bilateral-contract route"] },
      { heading: "6. Define the next decision", copy: ["Tell the supplier whether the next step is a product shortlist, sample quotation, modified sample, technical feasibility review or bulk quotation. This keeps a preliminary discussion from being mistaken for an accepted order."], bullets: ["Decision needed from the supplier", "Internal buyer review date", "Sample acceptance scope", "Named purchasing contact and reply channel"] },
    ],
    checklist: ["Exact style code or reference", "Buyer type, market and sales channel", "Bulk quantity by style/color", "Size system, range and ratio", "Sample quantity and allocation", "Material and construction requirements", "Logo, packing and labeling", "Destination and preferred trade term", "Requested timing", "Tests, documents and acceptance criteria", "Formal-order preference", "Open questions clearly marked"],
    relatedProductCodes: ["BQ001", "BQ003", "BQ009", "BQ024"],
    nextStep: "Build a structured multi-style quote request and keep uncertain fields marked for confirmation.",
  },
  {
    slug: "shoe-sample-approval-checklist",
    title: "Shoe Sample Approval Checklist Before Bulk Production",
    description: "Review one physical shoe sample against a frozen reference, written scope, acceptance criteria and explicit exclusions before bulk-order confirmation.",
    eyebrow: "SAMPLE RISK CONTROL",
    audience: "Brand buyers, importers and product-development teams",
    readingTime: "9-minute approval guide",
    updated: "2026-08-24",
    introduction: "“Sample approved” is too vague if the buyer and supplier are looking at different shoes, different documents or different acceptance scopes. A strong approval record identifies the physical sample and states exactly what was reviewed—and what was not.",
    outcome: "Use this checklist to turn a sample into controlled evidence without silently approving bulk specifications that were never reviewed.",
    sections: [
      { heading: "1. Freeze the physical reference", copy: ["Assign a sample reference and record the exact style, color, size, construction version and date. Photograph the received sample and keep the related specification or comments with the same review round."], bullets: ["Sample reference and revision", "Style code, color and size", "Date received and reviewer", "Linked specification and product photos"] },
      { heading: "2. Define the review scope", copy: ["Write what the round is intended to prove. A visual upper-color approval is not automatically an outsole-formulation, fit, packaging or performance approval. If the round uses reference components rather than a complete finished shoe, say so."], bullets: ["Appearance and color", "Materials and construction", "Fit and size direction", "Workmanship", "Packing or labeling", "Performance or laboratory test scope"] },
      { heading: "3. Check construction and workmanship", copy: ["Compare the sample with the agreed reference for symmetry, stitching, bonding, surface condition, component placement and finishing. Record objective differences with photos and measurements where possible instead of relying only on “good” or “bad.”"], bullets: ["Left/right symmetry", "Stitching and seams", "Bonding and visible glue", "Upper-to-sole alignment", "Logo and trim placement", "Surface defects and finishing"] },
      { heading: "4. Review fit without inventing a performance claim", copy: ["Record the last or size reference used, internal measurements available, try-on conditions and observed fit. A visual toe shape does not prove a wide last. Medical, orthopedic or therapeutic claims require separate evidence and should not be inferred from a comfort-oriented sample."], bullets: ["Size marking and measured length", "Last or fit reference where available", "Entry, instep, heel and toe observations", "Who tried the sample and under what conditions"] },
      { heading: "5. Separate buyer targets from actual results", copy: ["If the buyer has targets for hardness, density, rebound, compression set, stack height, drop or other technical values, keep them in a buyer-target field until the finished sample or formal test produces an actual result. Do not convert a target into a supplier guarantee."], bullets: ["Buyer target", "Confirmed current capability", "Fixed or not adjustable elements", "Actual result after sampling or testing"] },
      { heading: "6. Record decision, exclusions and next version", copy: ["Approve, request revision or close the round against the frozen evidence. List exclusions explicitly. If changes are requested, open a new sample round rather than overwriting the earlier decision."], bullets: ["Decision and decision date", "Accepted criteria", "Revision items with owner", "Explicit exclusions", "Next sample reference and review scope"] },
    ],
    checklist: ["Physical sample reference", "Exact style/color/size/version", "Review purpose and deliverables", "Written acceptance criteria", "Photos and measurements", "Material/construction observations", "Fit-review conditions", "Technical targets separated from results", "Approved items", "Explicit exclusions", "Revision actions", "Buyer-authored decision"],
    relatedProductCodes: ["BQ001", "BQ002", "BQ010", "BQ012"],
    nextStep: "Shortlist the relevant style first, then define one sample round with a frozen evidence scope.",
  },
  {
    slug: "private-label-walking-shoes-sourcing-guide",
    title: "Private Label Walking Shoes: From Shortlist to Formal Order",
    description: "A controlled B2B path for private-label walking-shoe buyers: shortlist, feasibility review, sample, quotation, written order confirmation and formal transaction handoff.",
    eyebrow: "PRIVATE-LABEL BUYER PATH",
    audience: "Brand buyers, Amazon/TikTok sellers and private-label teams",
    readingTime: "10-minute sourcing guide",
    updated: "2026-08-24",
    introduction: "Private label does not begin with a logo mockup. It begins by deciding whether an existing footwear direction can meet the buyer’s market, quantity, fit, material, packing and timing requirements—or whether the project requires separate technical development.",
    outcome: "Use this path to avoid treating a visual concept, reference component or preliminary quotation as a production-ready order.",
    sections: [
      { heading: "1. Choose the correct project path", copy: ["Start with an existing documented style when the silhouette and construction are close to the target. Use a technical-development path when the request depends on controlled foam values, new tooling, last dimensions, new outsole formulation, formal tests, NDA or a confidential tech pack."], bullets: ["Existing-style wholesale", "Existing style with reviewed modifications", "Private-label logo and packing discussion", "Technical development with defined deliverables"] },
      { heading: "2. Build a focused shortlist", copy: ["Compare a small number of relevant styles instead of requesting samples from the full catalogue. Use verified product pages to compare closure, upper direction, documented colors, size direction and open confirmation items. Wide-toe language applies only to styles with supporting evidence."], bullets: ["Target customer and channel", "Required fit or construction", "Season and color plan", "Expected quantity and price direction", "Reasons each shortlisted style remains relevant"] },
      { heading: "3. Confirm customization feasibility", copy: ["Share the proposed logo method, placement, color, packing and labeling. The factory should confirm what can use an existing construction, what requires a new component or process, and what remains fixed. A rendered mockup is not a finished sample."], bullets: ["Logo artwork and placement", "Color/material changes", "Shoebox, labels and carton marks", "Existing mold or new tooling", "Fixed versus adjustable elements"] },
      { heading: "4. Approve a controlled sample", copy: ["Agree on sample purpose, supplied deliverables, acceptance criteria and exclusions before the sample is produced. Approve the identified physical sample round, not a general product idea. Revisions should create a new round with a new reference."], bullets: ["Sample quantity and allocation", "Charge and courier discussion", "Physical reference", "Review scope and criteria", "Revision and re-review rules"] },
      { heading: "5. Review the quotation as a version", copy: ["A quotation should identify styles, quantities, price currency, trade term, validity, sample terms, packing, payment direction and lead-time basis. If the buyer requests changes, the supplier should issue a new written version rather than silently editing the old one."], bullets: ["Style and quantity lines", "Currency and trade term", "Packing and sample terms", "Validity and timing basis", "Buyer acceptance, revision or decline"] },
      { heading: "6. Move to the formal transaction channel", copy: ["The website can organize the buying brief, sample evidence, quotation decision and written order checklist, but it is not a card checkout. Production and payment action require an Alibaba Trade Assurance order or a separately signed bilateral contract with the accepted specification and commercial terms."], bullets: ["Legal purchasing company", "Eight-part written order summary", "Accepted quotation version", "Alibaba Trade Assurance or signed contract", "Payment and shipment records in the authoritative channel"] },
      { heading: "7. Keep fulfillment and repeat business connected", copy: ["Track buyer-safe shipment updates, resolve exceptions without rewriting the accepted order, and record the next replenishment or season as a new project. Earlier prices, availability and terms do not automatically carry forward."], bullets: ["Shipment and document handoff", "Exception and buyer response", "Delivery confirmation or issue report", "New replenishment or development record"] },
    ],
    checklist: ["Project path selected", "Focused product shortlist", "Buyer market and channel", "Quantity/size/color plan", "Customization scope", "Fixed and adjustable elements", "Sample scope and acceptance criteria", "Issued quotation version", "Written order-readiness summary", "Formal transaction reference", "Fulfillment owner", "Separate repeat-project record"],
    relatedProductCodes: ["BQ001", "BQ002", "BQ004", "BQ024"],
    nextStep: "Start with a private-label buying brief or compare the documented product candidates.",
  },
];

export function getBuyerResource(slug: string) { return buyerResources.find((resource) => resource.slug === slug); }
