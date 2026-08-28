"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  buildRelationshipGroups,
  relationshipIndex,
  type RelationshipGroup,
} from "../../lib/buyer-relationships";
import {
  BUYER_MESSAGE_TEMPLATES,
  buildBuyerMessageTemplate,
  buildRecommendationFollowUp,
  recommendedBuyerMessageTemplate,
  type BuyerMessageTemplateId,
  type RecommendationFollowUpStage,
} from "../../lib/buyer-message-templates";
import { assessInquiryReadiness } from "../../lib/inquiry-readiness";
import { products } from "../../data/products";
import RepeatOrderManager, {
  type RepeatOrderOpportunity,
} from "./RepeatOrderManager";
import ChineseSalesCockpit from "./ChineseSalesCockpit";
import ChineseWeeklyReview, {
  type SalesExecution,
} from "./ChineseWeeklyReview";
import AcquisitionCampaignWorkbench, {
  type AcquisitionChannelPerformance,
} from "./AcquisitionCampaignWorkbench";
import MeetingPerformancePanel from "./MeetingPerformancePanel";
import ExternalContactLog, { type ExternalContact } from "./ExternalContactLog";
import MeetingRequestCenter, {
  type MeetingRequest,
} from "./MeetingRequestCenter";

type QuoteItem = {
  code: string;
  quantity?: string;
  colors?: string;
  sizes?: string;
  notes?: string;
};
type Attachment = {
  id: string;
  name: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  revokedAt?: string;
  revokedBy?: string;
  revocationReason?: string;
  securityStatus?: "quarantined" | "reviewed_safe";
  securityReason?: string;
  securityUpdatedAt?: string;
  securityUpdatedBy?: string;
};
type QuotationLine = {
  code: string;
  description: string;
  quantity: string;
  unitPrice: string;
};
type RevisionBrief = {
  reasons: string[];
  affectedCodes: string[];
  targetQuantity: string;
  targetUnitPrice: string;
  targetTradeTerm: string;
  requestedDelivery: string;
  requestedPayment: string;
  requestedPacking: string;
  requestedSample: string;
};
type Quotation = {
  quoteNumber: string;
  version: string;
  currency: string;
  tradeTerm: string;
  validUntil: string;
  leadTime: string;
  paymentTerms: string;
  packing: string;
  sampleTerms: string;
  notes: string;
  createdAt: string;
  lines: QuotationLine[];
  status?: string;
  issuedAt?: string;
  buyerDecision?: string;
  buyerNote?: string;
  buyerRespondedAt?: string;
  revisionBrief?: RevisionBrief | null;
  quoteEmailSent?: boolean;
};
type PaymentMilestone = {
  id: string;
  label: string;
  amount: string;
  dueDate: string;
  status: "planned" | "due" | "paid" | "waived";
  paidAt: string;
  reference: string;
  note: string;
};
type OrderChecklist = {
  productSpecification: string;
  sampleDecision: string;
  quantitySizeRatio: string;
  colorsMaterials: string;
  packingLabeling: string;
  priceTradeTerm: string;
  paymentTerms: string;
  deliveryWindow: string;
};
type OrderHandoff = {
  method: "alibaba_trade_assurance" | "contract";
  orderReference: string;
  orderUrl: string;
  confirmedAt: string;
  note: string;
  fulfillmentStatus: string;
  carrier: string;
  trackingNumber: string;
  paymentCurrency?: string;
  paymentMilestones?: PaymentMilestone[];
  orderChecklist?: OrderChecklist;
  updatedAt?: string;
};
type OrderVersion = {
  version: number;
  orderHandoff: OrderHandoff;
  acceptedAt: string;
  acceptedBy: string;
  source: string;
};
type OrderChangeRequest = {
  id: string;
  status: string;
  reason: string;
  changedFields: string[];
  baseVersion: number;
  proposedHandoff: OrderHandoff;
  createdAt: string;
  createdBy: string;
  buyerDecision?: string;
  buyerNote?: string;
  buyerRespondedAt?: string;
  notificationSent?: boolean;
  notificationStatus?: string;
  notificationAttemptedAt?: string;
};
type FulfillmentCase = {
  id: string;
  source: string;
  status: string;
  category: string;
  title: string;
  facts: string;
  affectedScope: string;
  impact: string;
  proposedResolution: string;
  responseDue: string;
  createdAt: string;
  createdBy: string;
  buyerDecision?: string;
  buyerNote?: string;
  buyerRespondedAt?: string;
  notificationSent?: boolean;
  notificationStatus?: string;
  resolvedAt?: string;
  resolutionNote?: string;
};
type DeliveryFeedback = {
  id: string;
  action: string;
  category: string;
  note: string;
  trackingReference: string;
  createdAt: string;
};
type BuyerOrderRequest = {
  id: string;
  quoteNumber: string;
  preferredOrderChannel:
    "alibaba_trade_assurance" | "contract" | "need_guidance";
  legalCompanyName: string;
  purchasingContact: string;
  purchaseOrderReference: string;
  destination: string;
  requestedWindow: string;
  instructions: string;
  status: string;
  submittedAt: string;
};
type OrderPreparationPacket = {
  id: string;
  version: number;
  orderRequestId: string;
  quoteNumber: string;
  billingCompany: string;
  registeredCountry: string;
  billingAddress: string;
  invoiceEmail: string;
  shippingConsignee: string;
  shippingCountry: string;
  shippingAddress: string;
  shippingContact: string;
  importerRole: string;
  shippingMode: string;
  requiredDocuments: string[];
  purchaseOrderReference: string;
  attachmentIds: string[];
  notes: string;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
};
type OrderConfirmationDraft = {
  id: string;
  version: number;
  orderRequestId: string;
  packetId: string;
  packetVersion: number;
  quoteNumber: string;
  orderChannel: "alibaba_trade_assurance" | "contract";
  orderChecklist: OrderChecklist;
  draftNote: string;
  status: string;
  issuedAt: string;
  issuedBy: string;
  buyerDecision?: string;
  buyerNote?: string;
  buyerRevisionFields?: string[];
  buyerRespondedAt?: string;
  notificationStatus?: string;
  salesNotificationStatus?: string;
};
type InquiryMessage = {
  id: string;
  sender: "buyer" | "sales";
  body: string;
  sentAt: string;
  notificationSent?: boolean;
};
type PipelineEvent = {
  from: string;
  to: string;
  changedAt: string;
  actor: string;
  reason: string;
};
type OrderDocument = {
  id: string;
  name: string;
  title: string;
  category: string;
  note: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  notificationSent?: boolean;
  revokedAt?: string;
  revokedBy?: string;
  revocationReason?: string;
};
type DocumentAudit = {
  id: string;
  kind: string;
  fileId: string;
  fileName: string;
  action: string;
  reason: string;
  actor: string;
  changedAt: string;
};
type WorkspaceContact = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: "active" | "revoked";
  grantedAt: string;
  grantedBy: string;
  authorizationBasis: string;
  notificationStatus: string;
  notificationAttemptedAt: string;
  revokedAt: string;
  revokedBy: string;
  revocationReason: string;
  revocationNotificationStatus: string;
};
type WorkspaceAccessRequest = {
  id: string;
  email: string;
  name: string;
  role: string;
  purpose: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  reviewedAt: string;
  reviewedBy: string;
  reviewNote: string;
  contactId: string;
  notificationStatus: string;
};
type WorkspaceContactAudit = {
  id: string;
  contactId: string;
  action: "granted" | "revoked" | "primary_revoked" | "primary_restored";
  email: string;
  role: string;
  actor: string;
  reason: string;
  changedAt: string;
};
type WorkspacePrimaryAccess = {
  status: "active" | "revoked";
  changedAt: string;
  changedBy: string;
  reason: string;
  notificationStatus: string;
};
type DataLifecycle = {
  review?: null | {
    status: string;
    reviewDue: string;
    reason: string;
    scheduledAt: string;
    scheduledBy: string;
  };
  hold?: null | {
    status: string;
    category: string;
    reason: string;
    placedAt: string;
    placedBy: string;
    releasedAt?: string;
    releasedBy?: string;
    releaseReason?: string;
  };
  deletion?: null | {
    requestId: string;
    status: string;
    scope: string;
    reason: string;
    verificationBasis: string;
    requestedAt: string;
    requestedBy: string;
    approvedAt?: string;
    approvedBy?: string;
    approvalBasis?: string;
    deleteAfter?: string;
    cancelledAt?: string;
    cancellationReason?: string;
    failedAt?: string;
    failureNote?: string;
  };
  audit?: {
    id: string;
    action: string;
    actor: string;
    reason: string;
    changedAt: string;
    category?: string;
    requestId?: string;
    reviewDue?: string;
    deleteAfter?: string;
  }[];
};
type SampleReviewRound = {
  round: number;
  sampleReference: string;
  styleCodes: string;
  purpose: string;
  reviewScope: string;
  deliverables: string;
  acceptanceCriteria: string;
  exclusions: string;
  status: string;
  openedAt: string;
  decision: string;
  buyerNote: string;
  respondedAt: string;
};
type SampleProgram = {
  status: string;
  sampleReference?: string;
  styleCodes: string;
  quantity: string;
  sizes: string;
  colors: string;
  purpose: string;
  reviewScope: string;
  deliverables?: string;
  acceptanceCriteria?: string;
  exclusions?: string;
  reviewRounds?: SampleReviewRound[];
  currency: string;
  sampleCharge: string;
  chargeStatus: string;
  paidAt: string;
  courier: string;
  trackingNumber: string;
  shippedAt: string;
  expectedDelivery: string;
  note: string;
  buyerDecision?: string;
  buyerNote?: string;
  buyerRespondedAt?: string;
  updatedAt?: string;
  history?: { from: string; to: string; changedAt: string; actor: string }[];
};
type SampleRequest = {
  id: string;
  styleCodes: string[];
  sampleType: string;
  quantity: string;
  sizes: string;
  colors: string;
  evaluationPurpose: string;
  customizationTarget: string;
  acceptanceFocus: string;
  targetBulkQuantity: string;
  shippingCountry: string;
  shippingCity: string;
  courierAccountAvailable: boolean;
  requestedTiming: string;
  status: "pending" | "converted" | "rejected";
  submittedAt: string;
  reviewedAt: string;
  reviewedBy: string;
  reviewNote: string;
  sampleReference: string;
  notificationStatus: string;
};
type RecommendationFollowUp = {
  id: string;
  stage: RecommendationFollowUpStage;
  body: string;
  sentAt: string;
  sentBy: string;
  notificationSent?: boolean;
};
type AdaptationBrief = {
  intent: string;
  artworkStatus: string;
  brandingPlacement: string;
  colorDirection: string;
  packingLabeling: string;
};
type ProductRecommendation = {
  id: string;
  title: string;
  introduction: string;
  items: { code: string; reason: string }[];
  nextStep: string;
  status: string;
  issuedAt: string;
  issuedBy: string;
  buyerDecision?: string;
  selectedCodes?: string[];
  buyerNote?: string;
  buyerRespondedAt?: string;
  notificationSent?: boolean;
  responseNotificationSent?: boolean;
  followUps?: RecommendationFollowUp[];
};
type CommercialAnalytics = {
  period: { days: number; from: string; to: string; consentNote: string };
  funnel: {
    productViews: number;
    quoteAdds: number;
    quoteBuilderViews: number;
    quoteRequests: number;
    inquiries: number;
    qualified: number;
    sampleDiscussion: number;
    quoted: number;
    quoteAccepted: number;
    orderSetupRequested: number;
    orders: number;
  };
  salesExecution: SalesExecution;
  workspace: {
    accessRequests: number;
    eligibleRequests: number;
    linksSent: number;
    deliveryFailures: number;
    unknownRequests: number;
    rateLimitedRequests: number;
    linkRedemptions: number;
    redemptionFailures: number;
    workspaceLoads: number;
    uniqueRedeemedBuyers: number;
    uniqueActiveBuyers: number;
    projectSummaryOpens: number;
    uniqueProjectReaders: number;
    privateProjectHandoffs: number;
    signOuts: number;
    linkDeliveryRate: number;
    linkRedemptionRate: number;
    workspaceAdoptionRate: number;
    projectEngagementRate: number;
    projects: {
      reference: string;
      summaryOpens: number;
      privateHandoffs: number;
    }[];
    collectionJourneys: {
      slug: string;
      views: number;
      productOpens: number;
      quoteHandoffs: number;
      inquiries: number;
      qualified: number;
      sampleDiscussion: number;
      quoted: number;
      orders: number;
    }[];
    privacyNote: string;
  };
  supporting: {
    mobileMenuOpens: number;
    mobileMenuLinks: number;
    sourcingProgramViews: number;
    sourcingProgramCtas: number;
    lineSheetLeads: number;
    lineSheetDownloads: number;
    productSpecSheets: number;
    productShares: number;
    comparisonShares: number;
    comparisonOpens: number;
    buyerMessages: number;
    buyerFiles: number;
    buyerDocuments: number;
    meetingRequestsSubmitted: number;
    meetingsPending: number;
    meetingsConfirmed: number;
    meetingsCompleted: number;
    meetingCalendarDownloads: number;
    meetingProjectsWithCalendarDownload: number;
    meetingChangesSubmitted: number;
    meetingChangesPending: number;
    meetingChangesApproved: number;
    orderConfirmationsIssued: number;
    orderConfirmationsAwaitingBuyer: number;
    orderConfirmationsAccepted: number;
    orderConfirmationsRevisionRequested: number;
    quoteRevisions: number;
    quoteDeclines: number;
    orderChangesProposed: number;
    orderChangesAccepted: number;
    orderChangesRejected: number;
    orderChangesAwaitingBuyer: number;
    fulfillmentCasesOpened: number;
    fulfillmentCasesResolved: number;
    fulfillmentCasesOpen: number;
    repeatOrdersSubmitted: number;
    repeatOrdersQualified: number;
    repeatOrdersConverted: number;
    repeatOrdersOpen: number;
    deliveriesConfirmed: number;
    deliveryIssuesReported: number;
    overdue: number;
  };
  comparisonJourneys: {
    codes: string;
    shares: number;
    opens: number;
    prints: number;
  }[];
  stageActivity: { stage: string; count: number }[];
  lossReasons: { reason: string; count: number }[];
  sources: { label: string; events: number; inquiries: number }[];
  acquisitionChannels: AcquisitionChannelPerformance[];
  products: {
    code: string;
    views: number;
    compares: number;
    specSheets: number;
    shares: number;
    comparisonShares: number;
    comparisonOpens: number;
    comparisonPrints: number;
    quoteAdds: number;
    inquiries: number;
  }[];
  coverage: {
    eventsLoaded: number;
    inquiriesLoaded: number;
    workspaceActivityLoaded: number;
    truncated: boolean;
  };
};
type ReminderSummary = {
  today: string;
  windowEnds: string;
  counts: {
    followUps: number;
    recommendations: number;
    quotes: number;
    meetings: number;
    orderPackets: number;
    orderConfirmations: number;
    orderChanges: number;
    fulfillmentCases: number;
    repeatOrders: number;
    payments: number;
    total: number;
  };
  followUps: {
    reference: string;
    company: string;
    owner: string;
    dueDate: string;
    action: string;
  }[];
  recommendations: {
    reference: string;
    company: string;
    owner: string;
    recommendationId: string;
    styles: string;
    dueDate: string;
    stage: RecommendationFollowUpStage;
    timing: string;
  }[];
  quotes: {
    reference: string;
    company: string;
    owner: string;
    quoteNumber: string;
    validUntil: string;
    timing: string;
  }[];
  meetings: {
    reference: string;
    company: string;
    owner: string;
    requestId: string;
    meetingType: string;
    action: string;
    dueDate: string;
    timing: string;
    confirmedSlot: string;
    timezone: string;
    channel: string;
    notificationStatus: string;
  }[];
  orderPackets: {
    reference: string;
    company: string;
    owner: string;
    packetId: string;
    version: number;
    quoteNumber: string;
    dueDate: string;
    timing: string;
    action: string;
  }[];
  orderConfirmations: {
    reference: string;
    company: string;
    owner: string;
    draftId: string;
    version: number;
    status: string;
    action: string;
    dueDate: string;
    timing: string;
  }[];
  orderChanges: {
    reference: string;
    company: string;
    owner: string;
    changeId: string;
    orderReference: string;
    baseVersion: number;
    changedFields: string[];
    notificationStatus: string;
    dueDate: string;
    timing: string;
  }[];
  fulfillmentCases: {
    reference: string;
    company: string;
    owner: string;
    caseId: string;
    orderReference: string;
    category: string;
    title: string;
    status: string;
    dueDate: string;
    timing: string;
  }[];
  repeatOrders: {
    reference: string;
    company: string;
    owner: string;
    opportunityId: string;
    sourceOrderReference: string;
    intent: string;
    status: string;
    styles: string[];
    indicativeQuantity: string;
    dueDate: string;
    timing: string;
    action: string;
  }[];
  payments: {
    reference: string;
    company: string;
    owner: string;
    orderReference: string;
    label: string;
    amount: string;
    currency: string;
    dueDate: string;
    timing: string;
  }[];
};
type Inquiry = {
  reference: string;
  receivedAt: string;
  status: string;
  notificationSent?: boolean;
  internalTest?: boolean;
  styleCode: string;
  styleLabel: string;
  name: string;
  company: string;
  buyerType: string;
  market: string;
  quantity: string;
  email: string;
  whatsapp: string;
  preferredContactMethod?: string;
  preferredResponseLanguage?: string;
  buyerTimezone?: string;
  preferredContactWindow?: string;
  requirements: string;
  projectPath?: string;
  sourcingProgram?: string;
  sampleQuantity?: string;
  bulkQuantity?: string;
  preferredTradeTerm?: string;
  deliveryDestination?: string;
  deliveryTiming?: string;
  existingSole?: string;
  changesRequired?: string;
  targetValues?: string;
  ndaRequired?: string;
  items?: QuoteItem[];
  adaptationBrief?: AdaptationBrief;
  owner?: string;
  nextAction?: string;
  nextActionDue?: string;
  internalNote?: string;
  buyerUpdate?: string;
  lastContactedAt?: string;
  updatedAt?: string;
  lostReason?: string;
  pipelineHistory?: PipelineEvent[];
  attachments?: Attachment[];
  quotations?: Quotation[];
  recommendationSets?: ProductRecommendation[];
  sampleProgram?: SampleProgram | null;
  sampleRequests?: SampleRequest[];
  meetingRequests?: MeetingRequest[];
  buyerOrderRequests?: BuyerOrderRequest[];
  orderPreparationPackets?: OrderPreparationPacket[];
  orderConfirmationDrafts?: OrderConfirmationDraft[];
  orderHandoff?: OrderHandoff | null;
  orderVersions?: OrderVersion[];
  orderChangeRequests?: OrderChangeRequest[];
  fulfillmentCases?: FulfillmentCase[];
  deliveryFeedback?: DeliveryFeedback[];
  repeatOrderOpportunities?: RepeatOrderOpportunity[];
  orderOperationalHistory?: {
    changedAt: string;
    changedBy: string;
    fields: string[];
    fulfillmentStatus: string;
    carrier: string;
    trackingNumber: string;
    note: string;
  }[];
  messages?: InquiryMessage[];
  orderDocuments?: OrderDocument[];
  documentAudit?: DocumentAudit[];
  workspaceContacts?: WorkspaceContact[];
  workspaceAccessRequests?: WorkspaceAccessRequest[];
  workspaceContactAudit?: WorkspaceContactAudit[];
  workspacePrimaryAccess?: WorkspacePrimaryAccess;
  dataLifecycle?: DataLifecycle;
  externalContacts?: ExternalContact[];
  attribution?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
  page?: string;
};

const PIPELINE = [
  ["new", "New"],
  ["qualified", "Qualified"],
  ["sample_discussion", "Sample discussion"],
  ["quoted", "Quoted"],
  ["negotiation", "Negotiation"],
  ["order_confirmed", "Order confirmed"],
  ["lost", "Lost"],
  ["spam", "Spam"],
] as const;
const LOST_REASONS = [
  ["", "Choose reason"],
  ["price", "Price / commercial terms"],
  ["moq", "MOQ mismatch"],
  ["lead_time", "Lead time"],
  ["product_fit", "Product / specification fit"],
  ["trust", "Trust / proof gap"],
  ["no_response", "Buyer stopped responding"],
  ["project_cancelled", "Buyer project cancelled"],
  ["competitor", "Buyer chose competitor"],
  ["compliance", "Compliance / market access"],
  ["other", "Other documented reason"],
  ["legacy_unspecified", "Legacy record — unspecified"],
] as const;

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}
function escapeHtml(value: unknown) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] || character,
  );
}

