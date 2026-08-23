import { createHash, randomBytes } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";
import { workspaceContactCanRead } from "../_lib/workspace-access-policy.js";
import { safeRecordWorkspaceActivity } from "../_lib/workspace-activity.js";

const PUBLIC_STATUS = { new: ["received", "Request received", 1], qualified: ["under_review", "Requirements under review", 2], sample_discussion: ["sample_discussion", "Sample discussion", 3], quoted: ["quotation_stage", "Quotation stage", 4], negotiation: ["commercial_discussion", "Commercial discussion", 5], order_confirmed: ["order_confirmed", "Order confirmed", 6], lost: ["closed", "Request closed", 0], spam: ["closed", "Request closed", 0] };
function response(status, body) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
function hash(value) { return createHash("sha256").update(value).digest("hex"); }
function bearer(request) { const match = /^Bearer\s+([a-f0-9]{64})$/i.exec(request.headers.get("authorization") || ""); return match?.[1] || ""; }
async function listRecords(store, max = 5000) { const records = []; let cursor; while (records.length < max) { const result = await store.list({ prefix: "inquiries/", limit: Math.min(500, max - records.length), cursor, consistency: "strong" }); const blobs = Array.isArray(result?.blobs) ? result.blobs : []; records.push(...(await Promise.all(blobs.map(({ key }) => store.get(key, { type: "json", consistency: "strong" })))).filter(Boolean)); if (!result?.cursor || !blobs.length) break; cursor = result.cursor; } return records; }

function publicAction(kind, eyebrow, title, summary, label, anchor, rank) { return { kind, eyebrow, title, summary, label, anchor, rank }; }
function safeText(value, fallback = "", max = 180) { return ["string", "number"].includes(typeof value) && String(value).trim() ? String(value).trim().slice(0, max) : fallback; }
function publicWorkflowStatus(value, fallback = "Not started") {
  const labels = {
    draft: "Draft", issued: "Ready for buyer review", buyer_accepted: "Accepted on website", buyer_revision_requested: "Revision requested", buyer_declined: "Declined",
    setup_requested: "Order setup requested", submitted: "Submitted", documents_in_review: "Documents under review", order_documents: "Order documents", payment_pending: "Payment pending",
    production: "In production", quality_check: "Quality check", ready_to_ship: "Ready to ship", shipped: "Shipped", completed: "Completed",
    buyer_review: "Ready for buyer review", approved: "Approved", revision_requested: "Revision requested", sampling: "Sample in progress", dispatched: "Sample dispatched",
    qualified: "Qualified", shortlist: "Shortlist in progress", quotation: "Quotation in progress", formal_order: "Formal order preparation", converted: "Converted", closed: "Closed",
    buyer_shortlisted: "Buyer shortlist recorded",
  };
  return labels[value] || fallback;
}
function uniqueCodes(values) { return Array.from(new Set(values.filter(Boolean).flatMap((value) => String(value).match(/BQ\d{3}/gi) || []).map((code) => code.toUpperCase()))).slice(0, 20); }
function latestPublicQuote(record) { return Array.isArray(record.quotations) ? [...record.quotations].reverse().find((item) => ["issued", "buyer_accepted", "buyer_revision_requested", "buyer_declined"].includes(item.status)) : null; }

