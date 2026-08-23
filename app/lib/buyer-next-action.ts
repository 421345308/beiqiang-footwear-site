export type BuyerActionRequest = {
  status: { code: string };
  sampleProgram?: { status: string } | null;
  buyerQuotation?: { status: string; quoteNumber: string } | null;
  buyerOrderRequest?: { quoteNumber: string } | null;
  orderHandoff?: { method: "alibaba_trade_assurance" | "contract"; orderReference: string; orderUrl?: string } | null;
};

export type BuyerNextAction = { eyebrow: string; title: string; body: string; actionLabel: string; href: string; external?: boolean; tone: "review" | "decision" | "progress" | "closed" };

export function getBuyerNextAction(request: BuyerActionRequest): BuyerNextAction {
  if (request.status.code === "closed") return { eyebrow: "REQUEST CLOSED", title: "Ask Beiqiang if this project should be reopened", body: "The website will not accept new workflow decisions while this request is closed. Use the inquiry reference when contacting the sales team.", actionLabel: "Review contact options", href: "#buyer-contact-actions", tone: "closed" };
  if (request.orderHandoff?.orderReference) return { eyebrow: "FORMAL ORDER HANDOFF", title: `Review order ${request.orderHandoff.orderReference}`, body: "Compare the formal order channel and written eight-item summary with the approved quotation before any production or payment action.", actionLabel: request.orderHandoff.orderUrl ? "Open verified Trade Assurance order" : "Review order handoff", href: request.orderHandoff.orderUrl || "#order-handoff", external: Boolean(request.orderHandoff.orderUrl), tone: "progress" };
  if (request.sampleProgram?.status === "buyer_review") return { eyebrow: "YOUR DECISION IS NEEDED", title: "Review the referenced sample", body: "Check only the written review scope, then approve that sample or describe the exact style, size, color or component revision needed.", actionLabel: "Review sample and respond", href: "#sample-review", tone: "decision" };
  if (request.buyerQuotation?.status === "issued") return { eyebrow: "YOUR DECISION IS NEEDED", title: `Review quotation ${request.buyerQuotation.quoteNumber}`, body: "Check style lines, quantity, price, trade term, validity, payment, packing and sample terms before accepting or requesting a revision.", actionLabel: "Review current quotation", href: "#buyer-quotation", tone: "decision" };
  if (request.buyerQuotation?.status === "buyer_accepted" && !request.buyerOrderRequest) return { eyebrow: "NEXT COMMERCIAL STEP", title: "Provide the formal order setup details", body: "Your quotation acceptance is recorded. Supply the legal purchasing entity, order channel, destination and requested timing so Beiqiang can prepare the formal documents.", actionLabel: "Start order setup request", href: "#order-setup-request", tone: "decision" };
  if (request.buyerOrderRequest) return { eyebrow: "ORDER PREPARATION IN PROGRESS", title: "Beiqiang is verifying your setup request", body: "The request is saved but is not yet a production order. Use the private thread for corrections while the eight written order items are checked.", actionLabel: "Message the sales team", href: "#buyer-message-center", tone: "progress" };
  if (request.buyerQuotation?.status === "buyer_declined") return { eyebrow: "REVISION UNDER REVIEW", title: "Keep the requested quotation change clear", body: "Beiqiang will review your recorded note. Add any missing style, quantity, packing, timing or trade-term detail in the private thread.", actionLabel: "Add a private message", href: "#buyer-message-center", tone: "review" };
  return { eyebrow: "NEXT SOURCING STEP", title: "Complete the information needed for a useful reply", body: "Review the latest buyer-safe update and use the private thread for missing quantity, size, color, sample, destination or timing details.", actionLabel: "Message the sales team", href: "#buyer-message-center", tone: "review" };
}
