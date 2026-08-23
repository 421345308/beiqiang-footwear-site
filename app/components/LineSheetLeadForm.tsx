"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getAttribution, trackEvent } from "../lib/tracking";

const DOWNLOAD_PATH = "/downloads/beiqiang-footwear-line-sheet-2026.pdf";

type FormStatus = { kind: "idle" | "sending" | "success" | "error"; message: string };

export default function LineSheetLeadForm() {
  const [name, setName] = useState(""); const [company, setCompany] = useState("");
  const [buyerType, setBuyerType] = useState("Importer / wholesaler"); const [market, setMarket] = useState("");
  const [direction, setDirection] = useState("Multi-category shortlist"); const [quantity, setQuantity] = useState("");
  const [email, setEmail] = useState(""); const [whatsapp, setWhatsapp] = useState(""); const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState(""); const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<FormStatus>({ kind: "idle", message: "Submit once to unlock the current 30-style PDF and create a follow-up reference." });
  const [access, setAccess] = useState<{ reference: string; accessCode: string } | null>(null);
  const startedAt = useRef(0); const startedTracked = useRef(false);

  useEffect(() => { startedAt.current = Date.now(); }, []);

  function markStarted() {
    if (!startedAt.current) startedAt.current = Date.now();
    if (startedTracked.current) return;
    startedTracked.current = true; trackEvent("line_sheet_form_start", { context: "line_sheet" });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() && !whatsapp.trim()) { setStatus({ kind: "error", message: "Provide an email address or WhatsApp number so our sourcing team can follow up." }); return; }
    setStatus({ kind: "sending", message: "Saving your catalogue request…" });
    try {
      const response = await fetch("/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        name, company, buyerType, market, quantity, email, whatsapp, website, consent,
        styleCode: "CATALOG-2026", styleLabel: "Beiqiang 30-Style Footwear Line Sheet", context: "line_sheet", projectPath: "base_style_adaptation",
        requirements: `Catalogue interest: ${direction}. ${notes || "Buyer requested the current 30-style line sheet for product review."}`,
        formStartedAt: startedAt.current, attribution: getAttribution(), page: window.location.pathname,
      }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || "The catalogue request could not be saved.");
      const details = { reference: result.reference, accessCode: result.accessCode || "" }; setAccess(details);
      if (details.accessCode) localStorage.setItem("beiqiang_last_inquiry_access", JSON.stringify(details));
      setStatus({ kind: "success", message: `Catalogue unlocked. Reference: ${details.reference}. Save the private status code below for follow-up.` });
      trackEvent("line_sheet_request", { context: "line_sheet", reference: details.reference });
    } catch (error) { setStatus({ kind: "error", message: error instanceof Error ? error.message : "The catalogue request could not be saved." }); }
  }

  return (
    <form className="line-sheet-form" onSubmit={submit} onFocus={markStarted} aria-label="Request the Beiqiang footwear line sheet">
      <div className="line-sheet-form-heading"><p className="eyebrow">BUYER ACCESS</p><h2>Tell us what you source.</h2><p>We use these details only to deliver and follow up on this B2B product request.</p></div>
      <div className="line-sheet-form-grid">
        <label>Contact name<input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={100} placeholder="Your name" /></label>
        <label>Company name<input required value={company} onChange={(event) => setCompany(event.target.value)} autoComplete="organization" maxLength={160} placeholder="Company or brand" /></label>
        <label>Buyer type<select value={buyerType} onChange={(event) => setBuyerType(event.target.value)}><option>Importer / wholesaler</option><option>Amazon / TikTok seller</option><option>Brand / private label</option><option>Sourcing agent</option></select></label>
        <label>Target market<input required value={market} onChange={(event) => setMarket(event.target.value)} maxLength={120} placeholder="Country / sales channel" /></label>
        <label>Product direction<select value={direction} onChange={(event) => setDirection(event.target.value)}><option>Multi-category shortlist</option><option>Wide toe box walking shoes</option><option>Knit / textile slip-on shoes</option><option>Breathable lace-up shoes</option><option>Kids casual walking shoes</option><option>OEM / ODM development</option></select></label>
        <label>Estimated quantity<input required value={quantity} onChange={(event) => setQuantity(event.target.value)} maxLength={80} placeholder="Trial or bulk quantity" /></label>
        <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" maxLength={180} placeholder="name@company.com" /></label>
        <label>WhatsApp<input value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} autoComplete="tel" maxLength={80} placeholder="Country code + number" /></label>
        <label className="form-full">Short sourcing note<textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1200} rows={3} placeholder="Preferred styles, sizes, colors, sample timing or customization direction" /></label>
        <label className="form-honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
        <label className="form-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required /><span>I agree that Beiqiang may use these details to deliver and follow up on this sourcing request.</span></label>
      </div>
      <button className="button" type="submit" disabled={status.kind === "sending" || status.kind === "success"}>{status.kind === "sending" ? "Saving request…" : status.kind === "success" ? "Catalogue unlocked" : "Unlock the 30-style PDF"}</button>
      <p className={`form-note form-note-${status.kind}`} aria-live="polite">{status.message}</p>
      {status.kind === "success" && access ? <div className="line-sheet-download"><a className="button button-light" href={DOWNLOAD_PATH} download onClick={() => trackEvent("line_sheet_download", { context: "line_sheet", reference: access.reference, linkType: "pdf" })}>Download the PDF</a><p><strong>Private status code:</strong> {access.accessCode || "Sent separately"}</p><Link href="/inquiry-status/">Check follow-up status →</Link></div> : null}
      <small>The PDF is a product-discovery document, not a quotation. Availability, materials, size ratio, MOQ, price, packing and lead time require written confirmation.</small>
    </form>
  );
}
