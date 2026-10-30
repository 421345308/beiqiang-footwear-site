import { ApiError, getJSON, hash, putJSON, text } from './workbench.js';

export const OPS_STORE = 'beiqiang-operations-v1';
export const SOURCE = { backend: 'existing_private_store', postgres: false, store: 'beiqiang-inquiries', mode: 'read_on_request', scheduled: false };
export function reference(value) {
  if (typeof value !== 'string' || !/^BQ-\d{8}-[A-Z0-9-]+$/.test(value) || value.length > 80) throw new ApiError(400, '询盘编号无效。');
  return value;
}
export const sourceHash = record => hash(JSON.stringify(record));
export async function allKeys(store, prefix) {
  const keys = [], seen = new Set(); let cursor;
  do {
    const result = await store.list({ prefix, limit: 200, paginate: false, consistency: 'strong', ...(cursor ? { cursor } : {}) });
    for (const blob of result.blobs || []) keys.push(blob.key);
    cursor = result.cursor;
    if (cursor && seen.has(cursor)) throw new ApiError(503, '来源分页异常，请稍后重试。');
    if (cursor) seen.add(cursor);
  } while (cursor);
  return [...new Set(keys)];
}
export function createOperationsStore({ inquiryStore, opsStore }) {
  return {
    async listSources() {
      const keys = await allKeys(inquiryStore, 'inquiries/'), result = [];
      // Bounded parallel reads; no raw records are logged or persisted here.
      for (let i = 0; i < keys.length; i += 20) result.push(...(await Promise.all(keys.slice(i, i + 20).map(key => getJSON(inquiryStore, key)))).filter(Boolean));
      return result;
    },
    async source(ref) {
      reference(ref); const date = `${ref.slice(3, 7)}-${ref.slice(7, 9)}-${ref.slice(9, 11)}`;
      const record = await getJSON(inquiryStore, `inquiries/${date}/${ref}.json`);
      if (!record || record.reference !== ref) throw new ApiError(404, '询盘不存在。'); return record;
    },
    async handling(ref) {
      const keys = await allKeys(opsStore, `handling/${reference(ref)}/`);
      const last = keys.sort().at(-1); return last ? await getJSON(opsStore, last) : { reference: ref, version: 0, internal_note: '', next_action: '', handling_status: 'open', updated_at: null };
    },
    async listHandlings() {
      const keys = await allKeys(opsStore, 'handling/'), latest = new Map(), result = new Map();
      for (const key of keys) { const ref = key.split('/')[1]; if (!latest.has(ref) || latest.get(ref) < key) latest.set(ref, key); }
      const selected = [...latest.entries()];
      for (let i = 0; i < selected.length; i += 20) {
        for (const [ref, value] of await Promise.all(selected.slice(i, i + 20).map(async ([ref, key]) => [ref, await getJSON(opsStore, key)]))) if (value) result.set(ref, value);
      }
      return result;
    },
    async proposals(ref) {
      const keys = await allKeys(opsStore, `proposals/${reference(ref)}/`), result = [];
      for (const key of keys) result.push(await getJSON(opsStore, key));
      return result.filter(Boolean).sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    proposal: (ref, id) => getJSON(opsStore, `proposals/${reference(ref)}/${id}.json`),
    async runIds(ref) { return (await allKeys(opsStore, `inquiry_runs/${reference(ref)}/`)).map(key => key.split('/').at(-1).replace(/\.json$/, '')); },
    indexRun: (ref, id) => putJSON(opsStore, `inquiry_runs/${reference(ref)}/${id}.json`, { run_id: id }, true),
    saveProposal: proposal => putJSON(opsStore, `proposals/${proposal.reference}/${proposal.id}.json`, proposal, true),
    // One conditional object is the commit: handling and decision succeed together.
    commit: handling => putJSON(opsStore, `handling/${handling.reference}/${String(handling.version).padStart(12, '0')}.json`, handling, true),
  };
}
const summaryFields = ['reference', 'name', 'company', 'country', 'styleCode', 'styleLabel', 'quantity', 'receivedAt', 'updatedAt', 'status'];
const detailFields = [...summaryFields, 'email', 'whatsapp', 'requirements', 'businessType', 'preferredContactMethod', 'preferredResponseLanguage', 'buyerTimezone', 'preferredContactWindow', 'preferredTradeTerm', 'deliveryDestination', 'deliveryTiming', 'sourcingProgram', 'sizes', 'colors', 'targetPrice'];
const pick = (record, fields) => Object.fromEntries(fields.filter(key => typeof record[key] === 'string' || typeof record[key] === 'number').map(key => [key, record[key]]));
export function safeInquiry(record, detail = false) {
  const safe = pick(record, detail ? detailFields : summaryFields);
  safe.internalTest = record.internalTest === true || /internal|deployment test|smtp test|test only|\b0\s*pairs?\b/i.test(`${record.name || ''} ${record.company || ''} ${record.requirements || ''} ${record.quantity || ''}`);
  if (detail) {
    safe.messages = (Array.isArray(record.messages) ? record.messages : []).map(message => pick(message, ['id', 'role', 'sender', 'author', 'body', 'text', 'message', 'content', 'createdAt', 'sentAt', 'at']));
    safe.attachments = (Array.isArray(record.attachments) ? record.attachments : []).map(file => pick(file, ['id', 'name', 'fileName', 'size', 'contentType', 'uploadedAt']));
  }
  return safe;
}
export function handlingView(handling, record) {
  const pending = handling.handling_status !== 'handled' || handling.handled_source_hash !== sourceHash(record);
  return { ...handling, effective_status: pending ? 'open' : 'handled', pending };
}
export function handlingFields(fields) {
  if (!fields || !['open', 'handled'].includes(fields.handling_status)) throw new ApiError(400, '请选择待处理或已处理。');
  return { internal_note: text(fields.internal_note, 6000), next_action: text(fields.next_action, 2000), handling_status: fields.handling_status };
}
