import type { Metadata } from "next";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

export const metadata: Metadata = {
  title: "Privacy Notice | Beiqiang Footwear",
  description:
    "How Beiqiang Footwear handles B2B sourcing inquiries, uploaded buyer files and optional first-party website analytics.",
  alternates: {
    canonical: "https://www.beiqiang.online/privacy/",
    languages: {
      en: "https://www.beiqiang.online/privacy/",
      "zh-CN": "https://www.beiqiang.online/zh/privacy/",
      "x-default": "https://www.beiqiang.online/privacy/",
    },
  },
};

export default function PrivacyPage() {
  return (
    <main>
      <SiteHeader />
      <section className="legal-hero">
        <p className="eyebrow">PRIVACY NOTICE</p>
        <h1>Clear handling of sourcing information.</h1>
        <p>
          Effective 27 August 2026. This notice explains the website practices
          of Quanzhou Beiqiang Footwear &amp; Apparel Co., Ltd. It does not
          claim certification under any privacy framework and should be reviewed
          as laws and operations change.
        </p>
      </section>
      <article className="legal-content">
        <section>
          <h2>What we collect</h2>
          <p>
            When you request the line sheet or submit a B2B inquiry, we collect
            the contact, company, market, product direction, quantity,
            requirements and consent information you provide. If you upload
            buyer files, we store the file, its name, type, size and upload time
            with the inquiry. Private inquiry-thread messages, buyer-facing
            documents supplied by Beiqiang, product shortlists prepared for the
            inquiry and your selected styles or replacement criteria, structured
            sample-project status and buyer sample responses, quotation
            decisions and revision targets, buyer order-setup requests, order
            handoff and buyer-safe fulfillment updates are stored with the same
            record. A sample review round can store its physical sample
            reference, products, purpose, supplied deliverables, review scope,
            acceptance criteria, exclusions, decision, note and timestamps so
            later rounds do not overwrite earlier evidence. Quotation revision
            targets can include affected styles, price or quantity direction,
            trade term, delivery timing, payment, packing, labeling and sample
            requests. An order-setup request can include the legal purchasing
            company, purchasing contact, preferred formal-order channel, buyer
            PO reference, destination, requested timing and instructions you
            supply. The server also creates a request identifier and a shortened
            daily hash derived from the connection address for security and
            troubleshooting.
          </p>
        </section>
        <section>
          <h2>Why we use it</h2>
          <p>
            We use this information to review product fit, prepare a focused
            product shortlist, recognize possible repeat business relationships,
            discuss samples, prepare quotations and formal order documents,
            answer sourcing questions, record agreed payment milestones and
            fulfillment progress, prevent abuse and manage the inquiry-to-order
            process. For a confirmed order, the website can retain accepted
            order versions, proposed critical changes, the business reason,
            changed fields, buyer decision, buyer-notification delivery status
            and operational update history so a later edit does not silently
            overwrite the earlier record. It can also store structured
            fulfillment exceptions, buyer acknowledgement or revision requests,
            delivery receipt confirmations, reported delivery issues and
            resolution notes. Receipt confirmation is an operational record only
            and does not waive hidden-defect or contractual rights. We may email
            the inquiry contact when a confirmed-order change or fulfillment
            exception requires a buyer decision; the email links to the private
            status lookup but does not include the private access code.
            Repeat-relationship signals are reviewed by authorized staff and do
            not automatically merge records or confirm identity. A shortlist
            choice records product interest only. We do not use it or an
            uploaded technical target as proof that Beiqiang can achieve
            unconfirmed requirements, and an order-setup request does not
            automatically create or confirm an order.
          </p>
        </section>
        <section>
          <h2>Repeat-order and next-project records</h2>
          <p>
            After shipment, a buyer can submit a private next-project request
            containing the source order reference, product codes, indicative
            quantity, purchase window, destination, requested timing, changes
            and other sourcing requirements. We store its status, owner, next
            action, due date, history and any linked new inquiry or formal-order
            reference so the opportunity is not lost between conversations. We
            may send an internal notification and a buyer receipt. A
            next-project request is not a purchase order, accepted price, stock
            confirmation or production authorization, and earlier commercial
            terms do not automatically carry forward.
          </p>
        </section>
        <section>
          <h2>Buyer workspace access</h2>
          <p>
            If you request a buyer-workspace link, we normalize and hash the
            submitted email for request limiting, check it against primary
            inquiry emails and active project-specific contact authorizations,
            and send a one-time link only when a matching record exists. The
            public response does not reveal whether an address exists. The
            one-time token expires after 15 minutes and is marked used when
            redeemed; the resulting random browser-session token expires after
            eight hours and is stored in session storage on that browser. An
            authorized Beiqiang user may add a purchasing, merchandising,
            operations, finance, management, sourcing-agent or other verified
            contact only after recording the authorization basis. A verified
            project holder may also submit a colleague-access request containing
            the colleague&apos;s name, business email, role and stated purpose.
            The request is stored with the project and may be notified to
            Beiqiang, but it never grants access automatically. Beiqiang
            separately verifies the request and may approve or reject it. We
            retain the request, review status, contact authorization,
            grant/revocation actor, reason, timestamps and notification outcome
            as an audit record. Revocation removes that project from future
            workspace reads, including an existing session, but does not change
            any quotation, sample or formal order. The workspace shows only
            buyer-safe summaries for records where the email is the primary
            inquiry contact or an active delegated contact. Project decisions,
            prices, messages and private files continue to require that
            project&apos;s separate access code.
          </p>
          <p>
            To operate and secure this requested service, we record limited
            workspace events such as access-request outcome, link redemption,
            successful workspace load, project-summary opening, handoff to the
            private project page and explicit sign-out. These operational
            records use a one-way email hash and, where needed, the inquiry
            reference. They do not contain the email address, one-time link
            token, session token, project access code, price, file contents or
            message text. Authorized staff can view aggregated 7-, 30- or 90-day
            counts to diagnose email delivery and workspace adoption. These
            necessary service and security events are separate from optional
            marketing analytics.
          </p>
        </section>
        <section>
          <h2>Optional first-party analytics</h2>
          <p>
            If you choose “Accept analytics,” the site records limited events
            such as product and collection view, comparison,
            collection-to-product opening, buying-team share channel, quote-list
            action, sourcing-resource view, collection or resource handoff to a
            quote request, line-sheet request/download and contact click,
            together with campaign parameters, landing page and referrer.
            Collection events contain only a fixed collection identifier,
            product style code where relevant and the fixed action type. A share
            event contains the style code and channel type, not the recipient,
            email address, message contents or address-book data. If you choose
            “Essential only,” these optional events and first-touch attribution
            are not stored. The consent preference itself is stored on your
            device.
          </p>
        </section>
        <section>
          <h2>Device storage</h2>
          <p>
            The quote shortlist and most recent inquiry access values may be
            stored on your device so you can continue the request. A
            multi-style quote form also keeps an unfinished, bounded draft in
            the current browser tab so accidental refresh or navigation does
            not erase buyer, project, shipping or technical fields. That draft
            is not sent to Beiqiang until you submit the form, is cleared after
            successful submission, can be cleared from the form and ends with
            the browser-tab session. Consent, anti-spam fields and private
            inquiry access codes are not included in that draft. A
            buyer can create a team-review link for a quote shortlist. That
            link contains only up to 12 valid catalogue style codes. It does
            not include per-style quantities, colors, sizes, notes, price,
            contact, company, project or access-code data. Opening the link
            merges valid styles into the recipient&apos;s device shortlist without
            overwriting existing line details; the shortlist parameter is then
            removed from the visible browser address. A
            buyer-workspace session token is stored only in browser session
            storage and is removed when you close the workspace, clear site data
            or the browser session ends. Do not use a shared device for
            confidential inquiry access. You can clear these values through
            browser site-data controls.
          </p>
        </section>
        <section>
          <h2>B2B product finder</h2>
          <p>
            Buyer-channel, product-direction, closure and shortlist-size choices
            are evaluated in the current browser. When the buyer explicitly
            adds all matched products to the quote list, or explicitly requests
            a human shortlist review, a limited summary of buyer channel,
            product direction, closure preference and up to four candidate
            style codes is stored on that device. A human-review request may
            contain no candidate code when the filters conflict, so the site
            does not force an unsupported recommendation. The summary is
            submitted only if the buyer sends the quote or human-review request,
            and can be removed before submission. If optional analytics are accepted, the site may record the
            fixed finder action, bounded result style codes and result count; it
            does not record the choice labels as a buyer profile. Products enter
            device storage only when the buyer explicitly adds them to the quote list.
            A human-review submission creates a sourcing inquiry, not an order,
            price, stock, feasibility or product-capability confirmation.
          </p>
        </section>
        <section>
          <h2>Private-label concept studio</h2>
          <p>
            Logo or reference-image files selected in the concept studio are
            read and rendered locally in your browser. They are not uploaded by
            that page or included automatically in an inquiry. The device may
            retain a limited text summary containing the selected product code,
            intended placement, artwork readiness, brand text and buyer notes
            so these targets can be carried into the quote builder. The buyer
            must separately upload the downloaded concept through the protected
            project if Beiqiang needs to review the visual file.
          </p>
        </section>
        <section>
          <h2>Sharing and transaction platforms</h2>
          <p>
            Inquiry data is used by authorized Beiqiang personnel and relevant
            production or logistics participants only when needed for the
            sourcing project. A company contact explicitly authorized for one
            project can receive that project&apos;s buyer-safe workspace
            summary; company-name similarity, an email-domain match or a
            repeat-buyer signal does not grant access automatically. When an
            order is handled through Alibaba Trade Assurance, Alibaba.com
            processes that order under its own terms and privacy practices.
          </p>
        </section>
        <section>
          <h2>Security and buyer files</h2>
          <p>
            Buyer status uses a private access code whose hash is stored by the
            server. Internal inquiry access uses a separate administrator token.
            New buyer uploads are treated as untrusted and quarantined by
            default. The website checks allowed file type, declared size and
            stored metadata, but it does not run a malware scanner. Authorized
            staff must use an approved isolated offline review process before
            recording a file as reviewed. That status records an operating
            review; it is not a guarantee that a file is malware-free.
            Authorized staff may revoke or restore website access to a buyer
            upload or buyer-facing document when a version is wrong, unsafe or
            no longer current. Revocation blocks website download but does not
            itself delete the stored file. No internet system can be guaranteed
            completely secure.
          </p>
        </section>
        <section>
          <h2>Retention review and deletion</h2>
          <p>
            Records should be retained only while needed for the sourcing
            relationship, dispute handling and applicable contractual,
            accounting or business-record duties. An authorized user can
            schedule a review date or place a retention hold for an order,
            payment, dispute, shipment, claim, security or other reviewed
            reason. A review date does not automatically delete anything, and an
            active hold blocks website deletion. A verified deletion request
            requires a different named approver, a separate protected deletion
            authorization, a recorded retention assessment and at least a
            24-hour cooling-off period before execution. The system leaves a
            minimal deletion receipt without the buyer email, file names, file
            contents, access codes or message text.
          </p>
          <p>
            Website deletion is limited to the inquiry record, associated
            website files, access records and matching first-party website
            events held by this website. It does not erase records held in
            Alibaba Trade Assurance, signed contracts, accounting systems,
            logistics systems, dispute records or other external systems that
            may need to remain under their own terms or applicable obligations.
          </p>
        </section>
        <section>
          <h2>Your request</h2>
          <p>
            To ask about, correct or request deletion of website inquiry
            information, email{" "}
            <a href="mailto:421345308@qq.com">421345308@qq.com</a> and include
            the inquiry reference. We may request reasonable identity or
            authority verification and assess active orders, disputes, claims
            and record-retention duties before changing or deleting a record.
          </p>
        </section>
        <section>
          <h2>Response preferences and external contact records</h2>
          <p>
            If you optionally provide a preferred reply channel, response
            language, time zone/city or convenient local contact time, we store
            it with the sourcing inquiry to plan a human response. An authorized
            salesperson may also append a channel, direction, actual time,
            outcome, responsible person and concise evidence summary for
            relevant email, WhatsApp, Alibaba, phone, video-call or other
            external project communication. These manual records support project
            continuity and follow-up review; they do not prove delivery, email
            opening, identity, agreement, payment or an order, and they do not
            create an appointment or automatic reply.
          </p>
        </section>
        <section>
          <h2>Existing-style adaptation brief</h2>
          <p>
            For an existing-style or private-label request, we may store the
            buyer&apos;s selected project intent, logo-artwork readiness,
            requested branding placement, color or material direction, and
            packing or labeling target. These fields record what the buyer wants
            reviewed. They do not prove manufacturing feasibility, approve
            artwork, transfer intellectual-property rights, or confirm price,
            MOQ, sample result, production specification or timing.
          </p>
        </section>
        <section>
          <h2>Sample feasibility requests</h2>
          <p>
            From a private project page, a buyer may submit the associated style
            codes, requested sample type and quantity, sizes, colors, evaluation
            purpose, customization target, acceptance focus, indicative bulk
            quantity, destination country and city, courier-account
            availability, and requested timing. We store the request, review
            status, timestamps, buyer-safe review note and any linked sample
            reference with the inquiry so Beiqiang can assess feasibility and
            written commercial terms. Full street addresses, courier credentials
            and payment information should not be entered in this form.
          </p>
        </section>
        <section>
          <h2>Protected order-preparation packets</h2>
          <p>
            After an accepted quotation and order-setup request, a verified
            project holder may submit the legal billing company, registered
            country, invoice email, billing and shipping addresses, consignee
            and contact, importer direction, planned shipping mode, requested
            commercial documents, buyer PO reference, selected
            inquiry-attachment identifiers and notes. The full packet is
            available only through the private project access and protected
            administrator record. Sales notification email contains a limited
            summary and linked file names, not the full street addresses or
            access code. Packet versions and human review notes are retained
            with the inquiry so corrections do not silently overwrite earlier
            buyer evidence.
          </p>
        </section>
        <section>
          <h2>Pre-order written confirmation drafts</h2>
          <p>
            After human review of the latest protected packet, Beiqiang may
            issue a versioned eight-item draft covering product specification,
            sample decision, quantity and size ratio, colors and materials,
            packing and labeling, price and trade term, payment terms and
            delivery window. We store the issued version, buyer decision,
            selected revision fields, buyer note, timestamps and limited email
            delivery outcomes with the inquiry. Earlier versions remain
            preserved. The private buyer page does not expose the issuing
            employee or internal notification fields. Draft acceptance is a
            mismatch-prevention record, not a purchase order, invoice, payment
            authorization or permission to start production.
          </p>
        </section>
        <section>
          <h2>Sourcing meeting requests</h2>
          <p>
            A verified project holder may submit a meeting purpose, preferred
            channel, time zone or city, two or three proposed local times,
            agenda, attendee roles and preferred language. We store the request,
            review status, confirmed time and channel, approved meeting link
            where used, buyer-safe notes, notification outcome, a bounded
            history of calendar-file download timestamps, buyer reschedule or
            cancellation requests, their proposed times and reasons, human
            review decisions, earlier confirmed schedules and factual completion
            summary with the inquiry. Beiqiang reviews every request manually;
            the form does not create a calendar event or guarantee attendance or
            language support. Download timestamps support operational follow-up
            and do not reveal calendar contents or prove attendance. A change
            request does not alter the confirmed meeting until Beiqiang approves
            it.
          </p>
        </section>
      </article>
      <SiteFooter />
    </main>
  );
}
