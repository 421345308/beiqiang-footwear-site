# Beiqiang B2B Footwear Site

Public B2B lead-generation site for Quanzhou Beiqiang Footwear & Apparel Co., Ltd. The production URL is `https://www.beiqiang.online/`. The site is designed to turn product discovery into qualified sample and quotation inquiries; it is not a retail checkout store.

A clean full-stack starter running on
[vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and
Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

## Production Deployment: GitHub to EdgeOne

- Private repository: `421345308/beiqiang-footwear-site`
- Production branch: `main`
- EdgeOne project: `beiqiang-footwear` (`makers-zsvtdpeh3qf1`)
- Framework preset: `Eleventy` (pure-static deployment path)
- Root directory: `edgeone-deploy`
- Install command: `npm ci --prefix ..`
- Build command: `npm run build`
- Output directory: `dist`

`edgeone-deploy/` is a deployment adapter, not a second application. It runs the root `edgeone:build` script and copies `edgeone-export-v1` into `edgeone-deploy/dist`. Keep the EdgeOne root directory on `edgeone-deploy`; pointing it back to the repository root causes EdgeOne to load a Next/OpenNext server adapter and look for `.next/required-server-files.json`, which this static export does not need.

## Change and Release Checklist

1. Tie the change to a sales outcome: discovery, trust, qualification, contact, follow-up, sample, quotation, or order.
2. Use only verified product facts and assets from the Beiqiang workspace.
3. Work on a `codex/*` branch, confirm Node.js `>=22.13.0`, and run `npm test` plus `npm run edgeone:build`.
4. Review the diff for product accuracy, contact details, links, mobile behavior, SEO, and unsupported claims.
5. Merge or push to `main`; EdgeOne deploys automatically.
6. Verify the deployment preview and then `https://www.beiqiang.online/`, including changed pages and every contact CTA.
7. Record the commit, deployment result, KPI hypothesis, and any follow-up in the operations archive.

Release authorization recorded on 23 August 2026: after the automated test, EdgeOne export, lint and diff checks pass, Codex may commit and push Beiqiang website changes directly to GitHub `main` without requesting a separate approval each time. Production-domain verification and rollback discipline remain mandatory.

For rollback, revert the problem commit and redeploy, or select the previous successful EdgeOne deployment. Do not use destructive resets on unreviewed local work.

## Inquiry Storage and Notification

The production form posts to `/api/inquiries`. EdgeOne Cloud Functions persist each validated inquiry in the `beiqiang-inquiries` Blob store before returning success. Conversion events are written to the separate `beiqiang-events` store. Blob storage is provided by EdgeOne Makers and does not require a database connection string.

Email notification is optional until these EdgeOne Production environment variables are configured. Never commit the QQ authorization code to GitHub:

- `SMTP_HOST=smtp.qq.com`
- `SMTP_PORT=465`
- `SMTP_SECURE=true`
- `SMTP_USER=421345308@qq.com`
- `SMTP_PASS=<QQ mailbox SMTP authorization code>`
- `SMTP_FROM=421345308@qq.com`
- `INQUIRY_NOTIFY_TO=421345308@qq.com`

After changing environment variables, create a new deployment because existing deployments do not inherit later environment changes. Test with a clearly marked internal inquiry and confirm both the on-page reference number and the received email.

## Buying-Brief Readiness

- The protected inquiry dashboard computes an internal `0–100` buying-brief readiness score from the information already supplied by the buyer: contact route, company/buyer context, target market, product reference, per-style details, bulk and sample quantity, trade-term preference, destination, timing and requirements.
- The result is classified as `Ready for commercial review`, `Qualification needed` or `Early / incomplete brief`. Cards show the most important missing questions, and the ledger can filter or sort by readiness.
- The pipeline CSV includes score, level and qualification gaps so the same triage can be used outside the browser.
- This is a deterministic completeness check, not AI buyer profiling, fraud detection, credit scoring, conversion probability or an automatic rejection rule. Sales must still verify the buyer, product evidence and every commercial term.

## Structured Sample Validation

- The protected dashboard stores one structured sample project on the inquiry: physical sample reference, exact style code(s), pair/size/color allocation, purpose, supplied deliverables, written review scope, acceptance criteria, explicit exclusions, sample charge status, courier/tracking, shipment and expected-delivery dates, buyer-safe note and append-only stage history.
- Sample stages are `brief requested`, `terms confirmed`, `awaiting sample payment`, `preparing`, `shipped`, `delivered`, `buyer review`, `buyer approved`, `revision requested` and `closed`.
- Shipped and later review stages require the actual courier, tracking reference and shipment date. A sample charge marked paid requires its actual recorded date. These website fields remain operating records, not courier or bank evidence.
- Sales cannot manufacture `buyer approved` or `revision requested` through the admin update. Only a buyer authenticated by inquiry reference plus private access code can respond while the sample is explicitly at `buyer review`; the response appends a buyer-authored history event and can notify the business inbox.
- Opening buyer review freezes an immutable review round. Buyer approval is written to that exact physical reference, deliverables, scope and criteria; revisions can create a later round without overwriting earlier decisions. Approval does not automatically approve exclusions, bulk materials, test values, size ratio, price, MOQ, packing, lead time, payment or a production order.

### Inquiry admin access

- Internal route: `/admin/inquiries/`
- Required production variable: `INQUIRY_ADMIN_TOKEN`
- Permanent website-record approval and execution additionally require `INQUIRY_DELETE_TOKEN`. It must be a separate high-entropy secret, must not equal `INQUIRY_ADMIN_TOKEN`, and should be held by an independent approver rather than ordinary sales users.
- The token is only an access key for the internal inquiry ledger. It is not a customer password, SMTP password, or GitHub credential.
- The browser sends the entered token to `/api/admin/inquiries`; the API checks it before reading the `beiqiang-inquiries` Blob store.
- Never put the token in source code, screenshots, GitHub, email copy, or buyer-facing pages. Rotate the EdgeOne environment variable if it is exposed, then redeploy.
- Store both secrets only in the EdgeOne production environment. Without a separate deletion token, review dates and retention holds still work, but deletion approval and execution intentionally return an unavailable response.

## Product Catalogue Data Flow

The public catalogue is data-driven. `app/data/products.ts` is the single website source for product code, source model, title, group, closure, upper direction, size direction, colors, buyer fit, evidence notes and pre-quotation confirmations.

Current public structure:

- `/products/`: searchable catalogue of 30 documented product packages.
- `/products/bq001/` through `/products/bq030/`: product-specific evidence and inquiry pages.
- `/collections/wide-toe-box/`: verified wide toe box styles only.
- `/collections/knit-slip-on/`: easy-on knit/textile styles.
- `/collections/breathable-lace-up/`: knit, mesh and textile lace-up styles.

## Product Comparison and Internal-Tier Boundary

- Buyers can select 2–4 styles on `/products/` and compare documented product group, closure, upper, sole direction, size direction, colors, buyer fit, evidence-led highlights and confirmation items.
- The comparison can add all shortlisted styles to the device-local quote list. Existing styles are not duplicated, and the 12-style limit is enforced before reporting success.
- `product_compare` is sent only after optional analytics consent. The protected product-signal table separates views, comparisons, successful quote-list additions and saved inquiries.
- `tier` remains an internal product-data field. Public cards and detail pages show buyer-relevant facts instead; never expose Tier A–E as a quality, popularity or certification signal.

## 30-Style Line Sheet Lead Path

- `/line-sheet/` explains the buyer value of the current English line sheet and collects company, market, buyer type, product direction, quantity and a reply channel before revealing the PDF download.
- The request is saved through the existing inquiry service with `context: line_sheet` and `styleCode: CATALOG-2026`, so it receives a reference, private status code, SMTP notification and protected-pipeline record.
- `line_sheet_request` and `line_sheet_download` respect optional analytics consent. The admin dashboard reports line-sheet leads and consented PDF downloads separately from sourcing inquiries.
- The current PDF contains 30 products across 8 A4 pages and is generated from `app/data/products.ts`; run `npm run line-sheet:build` after product-data changes, then render and visually inspect every page.
- The website copy lives at `public/downloads/beiqiang-footwear-line-sheet-2026.pdf`; the reviewed operating copy lives at `output/pdf/beiqiang-footwear-line-sheet-2026.pdf`. They must have identical hashes.
- This is a soft conversion gate, not confidential-document access control. Never include internal prices, supplier details, customer information, internal tiers or confidential technical files.

## Buyer Relationship Memory

- The protected inquiry dashboard derives repeat-account signals from exact valid email, normalized WhatsApp digits and normalized company name. Generic, invalid and weak values are ignored.
- Relationship groups are computed in the admin browser after authorized records load. They do not create a new public endpoint, write a buyer identity profile or expose one buyer's history to another buyer.
- The dashboard shows related references, stages, dates, style codes and match basis, and can filter repeat-account records. The pipeline CSV adds a non-PII relationship ID, related-record count and match basis.
- Matching is advisory only. Shared companies, contacts and phone numbers can produce false positives. Verify the buyer before reusing any specification, quotation, document, payment or order context.
- Records are never automatically merged, deleted or overwritten; immutable quotation and transaction evidence remains attached to its original inquiry.

## Stage-Aware Buyer Reply Starters

- Each protected buyer-message thread offers five English draft starters: qualification, sample details, quotation review, no-reply follow-up and order next step.
- The current pipeline stage recommends one starter, but no template is sent automatically. Loading a template only fills an empty editor; it will not overwrite an existing draft.
- Technical-development qualification text keeps buyer targets separate from confirmed capability. Quotation text says acceptance is not an order; order text directs payment to the verified Alibaba Trade Assurance or agreed contract channel.
- Every starter remains under the 2,000-character message limit and avoids final price, MOQ, stock, lead-time, certification, payment and order promises.
- Sales must verify buyer identity, product facts, quotation version and one clear next action before using `Save & notify buyer`.

## Printable Product Sourcing Sheets

- Every `/products/bq001/` through `/products/bq030/` page includes `Print / save product sheet`. The browser print dialog can print the sheet or save it as a PDF for an internal buying review.
- The single-page sheet uses the same record in `app/data/products.ts` as the public page: style code, source model, product group, closure, upper and sole directions, size direction, documented colors, buyer fit, evidence-led highlights and confirmation items.
- It is deliberately labelled `Sourcing review — not a quotation`. Price, MOQ, availability, exact materials, size ratio, packing, lead time, tests and trade terms remain subject to written project confirmation.
- `product_spec_sheet_print` is recorded only after optional analytics consent. The protected dashboard reports total product-sheet actions and a per-style `Sheets` count, helping sales identify products that reached internal buyer review.
- When product data changes, update `app/data/products.ts` and rebuild; there is no separate product-sheet database or manual PDF that can silently drift from the web page.

## B2B Buyer Guide and Shipping-Ready Brief

- `/buyer-guide/` explains the six decisions from shortlist and project brief through sample review, written quotation, verified order channel and fulfillment handover.
- The page gives conservative starting-point explanations for `EXW`, `FOB`, `FCA` and a `DDP quote request`. It separates product price from freight, duty, tax, clearance and local delivery unless the issued quotation explicitly includes them.
- `/request-quote/` separately collects target market, preferred trade-term starting point, actual delivery destination and requested delivery timing. A DDP review cannot be submitted without a destination.
- These fields are sanitized and stored on the inquiry, included in internal and buyer receipt emails, shown in the protected admin ledger, exported in pipeline CSV, and echoed to the buyer's private status page.
- A trade-term preference is not a final Incoterm or freight quote. Sales must confirm the named place, quantity, packing/carton data, timing and forwarder scope in the issued quotation or order document.

## Commercial Sourcing Landing Pages

- `/solutions/wholesale-walking-shoes/` supports importers, wholesalers, distributors and marketplace sellers building an existing-style assortment.
- `/solutions/private-label-walking-shoes/` explains the base-style path for reviewed logo, color, labeling and packing requests.
- `/solutions/oem-knit-shoes/` routes technical development buyers through buyer-target, feasibility, sample and evidence boundaries.
- Each page has unique metadata and canonical URL, Service/FAQ/Breadcrumb structured data, a six-product reference set, project-input checklist, workflow, FAQ and quote/WhatsApp actions.
- Homepage and footer links create internal discovery paths. The EdgeOne exporter and sitemap include all three routes.
- Optional first-party analytics records `sourcing_program_view` and `sourcing_program_cta` only after consent. A submitted request separately saves a server-whitelisted `sourcingProgram` so sales can identify the internal entry path without treating it as an external advertising source.

## Mobile Buyer Navigation

- Below `1000px`, the desktop navigation is replaced by a Buyer menu while the brand and live Quote list count stay visible.
- The menu groups product discovery, sourcing paths, factory/trust pages and request-status access, then provides direct quote, WhatsApp and email actions.
- It is an accessible modal dialog: Escape/backdrop/close controls dismiss it, Tab focus remains inside while open, body scrolling is locked and focus returns to the trigger after closing.
- Below `400px`, long brand text is hidden so the BQ mark, Quote list and menu controls remain usable on narrow screens.
- Optional analytics records `mobile_nav_open` and `mobile_nav_link`; the protected dashboard reports both as interaction counts, not unique visitors or orders.

## Image Delivery and Performance Budgets

- Original evidence stays in `public/catalog/`, `public/factory/` and `public/og.png`. Browser-facing derivatives live in `public/catalog-thumbs/`, `public/catalog-web/`, `public/factory-web/` and `public/og.jpg`.
- `npm run images:build` regenerates every derivative from the reviewed originals. Run it whenever a product main/gallery image, factory image or social-preview source changes.
- Product cards, comparisons, line-sheet previews and saved quote lines use 640×640 WebP thumbnails. Existing locally saved quote lines are normalized to the current thumbnail path when read.
- Product detail galleries and capability pages use the larger WebP set. Homepage and product-detail lead images receive priority; off-screen evidence uses lazy loading or asynchronous decoding.
- The current measured outputs are: 30 thumbnails `0.76 MB`, 175 product web images `8.80 MB`, 10 factory web images `1.43 MB`, and social preview `0.22 MB`.
- `tests/image-assets.test.mjs` verifies source/derivative completeness, file signatures, per-file limits and aggregate budgets. Do not remove a budget after adding a large image; inspect the source dimensions and visual need first.

To add a product:

1. Review its final upload form and real image package. Do not use the placeholder medical titles found in some older forms.
2. Copy the verified main gallery into `public/catalog/<lowercase-code>/` using `01_main.jpg` as the catalogue image.
3. Add one record to `app/data/products.ts`, including every field and the exact image filenames.
4. Run `npm test`, `npm run edgeone:build`, `npm run lint`, and verify every exported image path before deployment. The EdgeOne exporter discovers product folders and regenerates product routes and `sitemap.xml` automatically.
5. Confirm the live product page, product-specific inquiry code, WhatsApp/email links and admin-ledger record after deployment.

The catalogue may show a conservative `To be confirmed` or confirmation list. That is intentional: size, material, outsole, lining, MOQ, price, packing, lead time and customization must not be invented when the product package does not prove them.

When `alibabaProductId` is present, the product inquiry area links directly to that Alibaba.com listing. Products without a mapped ID deliberately fall back to the Beiqiang storefront. Recheck product identity and live state after any Alibaba listing change; an ID is not proof that the public listing remains online forever.

## Buyer Trust and Order-Qualification Pages

The third development stage adds four evidence-led pages that answer the questions buyers usually ask after reviewing a product:

- `/factory/`: verified workshop evidence and the factory-side sourcing path.
- `/quality-packing/`: real checking, sorting and carton-preparation evidence plus order-specific confirmation items.
- `/oem-odm/`: base-style and development-brief paths with customization feasibility checked before commitment.
- `/sample-order-process/`: shortlist, specification, sample, bulk-confirmation, checking, packing and shipment-coordination decisions.
- `/buyer-guide/`: complete buyer decision path, trade-term starting points, freight-data checklist and transaction safety boundaries.

These routes are linked from the global navigation, homepage and every product detail page. `scripts/export-edgeone-static.mjs` exports them and adds them to the sitemap. Keep the pages evidence-led: never add unverified capacity, certificates, customer brands, fixed commercial terms, or unconditional customization promises.

When adding factory evidence, copy only reviewed source files from `01_产品资产/02_可发布素材/00_最终上传/00_厂家资料/00_精选可用照片/` into `public/factory/`. Do not publish the archive previews or contact-card images from `99_归档参考/`.

## Multi-Style Quote and Sales Pipeline

- Product cards and product detail pages can add a style to a device-local quote list.
- `/request-quote/` collects up to 12 styles with per-style quantity, colors, sizes and notes.
- Buyers choose `Existing style adaptation` or `Technical product development`. Technical requests capture existing-sole acceptance, required changes, buyer targets/tests and NDA/tech-pack need; buyer targets are not treated as confirmed capabilities.
- `/api/inquiries` stores structured quote lines and technical-development fields in the same EdgeOne Blob record used by standard inquiries, then includes them in the business email notification.
- `/admin/inquiries/` supports pipeline stage, owner, last-contacted date, next action and internal note. Its authenticated `PATCH /api/admin/inquiries` handler updates the original Blob record.
- Pipeline stages are `new`, `qualified`, `sample_discussion`, `quoted`, `negotiation`, `order_confirmed`, `lost` and `spam`.

The quote list is an RFQ/order-intent workflow, not a final-price retail cart. Formal order and payment follow confirmed specifications, quotation and the agreed Alibaba Trade Assurance or contract process.

## Buyer Request Status

- Every newly saved inquiry receives a 20-character buyer status access code. Only its SHA-256 hash is stored with the record.
- The success screen and buyer receipt email show the inquiry reference and access code. The email explicitly confirms receipt only, not specifications, price, MOQ, lead time, technical targets or order acceptance.
- `/inquiry-status/` uses both values to call `GET /api/inquiry-status` and displays only buyer-safe fields.
- Internal notes, internal next actions, admin credentials, request metadata and the stored token hash are never returned by the buyer status API.
- The admin pipeline has a separate `buyerUpdate` field for a safe message shown to the buyer; use `internalNote` for private commercial notes.
- Older inquiries created before this feature do not have an access code and require manual follow-up.

## Private Buyer Messages

- The authenticated buyer status page keeps a private message thread on the same inquiry record. Buyers can ask product, sample, quotation and order questions without starting a disconnected request.
- `POST /api/inquiry-messages` verifies the reference and private access code, checks the production origin, limits message length and frequency, saves first, then emails the sales inbox when SMTP is available.
- The protected admin card can reply through `POST /api/admin/inquiry-message`; the reply is saved before the buyer email is attempted.
- Closed and spam inquiries cannot receive new buyer messages. A thread is capped at 100 messages and never accepts passwords, verification codes or payment credentials.
- Admin API responses omit the buyer access-code hash, pending-upload reservations and private Blob object keys because the browser dashboard does not need them.

## Commercial Funnel Dashboard

- The protected inquiry dashboard can calculate 7-, 30- or 90-day operating signals from the `beiqiang-events` and `beiqiang-inquiries` Blob stores.
- The funnel covers product views, quote-list additions, quote requests, saved business inquiries, current qualified/sample stages, issued quotations, buyer-accepted quotations and confirmed orders.
- Source and product tables help compare UTM sources and style codes by views, comparison selections, successful quote-list additions and saved inquiries. Internal deployment tests are excluded.
- Optional website events include only visitors who accepted first-party analytics. They are interaction counts, not unique visitors; saved inquiries and confirmed orders remain the authoritative commercial records.
- `GET /api/admin/analytics` requires `INQUIRY_ADMIN_TOKEN` and returns aggregated metrics only, not buyer names, emails, messages or uploaded files.

## Stage History and Loss Review

- New inquiries start an append-only `pipelineHistory`; later admin transitions, quotation issue and buyer quotation responses add timestamped stage entries instead of overwriting the only evidence of progress.
- Moving a live opportunity to `lost` requires one standardized primary reason: price, MOQ, lead time, product fit, trust/proof, no response, project cancellation, competitor, compliance or documented other.
- The admin card shows the full stage timeline, current loss reason and exports both in the pipeline CSV.
- The commercial dashboard separates current cohort stages from actual stage changes recorded during the selected period and summarizes current loss reasons for the inquiry cohort.

## Buyer Transaction Documents

- Authorized sales staff can upload reviewed PDF/JPG/PNG/WEBP evidence to an inquiry as sample reference, approved-sample evidence, specification, quotation support, quality inspection, packing, shipping, order document or documented other.
- Each file is limited to 15 MB and each inquiry to 12 buyer-facing documents. A presigned direct upload is not finalized until the server verifies the exact stored content type and byte length.
- The inquiry record stores the document category, buyer title, buyer-safe note, timestamp and private Blob key. Admin browser responses and buyer status responses never expose that storage key.
- Finalization saves the document before attempting the buyer email. The buyer downloads through `POST /api/order-document`, which rechecks the inquiry reference and private access code before returning the file as an attachment.
- A reference image is not an approved sample; a component result is not a finished-shoe test; a quotation-support file is not a production order. The UI, email and website terms preserve these boundaries.
- Authorized sales can revoke or restore a buyer upload or buyer-facing transaction document with a specific reason. Revocation blocks both buyer and admin download before file bytes are read, while preserving the Blob object and append-only lifecycle audit.
- Revoked buyer-facing documents are removed from the buyer status response. The protected dashboard keeps the revoked metadata, responsible operator, reason and timestamp, and exposes a restore action after review.
- Revocation is not permanent deletion. Permanent retention/deletion still requires a separately approved policy, exact storage targets and legal/business review.

## Payment Milestones

- An order handoff can keep up to six USD/EUR milestones such as deposit, balance or freight, with amount, due date, planned/due/paid/waived status, actual paid date, transaction reference and buyer-safe note.
- A milestone marked `paid` is rejected without an actual paid date. Amounts are validated and exported in the protected pipeline CSV.
- The buyer status page shows scheduled and recorded-paid totals with each milestone, but the website never collects money or bank credentials and does not treat this operating record as a bank receipt.
- Every payment must still be verified in the exact Alibaba Trade Assurance order or signed contract channel. Payment status does not independently confirm production or shipment.

## Sales Reminder Center

- The protected dashboard previews overdue follow-ups, issued quotations expiring or expired through the next three days, and planned/due payment milestones due or overdue through the same window.
- `GET /api/admin/reminders` calculates the internal action list; `POST /api/admin/reminders` sends one consolidated email to the configured business inbox.
- A reservation is stored in the separate `beiqiang-reminders` Blob store before SMTP delivery, preventing concurrent or repeated same-day digests. A failed delivery clears the reservation so a later manual retry is possible.
- The digest excludes internal tests and lost/spam records, does not email buyers, and explicitly states that it is not proof of quotation acceptance, payment or order confirmation.
- This version is deliberately manual. No EdgeOne scheduled trigger is claimed or required; automatic scheduling remains a separately verified deployment task.

## Buyer Files

- After a successful inquiry, the buyer can attach PDF, JPG, PNG, WEBP, DOCX, XLSX, PPTX or ZIP files using the inquiry reference plus private status code.
- The browser uploads through a 15-minute presigned PUT URL to the separate `beiqiang-inquiry-files` Blob store. Each file is limited to 15 MB and each inquiry to five finalized files.
- `POST /api/inquiry-attachments` verifies inquiry ownership and issues the exact-key/content-type upload URL. `PATCH /api/inquiry-attachments` verifies stored content type and actual byte length before adding metadata to the inquiry.
- `/api/admin/inquiry-attachment` requires `INQUIRY_ADMIN_TOKEN`, verifies the attachment belongs to the referenced inquiry and forces a private download.
- Uploaded buyer targets and tech packs are evidence supplied for review, not confirmed Beiqiang capability or production specifications.

## Quotation Versions

- Each inquiry card includes a quotation editor for version, currency, trade term, validity, lead time, payment, packing, sample terms, notes and per-style quantity/unit price.
- Saving appends an immutable snapshot to `quotations[]`; duplicate quote numbers are rejected, so commercial changes require a new version.
- Saved versions can be opened in a print-safe document and exported with the browser's Save as PDF function.
- A quotation is not an order confirmation. Specifications, approved sample, payment and shipping terms still require written confirmation and the agreed Alibaba Trade Assurance or contract process.
- `POST /api/admin/quotation` explicitly issues a saved version, supersedes any older open version, updates the buyer-visible message and sends a receipt-safe notification when SMTP and buyer email are available.
- The private status page shows the current buyer-safe quotation. `POST /api/quotation-response` separates accept, structured revision request and decline; an expired, superseded or already-closed version cannot be answered.
- A revision request records allowed commercial areas, affected quoted styles and optional buyer targets for quantity, unit price, trade term, delivery, payment, packing and sample terms. Unknown reasons and styles outside the issued quotation are rejected.
- The protected quotation editor can copy the responded version into the next version as a working draft. Buyer targets remain visible for review but are not automatically inserted into buyer-facing quotation terms; sales must verify feasibility and edit each changed field before saving and issuing a new immutable version.
- Buyer acceptance moves the opportunity into commercial discussion, not `order_confirmed`.

## Buyer Order-Setup Request

- After accepting the current quotation, the authenticated buyer can request formal order preparation from the private status page instead of sending an unstructured email.
- The request captures the accepted quotation number, legal purchasing company, purchasing contact, preferred Alibaba Trade Assurance/contract channel, optional buyer PO reference, destination, requested production/delivery window and buyer instructions.
- The API requires the inquiry reference and private access code, an actually accepted quotation and an explicit acknowledgement. It refuses closed inquiries, existing formal handoffs and duplicate requests for the same quotation.
- Each accepted submission is appended as immutable buyer evidence, appears in the protected admin card and pipeline CSV, can notify the business inbox, and adds `Order setup requested` to the commercial funnel.
- This is not an accepted purchase order, production instruction, invoice or payment request. Sales must verify the final quotation and all eight order-readiness items before creating and confirming the Trade Assurance order or bilateral contract.

## Buyer Next Action and Quotation PDF

- The private status page calculates one buyer-facing next action from verified workflow state: closed request, formal order handoff, pending sample review, issued quotation, accepted quotation awaiting order setup, submitted order setup, declined quotation or general qualification.
- Higher-risk decisions take priority. A formal order handoff overrides older sample/quotation prompts; a sample waiting for buyer review is surfaced before an open quotation; an accepted quotation points to order setup only until that request is submitted.
- The action card scrolls to the relevant protected section or opens the already validated Trade Assurance URL. It does not predict conversion, auto-approve anything or change the underlying record.
- Any buyer-visible issued quotation can be printed or saved as an A4 PDF for internal purchasing review. The print version retains line prices, totals, terms, notes, decision boundary, Beiqiang contact details and the quotation number.
- Product-sheet and quotation printing use separate temporary body modes. Ordinary page printing is no longer accidentally hidden by product-sheet-only CSS.

## Curated Buyer Product Shortlists

- Every protected inquiry card lets an authorized salesperson choose 2–5 products from the verified 30-style catalogue, write a buyer-safe reason for each style, explain the recommendation context and define one commercial next step.
- `POST /api/admin/recommendation` validates the admin token, exact BQ001–BQ030 style codes, unique products and complete buyer-facing copy before saving an immutable recommendation version. A new version supersedes the previous active version without deleting its response history.
- The recommendation is saved before buyer email is attempted. Email failure does not erase the shortlist; the dashboard records whether notification succeeded.
- The private buyer status page shows local product images, verified catalogue facts, product-page links and the salesperson's exact recommendation reasons. The buyer can select interested styles, request different options or add the chosen styles to the local quote list.
- `POST /api/recommendation-response` requires the inquiry reference and private access code, accepts only products contained in the current recommendation, blocks duplicate responses and saves the buyer decision before notifying sales.
- A product recommendation or buyer shortlist response is not a quotation, sample approval, stock confirmation, technical-capability confirmation or order. Quantity, colors, size ratio, sample direction and commercial terms must still be confirmed through the quote workflow.

## Recommendation Follow-up Cadence

- An issued shortlist enters a two-step, human-reviewed follow-up cadence: selection check two calendar days after issue, then sample/quotation choice four calendar days after the first follow-up.
- The reminder center surfaces due and due-soon shortlist actions. It never contacts a buyer automatically.
- Sales must load and review the buyer-specific draft, verify the product codes and facts, keep one clear next action, then explicitly save and notify the buyer.
- Every follow-up is saved in the private inquiry thread and in the immutable recommendation history before email is attempted. An email failure does not erase the message.
- A buyer response stops the cadence immediately. The sequence also stops after two messages; sales must then decide whether to revise the direction, continue personally or close the opportunity after review.
- The server enforces timing, order, active-recommendation state and the two-message cap. These follow-ups do not confirm price, stock, sample availability, product specification or an order.

## Order Handoff

- Sales can save an Alibaba Trade Assurance order reference plus its exact Alibaba.com HTTPS URL, or a bilateral contract reference without publishing a private contract file.
- The buyer-safe status page shows the recorded handoff behind the inquiry reference and private code.
- New opportunities cannot be moved to `order_confirmed` until the order handoff has an exact reference, confirmed date and all eight buyer-safe readiness items: product specification, sample decision, quantity/size ratio, colors/materials, packing/labeling, price/trade term/named place, payment terms and delivery window.
- The admin editor shows `order readiness X/8`; every entry must cite the agreed value or written document reference. The buyer sees the same summary in the private status page and can raise mismatches before production action.
- Vague placeholders, an accepted quotation, a sample approval or an order number alone are not sufficient evidence of a confirmed production order.
- The website does not collect card or bank payments. Payment remains inside the verified Alibaba Trade Assurance order or the separately agreed contract workflow.
- Order handoff also tracks buyer-safe fulfillment status, carrier and tracking/B/L reference. Enter these only when supported by actual order progress.

### Confirmed-order change control

- Once an inquiry is `order_confirmed`, edits to method, formal reference, confirmed date, currency, the eight commercial readiness fields or the planned payment schedule no longer overwrite the current order. The admin must state a business reason; the server stores an `awaiting_buyer` proposal and leaves the accepted version active.
- The private buyer page prioritizes the pending proposal, displays its changed fields and lets the buyer accept or reject it. Rejection requires a mismatch note. Acceptance creates a new immutable website order version; rejection preserves the prior version.
- After the proposal is saved, the server emails the buyer at the inquiry address when SMTP is available. The message names the proposal, reason and changed fields, links to the private status lookup without exposing the access code, and repeats the Trade Assurance/contract boundary. A mail failure never deletes the saved proposal; the admin shows the delivery result for manual follow-up.
- Fulfillment stage, carrier, tracking/B/L, buyer-safe progress notes and actual payment status/reference remain operational updates. They append an operational audit entry without creating a false commercial re-approval cycle.
- A pending proposal enters the protected sales reminder center two days after creation and remains visible until the buyer accepts or rejects it. The 7/30/90-day dashboard separately reports proposed, accepted, rejected and currently pending order changes.

### Fulfillment exception and delivery-feedback control

- After an order is confirmed, staff can open a structured fulfillment case for production timing, quality check, packing/labeling, logistics, documents, quantity/specification or another verified exception. Each case separates facts, affected scope, expected impact, proposed resolution and buyer response date.
- The system saves the case before attempting buyer email. The email contains no private status access code and states that the notice does not amend the confirmed order or formal transaction terms.
- Buyers can acknowledge the proposed resolution or request a revision from their private status page. Acknowledgement confirms receipt only; it does not prove completion or waive contractual rights.
- After shipment is recorded, buyers can confirm operational receipt or report a structured delivery issue. Issue reports create an internal fulfillment case and can be supported with the existing protected buyer-file uploader.
- Staff can mark a case resolved only after recording the verified resolution. Open cases enter the protected reminder digest, while dashboard analytics aggregate opened, resolved and open cases plus delivery confirmations and reported issues.

### Repeat-order and next-project growth loop

- Once shipment is recorded, the private buyer page can start one structured next sourcing project: repeat the same order direction, replenish selected styles, request a new-season shortlist, or discuss a new OEM/ODM project.
- The buyer supplies product codes where relevant, indicative quantity, purchase window, destination, requested timing, changes and other requirements, then confirms that the submission is not a purchase order or production authorization.
- The server saves the opportunity before attempting internal and buyer email. Buyer email never includes the private status access code and does not promise price, stock, material, lead time or production availability.
- The protected admin workflow records owner, current stage, one clear next action, due date and append-only history. Stages are submitted, qualified, sample discussion, quotation preparation, formal-order preparation, converted and closed.
- Conversion requires a linked new inquiry reference or formal-order reference. Converted and closed records cannot be silently reopened or rewritten.
- Open next-project actions enter the internal reminder center and daily digest. Commercial analytics separately reports submitted, qualified, converted and currently open repeat-order opportunities.
- Website acceptance is supporting evidence only. Sales must make the same critical change in the authoritative Alibaba Trade Assurance order or signed bilateral contract before affected production or payment action.
- API: internal proposals use authenticated `PATCH /api/admin/inquiries`; buyer decisions use private `POST /api/order-change-response`. Never expose the administrator token or the buyer access code in logs, screenshots or links.

## Controlled Data Lifecycle and Buyer-File Quarantine

- Each inquiry can have a scheduled retention-review date, an active/released hold and one recorded deletion workflow. A review date never deletes data automatically. Active order, payment, dispute, shipment, claim, legal or security holds block deletion.
- A verified deletion request records scope and request-channel evidence. Approval requires a different named approver, the separate `INQUIRY_DELETE_TOKEN`, a written retention assessment and confirmation that required external order records remain in their authoritative systems. Execution is blocked for at least 24 hours and requires the exact inquiry reference again.
- Execution removes only the matching website inquiry, validated inquiry/order-document file keys, related buyer-workspace access records and matching first-party website events. It does not delete Alibaba Trade Assurance, signed-contract, accounting, logistics, dispute or other external records.
- A minimal receipt is retained in `beiqiang-deletion-audit`; it excludes email addresses, file names/content, access codes, session tokens and message text. No live record is deleted by the test suite.
- New buyer uploads are `quarantined` by default. The website validates supported type, size and storage metadata, but does not include an antivirus engine. A quarantined download requires explicit isolated-review acknowledgement and is forced to a non-previewing binary response. Ordinary admin download is enabled only after an authorized person records the offline malware/content-review method and result.
- Revoking a file blocks website access but preserves bytes and audit evidence. Quarantine, review, revocation and permanent deletion are separate actions and must not be described as interchangeable.

## Privacy and Analytics Choice

- `/privacy/` explains actual inquiry, file, device-storage and first-party event handling; `/terms/` states the B2B product, quotation and order boundary.
- Optional conversion events and UTM first-touch attribution are disabled until the visitor chooses `Accept analytics`. `Essential only` clears first-touch attribution and does not affect core sourcing functions.
- The site stores the analytics choice locally and does not load a third-party advertising tracker. Revisit the notice and obtain appropriate professional review when the business model, target markets or data practices change.

This starter does not use `wrangler.jsonc`.

## Included Shape

- edit site code under `app/`
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/schema.ts` starts intentionally empty
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm test`: build the commercial site and run the complete product, inquiry, recommendation, sample, quotation, document, order and analytics test suite
- `npm run db:generate`: generate Drizzle migrations after schema changes

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