function WorkspaceAnalyticsPanel({
  data,
}: {
  data: CommercialAnalytics["workspace"];
}) {
  const rates = [
    ["SMTP send success", data.linkDeliveryRate],
    ["Link redemption", data.linkRedemptionRate],
    ["Workspace adoption", data.workspaceAdoptionRate],
    ["Project engagement", data.projectEngagementRate],
  ] as const;
  const metrics = [
    ["ACCESS REQUESTS", data.accessRequests],
    ["LINKS SENT", data.linksSent],
    ["LINK REDEMPTIONS", data.linkRedemptions],
    ["UNIQUE ACTIVE BUYERS", data.uniqueActiveBuyers],
    ["WORKSPACE LOADS", data.workspaceLoads],
    ["PROJECT SUMMARIES OPENED", data.projectSummaryOpens],
    ["PRIVATE PROJECT HANDOFFS", data.privateProjectHandoffs],
    ["DELIVERY FAILURES", data.deliveryFailures],
  ] as const;
  return (
    <section className="workspace-analytics">
      <div className="workspace-analytics-heading">
        <div>
          <p className="eyebrow">BUYER WORKSPACE ADOPTION</p>
          <h3>Email access to project-level action</h3>
        </div>
        <p>
          Use this funnel to separate SMTP handoff problems from low buyer
          adoption or weak project engagement. A successful send does not prove
          inbox delivery or an email open.
        </p>
      </div>
      <div className="workspace-analytics-metrics">
        {metrics.map(([label, value]) => (
          <article key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <div className="workspace-analytics-rates">
        {rates.map(([label, value]) => (
          <article key={label}>
            <div>
              <strong>{label}</strong>
              <span>{value}%</span>
            </div>
            <i>
              <b style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
            </i>
          </article>
        ))}
      </div>
      <div className="workspace-analytics-diagnostics">
        <span>
          Unknown-email requests <strong>{data.unknownRequests}</strong>
        </span>
        <span>
          Rate-limited requests <strong>{data.rateLimitedRequests}</strong>
        </span>
        <span>
          Redemption failures <strong>{data.redemptionFailures}</strong>
        </span>
        <span>
          Explicit sign-outs <strong>{data.signOuts}</strong>
        </span>
      </div>
      {data.projects.length ? (
        <div className="workspace-project-table">
          <div>
            <strong>Project</strong>
            <strong>Safe summary opens</strong>
            <strong>Private handoffs</strong>
          </div>
          {data.projects.map((project) => (
            <div key={project.reference}>
              <b>{project.reference}</b>
              <span>{project.summaryOpens}</span>
              <span>{project.privateHandoffs}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="workspace-analytics-empty">
          No project-level workspace activity in this period.
        </p>
      )}
      <small className="workspace-analytics-privacy">{data.privacyNote}</small>
    </section>
  );
}

function ResourceAnalyticsPanel({
  data,
}: {
  data: CommercialAnalytics | null;
}) {
  if (!data) return null;
  const metrics = data.supporting as CommercialAnalytics["supporting"] & {
    resourceViews?: number;
    resourceCtas?: number;
    resourceProductOpens?: number;
  };
  return (
    <section className="admin-resource-analytics">
      <div>
        <p className="eyebrow">SOURCING CONTENT</p>
        <h2>Buyer education to commercial action</h2>
        <p>
          Optional analytics only. Compare guide reads with product evidence
          opens and structured quote-request handoffs; these clicks are intent
          signals, not inquiries or orders.
        </p>
      </div>
      <div>
        <article>
          <small>RESOURCE VIEWS</small>
          <strong>{metrics.resourceViews || 0}</strong>
        </article>
        <article>
          <small>PRODUCT EVIDENCE OPENS</small>
          <strong>{metrics.resourceProductOpens || 0}</strong>
        </article>
        <article>
          <small>QUOTE-BRIEF HANDOFFS</small>
          <strong>{metrics.resourceCtas || 0}</strong>
        </article>
      </div>
    </section>
  );
}

function ProductShareAnalyticsPanel({
  data,
}: {
  data: CommercialAnalytics | null;
}) {
  if (!data) return null;
  const shared = data.products
    .filter((product) => product.shares > 0)
    .sort((a, b) => b.shares - a.shares)
    .slice(0, 6);
  return (
    <section className="admin-resource-analytics">
      <div>
        <p className="eyebrow">BUYING-TEAM HANDOFF</p>
        <h2>Products shared for internal review</h2>
        <p>
          Optional analytics only. A share action shows procurement-team
          interest; it does not prove the recipient opened the link, approved
          the style or created an inquiry.
        </p>
      </div>
      <div>
        <article>
          <small>PRODUCT SHARES</small>
          <strong>{data.supporting.productShares || 0}</strong>
        </article>
        {shared.map((product) => (
          <article key={product.code}>
            <small>{product.code}</small>
            <strong>{product.shares}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function ComparisonAnalyticsPanel({
  data,
}: {
  data: CommercialAnalytics | null;
}) {
  if (!data) return null;
  const comparisons = data.comparisonJourneys || [];
  return (
    <section className="admin-collection-analytics comparison-analytics">
      <div>
        <p className="eyebrow">BUYING-TEAM SHORTLISTS</p>
        <h2>Product combinations shared, opened and printed</h2>
        <p>
          Optional analytics only. Style combinations contain verified BQ codes,
          never buyer identity, quantity, price or notes. A share is not
          delivery; an open or print action is not approval, inquiry or order.
        </p>
      </div>
      <div className="admin-collection-table comparison-journey-table">
        <div>
          <strong>Style combination</strong>
          <strong>Shares</strong>
          <strong>Opens</strong>
          <strong>PDF / print</strong>
        </div>
        {comparisons.length ? (
          comparisons.map((item) => (
            <div key={item.codes}>
              <b>{item.codes}</b>
              <span>{item.shares}</span>
              <span>{item.opens}</span>
              <span>{item.prints || 0}</span>
            </div>
          ))
        ) : (
          <p>No consented comparison-sharing activity in this period.</p>
        )}
      </div>
      <small className="comparison-analytics-boundary">
        Use recurring combinations to guide evidence review and buyer follow-up.
        Do not treat these optional events as unique buyers or causal
        conversion.
      </small>
    </section>
  );
}

function CollectionAnalyticsPanel({
  data,
}: {
  data: CommercialAnalytics | null;
}) {
  if (!data) return null;
  const labels: Record<string, string> = {
    "wide-toe-box": "Wide toe box",
    "knit-slip-on": "Knit slip-on",
    "breathable-lace-up": "Breathable lace-up",
  };
  return (
    <section className="admin-collection-analytics">
      <div>
        <p className="eyebrow">PRODUCT COLLECTION JOURNEYS</p>
        <h2>Buyer intent page to recorded inquiry</h2>
        <p>
          Views, product opens and quote handoffs include only visitors who
          accepted optional analytics. Inquiries and later stages use the
          explicit collection origin saved with the form; current stage does not
          prove the collection caused the outcome.
        </p>
      </div>
      <div className="admin-collection-table">
        <div>
          <strong>Collection</strong>
          <strong>Views</strong>
          <strong>Product opens</strong>
          <strong>Quote handoffs</strong>
          <strong>Inquiries</strong>
          <strong>Qualified</strong>
          <strong>Sample+</strong>
          <strong>Quoted</strong>
          <strong>Orders</strong>
        </div>
        {data.workspace.collectionJourneys.map((item) => (
          <div key={item.slug}>
            <b>{labels[item.slug] || item.slug}</b>
            <span>{item.views}</span>
            <span>{item.productOpens}</span>
            <span>{item.quoteHandoffs}</span>
            <span>{item.inquiries}</span>
            <span>{item.qualified}</span>
            <span>{item.sampleDiscussion}</span>
            <span>{item.quoted}</span>
            <span>{item.orders}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CommercialDashboard({
  data,
  days,
  loading,
  onDaysChange,
  onRefresh,
}: {
  data: CommercialAnalytics | null;
  days: number;
  loading: boolean;
  onDaysChange: (days: number) => void;
  onRefresh: () => void;
}) {
  const stages = data
    ? ([
        ["Product views", data.funnel.productViews],
        ["Quote-list adds", data.funnel.quoteAdds],
        ["Quote requests", data.funnel.quoteRequests],
        ["Saved inquiries", data.funnel.inquiries],
        ["Qualified now", data.funnel.qualified],
        ["Sample stage+", data.funnel.sampleDiscussion],
        ["Quotation issued", data.funnel.quoted],
        ["Quote accepted", data.funnel.quoteAccepted],
        ["Order setup requested", data.funnel.orderSetupRequested],
        ["Orders confirmed", data.funnel.orders],
        ["Fulfillment cases opened", data.supporting.fulfillmentCasesOpened],
        [
          "Fulfillment cases resolved",
          data.supporting.fulfillmentCasesResolved,
        ],
        ["Fulfillment cases open now", data.supporting.fulfillmentCasesOpen],
        ["Receipts confirmed", data.supporting.deliveriesConfirmed],
        ["Delivery issues", data.supporting.deliveryIssuesReported],
        ["Repeat projects submitted", data.supporting.repeatOrdersSubmitted],
        ["Repeat projects qualified", data.supporting.repeatOrdersQualified],
        ["Repeat projects converted", data.supporting.repeatOrdersConverted],
        ["Repeat projects open now", data.supporting.repeatOrdersOpen],
      ] as const)
    : [];
  const maximum = Math.max(1, ...stages.map(([, value]) => value));
  return (
    <section className="admin-commercial-dashboard">
      <div className="admin-dashboard-heading">
        <div>
          <p className="eyebrow">COMMERCIAL FUNNEL</p>
          <h2>From product interest to confirmed order</h2>
          <p>
            {data
              ? `${data.period.from} to ${data.period.to}`
              : "Load the protected pipeline to calculate commercial activity."}
          </p>
        </div>
        <div>
          <label>
            Period
            <select
              value={days}
              onChange={(event) => onDaysChange(Number(event.target.value))}
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </label>
          <button
            className="button button-small"
            type="button"
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? "Loading…" : "Refresh metrics"}
          </button>
        </div>
      </div>
      {data ? (
        <>
          <div className="commercial-funnel">
            {stages.map(([label, value]) => (
              <article key={label}>
                <div>
                  <strong>{label}</strong>
                  <span>{value}</span>
                </div>
                <i
                  style={{
                    width: `${Math.max(value ? 3 : 0, (value / maximum) * 100)}%`,
                  }}
                />
              </article>
            ))}
          </div>
          <WorkspaceAnalyticsPanel data={data.workspace} />
          <div className="commercial-supporting">
            <article>
              <small>MOBILE MENU OPENS</small>
              <strong>{data.supporting.mobileMenuOpens}</strong>
            </article>
            <article>
              <small>MOBILE NAV CLICKS</small>
              <strong>{data.supporting.mobileMenuLinks}</strong>
            </article>
            <article>
              <small>SOURCING-PAGE VIEWS</small>
              <strong>{data.supporting.sourcingProgramViews}</strong>
            </article>
            <article>
              <small>SOURCING CTA CLICKS</small>
              <strong>{data.supporting.sourcingProgramCtas}</strong>
            </article>
            <article>
              <small>LINE-SHEET LEADS</small>
              <strong>{data.supporting.lineSheetLeads}</strong>
            </article>
            <article>
              <small>PDF DOWNLOADS</small>
              <strong>{data.supporting.lineSheetDownloads}</strong>
            </article>
            <article>
              <small>PRODUCT SHEETS</small>
              <strong>{data.supporting.productSpecSheets}</strong>
            </article>
            <article>
              <small>THREAD MESSAGES</small>
              <strong>{data.supporting.buyerMessages}</strong>
            </article>
            <article>
              <small>BUYER FILES</small>
              <strong>{data.supporting.buyerFiles}</strong>
            </article>
            <article>
              <small>BUYER DOCUMENTS</small>
              <strong>{data.supporting.buyerDocuments}</strong>
            </article>
            <article>
              <small>QUOTE REVISIONS</small>
              <strong>{data.supporting.quoteRevisions}</strong>
            </article>
            <article>
              <small>QUOTE DECLINES</small>
              <strong>{data.supporting.quoteDeclines}</strong>
            </article>
            <article>
              <small>ORDER CHANGES PROPOSED</small>
              <strong>{data.supporting.orderChangesProposed}</strong>
            </article>
            <article>
              <small>ORDER CHANGES ACCEPTED</small>
              <strong>{data.supporting.orderChangesAccepted}</strong>
            </article>
            <article>
              <small>ORDER CHANGES REJECTED</small>
              <strong>{data.supporting.orderChangesRejected}</strong>
            </article>
            <article>
              <small>ORDER CHANGES PENDING</small>
              <strong>{data.supporting.orderChangesAwaitingBuyer}</strong>
            </article>
            <article>
              <small>PRE-ORDER DRAFTS ISSUED</small>
              <strong>{data.supporting.orderConfirmationsIssued}</strong>
            </article>
            <article>
              <small>PRE-ORDER BUYER ACCEPTED</small>
              <strong>{data.supporting.orderConfirmationsAccepted}</strong>
            </article>
            <article>
              <small>PRE-ORDER REVISION</small>
              <strong>{data.supporting.orderConfirmationsRevisionRequested}</strong>
            </article>
            <article>
              <small>PRE-ORDER AWAITING BUYER</small>
              <strong>{data.supporting.orderConfirmationsAwaitingBuyer}</strong>
            </article>
            <article>
              <small>FOLLOW-UP OVERDUE</small>
              <strong>{data.supporting.overdue}</strong>
            </article>
            <article>
              <small>RECORD COVERAGE</small>
              <strong>{data.coverage.truncated ? "Partial" : "Loaded"}</strong>
            </article>
          </div>
          <div className="commercial-breakdown">
            <div>
              <h3>Source signals</h3>
              <div className="commercial-table">
                <div>
                  <strong>Source</strong>
                  <strong>Events</strong>
                  <strong>Saved records</strong>
                </div>
                {data.sources.length ? (
                  data.sources.map((source) => (
                    <div key={source.label}>
                      <span>{source.label}</span>
                      <span>{source.events}</span>
                      <span>{source.inquiries}</span>
                    </div>
                  ))
                ) : (
                  <p>No source data in this period.</p>
                )}
              </div>
            </div>
            <div>
              <h3>Product signals</h3>
              <div className="commercial-table commercial-product-table">
                <div>
                  <strong>Style</strong>
                  <strong>Views</strong>
                  <strong>Compares</strong>
                  <strong>Sheets</strong>
                  <strong>Quote adds</strong>
                  <strong>Inquiries</strong>
                </div>
                {data.products.length ? (
                  data.products.map((product) => (
                    <div key={product.code}>
                      <span>{product.code}</span>
                      <span>{product.views}</span>
                      <span>{product.compares}</span>
                      <span>{product.specSheets}</span>
                      <span>{product.quoteAdds}</span>
                      <span>{product.inquiries}</span>
                    </div>
                  ))
                ) : (
                  <p>No product data in this period.</p>
                )}
              </div>
            </div>
          </div>
          <div className="commercial-breakdown">
            <div>
              <h3>Stage changes in period</h3>
              <div className="commercial-table commercial-two-column">
                <div>
                  <strong>Stage entered</strong>
                  <strong>Count</strong>
                </div>
                {data.stageActivity.length ? (
                  data.stageActivity.map((item) => (
                    <div key={item.stage}>
                      <span>{item.stage.replaceAll("_", " ")}</span>
                      <span>{item.count}</span>
                    </div>
                  ))
                ) : (
                  <p>
                    No recorded stage changes. Legacy inquiries may not have
                    history.
                  </p>
                )}
              </div>
            </div>
            <div>
              <h3>Current lost reasons for period cohort</h3>
              <div className="commercial-table commercial-two-column">
                <div>
                  <strong>Primary reason</strong>
                  <strong>Count</strong>
                </div>
                {data.lossReasons.length ? (
                  data.lossReasons.map((item) => (
                    <div key={item.reason}>
                      <span>{item.reason.replaceAll("_", " ")}</span>
                      <span>{item.count}</span>
                    </div>
                  ))
                ) : (
                  <p>No lost opportunities in this cohort.</p>
                )}
              </div>
            </div>
          </div>
          <p className="commercial-data-note">
            {data.period.consentNote} Funnel stages are operating signals, not
            unique-person attribution. “Qualified now” and later stages use the
            inquiry&apos;s current verified record; they must not be presented
            as platform-reported orders.
          </p>
        </>
      ) : null}
    </section>
  );
}

function ReminderCenter({
  summary,
  loading,
  message,
  onRefresh,
  onSend,
}: {
  summary: ReminderSummary | null;
  loading: boolean;
  message: string;
  onRefresh: () => void;
  onSend: () => void;
}) {
  return (
    <section className="admin-reminder-center">
      <div className="admin-reminder-heading">
        <div>
          <p className="eyebrow">SALES REMINDER CENTER</p>
          <h2>Protect active opportunities from silent delay</h2>
          <p>
            {summary
              ? `${summary.today} · upcoming window through ${summary.windowEnds}`
              : "Load the protected pipeline to preview actions."}
          </p>
        </div>
        <div>
          <button type="button" onClick={onRefresh} disabled={loading}>
            Refresh preview
          </button>
          <button
            className="button button-small"
            type="button"
            onClick={onSend}
            disabled={loading || !summary}
          >
            {loading ? "Working…" : "Email today's digest"}
          </button>
        </div>
      </div>
      {summary ? (
        <>
          <div className="reminder-counts">
            <article>
              <small>OVERDUE FOLLOW-UP</small>
              <strong>{summary.counts.followUps}</strong>
            </article>
            <article>
              <small>SHORTLIST FOLLOW-UP</small>
              <strong>{summary.counts.recommendations}</strong>
            </article>
            <article>
              <small>QUOTE EXPIRY</small>
              <strong>{summary.counts.quotes}</strong>
            </article>
            <article>
              <small>MEETING ACTION</small>
              <strong>{summary.counts.meetings}</strong>
            </article>
            <article>
              <small>ORDER PACKET</small>
              <strong>{summary.counts.orderPackets}</strong>
            </article>
            <article>
              <small>PRE-ORDER REVIEW</small>
              <strong>{summary.counts.orderConfirmations}</strong>
            </article>
            <article>
              <small>ORDER CHANGE</small>
              <strong>{summary.counts.orderChanges}</strong>
            </article>
            <article>
              <small>FULFILLMENT CASE</small>
              <strong>{summary.counts.fulfillmentCases}</strong>
            </article>
            <article>
              <small>PAYMENT DUE</small>
              <strong>{summary.counts.payments}</strong>
            </article>
            <article>
              <small>TOTAL ACTIONS</small>
              <strong>{summary.counts.total}</strong>
            </article>
          </div>
          <div className="reminder-lists">
            <div>
              <h3>Follow-up</h3>
              {summary.followUps.slice(0, 6).map((item) => (
                <p key={`${item.reference}-${item.dueDate}`}>
                  <strong>{item.reference}</strong>
                  <span>
                    {item.dueDate} · {item.company} · {item.owner}
                  </span>
                  <small>{item.action}</small>
                </p>
              ))}
              {!summary.followUps.length && <p>No overdue follow-up.</p>}
            </div>
            <div>
              <h3>Product shortlist</h3>
              {summary.recommendations.slice(0, 6).map((item) => (
                <p key={`${item.recommendationId}-${item.stage}`}>
                  <strong>{item.styles}</strong>
                  <span>
                    {item.dueDate} · {item.timing}
                  </span>
                  <small>
                    {item.reference} · {item.company} ·{" "}
                    {item.stage.replaceAll("_", " ")}
                  </small>
                </p>
              ))}
              {!summary.recommendations.length && (
                <p>No shortlist follow-up due.</p>
              )}
            </div>
            <div>
              <h3>Quotation</h3>
              {summary.quotes.slice(0, 6).map((item) => (
                <p key={item.quoteNumber}>
                  <strong>{item.quoteNumber}</strong>
                  <span>
                    {item.validUntil} · {item.timing}
                  </span>
                  <small>
                    {item.company} · {item.owner}
                  </small>
                </p>
              ))}
              {!summary.quotes.length && <p>No quotation expiry action.</p>}
            </div>
            <div>
              <h3>Sourcing meetings</h3>
              {summary.meetings.slice(0, 6).map((item) => (
                <p key={`${item.requestId}-${item.action}`}>
                  <strong>{item.requestId}</strong>
                  <span>
                    {item.dueDate} · {item.timing.replaceAll("_", " ")}
                  </span>
                  <small>
                    {item.reference} · {item.company} ·{" "}
                    {item.action.replaceAll("_", " ")}
                    {item.confirmedSlot
                      ? ` · ${item.confirmedSlot} ${item.timezone}`
                      : ""}{" "}
                    · {item.owner}
                  </small>
                </p>
              ))}
              {!summary.meetings.length && <p>No meeting action due.</p>}
            </div>
            <div>
              <h3>Order change approval</h3>
              {summary.orderChanges.slice(0, 6).map((item) => (
                <p key={item.changeId}>
                  <strong>{item.changeId}</strong>
                  <span>
                    {item.dueDate} · {item.timing} · buyer email{" "}
                    {item.notificationStatus.replaceAll("_", " ")}
                  </span>
                  <small>
                    {item.reference} / {item.orderReference} · version{" "}
                    {item.baseVersion} · {item.changedFields.join(" · ")} ·{" "}
                    {item.owner}
                  </small>
                </p>
              ))}
              {!summary.orderChanges.length && (
                <p>No confirmed-order change awaiting buyer.</p>
              )}
            </div>
            <div>
              <h3>Order packet review</h3>
              {summary.orderPackets.slice(0, 6).map((item) => (
                <p key={item.packetId}>
                  <strong>
                    V{item.version} · {item.quoteNumber}
                  </strong>
                  <span>
                    {item.dueDate} · {item.timing.replaceAll("_", " ")}
                  </span>
                  <small>
                    {item.reference} · {item.company} · {item.owner}
                  </small>
                </p>
              ))}
              {!summary.orderPackets.length && (
                <p>No order packet awaiting review.</p>
              )}
            </div>
            <div>
              <h3>Pre-order written confirmation</h3>
              {summary.orderConfirmations.slice(0, 6).map((item) => (
                <p key={item.draftId}>
                  <strong>V{item.version} · {item.status.replaceAll("_", " ")}</strong>
                  <span>{item.dueDate} · {item.timing.replaceAll("_", " ")}</span>
                  <small>{item.reference} · {item.company} · {item.action.replaceAll("_", " ")} · {item.owner}</small>
                </p>
              ))}
              {!summary.orderConfirmations.length && <p>No pre-order confirmation action due.</p>}
            </div>
            <div>
              <h3>Fulfillment exceptions</h3>
              {summary.fulfillmentCases.slice(0, 6).map((item) => (
                <p key={item.caseId}>
                  <strong>
                    {item.caseId} · {item.category.replaceAll("_", " ")}
                  </strong>
                  <span>
                    {item.dueDate} · {item.timing} ·{" "}
                    {item.status.replaceAll("_", " ")}
                  </span>
                  <small>
                    {item.reference} / {item.orderReference} · {item.owner}
                  </small>
                </p>
              ))}
              {!summary.fulfillmentCases.length && (
                <p>No fulfillment exception action.</p>
              )}
            </div>
            <div>
              <h3>Payment</h3>
              {summary.payments.slice(0, 6).map((item) => (
                <p key={`${item.reference}-${item.label}-${item.dueDate}`}>
                  <strong>
                    {item.label} · {item.currency} {item.amount}
                  </strong>
                  <span>
                    {item.dueDate} · {item.timing}
                  </span>
                  <small>
                    {item.reference} · {item.company} · {item.owner}
                  </small>
                </p>
              ))}
              {!summary.payments.length && <p>No payment milestone action.</p>}
            </div>
          </div>
        </>
      ) : null}
      <p className="reminder-message" aria-live="polite">
        {message}
      </p>
      <small>
        This is an internal action digest. It never sends a buyer follow-up
        automatically, prove payment, extend a quotation or confirm an order.
        Only one digest can be sent per calendar day.
      </small>
    </section>
  );
}

function RepeatOrderReminderList({
  summary,
}: {
  summary: ReminderSummary | null;
}) {
  if (!summary?.repeatOrders?.length) return null;
  return (
    <section className="admin-repeat-reminders">
      <div>
        <p className="eyebrow">REPEAT-ORDER ACTIONS</p>
        <h2>
          {summary.counts.repeatOrders} next-project action
          {summary.counts.repeatOrders === 1 ? "" : "s"} due
        </h2>
        <p>
          Respond with one concrete shortlist, sample, quotation or formal-order
          preparation step. Do not reuse old commercial terms without review.
        </p>
      </div>
      <div>
        {summary.repeatOrders.slice(0, 12).map((item) => (
          <article key={item.opportunityId}>
            <strong>
              {item.opportunityId} · {item.intent.replaceAll("_", " ")}
            </strong>
            <span>
              {item.dueDate} · {item.timing} ·{" "}
              {item.status.replaceAll("_", " ")}
            </span>
            <p>
              {item.reference} / {item.sourceOrderReference} · {item.company} ·{" "}
              {item.owner}
            </p>
            <small>
              {item.styles.join(", ") || "Styles to discuss"} ·{" "}
              {item.indicativeQuantity} · {item.action}
            </small>
          </article>
        ))}
      </div>
    </section>
  );
}

function RelationshipCenter({
  groups,
  onShowRepeat,
}: {
  groups: RelationshipGroup<Inquiry>[];
  onShowRepeat: () => void;
}) {
  const linkedRecords = groups.reduce(
    (sum, group) => sum + group.records.length,
    0,
  );
  return (
    <section className="admin-relationship-center">
      <div className="admin-relationship-heading">
        <div>
          <p className="eyebrow">BUYER RELATIONSHIP MEMORY</p>
          <h2>Recognize repeat interest without merging evidence</h2>
          <p>
            Exact email, normalized WhatsApp digits and normalized company names
            are internal signals only. Review them before treating records as
            one account.
          </p>
        </div>
        <button
          className="button button-small"
          type="button"
          onClick={onShowRepeat}
          disabled={!groups.length}
        >
          Show repeat records
        </button>
      </div>
      <div className="relationship-counts">
        <article>
          <small>REPEAT ACCOUNT SIGNALS</small>
          <strong>{groups.length}</strong>
        </article>
        <article>
          <small>LINKED RECORDS</small>
          <strong>{linkedRecords}</strong>
        </article>
      </div>
      {groups.length ? (
        <div className="relationship-groups">
          {groups.slice(0, 8).map((group) => {
            const latest = group.records[0];
            const companies = [
              ...new Set(
                group.records.map((record) => record.company).filter(Boolean),
              ),
            ];
            return (
              <article key={group.id}>
                <div>
                  <strong>{latest.company || latest.name}</strong>
                  <span>
                    {group.records.length} records · {companies.length}{" "}
                    company-name variant{companies.length === 1 ? "" : "s"}
                  </span>
                </div>
                <p>{group.matchBasis.join(" + ")}</p>
                <small>
                  Styles: {group.styleCodes.join(" · ") || "No style recorded"}
                </small>
                <nav
                  aria-label={`Related inquiries for ${latest.company || latest.name}`}
                >
                  {group.records.map((record) => (
                    <a key={record.reference} href={`#${record.reference}`}>
                      {record.reference} · {record.status.replaceAll("_", " ")}
                    </a>
                  ))}
                </nav>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="relationship-empty">
          No repeat-account signal in the loaded business records.
        </p>
      )}
      <small className="relationship-boundary">
        A match is not proof of legal identity, account ownership or duplicate
        order. Never merge, delete, quote or disclose records on this signal
        alone.
      </small>
    </section>
  );
}

function RelatedInquiryHistory({
  current,
  group,
}: {
  current: Inquiry;
  group?: RelationshipGroup<Inquiry>;
}) {
  if (!group) return null;
  return (
    <details className="admin-related-history">
      <summary>
        Related inquiry history · {group.records.length} records
      </summary>
      <p>
        Matched by {group.matchBasis.join(" + ")}. Verify the buyer before using
        prior specifications, prices or documents.
      </p>
      <div>
        {group.records.map((record) => (
          <a
            key={record.reference}
            href={`#${record.reference}`}
            className={record.reference === current.reference ? "current" : ""}
          >
            <strong>{record.reference}</strong>
            <span>
              {record.receivedAt?.slice(0, 10) || "—"} ·{" "}
              {record.status.replaceAll("_", " ")} · {record.styleCode}
            </span>
          </a>
        ))}
      </div>
    </details>
  );
}

function WorkspaceContactManager({
  record,
  token,
  onSaved,
}: {
  record: Inquiry;
  token: string;
  onSaved: (record: Inquiry) => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("purchasing");
  const [authorizationBasis, setAuthorizationBasis] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [primaryReason, setPrimaryReason] = useState("");
  const contacts = record.workspaceContacts || [];
  const active = contacts.filter((contact) => contact.status === "active");
  const revoked = contacts.filter((contact) => contact.status === "revoked");
  const pendingRequests = (record.workspaceAccessRequests || []).filter(
    (request) => request.status === "pending",
  );
  async function grant(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("Saving authorization before notification…");
    try {
      const response = await fetch("/api/admin/workspace-contacts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: record.reference,
          receivedAt: record.receivedAt,
          email,
          name,
          role,
          authorizationBasis,
          authorizationConfirmed: confirmed,
          actor: record.owner || "Beiqiang sales team",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(
          result.message || "Workspace access could not be granted.",
        );
      onSaved(result.record);
      setEmail("");
      setName("");
      setRole("purchasing");
      setAuthorizationBasis("");
      setConfirmed(false);
      setMessage(
        `Access granted${result.notificationSent ? " and contact emailed" : "; notification was not delivered"}.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Workspace access could not be granted.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function revoke(contact: WorkspaceContact) {
    const revocationReason = reasons[contact.id]?.trim() || "";
    if (revocationReason.length < 5) {
      setMessage("Record a specific revocation reason before removing access.");
      return;
    }
    setSaving(true);
    setMessage("Revoking access before notification…");
    try {
      const response = await fetch("/api/admin/workspace-contacts", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: record.reference,
          receivedAt: record.receivedAt,
          contactId: contact.id,
          revocationReason,
          actor: record.owner || "Beiqiang sales team",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(
          result.message || "Workspace access could not be revoked.",
        );
      onSaved(result.record);
      setReasons((current) => ({ ...current, [contact.id]: "" }));
      setMessage(
        `Access revoked immediately${result.notificationSent ? " and contact emailed" : "; revocation notification was not delivered"}.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Workspace access could not be revoked.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function changePrimaryAccess(action: "revoke" | "restore") {
    if (primaryReason.trim().length < 5) {
      setMessage(
        `Record the verified reason before ${action === "revoke" ? "revoking" : "restoring"} primary-email access.`,
      );
      return;
    }
    setSaving(true);
    setMessage(
      `${action === "revoke" ? "Revoking" : "Restoring"} primary-email workspace access…`,
    );
    try {
      const response = await fetch("/api/admin/workspace-contacts", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: record.reference,
          receivedAt: record.receivedAt,
          contactId: "PRIMARY",
          action,
          reason: primaryReason,
          actor: record.owner || "Beiqiang sales team",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(
          result.message || "Primary workspace access could not be changed.",
        );
      onSaved(result.record);
      setPrimaryReason("");
      setMessage(
        `Primary-email workspace access ${action === "revoke" ? "revoked" : "restored"}${result.notificationSent ? " and contact emailed" : "; notification was not delivered"}.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Primary workspace access could not be changed.",
      );
    } finally {
      setSaving(false);
    }
  }
  function reviewRequest(request: WorkspaceAccessRequest) {
    setName(request.name);
    setEmail(request.email);
    setRole(request.role);
    setAuthorizationBasis(
      `Buyer requested ${request.role.replaceAll("_", " ")} access for: ${request.purpose}`,
    );
    setConfirmed(false);
    setMessage(
      "Request loaded into the grant form. Independently verify authority before checking the confirmation box.",
    );
  }
  async function rejectRequest(request: WorkspaceAccessRequest) {
    const reason = reasons[request.id]?.trim() || "";
    if (reason.length < 5) {
      setMessage("Record a specific reason before rejecting this request.");
      return;
    }
    setSaving(true);
    setMessage("Rejecting the unverified access request…");
    try {
      const response = await fetch("/api/admin/workspace-contacts", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: record.reference,
          receivedAt: record.receivedAt,
          accessRequestId: request.id,
          action: "reject_request",
          reason,
          actor: record.owner || "Beiqiang sales team",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(
          result.message || "Workspace access request could not be rejected.",
        );
      onSaved(result.record);
      setReasons((current) => ({ ...current, [request.id]: "" }));
      setMessage("Access request rejected without granting project access.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Workspace access request could not be rejected.",
      );
    } finally {
      setSaving(false);
    }
  }
  const primaryRevoked = record.workspacePrimaryAccess?.status === "revoked";
  return (
    <details className="admin-workspace-contacts">
      <summary>
        Buyer workspace contacts · {primaryRevoked ? "primary revoked · " : ""}
        {active.length} delegated active
      </summary>
      <div className="workspace-contact-primary">
        <div>
          <small>PRIMARY INQUIRY CONTACT</small>
          <strong>{record.email || "No primary email recorded"}</strong>
          <span>
            {primaryRevoked
              ? `Workspace access revoked · ${record.workspacePrimaryAccess?.reason}`
              : "Workspace access active"}
          </span>
        </div>
        <div>
          <label>
            {primaryRevoked ? "Restoration basis" : "Revocation reason"}
            <input
              value={primaryReason}
              maxLength={500}
              onChange={(event) => setPrimaryReason(event.target.value)}
              placeholder={
                primaryRevoked
                  ? "Verified request to restore access…"
                  : "Left company, mailbox compromised, authority withdrawn…"
              }
            />
          </label>
          <button
            type="button"
            disabled={saving || !record.email}
            onClick={() =>
              void changePrimaryAccess(primaryRevoked ? "restore" : "revoke")
            }
          >
            {primaryRevoked
              ? "Restore primary access"
              : "Revoke primary access"}
          </button>
        </div>
      </div>
      <p className="workspace-contact-boundary">
        Grant only after verifying written authority from the buyer company.
        Matching company names, email domains or relationship signals never
        grant access automatically. Delegates can read this project&apos;s
        buyer-safe workspace summary only; the project code remains mandatory
        for sensitive details and decisions.
      </p>
      {pendingRequests.length ? (
        <section className="workspace-contact-list workspace-access-request-list">
          <h4>Buyer-requested colleague access · verify before action</h4>
          {pendingRequests.map((request) => (
            <article key={request.id}>
              <div>
                <strong>{request.name}</strong>
                <span>
                  {request.email} · {request.role.replaceAll("_", " ")}
                </span>
                <small>
                  Requested {new Date(request.requestedAt).toLocaleString()} ·
                  sales email {request.notificationStatus.replaceAll("_", " ")}
                </small>
                <p>{request.purpose}</p>
              </div>
              <div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => reviewRequest(request)}
                >
                  Load for verification
                </button>
                <label>
                  Rejection reason
                  <input
                    value={reasons[request.id] || ""}
                    maxLength={500}
                    onChange={(event) =>
                      setReasons((current) => ({
                        ...current,
                        [request.id]: event.target.value,
                      }))
                    }
                    placeholder="Authority not verified, role unclear…"
                  />
                </label>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void rejectRequest(request)}
                >
                  Reject without access
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : null}
      {active.length ? (
        <div className="workspace-contact-list">
          {active.map((contact) => (
            <article key={contact.id}>
              <div>
                <strong>{contact.name}</strong>
                <span>
                  {contact.email} · {contact.role.replaceAll("_", " ")}
                </span>
                <small>
                  Granted {new Date(contact.grantedAt).toLocaleString()} by{" "}
                  {contact.grantedBy} · email{" "}
                  {contact.notificationStatus.replaceAll("_", " ")}
                </small>
                <p>{contact.authorizationBasis}</p>
              </div>
              <div>
                <label>
                  Revocation reason
                  <input
                    value={reasons[contact.id] || ""}
                    maxLength={500}
                    onChange={(event) =>
                      setReasons((current) => ({
                        ...current,
                        [contact.id]: event.target.value,
                      }))
                    }
                    placeholder="Role changed, left company, authorization withdrawn…"
                  />
                </label>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void revoke(contact)}
                >
                  Revoke now
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="workspace-contact-empty">
          No delegated contact currently has access to this project.
        </p>
      )}
      <form className="workspace-contact-form" onSubmit={grant}>
        <div>
          <label>
            Contact name
            <input
              required
              minLength={2}
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            Authorized email
            <input
              required
              type="email"
              maxLength={180}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Role
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="purchasing">Purchasing</option>
              <option value="merchandising">Merchandising</option>
              <option value="operations">Operations / logistics</option>
              <option value="finance">Finance</option>
              <option value="management">Management</option>
              <option value="sourcing_agent">Sourcing agent</option>
              <option value="other">Other verified role</option>
            </select>
          </label>
        </div>
        <label>
          Written authorization basis
          <textarea
            required
            minLength={8}
            maxLength={500}
            rows={3}
            value={authorizationBasis}
            onChange={(event) => setAuthorizationBasis(event.target.value)}
            placeholder="Who authorized access, through which verified channel, and for what project purpose?"
          />
        </label>
        <label className="workspace-contact-confirm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            required
          />
          <span>
            I verified authority to share this project&apos;s buyer-safe
            workspace summary with this contact.
          </span>
        </label>
        <button className="button button-small" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Grant project access"}
        </button>
      </form>
      {revoked.length ? (
        <details className="workspace-contact-history">
          <summary>Revoked contacts ({revoked.length})</summary>
          {[...revoked].reverse().map((contact) => (
            <p key={contact.id}>
              <strong>
                {contact.name} · {contact.email}
              </strong>
              <span>
                Revoked{" "}
                {contact.revokedAt
                  ? new Date(contact.revokedAt).toLocaleString()
                  : "—"}{" "}
                by {contact.revokedBy} · {contact.revocationReason}
              </span>
              <small>
                Notification{" "}
                {contact.revocationNotificationStatus?.replaceAll("_", " ") ||
                  "not attempted"}
              </small>
            </p>
          ))}
        </details>
      ) : null}
      {record.workspaceContactAudit?.length ? (
        <details className="workspace-contact-history">
          <summary>
            Authorization audit ({record.workspaceContactAudit.length})
          </summary>
          {[...record.workspaceContactAudit].reverse().map((item) => (
            <p key={item.id}>
              <strong>
                {item.action} · {item.email}
              </strong>
              <span>
                {new Date(item.changedAt).toLocaleString()} · {item.actor} ·{" "}
                {item.role.replaceAll("_", " ")}
              </span>
              <small>{item.reason}</small>
            </p>
          ))}
        </details>
      ) : null}
      <p aria-live="polite">{message}</p>
    </details>
  );
}

function DataLifecycleCenter({
  record,
  token,
  onSaved,
}: {
  record: Inquiry;
  token: string;
  onSaved: (record: Inquiry) => void;
}) {
  const data = record.dataLifecycle || {};
  const deletion = data.deletion;
  const holdActive = data.hold?.status === "active";
  const [reason, setReason] = useState("");
  const [reviewDue, setReviewDue] = useState("");
  const [category, setCategory] = useState("contract_or_order");
  const [verificationBasis, setVerificationBasis] = useState("");
  const [actor, setActor] = useState(record.owner || "");
  const [deletionToken, setDeletionToken] = useState("");
  const [approver, setApprover] = useState("");
  const [approvalBasis, setApprovalBasis] = useState("");
  const [authoritativeRecordsPreserved, setAuthoritativeRecordsPreserved] =
    useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [executionBasis, setExecutionBasis] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  async function post(action: string, extra: Record<string, unknown> = {}) {
    if (reason.trim().length < 8) {
      setMessage(
        "Record a specific lifecycle reason of at least 8 characters.",
      );
      return;
    }
    setSaving(true);
    setMessage("Saving lifecycle evidence…");
    try {
      const response = await fetch("/api/admin/data-lifecycle", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: record.reference,
          receivedAt: record.receivedAt,
          action,
          reason,
          actor: actor || record.owner || "Authorized admin",
          ...extra,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(
          result.message || "Lifecycle action could not be saved.",
        );
      onSaved(result.record);
      setReason("");
      setVerificationBasis("");
      setMessage("Lifecycle action saved with an audit event.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Lifecycle action could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function approve() {
    setSaving(true);
    setMessage("Checking independent deletion approval…");
    try {
      const response = await fetch("/api/admin/data-lifecycle", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Deletion-Authorization": deletionToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: record.reference,
          receivedAt: record.receivedAt,
          approver,
          approvalBasis,
          authoritativeRecordsPreserved,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(
          result.message || "Deletion approval could not be saved.",
        );
      onSaved(result.record);
      setDeletionToken("");
      setApprovalBasis("");
      setMessage(
        `Deletion approved with a 24-hour cooling-off period. Earliest execution: ${new Date(result.lifecycle.deletion.deleteAfter).toLocaleString()}.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Deletion approval could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function execute() {
    if (
      !window.confirm(
        `Permanently delete website-held data for ${record.reference}? This cannot be undone. External Trade Assurance, contract, accounting and logistics records are outside this action.`,
      )
    )
      return;
    setSaving(true);
    setMessage("Executing approved website-record deletion…");
    try {
      const response = await fetch("/api/admin/data-lifecycle", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Deletion-Authorization": deletionToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: record.reference,
          receivedAt: record.receivedAt,
          actor,
          confirmation,
          executionBasis,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(result.message || "Deletion did not complete.");
      setMessage(
        `Deletion completed. Receipt ${result.receipt.requestId}: ${result.receipt.counts.filesDeleted} files and ${result.receipt.counts.inquiryRecordsDeleted} website inquiry record removed.`,
      );
      onSaved({
        ...record,
        status: "deleted",
        company: "Deleted website record",
        name: "",
        email: "",
        whatsapp: "",
        dataLifecycle: {
          ...data,
          deletion: { ...deletion!, status: "completed" },
        },
      });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Deletion did not complete.",
      );
    } finally {
      setSaving(false);
    }
  }
  const canAttemptExecution = deletion?.status === "approved" && !holdActive;
  return (
    <details className="admin-data-lifecycle">
      <summary>
        Data lifecycle &amp; deletion control ·{" "}
        {holdActive
          ? "HOLD ACTIVE"
          : deletion?.status?.replaceAll("_", " ") || "no deletion request"}
      </summary>
      <div className="data-lifecycle-boundary">
        <strong>No automatic destruction</strong>
        <p>
          A review date never deletes data. A hold blocks deletion. Permanent
          deletion applies only to this website&apos;s record and files; it does
          not erase Alibaba Trade Assurance, signed contracts, accounting,
          logistics, dispute or legally required records.
        </p>
      </div>
      <div className="data-lifecycle-status">
        <article>
          <small>RETENTION REVIEW</small>
          <strong>{data.review?.reviewDue || "Not scheduled"}</strong>
          <span>
            {data.review?.reason ||
              "Schedule a human review; do not invent a legal retention period."}
          </span>
        </article>
        <article>
          <small>RETENTION HOLD</small>
          <strong>
            {holdActive
              ? data.hold?.category?.replaceAll("_", " ")
              : data.hold?.status || "None"}
          </strong>
          <span>
            {holdActive
              ? data.hold?.reason
              : "Deletion is blocked only when an active hold is recorded."}
          </span>
        </article>
        <article>
          <small>DELETION WORKFLOW</small>
          <strong>
            {deletion?.status?.replaceAll("_", " ") || "Not requested"}
          </strong>
          <span>
            {deletion?.requestId ||
              "Requires verified buyer request and independent approval."}
          </span>
        </article>
      </div>
      <div className="data-lifecycle-forms">
        <label>
          Operator name
          <input
            value={actor}
            maxLength={100}
            onChange={(event) => setActor(event.target.value)}
          />
        </label>
        <label>
          Lifecycle reason
          <textarea
            rows={2}
            maxLength={1200}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Specific business, buyer-request, dispute or retention reason"
          />
        </label>
        <div className="data-lifecycle-actions">
          <label>
            Review date
            <input
              type="date"
              value={reviewDue}
              onChange={(event) => setReviewDue(event.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={saving || !reviewDue}
            onClick={() => void post("schedule_review", { reviewDue })}
          >
            Schedule review
          </button>
        </div>
        <div className="data-lifecycle-actions">
          <label>
            Hold category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="contract_or_order">Contract / order</option>
              <option value="payment_or_dispute">Payment / dispute</option>
              <option value="fulfillment_or_claim">Fulfillment / claim</option>
              <option value="legal_or_regulatory">Legal / regulatory</option>
              <option value="fraud_or_security">Fraud / security</option>
              <option value="other_reviewed_reason">
                Other reviewed reason
              </option>
            </select>
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void post(
                holdActive ? "release_hold" : "place_hold",
                holdActive ? {} : { category },
              )
            }
          >
            {holdActive ? "Release hold after review" : "Place retention hold"}
          </button>
        </div>
      </div>
      {!deletion ||
      ["cancelled", "execution_failed"].includes(deletion.status) ? (
        <section className="data-deletion-request">
          <h4>Request permanent website-record deletion</h4>
          <label>
            Verified request basis
            <textarea
              rows={3}
              maxLength={1200}
              value={verificationBasis}
              onChange={(event) => setVerificationBasis(event.target.value)}
              placeholder="Who requested deletion, identity verification used, channel, date and exact scope"
            />
          </label>
          <button
            type="button"
            disabled={saving || holdActive}
            onClick={() =>
              void post("request_deletion", {
                scope: "full_website_inquiry_and_files",
                verificationBasis,
              })
            }
          >
            Record deletion request
          </button>
        </section>
      ) : null}
      {deletion?.status === "requested" ? (
        <section className="data-deletion-approval">
          <h4>Independent deletion approval</h4>
          <label>
            Separate deletion token
            <input
              type="password"
              autoComplete="off"
              value={deletionToken}
              onChange={(event) => setDeletionToken(event.target.value)}
            />
          </label>
          <label>
            Named approver
            <input
              value={approver}
              maxLength={100}
              onChange={(event) => setApprover(event.target.value)}
              placeholder="Must differ from requester"
            />
          </label>
          <label>
            Retention / legal assessment
            <textarea
              rows={3}
              maxLength={1200}
              value={approvalBasis}
              onChange={(event) => setApprovalBasis(event.target.value)}
            />
          </label>
          <label className="data-lifecycle-check">
            <input
              type="checkbox"
              checked={authoritativeRecordsPreserved}
              onChange={(event) =>
                setAuthoritativeRecordsPreserved(event.target.checked)
              }
            />
            <span>
              Required Trade Assurance, contract, accounting, logistics, dispute
              and shipment records remain in their authoritative systems.
            </span>
          </label>
          <button
            type="button"
            disabled={saving || holdActive}
            onClick={() => void approve()}
          >
            Approve &amp; start 24-hour cooling-off
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void post("cancel_deletion")}
          >
            Cancel request
          </button>
        </section>
      ) : null}
      {deletion?.status === "approved" ? (
        <section className="data-deletion-execution">
          <h4>Permanent website deletion</h4>
          <p>
            Earliest execution:{" "}
            {new Date(deletion.deleteAfter || "").toLocaleString()} · the server
            enforces the cooling-off time again when submitted.
          </p>
          <label>
            Separate deletion token
            <input
              type="password"
              autoComplete="off"
              value={deletionToken}
              onChange={(event) => setDeletionToken(event.target.value)}
            />
          </label>
          <label>
            Exact confirmation
            <input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder={`DELETE ${record.reference}`}
            />
          </label>
          <label>
            Execution basis
            <textarea
              rows={3}
              maxLength={1200}
              value={executionBasis}
              onChange={(event) => setExecutionBasis(event.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={saving || !canAttemptExecution}
            onClick={() => void execute()}
          >
            Permanently delete website-held record
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void post("cancel_deletion")}
          >
            Cancel before execution
          </button>
        </section>
      ) : null}
      {data.audit?.length ? (
        <details className="data-lifecycle-audit">
          <summary>Lifecycle audit ({data.audit.length})</summary>
          {[...data.audit].reverse().map((event) => (
            <p key={event.id}>
              <strong>{event.action.replaceAll("_", " ")}</strong>
              <span>
                {new Date(event.changedAt).toLocaleString()} · {event.actor}
              </span>
              <small>{event.reason}</small>
            </p>
          ))}
        </details>
      ) : null}
      <p aria-live="polite">{message}</p>
    </details>
  );
}

function ProductRecommendationEditor({
  record,
  token,
  onSaved,
}: {
  record: Inquiry;
  token: string;
  onSaved: (record: Inquiry) => void;
}) {
  const requestedCodes = [
    ...new Set([
      ...(record.items || []).map((item) => item.code),
      ...record.styleCode.split(/[,/]/).map((code) => code.trim()),
    ]),
  ]
    .filter((code) => products.some((product) => product.code === code))
    .slice(0, 5);
  const [selectedCodes, setSelectedCodes] = useState<string[]>(requestedCodes);
  const [title, setTitle] = useState(
    `Recommended product directions for ${record.company || "your sourcing project"}`,
  );
  const [introduction, setIntroduction] = useState(
    `These options were selected for review against your stated ${record.market || "target market"} and ${record.buyerType || "buyer"} requirements. Please compare the verified product pages before choosing sample or quotation directions.`,
  );
  const [nextStep, setNextStep] = useState(
    "Choose the relevant styles, then confirm expected quantity, colors, size ratio and whether you want samples before a bulk quotation.",
  );
  const [reasons, setReasons] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      products.map((product) => [product.code, product.shortDescription]),
    ),
  );
  const [message, setMessage] = useState("");
  const [issuing, setIssuing] = useState(false);
  const currentRecommendation = record.recommendationSets?.at(-1);
  const followUps = currentRecommendation?.followUps || [];
  const nextFollowUpStage: RecommendationFollowUpStage | null =
    followUps.length === 0
      ? "selection_check"
      : followUps.length === 1
        ? "sample_or_quote"
        : null;
  const followUpBase = followUps.length
    ? followUps.at(-1)?.sentAt
    : currentRecommendation?.issuedAt;
  const followUpDueValue = followUpBase ? new Date(followUpBase) : null;
  if (followUpDueValue)
    followUpDueValue.setUTCDate(
      followUpDueValue.getUTCDate() + (followUps.length ? 4 : 2),
    );
  const followUpDue = followUpDueValue?.toISOString().slice(0, 10) || "";
  const followUpReady = Boolean(
    followUpDue && followUpDue <= new Date().toISOString().slice(0, 10),
  );
  const [followUpBody, setFollowUpBody] = useState("");
  const [followUpStage, setFollowUpStage] =
    useState<RecommendationFollowUpStage | null>(null);
  const [sendingFollowUp, setSendingFollowUp] = useState(false);
  function toggle(code: string) {
    setSelectedCodes((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : current.length < 5
          ? [...current, code]
          : current,
    );
  }
  function loadFollowUp() {
    if (!currentRecommendation || !nextFollowUpStage) return;
    if (!followUpReady) {
      setMessage(
        `The next follow-up is scheduled for ${followUpDue}. Review it then to avoid repetitive contact.`,
      );
      return;
    }
    if (followUpBody.trim()) {
      setMessage(
        "Clear the current follow-up draft before loading another one.",
      );
      return;
    }
    setFollowUpStage(nextFollowUpStage);
    setFollowUpBody(
      buildRecommendationFollowUp(
        record,
        currentRecommendation,
        nextFollowUpStage,
      ),
    );
    setMessage(
      "Buyer-specific draft loaded. Review every detail before sending.",
    );
  }
  async function sendFollowUp() {
    if (
      !currentRecommendation ||
      !followUpStage ||
      followUpStage !== nextFollowUpStage ||
      followUpBody.trim().length < 2
    ) {
      setMessage("Load and review the next allowed follow-up before sending.");
      return;
    }
    setSendingFollowUp(true);
    setMessage("Saving recommendation follow-up…");
    try {
      const response = await fetch("/api/admin/inquiry-message", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: record.reference,
          receivedAt: record.receivedAt,
          message: followUpBody,
          recommendationId: currentRecommendation.id,
          recommendationFollowUpStage: followUpStage,
          sentBy: record.owner,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(
          result.message || "Recommendation follow-up could not be saved.",
        );
      onSaved(result.record);
      setFollowUpBody("");
      setFollowUpStage(null);
      setMessage(
        `Follow-up saved in the private thread${result.notificationSent ? " and emailed" : "; buyer email was not sent"}.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Recommendation follow-up could not be saved.",
      );
    } finally {
      setSendingFollowUp(false);
    }
  }
  async function issue() {
    if (selectedCodes.length < 2 || selectedCodes.length > 5) {
      setMessage("Choose 2 to 5 products for a focused recommendation.");
      return;
    }
    if (selectedCodes.some((code) => (reasons[code] || "").trim().length < 8)) {
      setMessage("Write a buyer-safe reason for every selected product.");
      return;
    }
    setIssuing(true);
    setMessage("Issuing buyer product shortlist…");
    try {
      const response = await fetch("/api/admin/recommendation", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: record.reference,
          receivedAt: record.receivedAt,
          title,
          introduction,
          nextStep,
          issuedBy: record.owner,
          items: selectedCodes.map((code) => ({ code, reason: reasons[code] })),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(
          result.message || "Product shortlist could not be issued.",
        );
      onSaved(result.record);
      setMessage(
        `Shortlist issued to the private buyer page${result.notificationSent ? " and emailed" : "; email was not sent"}.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Product shortlist could not be issued.",
      );
    } finally {
      setIssuing(false);
    }
  }
  return (
    <details className="admin-product-recommendation">
      <summary>
        Curated product shortlist{" "}
        {record.recommendationSets?.length
          ? `· ${record.recommendationSets.length} version${record.recommendationSets.length === 1 ? "" : "s"}`
          : ""}
      </summary>
      <div className="recommendation-editor">
        <div className="admin-follow-up-grid">
          <label className="admin-form-full">
            Buyer-facing title
            <input
              value={title}
              maxLength={160}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className="admin-form-full">
            Why these options
            <textarea
              rows={3}
              maxLength={1200}
              value={introduction}
              onChange={(event) => setIntroduction(event.target.value)}
            />
          </label>
          <label className="admin-form-full">
            Suggested next step
            <textarea
              rows={2}
              maxLength={600}
              value={nextStep}
              onChange={(event) => setNextStep(event.target.value)}
            />
          </label>
        </div>
        <div className="recommendation-product-picker">
          <div>
            <strong>Select 2–5 products</strong>
            <span>{selectedCodes.length}/5 selected</span>
          </div>
          <div>
            {products.map((product) => (
              <label
                key={product.code}
                className={
                  selectedCodes.includes(product.code) ? "selected" : ""
                }
              >
                <input
                  type="checkbox"
                  checked={selectedCodes.includes(product.code)}
                  onChange={() => toggle(product.code)}
                  disabled={
                    !selectedCodes.includes(product.code) &&
                    selectedCodes.length >= 5
                  }
                />
                <Image
                  unoptimized
                  src={`/catalog-thumbs/${product.slug}.webp`}
                  alt=""
                  width={64}
                  height={64}
                />
                <span>
                  <strong>{product.code}</strong>
                  <small>{product.name}</small>
                </span>
              </label>
            ))}
          </div>
        </div>
        {selectedCodes.length ? (
          <div className="recommendation-reasons">
            {selectedCodes.map((code) => {
              const product = products.find((item) => item.code === code)!;
              return (
                <label key={code}>
                  <span>
                    <strong>{code}</strong> · {product.name}
                  </span>
                  <textarea
                    rows={2}
                    maxLength={600}
                    value={reasons[code] || ""}
                    onChange={(event) =>
                      setReasons((current) => ({
                        ...current,
                        [code]: event.target.value,
                      }))
                    }
                    placeholder="Buyer-safe reason based on verified product facts"
                  />
                </label>
              );
            })}
          </div>
        ) : null}
        <button
          className="button button-small"
          type="button"
          disabled={issuing}
          onClick={issue}
        >
          {issuing ? "Issuing…" : "Issue shortlist to buyer"}
        </button>
        <p aria-live="polite">{message}</p>
        <small>
          Issue only verified product directions. This does not confirm price,
          availability, fit, materials, technical targets, sample terms or an
          order.
        </small>
        {currentRecommendation?.status === "issued" ? (
          <section className="recommendation-nurture">
            <div>
              <div>
                <strong>Human-reviewed shortlist follow-up</strong>
                <span>
                  {followUps.length}/2 messages sent ·{" "}
                  {nextFollowUpStage
                    ? `next: ${nextFollowUpStage.replaceAll("_", " ")} on ${followUpDue}`
                    : "sequence complete"}
                </span>
              </div>
              {nextFollowUpStage && (
                <button
                  type="button"
                  onClick={loadFollowUp}
                  disabled={!followUpReady}
                >
                  Load next buyer-specific draft
                </button>
              )}
            </div>
            {followUpBody && (
              <>
                <textarea
                  rows={9}
                  maxLength={2000}
                  value={followUpBody}
                  onChange={(event) => setFollowUpBody(event.target.value)}
                />
                <div>
                  <small>
                    {followUpBody.length}/2000 · Review product facts and one
                    clear next action.
                  </small>
                  <button
                    className="button button-small"
                    type="button"
                    disabled={sendingFollowUp}
                    onClick={sendFollowUp}
                  >
                    {sendingFollowUp
                      ? "Sending…"
                      : "Save in thread & notify buyer"}
                  </button>
                </div>
              </>
            )}
            <small>
              No message is sent automatically. The first review is due two days
              after issue, the second four days after the first, and the
              sequence stops after two reviewed follow-ups or immediately after
              a buyer response.
            </small>
          </section>
        ) : null}
        {record.recommendationSets?.length ? (
          <div className="recommendation-history">
            <strong>Issued shortlist history</strong>
            {[...record.recommendationSets].reverse().map((item) => (
              <article key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <span>
                    {item.items.map((product) => product.code).join(" · ")} ·{" "}
                    {item.status.replaceAll("_", " ")}
                  </span>
                </div>
                <small>
                  {new Date(item.issuedAt).toLocaleString()} ·{" "}
                  {item.notificationSent ? "buyer emailed" : "email not sent"} ·{" "}
                  {item.followUps?.length || 0}/2 follow-ups
                </small>
                {item.buyerDecision && (
                  <p>
                    <b>Buyer response:</b>{" "}
                    {item.buyerDecision.replaceAll("_", " ")}
                    {item.selectedCodes?.length
                      ? ` · ${item.selectedCodes.join(", ")}`
                      : ""}
                    {item.buyerNote ? ` · ${item.buyerNote}` : ""}
                  </p>
                )}
                {item.followUps?.length ? (
                  <ol>
                    {item.followUps.map((followUp) => (
                      <li key={followUp.id}>
                        {new Date(followUp.sentAt).toLocaleString()} ·{" "}
                        {followUp.stage.replaceAll("_", " ")} ·{" "}
                        {followUp.notificationSent
                          ? "email sent"
                          : "email not sent"}
                      </li>
                    ))}
                  </ol>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </details>
  );
}

function FileLifecycleControl({
  record,
  token,
  file,
  kind,
  onSaved,
}: {
  record: Inquiry;
  token: string;
  file: Attachment | OrderDocument;
  kind: "buyer_attachment" | "order_document";
  onSaved: (record: Inquiry) => void;
}) {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const action = file.revokedAt ? "restore" : "revoke";
  async function submit() {
    if (reason.trim().length < 3) {
      setMessage("Record a specific reason first.");
      return;
    }
    if (
      action === "revoke" &&
      !window.confirm(
        `Withdraw access to ${file.name}? The stored evidence and audit history will remain.`,
      )
    )
      return;
    setSaving(true);
    setMessage(`${action === "revoke" ? "Revoking" : "Restoring"} access…`);
    try {
      const response = await fetch("/api/admin/document-lifecycle", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: record.reference,
          receivedAt: record.receivedAt,
          fileId: file.id,
          kind,
          action,
          reason,
          actor: record.owner || "Sales team",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(result.message || "File lifecycle update failed.");
      onSaved(result.record);
      setReason("");
      setMessage(
        `${action === "revoke" ? "Access revoked" : "Access restored"}; audit entry saved.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "File lifecycle update failed.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div
      className={`file-lifecycle-control ${file.revokedAt ? "revoked" : ""}`}
    >
      <input
        aria-label={`Reason to ${action} ${file.name}`}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder={`${action === "revoke" ? "Withdrawal" : "Restoration"} reason`}
        maxLength={600}
      />
      <button type="button" disabled={saving} onClick={submit}>
        {saving
          ? "Saving…"
          : action === "revoke"
            ? "Revoke access"
            : "Restore access"}
      </button>
      <small>
        {file.revokedAt
          ? `Revoked ${new Date(file.revokedAt).toLocaleString()} · ${file.revocationReason}`
          : message}
      </small>
    </div>
  );
}

function FileSecurityControl({
  record,
  token,
  file,
  onSaved,
}: {
  record: Inquiry;
  token: string;
  file: Attachment;
  onSaved: (record: Inquiry) => void;
}) {
  const reviewed = file.securityStatus === "reviewed_safe";
  const action = reviewed ? "quarantine" : "mark_safe";
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit() {
    if (reason.trim().length < 8) {
      setMessage(
        reviewed
          ? "Record the new security concern."
          : "Record the offline scan/review method and result.",
      );
      return;
    }
    if (
      action === "mark_safe" &&
      !window.confirm(
        `Mark ${file.name} reviewed only after offline malware and content-safety checks. Continue?`,
      )
    )
      return;
    setSaving(true);
    setMessage(
      action === "mark_safe"
        ? "Saving reviewed status…"
        : "Returning file to quarantine…",
    );
    try {
      const response = await fetch("/api/admin/document-lifecycle", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: record.reference,
          receivedAt: record.receivedAt,
          fileId: file.id,
          kind: "buyer_attachment",
          action,
          reason,
          actor: record.owner || "Sales team",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(
          result.message || "File security status could not be saved.",
        );
      onSaved(result.record);
      setReason("");
      setMessage(
        action === "mark_safe"
          ? "Offline review recorded; ordinary admin download enabled."
          : "File quarantined; isolated-review acknowledgement is required.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "File security status could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div
      className={`file-security-control ${reviewed ? "reviewed" : "quarantined"}`}
    >
      <strong>
        {reviewed ? "Offline review recorded" : "Quarantined / unscanned"}
      </strong>
      <small>
        {file.securityReason ||
          "Legacy buyer file — no security review is recorded."}
      </small>
      <input
        value={reason}
        maxLength={600}
        onChange={(event) => setReason(event.target.value)}
        placeholder={
          reviewed
            ? "Reason to quarantine again"
            : "Offline AV/content review method and result"
        }
      />
      <button
        type="button"
        disabled={saving || Boolean(file.revokedAt)}
        onClick={submit}
      >
        {saving
          ? "Saving…"
          : reviewed
            ? "Return to quarantine"
            : "Mark offline review complete"}
      </button>
      {message && <small>{message}</small>}
    </div>
  );
}

function DocumentAuditHistory({ record }: { record: Inquiry }) {
  if (!record.documentAudit?.length) return null;
  return (
    <details className="admin-document-audit">
      <summary>File lifecycle audit ({record.documentAudit.length})</summary>
      <ol>
        {[...record.documentAudit].reverse().map((item) => (
          <li key={item.id}>
            <span>{new Date(item.changedAt).toLocaleString()}</span>
            <strong>
              {item.action} · {item.kind.replaceAll("_", " ")} · {item.fileName}
            </strong>
            <small>
              {item.actor} · {item.reason}
            </small>
          </li>
        ))}
      </ol>
      <small>
        Revocation blocks website access but preserves the stored file and audit
        evidence. Permanent website deletion is available only through the
        protected Data lifecycle center after review, independent approval and
        cooling-off.
      </small>
    </details>
  );
}

function AttachmentList({
  record,
  token,
  onSaved,
}: {
  record: Inquiry;
  token: string;
  onSaved: (record: Inquiry) => void;
}) {
  const [message, setMessage] = useState("");
  async function download(file: Attachment) {
    setMessage(`Preparing ${file.name}…`);
    try {
      const quarantined = file.securityStatus !== "reviewed_safe";
      if (
        quarantined &&
        !window.confirm(
          "This buyer upload has not been marked safe. Download only to an isolated device or approved malware-scanning environment; do not preview it in the browser. Continue?",
        )
      ) {
        setMessage("Quarantined download cancelled.");
        return;
      }
      const query = new URLSearchParams({
        reference: record.reference,
        receivedAt: record.receivedAt,
        attachmentId: file.id,
      });
      const response = await fetch(`/api/admin/inquiry-attachment?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(quarantined
            ? { "X-Quarantine-Acknowledgement": "download-for-isolated-review" }
            : {}),
        },
        cache: "no-store",
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "Download failed.");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
      setMessage(`${file.name} downloaded.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Download failed.");
    }
  }
  if (!record.attachments?.length) return null;
  return (
    <section className="admin-attachments">
      <small>BUYER FILES · UNTRUSTED UNTIL REVIEWED</small>
      <div>
        {record.attachments.map((file) => (
          <article key={file.id}>
            <button
              type="button"
              onClick={() => download(file)}
              disabled={Boolean(file.revokedAt)}
            >
              <strong>{file.name}</strong>
              <span>
                {Math.ceil(file.size / 1024)} KB ·{" "}
                {file.revokedAt
                  ? "revoked"
                  : file.securityStatus === "reviewed_safe"
                    ? "reviewed download"
                    : "isolated review download"}
              </span>
            </button>
            <FileSecurityControl
              record={record}
              token={token}
              file={file}
              onSaved={onSaved}
            />
            <FileLifecycleControl
              record={record}
              token={token}
              file={file}
              kind="buyer_attachment"
              onSaved={onSaved}
            />
          </article>
        ))}
      </div>
      <p aria-live="polite">{message}</p>
      <small>
        Website checks file type and size but does not perform a malware scan.
        Keep buyer uploads quarantined until an approved offline scanner and
        content review are completed.
      </small>
    </section>
  );
}

function InquiryMessageCenter({
  record,
  token,
  onSaved,
}: {
  record: Inquiry;
  token: string;
  onSaved: (record: Inquiry) => void;
}) {
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const recommendedTemplate = recommendedBuyerMessageTemplate(record);
  function loadTemplate(id: BuyerMessageTemplateId) {
    if (body.trim()) {
      setStatus(
        "Clear the current draft before loading another reply starter.",
      );
      return;
    }
    setBody(buildBuyerMessageTemplate(record, id));
    setStatus("Reply starter loaded. Review every detail before sending.");
  }
  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (body.trim().length < 2) {
      setStatus("Write a buyer-safe message before sending.");
      return;
    }
    setSending(true);
    setStatus("Saving message…");
    try {
      const response = await fetch("/api/admin/inquiry-message", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: record.reference,
          receivedAt: record.receivedAt,
          message: body,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(result.message || "Message could not be saved.");
      onSaved(result.record);
      setBody("");
      setStatus(
        `Message saved${result.notificationSent ? " and emailed to the buyer" : "; buyer email was not sent"}.`,
      );
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Message could not be saved.",
      );
    } finally {
      setSending(false);
    }
  }
  return (
    <details
      className="admin-message-center"
      open={Boolean(record.messages?.length)}
    >
      <summary>Buyer message thread ({record.messages?.length || 0})</summary>
      <div className="admin-message-thread">
        {record.messages?.length ? (
          record.messages.map((message) => (
            <article
              key={message.id}
              className={`admin-message admin-message-${message.sender}`}
            >
              <div>
                <strong>
                  {message.sender === "buyer" ? "Buyer" : "Beiqiang"}
                </strong>
                <time>{new Date(message.sentAt).toLocaleString()}</time>
                {message.sender === "sales" && (
                  <small>
                    {message.notificationSent ? "Email sent" : "Email not sent"}
                  </small>
                )}
              </div>
              <p>{message.body}</p>
            </article>
          ))
        ) : (
          <p>No website messages yet.</p>
        )}
      </div>
      <section className="admin-reply-starters">
        <div>
          <strong>Buyer-safe reply starters</strong>
          <span>
            Recommended from current stage:{" "}
            {
              BUYER_MESSAGE_TEMPLATES.find(
                (template) => template.id === recommendedTemplate,
              )?.label
            }
          </span>
        </div>
        <div>
          {BUYER_MESSAGE_TEMPLATES.map((template) => (
            <button
              key={template.id}
              className={
                template.id === recommendedTemplate ? "recommended" : ""
              }
              type="button"
              onClick={() => loadTemplate(template.id)}
              title={template.purpose}
            >
              {template.label}
              {template.id === recommendedTemplate ? " · recommended" : ""}
            </button>
          ))}
        </div>
        <small>
          Loading a starter does not send it. Verify buyer identity, product
          facts, quotation version and next action before using Save &amp;
          notify buyer.
        </small>
      </section>
      <form onSubmit={send}>
        <label>
          Reply to buyer
          <textarea
            required
            minLength={2}
            maxLength={2000}
            rows={9}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Buyer-safe reply. Do not include internal pricing, passwords or unconfirmed technical claims."
          />
        </label>
        <div>
          <small>{body.length}/2000</small>
          <button
            className="button button-small"
            type="submit"
            disabled={sending}
          >
            {sending ? "Sending…" : "Save & notify buyer"}
          </button>
        </div>
        <p aria-live="polite">{status}</p>
      </form>
    </details>
  );
}

function PipelineHistory({ record }: { record: Inquiry }) {
  if (!record.pipelineHistory?.length) return null;
  return (
    <details className="admin-pipeline-history">
      <summary>Stage history ({record.pipelineHistory.length})</summary>
      <ol>
        {[...record.pipelineHistory].reverse().map((event, index) => (
          <li key={`${event.changedAt}-${event.to}-${index}`}>
            <span>{new Date(event.changedAt).toLocaleString()}</span>
            <strong>
              {event.from ? `${event.from.replaceAll("_", " ")} → ` : ""}
              {event.to.replaceAll("_", " ")}
            </strong>
            <small>
              {event.actor || "System"}
              {event.reason ? ` · ${event.reason.replaceAll("_", " ")}` : ""}
            </small>
          </li>
        ))}
      </ol>
    </details>
  );
}

function AdminOrderDocuments({
  record,
  token,
  onSaved,
}: {
  record: Inquiry;
  token: string;
  onSaved: (record: Inquiry) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("sample_reference");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  function contentType(value: File) {
    if (value.type) return value.type;
    const extension = value.name.split(".").pop()?.toLowerCase();
    return (
      (
        {
          pdf: "application/pdf",
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          webp: "image/webp",
        } as Record<string, string>
      )[extension || ""] || ""
    );
  }
  async function upload(event: React.FormEvent) {
    event.preventDefault();
    if (!file || !title.trim()) {
      setStatus("Choose a file and add a buyer-facing title.");
      return;
    }
    setUploading(true);
    setStatus("Preparing secure upload…");
    try {
      const common = {
        reference: record.reference,
        receivedAt: record.receivedAt,
        name: file.name,
        contentType: contentType(file),
        size: file.size,
        category,
        title,
        note,
      };
      const permissionResponse = await fetch("/api/admin/order-documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(common),
      });
      const permission = await permissionResponse.json().catch(() => ({}));
      if (!permissionResponse.ok || !permission.ok)
        throw new Error(
          permission.message || "Document upload could not start.",
        );
      const putResponse = await fetch(permission.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": permission.contentType },
        body: file,
      });
      if (!putResponse.ok) throw new Error("Document transfer failed.");
      const finalizeResponse = await fetch("/api/admin/order-documents", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...common,
          uploadId: permission.uploadId,
          key: permission.key,
        }),
      });
      const result = await finalizeResponse.json().catch(() => ({}));
      if (!finalizeResponse.ok || !result.ok)
        throw new Error(result.message || "Document could not be attached.");
      onSaved({
        ...record,
        orderDocuments: [...(record.orderDocuments || []), result.document],
        updatedAt: result.document.uploadedAt,
      });
      setFile(null);
      setTitle("");
      setNote("");
      setStatus(
        `Document saved${result.notificationSent ? " and buyer emailed" : "; buyer email was not sent"}.`,
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Document could not be uploaded.",
      );
    } finally {
      setUploading(false);
    }
  }
  return (
    <details className="admin-order-documents">
      <summary>
        Buyer document center ({record.orderDocuments?.length || 0})
      </summary>
      <div className="admin-order-document-list">
        {record.orderDocuments?.length ? (
          record.orderDocuments.map((document) => (
            <article
              key={document.id}
              className={document.revokedAt ? "revoked" : ""}
            >
              <div>
                <small>{document.category.replaceAll("_", " ")}</small>
                <strong>{document.title}</strong>
                <span>
                  {document.name} · {Math.ceil(document.size / 1024)} KB
                </span>
              </div>
              <span>
                {document.revokedAt
                  ? "Access revoked"
                  : document.notificationSent
                    ? "Buyer emailed"
                    : "Email not sent"}
              </span>
              <FileLifecycleControl
                record={record}
                token={token}
                file={document}
                kind="order_document"
                onSaved={onSaved}
              />
            </article>
          ))
        ) : (
          <p>No buyer-facing documents yet.</p>
        )}
      </div>
      <form onSubmit={upload}>
        <div className="admin-follow-up-grid">
          <label>
            Document category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="sample_reference">Sample reference</option>
              <option value="approved_sample">Approved sample evidence</option>
              <option value="specification">Specification</option>
              <option value="quotation_support">Quotation support</option>
              <option value="quality_inspection">Quality inspection</option>
              <option value="packing">Packing</option>
              <option value="shipping">Shipping</option>
              <option value="order_document">Order document</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Buyer-facing title
            <input
              required
              maxLength={160}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Example: BQ009 approved color reference"
            />
          </label>
          <label>
            PDF or image
            <input
              required
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </label>
          <label className="admin-form-full">
            Buyer-safe note
            <textarea
              rows={2}
              maxLength={600}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="State what this document proves and any limits. Do not overstate unverified tests or specifications."
            />
          </label>
          <button
            className="button button-small"
            type="submit"
            disabled={uploading}
          >
            {uploading ? "Uploading…" : "Upload & notify buyer"}
          </button>
          <span aria-live="polite">{status}</span>
        </div>
      </form>
      <small className="admin-document-boundary">
        Upload only reviewed buyer-facing evidence. A reference image is not an
        approved sample; a component result is not a finished-shoe test; a
        quotation is not an order.
      </small>
    </details>
  );
}

function QuotationEditor({
  record,
  token,
  onSaved,
}: {
  record: Inquiry;
  token: string;
  onSaved: (record: Inquiry) => void;
}) {
  const nextVersion = String((record.quotations?.length || 0) + 1);
  const sourceLines = record.items?.length
    ? record.items
    : record.styleCode.split(",").map((code) => ({
        code: code.trim(),
        quantity: record.bulkQuantity || record.quantity,
      }));
  const [version, setVersion] = useState(nextVersion);
  const [currency, setCurrency] = useState("USD");
  const [tradeTerm, setTradeTerm] = useState("FOB");
  const [validUntil, setValidUntil] = useState("");
  const [leadTime, setLeadTime] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [packing, setPacking] = useState("");
  const [sampleTerms, setSampleTerms] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [lines, setLines] = useState<QuotationLine[]>(
    sourceLines.map((item) => ({
      code: item.code,
      description: `${item.code}${"colors" in item && item.colors ? ` · ${item.colors}` : ""}${"sizes" in item && item.sizes ? ` · ${item.sizes}` : ""}`,
      quantity: item.quantity || "",
      unitPrice: "",
    })),
  );
  const total = lines.reduce((sum, line) => {
    const quantity = Number(String(line.quantity).replace(/[^\d.]/g, ""));
    const unitPrice = Number(line.unitPrice);
    return (
      sum +
      (Number.isFinite(quantity) && Number.isFinite(unitPrice)
        ? quantity * unitPrice
        : 0)
    );
  }, 0);
  function updateLine(
    index: number,
    field: keyof QuotationLine,
    value: string,
  ) {
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line,
      ),
    );
  }
  function prepareRevision(quote: Quotation) {
    setVersion(nextVersion);
    setCurrency(quote.currency);
    setTradeTerm(quote.tradeTerm);
    setValidUntil("");
    setLeadTime(quote.leadTime);
    setPaymentTerms(quote.paymentTerms);
    setPacking(quote.packing);
    setSampleTerms(quote.sampleTerms);
    setLines(quote.lines.map((line) => ({ ...line })));
    setNotes(quote.notes);
    const brief = quote.revisionBrief;
    const targets = brief
      ? [
          `areas ${brief.reasons.map((item) => item.replaceAll("_", " ")).join(", ")}`,
          brief.affectedCodes.length
            ? `styles ${brief.affectedCodes.join(", ")}`
            : "",
          brief.targetQuantity ? `quantity ${brief.targetQuantity}` : "",
          brief.targetUnitPrice ? `unit-price ${brief.targetUnitPrice}` : "",
          brief.targetTradeTerm ? `trade term ${brief.targetTradeTerm}` : "",
          brief.requestedDelivery ? `delivery ${brief.requestedDelivery}` : "",
          brief.requestedPayment ? `payment ${brief.requestedPayment}` : "",
          brief.requestedPacking ? `packing ${brief.requestedPacking}` : "",
          brief.requestedSample ? `sample ${brief.requestedSample}` : "",
        ]
          .filter(Boolean)
          .join(" · ")
      : "";
    setMessage(
      `${quote.quoteNumber} copied into version ${nextVersion}. Buyer targets: ${targets || "review the saved response"}. Verify feasibility and edit every changed term before saving; targets are not copied into buyer-facing notes.`,
    );
  }
  function quotePayload() {
    return {
      version,
      currency,
      tradeTerm,
      validUntil,
      leadTime,
      paymentTerms,
      packing,
      sampleTerms,
      notes,
      lines,
    };
  }
  async function save() {
    if (
      !lines.length ||
      lines.some((line) => !line.code || !line.quantity || !line.unitPrice)
    ) {
      setMessage("Complete quantity and unit price for every quote line.");
      return;
    }
    setMessage("Saving quotation version…");
    try {
      const response = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: record.reference,
          receivedAt: record.receivedAt,
          status: record.status,
          owner: record.owner,
          nextAction: record.nextAction,
          nextActionDue: record.nextActionDue,
          internalNote: record.internalNote,
          buyerUpdate: record.buyerUpdate,
          lastContactedAt: record.lastContactedAt,
          quotation: quotePayload(),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(result.message || "Quotation could not be saved.");
      onSaved(result.record);
      setVersion(String((result.record.quotations?.length || 0) + 1));
      setMessage(
        `${result.record.quotations.at(-1).quoteNumber} saved. Use Print / PDF to issue it after review.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Quotation could not be saved.",
      );
    }
  }
  async function issue(quote: Quotation) {
    setMessage(`Issuing ${quote.quoteNumber}…`);
    try {
      const response = await fetch("/api/admin/quotation", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: record.reference,
          receivedAt: record.receivedAt,
          quoteNumber: quote.quoteNumber,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(result.message || "Quotation could not be issued.");
      onSaved(result.record);
      setMessage(
        `${quote.quoteNumber} issued to the buyer status page${result.quoteEmailSent ? " and emailed" : "; email was not sent"}.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Quotation could not be issued.",
      );
    }
  }
  function printQuotation(quote: Quotation | ReturnType<typeof quotePayload>) {
    const quoteNumber =
      "quoteNumber" in quote
        ? quote.quoteNumber
        : `${record.reference}-Q${quote.version}`;
    const printable = window.open("", "_blank");
    if (!printable) {
      setMessage("Allow pop-ups to open the print quotation.");
      return;
    }
    printable.opener = null;
    const quoteTotal = quote.lines.reduce(
      (sum, line) =>
        sum +
        (Number(String(line.quantity).replace(/[^\d.]/g, "")) || 0) *
          (Number(line.unitPrice) || 0),
      0,
    );
    const quoteDate =
      "issuedAt" in quote && quote.issuedAt
        ? quote.issuedAt.slice(0, 10)
        : "createdAt" in quote && quote.createdAt
          ? quote.createdAt.slice(0, 10)
          : new Date().toISOString().slice(0, 10);
    printable.document.write(
      `<!doctype html><html><head><title>${escapeHtml(quoteNumber)}</title><style>body{font:14px Arial;color:#17221d;margin:36px}header{display:flex;justify-content:space-between;border-bottom:3px solid #d69f36;padding-bottom:18px}h1{margin:0}small{color:#667}table{width:100%;border-collapse:collapse;margin:28px 0}th,td{border:1px solid #ccd5cf;padding:10px;text-align:left}th{background:#edf2ee}.terms{display:grid;grid-template-columns:1fr 1fr;gap:12px}.notice{margin-top:28px;padding:14px;background:#fff5dc}.total{text-align:right;font-size:18px}@media print{button{display:none}}</style></head><body><header><div><h1>BEIQIANG FOOTWEAR</h1><p>Quanzhou Beiqiang Footwear &amp; Apparel Co., Ltd.<br>Quanzhou, Fujian, China<br>421345308@qq.com · +86 189 5980 5256</p></div><div><strong>QUOTATION</strong><p>${escapeHtml(quoteNumber)}<br>${escapeHtml(quoteDate)}</p></div></header><h2>Buyer: ${escapeHtml(record.company)}</h2><p>Contact: ${escapeHtml(record.name)} · Market: ${escapeHtml(record.market)}<br>Inquiry: ${escapeHtml(record.reference)}</p><table><thead><tr><th>Style / description</th><th>Quantity</th><th>Unit price (${escapeHtml(quote.currency)})</th><th>Amount</th></tr></thead><tbody>${quote.lines.map((line) => `<tr><td><strong>${escapeHtml(line.code)}</strong><br>${escapeHtml(line.description)}</td><td>${escapeHtml(line.quantity)}</td><td>${escapeHtml(line.unitPrice)}</td><td>${((Number(String(line.quantity).replace(/[^\d.]/g, "")) || 0) * (Number(line.unitPrice) || 0)).toFixed(2)}</td></tr>`).join("")}</tbody></table><p class="total"><strong>Indicative total: ${escapeHtml(quote.currency)} ${quoteTotal.toFixed(2)}</strong></p><div class="terms"><p><strong>Trade term</strong><br>${escapeHtml(quote.tradeTerm)}</p><p><strong>Valid until</strong><br>${escapeHtml(quote.validUntil || "To be confirmed")}</p><p><strong>Lead time</strong><br>${escapeHtml(quote.leadTime || "Subject to final confirmation")}</p><p><strong>Payment terms</strong><br>${escapeHtml(quote.paymentTerms || "To be confirmed")}</p><p><strong>Packing</strong><br>${escapeHtml(quote.packing || "To be confirmed")}</p><p><strong>Sample terms</strong><br>${escapeHtml(quote.sampleTerms || "To be confirmed")}</p></div><p><strong>Notes</strong><br>${escapeHtml(quote.notes || "None")}</p><p class="notice"><strong>Commercial boundary:</strong> This quotation is subject to final written confirmation of specifications, approved sample, size ratio, packing, payment and shipping details. It is not a production order or test-result guarantee.</p><button onclick="window.print()">Print / Save PDF</button></body></html>`,
    );
    printable.document.close();
  }
  return (
    <details className="admin-quotation">
      <summary>Create quotation / PDF</summary>
      <div className="quotation-editor">
        <div className="admin-follow-up-grid">
          <label>
            Version
            <input
              value={version}
              onChange={(event) => setVersion(event.target.value)}
            />
          </label>
          <label>
            Currency
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
            >
              <option>USD</option>
              <option>EUR</option>
            </select>
          </label>
          <label>
            Trade term
            <select
              value={tradeTerm}
              onChange={(event) => setTradeTerm(event.target.value)}
            >
              <option>FOB</option>
              <option>EXW</option>
              <option>FCA</option>
              <option>DDP</option>
            </select>
          </label>
          <label>
            Valid until
            <input
              type="date"
              value={validUntil}
              onChange={(event) => setValidUntil(event.target.value)}
            />
          </label>
          <label>
            Lead time
            <input
              value={leadTime}
              onChange={(event) => setLeadTime(event.target.value)}
              placeholder="Confirm after style / quantity review"
            />
          </label>
          <label>
            Payment terms
            <input
              value={paymentTerms}
              onChange={(event) => setPaymentTerms(event.target.value)}
              placeholder="Enter confirmed terms"
            />
          </label>
          <label>
            Packing
            <input
              value={packing}
              onChange={(event) => setPacking(event.target.value)}
              placeholder="Enter confirmed packing"
            />
          </label>
          <label>
            Sample terms
            <input
              value={sampleTerms}
              onChange={(event) => setSampleTerms(event.target.value)}
              placeholder="Enter confirmed sample terms"
            />
          </label>
        </div>
        <div className="quotation-lines">
          {lines.map((line, index) => (
            <div key={`${line.code}-${index}`}>
              <input
                aria-label="Style code"
                value={line.code}
                onChange={(event) =>
                  updateLine(index, "code", event.target.value)
                }
              />
              <input
                aria-label="Description"
                value={line.description}
                onChange={(event) =>
                  updateLine(index, "description", event.target.value)
                }
              />
              <input
                aria-label="Quantity"
                value={line.quantity}
                onChange={(event) =>
                  updateLine(index, "quantity", event.target.value)
                }
                placeholder="Pairs"
              />
              <input
                aria-label="Unit price"
                inputMode="decimal"
                value={line.unitPrice}
                onChange={(event) =>
                  updateLine(index, "unitPrice", event.target.value)
                }
                placeholder="Unit price"
              />
            </div>
          ))}
        </div>
        <label>
          Quotation notes
          <textarea
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Confirmed inclusions, exclusions or buyer-specific notes"
          />
        </label>
        <p className="quotation-total">
          Calculated reference total: {currency} {total.toFixed(2)}
        </p>
        <div className="quotation-actions">
          <button className="button button-small" type="button" onClick={save}>
            Save immutable version
          </button>
          <button
            className="button button-small button-secondary"
            type="button"
            onClick={() => printQuotation(quotePayload())}
          >
            Preview draft
          </button>
        </div>
        <p aria-live="polite">{message}</p>
        {record.quotations?.length ? (
          <div className="quotation-history">
            <strong>Saved versions</strong>
            {record.quotations.map((quote) => (
              <div key={quote.quoteNumber}>
                <button type="button" onClick={() => printQuotation(quote)}>
                  {quote.quoteNumber} ·{" "}
                  {new Date(quote.createdAt).toLocaleString()} · Print / PDF
                </button>
                <span>
                  {quote.status || "draft"}
                  {quote.quoteEmailSent ? " · emailed" : ""}
                  {quote.revisionBrief
                    ? ` · ${quote.revisionBrief.reasons.map((item) => item.replaceAll("_", " ")).join(", ")}`
                    : ""}
                </span>
                {quote.status === "buyer_revision_requested" ? (
                  <button
                    type="button"
                    className="quote-revision-button"
                    onClick={() => prepareRevision(quote)}
                  >
                    Use as revision draft
                  </button>
                ) : ![
                    "buyer_accepted",
                    "buyer_declined",
                    "buyer_revision_requested",
                  ].includes(quote.status || "draft") ? (
                  <button
                    type="button"
                    className="quote-issue-button"
                    onClick={() => issue(quote)}
                  >
                    Issue to buyer
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </details>
  );
}

function SampleProgramEditor({
  record,
  token,
  onSaved,
}: {
  record: Inquiry;
  token: string;
  onSaved: (record: Inquiry) => void;
}) {
  const sample = record.sampleProgram;
  const [sampleStatus, setSampleStatus] = useState(
    sample?.status || "brief_requested",
  );
  const [styleCodes, setStyleCodes] = useState(
    sample?.styleCodes || record.styleCode || "",
  );
  const [quantity, setQuantity] = useState(
    sample?.quantity || record.sampleQuantity || "",
  );
  const [sampleReference, setSampleReference] = useState(
    sample?.sampleReference || "",
  );
  const [sizes, setSizes] = useState(sample?.sizes || "");
  const [colors, setColors] = useState(sample?.colors || "");
  const [purpose, setPurpose] = useState(sample?.purpose || "");
  const [reviewScope, setReviewScope] = useState(sample?.reviewScope || "");
  const [deliverables, setDeliverables] = useState(sample?.deliverables || "");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState(
    sample?.acceptanceCriteria || "",
  );
  const [exclusions, setExclusions] = useState(sample?.exclusions || "");
  const [currency, setCurrency] = useState(sample?.currency || "USD");
  const [sampleCharge, setSampleCharge] = useState(sample?.sampleCharge || "");
  const [chargeStatus, setChargeStatus] = useState(
    sample?.chargeStatus || "planned",
  );
  const [paidAt, setPaidAt] = useState(sample?.paidAt || "");
  const [courier, setCourier] = useState(sample?.courier || "");
  const [trackingNumber, setTrackingNumber] = useState(
    sample?.trackingNumber || "",
  );
  const [shippedAt, setShippedAt] = useState(sample?.shippedAt || "");
  const [expectedDelivery, setExpectedDelivery] = useState(
    sample?.expectedDelivery || "",
  );
  const [note, setNote] = useState(sample?.note || "");
  const [message, setMessage] = useState("");
  const pendingRequests = (record.sampleRequests || []).filter(
    (item) => item.status === "pending",
  );
  const [loadedRequestId, setLoadedRequestId] = useState("");
  const [requestReasons, setRequestReasons] = useState<Record<string, string>>(
    {},
  );
  function loadRequest(item: SampleRequest) {
    setLoadedRequestId(item.id);
    setStyleCodes(item.styleCodes.join(", "));
    setQuantity(item.quantity);
    setSizes(item.sizes);
    setColors(item.colors);
    setPurpose(item.evaluationPurpose);
    setAcceptanceCriteria(item.acceptanceFocus);
    setReviewScope(item.customizationTarget || item.evaluationPurpose);
    setSampleStatus("brief_requested");
    setNote(
      `Buyer request ${item.id}: ${item.sampleType.replaceAll("_", " ")}; destination ${item.shippingCity ? `${item.shippingCity}, ` : ""}${item.shippingCountry}; target bulk ${item.targetBulkQuantity || "not stated"}; requested timing ${item.requestedTiming || "not stated"}. Verify feasibility, cost, freight and preparation time before confirming.`,
    );
    setMessage(
      `${item.id} loaded as a review draft. Verify every field before saving.`,
    );
  }
  async function rejectRequest(item: SampleRequest) {
    const reason = (requestReasons[item.id] || "").trim();
    if (reason.length < 5) {
      setMessage(
        "Record a buyer-safe rejection reason of at least 5 characters.",
      );
      return;
    }
    setMessage(`Rejecting ${item.id}…`);
    try {
      const response = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: record.reference,
          receivedAt: record.receivedAt,
          sampleRequestAction: { id: item.id, action: "reject", reason },
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(
          result.message || "Sample request could not be rejected.",
        );
      onSaved(result.record);
      if (loadedRequestId === item.id) setLoadedRequestId("");
      setMessage(`${item.id} rejected without creating a sample project.`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Sample request could not be rejected.",
      );
    }
  }
  async function save() {
    setMessage("Saving sample project…");
    try {
      const response = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: record.reference,
          receivedAt: record.receivedAt,
          status: record.status,
          owner: record.owner,
          nextAction: record.nextAction,
          nextActionDue: record.nextActionDue,
          internalNote: record.internalNote,
          buyerUpdate: record.buyerUpdate,
          lastContactedAt: record.lastContactedAt,
          sampleRequestId: loadedRequestId,
          sampleProgram: {
            status: sampleStatus,
            sampleReference,
            styleCodes,
            quantity,
            sizes,
            colors,
            purpose,
            reviewScope,
            deliverables,
            acceptanceCriteria,
            exclusions,
            currency,
            sampleCharge,
            chargeStatus,
            paidAt,
            courier,
            trackingNumber,
            shippedAt,
            expectedDelivery,
            note,
          },
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(result.message || "Sample project could not be saved.");
      onSaved(result.record);
      setLoadedRequestId("");
      setMessage(
        "Sample project saved. Use the buyer message thread to notify the buyer after reviewing the public fields.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Sample project could not be saved.",
      );
    }
  }
  return (
    <details
      className="admin-sample-program"
      open={
        sample?.status === "buyer_review" || Boolean(pendingRequests.length)
      }
    >
      <summary>
        Sample validation project{" "}
        {sample ? `· ${sample.status.replaceAll("_", " ")}` : ""}
        {pendingRequests.length
          ? ` · ${pendingRequests.length} request awaiting review`
          : ""}
      </summary>
      <div className="admin-follow-up-grid">
        {pendingRequests.length ? (
          <section className="admin-sample-request-list admin-form-full">
            <h4>
              Buyer-submitted sample requests · review before confirmation
            </h4>
            {pendingRequests.map((item) => (
              <article key={item.id}>
                <div>
                  <strong>
                    {item.id} · {item.styleCodes.join(", ")}
                  </strong>
                  <span>
                    {item.sampleType.replaceAll("_", " ")} · {item.quantity} ·{" "}
                    {item.sizes} · {item.colors}
                  </span>
                  <small>
                    {item.evaluationPurpose} · ship to{" "}
                    {item.shippingCity ? `${item.shippingCity}, ` : ""}
                    {item.shippingCountry}
                  </small>
                  <p>
                    {item.acceptanceFocus}
                    {item.customizationTarget
                      ? ` · Target: ${item.customizationTarget}`
                      : ""}
                  </p>
                </div>
                <div>
                  <button type="button" onClick={() => loadRequest(item)}>
                    Load as review draft
                  </button>
                  <label>
                    Buyer-safe rejection reason
                    <input
                      value={requestReasons[item.id] || ""}
                      maxLength={500}
                      onChange={(event) =>
                        setRequestReasons((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      placeholder="Cannot support requested scope…"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void rejectRequest(item)}
                  >
                    Reject without sample project
                  </button>
                </div>
              </article>
            ))}
          </section>
        ) : null}
        <label>
          Sample stage
          <select
            value={sampleStatus}
            onChange={(event) => setSampleStatus(event.target.value)}
          >
            <option value="brief_requested">Brief requested</option>
            <option value="terms_confirmed">Terms confirmed</option>
            <option value="awaiting_sample_payment">
              Awaiting sample payment
            </option>
            <option value="preparing">Preparing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="buyer_review">Awaiting buyer review</option>
            <option value="buyer_approved" disabled>
              Buyer approved
            </option>
            <option value="revision_requested" disabled>
              Buyer requested revision
            </option>
            <option value="closed">Closed</option>
          </select>
        </label>
        <label>
          Physical sample reference
          <input
            value={sampleReference}
            onChange={(event) => setSampleReference(event.target.value)}
            placeholder="Unique label on this physical sample"
          />
        </label>
        <label>
          Style code(s)
          <input
            value={styleCodes}
            onChange={(event) => setStyleCodes(event.target.value)}
            placeholder="Exact product style codes"
          />
        </label>
        <label>
          Sample quantity
          <input
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="Pairs and allocation"
          />
        </label>
        <label>
          Sizes
          <input
            value={sizes}
            onChange={(event) => setSizes(event.target.value)}
            placeholder="Exact sizes"
          />
        </label>
        <label>
          Colors
          <input
            value={colors}
            onChange={(event) => setColors(event.target.value)}
            placeholder="Exact colors"
          />
        </label>
        <label>
          Sample purpose
          <input
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            placeholder="Fit / color / branding / construction review"
          />
        </label>
        <label className="admin-form-full">
          Review scope
          <textarea
            rows={3}
            value={reviewScope}
            onChange={(event) => setReviewScope(event.target.value)}
            placeholder="Write exactly what this review is intended to validate."
          />
        </label>
        <label className="admin-form-full">
          Buyer review deliverables
          <textarea
            rows={3}
            value={deliverables}
            onChange={(event) => setDeliverables(event.target.value)}
            placeholder="Physical pair, photos, measurement sheet or other items actually supplied for this round."
          />
        </label>
        <label className="admin-form-full">
          Acceptance criteria
          <textarea
            rows={3}
            value={acceptanceCriteria}
            onChange={(event) => setAcceptanceCriteria(event.target.value)}
            placeholder="Observable criteria the buyer should use for this specific sample review."
          />
        </label>
        <label className="admin-form-full">
          Explicit exclusions
          <textarea
            rows={3}
            value={exclusions}
            onChange={(event) => setExclusions(event.target.value)}
            placeholder="Bulk material consistency, lab tests, final packing, size ratio or other items not validated by this round."
          />
        </label>
        <label>
          Currency
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
          >
            <option>USD</option>
            <option>EUR</option>
          </select>
        </label>
        <label>
          Sample charge
          <input
            inputMode="decimal"
            value={sampleCharge}
            onChange={(event) => setSampleCharge(event.target.value)}
            placeholder="Written amount only"
          />
        </label>
        <label>
          Charge status
          <select
            value={chargeStatus}
            onChange={(event) => setChargeStatus(event.target.value)}
          >
            <option value="planned">Planned</option>
            <option value="due">Due</option>
            <option value="paid">Paid</option>
            <option value="waived">Waived</option>
          </select>
        </label>
        {chargeStatus === "paid" && (
          <label>
            Actual paid date
            <input
              type="date"
              value={paidAt}
              onChange={(event) => setPaidAt(event.target.value)}
            />
          </label>
        )}
        <label>
          Courier
          <input
            value={courier}
            onChange={(event) => setCourier(event.target.value)}
            placeholder="After actual shipment"
          />
        </label>
        <label>
          Tracking reference
          <input
            value={trackingNumber}
            onChange={(event) => setTrackingNumber(event.target.value)}
            placeholder="After actual shipment"
          />
        </label>
        <label>
          Actual shipment date
          <input
            type="date"
            value={shippedAt}
            onChange={(event) => setShippedAt(event.target.value)}
          />
        </label>
        <label>
          Expected delivery
          <input
            type="date"
            value={expectedDelivery}
            onChange={(event) => setExpectedDelivery(event.target.value)}
          />
        </label>
        <label className="admin-form-full">
          Buyer-safe sample note
          <textarea
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Current action or limitation. Do not include internal cost or unverified test claims."
          />
        </label>
        <button className="button button-small" type="button" onClick={save}>
          Save sample project
        </button>
        <span aria-live="polite">{message}</span>
        {sample?.buyerDecision && (
          <p className="admin-form-full sample-buyer-decision">
            <strong>Latest buyer response:</strong>{" "}
            {sample.buyerDecision.replaceAll("_", " ")} ·{" "}
            {sample.buyerRespondedAt
              ? new Date(sample.buyerRespondedAt).toLocaleString()
              : "time unavailable"}
            <br />
            {sample.buyerNote || "No buyer note."}
          </p>
        )}
        {sample?.reviewRounds?.length ? (
          <details className="admin-form-full sample-review-rounds" open>
            <summary>
              Immutable sample review rounds ({sample.reviewRounds.length})
            </summary>
            {[...sample.reviewRounds].reverse().map((round) => (
              <article key={round.round}>
                <div>
                  <strong>
                    Round {round.round} ·{" "}
                    {round.sampleReference || "Legacy reference"}
                  </strong>
                  <span>{round.status.replaceAll("_", " ")}</span>
                </div>
                <p>
                  {round.styleCodes} · {round.purpose}
                </p>
                <small>Scope: {round.reviewScope || "Legacy record"}</small>
                <small>
                  Deliverables: {round.deliverables || "Legacy record"}
                </small>
                <small>
                  Acceptance: {round.acceptanceCriteria || "Legacy record"}
                </small>
                <small>Exclusions: {round.exclusions || "Legacy record"}</small>
                {round.decision && (
                  <p>
                    <b>Buyer:</b> {round.decision.replaceAll("_", " ")} ·{" "}
                    {round.buyerNote || "No note"}
                  </p>
                )}
              </article>
            ))}
          </details>
        ) : null}
        {sample?.history?.length ? (
          <details className="admin-form-full sample-history">
            <summary>Sample stage history ({sample.history.length})</summary>
            <ol>
              {[...sample.history].reverse().map((item, index) => (
                <li key={`${item.changedAt}-${index}`}>
                  <span>{new Date(item.changedAt).toLocaleString()}</span>
                  <strong>
                    {item.from ? `${item.from.replaceAll("_", " ")} → ` : ""}
                    {item.to.replaceAll("_", " ")}
                  </strong>
                  <small>{item.actor}</small>
                </li>
              ))}
            </ol>
          </details>
        ) : null}
        <small className="admin-form-full">
          Opening Buyer review freezes an immutable round. Approval applies only
          to that physical sample reference, deliverables, criteria and scope;
          it does not automatically confirm excluded bulk terms.
        </small>
      </div>
    </details>
  );
}

function BuyerOrderRequestSummary({ record }: { record: Inquiry }) {
  const requests = record.buyerOrderRequests || [];
  if (!requests.length) return null;
  return (
    <details className="admin-buyer-order-request" open>
      <summary>Buyer order-setup request · {requests.length}</summary>
      <div>
        {[...requests].reverse().map((item) => (
          <article key={item.id}>
            <div>
              <strong>{item.quoteNumber}</strong>
              <span>
                {item.status.replaceAll("_", " ")} ·{" "}
                {new Date(item.submittedAt).toLocaleString()}
              </span>
            </div>
            <dl>
              <div>
                <dt>Legal company</dt>
                <dd>{item.legalCompanyName}</dd>
              </div>
              <div>
                <dt>Purchasing contact</dt>
                <dd>{item.purchasingContact}</dd>
              </div>
              <div>
                <dt>Preferred channel</dt>
                <dd>{item.preferredOrderChannel.replaceAll("_", " ")}</dd>
              </div>
              <div>
                <dt>Buyer PO reference</dt>
                <dd>{item.purchaseOrderReference || "Not supplied"}</dd>
              </div>
              <div>
                <dt>Destination</dt>
                <dd>{item.destination}</dd>
              </div>
              <div>
                <dt>Requested window</dt>
                <dd>{item.requestedWindow}</dd>
              </div>
              {item.instructions && (
                <div>
                  <dt>Instructions</dt>
                  <dd>{item.instructions}</dd>
                </div>
              )}
            </dl>
          </article>
        ))}
      </div>
      <small>
        Treat this as a buyer request to prepare the formal order, not as an
        accepted production order. Verify the quotation and all eight
        order-readiness items before creating Trade Assurance or contract
        documents.
      </small>
    </details>
  );
}

function OrderPreparationPacketCenter({
  record,
  token,
  onSaved,
}: {
  record: Inquiry;
  token: string;
  onSaved: (record: Inquiry) => void;
}) {
  const packets = record.orderPreparationPackets || [];
  const latest = packets.at(-1);
  const [action, setAction] = useState<"review" | "request_revision">("review");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewedBy, setReviewedBy] = useState("Beiqiang sales");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  if (!packets.length) return null;
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!latest || latest.status !== "submitted") return;
    setSaving(true);
    setMessage("Saving protected packet review…");
    try {
      const response = await fetch("/api/admin/order-preparation-packet", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reference: record.reference,
          packetId: latest.id,
          action,
          reviewNote,
          reviewedBy,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(result.message || "Packet review could not be saved.");
      const updatedPacket = { ...latest, ...result.packet, reviewedBy };
      onSaved({
        ...record,
        orderPreparationPackets: packets.map((item) =>
          item.id === latest.id ? updatedPacket : item,
        ),
        updatedAt: result.packet.reviewedAt || record.updatedAt,
      });
      setMessage(result.message);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Packet review could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <details className="admin-order-packet" open>
      <summary>Protected order-preparation packet · {packets.length}</summary>
      <div>
        {[...packets].reverse().map((packet) => (
          <article key={packet.id} className={`packet-${packet.status}`}>
            <div>
              <strong>
                V{packet.version} · {packet.status.replaceAll("_", " ")}
              </strong>
              <span>
                {new Date(packet.submittedAt).toLocaleString()} ·{" "}
                {packet.quoteNumber}
              </span>
            </div>
            <dl>
              <div>
                <dt>Billing company</dt>
                <dd>
                  {packet.billingCompany} · {packet.registeredCountry}
                </dd>
              </div>
              <div>
                <dt>Billing address</dt>
                <dd>{packet.billingAddress}</dd>
              </div>
              <div>
                <dt>Invoice email</dt>
                <dd>{packet.invoiceEmail}</dd>
              </div>
              <div>
                <dt>Shipping consignee</dt>
                <dd>
                  {packet.shippingConsignee} · {packet.shippingContact}
                </dd>
              </div>
              <div>
                <dt>Shipping address</dt>
                <dd>
                  {packet.shippingAddress} · {packet.shippingCountry}
                </dd>
              </div>
              <div>
                <dt>Importer / shipping</dt>
                <dd>
                  {packet.importerRole.replaceAll("_", " ")} ·{" "}
                  {packet.shippingMode.replaceAll("_", " ")}
                </dd>
              </div>
              <div>
                <dt>PO / documents</dt>
                <dd>
                  {packet.purchaseOrderReference || "No PO reference"} ·{" "}
                  {packet.requiredDocuments
                    .map((item) => item.replaceAll("_", " "))
                    .join(", ") || "No document request"}
                </dd>
              </div>
              <div>
                <dt>Linked buyer files</dt>
                <dd>
                  {packet.attachmentIds
                    .map(
                      (id) =>
                        record.attachments?.find((item) => item.id === id)
                          ?.name || `${id} (missing/revoked)`,
                    )
                    .join(", ") || "None linked"}
                </dd>
              </div>
              {packet.notes && (
                <div>
                  <dt>Buyer notes</dt>
                  <dd>{packet.notes}</dd>
                </div>
              )}
              {packet.reviewNote && (
                <div>
                  <dt>Review note</dt>
                  <dd>
                    {packet.reviewNote} ·{" "}
                    {packet.reviewedBy || "Beiqiang sales"}
                  </dd>
                </div>
              )}
            </dl>
          </article>
        ))}
      </div>
      {latest?.status === "submitted" ? (
        <form onSubmit={submit}>
          <label>
            Decision
            <select
              value={action}
              onChange={(event) =>
                setAction(event.target.value as "review" | "request_revision")
              }
            >
              <option value="review">
                Reviewed for formal-order preparation
              </option>
              <option value="request_revision">
                Request a new buyer version
              </option>
            </select>
          </label>
          <label>
            Buyer-safe review note
            <textarea
              required
              minLength={5}
              maxLength={1000}
              rows={3}
              value={reviewNote}
              onChange={(event) => setReviewNote(event.target.value)}
            />
          </label>
          <label>
            Reviewed by
            <input
              maxLength={100}
              value={reviewedBy}
              onChange={(event) => setReviewedBy(event.target.value)}
            />
          </label>
          <button
            className="button button-small"
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save human review"}
          </button>
        </form>
      ) : null}
      <p aria-live="polite">{message}</p>
      <small>
        Review means the packet can support document preparation. It is not
        order confirmation, invoice issuance, payment verification or production
        authorization.
      </small>
    </details>
  );
}

const confirmationFields: [keyof OrderChecklist, string][] = [
  ["productSpecification", "Product specification"],
  ["sampleDecision", "Sample decision"],
  ["quantitySizeRatio", "Quantity / size ratio"],
  ["colorsMaterials", "Colors / materials"],
  ["packingLabeling", "Packing / labeling"],
  ["priceTradeTerm", "Price / trade term"],
  ["paymentTerms", "Payment terms"],
  ["deliveryWindow", "Delivery window"],
];

function OrderConfirmationDraftCenter({
  record,
  token,
  onSaved,
}: {
  record: Inquiry;
  token: string;
  onSaved: (record: Inquiry) => void;
}) {
  const drafts = record.orderConfirmationDrafts || [];
  const latest = drafts.at(-1);
  const packet = record.orderPreparationPackets?.at(-1);
  const quote = [...(record.quotations || [])].reverse().find((item) => item.status === "buyer_accepted");
  const initialChecklist: OrderChecklist = latest?.orderChecklist || {
    productSpecification: quote?.lines.map((line) => `${line.code}: ${line.description}`).join("; ") || "",
    sampleDecision: record.sampleProgram?.buyerDecision === "approved" ? `${record.sampleProgram.sampleReference}: buyer-approved review round` : "",
    quantitySizeRatio: quote?.lines.map((line) => `${line.code}: ${line.quantity}`).join("; ") || "",
    colorsMaterials: "",
    packingLabeling: quote?.packing || "",
    priceTradeTerm: quote ? `${quote.currency} · ${quote.tradeTerm} · ${quote.lines.map((line) => `${line.code} ${line.unitPrice}`).join("; ")}` : "",
    paymentTerms: quote?.paymentTerms || "",
    deliveryWindow: quote?.leadTime || "",
  };
  const [orderChannel, setOrderChannel] = useState<"alibaba_trade_assurance" | "contract">(
    latest?.orderChannel || (record.buyerOrderRequests?.at(-1)?.preferredOrderChannel === "contract" ? "contract" : "alibaba_trade_assurance"),
  );
  const [checklist, setChecklist] = useState<OrderChecklist>(initialChecklist);
  const [draftNote, setDraftNote] = useState("");
  const [issuedBy, setIssuedBy] = useState(record.owner || "Beiqiang sales");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const canIssue = Boolean(packet?.status === "reviewed" && quote && !record.orderHandoff && latest?.status !== "awaiting_buyer");
  function update(field: keyof OrderChecklist, value: string) { setChecklist((current) => ({ ...current, [field]: value })); }
  async function issue(event: React.FormEvent) {
    event.preventDefault();
    if (!packet) return;
    setSaving(true); setMessage("Issuing buyer-safe pre-order confirmation…");
    try {
      const response = await fetch("/api/admin/order-confirmation-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reference: record.reference, packetId: packet.id, orderChannel, orderChecklist: checklist, draftNote, issuedBy }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || "The confirmation draft could not be issued.");
      onSaved({ ...record, orderConfirmationDrafts: [...drafts, { ...result.draft, issuedBy, buyerDecision: "", buyerNote: "", buyerRevisionFields: [] }], updatedAt: result.draft.issuedAt || record.updatedAt });
      setMessage(result.message);
    } catch (error) { setMessage(error instanceof Error ? error.message : "The confirmation draft could not be issued."); }
    finally { setSaving(false); }
  }
  if (!record.buyerOrderRequests?.length && !drafts.length) return null;
  return (
    <details className="admin-order-confirmation" open>
      <summary>Pre-order written confirmation · {drafts.length}</summary>
      {latest ? <article className={`confirmation-${latest.status}`}><div><strong>V{latest.version} · {latest.status.replaceAll("_", " ")}</strong><span>{new Date(latest.issuedAt).toLocaleString()} · {latest.quoteNumber}</span></div><p>{latest.draftNote}</p>{latest.buyerRevisionFields?.length ? <p><b>Buyer revision fields:</b> {latest.buyerRevisionFields.map((field) => confirmationFields.find(([key]) => key === field)?.[1] || field).join(" · ")}</p> : null}{latest.buyerNote ? <p><b>Buyer note:</b> {latest.buyerNote}</p> : null}<small>{latest.orderChannel.replaceAll("_", " ")} · packet V{latest.packetVersion}</small></article> : null}
      {canIssue ? <form onSubmit={issue}>
        <label>Planned formal order channel<select value={orderChannel} onChange={(event) => setOrderChannel(event.target.value as "alibaba_trade_assurance" | "contract")}><option value="alibaba_trade_assurance">Alibaba Trade Assurance</option><option value="contract">Bilateral contract</option></select></label>
        {confirmationFields.map(([field, label]) => <label key={field} className="admin-form-full">{label}<textarea required minLength={2} maxLength={700} rows={2} value={checklist[field]} onChange={(event) => update(field, event.target.value)} /><small>Write the exact reviewed fact. “TBD”, “unknown” and “to be confirmed” cannot be issued.</small></label>)}
        <label className="admin-form-full">Buyer-safe issue / revision note<textarea required minLength={5} maxLength={1000} rows={3} value={draftNote} onChange={(event) => setDraftNote(event.target.value)} placeholder={latest ? "Explain exactly what changed from the previous preserved version." : "Explain what the buyer must compare before accepting."} /></label>
        <label>Issued by<input maxLength={100} value={issuedBy} onChange={(event) => setIssuedBy(event.target.value)} /></label>
        <button className="button button-small" type="submit" disabled={saving}>{saving ? "Issuing…" : latest ? `Issue preserved V${latest.version + 1}` : "Issue V1 for buyer review"}</button>
      </form> : <p>{packet?.status !== "reviewed" ? "Review the latest protected order-preparation packet before drafting the eight confirmation items." : latest?.status === "awaiting_buyer" ? "Wait for the buyer to accept or request a precise revision before issuing another version." : record.orderHandoff ? "The formal order handoff already exists; use the controlled order-change workflow for critical changes." : "A buyer-accepted quotation is required."}</p>}
      <p aria-live="polite">{message}</p>
      <small>Buyer acceptance is a mismatch-prevention record only. Confirm identical terms in the authoritative Trade Assurance order or signed contract before recording an order, payment or production action.</small>
    </details>
  );
}

function OrderHandoffEditor({
  record,
  token,
  onSaved,
}: {
  record: Inquiry;
  token: string;
  onSaved: (record: Inquiry) => void;
}) {
  const requestedChannel =
    record.buyerOrderRequests?.at(-1)?.preferredOrderChannel;
  const [method, setMethod] = useState<OrderHandoff["method"]>(
    record.orderHandoff?.method ||
      (requestedChannel === "contract"
        ? "contract"
        : "alibaba_trade_assurance"),
  );
  const [orderReference, setOrderReference] = useState(
    record.orderHandoff?.orderReference || "",
  );
  const [orderUrl, setOrderUrl] = useState(record.orderHandoff?.orderUrl || "");
  const [confirmedAt, setConfirmedAt] = useState(
    record.orderHandoff?.confirmedAt || "",
  );
  const [note, setNote] = useState(record.orderHandoff?.note || "");
  const [orderChangeReason, setOrderChangeReason] = useState("");
  const [message, setMessage] = useState("");
  const [fulfillmentStatus, setFulfillmentStatus] = useState(
    record.orderHandoff?.fulfillmentStatus || "order_documents",
  );
  const [carrier, setCarrier] = useState(record.orderHandoff?.carrier || "");
  const [trackingNumber, setTrackingNumber] = useState(
    record.orderHandoff?.trackingNumber || "",
  );
  const [paymentCurrency, setPaymentCurrency] = useState(
    record.orderHandoff?.paymentCurrency || "USD",
  );
  const [paymentMilestones, setPaymentMilestones] = useState<
    PaymentMilestone[]
  >(record.orderHandoff?.paymentMilestones || []);
  const emptyChecklist: OrderChecklist = {
    productSpecification: "",
    sampleDecision: "",
    quantitySizeRatio: "",
    colorsMaterials: "",
    packingLabeling: "",
    priceTradeTerm: "",
    paymentTerms: "",
    deliveryWindow: "",
  };
  const acceptedConfirmation = [...(record.orderConfirmationDrafts || [])].reverse().find((item) => item.status === "buyer_accepted");
  const [orderChecklist, setOrderChecklist] = useState<OrderChecklist>(record.orderHandoff?.orderChecklist || acceptedConfirmation?.orderChecklist || emptyChecklist);
  function updateChecklist(field: keyof OrderChecklist, value: string) {
    setOrderChecklist((current) => ({ ...current, [field]: value }));
  }
  function addPaymentMilestone() {
    if (paymentMilestones.length >= 6) return;
    setPaymentMilestones((current) => [
      ...current,
      {
        id: `PM-${current.length + 1}`,
        label: "",
        amount: "",
        dueDate: "",
        status: "planned",
        paidAt: "",
        reference: "",
        note: "",
      },
    ]);
  }
  function updatePayment(
    index: number,
    field: keyof PaymentMilestone,
    value: string,
  ) {
    setPaymentMilestones((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? ({ ...item, [field]: value } as PaymentMilestone)
          : item,
      ),
    );
  }
  function removePayment(index: number) {
    setPaymentMilestones((current) =>
      current.filter((item, itemIndex) => itemIndex !== index),
    );
  }
  const scheduledTotal = paymentMilestones
    .filter((item) => item.status !== "waived")
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const paidTotal = paymentMilestones
    .filter((item) => item.status === "paid")
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const checklistComplete = Object.values(orderChecklist).filter(
    (value) => value.trim().length >= 2,
  ).length;
  async function save() {
    setMessage("Saving order handoff…");
    try {
      const response = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: record.reference,
          receivedAt: record.receivedAt,
          status: record.status,
          owner: record.owner,
          nextAction: record.nextAction,
          nextActionDue: record.nextActionDue,
          internalNote: record.internalNote,
          buyerUpdate: record.buyerUpdate,
          lastContactedAt: record.lastContactedAt,
          orderChangeReason,
          orderHandoff: {
            method,
            orderReference,
            orderUrl: method === "alibaba_trade_assurance" ? orderUrl : "",
            confirmedAt,
            note,
            fulfillmentStatus,
            carrier,
            trackingNumber,
            paymentCurrency,
            paymentMilestones,
            orderChecklist,
          },
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(result.message || "Order handoff could not be saved.");
      onSaved(result.record);
      if (result.orderChangeProposed) {
        setOrderChangeReason("");
        setMessage(
          result.buyerNotificationSent
            ? "Critical changes were saved as a buyer approval request and the buyer was emailed. The current confirmed order version remains unchanged."
            : `Critical changes were saved, but buyer email was not sent (${String(result.buyerNotificationStatus || "unknown").replaceAll("_", " ")}). Follow up manually; the current version remains unchanged.`,
        );
      } else
        setMessage(
          "Order handoff saved. Confirm the pipeline stage only after both sides have accepted the order documents.",
        );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Order handoff could not be saved.",
      );
    }
  }
  return (
    <details className="admin-order-handoff">
      <summary>
        Trade Assurance / contract handoff · order readiness {checklistComplete}
        /8
      </summary>
      {record.buyerOrderRequests?.length && record.orderPreparationPackets?.at(-1)?.status === "reviewed" ? <p className="admin-order-confirmation-gate">{acceptedConfirmation ? `Buyer accepted pre-order confirmation V${acceptedConfirmation.version}. The eight fields below were copied from that preserved version and must remain identical when the formal order is first confirmed.` : "This project uses the new-order gate: issue an eight-item pre-order confirmation and obtain the buyer's acceptance before confirming the formal order stage."}</p> : null}
      <div className="admin-follow-up-grid">
        <label>
          Order method
          <select
            value={method}
            onChange={(event) =>
              setMethod(event.target.value as OrderHandoff["method"])
            }
          >
            <option value="alibaba_trade_assurance">
              Alibaba Trade Assurance
            </option>
            <option value="contract">Bilateral contract</option>
          </select>
        </label>
        <label>
          Order / contract reference
          <input
            value={orderReference}
            onChange={(event) => setOrderReference(event.target.value)}
            placeholder="Exact order or contract number"
          />
        </label>
        <label>
          Confirmed date
          <input
            type="date"
            value={confirmedAt}
            onChange={(event) => setConfirmedAt(event.target.value)}
          />
        </label>
        <label>
          Fulfillment stage
          <select
            value={fulfillmentStatus}
            onChange={(event) => setFulfillmentStatus(event.target.value)}
          >
            <option value="order_documents">Order documents</option>
            <option value="awaiting_payment">Awaiting payment</option>
            <option value="payment_confirmed">Payment confirmed</option>
            <option value="sampling">Sampling</option>
            <option value="production">Production</option>
            <option value="quality_check">Quality check</option>
            <option value="ready_to_ship">Ready to ship</option>
            <option value="shipped">Shipped</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On hold</option>
          </select>
        </label>
        <label>
          Carrier
          <input
            value={carrier}
            onChange={(event) => setCarrier(event.target.value)}
            placeholder="After shipment"
          />
        </label>
        <label>
          Tracking / B/L reference
          <input
            value={trackingNumber}
            onChange={(event) => setTrackingNumber(event.target.value)}
            placeholder="After shipment"
          />
        </label>
        {method === "alibaba_trade_assurance" && (
          <label className="admin-form-full">
            Alibaba Trade Assurance order URL
            <input
              type="url"
              value={orderUrl}
              onChange={(event) => setOrderUrl(event.target.value)}
              placeholder="https://...alibaba.com/..."
            />
          </label>
        )}
        <label className="admin-form-full">
          Buyer-safe order note
          <textarea
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="What the buyer should do next. Do not include passwords, bank credentials or internal pricing."
          />
        </label>
        <section className="admin-order-checklist admin-form-full">
          <div>
            <strong>Written order-readiness checklist</strong>
            <span>
              {checklistComplete}/8 complete. Every item must cite the agreed
              value or document reference before Order confirmed.
            </span>
          </div>
          <label>
            Product specification / document
            <input
              value={orderChecklist.productSpecification}
              onChange={(event) =>
                updateChecklist("productSpecification", event.target.value)
              }
              placeholder="Approved specification version or document reference"
            />
          </label>
          <label>
            Sample decision / reference
            <input
              value={orderChecklist.sampleDecision}
              onChange={(event) =>
                updateChecklist("sampleDecision", event.target.value)
              }
              placeholder="Approved sample reference or written reason sample is not required"
            />
          </label>
          <label>
            Quantity and size ratio
            <input
              value={orderChecklist.quantitySizeRatio}
              onChange={(event) =>
                updateChecklist("quantitySizeRatio", event.target.value)
              }
              placeholder="Total pairs and final size breakdown"
            />
          </label>
          <label>
            Colors and materials
            <input
              value={orderChecklist.colorsMaterials}
              onChange={(event) =>
                updateChecklist("colorsMaterials", event.target.value)
              }
              placeholder="Final colors and material reference"
            />
          </label>
          <label>
            Packing and labeling
            <input
              value={orderChecklist.packingLabeling}
              onChange={(event) =>
                updateChecklist("packingLabeling", event.target.value)
              }
              placeholder="Box, carton, marks and labels"
            />
          </label>
          <label>
            Price, trade term and named place
            <input
              value={orderChecklist.priceTradeTerm}
              onChange={(event) =>
                updateChecklist("priceTradeTerm", event.target.value)
              }
              placeholder="Issued quote and exact named port/place"
            />
          </label>
          <label>
            Payment terms
            <input
              value={orderChecklist.paymentTerms}
              onChange={(event) =>
                updateChecklist("paymentTerms", event.target.value)
              }
              placeholder="Written payment schedule or order clause"
            />
          </label>
          <label>
            Delivery / production window
            <input
              value={orderChecklist.deliveryWindow}
              onChange={(event) =>
                updateChecklist("deliveryWindow", event.target.value)
              }
              placeholder="Confirmed production or delivery timing"
            />
          </label>
          <small>
            Do not use vague placeholders. These values are buyer-visible and
            must match the issued quotation, Trade Assurance order or bilateral
            contract.
          </small>
        </section>
        <section className="admin-payment-schedule admin-form-full">
          <div>
            <div>
              <strong>Payment milestones</strong>
              <span>
                Track agreed payment stages only. Never enter bank passwords,
                verification codes or full account credentials.
              </span>
            </div>
            <label>
              Currency
              <select
                value={paymentCurrency}
                onChange={(event) => setPaymentCurrency(event.target.value)}
              >
                <option>USD</option>
                <option>EUR</option>
              </select>
            </label>
          </div>
          {paymentMilestones.map((item, index) => (
            <article key={`${item.id}-${index}`}>
              <input
                aria-label="Payment label"
                value={item.label}
                onChange={(event) =>
                  updatePayment(index, "label", event.target.value)
                }
                placeholder="Deposit / balance / freight"
              />
              <input
                aria-label="Payment amount"
                inputMode="decimal"
                value={item.amount}
                onChange={(event) =>
                  updatePayment(index, "amount", event.target.value)
                }
                placeholder="Amount"
              />
              <input
                aria-label="Payment due date"
                type="date"
                value={item.dueDate}
                onChange={(event) =>
                  updatePayment(index, "dueDate", event.target.value)
                }
              />
              <select
                aria-label="Payment status"
                value={item.status}
                onChange={(event) =>
                  updatePayment(index, "status", event.target.value)
                }
              >
                <option value="planned">Planned</option>
                <option value="due">Due</option>
                <option value="paid">Paid</option>
                <option value="waived">Waived</option>
              </select>
              {item.status === "paid" && (
                <input
                  aria-label="Actual paid date"
                  type="date"
                  value={item.paidAt}
                  onChange={(event) =>
                    updatePayment(index, "paidAt", event.target.value)
                  }
                />
              )}
              <input
                aria-label="Payment reference"
                value={item.reference}
                onChange={(event) =>
                  updatePayment(index, "reference", event.target.value)
                }
                placeholder="TA transaction / receipt reference"
              />
              <input
                aria-label="Payment note"
                value={item.note}
                onChange={(event) =>
                  updatePayment(index, "note", event.target.value)
                }
                placeholder="Buyer-safe note"
              />
              <button type="button" onClick={() => removePayment(index)}>
                Remove
              </button>
            </article>
          ))}
          <div className="payment-schedule-actions">
            <button
              type="button"
              onClick={addPaymentMilestone}
              disabled={paymentMilestones.length >= 6}
            >
              Add milestone
            </button>
            <span>
              Scheduled {paymentCurrency} {scheduledTotal.toFixed(2)} · Paid{" "}
              {paymentCurrency} {paidTotal.toFixed(2)}
            </span>
          </div>
        </section>
        {record.status === "order_confirmed" && (
          <label className="admin-form-full admin-order-change-reason">
            Reason for changing confirmed commercial terms
            <textarea
              rows={3}
              value={orderChangeReason}
              onChange={(event) => setOrderChangeReason(event.target.value)}
              placeholder="Required only when changing method, reference, confirmed date, checklist, currency or payment plan. Fulfillment, tracking and actual payment status update directly."
            />
          </label>
        )}
        <button className="button button-small" type="button" onClick={save}>
          Save order handoff
        </button>
        <span aria-live="polite">{message}</span>
        {record.orderHandoff && (
          <p className="admin-form-full order-handoff-saved">
            <strong>Saved:</strong> {record.orderHandoff.orderReference} ·{" "}
            {record.orderHandoff.method.replaceAll("_", " ")} ·{" "}
            {record.orderHandoff.fulfillmentStatus?.replaceAll("_", " ")}
          </p>
        )}
      </div>
    </details>
  );
}

function FollowUpEditor({
  record,
  token,
  onSaved,
}: {
  record: Inquiry;
  token: string;
  onSaved: (record: Inquiry) => void;
}) {
  const [pipelineStatus, setPipelineStatus] = useState(record.status || "new");
  const [owner, setOwner] = useState(record.owner || "");
  const [nextAction, setNextAction] = useState(record.nextAction || "");
  const [nextActionDue, setNextActionDue] = useState(
    record.nextActionDue || "",
  );
  const [internalNote, setInternalNote] = useState(record.internalNote || "");
  const [buyerUpdate, setBuyerUpdate] = useState(record.buyerUpdate || "");
  const [lastContactedAt, setLastContactedAt] = useState(
    record.lastContactedAt || "",
  );
  const [lostReason, setLostReason] = useState(record.lostReason || "");
  const [message, setMessage] = useState("");

  async function save() {
    setMessage("Saving…");
    try {
      const response = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: record.reference,
          receivedAt: record.receivedAt,
          status: pipelineStatus,
          lostReason,
          owner,
          nextAction,
          nextActionDue,
          internalNote,
          buyerUpdate,
          lastContactedAt,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(result.message || "Update failed.");
      onSaved(result.record);
      setMessage("Saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update failed.");
    }
  }

  return (
    <details className="admin-follow-up">
      <summary>Update follow-up</summary>
      <div className="admin-follow-up-grid">
        <label>
          Pipeline stage
          <select
            value={pipelineStatus}
            onChange={(event) => setPipelineStatus(event.target.value)}
          >
            {PIPELINE.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {pipelineStatus === "lost" && (
          <label>
            Primary lost reason
            <select
              required
              value={lostReason}
              onChange={(event) => setLostReason(event.target.value)}
            >
              {LOST_REASONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Owner
          <input
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            placeholder="Salesperson"
          />
        </label>
        <label>
          Last contacted
          <input
            type="date"
            value={lastContactedAt}
            onChange={(event) => setLastContactedAt(event.target.value)}
          />
        </label>
        <label>
          Next action due
          <input
            type="date"
            value={nextActionDue}
            onChange={(event) => setNextActionDue(event.target.value)}
          />
        </label>
        <label className="admin-form-full">
          Next action
          <input
            value={nextAction}
            onChange={(event) => setNextAction(event.target.value)}
            placeholder="One clear internal next action"
          />
        </label>
        <label className="admin-form-full">
          Buyer-visible update
          <textarea
            value={buyerUpdate}
            onChange={(event) => setBuyerUpdate(event.target.value)}
            rows={3}
            placeholder="Safe progress message shown on the buyer status page. Do not include internal pricing or private notes."
          />
        </label>
        <label className="admin-form-full">
          Internal note
          <textarea
            value={internalNote}
            onChange={(event) => setInternalNote(event.target.value)}
            rows={3}
            placeholder="Private quote, objection, sample or negotiation note"
          />
        </label>
        <button className="button button-small" type="button" onClick={save}>
          Save follow-up
        </button>
        <span aria-live="polite">{message}</span>
      </div>
    </details>
  );
}

function OrderChangeAdminSummary({ record }: { record: Inquiry }) {
  const requests = record.orderChangeRequests || [];
  const operations = record.orderOperationalHistory || [];
  if (!record.orderVersions?.length && !requests.length && !operations.length)
    return null;
  return (
    <details
      className="admin-order-change-summary"
      open={requests.some((item) => item.status === "awaiting_buyer")}
    >
      <summary>
        Confirmed-order history · version{" "}
        {record.orderVersions?.at(-1)?.version || 1}
      </summary>
      <div>
        {requests.length ? (
          <section>
            <strong>Critical change requests</strong>
            {[...requests].reverse().map((item) => (
              <article key={item.id}>
                <div>
                  <b>{item.id}</b>
                  <span
                    className={`status-pill ${item.status === "awaiting_buyer" ? "status-overdue" : "status-ok"}`}
                  >
                    {item.status.replaceAll("_", " ")}
                  </span>
                </div>
                <p>{item.reason}</p>
                <small>
                  Version {item.baseVersion} · {item.changedFields.join(" · ")}{" "}
                  · {new Date(item.createdAt).toLocaleString()} · buyer email{" "}
                  {item.notificationSent
                    ? "sent"
                    : (item.notificationStatus || "not recorded").replaceAll(
                        "_",
                        " ",
                      )}
                </small>
                {item.buyerDecision && (
                  <p>
                    <b>Buyer:</b> {item.buyerDecision} ·{" "}
                    {item.buyerNote || "No note"}
                  </p>
                )}
              </article>
            ))}
          </section>
        ) : (
          <p>No critical change request has been recorded.</p>
        )}
        {operations.length ? (
          <section>
            <strong>Operational updates</strong>
            <ol>
              {[...operations]
                .reverse()
                .slice(0, 10)
                .map((item, index) => (
                  <li key={`${item.changedAt}-${index}`}>
                    <b>{item.fields.join(" · ")}</b>
                    <span>
                      {new Date(item.changedAt).toLocaleString()} ·{" "}
                      {item.changedBy}
                    </span>
                  </li>
                ))}
            </ol>
          </section>
        ) : null}
        <small>
          Critical commercial edits require buyer approval and create a new
          website version. Fulfillment, tracking and actual-payment updates do
          not rewrite the accepted commercial version.
        </small>
      </div>
    </details>
  );
}

function FulfillmentCaseManager({
  record,
  token,
  onSaved,
}: {
  record: Inquiry;
  token: string;
  onSaved: (record: Inquiry) => void;
}) {
  const [category, setCategory] = useState("production_delay");
  const [title, setTitle] = useState("");
  const [facts, setFacts] = useState("");
  const [affectedScope, setAffectedScope] = useState("");
  const [impact, setImpact] = useState("");
  const [proposedResolution, setProposedResolution] = useState("");
  const [responseDue, setResponseDue] = useState("");
  const [resolutionNote, setResolutionNote] = useState<Record<string, string>>(
    {},
  );
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  if (record.status !== "order_confirmed" || !record.orderHandoff) return null;
  const cases = record.fulfillmentCases || [];
  async function createCase(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("Saving exception before buyer notification…");
    try {
      const response = await fetch("/api/admin/fulfillment-case", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: record.reference,
          receivedAt: record.receivedAt,
          category,
          title,
          facts,
          affectedScope,
          impact,
          proposedResolution,
          responseDue,
          createdBy: record.owner,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(
          result.message || "Fulfillment case could not be saved.",
        );
      onSaved(result.record);
      setTitle("");
      setFacts("");
      setAffectedScope("");
      setImpact("");
      setProposedResolution("");
      setResponseDue("");
      setMessage(
        `Case ${result.case.id} saved${result.notificationSent ? " and buyer emailed" : "; buyer email was not sent"}.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Fulfillment case could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function resolveCase(caseId: string) {
    const note = resolutionNote[caseId]?.trim() || "";
    if (note.length < 3) {
      setMessage("Record the verified resolution before closing the case.");
      return;
    }
    setSaving(true);
    setMessage("Saving resolution…");
    try {
      const response = await fetch("/api/admin/fulfillment-case", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: record.reference,
          receivedAt: record.receivedAt,
          caseId,
          resolutionNote: note,
          resolvedBy: record.owner,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(result.message || "Resolution could not be saved.");
      onSaved(result.record);
      setMessage(
        `${caseId} marked resolved. Verify the same outcome in the formal order channel.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Resolution could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <details
      className="admin-fulfillment-cases"
      open={cases.some((item) =>
        [
          "awaiting_buyer",
          "buyer_revision_requested",
          "open_internal",
        ].includes(item.status),
      )}
    >
      <summary>
        Fulfillment exceptions &amp; delivery feedback · {cases.length}
      </summary>
      <div>
        {cases.length ? (
          <section className="admin-fulfillment-list">
            {[...cases].reverse().map((item) => (
              <article key={item.id}>
                <div>
                  <b>
                    {item.id} · {item.title}
                  </b>
                  <span
                    className={`status-pill ${["awaiting_buyer", "buyer_revision_requested", "open_internal"].includes(item.status) ? "status-overdue" : "status-ok"}`}
                  >
                    {item.status.replaceAll("_", " ")}
                  </span>
                </div>
                <p>
                  <b>Facts:</b> {item.facts}
                </p>
                <p>
                  <b>Scope / impact:</b> {item.affectedScope} · {item.impact}
                </p>
                <p>
                  <b>Proposed resolution:</b> {item.proposedResolution}
                </p>
                <small>
                  {item.source} · {item.category.replaceAll("_", " ")} · due{" "}
                  {item.responseDue} · notification{" "}
                  {(item.notificationStatus || "not recorded").replaceAll(
                    "_",
                    " ",
                  )}
                </small>
                {item.buyerDecision && (
                  <p>
                    <b>Buyer:</b> {item.buyerDecision.replaceAll("_", " ")} ·{" "}
                    {item.buyerNote || "No note"}
                  </p>
                )}
                {[
                  "buyer_acknowledged",
                  "buyer_revision_requested",
                  "open_internal",
                ].includes(item.status) ? (
                  <div className="admin-case-resolution">
                    <textarea
                      rows={2}
                      maxLength={1200}
                      value={resolutionNote[item.id] || ""}
                      onChange={(event) =>
                        setResolutionNote((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      placeholder="Verified resolution and supporting formal-channel reference"
                    />
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => resolveCase(item.id)}
                    >
                      Mark resolved
                    </button>
                  </div>
                ) : item.resolutionNote ? (
                  <p>
                    <b>Resolution:</b> {item.resolutionNote}
                  </p>
                ) : null}
              </article>
            ))}
          </section>
        ) : (
          <p>No fulfillment exception has been recorded.</p>
        )}
        {record.deliveryFeedback?.length ? (
          <section className="admin-delivery-feedback">
            <strong>Buyer delivery feedback</strong>
            {[...record.deliveryFeedback].reverse().map((item) => (
              <p key={`${item.id}-${item.createdAt}`}>
                <b>{item.action.replaceAll("_", " ")}</b>
                <span>
                  {item.trackingReference} ·{" "}
                  {new Date(item.createdAt).toLocaleString()}
                </span>
                <small>{item.note || "No note"}</small>
              </p>
            ))}
          </section>
        ) : null}
        <form onSubmit={createCase} className="admin-follow-up-grid">
          <label>
            Exception category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="production_delay">Production delay</option>
              <option value="quality_check">Quality check</option>
              <option value="packing_labeling">Packing / labeling</option>
              <option value="logistics">Logistics</option>
              <option value="document">Document</option>
              <option value="quantity_specification">
                Quantity / specification
              </option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Buyer response due
            <input
              required
              type="date"
              value={responseDue}
              onChange={(event) => setResponseDue(event.target.value)}
            />
          </label>
          <label className="admin-form-full">
            Buyer-facing title
            <input
              required
              minLength={3}
              maxLength={160}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className="admin-form-full">
            Verified facts
            <textarea
              required
              rows={3}
              maxLength={1200}
              value={facts}
              onChange={(event) => setFacts(event.target.value)}
              placeholder="What is known now; separate observations from unverified causes."
            />
          </label>
          <label>
            Affected scope
            <textarea
              required
              rows={2}
              maxLength={600}
              value={affectedScope}
              onChange={(event) => setAffectedScope(event.target.value)}
              placeholder="Styles, quantities, cartons, documents or shipment reference"
            />
          </label>
          <label>
            Expected impact
            <textarea
              required
              rows={2}
              maxLength={600}
              value={impact}
              onChange={(event) => setImpact(event.target.value)}
              placeholder="Timing, inspection, packing or shipment impact"
            />
          </label>
          <label className="admin-form-full">
            Proposed resolution
            <textarea
              required
              rows={3}
              maxLength={1200}
              value={proposedResolution}
              onChange={(event) => setProposedResolution(event.target.value)}
              placeholder="One realistic next step. Do not promise unverified results."
            />
          </label>
          <button
            className="button button-small"
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save case & notify buyer"}
          </button>
          <span aria-live="polite">{message}</span>
        </form>
        <small>
          Use this for operational exceptions, not silent commercial changes. If
          price, specification, quantity, payment or delivery terms must change,
          use the confirmed-order change approval workflow and update Trade
          Assurance or the signed contract.
        </small>
      </div>
    </details>
  );
}

export default function InquiryAdminPage() {
  const [token, setToken] = useState("");
  const [records, setRecords] = useState<Inquiry[]>([]);
  const [status, setStatus] = useState(
    "Enter the EdgeOne inquiry dashboard token to load records.",
  );
  const [loading, setLoading] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [stageFilter, setStageFilter] = useState("all");
  const [readinessFilter, setReadinessFilter] = useState("all");
  const [sortMode, setSortMode] = useState("newest");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [repeatOnly, setRepeatOnly] = useState(false);
  const [analytics, setAnalytics] = useState<CommercialAnalytics | null>(null);
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [reminders, setReminders] = useState<ReminderSummary | null>(null);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");
  const businessRecords = useMemo(
    () => records.filter((record) => !record.internalTest),
    [records],
  );
  const relationshipGroups = useMemo(
    () => buildRelationshipGroups(businessRecords),
    [businessRecords],
  );
  const relationshipByReference = useMemo(
    () => relationshipIndex(relationshipGroups),
    [relationshipGroups],
  );
  const readinessByReference = useMemo(
    () =>
      new Map(
        records.map((record) => [
          record.reference,
          assessInquiryReadiness(record),
        ]),
      ),
    [records],
  );
  const baseRecords = showTests ? records : businessRecords;
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = (record: Inquiry) =>
    Boolean(
      record.nextActionDue &&
      record.nextActionDue < today &&
      !["lost", "spam", "order_confirmed"].includes(record.status),
    );
  const stageRecords =
    stageFilter === "all"
      ? baseRecords
      : baseRecords.filter((record) => record.status === stageFilter);
  const dueRecords = overdueOnly
    ? stageRecords.filter(isOverdue)
    : stageRecords;
  const repeatRecords = repeatOnly
    ? dueRecords.filter((record) =>
        relationshipByReference.has(record.reference),
      )
    : dueRecords;
  const readinessRecords =
    readinessFilter === "all"
      ? repeatRecords
      : repeatRecords.filter(
          (record) =>
            readinessByReference.get(record.reference)?.level ===
            readinessFilter,
        );
  const visibleRecords = [...readinessRecords].sort((left, right) =>
    sortMode === "readiness"
      ? (readinessByReference.get(right.reference)?.score || 0) -
          (readinessByReference.get(left.reference)?.score || 0) ||
        right.receivedAt.localeCompare(left.receivedAt)
      : right.receivedAt.localeCompare(left.receivedAt),
  );
  const overdue = businessRecords.filter(isOverdue).length;
  const confirmed = businessRecords.filter(
    (record) => record.status === "order_confirmed",
  ).length;
  const commerciallyReady = businessRecords.filter(
    (record) => readinessByReference.get(record.reference)?.level === "ready",
  ).length;
  const recommendationsAwaitingBuyer = businessRecords.filter(
    (record) => record.recommendationSets?.at(-1)?.status === "issued",
  ).length;
  const samplesAwaitingBuyer = businessRecords.filter(
    (record) => record.sampleProgram?.status === "buyer_review",
  ).length;
  const retentionHolds = businessRecords.filter(
    (record) => record.dataLifecycle?.hold?.status === "active",
  ).length;
  const deletionWorkflows = businessRecords.filter((record) =>
    ["requested", "approved", "execution_failed"].includes(
      record.dataLifecycle?.deletion?.status || "",
    ),
  ).length;

  async function loadAnalytics(days = analyticsDays) {
    if (!token) return;
    setAnalyticsLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(
          result.message || "Commercial analytics could not be loaded.",
        );
      setAnalytics(result.analytics);
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Commercial analytics could not be loaded.",
      );
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function loadReminders(send = false) {
    if (!token) return;
    setReminderLoading(true);
    setReminderMessage(
      send
        ? "Sending today's internal digest…"
        : "Refreshing reminder preview…",
    );
    try {
      const response = await fetch("/api/admin/reminders", {
        method: send ? "POST" : "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (result.summary) setReminders(result.summary);
      if (!response.ok || !result.ok)
        throw new Error(
          result.message || "Sales reminders could not be loaded.",
        );
      setReminderMessage(
        send
          ? `Digest sent at ${new Date(result.sentAt).toLocaleString()}.`
          : `${result.summary.counts.total} action reminders found.`,
      );
    } catch (error) {
      setReminderMessage(
        error instanceof Error
          ? error.message
          : "Sales reminders could not be loaded.",
      );
    } finally {
      setReminderLoading(false);
    }
  }

  async function loadRecords(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setStatus("Loading inquiry records…");
    try {
      const response = await fetch("/api/admin/inquiries", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(result.message || "Records could not be loaded.");
      setRecords(result.records || []);
      setStatus(
        `${(result.records || []).filter((record: Inquiry) => !record.internalTest).length} business inquiries loaded. Internal tests are excluded by default.`,
      );
      await Promise.all([loadAnalytics(), loadReminders()]);
    } catch (error) {
      setRecords([]);
      setAnalytics(null);
      setReminders(null);
      setStatus(
        error instanceof Error ? error.message : "Records could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  function replaceRecord(updated: Inquiry) {
    setRecords((current) =>
      current.map((record) =>
        record.reference === updated.reference ? updated : record,
      ),
    );
  }
  function exportCsv() {
    const headers = [
      "Reference",
      "Readiness score",
      "Readiness level",
      "Qualification gaps",
      "Relationship group",
      "Related records",
      "Relationship match basis",
      "Received at",
      "Stage",
      "Lost reason",
      "Stage changes",
      "Owner",
      "Last contacted",
      "Next action due",
      "Next action",
      "Buyer update",
      "Email notified",
      "Project path",
      "Sourcing program",
      "Styles",
      "Name",
      "Company",
      "Buyer type",
      "Market",
      "Quantity",
      "Sample quantity",
      "Sample project status",
      "Physical sample reference",
      "Sample styles",
      "Sample review scope",
      "Sample deliverables",
      "Sample acceptance criteria",
      "Sample exclusions",
      "Sample review rounds",
      "Sample buyer decision",
      "Bulk quantity",
      "Trade-term preference",
      "Delivery destination",
      "Delivery timing",
      "Primary email",
      "Active workspace contacts",
      "Workspace contact audit events",
      "WhatsApp",
      "Requirements",
      "Technical changes",
      "Buyer target/test",
      "NDA",
      "Recommendation versions",
      "Latest recommendation",
      "Recommended styles",
      "Recommendation status",
      "Buyer shortlist response",
      "Buyer shortlist styles",
      "Buyer shortlist note",
      "Buyer files",
      "Quotation versions",
      "Latest quotation",
      "Latest quote status",
      "Order setup requested",
      "Requested quote",
      "Requested channel",
      "Legal purchasing company",
      "Purchasing contact",
      "Buyer PO reference",
      "Requested destination",
      "Requested window",
      "Order method",
      "Order / contract reference",
      "Order confirmed date",
      "Fulfillment",
      "Payment currency",
      "Payment milestones",
      "Carrier",
      "Tracking / B/L",
      "Internal note",
      "UTM source",
      "UTM medium",
      "UTM campaign",
      "Retention review due",
      "Retention hold",
      "Deletion workflow",
      "Page",
    ];
    const rows = visibleRecords.map((record) => {
      const relationship = relationshipByReference.get(record.reference);
      const readiness = readinessByReference.get(record.reference);
      const buyerOrderRequest = record.buyerOrderRequests?.at(-1);
      const recommendation = record.recommendationSets?.at(-1);
      return [
        record.reference,
        readiness?.score,
        readiness?.level,
        readiness?.missing.join(" | "),
        relationship?.id,
        relationship?.records.length || 1,
        relationship?.matchBasis.join(" | "),
        record.receivedAt,
        record.status,
        record.lostReason,
        record.pipelineHistory?.length || 0,
        record.owner,
        record.lastContactedAt,
        record.nextActionDue,
        record.nextAction,
        record.buyerUpdate,
        record.notificationSent ? "Yes" : "No",
        record.projectPath,
        record.sourcingProgram,
        record.styleCode,
        record.name,
        record.company,
        record.buyerType,
        record.market,
        record.quantity,
        record.sampleQuantity,
        record.sampleProgram?.status,
        record.sampleProgram?.sampleReference,
        record.sampleProgram?.styleCodes,
        record.sampleProgram?.reviewScope,
        record.sampleProgram?.deliverables,
        record.sampleProgram?.acceptanceCriteria,
        record.sampleProgram?.exclusions,
        record.sampleProgram?.reviewRounds?.length || 0,
        record.sampleProgram?.buyerDecision,
        record.bulkQuantity,
        record.preferredTradeTerm,
        record.deliveryDestination,
        record.deliveryTiming,
        record.email,
        record.workspaceContacts
          ?.filter((contact) => contact.status === "active")
          .map((contact) => `${contact.name}:${contact.email}:${contact.role}`)
          .join(" | "),
        record.workspaceContactAudit?.length || 0,
        record.whatsapp,
        record.requirements,
        record.changesRequired,
        record.targetValues,
        record.ndaRequired,
        record.recommendationSets?.length || 0,
        recommendation?.id,
        recommendation?.items.map((item) => item.code).join(" | "),
        recommendation?.status,
        recommendation?.buyerDecision,
        recommendation?.selectedCodes?.join(" | "),
        recommendation?.buyerNote,
        record.attachments?.map((file) => file.name).join(" | "),
        record.quotations?.length || 0,
        record.quotations?.at(-1)?.quoteNumber,
        record.quotations?.at(-1)?.status,
        buyerOrderRequest?.submittedAt,
        buyerOrderRequest?.quoteNumber,
        buyerOrderRequest?.preferredOrderChannel,
        buyerOrderRequest?.legalCompanyName,
        buyerOrderRequest?.purchasingContact,
        buyerOrderRequest?.purchaseOrderReference,
        buyerOrderRequest?.destination,
        buyerOrderRequest?.requestedWindow,
        record.orderHandoff?.method,
        record.orderHandoff?.orderReference,
        record.orderHandoff?.confirmedAt,
        record.orderHandoff?.fulfillmentStatus,
        record.orderHandoff?.paymentCurrency,
        record.orderHandoff?.paymentMilestones
          ?.map((item) => `${item.label}:${item.amount}:${item.status}`)
          .join(" | "),
        record.orderHandoff?.carrier,
        record.orderHandoff?.trackingNumber,
        record.internalNote,
        record.attribution?.utmSource,
        record.attribution?.utmMedium,
        record.attribution?.utmCampaign,
        record.dataLifecycle?.review?.reviewDue,
        record.dataLifecycle?.hold?.status,
        record.dataLifecycle?.deletion?.status,
        record.page,
      ];
    });
    headers.push(
      "Preferred contact channel",
      "Preferred response language",
      "Buyer time zone / city",
      "Convenient local contact time",
      "External contact evidence count",
      "Latest external contact",
      "Adaptation intent",
      "Artwork readiness",
      "Branding placement target",
      "Color / material target",
      "Packing / labeling target",
    );
    rows.forEach((row, index) => {
      const record = visibleRecords[index];
      const latest = record.externalContacts?.at(-1);
      row.push(
        record.preferredContactMethod,
        record.preferredResponseLanguage,
        record.buyerTimezone,
        record.preferredContactWindow,
        record.externalContacts?.length || 0,
        latest
          ? `${latest.occurredAt} | ${latest.channel} | ${latest.direction} | ${latest.outcome} | ${latest.summary}`
          : "",
        record.adaptationBrief?.intent,
        record.adaptationBrief?.artworkStatus,
        record.adaptationBrief?.brandingPlacement,
        record.adaptationBrief?.colorDirection,
        record.adaptationBrief?.packingLabeling,
      );
    });
    const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `beiqiang-inquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">BEIQIANG INTERNAL</p>
          <h1>Inquiry &amp; order pipeline</h1>
          <p>
            Review sourcing requests, qualify buyers and move each opportunity
            through sample, quote, negotiation and confirmed order stages.
            Buyer-safe reply starters remain drafts until a salesperson reviews
            and sends them.
          </p>
        </div>
        <Link className="text-link" href="/">
          Return to website <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <section className="admin-access-card">
        <form onSubmit={loadRecords}>
          <label>
            Dashboard access token
            <input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              autoComplete="current-password"
              required
              placeholder="Stored only in this page session"
            />
          </label>
          <button className="button" type="submit" disabled={loading}>
            {loading ? "Loading…" : "Load inquiries"}
          </button>
        </form>
        <p className="admin-status" aria-live="polite">
          {status}
        </p>
      </section>
      <ChineseSalesCockpit
        records={businessRecords}
        readinessByReference={readinessByReference}
      />
      <AcquisitionCampaignWorkbench
        channels={analytics?.acquisitionChannels || null}
      />
      <p className="admin-weekly-review-note">
        加载数据后可保存不可覆盖聚合快照、比较同周期趋势并下载中文Markdown周报。
      </p>
      <ChineseWeeklyReview
        analytics={analytics}
        days={analyticsDays}
        token={token}
      />
      <MeetingPerformancePanel
        metrics={analytics?.supporting}
        days={analyticsDays}
      />
      <CommercialDashboard
        data={analytics}
        days={analyticsDays}
        loading={analyticsLoading}
        onDaysChange={(days) => {
          setAnalyticsDays(days);
          void loadAnalytics(days);
        }}
        onRefresh={() => void loadAnalytics()}
      />
      <ResourceAnalyticsPanel data={analytics} />
      <CollectionAnalyticsPanel data={analytics} />
      <ProductShareAnalyticsPanel data={analytics} />
      <ComparisonAnalyticsPanel data={analytics} />
      <ReminderCenter
        summary={reminders}
        loading={reminderLoading}
        message={reminderMessage}
        onRefresh={() => void loadReminders()}
        onSend={() => void loadReminders(true)}
      />
      <RepeatOrderReminderList summary={reminders} />
      <RelationshipCenter
        groups={relationshipGroups}
        onShowRepeat={() => {
          setRepeatOnly(true);
          setShowTests(false);
          setOverdueOnly(false);
          setStageFilter("all");
        }}
      />
      <section className="admin-metrics" aria-label="Inquiry summary">
        <article>
          <small>BUSINESS INQUIRIES</small>
          <strong>{businessRecords.length}</strong>
        </article>
        <article>
          <small>COMMERCIAL-REVIEW READY</small>
          <strong>{commerciallyReady}</strong>
        </article>
        <article>
          <small>SHORTLISTS AWAITING BUYER</small>
          <strong>{recommendationsAwaitingBuyer}</strong>
        </article>
        <article>
          <small>SAMPLES AWAITING BUYER</small>
          <strong>{samplesAwaitingBuyer}</strong>
        </article>
        <article>
          <small>FOLLOW-UP OVERDUE</small>
          <strong>{overdue}</strong>
        </article>
        <article>
          <small>ACTIVE PIPELINE</small>
          <strong>
            {
              businessRecords.filter(
                (record) =>
                  !["lost", "spam", "order_confirmed"].includes(record.status),
              ).length
            }
          </strong>
        </article>
        <article>
          <small>ORDERS CONFIRMED</small>
          <strong>{confirmed}</strong>
        </article>
        <article>
          <small>RETENTION HOLDS</small>
          <strong>{retentionHolds}</strong>
        </article>
        <article>
          <small>DELETION WORKFLOWS</small>
          <strong>{deletionWorkflows}</strong>
        </article>
      </section>
      <section className="admin-ledger">
        <div className="admin-toolbar">
          <div>
            <label>
              <input
                type="checkbox"
                checked={showTests}
                onChange={(event) => setShowTests(event.target.checked)}
              />{" "}
              Show internal tests
            </label>
            <label>
              <input
                type="checkbox"
                checked={repeatOnly}
                onChange={(event) => setRepeatOnly(event.target.checked)}
              />{" "}
              Repeat-account signals only
            </label>
            <label>
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(event) => setOverdueOnly(event.target.checked)}
              />{" "}
              Overdue follow-up only
            </label>
            <label>
              Stage{" "}
              <select
                value={stageFilter}
                onChange={(event) => setStageFilter(event.target.value)}
              >
                <option value="all">All</option>
                {PIPELINE.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Brief readiness{" "}
              <select
                value={readinessFilter}
                onChange={(event) => setReadinessFilter(event.target.value)}
              >
                <option value="all">All</option>
                <option value="ready">Ready for review</option>
                <option value="qualify">Qualification needed</option>
                <option value="early">Early / incomplete</option>
              </select>
            </label>
            <label>
              Sort{" "}
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="readiness">Readiness score</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            className="button button-small"
            onClick={exportCsv}
            disabled={!visibleRecords.length}
          >
            Export pipeline CSV
          </button>
        </div>
        <div className="admin-cards">
          {visibleRecords.map((record) => {
            const relationship = relationshipByReference.get(record.reference);
            const readiness = readinessByReference.get(record.reference)!;
            return (
              <article
                className="admin-inquiry-card"
                id={record.reference}
                key={record.reference}
              >
                <div className="admin-card-top">
                  <div>
                    <span className={`status-pill status-${record.status}`}>
                      {record.status.replaceAll("_", " ")}
                    </span>
                    <span
                      className={`status-pill status-readiness-${readiness.level}`}
                    >
                      {readiness.score}/100 · {readiness.label}
                    </span>
                    {record.sampleProgram && (
                      <span className="status-pill status-sample">
                        Sample ·{" "}
                        {record.sampleProgram.status.replaceAll("_", " ")}
                      </span>
                    )}
                    {record.lostReason && (
                      <span className="status-pill">
                        {record.lostReason.replaceAll("_", " ")}
                      </span>
                    )}
                    {isOverdue(record) && (
                      <span className="status-pill status-overdue">
                        Follow-up overdue
                      </span>
                    )}
                    {relationship && (
                      <span className="status-pill status-repeat">
                        Repeat signal · {relationship.records.length}
                      </span>
                    )}
                    <h2>{record.company}</h2>
                    <p>
                      {record.name} · {record.buyerType} · {record.market}
                    </p>
                  </div>
                  <div>
                    <strong>{record.reference}</strong>
                    <small>
                      {record.receivedAt
                        ? new Date(record.receivedAt).toLocaleString()
                        : "—"}
                    </small>
                    {record.nextActionDue && (
                      <small>Next action due {record.nextActionDue}</small>
                    )}
                  </div>
                </div>
                <section
                  className={`admin-readiness admin-readiness-${readiness.level}`}
                >
                  <div>
                    <small>BUYING-BRIEF READINESS</small>
                    <strong>
                      {readiness.score}/100 · {readiness.label}
                    </strong>
                    <p>{readiness.summary}</p>
                  </div>
                  <div>
                    <small>NEXT QUALIFICATION QUESTIONS</small>
                    {readiness.missing.length ? (
                      <ul>
                        {readiness.missing.slice(0, 4).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>
                        No structural gap detected. Verify product facts and
                        commercial terms before issuing a quotation.
                      </p>
                    )}
                  </div>
                </section>
                <div className="admin-card-grid">
                  <div>
                    <small>STYLES / QUANTITY</small>
                    <strong>{record.styleCode}</strong>
                    <p>{record.bulkQuantity || record.quantity}</p>
                    <p>
                      <b>Trade / destination:</b>{" "}
                      {record.preferredTradeTerm || "not sure"} ·{" "}
                      {record.deliveryDestination || "destination TBD"}
                      {record.deliveryTiming
                        ? ` · ${record.deliveryTiming}`
                        : ""}
                    </p>
                    {record.items?.length ? (
                      <ul>
                        {record.items.map((item) => (
                          <li key={item.code}>
                            {item.code}: {item.quantity || "qty TBD"} ·{" "}
                            {item.colors || "colors TBD"} ·{" "}
                            {item.sizes || "sizes TBD"}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <div>
                    <small>PROJECT / REQUIREMENTS</small>
                    <strong>
                      {record.projectPath?.replaceAll("_", " ") ||
                        "standard inquiry"}
                    </strong>
                    {record.sourcingProgram && (
                      <p>
                        <b>Entry program:</b>{" "}
                        {record.sourcingProgram.replaceAll("-", " ")}
                      </p>
                    )}
                    <p>{record.requirements || "No extra requirements"}</p>
                    {record.changesRequired && (
                      <p>
                        <b>Changes:</b> {record.changesRequired}
                      </p>
                    )}
                    {record.targetValues && (
                      <p>
                        <b>Buyer targets:</b> {record.targetValues}
                      </p>
                    )}
                  </div>
                  <div>
                    <small>CONTACT / SOURCE</small>
                    <strong>{record.email || record.whatsapp || "—"}</strong>
                    <p>
                      {record.whatsapp && record.email ? record.whatsapp : ""}
                    </p>
                    <p>
                      {record.attribution?.utmSource || "Direct"} ·{" "}
                      {record.attribution?.utmCampaign || record.page || "—"}
                    </p>
                    <span
                      className={
                        record.notificationSent
                          ? "status-pill status-ok"
                          : "status-pill"
                      }
                    >
                      {record.notificationSent
                        ? "Email sent"
                        : "Email not sent"}
                    </span>
                  </div>
                </div>
                {record.adaptationBrief && (
                  <section className="admin-contact-preferences">
                    <small>EXISTING-STYLE ADAPTATION · BUYER TARGETS</small>
                    <p>
                      <strong>
                        {record.adaptationBrief.intent.replaceAll("_", " ")}
                      </strong>{" "}
                      · artwork{" "}
                      {record.adaptationBrief.artworkStatus.replaceAll(
                        "_",
                        " ",
                      )}
                    </p>
                    <span>
                      <b>Placement:</b>{" "}
                      {record.adaptationBrief.brandingPlacement ||
                        "not supplied"}{" "}
                      · <b>Color/material:</b>{" "}
                      {record.adaptationBrief.colorDirection || "not supplied"}{" "}
                      · <b>Packing/labeling:</b>{" "}
                      {record.adaptationBrief.packingLabeling || "not supplied"}
                    </span>
                    <span>
                      Review feasibility, cost drivers, MOQ, timing and sample
                      evidence before treating any target as a confirmed
                      specification.
                    </span>
                  </section>
                )}
                {(record.preferredContactMethod ||
                  record.preferredResponseLanguage ||
                  record.buyerTimezone ||
                  record.preferredContactWindow) && (
                  <section className="admin-contact-preferences">
                    <small>BUYER RESPONSE PREFERENCES · BUYER-PROVIDED</small>
                    <p>
                      <strong>
                        {record.preferredContactMethod?.replaceAll("_", " ") ||
                          "No channel preference"}
                      </strong>
                      {record.preferredResponseLanguage
                        ? ` · language ${record.preferredResponseLanguage}`
                        : ""}
                      {record.buyerTimezone ? ` · ${record.buyerTimezone}` : ""}
                      {record.preferredContactWindow
                        ? ` · ${record.preferredContactWindow}`
                        : ""}
                    </p>
                    <span>
                      Use as a manual scheduling aid only. It is not an
                      appointment, response-time promise or proof that the
                      requested language is available.
                    </span>
                  </section>
                )}
                <ExternalContactLog
                  key={`external-contact-${record.reference}-${record.updatedAt}`}
                  record={record}
                  token={token}
                  onSaved={replaceRecord}
                />
                <MeetingRequestCenter
                  key={`meeting-${record.reference}-${record.updatedAt}`}
                  record={record}
                  token={token}
                  onSaved={replaceRecord}
                />
                <WorkspaceContactManager
                  key={`workspace-contacts-${record.reference}-${record.updatedAt}`}
                  record={record}
                  token={token}
                  onSaved={replaceRecord}
                />
                <DataLifecycleCenter
                  key={`data-lifecycle-${record.reference}-${record.updatedAt}`}
                  record={record}
                  token={token}
                  onSaved={replaceRecord}
                />
                <RelatedInquiryHistory current={record} group={relationship} />
                <ProductRecommendationEditor
                  key={`recommendation-${record.reference}-${record.updatedAt}`}
                  record={record}
                  token={token}
                  onSaved={replaceRecord}
                />
                <AttachmentList
                  record={record}
                  token={token}
                  onSaved={replaceRecord}
                />
                <AdminOrderDocuments
                  key={`documents-${record.reference}-${record.updatedAt}`}
                  record={record}
                  token={token}
                  onSaved={replaceRecord}
                />
                <DocumentAuditHistory record={record} />
                <InquiryMessageCenter
                  key={`messages-${record.reference}-${record.updatedAt}`}
                  record={record}
                  token={token}
                  onSaved={replaceRecord}
                />
                <PipelineHistory record={record} />
                <FollowUpEditor
                  key={`followup-${record.reference}-${record.updatedAt}`}
                  record={record}
                  token={token}
                  onSaved={replaceRecord}
                />
                <SampleProgramEditor
                  key={`sample-${record.reference}-${record.updatedAt}`}
                  record={record}
                  token={token}
                  onSaved={replaceRecord}
                />
                <QuotationEditor
                  key={`quote-${record.reference}-${record.updatedAt}`}
                  record={record}
                  token={token}
                  onSaved={replaceRecord}
                />
                <BuyerOrderRequestSummary record={record} />
                <OrderPreparationPacketCenter
                  key={`packet-${record.reference}-${record.updatedAt}`}
                  record={record}
                  token={token}
                  onSaved={replaceRecord}
                />
                <OrderConfirmationDraftCenter
                  key={`order-confirmation-${record.reference}-${record.updatedAt}`}
                  record={record}
                  token={token}
                  onSaved={replaceRecord}
                />
                <OrderHandoffEditor
                  key={`order-${record.reference}-${record.updatedAt}`}
                  record={record}
                  token={token}
                  onSaved={replaceRecord}
                />
                <OrderChangeAdminSummary record={record} />
                <FulfillmentCaseManager
                  key={`fulfillment-${record.reference}-${record.updatedAt}`}
                  record={record}
                  token={token}
                  onSaved={replaceRecord}
                />
                <RepeatOrderManager
                  key={`repeat-${record.reference}-${record.updatedAt}`}
                  record={record}
                  token={token}
                  onSaved={replaceRecord}
                />
              </article>
            );
          })}
          {!visibleRecords.length && (
            <p className="admin-empty">No records to display.</p>
          )}
        </div>
      </section>
    </main>
  );
}
