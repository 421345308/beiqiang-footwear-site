import type { AdaptationBrief } from "../components/AdaptationBriefFields";
import type { ContactPreferences } from "../components/ContactPreferenceFields";

export type QuoteRequestDraft = {
  name: string;
  company: string;
  buyerType: string;
  market: string;
  channel: string;
  email: string;
  whatsapp: string;
  contactPreferences: ContactPreferences;
  projectPath: string;
  sampleQuantity: string;
  bulkQuantity: string;
  buyerTargetCost: string;
  preferredTradeTerm: string;
  deliveryDestination: string;
  deliveryTiming: string;
  existingSole: string;
  changesRequired: string;
  targetValues: string;
  ndaRequired: string;
  requirements: string;
  adaptationBrief: AdaptationBrief;
  sourcingProgram: string;
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const STORAGE_KEY = "beiqiang_quote_request_tab_draft_v1";
const BUYER_TYPES = new Set(["Importer / wholesaler", "Amazon / TikTok seller", "Brand / private label", "Sourcing agent"]);
const PROJECT_PATHS = new Set(["base_style_adaptation", "technical_development"]);
const TRADE_TERMS = new Set(["not_sure", "EXW", "FOB", "FCA", "DDP_request"]);
const CONTACT_METHODS = new Set(["", "email", "whatsapp", "either"]);
const RESPONSE_LANGUAGES = new Set(["", "en", "zh", "de", "fr", "es", "other"]);
const ADAPTATION_INTENTS = new Set(["not_sure", "existing_style_wholesale", "color_review", "private_label", "packing_labeling", "combined_review"]);
const ARTWORK_STATES = new Set(["not_applicable", "not_ready", "reference_only", "vector_ready"]);

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").slice(0, max) : "";
}

function choice(value: unknown, choices: Set<string>, fallback: string) {
  return typeof value === "string" && choices.has(value) ? value : fallback;
}

export const EMPTY_QUOTE_REQUEST_DRAFT: QuoteRequestDraft = {
  name: "", company: "", buyerType: "Importer / wholesaler", market: "", channel: "", email: "", whatsapp: "",
  contactPreferences: { preferredContactMethod: "", preferredResponseLanguage: "", buyerTimezone: "", preferredContactWindow: "" },
  projectPath: "base_style_adaptation", sampleQuantity: "", bulkQuantity: "", buyerTargetCost: "", preferredTradeTerm: "not_sure", deliveryDestination: "", deliveryTiming: "",
  existingSole: "Unsure / discuss first", changesRequired: "", targetValues: "", ndaRequired: "No", requirements: "",
  adaptationBrief: { intent: "not_sure", artworkStatus: "not_applicable", brandingPlacement: "", colorDirection: "", packingLabeling: "" }, sourcingProgram: "",
};

export function normalizeQuoteRequestDraft(value: unknown): QuoteRequestDraft | null {
  if (!value || typeof value !== "object") return null;
  const draft = value as Partial<QuoteRequestDraft>;
  const contact = draft.contactPreferences || EMPTY_QUOTE_REQUEST_DRAFT.contactPreferences;
  const adaptation = draft.adaptationBrief || EMPTY_QUOTE_REQUEST_DRAFT.adaptationBrief;
  return {
    name: text(draft.name, 120), company: text(draft.company, 160), buyerType: choice(draft.buyerType, BUYER_TYPES, EMPTY_QUOTE_REQUEST_DRAFT.buyerType),
    market: text(draft.market, 160), channel: text(draft.channel, 160), email: text(draft.email, 180), whatsapp: text(draft.whatsapp, 80),
    contactPreferences: { preferredContactMethod: choice(contact.preferredContactMethod, CONTACT_METHODS, ""), preferredResponseLanguage: choice(contact.preferredResponseLanguage, RESPONSE_LANGUAGES, ""), buyerTimezone: text(contact.buyerTimezone, 80), preferredContactWindow: text(contact.preferredContactWindow, 160) },
    projectPath: choice(draft.projectPath, PROJECT_PATHS, EMPTY_QUOTE_REQUEST_DRAFT.projectPath), sampleQuantity: text(draft.sampleQuantity, 80), bulkQuantity: text(draft.bulkQuantity, 80), buyerTargetCost: text(draft.buyerTargetCost, 120),
    preferredTradeTerm: choice(draft.preferredTradeTerm, TRADE_TERMS, "not_sure"), deliveryDestination: text(draft.deliveryDestination, 300), deliveryTiming: text(draft.deliveryTiming, 200),
    existingSole: text(draft.existingSole, 80) || EMPTY_QUOTE_REQUEST_DRAFT.existingSole, changesRequired: text(draft.changesRequired, 1200), targetValues: text(draft.targetValues, 1200), ndaRequired: draft.ndaRequired === "Yes" ? "Yes" : "No", requirements: text(draft.requirements, 2000),
    adaptationBrief: { intent: choice(adaptation.intent, ADAPTATION_INTENTS, "not_sure"), artworkStatus: choice(adaptation.artworkStatus, ARTWORK_STATES, "not_applicable"), brandingPlacement: text(adaptation.brandingPlacement, 300), colorDirection: text(adaptation.colorDirection, 600), packingLabeling: text(adaptation.packingLabeling, 600) },
    sourcingProgram: /^[a-z0-9-]{1,89}$/.test(draft.sourcingProgram || "") ? draft.sourcingProgram! : "",
  };
}

export function hasMeaningfulQuoteRequestDraft(draft: QuoteRequestDraft) {
  return JSON.stringify(draft) !== JSON.stringify(EMPTY_QUOTE_REQUEST_DRAFT);
}

function currentStorage(storage?: StorageLike) {
  if (storage) return storage;
  return typeof window === "undefined" ? null : window.sessionStorage;
}

export function readQuoteRequestDraft(storage?: StorageLike) {
  const target = currentStorage(storage); if (!target) return null;
  try { return normalizeQuoteRequestDraft(JSON.parse(target.getItem(STORAGE_KEY) || "null")); } catch { return null; }
}

export function saveQuoteRequestDraft(draft: QuoteRequestDraft, storage?: StorageLike) {
  const target = currentStorage(storage); if (!target) return;
  const safe = normalizeQuoteRequestDraft(draft);
  if (!safe || !hasMeaningfulQuoteRequestDraft(safe)) target.removeItem(STORAGE_KEY);
  else target.setItem(STORAGE_KEY, JSON.stringify(safe));
}

export function clearQuoteRequestDraft(storage?: StorageLike) {
  currentStorage(storage)?.removeItem(STORAGE_KEY);
}