export function workspaceAction(record, statusCode = "received") {
  if (statusCode === "closed") return publicAction("closed", "PROJECT CLOSED", "Contact Beiqiang if the sourcing direction changes", "This project is closed and will not accept new workflow decisions until Beiqiang reviews a reopening request.", "Review contact options", "buyer-contact-actions", 4);
  const orderChange = Array.isArray(record.orderChangeRequests) ? record.orderChangeRequests.find((item) => item.status === "awaiting_buyer") : null;
  if (orderChange) return publicAction("buyer_action", "YOUR DECISION", `Review order change ${orderChange.id}`, "Compare the proposed critical terms with the current accepted website version before responding.", "Review order change", "order-change-review", 0);
  const fulfillmentCase = Array.isArray(record.fulfillmentCases) ? record.fulfillmentCases.find((item) => item.status === "awaiting_buyer") : null;
  if (fulfillmentCase) return publicAction("buyer_action", "YOUR DECISION", `Review fulfillment exception ${fulfillmentCase.id}`, "Review the recorded facts, affected scope, expected impact and proposed resolution.", "Review fulfillment case", "fulfillment-case-review", 0);
  const fulfillmentStatus = record.orderHandoff?.fulfillmentStatus || "";
  const receiptRecorded = Array.isArray(record.deliveryFeedback) && record.deliveryFeedback.some((item) => item.action === "received_as_expected");
  if (["shipped", "completed"].includes(fulfillmentStatus) && !receiptRecorded) return publicAction("buyer_action", "SHIPMENT FOLLOW-UP", "Confirm receipt or report an issue", "Use the shipment reference to record operational receipt or open a structured delivery issue.", "Add delivery feedback", "delivery-feedback", 0);
  const repeat = Array.isArray(record.repeatOrderOpportunities) ? [...record.repeatOrderOpportunities].reverse().find((item) => !["converted", "closed"].includes(item.status)) : null;
  if (repeat) return publicAction("beiqiang_review", "BEIQIANG REVIEW", `Next sourcing project ${repeat.id} is in progress`, "Beiqiang is reviewing the next shortlist, sample, quotation or formal-order preparation step.", "Review next-project status", "repeat-order", 3);
  if (["shipped", "completed"].includes(fulfillmentStatus)) return publicAction("buyer_action", "PLAN THE NEXT ORDER", "Start a replenishment or new collection discussion", "Share the product direction, indicative quantity, purchase window, destination and requested timing.", "Plan next project", "repeat-order", 1);
  if (record.orderHandoff?.orderReference) return publicAction("formal_order", "FORMAL ORDER", "Review the recorded order and fulfillment status", "Compare this website summary with the authoritative Alibaba Trade Assurance order or signed contract.", "Review formal order", "order-handoff", 2);
  if (record.sampleProgram?.status === "buyer_review") return publicAction("buyer_action", "YOUR DECISION", "Review the referenced physical sample", "Check the frozen review scope and record an approval or exact revision request for this sample round.", "Review sample", "sample-review", 0);
  const quote = Array.isArray(record.quotations) ? [...record.quotations].reverse().find((item) => ["issued", "buyer_accepted", "buyer_revision_requested", "buyer_declined"].includes(item.status)) : null;
  const orderRequest = Array.isArray(record.buyerOrderRequests) ? record.buyerOrderRequests.at(-1) : null;
  if (quote?.status === "issued") return publicAction("buyer_action", "YOUR DECISION", `Review quotation ${quote.quoteNumber}`, "Check product lines, quantity, price, trade term, validity, payment, packing and sample terms.", "Review quotation", "buyer-quotation", 0);
  if (quote?.status === "buyer_accepted" && !orderRequest) return publicAction("buyer_action", "ORDER SETUP", "Provide the formal order preparation details", "Supply the legal purchasing entity, preferred order channel, destination and requested timing.", "Prepare formal order", "order-setup-request", 0);
  const recommendation = Array.isArray(record.recommendationSets) ? [...record.recommendationSets].reverse().find((item) => item.status !== "superseded") : null;
  if (recommendation?.status === "issued") return publicAction("buyer_action", "YOUR DECISION", "Review Beiqiang's product shortlist", "Choose the relevant products or describe the exact replacement direction needed for your market.", "Review product shortlist", "buyer-recommendation", 0);
  if (recommendation?.status === "buyer_shortlisted") return publicAction("buyer_action", "COMPLETE YOUR BRIEF", "Add quantity, colors and size ratio for selected styles", "Turn the recorded shortlist into a commercially useful sample or quotation request.", "Complete quote request", "buyer-recommendation", 1);
  if (orderRequest) return publicAction("beiqiang_review", "BEIQIANG REVIEW", "Formal order preparation is in progress", "Your setup request is saved while Beiqiang verifies the written order documents and eight commercial readiness items.", "Review order preparation", "order-setup-request", 3);
  if (quote?.status === "buyer_revision_requested") return publicAction("beiqiang_review", "BEIQIANG REVIEW", "Quotation revision targets are under review", "Beiqiang is checking feasibility before preparing any new quotation version.", "Review quotation status", "buyer-quotation", 3);
  if (quote?.status === "buyer_declined") return publicAction("beiqiang_review", "BEIQIANG REVIEW", "The declined quotation is being reviewed", "Beiqiang will assess whether a relevant alternative exists without treating the declined version as a new order.", "Review quotation status", "buyer-quotation", 3);
  if (recommendation?.status === "revision_requested") return publicAction("beiqiang_review", "BEIQIANG REVIEW", "Replacement product direction is under review", "Beiqiang is reviewing the market, fit, closure, season, quantity and price-position criteria supplied.", "Review shortlist status", "buyer-recommendation", 3);
  return publicAction("beiqiang_review", "BEIQIANG REVIEW", "Your sourcing request is being reviewed", "Beiqiang is checking the submitted products and commercial context before the next buyer-safe update.", "Review project status", "buyer-message-center", 3);
}

