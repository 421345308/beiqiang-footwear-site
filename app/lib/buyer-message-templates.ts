export type BuyerMessageRecord = {
  reference: string;
  name?: string;
  company?: string;
  market?: string;
  buyerType?: string;
  status?: string;
  styleCode?: string;
  projectPath?: string;
  items?: { code?: string }[];
  orderHandoff?: { method?: string; orderReference?: string } | null;
};

export const BUYER_MESSAGE_TEMPLATES = [
  {
    id: "qualification",
    label: "Qualification",
    purpose: "Collect the commercial brief needed for the next review.",
  },
  {
    id: "sample_details",
    label: "Sample details",
    purpose: "Confirm the exact sample request and delivery destination.",
  },
  {
    id: "quotation_review",
    label: "Quotation review",
    purpose: "Ask for one clear quotation decision or revision list.",
  },
  {
    id: "no_reply",
    label: "No-reply follow-up",
    purpose: "Check whether the project should continue, change or pause.",
  },
  {
    id: "order_handoff",
    label: "Order next step",
    purpose: "Reconfirm written order evidence and specifications.",
  },
] as const;

export type BuyerMessageTemplateId =
  (typeof BUYER_MESSAGE_TEMPLATES)[number]["id"];
export type RecommendationFollowUpStage = "selection_check" | "sample_or_quote";
export type BuyerRecommendationForFollowUp = {
  id: string;
  title: string;
  items: { code: string }[];
  nextStep: string;
  followUps?: { stage: RecommendationFollowUpStage }[];
};

function inline(value: unknown, fallback: string, max = 160) {
  const result = String(value || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
  return result || fallback;
}

function styles(record: BuyerMessageRecord) {
  const itemCodes = Array.isArray(record.items)
    ? record.items.map((item) => inline(item.code, "", 30)).filter(Boolean)
    : [];
  const direct = inline(record.styleCode, "the selected styles", 180);
  return itemCodes.length ? [...new Set(itemCodes)].join(", ") : direct;
}

function greeting(record: BuyerMessageRecord) {
  return `Hello ${inline(record.name, "there", 80)},`;
}

const signature =
  "Best regards,\nBeiqiang Footwear Supply\nQuanzhou, Fujian, China";

export function recommendedBuyerMessageTemplate(
  record: BuyerMessageRecord,
): BuyerMessageTemplateId {
  if (record.status === "quoted" || record.status === "negotiation")
    return "quotation_review";
  if (record.status === "sample_discussion") return "sample_details";
  if (record.status === "order_confirmed") return "order_handoff";
  return "qualification";
}

export function buildBuyerMessageTemplate(
  record: BuyerMessageRecord,
  id: BuyerMessageTemplateId,
) {
  const productText = styles(record);
  const reference = inline(record.reference, "your inquiry", 80);
  const technicalBoundary =
    record.projectPath === "technical_development"
      ? "Your dimensions, hardness, material or test values remain buyer targets until feasibility, sampling and any required testing are completed."
      : "Product specifications, availability and commercial terms remain subject to review and written confirmation.";
  const catalogueIntro =
    record.styleCode === "CATALOG-2026"
      ? "Thank you for requesting our current footwear line sheet."
      : `Thank you for your interest in ${productText}.`;

  const messages: Record<BuyerMessageTemplateId, string> = {
    qualification: `${greeting(record)}\n\n${catalogueIntro}\n\nTo prepare a focused next step, please reply with your target market or sales channel, estimated trial and bulk quantity, preferred colors and size range, and whether you need a sample or logo/packing review.\n\n${technicalBoundary}\n\n${signature}`,
    sample_details: `${greeting(record)}\n\nWe are reviewing the sample discussion for ${productText} under reference ${reference}.\n\nPlease reply with the exact style code, sample quantity, sizes, colors, delivery country and postal code, plus any logo or packing requirement. We will then confirm sample availability, sample terms, courier option and timing in writing.\n\nA reference image or buyer target is not an approved sample or confirmed production specification.\n\n${signature}`,
    quotation_review: `${greeting(record)}\n\nPlease review the latest issued quotation for reference ${reference}, including styles, quantities, currency, trade term, validity, lead-time statement, payment terms and packing.\n\nPlease reply with one outcome: accept it for the next order discussion, or list the exact items that need revision. Quotation acceptance does not automatically create an order or confirm payment.\n\n${signature}`,
    no_reply: `${greeting(record)}\n\nI am following up on reference ${reference} for ${productText}.\n\nPlease reply with one of these next steps: continue with the current request, revise the product or quantity direction, or place the project on hold. We will not assume an order, reserve stock or confirm timing without your reply and written review.\n\n${signature}`,
    order_handoff: `${greeting(record)}\n\nFor reference ${reference}, please confirm the exact Alibaba Trade Assurance order or bilateral contract reference and the approved style, quantity, colors, size ratio, packing and shipment terms before the next order action.\n\nUse only the verified Alibaba order or agreed contract channel for payment. This website does not collect card or bank credentials, and a website status is not proof of payment.\n\n${signature}`,
  };
  return messages[id];
}

export function buildRecommendationFollowUp(
  record: BuyerMessageRecord,
  recommendation: BuyerRecommendationForFollowUp,
  stage: RecommendationFollowUpStage,
) {
  const productCodes =
    [
      ...new Set(
        recommendation.items
          .map((item) => inline(item.code, "", 30))
          .filter(Boolean),
      ),
    ].join(", ") || "the recommended styles";
  const reference = inline(record.reference, "your inquiry", 80);
  const market = inline(record.market, "your target market", 100);
  const buyerType = inline(record.buyerType, "B2B buyer", 100);
  if (stage === "selection_check")
    return `${greeting(record)}\n\nI am following up on the product shortlist for reference ${reference}: ${productCodes}.\n\nPlease choose the style or styles that best fit your ${market} ${buyerType} project, or reply with the exact product direction that should change. To prepare a useful next step, include estimated quantity, preferred colors and size range.\n\nThe shortlist is a sourcing direction, not confirmation of price, stock, fit, materials or sample availability.\n\n${signature}`;
  return `${greeting(record)}\n\nBefore we pause the shortlist review for reference ${reference}, please reply with one next step for ${productCodes}:\n1. arrange a sample discussion;\n2. prepare a quotation after quantity, colors and size ratio are supplied; or\n3. replace these options using your updated product criteria.\n\nWe will not assume an order, reserve stock or confirm timing without your reply and written commercial review.\n\n${signature}`;
}
