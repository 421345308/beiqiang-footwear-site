export type InquiryReadinessInput = {
  company?: string;
  buyerType?: string;
  market?: string;
  email?: string;
  whatsapp?: string;
  styleCode?: string;
  quantity?: string;
  bulkQuantity?: string;
  sampleQuantity?: string;
  preferredTradeTerm?: string;
  deliveryDestination?: string;
  deliveryTiming?: string;
  requirements?: string;
  projectPath?: string;
  adaptationBrief?: { intent?: string; artworkStatus?: string; brandingPlacement?: string; colorDirection?: string; packingLabeling?: string };
  items?: { code?: string; quantity?: string; colors?: string; sizes?: string }[];
};

export type InquiryReadiness = {
  score: number;
  level: "ready" | "qualify" | "early";
  label: string;
  summary: string;
  missing: string[];
  strengths: string[];
};

function hasText(value: unknown, minimum = 1) {
  return typeof value === "string" && value.trim().length >= minimum;
}

function hasMeaningfulQuantity(value: unknown) {
  if (!hasText(value)) return false;
  const normalized = String(value).trim().toLowerCase();
  if (/\b(tbd|unknown|not sure|discuss|n\/a|na)\b/.test(normalized)) return false;
  return /\d/.test(normalized);
}

function hasSampleDecision(value: unknown) {
  if (hasMeaningfulQuantity(value)) return true;
  if (!hasText(value)) return false;
  const normalized = String(value).trim().toLowerCase();
  return /\b(no sample|samples? not (?:needed|required)|without samples?)\b/.test(normalized)
    || /(?:不需要|无需|暂不需要)样品/.test(normalized);
}

function addMissing(missing: string[], condition: boolean, message: string) {
  if (!condition) missing.push(message);
}

export function assessInquiryReadiness(record: InquiryReadinessInput): InquiryReadiness {
  let score = 0;
  const missing: string[] = [];
  const strengths: string[] = [];

  const hasEmail = hasText(record.email, 5);
  const hasWhatsapp = hasText(record.whatsapp, 5);
  if (hasEmail || hasWhatsapp) score += 12;
  if (hasEmail && hasWhatsapp) score += 3;
  addMissing(missing, hasEmail || hasWhatsapp, "Obtain a working email address or WhatsApp number.");
  if (hasEmail && hasWhatsapp) strengths.push("Two contact routes supplied");

  if (hasText(record.company, 2)) score += 8;
  else missing.push("Confirm the buyer's company or trading name.");
  if (hasText(record.buyerType, 2)) score += 4;
  else missing.push("Confirm whether the buyer is an importer, seller, brand or sourcing agent.");
  if (hasText(record.market, 2)) score += 8;
  else missing.push("Confirm the target country or market.");

  const hasStyle = hasText(record.styleCode, 2) || Boolean(record.items?.some((item) => hasText(item.code, 2)));
  if (hasStyle) score += 10;
  else missing.push("Identify at least one style code or product direction.");

  const detailedLines = record.items?.filter((item) => hasMeaningfulQuantity(item.quantity) && (hasText(item.colors) || hasText(item.sizes))) || [];
  if (detailedLines.length) {
    score += 10;
    strengths.push(`${detailedLines.length} product line${detailedLines.length === 1 ? "" : "s"} include quantity plus color or size detail`);
  } else {
    missing.push("Add per-style quantity plus color or size requirements.");
  }

  const quantity = record.bulkQuantity || record.quantity;
  if (hasMeaningfulQuantity(quantity)) {
    score += 15;
    strengths.push("Numeric bulk quantity supplied");
  } else {
    missing.push("Confirm an estimated trial or bulk quantity.");
  }

  if (hasSampleDecision(record.sampleQuantity)) score += 5;
  else missing.push("Confirm whether samples are needed, including pairs and sizes.");

  const hasTradePreference = hasText(record.preferredTradeTerm) && record.preferredTradeTerm !== "not_sure";
  if (hasTradePreference) score += 5;
  else missing.push("Discuss the preferred quotation starting point: EXW, FOB, FCA or DDP review.");

  if (hasText(record.deliveryDestination, 3)) score += 8;
  else missing.push("Confirm the delivery country, port, postcode or FBA destination.");
  if (hasText(record.deliveryTiming, 3)) score += 5;
  else missing.push("Confirm the requested arrival window or project timing.");
  if (hasText(record.requirements, 8)) score += 7;
  else missing.push("Record channel, packing, branding or other order requirements.");

  if (record.projectPath === "base_style_adaptation" && ["private_label", "combined_review"].includes(record.adaptationBrief?.intent || "")) {
    if (hasText(record.adaptationBrief?.brandingPlacement, 3)) strengths.push("Branding placement target supplied");
    else missing.push("Confirm the intended logo, insole or label placement.");
    if (["reference_only", "vector_ready"].includes(record.adaptationBrief?.artworkStatus || "")) strengths.push("Logo artwork readiness recorded");
    else missing.push("Confirm whether usable logo artwork is available.");
  }

  if (hasStyle && hasMeaningfulQuantity(quantity) && hasText(record.market, 2)) strengths.push("Style, market and quantity are identifiable");

  const level = score >= 75 ? "ready" : score >= 50 ? "qualify" : "early";
  const label = level === "ready" ? "Ready for commercial review" : level === "qualify" ? "Qualification needed" : "Early / incomplete brief";
  const summary = level === "ready"
    ? "Enough commercial context is present for a focused reply; verify every fact before quoting."
    : level === "qualify"
      ? "Useful buyer intent is present, but missing fields can still cause a generic or revised quotation."
      : "The record needs basic buyer, product or quantity context before commercial review.";

  return { score, level, label, summary, missing, strengths };
}
