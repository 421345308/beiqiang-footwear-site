"use client";

import { useMemo, useState } from "react";

export type BuyerSampleRequestRecord = {
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
  reviewNote: string;
  sampleReference: string;
};

export default function BuyerSampleRequest({
  reference,
  accessCode,
  availableCodes,
  requests,
  activeSample,
  locale = "en",
  onSaved,
  onStatus,
}: {
  reference: string;
  accessCode: string;
  availableCodes: string[];
  requests: BuyerSampleRequestRecord[];
  activeSample: boolean;
  locale?: "en" | "zh";
  onSaved: () => Promise<void>;
  onStatus: (message: string) => void;
}) {
  const zh = locale === "zh";
  const codes = useMemo(
    () =>
      [
        ...new Set(availableCodes.filter((code) => /^BQ\d{3}$/.test(code))),
      ].slice(0, 12),
    [availableCodes],
  );
  const pending = requests.some((item) => item.status === "pending");
  const [styleCodes, setStyleCodes] = useState<string[]>(
    codes.slice(0, Math.min(1, codes.length)),
  );
  const [sampleType, setSampleType] = useState("existing_style");
  const [quantity, setQuantity] = useState("");
  const [sizes, setSizes] = useState("");
  const [colors, setColors] = useState("");
  const [evaluationPurpose, setEvaluationPurpose] = useState("");
  const [customizationTarget, setCustomizationTarget] = useState("");
  const [acceptanceFocus, setAcceptanceFocus] = useState("");
  const [targetBulkQuantity, setTargetBulkQuantity] = useState("");
  const [shippingCountry, setShippingCountry] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [courierAccountAvailable, setCourierAccountAvailable] = useState(false);
  const [requestedTiming, setRequestedTiming] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  function toggle(code: string) {
    setStyleCodes((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : current.length < 6
          ? [...current, code]
          : current,
    );
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    onStatus(
      zh ? "正在保存样品审核申请……" : "Saving your sample review request…",
    );
    try {
      const response = await fetch("/api/sample-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          accessCode,
          styleCodes,
          sampleType,
          quantity,
          sizes,
          colors,
          evaluationPurpose,
          customizationTarget,
          acceptanceFocus,
          targetBulkQuantity,
          shippingCountry,
          shippingCity,
          courierAccountAvailable,
          requestedTiming,
          buyerConfirmation: confirmed,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(
          result.message ||
            (zh
              ? "样品申请未能保存。"
              : "The sample request could not be saved."),
        );
      onStatus(
        zh
          ? "申请已保存，贝强将先审核可行性、样品费、运费和准备时间。"
          : result.message,
      );
      await onSaved();
    } catch (error) {
      onStatus(
        error instanceof Error
          ? error.message
          : zh
            ? "样品申请未能保存。"
            : "The sample request could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }
  if (!codes.length && !requests.length) return null;
  return (
    <section className="buyer-sample-request" id="sample-request">
      <div>
        <p className="eyebrow">
          {zh ? "样品采购步骤" : "SAMPLE PROCUREMENT STEP"}
        </p>
        <h3>
          {zh ? "提交可审核的样品申请" : "Request a sample feasibility review"}
        </h3>
        <p>
          {zh
            ? "把款号、数量、尺码、颜色、审核目的和寄送国家一次说清楚，贝强再确认能否安排及对应条款。"
            : "Define the style, quantity, sizes, colors, evaluation purpose and destination once, then Beiqiang can review feasibility and written terms."}
        </p>
      </div>
      {requests.length ? (
        <div className="buyer-sample-request-history">
          {[...requests].reverse().map((item) => (
            <article key={item.id}>
              <div>
                <strong>
                  {item.id} · {item.styleCodes.join(", ")}
                </strong>
                <span>
                  {item.quantity} · {item.sizes} · {item.colors}
                </span>
              </div>
              <b>
                {zh
                  ? (
                      {
                        pending: "待审核",
                        converted: "已转入样品项目",
                        rejected: "未接受",
                      } as const
                    )[item.status]
                  : item.status.replaceAll("_", " ")}
              </b>
              <small>
                {zh ? "提交" : "Submitted"}{" "}
                {new Date(item.submittedAt).toLocaleString(
                  zh ? "zh-CN" : "en-US",
                )}
                {item.sampleReference
                  ? ` · ${zh ? "样品编号" : "sample"} ${item.sampleReference}`
                  : ""}
              </small>
              {item.status === "rejected" && item.reviewNote ? (
                <p>{item.reviewNote}</p>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
      {!activeSample && !pending ? (
        <form onSubmit={submit}>
          <fieldset>
            <legend>
              {zh
                ? "本次申请款号（最多6款）"
                : "Styles for this request (up to 6)"}
            </legend>
            {codes.map((code) => (
              <label key={code}>
                <input
                  type="checkbox"
                  checked={styleCodes.includes(code)}
                  onChange={() => toggle(code)}
                />
                {code}
              </label>
            ))}
          </fieldset>
          <div>
            <label>
              {zh ? "样品类型" : "Sample type"}
              <select
                value={sampleType}
                onChange={(event) => setSampleType(event.target.value)}
              >
                <option value="existing_style">
                  {zh ? "现有款实物样品" : "Existing-style physical sample"}
                </option>
                <option value="branding_adaptation">
                  {zh
                    ? "品牌 / 私标调整样品"
                    : "Branding / private-label adaptation"}
                </option>
                <option value="technical_development">
                  {zh ? "技术开发样品" : "Technical-development sample"}
                </option>
              </select>
            </label>
            <label>
              {zh ? "样品数量" : "Sample quantity"}
              <input
                required
                minLength={2}
                maxLength={120}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder={
                  zh ? "例如：2双，每款1双" : "Example: 2 pairs, 1 per style"
                }
              />
            </label>
            <label>
              {zh ? "尺码" : "Sizes"}
              <input
                required
                minLength={2}
                maxLength={240}
                value={sizes}
                onChange={(event) => setSizes(event.target.value)}
                placeholder={zh ? "例如：EU 41 / 42" : "Example: EU 41 / 42"}
              />
            </label>
            <label>
              {zh ? "颜色" : "Colors"}
              <input
                required
                minLength={2}
                maxLength={240}
                value={colors}
                onChange={(event) => setColors(event.target.value)}
                placeholder={
                  zh
                    ? "例如：黑色，最终按实物确认"
                    : "Example: Black, final reference to confirm"
                }
              />
            </label>
          </div>
          <label>
            {zh
              ? "为什么需要这批样品？"
              : "What decision should this sample support?"}
            <textarea
              required
              minLength={2}
              maxLength={600}
              rows={3}
              value={evaluationPurpose}
              onChange={(event) => setEvaluationPurpose(event.target.value)}
              placeholder={
                zh
                  ? "例如：审核穿着、可见做工和欧洲市场选款。"
                  : "Example: Review fit, visible workmanship and EU market suitability."
              }
            />
          </label>
          {sampleType !== "existing_style" ? (
            <label>
              {zh ? "调整 / 技术目标" : "Adaptation / technical target"}
              <textarea
                required
                minLength={2}
                maxLength={800}
                rows={3}
                value={customizationTarget}
                onChange={(event) => setCustomizationTarget(event.target.value)}
                placeholder={
                  zh
                    ? "写明Logo、颜色、结构或目标；这些仍是买家目标，不是贝强已确认能力。"
                    : "State branding, color, construction or target values. These remain buyer targets until feasibility and sampling confirm them."
                }
              />
            </label>
          ) : null}
          <label>
            {zh
              ? "收到后重点验收什么？"
              : "What will you inspect when it arrives?"}
            <textarea
              required
              minLength={2}
              maxLength={1000}
              rows={3}
              value={acceptanceFocus}
              onChange={(event) => setAcceptanceFocus(event.target.value)}
              placeholder={
                zh
                  ? "列出尺码、颜色、外观、可见做工、Logo或其他可观察标准。"
                  : "List fit, color, appearance, visible workmanship, branding or other observable criteria."
              }
            />
          </label>
          <div>
            <label>
              {zh
                ? "后续大货预计数量"
                : "Indicative bulk quantity after review"}
              <input
                required
                minLength={2}
                maxLength={120}
                value={targetBulkQuantity}
                onChange={(event) => setTargetBulkQuantity(event.target.value)}
                placeholder={
                  zh
                    ? "例如：首单500双"
                    : "Example: 500 pairs for the first order"
                }
              />
            </label>
            <label>
              {zh ? "寄送国家" : "Shipping country"}
              <input
                required
                minLength={2}
                maxLength={120}
                value={shippingCountry}
                onChange={(event) => setShippingCountry(event.target.value)}
              />
            </label>
            <label>
              {zh ? "城市（可选）" : "City (optional)"}
              <input
                maxLength={120}
                value={shippingCity}
                onChange={(event) => setShippingCity(event.target.value)}
              />
            </label>
            <label>
              {zh
                ? "希望收到 / 寄出时间"
                : "Requested arrival / dispatch timing"}
              <input
                required
                minLength={2}
                maxLength={240}
                value={requestedTiming}
                onChange={(event) => setRequestedTiming(event.target.value)}
                placeholder={
                  zh
                    ? "例如：2026年9月20日前收到"
                    : "Example: receive before 20 Sep 2026"
                }
              />
            </label>
          </div>
          <label className="buyer-sample-request-check">
            <input
              type="checkbox"
              checked={courierAccountAvailable}
              onChange={(event) =>
                setCourierAccountAvailable(event.target.checked)
              }
            />
            <span>
              {zh
                ? "我方有DHL/FedEx/UPS等快递账号，可在贝强确认后单独提供。"
                : "Our company has a DHL/FedEx/UPS account that can be supplied separately after review."}
            </span>
          </label>
          <label className="buyer-sample-request-check">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              required
            />
            <span>
              {zh
                ? "我理解这只是样品可行性和条款审核申请，不确认样品费、运费、准备时间、规格、测试结果或大货订单。"
                : "I understand this requests feasibility and terms review only. It does not confirm sample cost, freight, preparation time, specifications, test results or a bulk order."}
            </span>
          </label>
          <button
            className="button"
            type="submit"
            disabled={saving || !styleCodes.length}
          >
            {saving
              ? zh
                ? "保存中……"
                : "Saving…"
              : zh
                ? "提交样品审核申请"
                : "Submit sample review request"}
          </button>
        </form>
      ) : (
        <p className="buyer-sample-request-wait">
          {activeSample
            ? zh
              ? "本项目已有样品项目；如需更改或增加一轮，请使用私密消息与贝强确认。"
              : "A sample project already exists. Use the private message thread to discuss changes or another round."
            : zh
              ? "当前申请正在等待贝强审核，可用私密消息补充信息。"
              : "The current request is awaiting Beiqiang review. Use the private message thread to add information."}
        </p>
      )}
      <small>
        {zh
          ? "完整街道地址、快递账号、付款信息和正式样品条款请在贝强确认后通过约定的安全渠道提供。"
          : "Provide the full street address, courier account, payment information and formal sample terms only through the agreed secure channel after Beiqiang review."}
      </small>
    </section>
  );
}
