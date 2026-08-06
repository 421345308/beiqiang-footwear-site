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
        records: records.map((record) => ({ ...record, internalTest: isInternalTest(record) })),
        total: records.length,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Inquiry dashboard read failed", error);
      return response(503, { ok: false, message: "Inquiry records could not be loaded." });
    }
  };
}

export const onRequestGet = createAdminInquiriesHandler();
