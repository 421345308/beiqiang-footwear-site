import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { getStore } from "@edgeone/pages-blob";

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_FILES = 5;
const ALLOWED_TYPES = new Map([
  ["application/pdf", ["pdf"]],
  ["image/jpeg", ["jpg", "jpeg"]],
  ["image/png", ["png"]],
  ["image/webp", ["webp"]],
  ["application/zip", ["zip"]],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ["docx"]],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ["xlsx"]],
  ["application/vnd.openxmlformats-officedocument.presentationml.presentation", ["pptx"]],
]);

function response(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}

function clean(value, max) {
  return typeof value === "string" ? value.trim().replace(/\0/g, "").slice(0, max) : "";
}

function isAllowedOrigin(origin) {
  if (!origin) return true;
  try {
    const { protocol, hostname } = new URL(origin);
    if (protocol !== "https:") return hostname === "localhost" || hostname === "127.0.0.1";
    return hostname === "www.beiqiang.online" || hostname === "beiqiang.online" || /^beiqiang-footwear-[a-z0-9]+\.edgeone\.dev$/.test(hostname);
  } catch { return false; }
}

function referenceDetails(reference) {
  const normalized = clean(reference, 40).toUpperCase();
  const match = /^BQ-(\d{4})(\d{2})(\d{2})-([A-F0-9]{8})$/.exec(normalized);
  return match ? { reference: normalized, date: `${match[1]}-${match[2]}-${match[3]}` } : null;
}

