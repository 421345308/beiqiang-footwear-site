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
  relatedCollection?: string;
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
  },
  {
    "slug": "shoe-moq-guide",
    "title": "Shoe MOQ: How Minimum Order Quantity Works",
    "description": "Why one shoe can carry several minimums, which unit the MOQ is counted in, and how to ask for it in writing before comparing quotations.",
    "eyebrow": "BUYING GUIDE",
    "audience": "For footwear buyers and brands",
    "readingTime": "5-minute guide",
    "updated": "2026-09-27",
    "introduction": "Minimum order quantity is one of the first numbers a buyer asks for, and one of the easiest to misread. A single figure rarely covers every version of an order: the shoe itself, a new colour of material, a printed box and a logo may each carry a minimum of their own. This guide explains what to ask so the number you receive matches the order you are actually planning.",
    "outcome": "Before you compare quotations, make sure every minimum is written against the same unit and the same version of the order.",
    "sections": [
      {
        "heading": "Why one shoe can carry several minimums",
        "copy": [
          "The shoe, a material change and the packaging are usually reviewed separately. A new colour of upper material, a printed shoe box or a custom insole can each introduce a minimum of its own, because they start a separate arrangement upstream. Ask which parts of your request stay unchanged and which parts create a new minimum."
        ]
      },
      {
        "heading": "Check which unit the minimum is counted in",
        "copy": [
          "A minimum can be stated per style, per style and colour, per size, or per shipment. Two suppliers can both say 300 and mean very different commitments. Write the unit next to the number in your own notes: 300 pairs per style is not the same commitment as 300 pairs spread across four colours."
        ]
      },
      {
        "heading": "Ask how a mixed order is treated",
        "copy": [
          "If you are planning an assortment, say so at the start. Combining several styles or colours in one discussion can change how a minimum is reviewed, but it does not remove the underlying requirement. Ask for the minimum to be stated for the whole request and for each line separately."
        ]
      },
      {
        "heading": "Do not treat the minimum as the only lever on price",
        "copy": [
          "Unit price also depends on material, construction, packing, size ratio, payment terms and destination. A smaller trial order and a larger repeat order are two different commercial conversations. Ask which parts of a quotation are driven by quantity and which are not."
        ]
      },
      {
        "heading": "How to ask for a minimum in writing",
        "copy": [
          "Example: “We plan BQ001 in black and white, roughly 60 pairs per colour, with our logo on the insole. Please confirm the minimum for the shoe, for the logo change and for individual shoe boxes, and tell us which unit each minimum is counted in.”",
          "This is a wording example. It is not a Beiqiang minimum, a quotation or a statement of availability: minimums are confirmed per style and per project in writing."
        ]
      }
    ],
    "checklist": [
      "Style and colours you plan",
      "Expected pairs per colour",
      "Which parts are customised",
      "Unit each minimum is counted in",
      "Packaging and logo requirements",
      "What is still open"
    ],
    "relatedProductCodes": [
      "BQ001",
      "BQ004",
      "BQ009",
      "BQ024"
    ],
    "nextStep": "Send your style, colours and expected quantity, and ask for each minimum in writing."
  },
  {
    "slug": "oem-vs-odm-shoes",
    "title": "OEM vs ODM Shoes: Which Model Fits Your Order",
    "description": "The practical difference between adapting an existing developed shoe and building your own, and how to choose before tooling is committed.",
    "eyebrow": "BUYING GUIDE",
    "audience": "For brand owners and sourcing teams",
    "readingTime": "5-minute guide",
    "updated": "2026-09-27",
    "introduction": "OEM and ODM are often used as if they described a factory's skill level. In footwear sourcing they describe something narrower and more useful: who owns the design, and how much of it still has to be created before your order can be produced.",
    "outcome": "Decide whether your project is a branding exercise on an existing shoe or a development project with new tooling — the two follow different paths.",
    "sections": [
      {
        "heading": "What the two terms actually describe",
        "copy": [
          "ODM usually means the supplier already has a developed shoe that is offered to several buyers, and a buyer adapts branding, colours or packing. OEM usually means the buyer brings a design or specification and the factory builds to it. The boundary sits with the last step: is the shoe already developed, or does it still have to be?"
        ]
      },
      {
        "heading": "When an existing style is the right starting point",
        "copy": [
          "If you are entering a category, testing a market or building a range quickly, starting from a developed shoe keeps tooling and development time off the critical path. The work then concentrates on changes you can control: logo, colour, insole, labels and packing."
        ]
      },
      {
        "heading": "When the project is genuinely a development project",
        "copy": [
          "A new last, a new outsole mould, a specified compound or a required test result cannot be handled as a branding change. Treat these as development: they need a brief, a feasibility review, a sample plan and their own cost and timing discussion."
        ]
      },
      {
        "heading": "Prepare the brief before you ask for cost",
        "copy": [
          "A development discussion moves faster with a reference: an existing shoe, a sketch, or a sample brief explaining what must change and what may stay. Say which requirements are fixed and which are preferences, then ask for development work, tooling and sampling to be quoted separately from production."
        ]
      },
      {
        "heading": "A simple way to choose",
        "copy": [
          "If the shoe you want already exists and your changes are surface-level, stay on the existing-style path. If the shape, construction or materials must change, plan a development project and expect review steps before a production price. Mixing both in one brief is the most common source of delay."
        ]
      }
    ],
    "checklist": [
      "Is the shoe already developed",
      "What must change",
      "What may stay",
      "Reference or sketch available",
      "Tooling or testing involved",
      "Development cost and timing to confirm"
    ],
    "relatedProductCodes": [
      "BQ001",
      "BQ002",
      "BQ029",
      "BQ031"
    ],
    "nextStep": "Tell us whether you are branding an existing style or developing a new one, and send the reference you have."
  },
  {
    "slug": "shoe-factory-audit-checklist",
    "title": "Shoe Factory Audit: What Buyers Can Verify",
    "description": "Separate the three kinds of factory review, then use a checklist that keeps observations, open questions and certificates in their proper place.",
    "eyebrow": "BUYING GUIDE",
    "audience": "For buying teams and sourcing managers",
    "readingTime": "5-minute guide",
    "updated": "2026-09-27",
    "introduction": "A factory review is only as useful as the line between what you observed and what you concluded. Photographs of a workshop do not certify capacity, and a supplier's own summary is not a third-party audit. This guide sets out what a buying team can reasonably check, and how to record it.",
    "outcome": "Produce a review note that lists observations, open questions and documents still required — without turning any of them into a certificate.",
    "sections": [
      {
        "heading": "Name the kind of review first",
        "copy": [
          "There are three different exercises: a buyer's own review before ordering, a third-party audit from a qualified inspection body, and a platform review attached to a transaction. They produce different documents and are relied on differently. Be clear which one your team actually needs before you request evidence."
        ]
      },
      {
        "heading": "What can be reviewed remotely",
        "copy": [
          "Public company details, product pages and images, sample quality, and whether a supplier answers the same question consistently across conversations. Public footage shows what was recorded on a given day in a given area; it does not describe the whole site or its capacity."
        ]
      },
      {
        "heading": "What is worth checking on site",
        "copy": [
          "Look at how material is stored, which process steps happen in-house and which are outsourced, the in-process checks you can see, how finished pairs are staged, and how packing and carton marking are controlled. Ask about the step, not only the machine."
        ],
        "bullets": [
          "Material and component storage",
          "Cutting, stitching and assembly areas",
          "In-process checking points",
          "Finished-goods staging",
          "Packing and carton-marking area"
        ]
      },
      {
        "heading": "Ask questions whose answers stay honest",
        "copy": [
          "Capacity, certifications, customer names and complaint history are the areas where a verbal answer is least useful. Ask instead for the specific document you need, issued in the name you need it in, then record who will provide it and when. If a document cannot be shared, note that — rather than accepting a substitute claim."
        ]
      },
      {
        "heading": "Write the review as a note, not a verdict",
        "copy": [
          "Example: “Observed: stitching and assembly areas, finished-goods staging and packing preparation. Not verified on this visit: capacity, testing equipment, named certification documents. Open: sample revision review outstanding.”",
          "This is a recording convention, not a statement about any specific factory."
        ]
      }
    ],
    "checklist": [
      "Which review type is required",
      "Documents requested by name",
      "Areas or steps observed",
      "Process steps seen in-house",
      "What remains unverified",
      "Owner and date for each open item"
    ],
    "relatedProductCodes": [
      "BQ001",
      "BQ009",
      "BQ024",
      "BQ031"
    ],
    "nextStep": "Share the review scope you need and the documents you must have, and we will confirm what can be provided."
  },
  {
    "slug": "how-to-order-shoes-from-china-factory",
    "title": "How to Order Shoes From a China Factory",
    "description": "A stage-by-stage walkthrough from first enquiry to shipment, written around the confirmations that decide whether an order runs smoothly.",
    "eyebrow": "BUYING GUIDE",
    "audience": "For first-time and repeat footwear buyers",
    "readingTime": "6-minute guide",
    "updated": "2026-09-27",
    "introduction": "Most problems in a first footwear order do not come from the shoes. They come from a step being treated as finished before it was actually confirmed. This walkthrough follows an order through six stages and flags the point where each stage should be closed.",
    "outcome": "Know what to settle at each stage, and which items should never be assumed.",
    "sections": [
      {
        "heading": "Stage 1 — shortlist and ask",
        "copy": [
          "Choose a style or send a reference, then state quantity, size direction and destination, including anything you want to change. A clear first message is the difference between one useful reply and a week of questions."
        ]
      },
      {
        "heading": "Stage 2 — sample",
        "copy": [
          "Confirm what the sample is meant to demonstrate, what version it will be made from and what it costs, before it is produced. When it arrives, record the version and check fit, workmanship, colour and branding separately, then state clearly what is approved and what must change."
        ]
      },
      {
        "heading": "Stage 3 — written quotation",
        "copy": [
          "Check that the quotation covers the same style, colours, size ratio, packing and destination you asked about, and that it states what is excluded, the currency, the trade term and how long it stays valid. Only like-for-like quotations can be compared."
        ]
      },
      {
        "heading": "Stage 4 — order and payment route",
        "copy": [
          "Confirm the final specification and packing, then use the agreed formal channel. Beiqiang's website is not a card checkout: transactions are completed through the agreed Alibaba Trade Assurance order or a bilateral contract, with payment terms stated in writing."
        ]
      },
      {
        "heading": "Stage 5 — production and checking",
        "copy": [
          "Agree what will be checked before shipment, by whom, and how a finding will be resolved. Ask for the current production status rather than a general reassurance. When something changes, treat it as a change to be confirmed, not an adjustment to be assumed."
        ]
      },
      {
        "heading": "Stage 6 — packing and shipment",
        "copy": [
          "Confirm carton marking, quantity per carton, labels and shipping method, then check the shipping documents against the agreed terms. Anything unclear here is cheaper to resolve before dispatch than after."
        ]
      }
    ],
    "checklist": [
      "Style, colours, quantity, destination",
      "What the sample must demonstrate",
      "Quotation scope and validity",
      "Specification and packing confirmed",
      "Formal transaction channel agreed",
      "Pre-shipment check responsibilities"
    ],
    "relatedProductCodes": [
      "BQ001",
      "BQ003",
      "BQ009",
      "BQ024"
    ],
    "nextStep": "Send your style, quantity and destination, and we can start at stage one together."
  },
  {
    "slug": "wide-fit-shoes-sourcing-guide",
    "title": "Wide Fit Shoes: How to Source Wide and Extra Wide Styles",
    "description": "Why wide means different things to different buyers, how width is decided at the last rather than the size, and what to put in writing before ordering wide fit or extra wide shoes.",
    "eyebrow": "BUYING GUIDE",
    "audience": "For comfort-footwear importers and brands",
    "readingTime": "6-minute guide",
    "updated": "2026-09-28",
    "introduction": "Wide fit is one of the most requested and least standardised requirements in footwear. Two suppliers can both answer yes, wide, and mean two different shoes, because there is no shared definition of what wide measures. This guide sets out what width actually describes, where it is decided, and how to write the requirement so that a quotation, a sample and a bulk order all refer to the same thing.",
    "outcome": "Use the sections below to turn a vague wide requirement into a written specification you can check against a physical sample.",
    "sections": [
      {
        "heading": "Wide is not one measurement",
        "copy": [
          "At least four different dimensions get called wide. The toe box is the front of the shoe where the toes sit. The last width is the overall width of the mould the shoe is built on. The midfoot is the area under the arch. The instep volume is the space over the top of the foot.",
          "A shoe can be generous at the toe and tight across the midfoot, or the reverse. That is why a buyer who asks for a wide shoe without naming the dimension often receives something that measures wide and still does not fit. Name the dimension you are solving for before you ask for a width."
        ]
      },
      {
        "heading": "Why width is decided at the last, not at the size",
        "copy": [
          "Sizing up does not make a shoe wider in the places that matter. A larger size adds length, and adds a little width in proportion, but the shape of the last is unchanged. If the toe box is tapered, a bigger size is still tapered.",
          "Real width change is a mould decision. Widening the last affects the tooling, the pattern, the material consumption and the minimum quantity that makes the change worthwhile. This is why a supplier cannot promise a wider version of any style on request, and why width is one of the first things to raise rather than the last.",
          "Ask directly: is the width a property of the existing last, or does it need a new one? The answer decides whether you are choosing a shoe or starting a development project."
        ]
      },
      {
        "heading": "What to put in writing in your request",
        "copy": [
          "State the problem, not only the word. A useful line reads: our customers report pressure across the toes in EU 42, and returns concentrate in the toe box. That gives the supplier something to match. A request that only says we need wide shoes gives them nothing to check against.",
          "Add a reference the supplier can compare with. The most reliable reference is a shoe your own customers already accept, with the size and the area that works for them. Measurements of a last or of a foot are useful too, but a reference the supplier can hold is harder to misinterpret.",
          "Keep width separate from testing. If a market requires a particular standard or a test report, that is a different requirement with a different cost and timeline. Raise it as its own line item rather than folding it into the width request."
        ]
      },
      {
        "heading": "How to describe width when there is no shared scale",
        "copy": [
          "Width labels such as E, 2E or 4E are used in some markets and not in others, and the same letter does not mean the same millimetres everywhere. Industry terms for a roomy toe box are likewise used loosely.",
          "Where no shared scale exists, describe the outcome instead of the label. Say what the wearer should be able to do, how much movement around the toes is acceptable, and whether the shoe must accommodate an insole or an orthotic. Descriptive requirements survive the trip between two factories; letter grades frequently do not.",
          "If your market does publish a width scale, provide it, and ask for the measurement basis in return. You are looking for the supplier to name what they measured, not to repeat your word back."
        ]
      },
      {
        "heading": "What a sample can and cannot confirm",
        "copy": [
          "A sample confirms the things you can feel and measure on one pair: room around the toes, pressure across the midfoot, where the upper creases, and whether the sole is stable underfoot. It is the point where width stops being a description and becomes something you can check.",
          "A sample does not confirm consistency across a production run, how the material will behave after months of wear, or whether the style meets a market requirement. Treat the sample as the check you can actually make, and keep the remaining questions as written items to be confirmed rather than assumptions to be carried forward.",
          "Review the sample against the sentence you wrote in your request. If the requirement was vague, the sample review will be vague too, and the disagreement only appears after the bulk order has arrived."
        ]
      },
      {
        "heading": "Where buyers get this wrong",
        "copy": [
          "Three mistakes recur. Treating toe-box width as total fit, so a roomy front is used to cover a tight midfoot. Assuming one width answer applies across a whole range of styles, when each style sits on its own last. And leaving the width question until after price, when it is the requirement most likely to change the quote.",
          "The corrective is the same in each case: name the dimension, ask how the width is achieved, and confirm it on a physical sample before the bulk order."
        ]
      }
    ],
    "checklist": [
      "The width problem you are solving",
      "Toe box, midfoot or instep volume",
      "A reference shoe the supplier can compare",
      "Target market and sales channel",
      "Size and insole requirements",
      "Who confirms the last before bulk"
    ],
    "relatedProductCodes": [
      "BQ001",
      "BQ002",
      "BQ031"
    ],
    "relatedCollection": "wide-toe-box",
    "nextStep": "Send the width problem and a reference shoe, and we can review which documented styles are worth sampling."
  }
];
export function getBuyerResource(slug: string) { return buyerResources.find(r => r.slug === slug); }
