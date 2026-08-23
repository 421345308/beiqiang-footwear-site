export type RelationshipRecord = {
  reference: string;
  receivedAt?: string;
  company?: string;
  email?: string;
  whatsapp?: string;
  status?: string;
  styleCode?: string;
  items?: { code?: string }[];
};

export type RelationshipGroup<T extends RelationshipRecord> = {
  id: string;
  matchBasis: string[];
  records: T[];
  styleCodes: string[];
};

export function normalizeRelationshipEmail(value = "") {
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

export function normalizeRelationshipPhone(value = "") {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  return digits.length >= 7 ? digits : "";
}

export function normalizeRelationshipCompany(value = "") {
  const normalized = value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim()
    .replace(/\b(company|co|limited|ltd|incorporated|inc|llc|gmbh|sarl|sas|plc)\b(?:\s+\b(company|co|limited|ltd|incorporated|inc|llc|gmbh|sarl|sas|plc)\b)*$/g, "").trim();
  if (normalized.length < 4 || ["none", "unknown", "personal", "individual", "not available", "n a", "test"].includes(normalized)) return "";
  return normalized;
}

function relationshipKeys(record: RelationshipRecord) {
  const email = normalizeRelationshipEmail(record.email); const phone = normalizeRelationshipPhone(record.whatsapp); const company = normalizeRelationshipCompany(record.company);
  return [email && `email:${email}`, phone && `phone:${phone}`, company && `company:${company}`].filter(Boolean) as string[];
}

function styleCodes(record: RelationshipRecord) {
  const itemCodes = Array.isArray(record.items) ? record.items.map((item) => String(item.code || "").trim()) : [];
  const directCodes = String(record.styleCode || "").split(",").map((code) => code.trim());
  return [...itemCodes, ...directCodes].filter(Boolean);
}

export function buildRelationshipGroups<T extends RelationshipRecord>(records: T[]): RelationshipGroup<T>[] {
  const parent = records.map((_, index) => index);
  const find = (index: number): number => parent[index] === index ? index : (parent[index] = find(parent[index]));
  const union = (left: number, right: number) => { const a = find(left); const b = find(right); if (a !== b) parent[b] = a; };
  const keyOwners = new Map<string, number[]>();
  records.forEach((record, index) => relationshipKeys(record).forEach((key) => keyOwners.set(key, [...(keyOwners.get(key) || []), index])));
  keyOwners.forEach((owners) => owners.slice(1).forEach((owner) => union(owners[0], owner)));

  const grouped = new Map<number, T[]>();
  records.forEach((record, index) => { const root = find(index); grouped.set(root, [...(grouped.get(root) || []), record]); });
  return [...grouped.values()].filter((group) => group.length > 1).map((group) => {
    const groupReferences = new Set(group.map((record) => record.reference));
    const sharedKeys = [...keyOwners.entries()].filter(([, owners]) => owners.filter((index) => groupReferences.has(records[index].reference)).length > 1).map(([key]) => key);
    const matchBasis = [...new Set(sharedKeys.map((key) => key.startsWith("email:") ? "Exact email" : key.startsWith("phone:") ? "Exact WhatsApp digits" : "Normalized company name"))];
    const sorted = [...group].sort((a, b) => Date.parse(b.receivedAt || "0") - Date.parse(a.receivedAt || "0"));
    return { id: `relationship-${sorted.at(-1)?.reference || sorted[0].reference}`, matchBasis, records: sorted, styleCodes: [...new Set(sorted.flatMap(styleCodes))] };
  }).sort((a, b) => Date.parse(b.records[0].receivedAt || "0") - Date.parse(a.records[0].receivedAt || "0"));
}

export function relationshipIndex<T extends RelationshipRecord>(groups: RelationshipGroup<T>[]) {
  const index = new Map<string, RelationshipGroup<T>>();
  groups.forEach((group) => group.records.forEach((record) => index.set(record.reference, group)));
  return index;
}
