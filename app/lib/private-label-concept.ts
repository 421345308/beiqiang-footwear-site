import type { Product } from "../data/products.ts";
import { readQuoteList, saveQuoteList } from "./quote-list.ts";

export const PRIVATE_LABEL_CONCEPT_KEY = "beiqiang_private_label_concept_v1";

export type PrivateLabelConcept = {
  styleCode: string;
  styleSlug: string;
  sourceModel: string;
  styleName: string;
  placement: string;
  artworkStatus: "not_ready" | "reference_only" | "vector_ready";
  brandText: string;
  notes: string;
  createdAt: string;
};

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().replace(/\0/g, "").slice(0, max) : "";
}

export function readPrivateLabelConcept(): PrivateLabelConcept | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(localStorage.getItem(PRIVATE_LABEL_CONCEPT_KEY) || "null");
    const styleCode = clean(value?.styleCode, 10).toUpperCase();
    const artworkStatus = ["not_ready", "reference_only", "vector_ready"].includes(value?.artworkStatus)
      ? value.artworkStatus
      : "not_ready";
    if (!/^BQ\d{3}$/.test(styleCode)) return null;
    return {
      styleCode,
      styleSlug: clean(value?.styleSlug, 30),
      sourceModel: clean(value?.sourceModel, 40),
      styleName: clean(value?.styleName, 180),
      placement: clean(value?.placement, 120),
      artworkStatus,
      brandText: clean(value?.brandText, 80),
      notes: clean(value?.notes, 500),
      createdAt: clean(value?.createdAt, 40),
    };
  } catch {
    return null;
  }
}

export function savePrivateLabelConcept(concept: PrivateLabelConcept) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PRIVATE_LABEL_CONCEPT_KEY, JSON.stringify({
    styleCode: clean(concept.styleCode, 10).toUpperCase(),
    styleSlug: clean(concept.styleSlug, 30),
    sourceModel: clean(concept.sourceModel, 40),
    styleName: clean(concept.styleName, 180),
    placement: clean(concept.placement, 120),
    artworkStatus: ["not_ready", "reference_only", "vector_ready"].includes(concept.artworkStatus) ? concept.artworkStatus : "not_ready",
    brandText: clean(concept.brandText, 80),
    notes: clean(concept.notes, 500),
    createdAt: clean(concept.createdAt, 40),
  }));
}

export function addConceptProductToQuote(product: Product, concept: PrivateLabelConcept) {
  const lines = readQuoteList();
  const summary = `Private-label concept target: ${concept.placement || "placement to review"}${concept.brandText ? `; brand text ${concept.brandText}` : ""}${concept.notes ? `; ${concept.notes}` : ""}`.slice(0, 600);
  const existing = lines.findIndex((line) => line.code === product.code);
  if (existing >= 0) {
    const current = lines[existing];
    lines[existing] = { ...current, notes: current.notes.includes("Private-label concept target:") ? current.notes : [current.notes, summary].filter(Boolean).join(" | ").slice(0, 800) };
  } else if (lines.length < 12) {
    lines.push({ code: product.code, slug: product.slug, sourceModel: product.sourceModel, name: product.name, image: `/catalog-thumbs/${product.slug}.webp`, quantity: "", colors: "", sizes: "", notes: summary });
  }
  saveQuoteList(lines);
}
