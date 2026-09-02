"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { products } from "../data/products";
import { getAttribution, trackEvent } from "../lib/tracking";
import {
  readQuoteList,
  saveQuoteList,
  type QuoteLine,
} from "../lib/quote-list";
import InquiryAttachmentUploader from "../components/InquiryAttachmentUploader";
import ContactPreferenceFields, {
  EMPTY_CONTACT_PREFERENCES,
  type ContactPreferences,
} from "../components/ContactPreferenceFields";
import AdaptationBriefFields, { EMPTY_ADAPTATION_BRIEF, type AdaptationBrief } from "../components/AdaptationBriefFields";
import BuyerQuoteReadiness from "../components/BuyerQuoteReadiness";
import QuoteListShare from "../components/QuoteListShare";
import { assessBuyerQuoteReadiness } from "../lib/buyer-quote-readiness";
import { readPrivateLabelConcept } from "../lib/private-label-concept";
import { buyerTypeFromFinder, clearProductFinderBrief, finderBriefLabels, readProductFinderBrief, salesChannelFromFinder, type ProductFinderBrief } from "../lib/product-finder-brief";
import { clearQuoteRequestDraft, EMPTY_QUOTE_REQUEST_DRAFT, readQuoteRequestDraft, saveQuoteRequestDraft, type QuoteRequestDraft } from "../lib/quote-request-draft";
import { mergeSharedQuoteList, parseSharedQuoteCodes } from "../lib/quote-list-share";

type Status = {
  kind: "idle" | "sending" | "success" | "error";
  message: string;
};

