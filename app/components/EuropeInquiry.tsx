/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { t, type EuropeLocale, type CopyKey } from "../data/europe-copy";
import { products, type Product } from "../data/products";
import { productColours, galleryImage } from "../lib/product-colours";
import { productTitle, productColour } from "../data/europe-products";
import { localizedPath } from "../lib/public-locales";
import {
  readQuoteList,
  saveQuoteList,
  QUOTE_LIST_EVENT,
  type QuoteLine,
} from "../lib/quote-list";
import {
  EMPTY_QUOTE_REQUEST_DRAFT,
  readQuoteRequestDraft,
  saveQuoteRequestDraft,
  clearQuoteRequestDraft,
  type QuoteRequestDraft,
} from "../lib/quote-request-draft";
import { localizedInquiryPayload, inquiryProblem } from "../lib/europe-inquiry";
import { getAttribution, trackEvent } from "../lib/tracking";
import QuoteListShare from "./QuoteListShare";
import { mergeSharedQuoteList, parseSharedQuoteCodes, parseSharedQuoteSelection } from "../lib/quote-list-share";
import { sharedImportMessage } from "../lib/quote-share-copy";

const colourEditorCopy = {
  de: { hint: "Wählen Sie eine oder mehrere Farben. Mengen, Größen und Notizen bleiben erhalten.", clear: "Farbauswahl aufheben" },
  fr: { hint: "Sélectionnez un ou plusieurs coloris. Les quantités, pointures et notes sont conservées.", clear: "Effacer les coloris sélectionnés" },
  es: { hint: "Seleccione uno o varios colores. Se conservan las cantidades, tallas y notas.", clear: "Borrar la selección de colores" },
};

export function editQuoteColours(line: QuoteLine, product: Product, name: string, checked: boolean): QuoteLine {
  const options = productColours(product);
  if (name && !options.some(option => option.name === name)) return line;
  const current = line.colors.split(",").map(value => value.trim()).filter(Boolean);
  const selected = name ? checked ? [...new Set([...current, name])] : current.filter(value => value !== name) : [];
  const photo = [...selected].reverse().map(value => options.find(option => option.name === value)).find(Boolean);
  return { ...line, colors: selected.join(", "), image: galleryImage(product.images[photo?.imageIndex ?? 0]) };
}

export function QuoteColourEditor({ line, product, locale, onChange }: { line: QuoteLine; product: Product; locale: EuropeLocale; onChange: (line: QuoteLine) => void }) {
  const options = productColours(product);
  if (!options.length) return null;
  const selected = line.colors.split(",").map(value => value.trim());
  const helpId = `quote-colours-help-${line.code}`;
  return <fieldset aria-describedby={helpId} style={{ minWidth: 0, padding: "12px", margin: "16px 0" }}>
    <legend style={{ fontSize: "16px", padding: "0 6px" }}>{t(locale, "colour")} · {line.code}</legend>
    <p id={helpId} className="europe-note">{colourEditorCopy[locale].hint}</p>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))", gap: "8px" }}>
      {options.map(option => <label key={option.id} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px", minHeight: "48px", padding: "8px", border: "1px solid #d6d1c7", cursor: "pointer", overflowWrap: "anywhere" }}>
        <input type="checkbox" name={`colours-${line.code}`} value={option.name} checked={selected.includes(option.name)} onChange={event => onChange(editQuoteColours(line, product, option.name, event.target.checked))} style={{ width: "20px", height: "20px", minHeight: "20px", padding: 0, flexShrink: 0 }} />
        <img src={galleryImage(product.images[option.imageIndex], true)} alt="" width={48} height={48} loading="lazy" style={{ width: "48px", height: "48px", objectFit: "contain", flexShrink: 0 }} />
        <span>{productColour(option.name, locale)}</span>
      </label>)}
    </div>
    {line.colors && <button type="button" onClick={() => onChange(editQuoteColours(line, product, "", false))}>{colourEditorCopy[locale].clear}</button>}
  </fieldset>;
}

