"use client";

import { useState } from "react";

export type OrderConfirmationChecklist = {
  productSpecification: string;
  sampleDecision: string;
  quantitySizeRatio: string;
  colorsMaterials: string;
  packingLabeling: string;
  priceTradeTerm: string;
  paymentTerms: string;
  deliveryWindow: string;
};
export type BuyerOrderConfirmationDraftRecord = {
  id: string;
  version: number;
  orderRequestId: string;
  packetId: string;
  packetVersion: number;
  quoteNumber: string;
  orderChannel: string;
  orderChecklist: OrderConfirmationChecklist;
  draftNote: string;
  status: string;
  issuedAt: string;
  buyerDecision: string;
  buyerNote: string;
  buyerRevisionFields: string[];
  buyerRespondedAt: string;
};

const fields: [keyof OrderConfirmationChecklist, string, string][] = [
  ["productSpecification", "Product specification", "产品规格"],
  ["sampleDecision", "Sample decision", "样品决定"],
  ["quantitySizeRatio", "Quantity / size ratio", "数量／尺码配比"],
  ["colorsMaterials", "Colors / materials", "颜色／材料"],
  ["packingLabeling", "Packing / labeling", "包装／标签"],
  ["priceTradeTerm", "Price / trade term", "价格／贸易术语"],
  ["paymentTerms", "Payment terms", "付款条款"],
  ["deliveryWindow", "Delivery window", "交付窗口"],
];
const stateLabels: Record<string, [string, string]> = {
  awaiting_buyer: ["Awaiting your decision", "等待买家决定"],
  buyer_accepted: ["Buyer accepted", "买家已接受"],
  buyer_revision_requested: ["Revision requested", "买家要求修订"],
};

