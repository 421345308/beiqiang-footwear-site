"use client";

export type AdaptationBrief = {
  intent: string;
  artworkStatus: string;
  brandingPlacement: string;
  colorDirection: string;
  packingLabeling: string;
};

export const EMPTY_ADAPTATION_BRIEF: AdaptationBrief = {
  intent: "not_sure",
  artworkStatus: "not_applicable",
  brandingPlacement: "",
  colorDirection: "",
  packingLabeling: "",
};

export default function AdaptationBriefFields({ value, onChange, locale = "en" }: { value: AdaptationBrief; onChange: (value: AdaptationBrief) => void; locale?: "en" | "zh" }) {
  const zh = locale === "zh";
  const update = (key: keyof AdaptationBrief, next: string) => onChange({ ...value, [key]: next });
  return <fieldset className="form-grid adaptation-brief-fields">
    <legend>{zh ? "5. 现有款调整简报" : "5. Existing-style adaptation brief"}</legend>
    <label>{zh ? "主要采购方向" : "Primary sourcing intent"}<select value={value.intent} onChange={(event) => update("intent", event.target.value)}><option value="not_sure">{zh ? "不确定，请先审核" : "Not sure — review first"}</option><option value="existing_style_wholesale">{zh ? "按现有款批发采购" : "Wholesale the existing style"}</option><option value="color_review">{zh ? "颜色 / 材料方向审核" : "Color / material review"}</option><option value="private_label">{zh ? "私标 / 品牌标识审核" : "Private-label / branding review"}</option><option value="packing_labeling">{zh ? "包装 / 标签审核" : "Packing / labeling review"}</option><option value="combined_review">{zh ? "品牌、颜色与包装综合审核" : "Combined branding, color and packing review"}</option></select></label>
    <label>{zh ? "Logo / 图稿准备状态" : "Logo / artwork readiness"}<select value={value.artworkStatus} onChange={(event) => update("artworkStatus", event.target.value)}><option value="not_applicable">{zh ? "本项目暂不需要" : "Not needed for this project"}</option><option value="not_ready">{zh ? "只有想法，尚无图稿" : "Idea only — no artwork yet"}</option><option value="reference_only">{zh ? "有参考图或位图" : "Reference image / raster file"}</option><option value="vector_ready">{zh ? "已有矢量图稿" : "Vector artwork ready"}</option></select></label>
    <label className="form-full">{zh ? "期望Logo、鞋垫或标签位置" : "Requested logo, insole or label placement"}<input value={value.brandingPlacement} onChange={(event) => update("brandingPlacement", event.target.value)} maxLength={300} placeholder={zh ? "例如：鞋面外侧、后跟、鞋垫、鞋舌；由工厂审核可行性" : "Example: outer upper, heel, insole or tongue; subject to feasibility review"} /></label>
    <label className="form-full">{zh ? "颜色 / 材料目标" : "Color / material direction"}<textarea value={value.colorDirection} onChange={(event) => update("colorDirection", event.target.value)} maxLength={600} rows={2} placeholder={zh ? "写明颜色参考、目标市场及必须保留或调整的部分" : "State color references, target market and what should stay fixed or change"} /></label>
    <label className="form-full">{zh ? "包装 / 标签目标" : "Packing / labeling direction"}<textarea value={value.packingLabeling} onChange={(event) => update("packingLabeling", event.target.value)} maxLength={600} rows={2} placeholder={zh ? "鞋盒、吊牌、条码、尺码标、外箱唛头等买家目标" : "Buyer target for box, hangtag, barcode, size label or carton marks"} /></label>
    <p className="technical-gate-note form-full">{zh ? "以上均为买家目标，不是已确认的生产规格。Logo方法、位置、颜色、材料、包装、MOQ、费用和交期需按款式、数量、图稿及样品审核后书面确认。" : "These are buyer targets, not confirmed production specifications. Logo method, placement, colors, materials, packing, MOQ, cost and timing require style-, quantity-, artwork- and sample-specific written review."}</p>
  </fieldset>;
}
