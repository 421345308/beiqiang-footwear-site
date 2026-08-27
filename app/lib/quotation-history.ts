export type BuyerSafeQuotation = {
  quoteNumber: string; version: string; currency: string; tradeTerm: string; validUntil: string; leadTime: string; paymentTerms: string; packing: string; sampleTerms: string; notes: string;
  lines: { code: string; description: string; quantity: string; unitPrice: string }[];
  status: string; issuedAt: string; buyerDecision: string; buyerNote: string; buyerRespondedAt: string;
  revisionBrief: { reasons: string[]; affectedCodes: string[]; targetQuantity: string; targetUnitPrice: string; targetTradeTerm: string; requestedDelivery: string; requestedPayment: string; requestedPacking: string; requestedSample: string } | null;
};

export function quotationTotal(quote: BuyerSafeQuotation) {
  const value = quote.lines.reduce((sum, line) => sum + (Number(String(line.quantity).replace(/[^\d.]/g, "")) || 0) * (Number(line.unitPrice) || 0), 0);
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function quotationChanges(previous: BuyerSafeQuotation, next: BuyerSafeQuotation, locale: "en" | "zh" = "en") {
  const labels = locale === "zh"
    ? { lines: "产品行／数量／单价", trade: "币种／贸易术语", validity: "有效期", lead: "交期", payment: "付款条款", packing: "包装", sample: "样品条款", notes: "报价备注" }
    : { lines: "product lines / quantity / unit price", trade: "currency / trade term", validity: "validity", lead: "lead time", payment: "payment terms", packing: "packing", sample: "sample terms", notes: "quotation notes" };
  const changes: string[] = [];
  if (JSON.stringify(previous.lines) !== JSON.stringify(next.lines)) changes.push(labels.lines);
  if (previous.currency !== next.currency || previous.tradeTerm !== next.tradeTerm) changes.push(labels.trade);
  if (previous.validUntil !== next.validUntil) changes.push(labels.validity);
  if (previous.leadTime !== next.leadTime) changes.push(labels.lead);
  if (previous.paymentTerms !== next.paymentTerms) changes.push(labels.payment);
  if (previous.packing !== next.packing) changes.push(labels.packing);
  if (previous.sampleTerms !== next.sampleTerms) changes.push(labels.sample);
  if (previous.notes !== next.notes) changes.push(labels.notes);
  return changes;
}
