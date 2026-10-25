import { type EuropeLocale, t } from "../data/europe-copy.ts";
import type { QuoteRequestDraft } from "./quote-request-draft.ts";
import type { QuoteLine } from "./quote-list";
// Same persistence contract as EN/ZH; locale is a response preference, not a new lead type.
export function localizedInquiryPayload(
  draft: QuoteRequestDraft,
  items: QuoteLine[],
  locale: EuropeLocale,
) {
  return {
    ...draft,
    ...draft.contactPreferences,
    preferredResponseLanguage: locale,
    quantity: draft.bulkQuantity || draft.sampleQuantity,
    styleCode: items.map((i) => i.code).join(", ") || "CATALOG-2026",
    styleLabel:
      items.map((i) => `${i.code} ${i.name}`).join("; ") ||
      "General sourcing inquiry",
    context: "localized_quote",
    items: items.map(
      ({ code, sourceModel, name, quantity, colors, sizes, notes }) => ({
        code,
        sourceModel,
        name,
        quantity,
        colors,
        sizes,
        notes,
      }),
    ),
  };
}
export function inquiryProblem(
  draft: QuoteRequestDraft,
  consent: boolean,
  locale: EuropeLocale,
) {
  if (
    ![
      draft.name,
      draft.company,
      draft.market,
      draft.bulkQuantity || draft.sampleQuantity,
    ].every((v) => v.trim()) ||
    !consent
  )
    return t(locale, "required");
  if (!draft.email.trim() && !draft.whatsapp.trim())
    return t(locale, "contactHint");
  if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email))
    return t(locale, "invalidEmail");
  return "";
}