export default function BuyerOrderConfirmationDraft({
  reference,
  accessCode,
  drafts,
  zh = false,
  onSaved,
  onStatus,
}: {
  reference: string;
  accessCode: string;
  drafts: BuyerOrderConfirmationDraftRecord[];
  zh?: boolean;
  onSaved: () => Promise<void>;
  onStatus: (message: string) => void;
}) {
  const latest = drafts.at(-1);
  const [mode, setMode] = useState<"accept" | "request_revision" | null>(null);
  const [note, setNote] = useState("");
  const [revisionFields, setRevisionFields] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  if (!latest) return null;

  function toggle(value: string) {
    setRevisionFields((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }
  async function respond() {
    if (!mode || !confirmed) {
      onStatus(zh ? "请选择决定并确认该操作的边界。" : "Choose a decision and confirm the boundary first.");
      return;
    }
    if (mode === "request_revision" && (!revisionFields.length || note.trim().length < 5)) {
      onStatus(zh ? "请选择至少一个需修订项目，并写明具体差异。" : "Select at least one affected item and describe the mismatch.");
      return;
    }
    setSaving(true);
    onStatus(zh ? "正在安全保存决定……" : "Securely saving your decision…");
    try {
      const response = await fetch("/api/order-confirmation-draft", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, accessCode, draftId: latest.id, action: mode, buyerNote: note, buyerRevisionFields: revisionFields, buyerConfirmation: confirmed }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || (zh ? "决定未能保存。" : "The decision could not be saved."));
      onStatus(result.message);
      await onSaved();
    } catch (error) {
      onStatus(error instanceof Error ? error.message : zh ? "决定未能保存。" : "The decision could not be saved.");
    } finally { setSaving(false); }
  }

  return (
    <section className="buyer-order-confirmation" id="pre-order-confirmation">
      <div className="buyer-order-confirmation-heading">
        <div>
          <p className="eyebrow">{zh ? "下单前书面核对" : "PRE-ORDER WRITTEN REVIEW"}</p>
          <h3>{zh ? `逐项核对订单确认草案 V${latest.version}` : `Review pre-order confirmation draft V${latest.version}`}</h3>
          <p>{zh ? "把网页草案与报价、样品决定、PO以及计划中的Trade Assurance订单或合同逐项对照。" : "Compare this website draft with the quotation, sample decision, PO and planned Trade Assurance order or contract."}</p>
        </div>
        <span>{stateLabels[latest.status]?.[zh ? 1 : 0] || latest.status}</span>
      </div>
      <div className="buyer-order-confirmation-meta">
        <p><strong>{zh ? "关联报价" : "Related quotation"}</strong>{latest.quoteNumber}</p>
        <p><strong>{zh ? "资料包" : "Preparation packet"}</strong>V{latest.packetVersion}</p>
        <p><strong>{zh ? "计划正式渠道" : "Planned formal channel"}</strong>{latest.orderChannel === "alibaba_trade_assurance" ? "Alibaba Trade Assurance" : zh ? "双方合同" : "Bilateral contract"}</p>
        <p><strong>{zh ? "签发时间" : "Issued"}</strong>{new Date(latest.issuedAt).toLocaleString(zh ? "zh-CN" : "en-US")}</p>
      </div>
      <div className="buyer-order-confirmation-grid">
        {fields.map(([key, en, cn]) => <article key={key}><strong>{zh ? cn : en}</strong><p>{latest.orderChecklist[key]}</p></article>)}
      </div>
      <p className="buyer-order-confirmation-note"><strong>{zh ? "贝强说明：" : "Beiqiang note: "}</strong>{latest.draftNote}</p>
      {latest.status === "awaiting_buyer" ? (
        <div className="buyer-order-confirmation-decision">
          <div className="buyer-order-confirmation-actions">
            <button className="button" type="button" onClick={() => setMode("accept")}>{zh ? "接受这份核对草案" : "Accept this review draft"}</button>
            <button className="button button-secondary" type="button" onClick={() => setMode("request_revision")}>{zh ? "指出差异并要求修订" : "Request a precise revision"}</button>
          </div>
          {mode === "request_revision" ? <fieldset><legend>{zh ? "哪些项目不一致？" : "Which items do not match?"}</legend>{fields.map(([key, en, cn]) => <label key={key}><input type="checkbox" checked={revisionFields.includes(key)} onChange={() => toggle(key)} />{zh ? cn : en}</label>)}</fieldset> : null}
          {mode ? <><label>{mode === "accept" ? (zh ? "确认备注（可选）" : "Acceptance note (optional)") : (zh ? "具体差异与正确目标" : "Exact mismatch and correct target")}<textarea rows={3} maxLength={1200} value={note} onChange={(event) => setNote(event.target.value)} /></label><label className="buyer-order-confirmation-consent"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>{zh ? "我已逐项核对。接受只记录网页确认；正式订单、付款与生产仍以Alibaba Trade Assurance订单或双方签署合同为准。" : "I reviewed each item. Acceptance records a website confirmation only; the formal order, payment and production remain governed by the Alibaba Trade Assurance order or signed bilateral contract."}</span></label><button className="button" type="button" disabled={saving} onClick={respond}>{saving ? (zh ? "保存中……" : "Saving…") : mode === "accept" ? (zh ? "确认接受" : "Confirm acceptance") : (zh ? "提交修订要求" : "Submit revision request")}</button></> : null}
        </div>
      ) : <article className={`buyer-order-confirmation-result result-${latest.status}`}><strong>{stateLabels[latest.status]?.[zh ? 1 : 0] || latest.status}</strong>{latest.buyerNote ? <p>{latest.buyerNote}</p> : null}<small>{zh ? "所有版本永久保留；如需修改，贝强必须另行签发新版本。" : "Every version is preserved; any change requires Beiqiang to issue a new version."}</small></article>}
      {drafts.length > 1 ? <details><summary>{zh ? `查看${drafts.length}个草案版本` : `View ${drafts.length} draft versions`}</summary>{[...drafts].reverse().map((draft) => <p key={draft.id}><strong>V{draft.version} · {stateLabels[draft.status]?.[zh ? 1 : 0] || draft.status}</strong><span>{new Date(draft.issuedAt).toLocaleString(zh ? "zh-CN" : "en-US")}</span></p>)}</details> : null}
      <small>{zh ? "该核对草案帮助减少错单，但不是PI、发票、收款链接、正式订单或生产授权。" : "This review draft helps prevent order mismatches, but it is not a PI, invoice, payment link, formal order or production authorization."}</small>
    </section>
  );
}