export function workspaceSummary(record) {
  const status = PUBLIC_STATUS[record.status] || PUBLIC_STATUS.new;
  const sourceItems = Array.isArray(record.items) ? record.items : [];
  const codes = uniqueCodes([...sourceItems.map((item) => item.code), record.styleCode]);
  const items = sourceItems.slice(0, 20).map((item) => ({ code: uniqueCodes([item.code])[0] || "", name: safeText(item.name, "Product direction", 120), quantity: safeText(item.quantity, "To confirm", 80), colors: safeText(item.colors, "To confirm", 120), sizes: safeText(item.sizes, "To confirm", 120) }));
  if (!items.length && codes.length) items.push({ code: codes[0], name: safeText(record.styleLabel, "Product direction", 120), quantity: safeText(record.bulkQuantity || record.quantity, "To confirm", 80), colors: "To confirm", sizes: "To confirm" });
  const quote = latestPublicQuote(record);
  const repeat = Array.isArray(record.repeatOrderOpportunities) ? [...record.repeatOrderOpportunities].reverse().find((item) => !["converted", "closed"].includes(item.status)) : null;
  const recommendation = Array.isArray(record.recommendationSets) ? [...record.recommendationSets].reverse().find((item) => item.status !== "superseded") : null;
  const sample = record.sampleProgram || null;
  const order = record.orderHandoff || null;
  const action = workspaceAction(record, status[0]);
  return {
    reference: safeText(record.reference, "", 40), receivedAt: safeText(record.receivedAt, "", 40), updatedAt: safeText(record.updatedAt || record.receivedAt, "", 40),
    status: { code: status[0], label: status[1], step: status[2] }, styleCodes: codes, styleLabel: safeText(record.styleLabel, "Sourcing project", 120),
    quantity: safeText(record.bulkQuantity || record.quantity, "To confirm", 80), destination: safeText(record.deliveryDestination, "To confirm", 120),
    deliveryTiming: safeText(record.deliveryTiming, "To confirm", 100), tradeTerm: safeText(record.preferredTradeTerm, "To confirm", 40),
    buyerUpdate: safeText(record.buyerUpdate, "Beiqiang is reviewing this sourcing request.", 500), action, items,
    quotation: quote ? { quoteNumber: safeText(quote.quoteNumber, "Quotation", 80), version: safeText(String(quote.version || ""), "", 20), status: publicWorkflowStatus(quote.status), validUntil: safeText(quote.validUntil, "To confirm", 40), currency: safeText(quote.currency, "", 12), tradeTerm: safeText(quote.tradeTerm, "", 40) } : null,
    sample: sample ? { reference: safeText(sample.sampleReference, "To be assigned", 80), status: publicWorkflowStatus(sample.status, "Sample stage recorded"), styleCodes: uniqueCodes(Array.isArray(sample.styleCodes) ? sample.styleCodes : [sample.styleCodes]), quantity: safeText(sample.quantity, "To confirm", 80), updatedAt: safeText(sample.updatedAt, "", 40) } : null,
    order: order?.orderReference ? { reference: safeText(order.orderReference, "Formal order", 100), method: order.method === "alibaba_trade_assurance" ? "Alibaba Trade Assurance" : order.method === "signed_contract" ? "Signed bilateral contract" : "Formal order record", status: publicWorkflowStatus(order.fulfillmentStatus, "Order documents recorded"), confirmedAt: safeText(order.confirmedAt, "", 40) } : null,
    recommendation: recommendation ? { reference: safeText(recommendation.id, "Product shortlist", 80), status: publicWorkflowStatus(recommendation.status, "Product shortlist recorded"), styleCodes: uniqueCodes([...(Array.isArray(recommendation.selectedCodes) ? recommendation.selectedCodes : []), ...(Array.isArray(recommendation.items) ? recommendation.items.map((item) => item.code) : [])]) } : null,
    activity: { buyerFiles: Array.isArray(record.attachments) ? record.attachments.filter((item) => !item.revokedAt).length : 0, sharedDocuments: Array.isArray(record.orderDocuments) ? record.orderDocuments.filter((item) => !item.revokedAt).length : 0, messages: Array.isArray(record.messages) ? record.messages.length : 0 },
    hasIssuedQuotation: Boolean(quote), hasOrder: Boolean(order), hasOpenRepeatProject: Boolean(repeat),
  };
}

