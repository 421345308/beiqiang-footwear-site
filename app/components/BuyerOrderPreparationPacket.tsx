"use client";

import { useMemo, useState } from "react";

export type BuyerOrderPreparationPacketRecord = {
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
  reviewedAt: string;
  reviewNote: string;
};
type Attachment = {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
};

const documentOptions = [
  ["commercial_invoice", "Commercial invoice", "商业发票"],
  ["packing_list", "Packing list", "装箱单"],
  [
    "certificate_of_origin_review",
    "Certificate of origin review",
    "原产地证需求审核",
  ],
  ["other", "Other document", "其他文件"],
];
const labels: Record<string, [string, string]> = {
  buyer: ["Buyer / purchasing company", "买方／采购公司"],
  buyer_nominated: ["Buyer-nominated importer", "买家指定进口方"],
  to_confirm: ["To be confirmed", "待确认"],
  sea: ["Sea freight", "海运"],
  air: ["Air freight", "空运"],
  express: ["Express / courier", "快递"],
  reviewed: ["Reviewed", "已审核"],
  submitted: ["Awaiting Beiqiang review", "等待贝强审核"],
  needs_revision: ["Revision requested", "需要修改"],
};

export default function BuyerOrderPreparationPacket({
  reference,
  accessCode,
  orderRequest,
  packets,
  attachments,
  locale = "en",
  onSaved,
  onStatus,
}: {
  reference: string;
  accessCode: string;
  orderRequest: {
    id: string;
    legalCompanyName: string;
    purchaseOrderReference: string;
  } | null;
  packets: BuyerOrderPreparationPacketRecord[];
  attachments: Attachment[];
  locale?: "en" | "zh";
  onSaved: () => void | Promise<void>;
  onStatus: (message: string) => void;
}) {
  const zh = locale === "zh";
  const latest = packets.at(-1);
  const canSubmit = Boolean(
    orderRequest && (!latest || latest.status === "needs_revision"),
  );
  const defaults = useMemo(() => latest || null, [latest]);
  const [billingCompany, setBillingCompany] = useState(
    defaults?.billingCompany || orderRequest?.legalCompanyName || "",
  );
  const [registeredCountry, setRegisteredCountry] = useState(
    defaults?.registeredCountry || "",
  );
  const [billingAddress, setBillingAddress] = useState(
    defaults?.billingAddress || "",
  );
  const [invoiceEmail, setInvoiceEmail] = useState(
    defaults?.invoiceEmail || "",
  );
  const [shippingConsignee, setShippingConsignee] = useState(
    defaults?.shippingConsignee || "",
  );
  const [shippingCountry, setShippingCountry] = useState(
    defaults?.shippingCountry || "",
  );
  const [shippingAddress, setShippingAddress] = useState(
    defaults?.shippingAddress || "",
  );
  const [shippingContact, setShippingContact] = useState(
    defaults?.shippingContact || "",
  );
  const [importerRole, setImporterRole] = useState(
    defaults?.importerRole || "to_confirm",
  );
  const [shippingMode, setShippingMode] = useState(
    defaults?.shippingMode || "to_confirm",
  );
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>(
    defaults?.requiredDocuments || ["commercial_invoice", "packing_list"],
  );
  const [purchaseOrderReference, setPurchaseOrderReference] = useState(
    defaults?.purchaseOrderReference ||
      orderRequest?.purchaseOrderReference ||
      "",
  );
  const [attachmentIds, setAttachmentIds] = useState<string[]>(
    defaults?.attachmentIds || [],
  );
  const [notes, setNotes] = useState(defaults?.notes || "");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  if (!orderRequest) return null;
  function toggle(
    list: string[],
    value: string,
    setter: (items: string[]) => void,
  ) {
    setter(
      list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value],
    );
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!confirmed) {
      onStatus(
        zh
          ? "请先确认资料包的边界。"
          : "Confirm the order-packet boundary first.",
      );
      return;
    }
    setSaving(true);
    onStatus(
      zh
        ? "正在安全保存订单准备资料……"
        : "Securely saving the order-preparation packet…",
    );
    try {
      const response = await fetch("/api/order-preparation-packet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          accessCode,
          orderRequestId: orderRequest.id,
          billingCompany,
          registeredCountry,
          billingAddress,
          invoiceEmail,
          shippingConsignee,
          shippingCountry,
          shippingAddress,
          shippingContact,
          importerRole,
          shippingMode,
          requiredDocuments,
          purchaseOrderReference,
          attachmentIds,
          notes,
          buyerConfirmation: confirmed,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(
          result.message ||
            (zh ? "资料包未能保存。" : "The packet could not be saved."),
        );
      onStatus(
        zh
          ? "订单准备资料已提交人工审核。"
          : "The order-preparation packet was submitted for human review.",
      );
      await onSaved();
    } catch (error) {
      onStatus(
        error instanceof Error
          ? error.message
          : zh
            ? "资料包未能保存。"
            : "The packet could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="buyer-order-packet" id="order-preparation-packet">
      <div className="buyer-order-packet-heading">
        <div>
          <p className="eyebrow">
            {zh ? "受保护订单准备资料" : "PROTECTED ORDER PREPARATION"}
          </p>
          <h3>
            {zh
              ? "把公司、收货和PO文件放进同一条审核链"
              : "Connect company, shipping and PO files in one review chain"}
          </h3>
          <p>
            {zh
              ? "地址仅显示在本项目私密页面和管理员后台；通知邮件不包含完整街道地址。"
              : "Addresses appear only on this private project page and in the protected admin record; notification emails omit full street addresses."}
          </p>
        </div>
        {latest && (
          <span>{`V${latest.version} · ${labels[latest.status]?.[zh ? 1 : 0] || latest.status}`}</span>
        )}
      </div>
      {latest && (
        <article
          className={`buyer-order-packet-latest packet-${latest.status}`}
        >
          <strong>
            {zh
              ? `最近版本 V${latest.version}`
              : `Latest version V${latest.version}`}
          </strong>
          <p>
            {latest.billingCompany} · {latest.shippingCountry} ·{" "}
            {labels[latest.shippingMode]?.[zh ? 1 : 0] || latest.shippingMode}
          </p>
          {latest.reviewNote && (
            <p>
              <b>{zh ? "贝强审核说明：" : "Beiqiang review note: "}</b>
              {latest.reviewNote}
            </p>
          )}
          <small>
            {zh
              ? "已审核只表示资料足以继续准备正式文件，不代表订单、发票、付款或生产已经成立。"
              : "Reviewed means the data can support formal-document preparation; it does not create an order, invoice, payment or production authorization."}
          </small>
        </article>
      )}
      {canSubmit ? (
        <form onSubmit={submit}>
          <label>
            {zh ? "账单公司法定名称" : "Legal billing company"}
            <input
              required
              minLength={2}
              maxLength={180}
              value={billingCompany}
              onChange={(e) => setBillingCompany(e.target.value)}
            />
          </label>
          <label>
            {zh ? "公司注册国家／地区" : "Registered country / region"}
            <input
              required
              minLength={2}
              maxLength={120}
              value={registeredCountry}
              onChange={(e) => setRegisteredCountry(e.target.value)}
            />
          </label>
          <label className="packet-wide">
            {zh ? "账单地址" : "Billing address"}
            <textarea
              required
              minLength={5}
              maxLength={600}
              rows={3}
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
            />
          </label>
          <label>
            {zh ? "接收发票邮箱" : "Invoice email"}
            <input
              required
              type="email"
              maxLength={180}
              value={invoiceEmail}
              onChange={(e) => setInvoiceEmail(e.target.value)}
            />
          </label>
          <label>
            {zh ? "收货人／公司" : "Shipping consignee / company"}
            <input
              required
              minLength={2}
              maxLength={180}
              value={shippingConsignee}
              onChange={(e) => setShippingConsignee(e.target.value)}
            />
          </label>
          <label>
            {zh ? "收货国家／地区" : "Shipping country / region"}
            <input
              required
              minLength={2}
              maxLength={120}
              value={shippingCountry}
              onChange={(e) => setShippingCountry(e.target.value)}
            />
          </label>
          <label>
            {zh ? "收货联系人" : "Shipping contact"}
            <input
              required
              minLength={2}
              maxLength={180}
              value={shippingContact}
              onChange={(e) => setShippingContact(e.target.value)}
            />
          </label>
          <label className="packet-wide">
            {zh ? "完整收货地址" : "Full shipping address"}
            <textarea
              required
              minLength={5}
              maxLength={600}
              rows={3}
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
            />
          </label>
          <label>
            {zh ? "进口责任方向" : "Importer role"}
            <select
              value={importerRole}
              onChange={(e) => setImporterRole(e.target.value)}
            >
              {["buyer", "buyer_nominated", "to_confirm"].map((value) => (
                <option key={value} value={value}>
                  {labels[value][zh ? 1 : 0]}
                </option>
              ))}
            </select>
          </label>
          <label>
            {zh ? "计划运输方式" : "Planned shipping mode"}
            <select
              value={shippingMode}
              onChange={(e) => setShippingMode(e.target.value)}
            >
              {["sea", "air", "express", "to_confirm"].map((value) => (
                <option key={value} value={value}>
                  {labels[value][zh ? 1 : 0]}
                </option>
              ))}
            </select>
          </label>
          <label>
            {zh ? "买家PO编号（如有）" : "Buyer PO reference (if any)"}
            <input
              maxLength={120}
              value={purchaseOrderReference}
              onChange={(e) => setPurchaseOrderReference(e.target.value)}
            />
          </label>
          <fieldset className="packet-wide">
            <legend>
              {zh ? "需要审核的商业文件" : "Commercial documents to review"}
            </legend>
            {documentOptions.map(([value, en, cn]) => (
              <label key={value}>
                <input
                  type="checkbox"
                  checked={requiredDocuments.includes(value)}
                  onChange={() =>
                    toggle(requiredDocuments, value, setRequiredDocuments)
                  }
                />
                {zh ? cn : en}
              </label>
            ))}
          </fieldset>
          <fieldset className="packet-wide">
            <legend>
              {zh
                ? "关联本项目已经上传的文件"
                : "Link files already uploaded to this project"}
            </legend>
            {attachments.length ? (
              attachments.map((file) => (
                <label key={file.id}>
                  <input
                    type="checkbox"
                    checked={attachmentIds.includes(file.id)}
                    onChange={() =>
                      toggle(attachmentIds, file.id, setAttachmentIds)
                    }
                  />
                  {file.name} · {Math.ceil(file.size / 1024)} KB
                </label>
              ))
            ) : (
              <p>
                {zh
                  ? "还没有可关联文件。可先在页面的“添加买家文件”区域上传，再回来选择。"
                  : "No files are available yet. Upload them in “Add buyer files”, then return here to select them."}
              </p>
            )}
          </fieldset>
          <label className="packet-wide">
            {zh ? "其他订单准备说明" : "Other order-preparation notes"}
            <textarea
              rows={4}
              maxLength={1200}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <label className="packet-confirm packet-wide">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span>
              {zh
                ? "我确认这些是买方提交、等待贝强核对的订单准备资料；提交不会建立订单、发票、付款要求或生产授权。"
                : "I confirm these are buyer-supplied preparation details awaiting Beiqiang review; submission does not create an order, invoice, payment request or production authorization."}
            </span>
          </label>
          <div className="packet-wide">
            <button className="button" type="submit" disabled={saving}>
              {saving
                ? zh
                  ? "安全保存中……"
                  : "Saving securely…"
                : latest
                  ? zh
                    ? `提交V${latest.version + 1}修订版`
                    : `Submit revision V${latest.version + 1}`
                  : zh
                    ? "提交资料包供人工审核"
                    : "Submit packet for human review"}
            </button>
          </div>
        </form>
      ) : null}
      {packets.length > 1 && (
        <details>
          <summary>
            {zh
              ? `查看${packets.length}个历史版本`
              : `View ${packets.length} packet versions`}
          </summary>
          {[...packets].reverse().map((packet) => (
            <p key={packet.id}>
              <strong>
                V{packet.version} ·{" "}
                {labels[packet.status]?.[zh ? 1 : 0] || packet.status}
              </strong>
              <span>
                {new Date(packet.submittedAt).toLocaleString(
                  zh ? "zh-CN" : "en-US",
                )}
              </span>
            </p>
          ))}
        </details>
      )}
      <small>
        {zh
          ? "本区不会取代Trade Assurance订单或双方签署合同；最终八项书面订单内容仍须在正式交易渠道逐项确认。"
          : "This area does not replace a Trade Assurance order or signed bilateral contract. The eight final written order items still require confirmation in the formal transaction channel."}
      </small>
    </section>
  );
}
