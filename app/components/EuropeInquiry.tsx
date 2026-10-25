/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { t, type EuropeLocale, type CopyKey } from "../data/europe-copy";
import { products } from "../data/products";
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
      load();
    });
    window.addEventListener(QUOTE_LIST_EVENT, load);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener(QUOTE_LIST_EVENT, load);
    };
  }, []);
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