export default function QuoteRequestBuilder() {
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [buyerType, setBuyerType] = useState("Importer / wholesaler");
  const [market, setMarket] = useState("");
  const [channel, setChannel] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [contactPreferences, setContactPreferences] =
    useState<ContactPreferences>(EMPTY_CONTACT_PREFERENCES);
  const [projectPath, setProjectPath] = useState("base_style_adaptation");
  const [sampleQuantity, setSampleQuantity] = useState("");
  const [bulkQuantity, setBulkQuantity] = useState("");
  const [preferredTradeTerm, setPreferredTradeTerm] = useState("not_sure");
  const [deliveryDestination, setDeliveryDestination] = useState("");
  const [deliveryTiming, setDeliveryTiming] = useState("");
  const [existingSole, setExistingSole] = useState("Unsure / discuss first");
  const [changesRequired, setChangesRequired] = useState("");
  const [targetValues, setTargetValues] = useState("");
  const [ndaRequired, setNdaRequired] = useState("No");
  const [requirements, setRequirements] = useState("");
  const [adaptationBrief, setAdaptationBrief] = useState<AdaptationBrief>(EMPTY_ADAPTATION_BRIEF);
  const [sourcingProgram, setSourcingProgram] = useState("");
  const [finderBrief, setFinderBrief] = useState<ProductFinderBrief | null>(null);
  const [website, setWebsite] = useState("");
  const [consent, setConsent] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [shareImportMessage, setShareImportMessage] = useState("");
  const [status, setStatus] = useState<Status>({
    kind: "idle",
    message:
      "Your quote list will be saved as one sourcing request with a reference number.",
  });
  const [accessDetails, setAccessDetails] = useState<{
    reference: string;
    accessCode: string;
  } | null>(null);
  const startedAt = useRef(0);

  function applyDraft(draft: QuoteRequestDraft) {
    setName(draft.name); setCompany(draft.company); setBuyerType(draft.buyerType); setMarket(draft.market); setChannel(draft.channel); setEmail(draft.email); setWhatsapp(draft.whatsapp);
    setContactPreferences(draft.contactPreferences); setProjectPath(draft.projectPath); setSampleQuantity(draft.sampleQuantity); setBulkQuantity(draft.bulkQuantity); setPreferredTradeTerm(draft.preferredTradeTerm);
    setDeliveryDestination(draft.deliveryDestination); setDeliveryTiming(draft.deliveryTiming); setExistingSole(draft.existingSole); setChangesRequired(draft.changesRequired); setTargetValues(draft.targetValues);
    setNdaRequired(draft.ndaRequired); setRequirements(draft.requirements); setAdaptationBrief(draft.adaptationBrief); setSourcingProgram(draft.sourcingProgram);
  }

  useEffect(() => {
    startedAt.current = Date.now();
    trackEvent("quote_builder_view");
    const params = new URLSearchParams(window.location.search);
    const requestedProgram = params.get("program") || "";
    const requestedResource = params.get("resource") || "";
    const requestedPath = params.get("path");
    const requestedConcept = params.get("concept") === "1";
    const sharedShortlist = params.get("shortlist");
    const timer = window.setTimeout(() => {
      const currentLines = readQuoteList();
      if (sharedShortlist !== null) {
        const codes = parseSharedQuoteCodes(sharedShortlist, products.map((product) => product.code));
        const merged = mergeSharedQuoteList(currentLines, codes, products);
        setLines(merged.lines);
        if (merged.imported) saveQuoteList(merged.lines);
        setShareImportMessage(codes.length
          ? (merged.imported ? `Imported ${merged.imported} shared style${merged.imported === 1 ? "" : "s"}; existing line details were preserved.` : "No new styles were imported; they are already listed or this quote list is full.")
          : "This shared link did not contain a valid catalogue style.");
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("shortlist");
        window.history.replaceState({}, "", `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
      } else setLines(currentLines);
      const savedDraft = readQuoteRequestDraft();
      if (savedDraft) {
        applyDraft(savedDraft);
        setDraftMessage("Unsubmitted form fields were restored in this browser tab.");
      }
      const savedFinderBrief = readProductFinderBrief();
      if (savedFinderBrief?.mode === "matched_shortlist") {
        setFinderBrief(savedFinderBrief);
        setBuyerType(buyerTypeFromFinder(savedFinderBrief.buyerChannel));
        setChannel((current) => current || salesChannelFromFinder(savedFinderBrief.buyerChannel));
      }
      if (/^[a-z0-9-]{1,80}$/.test(requestedProgram))
        setSourcingProgram(requestedProgram);
      else if (/^[a-z0-9-]{1,80}$/.test(requestedResource))
        setSourcingProgram(`resource-${requestedResource}`);
      if (
        ["base_style_adaptation", "technical_development"].includes(
          requestedPath || "",
        )
      )
        setProjectPath(requestedPath!);
      if (requestedConcept) {
        const concept = readPrivateLabelConcept();
        if (concept) {
          setProjectPath("base_style_adaptation");
          setAdaptationBrief({ intent: "private_label", artworkStatus: concept.artworkStatus, brandingPlacement: `${concept.placement}${concept.brandText ? `; brand text: ${concept.brandText}` : ""}`.slice(0, 300), colorDirection: "", packingLabeling: concept.notes });
          setRequirements((current) => current || `Buyer prepared a private-label concept for ${concept.styleCode}. The visual is retained by the buyer and remains a target pending factory feasibility and sample review.${concept.notes ? ` Notes: ${concept.notes}` : ""}`.slice(0, 1000));
        }
      }
      setDraftReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!draftReady || accessDetails) return;
    const timer = window.setTimeout(() => saveQuoteRequestDraft({ name, company, buyerType, market, channel, email, whatsapp, contactPreferences, projectPath, sampleQuantity, bulkQuantity, preferredTradeTerm, deliveryDestination, deliveryTiming, existingSole, changesRequired, targetValues, ndaRequired, requirements, adaptationBrief, sourcingProgram }), 250);
    return () => window.clearTimeout(timer);
  }, [draftReady, accessDetails, name, company, buyerType, market, channel, email, whatsapp, contactPreferences, projectPath, sampleQuantity, bulkQuantity, preferredTradeTerm, deliveryDestination, deliveryTiming, existingSole, changesRequired, targetValues, ndaRequired, requirements, adaptationBrief, sourcingProgram]);

  function clearLocalDraft() {
    clearQuoteRequestDraft(); applyDraft(EMPTY_QUOTE_REQUEST_DRAFT); setDraftMessage("Saved form fields were cleared. Your selected product list is unchanged.");
  }

  function updateLine(index: number, field: keyof QuoteLine, value: string) {
    const next = lines.map((line, lineIndex) =>
      lineIndex === index ? { ...line, [field]: value } : line,
    );
    setLines(next);
    saveQuoteList(next);
  }

  function removeLine(code: string) {
    const next = lines.filter((line) => line.code !== code);
    setLines(next);
    saveQuoteList(next);
    trackEvent("quote_list_remove", { styleCode: code });
  }

  const totalQuantity = useMemo(
    () =>
      lines.reduce(
        (sum, line) =>
          sum + (Number.parseInt(line.quantity.replace(/\D/g, ""), 10) || 0),
        0,
      ),
    [lines],
  );
  const technical = projectPath === "technical_development";
  const quoteReadiness = assessBuyerQuoteReadiness({
    company,
    buyerType,
    market,
    email,
    whatsapp,
    styleCode: lines.map((line) => line.code).join(", "),
    quantity: totalQuantity ? `${totalQuantity} pairs` : "",
    bulkQuantity,
    sampleQuantity,
    preferredTradeTerm,
    deliveryDestination,
    deliveryTiming,
    requirements,
    projectPath,
    adaptationBrief: technical ? undefined : adaptationBrief,
    items: lines,
  });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lines.length) {
      setStatus({
        kind: "error",
        message: "Add at least one product style before submitting.",
      });
      return;
    }
    if (!email.trim() && !whatsapp.trim()) {
      setStatus({
        kind: "error",
        message: "Provide an email address or WhatsApp number so we can reply.",
      });
      return;
    }
    if (preferredTradeTerm === "DDP_request" && !deliveryDestination.trim()) {
      setStatus({
        kind: "error",
        message:
          "Add the exact delivery destination before requesting a DDP review.",
      });
      return;
    }
    setStatus({ kind: "sending", message: "Saving your quote request…" });
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          company,
          buyerType,
          market: `${market}${channel ? ` / ${channel}` : ""}`,
          quantity:
            bulkQuantity ||
            (totalQuantity
              ? `${totalQuantity} pairs across ${lines.length} styles`
              : `${lines.length} styles; quantity to discuss`),
          email,
          whatsapp,
          requirements,
          website,
          consent,
          ...contactPreferences,
          styleCode: lines.map((line) => line.code).join(", "),
          styleLabel: lines
            .map((line) => `${line.code} — ${line.name}`)
            .join(" | "),
          context: "quote_list",
          sourcingProgram,
          finderBrief,
          page: `${window.location.pathname}${window.location.search}`,
          formStartedAt: startedAt.current,
          attribution: getAttribution(),
          projectPath,
          sampleQuantity,
          bulkQuantity,
          preferredTradeTerm,
          deliveryDestination,
          deliveryTiming,
          existingSole: technical ? existingSole : "",
          changesRequired: technical ? changesRequired : "",
          targetValues: technical ? targetValues : "",
          ndaRequired: technical ? ndaRequired : "No",
          adaptationBrief: technical ? EMPTY_ADAPTATION_BRIEF : adaptationBrief,
          items: lines.map(
            ({
              code,
              sourceModel,
              name: productName,
              quantity,
              colors,
              sizes,
              notes,
            }) => ({
              code,
              sourceModel,
              name: productName,
              quantity,
              colors,
              sizes,
              notes,
            }),
          ),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(
          result.message || "The quote request could not be saved.",
        );
      const details = {
        reference: result.reference,
        accessCode: result.accessCode || "",
      };
      setAccessDetails(details);
      if (details.accessCode)
        localStorage.setItem(
          "beiqiang_last_inquiry_access",
          JSON.stringify(details),
        );
      setStatus({
        kind: "success",
        message: `Quote request saved. Reference: ${result.reference}. Private status code: ${details.accessCode || "sent separately"}. Save both values.`,
      });
      trackEvent("quote_request_submit", {
        reference: result.reference,
        styleCount: lines.length,
        projectPath,
      });
      saveQuoteList([]);
      clearQuoteRequestDraft();
      setDraftMessage("The temporary form draft was cleared after successful submission.");
      clearProductFinderBrief();
      setFinderBrief(null);
      setLines([]);
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "The quote request could not be saved. Please use WhatsApp or email.",
      });
    }
  }

  return (
    <>
      <section className="quote-builder-hero">
        <p className="eyebrow">MULTI-STYLE B2B QUOTE REQUEST</p>
        <h1>Build one order brief across your shortlisted styles.</h1>
        <p>
          Add quantity, colors and sizes for each product. We will review
          availability, specifications, sample needs and commercial terms before
          confirming a quote.
        </p>
        <div className="quote-builder-steps">
          <span>01 Select styles</span>
          <span>02 Add order details</span>
          <span>03 Submit for review</span>
        </div>
      </section>
      <section className="section quote-builder-layout">
        <div className="quote-lines">
          <div className="quote-section-heading">
            <div>
              <p className="eyebrow">YOUR QUOTE LIST</p>
              <h2>
                {lines.length
                  ? `${lines.length} selected ${lines.length === 1 ? "style" : "styles"}`
                  : "No styles selected yet"}
              </h2>
            </div>
            <Link className="text-link" href="/products/">
              Browse all products <span aria-hidden="true">→</span>
            </Link>
          </div>
          <QuoteListShare lines={lines} importMessage={shareImportMessage} />
          {lines.length ? (
            lines.map((line, index) => (
              <article className="quote-line" key={line.code}>
                <img src={line.image} alt={`${line.code} ${line.name}`} />
                <div className="quote-line-copy">
                  <small>
                    {line.code} / {line.sourceModel}
                  </small>
                  <h3>{line.name}</h3>
                  <Link href={`/products/${line.slug}/`}>
                    Review product evidence
                  </Link>
                </div>
                <div className="quote-line-fields">
                  <label>
                    Expected pairs
                    <input
                      inputMode="numeric"
                      value={line.quantity}
                      onChange={(event) =>
                        updateLine(index, "quantity", event.target.value)
                      }
                      placeholder="e.g. 300"
                    />
                  </label>
                  <label>
                    Colors
                    <input
                      value={line.colors}
                      onChange={(event) =>
                        updateLine(index, "colors", event.target.value)
                      }
                      placeholder="e.g. black, white"
                    />
                  </label>
                  <label>
                    Sizes / ratio
                    <input
                      value={line.sizes}
                      onChange={(event) =>
                        updateLine(index, "sizes", event.target.value)
                      }
                      placeholder="e.g. EU 39-45"
                    />
                  </label>
                  <label>
                    Line note
                    <input
                      value={line.notes}
                      onChange={(event) =>
                        updateLine(index, "notes", event.target.value)
                      }
                      placeholder="Packing or change request"
                    />
                  </label>
                </div>
                <button
                  className="quote-remove"
                  type="button"
                  onClick={() => removeLine(line.code)}
                  aria-label={`Remove ${line.code}`}
                >
                  Remove
                </button>
              </article>
            ))
          ) : (
            <div className="quote-empty">
              <p>
                Use “Add to quote” in the catalogue or on a product page. Your
                shortlist stays on this device until you submit or remove it.
              </p>
              <Link className="button" href="/products/">
                Choose products
              </Link>
            </div>
          )}
        </div>

        <form
          className="quote-request-form"
          onSubmit={submit}
          onFocus={() => {
            if (!startedAt.current) startedAt.current = Date.now();
          }}
        >
          <div>
            <p className="eyebrow eyebrow-light">BUYER &amp; PROJECT DETAILS</p>
            <h2>
              Give us enough information for the next commercial decision.
            </h2>
            {sourcingProgram && (
              <p className="quote-program-origin">
                Started from: {sourcingProgram.replaceAll("-", " ")}
              </p>
            )}
          </div>
          <BuyerQuoteReadiness readiness={quoteReadiness} />
          <div className="quote-draft-notice"><p><strong>{draftMessage || "Draft protection is active in this tab."}</strong><span>Unsubmitted form fields stay in this browser tab only, are not sent to Beiqiang, and are cleared after successful submission or when the tab session ends.</span></p><button type="button" onClick={clearLocalDraft}>Clear saved form fields</button></div>
          {finderBrief && (() => {
            const labels = finderBriefLabels(finderBrief);
            return <section className="finder-brief-handoff" aria-label="Imported product finder brief">
              <div><p className="eyebrow">IMPORTED SOURCING BRIEF</p><h3>Your shortlist context is ready for review.</h3></div>
              <dl><div><dt>Buyer / channel</dt><dd>{labels.buyer}</dd></div><div><dt>Product direction</dt><dd>{labels.priority}</dd></div><div><dt>Closure</dt><dd>{labels.closure}</dd></div><div><dt>Candidate styles</dt><dd>{finderBrief.styleCodes.join(", ")}</dd></div></dl>
              <p>This is your stated sourcing target and an automated catalogue shortlist—not confirmation of sales, stock, price or factory feasibility. Buyer type and sales channel below remain editable.</p>
              <button type="button" onClick={() => { clearProductFinderBrief(); setFinderBrief(null); }}>Remove imported brief</button>
            </section>;
          })()}
          <fieldset>
            <legend>1. Project path</legend>
            <label className="radio-card">
              <input
                type="radio"
                name="path"
                value="base_style_adaptation"
                checked={!technical}
                onChange={(event) => setProjectPath(event.target.value)}
              />
              <span>
                <strong>Existing style adaptation</strong>
                <small>
                  Start from a Beiqiang product code and discuss colors,
                  branding, labeling or packing.
                </small>
              </span>
            </label>
            <label className="radio-card">
              <input
                type="radio"
                name="path"
                value="technical_development"
                checked={technical}
                onChange={(event) => setProjectPath(event.target.value)}
              />
              <span>
                <strong>Technical product development</strong>
                <small>
                  New last, tooling, sole, hardness, material system, test
                  target, NDA or tech pack.
                </small>
              </span>
            </label>
            <p className="technical-gate-note path-gate-note">
              Buyer target values are reviewed as development requirements. They
              become confirmed production specifications only after factory and
              component-supplier approval.
            </p>
          </fieldset>
          <fieldset className="form-grid">
            <legend>2. Buyer information</legend>
            <label>
              Contact name
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
              />
            </label>
            <label>
              Company
              <input
                required
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                maxLength={160}
              />
            </label>
            <label>
              Buyer type
              <select
                value={buyerType}
                onChange={(event) => setBuyerType(event.target.value)}
              >
                <option>Importer / wholesaler</option>
                <option>Amazon / TikTok seller</option>
                <option>Brand / private label</option>
                <option>Sourcing agent</option>
              </select>
            </label>
            <label>
              Target country / market
              <input
                required
                value={market}
                onChange={(event) => setMarket(event.target.value)}
                maxLength={120}
              />
            </label>
            <label>
              Sales channel
              <input
                value={channel}
                onChange={(event) => setChannel(event.target.value)}
                maxLength={100}
                placeholder="Wholesale, Amazon, retail chain…"
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={180}
              />
            </label>
            <label>
              WhatsApp
              <input
                value={whatsapp}
                onChange={(event) => setWhatsapp(event.target.value)}
                maxLength={80}
              />
            </label>
            <label>
              Sample quantity
              <input
                value={sampleQuantity}
                onChange={(event) => setSampleQuantity(event.target.value)}
                maxLength={80}
                placeholder="Pairs / sizes needed"
              />
            </label>
            <label>
              Estimated bulk quantity
              <input
                value={bulkQuantity}
                onChange={(event) => setBulkQuantity(event.target.value)}
                maxLength={80}
                placeholder="Total or per style"
              />
            </label>
          </fieldset>
          <ContactPreferenceFields
            value={contactPreferences}
            onChange={setContactPreferences}
            legend="3. Response preferences (optional)"
          />
          <fieldset className="form-grid logistics-fields">
            <legend>4. Delivery and trade-term preference</legend>
            <label>
              Preferred starting point
              <select
                value={preferredTradeTerm}
                onChange={(event) => setPreferredTradeTerm(event.target.value)}
              >
                <option value="not_sure">Not sure — please advise</option>
                <option value="EXW">EXW</option>
                <option value="FOB">FOB — named loading port</option>
                <option value="FCA">FCA — named carrier/place</option>
                <option value="DDP_request">Request DDP review</option>
              </select>
            </label>
            <label>
              Delivery destination
              <input
                required={preferredTradeTerm === "DDP_request"}
                value={deliveryDestination}
                onChange={(event) => setDeliveryDestination(event.target.value)}
                maxLength={240}
                placeholder="Country, city/port, postal code or FBA code"
              />
            </label>
            <label className="form-full">
              Requested delivery timing
              <input
                value={deliveryTiming}
                onChange={(event) => setDeliveryTiming(event.target.value)}
                maxLength={160}
                placeholder="Required arrival window or urgency; subject to confirmation"
              />
            </label>
            <p className="technical-gate-note form-full">
              Product price and freight remain separate unless the written
              quotation states otherwise. A DDP request needs destination,
              quantity and confirmed packing data; customs clearance, duty, tax
              and local delivery are not promised before forwarder confirmation.
            </p>
            <Link className="text-link form-full" href="/buyer-guide/">
              Review trade-term and buying guide →
            </Link>
          </fieldset>
          {technical && (
            <fieldset className="form-grid technical-fields">
              <legend>5. Technical development gate</legend>
              <label>
                Existing sole acceptable?
                <select
                  value={existingSole}
                  onChange={(event) => setExistingSole(event.target.value)}
                >
                  <option>Unsure / discuss first</option>
                  <option>Yes, if sample is acceptable</option>
                  <option>No, new tooling may be required</option>
                </select>
              </label>
              <label>
                NDA / tech pack required?
                <select
                  value={ndaRequired}
                  onChange={(event) => setNdaRequired(event.target.value)}
                >
                  <option>No</option>
                  <option>Yes</option>
                </select>
              </label>
              <label className="form-full">
                Changes required
                <textarea
                  value={changesRequired}
                  onChange={(event) => setChangesRequired(event.target.value)}
                  maxLength={1200}
                  rows={3}
                  placeholder="Upper, last, sole, hardness, material, branding, packing…"
                />
              </label>
              <label className="form-full">
                Buyer target values / test requirements
                <textarea
                  value={targetValues}
                  onChange={(event) => setTargetValues(event.target.value)}
                  maxLength={1600}
                  rows={3}
                  placeholder="State target, tolerance and measurement method if known. Targets are not confirmed capabilities until reviewed."
                />
              </label>
            </fieldset>
          )}
          {!technical && <AdaptationBriefFields value={adaptationBrief} onChange={setAdaptationBrief} />}
          <fieldset className="form-grid">
            <legend>6. Other requirements</legend>
            <label className="form-full">
              Order context
              <textarea
                value={requirements}
                onChange={(event) => setRequirements(event.target.value)}
                maxLength={3000}
                rows={4}
                placeholder="Packing, labeling, reference links or other questions…"
              />
            </label>
          </fieldset>
          <label className="form-honeypot" aria-hidden="true">
            Website
            <input
              tabIndex={-1}
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </label>
          <label className="quote-consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              required
            />
            <span>
              I agree that Beiqiang may use these details to review and respond
              to this B2B sourcing request.
            </span>
          </label>
          <button
            className="button button-light"
            type="submit"
            disabled={status.kind === "sending" || status.kind === "success"}
          >
            {status.kind === "sending"
              ? "Saving request…"
              : status.kind === "success"
                ? "Request saved"
                : "Submit quote request"}
          </button>
          <p
            className={`quote-status quote-status-${status.kind}`}
            aria-live="polite"
          >
            {status.message}
          </p>
          {accessDetails?.accessCode && (
            <>
              <Link
                className="inquiry-status-link inquiry-status-link-light"
                href="/inquiry-status/"
              >
                Check this request status →
              </Link>
              <InquiryAttachmentUploader
                reference={accessDetails.reference}
                accessCode={accessDetails.accessCode}
                tone="light"
              />
            </>
          )}
        </form>
      </section>
    </>
  );
}
