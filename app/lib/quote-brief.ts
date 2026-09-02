import type { AdaptationBrief } from "../components/AdaptationBriefFields";
import type { ContactPreferences } from "../components/ContactPreferenceFields";
import type { QuoteLine } from "./quote-list";

export type QuoteBriefInput = {
  lines: QuoteLine[];
  name: string;
  company: string;
  buyerType: string;
  market: string;
  channel: string;
  email: string;
  whatsapp: string;
  contactPreferences: ContactPreferences;
  projectPath: string;
  sampleQuantity: string;
  bulkQuantity: string;
  buyerTargetCost: string;
  preferredTradeTerm: string;
  deliveryDestination: string;
  deliveryTiming: string;
  existingSole: string;
  changesRequired: string;
  targetValues: string;
  ndaRequired: string;
  requirements: string;
  adaptationBrief: AdaptationBrief;
};

function clean(value: string, fallback: string) {
  const normalized = value.replace(/[\u0000-\u001F\u007F]/g, " ").trim();
  return normalized || fallback;
}

export function buildQuoteBriefText(input: QuoteBriefInput, locale: "en" | "zh") {
  const zh = locale === "zh";
  const unset = zh ? "待填写" : "To be provided";
  const labels = zh
    ? {
        title: "贝强鞋业｜买家采购简报草稿",
        buyer: "买家",
        contact: "联系方式",
        market: "目标市场／渠道",
        path: "项目路径",
        quantity: "样品／大货数量",
        targetCost: "买家目标成本／价格方向（仅为买家目标，不是贝强报价）",
        trade: "贸易条款／目的地",
        timing: "期望时间",
        styles: "候选款",
        technical: "技术开发目标",
        adaptation: "现有款调整目标",
        other: "其他要求",
        boundary: "此文件是买家尚未提交的采购简报，不是贝强报价、库存确认、样品批准、生产订单、付款请求或制造可行性确认。",
      }
    : {
        title: "Beiqiang Footwear | Buyer sourcing brief draft",
        buyer: "Buyer",
        contact: "Contact",
        market: "Target market / channel",
        path: "Project path",
        quantity: "Sample / bulk quantity",
        targetCost: "Buyer target cost / price direction (buyer target only; not a Beiqiang quotation)",
        trade: "Trade term / destination",
        timing: "Requested timing",
        styles: "Shortlisted styles",
        technical: "Technical-development targets",
        adaptation: "Existing-style adaptation targets",
        other: "Other requirements",
        boundary: "This is an unsubmitted buyer sourcing brief—not a Beiqiang quotation, stock confirmation, sample approval, production order, payment request or manufacturing-feasibility confirmation.",
      };
  const lines = input.lines.length
    ? input.lines.map((line) => {
        const details = [
          `${zh ? "数量" : "qty"}: ${clean(line.quantity, unset)}`,
          `${zh ? "颜色" : "colors"}: ${clean(line.colors, unset)}`,
          `${zh ? "尺码／配比" : "sizes / ratio"}: ${clean(line.sizes, unset)}`,
          `${zh ? "备注" : "note"}: ${clean(line.notes, unset)}`,
        ];
        return `- ${line.code} / ${line.sourceModel} / ${line.name}\n  ${details.join(" | ")}`;
      })
    : [`- ${unset}`];
  const isTechnical = input.projectPath === "technical_development";
  const projectDetails = isTechnical
    ? [
        `${zh ? "现有鞋底" : "Existing sole"}: ${clean(input.existingSole, unset)}`,
        `NDA / tech pack: ${clean(input.ndaRequired, unset)}`,
        `${zh ? "改动要求" : "Requested changes"}: ${clean(input.changesRequired, unset)}`,
        `${zh ? "目标值／测试" : "Targets / tests"}: ${clean(input.targetValues, unset)}`,
      ]
    : [
        `${zh ? "调整方向" : "Adaptation intent"}: ${clean(input.adaptationBrief.intent, unset)}`,
        `${zh ? "图稿状态" : "Artwork status"}: ${clean(input.adaptationBrief.artworkStatus, unset)}`,
        `${zh ? "品牌位置" : "Branding placement"}: ${clean(input.adaptationBrief.brandingPlacement, unset)}`,
        `${zh ? "颜色方向" : "Color direction"}: ${clean(input.adaptationBrief.colorDirection, unset)}`,
        `${zh ? "包装标签" : "Packing / labeling"}: ${clean(input.adaptationBrief.packingLabeling, unset)}`,
      ];
  const preferredContact = [
    input.contactPreferences.preferredContactMethod,
    input.contactPreferences.preferredResponseLanguage,
    input.contactPreferences.buyerTimezone,
    input.contactPreferences.preferredContactWindow,
  ].filter(Boolean).join(" / ");

  return [
    labels.title,
    "",
    `${labels.buyer}: ${clean(input.company, unset)} / ${clean(input.name, unset)} / ${clean(input.buyerType, unset)}`,
    `${labels.contact}: ${clean(input.email, unset)} / WhatsApp ${clean(input.whatsapp, unset)}${preferredContact ? ` / ${preferredContact}` : ""}`,
    `${labels.market}: ${clean(input.market, unset)} / ${clean(input.channel, unset)}`,
    `${labels.path}: ${isTechnical ? (zh ? "技术产品开发" : "Technical product development") : (zh ? "现有款调整" : "Existing-style adaptation")}`,
    `${labels.quantity}: ${clean(input.sampleQuantity, unset)} / ${clean(input.bulkQuantity, unset)}`,
    `${labels.targetCost}: ${clean(input.buyerTargetCost, unset)}`,
    `${labels.trade}: ${clean(input.preferredTradeTerm, unset)} / ${clean(input.deliveryDestination, unset)}`,
    `${labels.timing}: ${clean(input.deliveryTiming, unset)}`,
    "",
    `${labels.styles}:`,
    ...lines,
    "",
    `${isTechnical ? labels.technical : labels.adaptation}:`,
    ...projectDetails.map((detail) => `- ${detail}`),
    "",
    `${labels.other}: ${clean(input.requirements, unset)}`,
    "",
    labels.boundary,
  ].join("\n");
}