export default function EuropeInquiry({ locale }: { locale: EuropeLocale }) {
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [draft, setDraft] = useState<QuoteRequestDraft>(
    EMPTY_QUOTE_REQUEST_DRAFT,
  );
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "error" | "success">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [receipt, setReceipt] = useState<{
    reference: string;
    accessCode: string;
  } | null>(null);
  const started = useRef(0);
  const busy = useRef(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    started.current = Date.now();
    const load = () => setLines(readQuoteList());
    const frame = requestAnimationFrame(() => {
      setDraft(readQuoteRequestDraft() || EMPTY_QUOTE_REQUEST_DRAFT);
      setReady(true);
      const current = readQuoteList();
      const url = new URL(window.location.href);
      const shared = url.searchParams.get("shortlist");
      if (shared !== null) {
        const codes = parseSharedQuoteCodes(shared, products.map(product => product.code));
        const selections = parseSharedQuoteSelection(url.hash, codes);
        const merged = mergeSharedQuoteList(current, codes, products, selections);
        setLines(merged.lines);
        if (merged.imported || merged.updated) saveQuoteList(merged.lines);
        setShareMessage(sharedImportMessage(locale, codes, merged.imported, current, selections, merged.updated));
        url.searchParams.delete("shortlist");
        const fragment = new URLSearchParams(url.hash.slice(1));
        if (fragment.has("selection")) { fragment.delete("selection"); url.hash = fragment.toString(); }
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      } else load();
    });
    window.addEventListener(QUOTE_LIST_EVENT, load);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener(QUOTE_LIST_EVENT, load);
    };
  }, [locale]);
  function edit(patch: Partial<QuoteRequestDraft>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    try {
      saveQuoteRequestDraft(next);
    } catch {
      /* Form remains usable without storage. */
    }
  }
  function editLine(index: number, patch: Partial<QuoteLine>) {
    const next = lines.map((line, i) =>
      i === index ? { ...line, ...patch } : line,
    );
    setLines(next);
    try {
      saveQuoteList(next);
    } catch {
      /* Retain current values. */
    }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy.current || state === "success") return;
    const problem = inquiryProblem(draft, consent, locale);
    if (problem) {
      setMessage(problem);
      setState("error");
      setTimeout(() => errorRef.current?.focus(), 0);
      return;
    }
    busy.current = true;
    setState("sending");
    setMessage(t(locale, "sending"));
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...localizedInquiryPayload(draft, lines, locale),
          consent,
          website,
          formStartedAt: started.current,
          attribution: getAttribution(),
          page: window.location.pathname,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok || !result.reference || !result.accessCode)
        throw new Error("not_saved");
      setReceipt({
        reference: result.reference,
        accessCode: result.accessCode,
      });
      setState("success");
      setMessage(t(locale, "success"));
      try {
        localStorage.setItem(
          "beiqiang_last_inquiry_access",
          JSON.stringify({
            reference: result.reference,
            accessCode: result.accessCode,
          }),
        );
        clearQuoteRequestDraft();
      } catch {
        /* Receipt is still visible. */
      }
      trackEvent("form_submit", {
        context: "localized_quote",
        styleCode: lines.map((i) => i.code).join(",") || "CATALOG-2026",
      });
    } catch {
      setState("error");
      setMessage(t(locale, "failure"));
    } finally {
      busy.current = false;
    }
  }
  const fields: [keyof QuoteRequestDraft, CopyKey, number, boolean][] = [
    ["name", "name", 100, true],
    ["company", "company", 160, true],
    ["market", "market", 120, true],
    ["bulkQuantity", "quantity", 80, true],
    ["email", "email", 180, false],
    ["sampleQuantity", "sampleQuantity", 80, false],
    ["deliveryDestination", "destination", 240, false],
    ["deliveryTiming", "timing", 160, false],
  ];
  return (
    <section className="europe-content">
      <p className="eyebrow">BEIQIANG · B2B</p>
      <h1>{t(locale, "quote")}</h1>
      <p className="europe-lead">{t(locale, "quoteIntro")}</p>
      <p className="europe-note">{t(locale, "draftNote")}</p>
      <QuoteListShare lines={lines} locale={locale} importMessage={shareMessage} />
      <form
        noValidate
        onSubmit={submit}
        className="europe-inquiry"
        aria-label={t(locale, "quote")}
      >
        <fieldset
          disabled={state === "sending" || state === "success" || !ready}
        >
          <legend>{t(locale, "products")}</legend>
          {!lines.length && <p>{t(locale, "empty")}</p>}
          {lines.map((line, index) => {
            const p = products.find((p) => p.code === line.code);
            return (
              <article className="europe-quote-item" key={line.code}>
                <img
                  src={line.image}
                  alt={line.code}
                  width={120}
                  height={120}
                />
                <div>
                  <h2>
                    {line.code} · {p ? productTitle(p, locale) : line.code}
                  </h2>
                  <p>
                    {t(locale, "colour")}:{" "}
                    {line.colors
                      .split(",")
                      .map((c) => productColour(c.trim(), locale))
                      .join(", ") || "—"}
                  </p>
                  {p && <QuoteColourEditor line={line} product={p} locale={locale} onChange={next => editLine(index, { colors: next.colors, image: next.image })} />}
                  <div className="europe-form-grid">
                    {(
                      [
                        ["quantity", "lineQuantity"],
                        ["sizes", "sizes"],
                        ["notes", "notes"],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key}>
                        {t(locale, label)}
                        <input
                          value={line[key]}
                          maxLength={key === "notes" ? 500 : 80}
                          onChange={(e) =>
                            editLine(index, { [key]: e.target.value })
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = lines.filter((_, i) => i !== index);
                      setLines(next);
                      saveQuoteList(next);
                    }}
                  >
                    {t(locale, "remove")} {line.code}
                  </button>
                </div>
              </article>
            );
          })}
          <a href={localizedPath("/products", locale)}>
            {t(locale, "browse")} ↗
          </a>
        </fieldset>
        <fieldset
          disabled={state === "sending" || state === "success" || !ready}
        >
          <legend>{t(locale, "requirements")}</legend>
          <div className="europe-form-grid">
            <label>
              {t(locale, "buyerType")}
              <select
                value={draft.buyerType}
                onChange={(e) => edit({ buyerType: e.target.value })}
              >
                {(
                  [
                    ["Importer / wholesaler", "importer"],
                    ["Amazon / TikTok seller", "onlineSeller"],
                    ["Brand / private label", "brandBuyer"],
                    ["Sourcing agent", "sourcingAgent"],
                  ] as const
                ).map(([value, label]) => (
                  <option value={value} key={value}>
                    {t(locale, label)}
                  </option>
                ))}
              </select>
            </label>
            {fields.map(([key, label, max, required]) => (
              <label key={key}>
                {t(locale, label)}
                {required ? " *" : ` (${t(locale, "optional")})`}
                <input
                  name={key}
                  required={required}
                  type={key === "email" ? "email" : "text"}
                  autoComplete={
                    key === "name"
                      ? "name"
                      : key === "company"
                        ? "organization"
                        : key === "email"
                          ? "email"
                          : "off"
                  }
                  value={String(draft[key])}
                  maxLength={max}
                  onChange={(e) => edit({ [key]: e.target.value })}
                />
              </label>
            ))}
            <label>
              WhatsApp ({t(locale, "optional")})
              <input
                type="tel"
                name="whatsapp"
                autoComplete="tel"
                value={draft.whatsapp}
                maxLength={80}
                onChange={(e) => edit({ whatsapp: e.target.value })}
              />
            </label>
          </div>
          <p>{t(locale, "contactHint")}</p>
          <label>
            {t(locale, "requirements")}
            <textarea
              value={draft.requirements}
              rows={5}
              maxLength={2000}
              onChange={(e) => edit({ requirements: e.target.value })}
            />
          </label>
          <label className="form-honeypot" aria-hidden="true">
            Website
            <input
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
          <label className="europe-consent">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              {t(locale, "consent")}{" "}
              <a href={localizedPath("/privacy", locale)}>
                {t(locale, "privacy")}
              </a>
            </span>
          </label>
          <details>
            <summary>{t(locale, "review")}</summary>
            <p>
              {draft.name} · {draft.company} · {draft.market}
            </p>
            <p>
              {t(locale, "quantity")}:{" "}
              {draft.bulkQuantity || draft.sampleQuantity}
            </p>
            <p>
              {draft.email} · {draft.whatsapp}
            </p>
            <p>{draft.requirements}</p>
            {lines.map((line) => (
              <p key={line.code}>
                {line.code} · {line.quantity} ·{" "}
                {line.colors
                  .split(",")
                  .map((c) => productColour(c.trim(), locale))
                  .join(", ")}{" "}
                · {line.sizes} · {line.notes}
              </p>
            ))}
          </details>
          <p className="europe-note">{t(locale, "receiptNote")}</p>
          <button type="submit" className="button">
            {t(
              locale,
              state === "sending"
                ? "sending"
                : state === "success"
                  ? "success"
                  : "submit",
            )}
          </button>
        </fieldset>
        <p
          ref={errorRef}
          tabIndex={-1}
          role={state === "error" ? "alert" : "status"}
          className={`europe-form-message ${state}`}
        >
          {message}
        </p>
        {receipt && (
          <div className="europe-receipt">
            <h2>{t(locale, "success")}</h2>
            <p>
              {t(locale, "reference")}: <strong>{receipt.reference}</strong>
            </p>
            <p>
              {t(locale, "accessCode")}: <strong>{receipt.accessCode}</strong>
            </p>
            <p>{t(locale, "receiptNote")}</p>
            <Link href="/inquiry-status/" lang="en">
              {t(locale, "statusEnglish")} ↗
            </Link>
          </div>
        )}
      </form>
    </section>
  );
}
