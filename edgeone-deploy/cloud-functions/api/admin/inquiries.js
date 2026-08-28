import { randomBytes, timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";
import nodemailer from "nodemailer";

function response(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function authorized(request, env) {
  const expected = typeof env?.INQUIRY_ADMIN_TOKEN === "string" ? env.INQUIRY_ADMIN_TOKEN.trim() : "";
  const header = request.headers.get("authorization") || "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!expected || !supplied) return false;
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

function isInternalTest(record) {
  const text = `${record?.name || ""} ${record?.company || ""} ${record?.requirements || ""} ${record?.quantity || ""}`.toLowerCase();
  return /internal|deployment test|smtp test|test only|\b0\s*pairs?\b/.test(text);
}

const PIPELINE_STATUSES = new Set(["new", "qualified", "sample_discussion", "quoted", "negotiation", "order_confirmed", "lost", "spam"]);
const QUOTE_CURRENCIES = new Set(["USD", "EUR"]);
const TRADE_TERMS = new Set(["FOB", "EXW", "FCA", "DDP"]);
const FULFILLMENT_STATUSES = new Set(["order_documents", "awaiting_payment", "payment_confirmed", "sampling", "production", "quality_check", "ready_to_ship", "shipped", "completed", "on_hold"]);
const LOST_REASONS = new Set(["price", "moq", "lead_time", "product_fit", "trust", "no_response", "project_cancelled", "competitor", "compliance", "other", "legacy_unspecified"]);
const PAYMENT_STATUSES = new Set(["planned", "due", "paid", "waived"]);
const SAMPLE_STATUSES = new Set(["brief_requested", "terms_confirmed", "awaiting_sample_payment", "preparing", "shipped", "delivered", "buyer_review", "buyer_approved", "revision_requested", "closed"]);
const SAMPLE_CHARGE_STATUSES = new Set(["planned", "due", "paid", "waived"]);
const ORDER_CHECKLIST_FIELDS = ["productSpecification", "sampleDecision", "quantitySizeRatio", "colorsMaterials", "packingLabeling", "priceTradeTerm", "paymentTerms", "deliveryWindow"];

function clean(value, max) {
  return typeof value === "string" ? value.trim().replace(/\0/g, "").slice(0, max) : "";
}

function dateAfter(isoValue, days) { const value = new Date(isoValue); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10); }

function adminSafeRecord(record) {
  const safe = { ...record };
  delete safe.accessTokenHash; delete safe.pendingUploads; delete safe.pendingAttachments; delete safe.pendingOrderDocuments;
  safe.attachments = Array.isArray(record.attachments) ? record.attachments.map((file) => { const copy = { ...file }; delete copy.key; return copy; }) : [];
  safe.orderDocuments = Array.isArray(record.orderDocuments) ? record.orderDocuments.map((document) => { const copy = { ...document }; delete copy.key; return copy; }) : [];
  return { ...safe, internalTest: isInternalTest(record) };
}

function sanitizeQuotation(value, reference) {
  if (!value || typeof value !== "object") return null;
  const version = clean(value.version, 20);
  const lines = Array.isArray(value.lines) ? value.lines.slice(0, 20).map((line) => ({
    code: clean(line?.code, 40), description: clean(line?.description, 300), quantity: clean(line?.quantity, 80), unitPrice: clean(line?.unitPrice, 40),
  })).filter((line) => line.code && line.quantity && /^\d+(?:\.\d{1,4})?$/.test(line.unitPrice) && Number(line.unitPrice) <= 1_000_000) : [];
  if (!version || !lines.length) return { error: "Complete the quotation version, quantity and unit price." };
  return { quotation: {
    quoteNumber: `${reference}-Q${version}`, version,
    currency: QUOTE_CURRENCIES.has(value.currency) ? value.currency : "USD",
    tradeTerm: TRADE_TERMS.has(value.tradeTerm) ? value.tradeTerm : "FOB",
    validUntil: clean(value.validUntil, 40), leadTime: clean(value.leadTime, 300), paymentTerms: clean(value.paymentTerms, 300),
    packing: clean(value.packing, 500), sampleTerms: clean(value.sampleTerms, 500), notes: clean(value.notes, 1200), lines, createdAt: new Date().toISOString(), status: "draft", issuedAt: "", buyerDecision: "", buyerNote: "", buyerRespondedAt: "",
  } };
}

function sanitizeOrderHandoff(value) {
  if (!value || typeof value !== "object") return null;
  const method = value.method === "alibaba_trade_assurance" ? value.method : value.method === "contract" ? value.method : "";
  const orderReference = clean(value.orderReference, 120);
  const orderUrl = clean(value.orderUrl, 600);
  if (!method || !orderReference) return { error: "Choose the order method and enter its order or contract reference." };
  if (method === "alibaba_trade_assurance") {
    try {
      const url = new URL(orderUrl);
      if (url.protocol !== "https:" || !(url.hostname === "alibaba.com" || url.hostname.endsWith(".alibaba.com"))) throw new Error("invalid");
    } catch { return { error: "Use the exact HTTPS Alibaba.com Trade Assurance order link." }; }
  }
  if (method === "contract" && orderUrl) return { error: "Do not publish a private contract file URL. Use the contract reference only." };
  const paymentCurrency = QUOTE_CURRENCIES.has(value.paymentCurrency) ? value.paymentCurrency : "USD";
  const paymentMilestones = Array.isArray(value.paymentMilestones) ? value.paymentMilestones.slice(0, 6).map((item, index) => ({ id: clean(item?.id, 40) || `PM-${index + 1}`, label: clean(item?.label, 120), amount: clean(item?.amount, 40), dueDate: clean(item?.dueDate, 40), status: PAYMENT_STATUSES.has(item?.status) ? item.status : "planned", paidAt: clean(item?.paidAt, 40), reference: clean(item?.reference, 120), note: clean(item?.note, 300) })).filter((item) => item.label || item.amount || item.dueDate || item.reference || item.note) : [];
  if (paymentMilestones.some((item) => !item.label || !/^\d+(?:\.\d{1,2})?$/.test(item.amount) || Number(item.amount) > 1_000_000 || (item.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(item.dueDate)) || (item.paidAt && !/^\d{4}-\d{2}-\d{2}$/.test(item.paidAt)) || (item.status === "paid" && !item.paidAt))) return { error: "Complete each payment label and amount; paid milestones also require the actual paid date." };
  const orderChecklist = Object.fromEntries(ORDER_CHECKLIST_FIELDS.map((field) => [field, clean(value.orderChecklist?.[field], 500)]));
  return { orderHandoff: { method, orderReference, orderUrl: method === "alibaba_trade_assurance" ? orderUrl : "", confirmedAt: clean(value.confirmedAt, 40), note: clean(value.note, 600), fulfillmentStatus: FULFILLMENT_STATUSES.has(value.fulfillmentStatus) ? value.fulfillmentStatus : "order_documents", carrier: clean(value.carrier, 100), trackingNumber: clean(value.trackingNumber, 160), paymentCurrency, paymentMilestones, orderChecklist, updatedAt: new Date().toISOString() } };
}

function orderHandoffReady(value) {
  return Boolean(value?.method && value?.orderReference && value?.confirmedAt && ORDER_CHECKLIST_FIELDS.every((field) => clean(value?.orderChecklist?.[field], 500).length >= 2));
}

function matchesAcceptedConfirmationDraft(record, handoff) {
  const packet = Array.isArray(record.orderPreparationPackets) ? record.orderPreparationPackets.at(-1) : null;
  if (!record.buyerOrderRequests?.length || packet?.status !== "reviewed") return true;
  const draft = Array.isArray(record.orderConfirmationDrafts) ? record.orderConfirmationDrafts.at(-1) : null;
  if (!draft || draft.status !== "buyer_accepted") return false;
  return ORDER_CHECKLIST_FIELDS.every((field) => clean(draft.orderChecklist?.[field], 500) === clean(handoff?.orderChecklist?.[field], 500));
}

function orderCriticalSnapshot(value) {
  return { method: value?.method || "", orderReference: value?.orderReference || "", orderUrl: value?.orderUrl || "", confirmedAt: value?.confirmedAt || "", paymentCurrency: value?.paymentCurrency || "USD", orderChecklist: Object.fromEntries(ORDER_CHECKLIST_FIELDS.map((field) => [field, value?.orderChecklist?.[field] || ""])), paymentPlan: (value?.paymentMilestones || []).map((item) => ({ id: item.id, label: item.label, amount: item.amount, dueDate: item.dueDate })) };
}

function changedOrderFields(current, proposed) {
  const left = orderCriticalSnapshot(current); const right = orderCriticalSnapshot(proposed); const fields = [];
  for (const field of ["method", "orderReference", "orderUrl", "confirmedAt", "paymentCurrency"]) if (JSON.stringify(left[field]) !== JSON.stringify(right[field])) fields.push(field);
  for (const field of ORDER_CHECKLIST_FIELDS) if (left.orderChecklist[field] !== right.orderChecklist[field]) fields.push(field);
  if (JSON.stringify(left.paymentPlan) !== JSON.stringify(right.paymentPlan)) fields.push("paymentPlan");
  return fields;
}

async function notifyOrderChangeBuyer(record, change, env, createTransportImpl) {
  if (!record.email) return { sent: false, status: "no_buyer_email" };
  if (!env?.SMTP_PASS) return { sent: false, status: "smtp_not_configured" };
  const transport = createTransportImpl({ host: env.SMTP_HOST || "smtp.qq.com", port: Number(env.SMTP_PORT || 465), secure: String(env.SMTP_SECURE || "true") !== "false", auth: { user: env.SMTP_USER || "421345308@qq.com", pass: env.SMTP_PASS } });
  try {
    await transport.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER || "421345308@qq.com",
      to: record.email,
      replyTo: env.INQUIRY_NOTIFY_TO || "421345308@qq.com",
      subject: `[Action required] Review confirmed-order change ${change.id}`,
      text: [`Hello ${record.name || "Purchasing Team"},`, "", `Beiqiang has proposed a change to confirmed website order version ${change.baseVersion} for inquiry ${record.reference}.`, `Reason: ${change.reason}`, `Changed fields: ${change.changedFields.join(", ")}`, "", "Your current confirmed website version remains active until you accept this proposal.", "Open the private inquiry-status page and use your existing inquiry reference and access code:", "https://www.beiqiang.online/inquiry-status/", "", "Please compare the proposed quantity, specification, price/trade term, delivery, packing and payment plan with your formal order documents, then accept or reject the proposal.", "", "Website acceptance does not amend an Alibaba Trade Assurance order or signed contract by itself. The same revised terms must be confirmed in the authoritative transaction channel before affected production or payment action.", "", "Quanzhou Beiqiang Footwear & Apparel Co., Ltd.", "421345308@qq.com", "+86 189 5980 5256"].join("\n"),
    });
    return { sent: true, status: "sent" };
  } catch (error) {
    console.error("Order change buyer notification failed", record.reference, change.id, error);
    return { sent: false, status: "delivery_failed" };
  }
}

