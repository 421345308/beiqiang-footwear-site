"use client";

import { useMemo, useState } from "react";
import { products } from "../../data/products";
import {
  ACQUISITION_CHANNELS,
  buildTrackedAcquisitionUrl,
  campaignSlug,
  type AcquisitionChannel,
} from "../../lib/acquisition-attribution";

export type AcquisitionChannelPerformance = {
  channel: string;
  events: number;
  inquiries: number;
  qualified: number;
  sampleDiscussion: number;
  quoted: number;
  quoteAccepted: number;
  orderSetupRequested: number;
  orders: number;
  inquiryToQualifiedRate: number;
  inquiryToQuotedRate: number;
};

const CHANNEL_LABELS: Record<string, string> = {
  email: "邮件",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
  alibaba: "Alibaba",
  google: "Google",
  tiktok: "TikTok",
  partner: "合作伙伴",
  direct: "直接/未知",
  other: "其他",
};
const BASE_DESTINATIONS = [
  ["当前在线产品目录", "/products/"],
  ["当前Line Sheet", "/line-sheet/"],
  ["批发步行鞋采购", "/solutions/wholesale-walking-shoes/"],
  ["私标步行鞋开发", "/solutions/private-label-walking-shoes/"],
  ["OEM针织鞋开发", "/solutions/oem-knit-shoes/"],
  ["RFQ准备指南", "/resources/footwear-rfq-checklist/"],
  ["实物样品验收指南", "/resources/physical-sample-review-guide/"],
  ["私标采购路径", "/resources/private-label-walking-shoes-sourcing-guide/"],
] as const;

export default function AcquisitionCampaignWorkbench({
  channels,
}: {
  channels: AcquisitionChannelPerformance[] | null;
}) {
  const [channel, setChannel] = useState<AcquisitionChannel>("email");
  const [destination, setDestination] = useState("/products/");
  const [campaign, setCampaign] = useState("hero-style-outreach");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const normalizedCampaign = campaignSlug(campaign);
  const link = useMemo(() => {
    try {
      return buildTrackedAcquisitionUrl({
        channel,
        destination,
        campaign,
        content,
      });
    } catch {
      return "";
    }
  }, [channel, destination, campaign, content]);

  async function copyLink() {
    if (!link) {
      setMessage("请先填写至少3位的英文活动代码。");
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setMessage(
        "链接已复制。发送前请核对目标买家、产品证据和本次唯一下一步。",
      );
    } catch {
      setMessage("浏览器未允许自动复制，请手动选中链接复制。");
    }
  }

  return (
    <section className="acquisition-workbench">
      <div className="acquisition-heading">
        <div>
          <p className="eyebrow">获客执行与证据</p>
          <h2>可追踪获客链接与渠道质量</h2>
          <p>
            为邮件、LinkedIn、WhatsApp、Alibaba、Google、TikTok或合作伙伴生成规范链接，再用真实询盘阶段判断质量。
          </p>
        </div>
        <span>流量不是订单</span>
      </div>
      <div className="acquisition-layout">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void copyLink();
          }}
        >
          <label>
            渠道
            <select
              value={channel}
              onChange={(event) =>
                setChannel(event.target.value as AcquisitionChannel)
              }
            >
              {ACQUISITION_CHANNELS.map((item) => (
                <option key={item} value={item}>
                  {CHANNEL_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
          <label>
            落地页
            <select
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
            >
              {BASE_DESTINATIONS.map(([label, path]) => (
                <option key={path} value={path}>
                  {label}
                </option>
              ))}
              <optgroup label="单款产品">
                {products.map((product) => (
                  <option
                    key={product.code}
                    value={`/products/${product.slug}/`}
                  >
                    {product.code} · {product.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
          <label>
            活动代码
            <input
              value={campaign}
              onChange={(event) => setCampaign(event.target.value)}
              placeholder="例如 bq009-us-importers"
            />
          </label>
          <label>
            内容版本（可选）
            <input
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="例如 email-a"
            />
          </label>
          <div className="acquisition-link">
            <code>{link || "填写活动代码后生成链接"}</code>
            <button
              className="button button-small"
              type="submit"
              disabled={!link}
            >
              复制链接
            </button>
          </div>
          <small>
            活动代码只写产品、市场、买家类型或内容版本；不要写客户姓名、公司、邮箱、电话或价格。当前规范代码：
            {normalizedCampaign || "—"}
          </small>
          <p aria-live="polite">{message}</p>
        </form>
        <div className="acquisition-channel-table">
          <div>
            <strong>渠道</strong>
            <strong>访问事件</strong>
            <strong>询盘</strong>
            <strong>Qualified</strong>
            <strong>样品+</strong>
            <strong>报价</strong>
            <strong>报价接受</strong>
            <strong>正式订单</strong>
          </div>
          {channels?.length ? (
            channels.map((item) => (
              <div key={item.channel}>
                <b>{CHANNEL_LABELS[item.channel] || item.channel}</b>
                <span>{item.events}</span>
                <span>{item.inquiries}</span>
                <span>
                  {item.qualified}
                  <small>{item.inquiryToQualifiedRate}%</small>
                </span>
                <span>{item.sampleDiscussion}</span>
                <span>
                  {item.quoted}
                  <small>{item.inquiryToQuotedRate}%</small>
                </span>
                <span>{item.quoteAccepted}</span>
                <span>{item.orders}</span>
              </div>
            ))
          ) : (
            <p>
              加载真实经营数据后显示渠道质量；没有数据时不把缺失写成零表现。
            </p>
          )}
          <small>
            阶段数字是该周期询盘目前的可核验状态，不证明单次触达造成成交，也不代表平台订单、收入或未来成交概率。
          </small>
        </div>
      </div>
    </section>
  );
}