export function createBuyerWorkspaceSessionHandlers({ getStoreImpl = getStore, nowImpl = () => new Date(), randomBytesImpl = randomBytes, recordActivityImpl = safeRecordWorkspaceActivity } = {}) {
  async function onRequestPost(context) {
    let payload; try { payload = await context.request.json(); } catch { return response(400, { ok: false, message: "This workspace link is invalid or expired." }); }
    const token = typeof payload?.token === "string" ? payload.token.trim().toLowerCase() : "";
    if (!/^[a-f0-9]{64}$/.test(token)) return response(400, { ok: false, message: "This workspace link is invalid or expired." });
    try {
      const store = getStoreImpl("beiqiang-buyer-access"); const tokenHash = hash(token); const key = `magic/${tokenHash}.json`;
      const grant = await store.get(key, { type: "json", consistency: "strong" }); const now = nowImpl();
      if (!grant?.email || Date.parse(grant.expiresAt) <= now.getTime()) { if (grant?.emailHash) await recordActivityImpl(store, "workspace_link_redeemed", { emailHash: grant.emailHash, outcome: "expired", analyticsExcluded: grant.analyticsExcluded }, { now }); return response(410, { ok: false, message: "This workspace link is invalid or expired. Request a new one." }); }
      try { await store.setJSON(`consumed/${tokenHash}.json`, { consumedAt: now.toISOString() }, { onlyIfNew: true, cacheControl: null }); } catch { await recordActivityImpl(store, "workspace_link_redeemed", { emailHash: grant.emailHash, outcome: "already_used", analyticsExcluded: grant.analyticsExcluded }, { now }); return response(410, { ok: false, message: "This workspace link has already been used. Request a new one." }); }
      try { await store.delete(key); } catch { /* consumed marker remains authoritative */ }
      const sessionToken = randomBytesImpl(32).toString("hex"); const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString();
      await store.setJSON(`session/${hash(sessionToken)}.json`, { email: grant.email, emailHash: grant.emailHash, createdAt: now.toISOString(), expiresAt, analyticsExcluded: grant.analyticsExcluded === true }, { onlyIfNew: true, cacheControl: null });
      await recordActivityImpl(store, "workspace_link_redeemed", { emailHash: grant.emailHash, outcome: "success", analyticsExcluded: grant.analyticsExcluded }, { now });
      return response(201, { ok: true, sessionToken, expiresAt });
    } catch (error) { console.error("Buyer workspace link redemption failed", error); return response(503, { ok: false, message: "The buyer workspace is temporarily unavailable." }); }
  }
  async function onRequestGet(context) {
    const sessionToken = bearer(context.request); if (!sessionToken) return response(401, { ok: false, message: "Request a new secure workspace link." });
    try {
      const accessStore = getStoreImpl("beiqiang-buyer-access"); const session = await accessStore.get(`session/${hash(sessionToken)}.json`, { type: "json", consistency: "strong" });
      if (!session?.email || Date.parse(session.expiresAt) <= nowImpl().getTime()) return response(401, { ok: false, message: "Your workspace session has expired. Request a new link." });
      const records = (await listRecords(getStoreImpl("beiqiang-inquiries"))).filter((record) => workspaceContactCanRead(record, session.email));
      const projects = records.map(workspaceSummary).sort((a, b) => a.action.rank - b.action.rank || String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
      await recordActivityImpl(accessStore, "workspace_loaded", { emailHash: session.emailHash, outcome: "success", projectCount: projects.length, analyticsExcluded: session.analyticsExcluded }, { now: nowImpl() });
      return response(200, { ok: true, expiresAt: session.expiresAt, projects });
    } catch (error) { console.error("Buyer workspace read failed", error); return response(503, { ok: false, message: "The buyer workspace is temporarily unavailable." }); }
  }
  return { onRequestPost, onRequestGet };
}

const handlers = createBuyerWorkspaceSessionHandlers();
export const onRequestPost = handlers.onRequestPost;
export const onRequestGet = handlers.onRequestGet;