function sanitizeSampleProgram(value, current, actor) {
  if (!value || typeof value !== "object") return null;
  const status = SAMPLE_STATUSES.has(value.status) ? value.status : "brief_requested";
  if (["buyer_approved", "revision_requested"].includes(status) && current?.status !== status) return { error: "Buyer approval or revision status must come from the private buyer response, not an internal edit." };
  const styleCodes = clean(value.styleCodes, 300); const quantity = clean(value.quantity, 120); const sizes = clean(value.sizes, 240); const colors = clean(value.colors, 240); const sampleReference = clean(value.sampleReference, 160); const purpose = clean(value.purpose, 600); const reviewScope = clean(value.reviewScope, 800); const deliverables = clean(value.deliverables, 1000); const acceptanceCriteria = clean(value.acceptanceCriteria, 1200); const exclusions = clean(value.exclusions, 1200);
  if (!styleCodes || !quantity) return { error: "Enter the exact sample style code(s) and sample quantity." };
  if (status === "buyer_review" && [sampleReference, purpose, reviewScope, deliverables, acceptanceCriteria, exclusions].some((item) => item.length < 2)) return { error: "Before buyer review, complete the sample reference, purpose, review scope, deliverables, acceptance criteria and explicit exclusions." };
  if (current?.status === "buyer_review" && status === "buyer_review" && ["sampleReference", "styleCodes", "quantity", "sizes", "colors", "purpose", "reviewScope", "deliverables", "acceptanceCriteria", "exclusions"].some((field) => clean(current?.[field], field === "sampleReference" ? 160 : 1200) !== clean(value?.[field], field === "sampleReference" ? 160 : 1200))) return { error: "The active buyer-review scope is frozen. Record the buyer decision or move to a new preparation cycle before changing it." };
  const sampleCharge = clean(value.sampleCharge, 40); const chargeStatus = SAMPLE_CHARGE_STATUSES.has(value.chargeStatus) ? value.chargeStatus : "planned"; const paidAt = clean(value.paidAt, 40);
  if (sampleCharge && (!/^\d+(?:\.\d{1,2})?$/.test(sampleCharge) || Number(sampleCharge) > 100_000)) return { error: "Use a valid sample charge amount with no more than two decimal places." };
  if (chargeStatus === "paid" && !paidAt) return { error: "A recorded paid sample charge requires the actual paid date." };
  for (const date of [paidAt, value.shippedAt, value.expectedDelivery]) if (clean(date, 40) && !/^\d{4}-\d{2}-\d{2}$/.test(clean(date, 40))) return { error: "Use YYYY-MM-DD for sample payment, shipment and expected-delivery dates." };
  const courier = clean(value.courier, 100); const trackingNumber = clean(value.trackingNumber, 160); const shippedAt = clean(value.shippedAt, 40);
  if (["shipped", "delivered", "buyer_review"].includes(status) && (!courier || !trackingNumber || !shippedAt)) return { error: "Shipped and later sample stages require courier, tracking reference and actual shipment date." };
  const changedAt = new Date().toISOString(); const existingHistory = Array.isArray(current?.history) ? current.history : []; const existingReviewRounds = Array.isArray(current?.reviewRounds) ? current.reviewRounds : []; const openingReview = status === "buyer_review" && current?.status !== "buyer_review"; const nextRound = existingReviewRounds.reduce((maximum, item) => Math.max(maximum, Number(item?.round) || 0), 0) + 1;
  const history = current?.status !== status ? [...existingHistory.slice(-48), { from: current?.status || "", to: status, changedAt, actor: clean(actor, 100) || "Sales team" }] : existingHistory;
  const reviewRounds = openingReview ? [...existingReviewRounds.slice(-19), { round: nextRound, sampleReference, styleCodes, quantity, sizes, colors, purpose, reviewScope, deliverables, acceptanceCriteria, exclusions, status: "awaiting_buyer", openedAt: changedAt, decision: "", buyerNote: "", respondedAt: "" }] : existingReviewRounds;
  return { sampleProgram: {
    status, sampleReference, styleCodes, quantity, sizes, colors, purpose, reviewScope, deliverables, acceptanceCriteria, exclusions,
    currency: QUOTE_CURRENCIES.has(value.currency) ? value.currency : "USD", sampleCharge, chargeStatus, paidAt,
    courier, trackingNumber, shippedAt, expectedDelivery: clean(value.expectedDelivery, 40), note: clean(value.note, 800),
    buyerDecision: openingReview ? "" : clean(current?.buyerDecision, 40), buyerNote: openingReview ? "" : clean(current?.buyerNote, 1200), buyerRespondedAt: openingReview ? "" : clean(current?.buyerRespondedAt, 40),
    history, reviewRounds, updatedAt: changedAt,
  } };
}