function safeEqual(left, right) {
  const a = Buffer.from(left || ""); const b = Buffer.from(right || "");
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

function safeFile(value) {
  const originalName = clean(value?.name, 180).replace(/[\\/]+/g, "-");
  const contentType = clean(value?.contentType, 160).toLowerCase();
  const size = Number(value?.size);
  const extension = originalName.includes(".") ? originalName.split(".").pop().toLowerCase() : "";
  if (!originalName || !ALLOWED_TYPES.has(contentType) || !ALLOWED_TYPES.get(contentType).includes(extension)) return { error: "Use PDF, JPG, PNG, WEBP, DOCX, XLSX, PPTX or ZIP files." };
  if (!Number.isSafeInteger(size) || size < 1 || size > MAX_FILE_BYTES) return { error: "Each file must be between 1 byte and 15 MB." };
  const storageName = originalName.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(-120) || `buyer-file.${extension}`;
  return { file: { originalName, storageName, contentType, size } };
}

async function authorize(payload, inquiryStore) {
  const details = referenceDetails(payload?.reference);
  const accessCode = clean(payload?.accessCode, 40).toUpperCase();
  if (!details || !/^[A-F0-9]{20}$/.test(accessCode)) return { error: "Check the inquiry reference and private status code.", status: 400 };
  const key = `inquiries/${details.date}/${details.reference}.json`;
  const record = await inquiryStore.get(key, { type: "json", consistency: "strong" });
  const suppliedHash = createHash("sha256").update(accessCode).digest("hex");
  if (!record?.accessTokenHash || !safeEqual(record.accessTokenHash, suppliedHash)) return { error: "No matching inquiry was found.", status: 404 };
  return { details, key, record };
}

export function createInquiryAttachmentHandler({ getStoreImpl = getStore } = {}) {
  async function onRequestPost(context) {
    if (!isAllowedOrigin(context.request.headers.get("origin"))) return response(403, { ok: false, message: "Request origin is not allowed." });
    let payload;
    try { payload = await context.request.json(); } catch { return response(400, { ok: false, message: "Invalid request." }); }
    try {
      const inquiryStore = getStoreImpl("beiqiang-inquiries");
      const auth = await authorize(payload, inquiryStore);
      if (auth.error) return response(auth.status, { ok: false, message: auth.error });
      const attachments = Array.isArray(auth.record.attachments) ? auth.record.attachments : [];
      const activePending = Array.isArray(auth.record.pendingAttachments) ? auth.record.pendingAttachments.filter((file) => Number(file.expiresAt) > Date.now() / 1000) : [];
      if (attachments.length + activePending.length >= MAX_FILES) return response(409, { ok: false, message: `A request can keep up to ${MAX_FILES} buyer files.` });
      const validated = safeFile(payload);
      if (validated.error) return response(400, { ok: false, message: validated.error });
      const uploadId = randomUUID().replaceAll("-", "").slice(0, 20);
      const blobKey = `inquiry-files/${auth.details.date}/${auth.details.reference}/${uploadId}-${validated.file.storageName}`;
      const fileStore = getStoreImpl("beiqiang-inquiry-files");
      const upload = await fileStore.createUploadUrl(blobKey, { expireSeconds: 900, contentType: validated.file.contentType });
      await inquiryStore.setJSON(auth.key, { ...auth.record, pendingAttachments: [...activePending, { id: uploadId, key: upload.key, name: validated.file.originalName, contentType: validated.file.contentType, size: validated.file.size, expiresAt: upload.expiresAt }], updatedAt: new Date().toISOString() }, { cacheControl: null });
      return response(201, { ok: true, uploadId, uploadUrl: upload.url, key: upload.key, expiresAt: upload.expiresAt, contentType: validated.file.contentType });
    } catch (error) {
      console.error("Inquiry attachment URL failed", error);
      return response(503, { ok: false, message: "File upload is temporarily unavailable. Please send the file by email or WhatsApp." });
    }
  }

  async function onRequestPatch(context) {
    if (!isAllowedOrigin(context.request.headers.get("origin"))) return response(403, { ok: false, message: "Request origin is not allowed." });
    let payload;
    try { payload = await context.request.json(); } catch { return response(400, { ok: false, message: "Invalid request." }); }
    try {
      const inquiryStore = getStoreImpl("beiqiang-inquiries");
      const auth = await authorize(payload, inquiryStore);
      if (auth.error) return response(auth.status, { ok: false, message: auth.error });
      const uploadId = clean(payload.uploadId, 40);
      const blobKey = clean(payload.key, 600);
      const expectedPrefix = `inquiry-files/${auth.details.date}/${auth.details.reference}/${uploadId}-`;
      if (!/^[a-f0-9]{20}$/.test(uploadId) || !blobKey.startsWith(expectedPrefix)) return response(400, { ok: false, message: "Invalid upload receipt." });
      const attachments = Array.isArray(auth.record.attachments) ? auth.record.attachments : [];
      if (attachments.some((file) => file.id === uploadId)) return response(200, { ok: true, attachment: attachments.find((file) => file.id === uploadId) });
      if (attachments.length >= MAX_FILES) return response(409, { ok: false, message: `A request can keep up to ${MAX_FILES} buyer files.` });
      const pending = Array.isArray(auth.record.pendingAttachments) ? auth.record.pendingAttachments.find((file) => file.id === uploadId && file.key === blobKey && Number(file.expiresAt) > Date.now() / 1000 - 300) : null;
      if (!pending) return response(400, { ok: false, message: "The upload permission is missing or expired. Choose the file again." });
      const fileStore = getStoreImpl("beiqiang-inquiry-files");
      const metadata = await fileStore.getMetadata(blobKey, { consistency: "strong" });
      const storedBytes = Number(metadata?.headers?.["content-length"]);
      const storedType = String(metadata?.contentType || metadata?.headers?.["content-type"] || "").toLowerCase();
      if (!metadata || !Number.isSafeInteger(storedBytes) || storedBytes !== pending.size || storedBytes < 1 || storedBytes > MAX_FILE_BYTES || storedType !== pending.contentType) {
        if (metadata) await fileStore.delete(blobKey);
        return response(400, { ok: false, message: "The uploaded file did not pass the size or type check." });
      }
      const attachment = { id: uploadId, key: blobKey, name: pending.name, contentType: storedType, size: storedBytes, uploadedAt: new Date().toISOString() };
      const updated = { ...auth.record, pendingAttachments: (auth.record.pendingAttachments || []).filter((file) => file.id !== uploadId), attachments: [...attachments, attachment], updatedAt: new Date().toISOString() };
      await inquiryStore.setJSON(auth.key, updated, { cacheControl: null });
      return response(201, { ok: true, attachment: { id: attachment.id, name: attachment.name, contentType: attachment.contentType, size: attachment.size, uploadedAt: attachment.uploadedAt } });
    } catch (error) {
      console.error("Inquiry attachment finalization failed", error);
      return response(503, { ok: false, message: "The file could not be attached. Please try again or contact Beiqiang." });
    }
  }

  return { onRequestPost, onRequestPatch };
}

const handlers = createInquiryAttachmentHandler();
export const onRequestPost = handlers.onRequestPost;
export const onRequestPatch = handlers.onRequestPatch;
