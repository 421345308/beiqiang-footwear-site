import { createHash, timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";

function response(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}

const PUBLIC_STATUS = {
  new: { code: "received", label: "Request received", step: 1 },
  qualified: { code: "under_review", label: "Requirements under review", step: 2 },
  sample_discussion: { code: "sample_discussion", label: "Sample discussion", step: 3 },
  quoted: { code: "quotation_stage", label: "Quotation stage", step: 4 },
  negotiation: { code: "commercial_discussion", label: "Commercial discussion", step: 5 },
  order_confirmed: { code: "order_confirmed", label: "Order confirmed", step: 6 },
  lost: { code: "closed", label: "Request closed", step: 0 },
  spam: { code: "closed", label: "Request closed", step: 0 },
};

function safeEqual(left, right) {
  const a = Buffer.from(left || ""); const b = Buffer.from(right || "");
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

function buyerSafeOrderHandoff(value) {
  if (!value) return null;
  return { method: value.method, orderReference: value.orderReference, orderUrl: value.method === "alibaba_trade_assurance" ? value.orderUrl : "", confirmedAt: value.confirmedAt || "", note: value.note || "", fulfillmentStatus: value.fulfillmentStatus || "order_documents", carrier: value.carrier || "", trackingNumber: value.trackingNumber || "", paymentCurrency: value.paymentCurrency || "USD", paymentMilestones: Array.isArray(value.paymentMilestones) ? value.paymentMilestones.map((item) => ({ id: item.id, label: item.label, amount: item.amount, dueDate: item.dueDate, status: item.status, paidAt: item.paidAt, reference: item.reference, note: item.note })) : [], orderChecklist: value.orderChecklist ? { productSpecification: value.orderChecklist.productSpecification || "", sampleDecision: value.orderChecklist.sampleDecision || "", quantitySizeRatio: value.orderChecklist.quantitySizeRatio || "", colorsMaterials: value.orderChecklist.colorsMaterials || "", packingLabeling: value.orderChecklist.packingLabeling || "", priceTradeTerm: value.orderChecklist.priceTradeTerm || "", paymentTerms: value.orderChecklist.paymentTerms || "", deliveryWindow: value.orderChecklist.deliveryWindow || "" } : null };
}

export function createInquiryStatusHandler({ getStoreImpl = getStore } = {}) {
  return async function onRequestGet(context) {
    const url = new URL(context.request.url);
    const reference = (url.searchParams.get("reference") || "").trim().toUpperCase();
    const accessCode = (url.searchParams.get("accessCode") || "").trim().toUpperCase();
    const match = /^BQ-(\d{4})(\d{2})(\d{2})-([A-F0-9]{8})$/.exec(reference);
    if (!match || !/^[A-F0-9]{20}$/.test(accessCode)) return response(400, { ok: false, message: "Check the reference and status access code." });
    const date = `${match[1]}-${match[2]}-${match[3]}`;
    try {
      const store = getStoreImpl("beiqiang-inquiries");
      const record = await store.get(`inquiries/${date}/${reference}.json`, { type: "json", consistency: "strong" });
      const suppliedHash = createHash("sha256").update(accessCode).digest("hex");
      if (!record?.accessTokenHash || !safeEqual(record.accessTokenHash, suppliedHash)) return response(404, { ok: false, message: "No matching request was found. Check both values or contact Beiqiang." });
      const publicStatus = PUBLIC_STATUS[record.status] || PUBLIC_STATUS.new;
      const buyerQuote = Array.isArray(record.quotations) ? [...record.quotations].reverse().find((quote) => ["issued", "buyer_accepted", "buyer_revision_requested", "buyer_declined"].includes(quote.status)) : null;
      const buyerOrderRequest = Array.isArray(record.buyerOrderRequests) ? record.buyerOrderRequests.at(-1) : null;
      const buyerRecommendation = Array.isArray(record.recommendationSets) ? [...record.recommendationSets].reverse().find((item) => item.status !== "superseded") : null;
      return response(200, {
        ok: true,
        request: {
          reference: record.reference, receivedAt: record.receivedAt, status: publicStatus,
          styleCode: record.styleCode, styleLabel: record.styleLabel, projectPath: record.projectPath,
          quantity: record.bulkQuantity || record.quantity, sampleQuantity: record.sampleQuantity || "",
          preferredTradeTerm: record.preferredTradeTerm || "not_sure", deliveryDestination: record.deliveryDestination || "", deliveryTiming: record.deliveryTiming || "",
          items: Array.isArray(record.items) ? record.items.map((item) => ({ code: item.code, name: item.name, quantity: item.quantity, colors: item.colors, sizes: item.sizes, notes: item.notes })) : [],
          attachments: Array.isArray(record.attachments) ? record.attachments.filter((file) => !file.revokedAt).map((file) => ({ id: file.id, name: file.name, size: file.size, uploadedAt: file.uploadedAt })) : [],
          messages: Array.isArray(record.messages) ? record.messages.slice(-100).map((message) => ({ id: message.id, sender: message.sender === "sales" ? "sales" : "buyer", body: message.body, sentAt: message.sentAt })) : [],
          orderDocuments: Array.isArray(record.orderDocuments) ? record.orderDocuments.filter((document) => !document.revokedAt).map((document) => ({ id: document.id, name: document.name, title: document.title, category: document.category, note: document.note, contentType: document.contentType, size: document.size, uploadedAt: document.uploadedAt })) : [],
          sampleProgram: record.sampleProgram ? { status: record.sampleProgram.status, sampleReference: record.sampleProgram.sampleReference || "", styleCodes: record.sampleProgram.styleCodes, quantity: record.sampleProgram.quantity, sizes: record.sampleProgram.sizes, colors: record.sampleProgram.colors, purpose: record.sampleProgram.purpose, reviewScope: record.sampleProgram.reviewScope, deliverables: record.sampleProgram.deliverables || "", acceptanceCriteria: record.sampleProgram.acceptanceCriteria || "", exclusions: record.sampleProgram.exclusions || "", reviewRounds: Array.isArray(record.sampleProgram.reviewRounds) ? record.sampleProgram.reviewRounds.map((item) => ({ round: item.round, sampleReference: item.sampleReference || "", styleCodes: item.styleCodes || "", purpose: item.purpose || "", reviewScope: item.reviewScope || "", deliverables: item.deliverables || "", acceptanceCriteria: item.acceptanceCriteria || "", exclusions: item.exclusions || "", status: item.status || "", openedAt: item.openedAt || "", decision: item.decision || "", buyerNote: item.buyerNote || "", respondedAt: item.respondedAt || "" })) : [], currency: record.sampleProgram.currency, sampleCharge: record.sampleProgram.sampleCharge, chargeStatus: record.sampleProgram.chargeStatus, paidAt: record.sampleProgram.paidAt, courier: record.sampleProgram.courier, trackingNumber: record.sampleProgram.trackingNumber, shippedAt: record.sampleProgram.shippedAt, expectedDelivery: record.sampleProgram.expectedDelivery, note: record.sampleProgram.note, buyerDecision: record.sampleProgram.buyerDecision || "", buyerNote: record.sampleProgram.buyerNote || "", buyerRespondedAt: record.sampleProgram.buyerRespondedAt || "", updatedAt: record.sampleProgram.updatedAt } : null,
          buyerRecommendation: buyerRecommendation ? { id: buyerRecommendation.id, title: buyerRecommendation.title, introduction: buyerRecommendation.introduction, items: buyerRecommendation.items.map((item) => ({ code: item.code, reason: item.reason })), nextStep: buyerRecommendation.nextStep, status: buyerRecommendation.status, issuedAt: buyerRecommendation.issuedAt, buyerDecision: buyerRecommendation.buyerDecision || "", selectedCodes: Array.isArray(buyerRecommendation.selectedCodes) ? buyerRecommendation.selectedCodes : [], buyerNote: buyerRecommendation.buyerNote || "", buyerRespondedAt: buyerRecommendation.buyerRespondedAt || "" } : null,
          buyerQuotation: buyerQuote ? { quoteNumber: buyerQuote.quoteNumber, version: buyerQuote.version, currency: buyerQuote.currency, tradeTerm: buyerQuote.tradeTerm, validUntil: buyerQuote.validUntil, leadTime: buyerQuote.leadTime, paymentTerms: buyerQuote.paymentTerms, packing: buyerQuote.packing, sampleTerms: buyerQuote.sampleTerms, notes: buyerQuote.notes, lines: buyerQuote.lines, status: buyerQuote.status, issuedAt: buyerQuote.issuedAt, buyerDecision: buyerQuote.buyerDecision || "", buyerNote: buyerQuote.buyerNote || "", buyerRespondedAt: buyerQuote.buyerRespondedAt || "", revisionBrief: buyerQuote.revisionBrief || null } : null,
          buyerOrderRequest: buyerOrderRequest ? { id: buyerOrderRequest.id, quoteNumber: buyerOrderRequest.quoteNumber, preferredOrderChannel: buyerOrderRequest.preferredOrderChannel, legalCompanyName: buyerOrderRequest.legalCompanyName, purchasingContact: buyerOrderRequest.purchasingContact, purchaseOrderReference: buyerOrderRequest.purchaseOrderReference || "", destination: buyerOrderRequest.destination, requestedWindow: buyerOrderRequest.requestedWindow, instructions: buyerOrderRequest.instructions || "", status: buyerOrderRequest.status || "submitted", submittedAt: buyerOrderRequest.submittedAt } : null,
          orderHandoff: buyerSafeOrderHandoff(record.orderHandoff),
          orderVersions: Array.isArray(record.orderVersions) ? record.orderVersions.map((item) => ({ version: item.version, acceptedAt: item.acceptedAt || "", acceptedBy: item.acceptedBy === "Buyer" ? "Buyer" : "Beiqiang / formal order record", source: item.source || "", orderHandoff: buyerSafeOrderHandoff(item.orderHandoff) })) : [],
          orderChangeRequests: Array.isArray(record.orderChangeRequests) ? record.orderChangeRequests.map((item) => ({ id: item.id, status: item.status, reason: item.reason, changedFields: item.changedFields, baseVersion: item.baseVersion, proposedHandoff: buyerSafeOrderHandoff(item.proposedHandoff), createdAt: item.createdAt, buyerDecision: item.buyerDecision || "", buyerNote: item.buyerNote || "", buyerRespondedAt: item.buyerRespondedAt || "" })) : [],
          buyerUpdate: record.buyerUpdate || "We are reviewing the submitted sourcing requirements. Contact us with the reference if you need to add information.",
          updatedAt: record.updatedAt || record.receivedAt,
        },
      });
    } catch (error) {
      console.error("Buyer inquiry status read failed", error);
      return response(503, { ok: false, message: "Request status is temporarily unavailable. Please contact us by email or WhatsApp." });
    }
  };
}

export const onRequestGet = createInquiryStatusHandler();