export function createAdminInquiriesHandler({ getStoreImpl = getStore } = {}) {
  return async function onRequestGet(context) {
    if (!context.env?.INQUIRY_ADMIN_TOKEN) return response(503, { ok: false, message: "Inquiry dashboard access has not been configured." });
    if (!authorized(context.request, context.env)) return response(401, { ok: false, message: "Invalid access token." });

    try {
      const store = getStoreImpl("beiqiang-inquiries");
      const { blobs } = await store.list({ prefix: "inquiries/", limit: 500, consistency: "strong" });
      const records = (await Promise.all(blobs.map(({ key }) => store.get(key, { type: "json", consistency: "strong" })))).filter(Boolean);
      records.sort((a, b) => String(b.receivedAt || "").localeCompare(String(a.receivedAt || "")));
      return response(200, {
        ok: true,
        records: records.map(adminSafeRecord),
        total: records.length,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Inquiry dashboard read failed", error);
      return response(503, { ok: false, message: "Inquiry records could not be loaded." });
    }
  };
}

export function createAdminInquiryUpdateHandler({ getStoreImpl = getStore, createTransportImpl = nodemailer.createTransport } = {}) {
  return async function onRequestPatch(context) {
    if (!context.env?.INQUIRY_ADMIN_TOKEN) return response(503, { ok: false, message: "Inquiry dashboard access has not been configured." });
    if (!authorized(context.request, context.env)) return response(401, { ok: false, message: "Invalid access token." });
    let payload;
    try { payload = await context.request.json(); } catch { return response(400, { ok: false, message: "Invalid request." }); }
    const reference = clean(payload.reference, 40);
    const receivedAt = clean(payload.receivedAt, 40);
    const date = receivedAt.slice(0, 10);
    if (!/^BQ-[A-Z0-9-]+$/.test(reference) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return response(400, { ok: false, message: "Invalid inquiry reference." });
    const key = `inquiries/${date}/${reference}.json`;
    try {
      const store = getStoreImpl("beiqiang-inquiries");
      const current = await store.get(key, { type: "json", consistency: "strong" });
      if (!current) return response(404, { ok: false, message: "Inquiry record was not found." });
      if (payload.sampleRequestAction) {
        const requestId = clean(payload.sampleRequestAction.id, 40).toUpperCase();
        const action = clean(payload.sampleRequestAction.action, 20);
        const reason = clean(payload.sampleRequestAction.reason, 500);
        if (!/^BSR-[A-F0-9]{12}$/.test(requestId) || action !== "reject" || reason.length < 5) return response(400, { ok: false, message: "Choose a pending sample request and record a buyer-safe rejection reason." });
        const requests = Array.isArray(current.sampleRequests) ? current.sampleRequests : [];
        const target = requests.find((item) => item.id === requestId);
        if (!target) return response(404, { ok: false, message: "Sample request was not found." });
        if (target.status !== "pending") return response(409, { ok: false, message: "That sample request has already been reviewed." });
        const changedAt = new Date().toISOString();
        const reviewedBy = clean(payload.owner, 100) || current.owner || "Sales team";
        const updated = { ...current, sampleRequests: requests.map((item) => item.id === requestId ? { ...item, status: "rejected", reviewedAt: changedAt, reviewedBy, reviewNote: reason, sampleReference: "" } : item), updatedAt: changedAt };
        await store.setJSON(key, updated, { cacheControl: null });
        return response(200, { ok: true, record: adminSafeRecord(updated) });
      }
      if (!PIPELINE_STATUSES.has(payload.status)) return response(400, { ok: false, message: "Invalid pipeline status." });
      const quotationResult = payload.quotation ? sanitizeQuotation(payload.quotation, reference) : null;
      if (quotationResult?.error) return response(400, { ok: false, message: quotationResult.error });
      const orderResult = payload.orderHandoff ? sanitizeOrderHandoff(payload.orderHandoff) : null;
      if (orderResult?.error) return response(400, { ok: false, message: orderResult.error });
      const sampleResult = payload.sampleProgram ? sanitizeSampleProgram(payload.sampleProgram, current.sampleProgram, payload.owner || current.owner) : null;
      if (sampleResult?.error) return response(400, { ok: false, message: sampleResult.error });
      const sampleRequestId = clean(payload.sampleRequestId, 40).toUpperCase();
      const sampleRequests = Array.isArray(current.sampleRequests) ? current.sampleRequests : [];
      const sampleRequest = sampleRequestId ? sampleRequests.find((item) => item.id === sampleRequestId) : null;
      if (sampleRequestId && (!sampleRequest || sampleRequest.status !== "pending")) return response(409, { ok: false, message: "The linked sample request is missing or has already been reviewed." });
      if (sampleRequestId && !sampleResult?.sampleProgram) return response(400, { ok: false, message: "A sample request can be converted only with a reviewed sample project." });
      const effectiveOrderHandoff = orderResult?.orderHandoff || current.orderHandoff;
      if (current.status !== "order_confirmed" && payload.status === "order_confirmed" && !orderHandoffReady(effectiveOrderHandoff)) return response(409, { ok: false, message: "Complete the Trade Assurance/contract reference, confirmed date and all eight written order-readiness items before confirming the order stage." });
      if (current.status !== "order_confirmed" && payload.status === "order_confirmed" && !matchesAcceptedConfirmationDraft(current, effectiveOrderHandoff)) return response(409, { ok: false, message: "Issue a pre-order confirmation draft, obtain the buyer's acceptance, and keep all eight formal-order checklist items identical to that accepted draft before confirming the order stage." });
      const requestedLostReason = clean(payload.lostReason, 50);
      if (payload.status === "lost" && current.status !== "lost" && !LOST_REASONS.has(requestedLostReason)) return response(400, { ok: false, message: "Choose the primary lost reason before closing this opportunity." });
      const quotations = Array.isArray(current.quotations) ? current.quotations : [];
      if (quotationResult?.quotation && quotations.some((quote) => quote.quoteNumber === quotationResult.quotation.quoteNumber)) return response(409, { ok: false, message: "That quotation version already exists. Use a new version number." });
      const changedAt = new Date().toISOString();
      const criticalChanges = current.status === "order_confirmed" && orderResult?.orderHandoff && current.orderHandoff ? changedOrderFields(current.orderHandoff, orderResult.orderHandoff) : [];
      if (criticalChanges.length) {
        const reason = clean(payload.orderChangeReason, 800); if (reason.length < 2) return response(409, { ok: false, message: "Explain why the confirmed order terms should change before creating a buyer approval request." });
        const requests = Array.isArray(current.orderChangeRequests) ? current.orderChangeRequests : []; if (requests.some((item) => item.status === "awaiting_buyer")) return response(409, { ok: false, message: "A confirmed-order change is already awaiting buyer response. Resolve it before proposing another." });
        const versions = Array.isArray(current.orderVersions) && current.orderVersions.length ? current.orderVersions : [{ version: 1, orderHandoff: current.orderHandoff, acceptedAt: current.orderHandoff.confirmedAt || current.updatedAt || current.receivedAt, acceptedBy: "Legacy / initial confirmation", source: "baseline" }];
        const changeRequest = { id: `OCR-${randomBytes(6).toString("hex").toUpperCase()}`, status: "awaiting_buyer", reason, changedFields: criticalChanges, baseVersion: versions.at(-1).version, proposedHandoff: orderResult.orderHandoff, createdAt: changedAt, createdBy: clean(payload.owner, 100) || current.owner || "Sales team", buyerDecision: "", buyerNote: "", buyerRespondedAt: "", notificationSent: false, notificationStatus: "pending", notificationAttemptedAt: "" };
        const proposed = { ...current, orderVersions: versions, orderChangeRequests: [...requests.slice(-19), changeRequest], nextAction: `Wait for buyer response to confirmed-order change ${changeRequest.id}; do not apply proposed terms before acceptance.`, nextActionDue: dateAfter(changedAt, 2), updatedAt: changedAt };
        await store.setJSON(key, proposed, { cacheControl: null });
        const notification = await notifyOrderChangeBuyer(current, changeRequest, context.env || {}, createTransportImpl); const notificationAttemptedAt = new Date().toISOString();
        const reread = await store.get(key, { type: "json", consistency: "strong" }); const latest = Array.isArray(reread?.orderChangeRequests) && reread.orderChangeRequests.some((item) => item.id === changeRequest.id) ? reread : proposed;
        const notified = { ...latest, orderChangeRequests: latest.orderChangeRequests.map((item) => item.id === changeRequest.id ? { ...item, notificationSent: notification.sent, notificationStatus: notification.status, notificationAttemptedAt } : item), updatedAt: latest.updatedAt || notificationAttemptedAt };
        await store.setJSON(key, notified, { cacheControl: null }); return response(202, { ok: true, orderChangeProposed: true, buyerNotificationSent: notification.sent, buyerNotificationStatus: notification.status, record: adminSafeRecord(notified) });
      }
      const existingHistory = Array.isArray(current.pipelineHistory) ? current.pipelineHistory : [{ from: "", to: current.status || "new", changedAt: current.receivedAt || changedAt, actor: "system", reason: "Legacy record" }];
      const lostReason = payload.status === "lost" ? (LOST_REASONS.has(requestedLostReason) ? requestedLostReason : current.lostReason || "legacy_unspecified") : "";
      const pipelineHistory = payload.status !== current.status ? [...existingHistory.slice(-98), { from: current.status || "new", to: payload.status, changedAt, actor: clean(payload.owner, 100) || current.owner || "Sales team", reason: payload.status === "lost" ? lostReason : "" }] : existingHistory;
      let orderVersions = Array.isArray(current.orderVersions) ? current.orderVersions : []; if (current.status !== "order_confirmed" && payload.status === "order_confirmed" && effectiveOrderHandoff) orderVersions = [...orderVersions.slice(-19), { version: (orderVersions.at(-1)?.version || 0) + 1, orderHandoff: effectiveOrderHandoff, acceptedAt: changedAt, acceptedBy: clean(payload.owner, 100) || current.owner || "Sales team", source: "initial_confirmation" }];
      const operationalChanges = current.status === "order_confirmed" && orderResult?.orderHandoff && current.orderHandoff ? ["note", "fulfillmentStatus", "carrier", "trackingNumber", "paymentMilestones"].filter((field) => JSON.stringify(current.orderHandoff?.[field]) !== JSON.stringify(orderResult.orderHandoff?.[field])) : [];
      const operationalHistory = operationalChanges.length ? [...(Array.isArray(current.orderOperationalHistory) ? current.orderOperationalHistory.slice(-98) : []), { changedAt, changedBy: clean(payload.owner, 100) || current.owner || "Sales team", fields: operationalChanges, fulfillmentStatus: orderResult.orderHandoff.fulfillmentStatus, carrier: orderResult.orderHandoff.carrier, trackingNumber: orderResult.orderHandoff.trackingNumber, note: orderResult.orderHandoff.note }] : (Array.isArray(current.orderOperationalHistory) ? current.orderOperationalHistory : []);
      const updated = {
        ...current,
        status: payload.status,
        pipelineHistory,
        lostReason,
        owner: clean(payload.owner, 100),
        nextAction: clean(payload.nextAction, 500),
        nextActionDue: clean(payload.nextActionDue, 40),
        internalNote: clean(payload.internalNote, 1500),
        buyerUpdate: clean(payload.buyerUpdate, 1000),
        lastContactedAt: clean(payload.lastContactedAt, 40),
        quotations: quotationResult?.quotation ? [...quotations.slice(-19), quotationResult.quotation] : quotations,
        sampleProgram: sampleResult?.sampleProgram || current.sampleProgram || null,
        sampleRequests: sampleRequestId ? sampleRequests.map((item) => item.id === sampleRequestId ? { ...item, status: "converted", reviewedAt: changedAt, reviewedBy: clean(payload.owner, 100) || current.owner || "Sales team", reviewNote: "Converted into a reviewed sample project.", sampleReference: sampleResult?.sampleProgram?.sampleReference || "" } : item) : sampleRequests,
        orderHandoff: orderResult?.orderHandoff || current.orderHandoff || null,
        orderVersions,
        orderOperationalHistory: operationalHistory,
        orderChangeRequests: Array.isArray(current.orderChangeRequests) ? current.orderChangeRequests : [],
        updatedAt: changedAt,
      };
      await store.setJSON(key, updated, { cacheControl: null });
      return response(200, { ok: true, record: adminSafeRecord(updated) });
    } catch (error) {
      console.error("Inquiry dashboard update failed", error);
      return response(503, { ok: false, message: "Inquiry record could not be updated." });
    }
  };
}

export const onRequestGet = createAdminInquiriesHandler();
export const onRequestPatch = createAdminInquiryUpdateHandler();
