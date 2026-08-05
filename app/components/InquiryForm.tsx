"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getAttribution, trackEvent } from "../lib/tracking";

type InquiryFormProps = {
  styleCode: string;
  styleLabel: string;
  context: "homepage" | "product";
};

type FormStatus = { kind: "idle" | "sending" | "success" | "error"; message: string };

export default function InquiryForm({ styleCode, styleLabel, context }: InquiryFormProps) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [buyerType, setBuyerType] = useState("Importer / wholesaler");
  const [market, setMarket] = useState("");
  const [quantity, setQuantity] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [requirements, setRequirements] = useState("");
  const [website, setWebsite] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<FormStatus>({ kind: "idle", message: "Your request will be saved and assigned a reference number." });
  const startedAt = useRef(0);
  const formStartedTracked = useRef(false);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const inquiryBrief = useMemo(
    () => [
      `Beiqiang ${styleCode} sample / quotation request`,
      `Style: ${styleLabel}`,
      `Contact: ${name || "To be provided"}`,
      `Company: ${company || "To be provided"}`,
      `Buyer type: ${buyerType}`,
      `Target market: ${market || "To be provided"}`,
      `Expected quantity: ${quantity || "To be discussed"}`,
      `Email: ${email || "Not provided"}`,
      `WhatsApp: ${whatsapp || "Not provided"}`,
      `Requirements: ${requirements || "Please confirm sample, colors, size ratio, packing and timing."}`,
    ].join("\n"),
    [buyerType, company, email, market, name, quantity, requirements, styleCode, styleLabel, whatsapp],
  );

  function markStarted() {
    if (!startedAt.current) startedAt.current = Date.now();
    if (formStartedTracked.current) return;
    formStartedTracked.current = true;
    trackEvent("form_start", { context, styleCode });
  }

  async function submitInquiry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() && !whatsapp.trim()) {
      setStatus({ kind: "error", message: "Please provide an email address or WhatsApp number so our team can reply." });
      return;
    }

    setStatus({ kind: "sending", message: "Saving your sourcing request…" });
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, company, buyerType, market, quantity, email, whatsapp, requirements,
          website, consent, styleCode, styleLabel, context,
          formStartedAt: startedAt.current,
          attribution: getAttribution(),
          page: window.location.pathname,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || "The request could not be saved.");

      setStatus({ kind: "success", message: `Request saved. Reference: ${result.reference}. We will use your contact details to follow up.` });
      trackEvent("form_submit", { context, styleCode, reference: result.reference });
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "The request could not be saved. Please use WhatsApp or email below." });
    }
  }

  return (
    <form className="inquiry-form" aria-label={`${styleCode} sample and quotation request`} onSubmit={submitInquiry} onFocus={markStarted}>
      <label>Contact name<input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={100} placeholder="Your name" /></label>
      <label>Company name<input required value={company} onChange={(event) => setCompany(event.target.value)} autoComplete="organization" maxLength={160} placeholder="Your company or brand" /></label>
      <label>Buyer type<select value={buyerType} onChange={(event) => setBuyerType(event.target.value)}><option>Importer / wholesaler</option><option>Amazon / TikTok seller</option><option>Brand / private label</option><option>Sourcing agent</option></select></label>
      <label>Target market<input required value={market} onChange={(event) => setMarket(event.target.value)} maxLength={120} placeholder="Country / sales channel" /></label>
      <label>Expected quantity<input required value={quantity} onChange={(event) => setQuantity(event.target.value)} maxLength={80} placeholder="Trial or bulk quantity" /></label>
      <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" maxLength={180} placeholder="name@company.com" /></label>
      <label className="form-full">WhatsApp<input value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} autoComplete="tel" maxLength={80} placeholder="Country code + number" /></label>
      <label className="form-full">Requirements<textarea value={requirements} onChange={(event) => setRequirements(event.target.value)} maxLength={2000} placeholder="Sizes, colors, logo, packing, timing, reference style..." rows={4} /></label>
      <label className="form-honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
      <label className="form-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required /><span>I agree that Beiqiang may use these details to respond to this sourcing request.</span></label>
      <button className="button button-light form-button" type="submit" disabled={status.kind === "sending" || status.kind === "success"}>{status.kind === "sending" ? "Saving request…" : status.kind === "success" ? "Request saved" : "Submit sample / quotation request"}</button>
      <p className={`form-note form-note-${status.kind}`} aria-live="polite">{status.message}</p>
      <details className="inquiry-preview"><summary>Review inquiry brief</summary><pre>{inquiryBrief}</pre></details>
    </form>
  );
}
