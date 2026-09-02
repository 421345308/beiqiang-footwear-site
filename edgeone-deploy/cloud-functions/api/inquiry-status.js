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

function buyerSafeQuotation(value) {
  if (!value) return null;
  const revision = value.revisionBrief;
  return { quoteNumber: value.quoteNumber, version: value.version, currency: value.currency, tradeTerm: value.tradeTerm, validUntil: value.validUntil, leadTime: value.leadTime, paymentTerms: value.paymentTerms, packing: value.packing, sampleTerms: value.sampleTerms, notes: value.notes, lines: Array.isArray(value.lines) ? value.lines.map((line) => ({ code: line.code, description: line.description, quantity: line.quantity, unitPrice: line.unitPrice })) : [], status: value.status, issuedAt: value.issuedAt || "", buyerDecision: value.buyerDecision || "", buyerNote: value.buyerNote || "", buyerRespondedAt: value.buyerRespondedAt || "", revisionBrief: revision ? { reasons: Array.isArray(revision.reasons) ? revision.reasons : [], affectedCodes: Array.isArray(revision.affectedCodes) ? revision.affectedCodes : [], targetQuantity: revision.targetQuantity || "", targetUnitPrice: revision.targetUnitPrice || "", targetTradeTerm: revision.targetTradeTerm || "", requestedDelivery: revision.requestedDelivery || "", requestedPayment: revision.requestedPayment || "", requestedPacking: revision.requestedPacking || "", requestedSample: revision.requestedSample || "" } : null };
}

function buyerSafeOrderConfirmationDraft(value) {
  if (!value) return null;
  return {
    id: value.id, version: value.version, orderRequestId: value.orderRequestId,
    packetId: value.packetId, packetVersion: value.packetVersion,
    quoteNumber: value.quoteNumber, orderChannel: value.orderChannel,
    orderChecklist: {
      productSpecification: value.orderChecklist?.productSpecification || "",
      sampleDecision: value.orderChecklist?.sampleDecision || "",
      quantitySizeRatio: value.orderChecklist?.quantitySizeRatio || "",
      colorsMaterials: value.orderChecklist?.colorsMaterials || "",
      packingLabeling: value.orderChecklist?.packingLabeling || "",
      priceTradeTerm: value.orderChecklist?.priceTradeTerm || "",
      paymentTerms: value.orderChecklist?.paymentTerms || "",
      deliveryWindow: value.orderChecklist?.deliveryWindow || "",
    },
    draftNote: value.draftNote || "", status: value.status,
    issuedAt: value.issuedAt || "", buyerDecision: value.buyerDecision || "",
    buyerNote: value.buyerNote || "",
    buyerRevisionFields: Array.isArray(value.buyerRevisionFields) ? value.buyerRevisionFields : [],
    buyerRespondedAt: value.buyerRespondedAt || "",
  };
}

