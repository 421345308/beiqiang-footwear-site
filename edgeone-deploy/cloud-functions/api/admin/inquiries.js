import { timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";

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

function sanitizeSampleProgram(value, current, actor) {
  if (!value || typeof value !== "object") return null;
  const status = SAMPLE_STATUSES.has(value.status) ? value.status : "brief_requested";
  if (["buyer_approved", "revision_requested"].includes(status) && current?.status !== status) return { error: "Buyer approval or revision status must come from the private buyer response, not an internal edit." };
  const styleCodes = clean(value.styleCodes, 300); const quantity = clean(value.quantity, 120); const sizes = clean(value.sizes, 240); const colors = clean(value.colors, 240);
  if (!styleCodes || !quantity) return { error: "Enter the exact sample style code(s) and sample quantity." };
  const sampleCharge = clean(value.sampleCharge, 40); const chargeStatus = SAMPLE_CHARGE_STATUSES.has(value.chargeStatus) ? value.chargeStatus : "planned"; const paidAt = clean(value.paidAt, 40);
  if (sampleCharge && (!/^\d+(?:\.\d{1,2})?$/.test(sampleCharge) || Number(sampleCharge) > 100_000)) return { error: "Use a valid sample charge amount with no more than two decimal places." };
  if (chargeStatus === "paid" && !paidAt) return { error: "A recorded paid sample charge requires the actual paid date." };
  for (const date of [paidAt, value.shippedAt, value.expectedDelivery]) if (clean(date, 40) && !/^\d{4}-\d{2}-\d{2}$/.test(clean(date, 40))) return { error: "Use YYYY-MM-DD for sample payment, shipment and expected-delivery dates." };
  const courier = clean(value.courier, 100); const trackingNumber = clean(value.trackingNumber, 160); const shippedAt = clean(value.shippedAt, 40);
  if (["shipped", "delivered", "buyer_review"].includes(status) && (!courier || !trackingNumber || !shippedAt)) return { error: "Shipped and later sample stages require courier, tracking reference and actual shipment date." };
  const changedAt = new Date().toISOString(); const existingHistory = Array.isArray(current?.history) ? current.history : [];
  const history = current?.status !== status ? [...existingHistory.slice(-48), { from: current?.status || "", to: status, changedAt, actor: clean(actor, 100) || "Sales team" }] : existingHistory;
  return { sampleProgram: {
    status, styleCodes, quantity, sizes, colors, purpose: clean(value.purpose, 600), reviewScope: clean(value.reviewScope, 800),
    currency: QUOTE_CURRENCIES.has(value.currency) ? value.currency : "USD", sampleCharge, chargeStatus, paidAt,
    courier, trackingNumber, shippedAt, expectedDelivery: clean(value.expectedDelivery, 40), note: clean(value.note, 800),
    buyerDecision: clean(current?.buyerDecision, 40), buyerNote: clean(current?.buyerNote, 1200), buyerRespondedAt: clean(current?.buyerRespondedAt, 40),
    history, updatedAt: changedAt,
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

export function createAdminInquiryUpdateHandler({ getStoreImpl = getStore } = {}) {
  return async function onRequestPatch(context) {
    if (!context.env?.INQUIRY_ADMIN_TOKEN) return response(503, { ok: false, message: "Inquiry dashboard access has not been configured." });
    if (!authorized(context.request, context.env)) return response(401, { ok: false, message: "Invalid access token." });
    let payload;
    try { payload = await context.request.json(); } catch { return response(400, { ok: false, message: "Invalid request." }); }
    const reference = clean(payload.reference, 40);
    const receivedAt = clean(payload.receivedAt, 40);
    const date = receivedAt.slice(0, 10);
    if (!/^BQ-[A-Z0-9-]+$/.test(reference) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return response(400, { ok: false, message: "Invalid inquiry reference." });
    if (!PIPELINE_STATUSES.has(payload.status)) return response(400, { ok: false, message: "Invalid pipeline status." });
    const key = `inquiries/${date}/${reference}.json`;
    try {
      const store = getStoreImpl("beiqiang-inquiries");
      const current = await store.get(key, { type: "json", consistency: "strong" });
      if (!current) return response(404, { ok: false, message: "Inquiry record was not found." });
      const quotationResult = payload.quotation ? sanitizeQuotation(payload.quotation, reference) : null;
      if (quotationResult?.error) return response(400, { ok: false, message: quotationResult.error });
      const orderResult = payload.orderHandoff ? sanitizeOrderHandoff(payload.orderHandoff) : null;
      if (orderResult?.error) return response(400, { ok: false, message: orderResult.error });
      const sampleResult = payload.sampleProgram ? sanitizeSampleProgram(payload.sampleProgram, current.sampleProgram, payload.owner || current.owner) : null;
      if (sampleResult?.error) return response(400, { ok: false, message: sampleResult.error });
      const effectiveOrderHandoff = orderResult?.orderHandoff || current.orderHandoff;
      if (current.status !== "order_confirmed" && payload.status === "order_confirmed" && !orderHandoffReady(effectiveOrderHandoff)) return response(409, { ok: false, message: "Complete the Trade Assurance/contract reference, confirmed date and all eight written order-readiness items before confirming the order stage." });
      const requestedLostReason = clean(payload.lostReason, 50);
      if (payload.status === "lost" && current.status !== "lost" && !LOST_REASONS.has(requestedLostReason)) return response(400, { ok: false, message: "Choose the primary lost reason before closing this opportunity." });
      const quotations = Array.isArray(current.quotations) ? current.quotations : [];
      if (quotationResult?.quotation && quotations.some((quote) => quote.quoteNumber === quotationResult.quotation.quoteNumber)) return response(409, { ok: false, message: "That quotation version already exists. Use a new version number." });
      const changedAt = new Date().toISOString();
      const existingHistory = Array.isArray(current.pipelineHistory) ? current.pipelineHistory : [{ from: "", to: current.status || "new", changedAt: current.receivedAt || changedAt, actor: "system", reason: "Legacy record" }];
      const lostReason = payload.status === "lost" ? (LOST_REASONS.has(requestedLostReason) ? requestedLostReason : current.lostReason || "legacy_unspecified") : "";
      const pipelineHistory = payload.status !== current.status ? [...existingHistory.slice(-98), { from: current.status || "new", to: payload.status, changedAt, actor: clean(payload.owner, 100) || current.owner || "Sales team", reason: payload.status === "lost" ? lostReason : "" }] : existingHistory;
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
        orderHandoff: orderResult?.orderHandoff || current.orderHandoff || null,
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
