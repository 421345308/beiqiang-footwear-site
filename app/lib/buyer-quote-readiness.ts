import {
  assessInquiryReadiness,
  type InquiryReadiness,
  type InquiryReadinessInput,
} from "./inquiry-readiness.ts";

export type BuyerQuoteReadiness = InquiryReadiness & {
  locale: "en" | "zh";
};

const chineseMissing: Record<string, string> = {
  "Obtain a working email address or WhatsApp number.": "填写可用的邮箱或WhatsApp号码。",
  "Confirm the buyer's company or trading name.": "填写采购公司或贸易主体名称。",
  "Confirm whether the buyer is an importer, seller, brand or sourcing agent.": "确认买家类型：进口商、卖家、品牌或采购代理。",
  "Confirm the target country or market.": "填写目标国家或市场。",
  "Identify at least one style code or product direction.": "至少选择一个产品款号或产品方向。",
  "Add per-style quantity plus color or size requirements.": "至少为一款填写数量，并补充颜色或尺码要求。",
  "Confirm an estimated trial or bulk quantity.": "填写预计试单或大货数量。",
  "Confirm whether samples are needed, including pairs and sizes.": "说明是否需要样品；需要时填写双数和尺码。",
  "Discuss the preferred quotation starting point: EXW, FOB, FCA or DDP review.": "选择报价起点：EXW、FOB、FCA或申请DDP审核。",
  "Confirm the delivery country, port, postcode or FBA destination.": "填写交付国家、港口、邮编或FBA目的地。",
  "Confirm the requested arrival window or project timing.": "填写期望到货窗口或项目时间。",
  "Record channel, packing, branding or other order requirements.": "补充销售渠道、包装、品牌或其他订单要求。",
  "Confirm the intended logo, insole or label placement.": "说明期望的Logo、鞋垫或标签位置。",
  "Confirm whether usable logo artwork is available.": "说明是否已有可用Logo图稿。",
};

export function assessBuyerQuoteReadiness(
  input: InquiryReadinessInput,
  locale: "en" | "zh" = "en",
): BuyerQuoteReadiness {
  const result = assessInquiryReadiness(input);
  if (locale === "en") return { ...result, locale };
  const labels = {
    ready: "可进入首轮商业审核",
    qualify: "仍需补充关键资料",
    early: "采购简报尚不完整",
  } as const;
  const summaries = {
    ready: "已有足够背景用于针对性回复；正式报价前仍需逐项核实。",
    qualify: "已有明确采购意向，但缺失信息仍可能导致泛化回复或报价返工。",
    early: "请先补充买家、产品或数量等基础背景，再提交工厂审核。",
  } as const;
  return {
    ...result,
    locale,
    label: labels[result.level],
    summary: summaries[result.level],
    missing: result.missing.map((item) => chineseMissing[item] || item),
  };
}