function buyerSafeSourcingReview(record, buyerRecommendation) {
  const brief = record?.finderBrief;
  if (brief?.mode !== "human_review") return null;
  const buyerChannels = new Set(["importer_wholesaler", "online_seller", "brand_private_label", "sourcing_agent"]);
  const priorities = new Set(["open", "wide_toe", "easy_on", "breathable_lace_up", "mens", "kids", "cold_weather"]);
  const closures = new Set(["any", "Slip-On", "Lace-Up"]);
  const startingStyles = Array.isArray(brief.styleCodes)
    ? [...new Set(brief.styleCodes.map((code) => String(code).trim().toUpperCase()).filter((code) => /^BQ\d{3}$/.test(code)))].slice(0, 4)
    : [];
  const hasVisibleShortlist = buyerRecommendation && ["issued", "buyer_shortlisted", "revision_requested"].includes(buyerRecommendation.status);
  return {
    status: hasVisibleShortlist ? "shortlist_available" : "awaiting_shortlist",
    submittedAt: record.receivedAt,
    buyerChannel: buyerChannels.has(brief.buyerChannel) ? brief.buyerChannel : "not_recorded",
    priority: priorities.has(brief.priority) ? brief.priority : "not_recorded",
    closure: closures.has(brief.closure) ? brief.closure : "not_recorded",
    startingStyles,
  };
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
      const quotationHistory = Array.isArray(record.quotations) ? record.quotations.filter((quote) => ["issued", "buyer_accepted", "buyer_revision_requested", "buyer_declined", "superseded"].includes(quote.status) && quote.issuedAt).map(buyerSafeQuotation) : [];
      const buyerOrderRequest = Array.isArray(record.buyerOrderRequests) ? record.buyerOrderRequests.at(-1) : null;
      const orderPreparationPackets = Array.isArray(record.orderPreparationPackets) ? record.orderPreparationPackets.map((item) => ({ id: item.id, version: item.version, orderRequestId: item.orderRequestId, quoteNumber: item.quoteNumber, billingCompany: item.billingCompany, registeredCountry: item.registeredCountry, billingAddress: item.billingAddress, invoiceEmail: item.invoiceEmail, shippingConsignee: item.shippingConsignee, shippingCountry: item.shippingCountry, shippingAddress: item.shippingAddress, shippingContact: item.shippingContact, importerRole: item.importerRole, shippingMode: item.shippingMode, requiredDocuments: item.requiredDocuments || [], purchaseOrderReference: item.purchaseOrderReference || "", attachmentIds: item.attachmentIds || [], notes: item.notes || "", status: item.status, submittedAt: item.submittedAt, reviewedAt: item.reviewedAt || "", reviewNote: item.reviewNote || "" })) : [];
      const buyerRecommendation = Array.isArray(record.recommendationSets) ? [...record.recommendationSets].reverse().find((item) => item.status !== "superseded") : null;
      return response(200, {
        ok: true,
        request: {
          reference: record.reference, receivedAt: record.receivedAt, status: publicStatus,
          styleCode: record.styleCode, styleLabel: record.styleLabel, projectPath: record.projectPath,
          quantity: record.bulkQuantity || record.quantity, sampleQuantity: record.sampleQuantity || "",
          preferredTradeTerm: record.preferredTradeTerm || "not_sure", deliveryDestination: record.deliveryDestination || "", deliveryTiming: record.deliveryTiming || "",
          adaptationBrief: record.adaptationBrief ? { intent: record.adaptationBrief.intent || "not_sure", artworkStatus: record.adaptationBrief.artworkStatus || "not_applicable", brandingPlacement: record.adaptationBrief.brandingPlacement || "", colorDirection: record.adaptationBrief.colorDirection || "", packingLabeling: record.adaptationBrief.packingLabeling || "" } : null,
          sourcingReview: buyerSafeSourcingReview(record, buyerRecommendation),
          items: Array.isArray(record.items) ? record.items.map((item) => ({ code: item.code, name: item.name, quantity: item.quantity, colors: item.colors, sizes: item.sizes, notes: item.notes })) : [],
          attachments: Array.isArray(record.attachments) ? record.attachments.filter((file) => !file.revokedAt).map((file) => ({ id: file.id, name: file.name, size: file.size, uploadedAt: file.uploadedAt, securityStatus: file.securityStatus === "reviewed_safe" ? "reviewed" : "under_review" })) : [],
          messages: Array.isArray(record.messages) ? record.messages.slice(-100).map((message) => ({ id: message.id, sender: message.sender === "sales" ? "sales" : "buyer", body: message.body, sentAt: message.sentAt })) : [],
          workspaceAccessRequests: Array.isArray(record.workspaceAccessRequests) ? record.workspaceAccessRequests.map((item) => ({ id: item.id, name: item.name, email: item.email, role: item.role, purpose: item.purpose, status: item.status, requestedAt: item.requestedAt, reviewedAt: item.reviewedAt || "", reviewNote: item.status === "rejected" ? item.reviewNote || "" : "" })) : [],
          sampleRequests: Array.isArray(record.sampleRequests) ? record.sampleRequests.map((item) => ({ id: item.id, styleCodes: item.styleCodes, sampleType: item.sampleType, quantity: item.quantity, sizes: item.sizes, colors: item.colors, evaluationPurpose: item.evaluationPurpose, customizationTarget: item.customizationTarget, acceptanceFocus: item.acceptanceFocus, targetBulkQuantity: item.targetBulkQuantity, shippingCountry: item.shippingCountry, shippingCity: item.shippingCity, courierAccountAvailable: item.courierAccountAvailable === true, requestedTiming: item.requestedTiming, status: item.status, submittedAt: item.submittedAt, reviewedAt: item.reviewedAt || "", reviewNote: item.status === "rejected" ? item.reviewNote || "" : "", sampleReference: item.sampleReference || "" })) : [],
          meetingRequests: Array.isArray(record.meetingRequests) ? record.meetingRequests.map((item) => ({ id: item.id, meetingType: item.meetingType, preferredChannel: item.preferredChannel, timezone: item.timezone, preferredSlots: Array.isArray(item.preferredSlots) ? item.preferredSlots : [], agenda: item.agenda, attendees: item.attendees || "", language: item.language, status: item.status, submittedAt: item.submittedAt, confirmedSlot: item.confirmedSlot || "", confirmedChannel: item.confirmedChannel || "", durationMinutes: [30, 45, 60, 90].includes(Number(item.durationMinutes)) ? Number(item.durationMinutes) : 30, meetingLink: item.status === "confirmed" ? item.meetingLink || "" : "", reviewNote: ["confirmed", "declined", "cancelled"].includes(item.status) ? item.reviewNote || "" : "", reviewedAt: item.reviewedAt || "", completedAt: item.completedAt || "", outcomeSummary: item.status === "completed" ? item.outcomeSummary || "" : "", changeRequests: Array.isArray(item.changeRequests) ? item.changeRequests.map((change) => ({ id: change.id, action: change.action, reason: change.reason, timezone: change.timezone || "", preferredSlots: Array.isArray(change.preferredSlots) ? change.preferredSlots : [], status: change.status, submittedAt: change.submittedAt, reviewedAt: change.reviewedAt || "", reviewNote: change.reviewNote || "", approvedSlot: change.status === "approved" ? change.approvedSlot || "" : "" })) : [] })) : [],
          orderDocuments: Array.isArray(record.orderDocuments) ? record.orderDocuments.filter((document) => !document.revokedAt).map((document) => ({ id: document.id, name: document.name, title: document.title, category: document.category, note: document.note, contentType: document.contentType, size: document.size, uploadedAt: document.uploadedAt })) : [],
          sampleProgram: record.sampleProgram ? { status: record.sampleProgram.status, sampleReference: record.sampleProgram.sampleReference || "", styleCodes: record.sampleProgram.styleCodes, quantity: record.sampleProgram.quantity, sizes: record.sampleProgram.sizes, colors: record.sampleProgram.colors, purpose: record.sampleProgram.purpose, reviewScope: record.sampleProgram.reviewScope, deliverables: record.sampleProgram.deliverables || "", acceptanceCriteria: record.sampleProgram.acceptanceCriteria || "", exclusions: record.sampleProgram.exclusions || "", reviewRounds: Array.isArray(record.sampleProgram.reviewRounds) ? record.sampleProgram.reviewRounds.map((item) => ({ round: item.round, sampleReference: item.sampleReference || "", styleCodes: item.styleCodes || "", purpose: item.purpose || "", reviewScope: item.reviewScope || "", deliverables: item.deliverables || "", acceptanceCriteria: item.acceptanceCriteria || "", exclusions: item.exclusions || "", status: item.status || "", openedAt: item.openedAt || "", decision: item.decision || "", buyerNote: item.buyerNote || "", respondedAt: item.respondedAt || "" })) : [], currency: record.sampleProgram.currency, sampleCharge: record.sampleProgram.sampleCharge, chargeStatus: record.sampleProgram.chargeStatus, paidAt: record.sampleProgram.paidAt, courier: record.sampleProgram.courier, trackingNumber: record.sampleProgram.trackingNumber, shippedAt: record.sampleProgram.shippedAt, expectedDelivery: record.sampleProgram.expectedDelivery, note: record.sampleProgram.note, buyerDecision: record.sampleProgram.buyerDecision || "", buyerNote: record.sampleProgram.buyerNote || "", buyerRespondedAt: record.sampleProgram.buyerRespondedAt || "", updatedAt: record.sampleProgram.updatedAt } : null,
          buyerRecommendation: buyerRecommendation ? { id: buyerRecommendation.id, title: buyerRecommendation.title, introduction: buyerRecommendation.introduction, items: buyerRecommendation.items.map((item) => ({ code: item.code, reason: item.reason })), nextStep: buyerRecommendation.nextStep, status: buyerRecommendation.status, issuedAt: buyerRecommendation.issuedAt, buyerDecision: buyerRecommendation.buyerDecision || "", selectedCodes: Array.isArray(buyerRecommendation.selectedCodes) ? buyerRecommendation.selectedCodes : [], buyerNote: buyerRecommendation.buyerNote || "", buyerRespondedAt: buyerRecommendation.buyerRespondedAt || "" } : null,
          buyerQuotation: buyerSafeQuotation(buyerQuote), quotationHistory,
          buyerOrderRequest: buyerOrderRequest ? { id: buyerOrderRequest.id, quoteNumber: buyerOrderRequest.quoteNumber, preferredOrderChannel: buyerOrderRequest.preferredOrderChannel, legalCompanyName: buyerOrderRequest.legalCompanyName, purchasingContact: buyerOrderRequest.purchasingContact, purchaseOrderReference: buyerOrderRequest.purchaseOrderReference || "", destination: buyerOrderRequest.destination, requestedWindow: buyerOrderRequest.requestedWindow, instructions: buyerOrderRequest.instructions || "", status: buyerOrderRequest.status || "submitted", submittedAt: buyerOrderRequest.submittedAt } : null,
          orderPreparationPackets,
          orderConfirmationDrafts: Array.isArray(record.orderConfirmationDrafts) ? record.orderConfirmationDrafts.map(buyerSafeOrderConfirmationDraft) : [],
          orderHandoff: buyerSafeOrderHandoff(record.orderHandoff),
          orderVersions: Array.isArray(record.orderVersions) ? record.orderVersions.map((item) => ({ version: item.version, acceptedAt: item.acceptedAt || "", acceptedBy: item.acceptedBy === "Buyer" ? "Buyer" : "Beiqiang / formal order record", source: item.source || "", orderHandoff: buyerSafeOrderHandoff(item.orderHandoff) })) : [],
          orderChangeRequests: Array.isArray(record.orderChangeRequests) ? record.orderChangeRequests.map((item) => ({ id: item.id, status: item.status, reason: item.reason, changedFields: item.changedFields, baseVersion: item.baseVersion, proposedHandoff: buyerSafeOrderHandoff(item.proposedHandoff), createdAt: item.createdAt, buyerDecision: item.buyerDecision || "", buyerNote: item.buyerNote || "", buyerRespondedAt: item.buyerRespondedAt || "" })) : [],
          fulfillmentCases: Array.isArray(record.fulfillmentCases) ? record.fulfillmentCases.map((item) => ({ id: item.id, source: item.source, status: item.status, category: item.category, title: item.title, facts: item.facts, affectedScope: item.affectedScope, impact: item.impact, proposedResolution: item.proposedResolution, responseDue: item.responseDue, createdAt: item.createdAt, buyerDecision: item.buyerDecision || "", buyerNote: item.buyerNote || "", buyerRespondedAt: item.buyerRespondedAt || "", resolvedAt: item.resolvedAt || "", resolutionNote: item.resolutionNote || "" })) : [],
          deliveryFeedback: Array.isArray(record.deliveryFeedback) ? record.deliveryFeedback.map((item) => ({ id: item.id, action: item.action, category: item.category || "", note: item.note || "", trackingReference: item.trackingReference || "", createdAt: item.createdAt })) : [],
          repeatOrderOpportunities: Array.isArray(record.repeatOrderOpportunities) ? record.repeatOrderOpportunities.map((item) => ({ id: item.id, status: item.status, intent: item.intent, styleCodes: item.styleCodes || [], indicativeQuantity: item.indicativeQuantity, purchaseWindow: item.purchaseWindow, requestedTiming: item.requestedTiming, destination: item.destination, changes: item.changes || "", requirements: item.requirements || "", sourceOrderReference: item.sourceOrderReference, submittedAt: item.submittedAt, updatedAt: item.updatedAt, owner: item.owner || "Beiqiang sales team", nextAction: item.nextAction || "Beiqiang will review the next step.", nextActionDue: item.nextActionDue || "", linkedInquiryReference: item.linkedInquiryReference || "", linkedOrderReference: item.linkedOrderReference || "", notificationStatus: item.notificationStatus || "", history: Array.isArray(item.history) ? item.history.map((event) => ({ from: event.from, to: event.to, changedAt: event.changedAt, actor: event.actor === "Buyer" ? "Buyer" : "Beiqiang", note: event.note || "" })) : [] })) : [],
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
