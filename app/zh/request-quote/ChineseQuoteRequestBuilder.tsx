/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import InquiryAttachmentUploader from "../../components/InquiryAttachmentUploader";
import ContactPreferenceFields, {
  EMPTY_CONTACT_PREFERENCES,
  type ContactPreferences,
} from "../../components/ContactPreferenceFields";
import AdaptationBriefFields, { EMPTY_ADAPTATION_BRIEF, type AdaptationBrief } from "../../components/AdaptationBriefFields";
import BuyerQuoteReadiness from "../../components/BuyerQuoteReadiness";
import QuoteListShare from "../../components/QuoteListShare";
import { productNameZh } from "../../data/products-zh";
import { products } from "../../data/products";
import { getAttribution, trackEvent } from "../../lib/tracking";
import {
  readQuoteList,
  saveQuoteList,
  type QuoteLine,
} from "../../lib/quote-list";
import { assessBuyerQuoteReadiness } from "../../lib/buyer-quote-readiness";
import { readPrivateLabelConcept } from "../../lib/private-label-concept";
import { buyerTypeFromFinder, clearProductFinderBrief, finderBriefLabels, readProductFinderBrief, salesChannelFromFinder, type ProductFinderBrief } from "../../lib/product-finder-brief";
import { clearQuoteRequestDraft, EMPTY_QUOTE_REQUEST_DRAFT, readQuoteRequestDraft, saveQuoteRequestDraft, type QuoteRequestDraft } from "../../lib/quote-request-draft";
import { mergeSharedQuoteList, parseSharedQuoteCodes } from "../../lib/quote-list-share";
import QuoteBriefReview from "../../components/QuoteBriefReview";

type Status = {
  kind: "idle" | "sending" | "success" | "error";
  message: string;
};

export default function ChineseQuoteRequestBuilder() {
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [buyerType, setBuyerType] = useState("Importer / wholesaler");
  const [market, setMarket] = useState("");
  const [channel, setChannel] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [contactPreferences, setContactPreferences] =
    useState<ContactPreferences>(EMPTY_CONTACT_PREFERENCES);
  const [projectPath, setProjectPath] = useState("base_style_adaptation");
  const [sampleQuantity, setSampleQuantity] = useState("");
  const [bulkQuantity, setBulkQuantity] = useState("");
  const [buyerTargetCost, setBuyerTargetCost] = useState("");
  const [preferredTradeTerm, setPreferredTradeTerm] = useState("not_sure");
  const [deliveryDestination, setDeliveryDestination] = useState("");
  const [deliveryTiming, setDeliveryTiming] = useState("");
  const [existingSole, setExistingSole] = useState("Unsure / discuss first");
  const [changesRequired, setChangesRequired] = useState("");
  const [targetValues, setTargetValues] = useState("");
  const [ndaRequired, setNdaRequired] = useState("No");
  const [requirements, setRequirements] = useState("");
  const [adaptationBrief, setAdaptationBrief] = useState<AdaptationBrief>(EMPTY_ADAPTATION_BRIEF);
  const [sourcingProgram, setSourcingProgram] = useState("");
  const [finderBrief, setFinderBrief] = useState<ProductFinderBrief | null>(null);
  const [website, setWebsite] = useState("");
  const [consent, setConsent] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [shareImportMessage, setShareImportMessage] = useState("");
  const [status, setStatus] = useState<Status>({
    kind: "idle",
    message: "询价单将作为一条完整采购需求保存，并生成询盘编号和私密查询码。",
  });
  const [accessDetails, setAccessDetails] = useState<{
    reference: string;
    accessCode: string;
  } | null>(null);
  const startedAt = useRef(0);

  function applyDraft(draft: QuoteRequestDraft) {
    setName(draft.name); setCompany(draft.company); setBuyerType(draft.buyerType); setMarket(draft.market); setChannel(draft.channel); setEmail(draft.email); setWhatsapp(draft.whatsapp);
    setContactPreferences(draft.contactPreferences); setProjectPath(draft.projectPath); setSampleQuantity(draft.sampleQuantity); setBulkQuantity(draft.bulkQuantity); setBuyerTargetCost(draft.buyerTargetCost); setPreferredTradeTerm(draft.preferredTradeTerm);
    setDeliveryDestination(draft.deliveryDestination); setDeliveryTiming(draft.deliveryTiming); setExistingSole(draft.existingSole); setChangesRequired(draft.changesRequired); setTargetValues(draft.targetValues);
    setNdaRequired(draft.ndaRequired); setRequirements(draft.requirements); setAdaptationBrief(draft.adaptationBrief); setSourcingProgram(draft.sourcingProgram);
  }

  useEffect(() => {
    startedAt.current = Date.now();
    trackEvent("quote_builder_view", { context: "quote_builder_zh" });
    const params = new URLSearchParams(window.location.search);
    const requestedProgram = params.get("program") || "";
    const requestedResource = params.get("resource") || "";
    const requestedPath = params.get("path");
    const requestedConcept = params.get("concept") === "1";
    const sharedShortlist = params.get("shortlist");
    const timer = window.setTimeout(() => {
      const currentLines = readQuoteList();
      if (sharedShortlist !== null) {
        const codes = parseSharedQuoteCodes(sharedShortlist, products.map((product) => product.code));
        const merged = mergeSharedQuoteList(currentLines, codes, products);
        setLines(merged.lines);
        if (merged.imported) saveQuoteList(merged.lines);
        setShareImportMessage(codes.length
          ? (merged.imported ? `已导入${merged.imported}款共享产品；原有单款资料保持不变。` : "没有新增款式：产品已在清单中，或当前询价单已满12款。")
          : "该共享链接没有包含有效的目录款号。");
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("shortlist");
        window.history.replaceState({}, "", `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
      } else setLines(currentLines);
      const savedDraft = readQuoteRequestDraft();
      if (savedDraft) {
        applyDraft(savedDraft);
        setDraftMessage("已恢复本浏览器标签页中尚未提交的表单内容。");
      }
      const savedFinderBrief = readProductFinderBrief();
      if (savedFinderBrief?.mode === "matched_shortlist") {
        setFinderBrief(savedFinderBrief);
        setBuyerType(buyerTypeFromFinder(savedFinderBrief.buyerChannel));
        setChannel((current) => current || salesChannelFromFinder(savedFinderBrief.buyerChannel));
      }
      if (/^[a-z0-9-]{1,80}$/.test(requestedProgram))
        setSourcingProgram(requestedProgram);
      else if (/^[a-z0-9-]{1,80}$/.test(requestedResource))
        setSourcingProgram(`resource-${requestedResource}`);
      if (
        ["base_style_adaptation", "technical_development"].includes(
          requestedPath || "",
        )
      )
        setProjectPath(requestedPath!);
      if (requestedConcept) {
        const concept = readPrivateLabelConcept();
        if (concept) {
          setProjectPath("base_style_adaptation");
          setAdaptationBrief({ intent: "private_label", artworkStatus: concept.artworkStatus, brandingPlacement: `${concept.placement}${concept.brandText ? `；品牌文字：${concept.brandText}` : ""}`.slice(0, 300), colorDirection: "", packingLabeling: concept.notes });
          setRequirements((current) => current || `买家已为${concept.styleCode}制作私标概念图；视觉文件由买家保留，所有内容仍是待工厂可行性与样品审核的目标。${concept.notes ? `说明：${concept.notes}` : ""}`.slice(0, 1000));
        }
      }
      setDraftReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!draftReady || accessDetails) return;
    const timer = window.setTimeout(() => saveQuoteRequestDraft({ name, company, buyerType, market, channel, email, whatsapp, contactPreferences, projectPath, sampleQuantity, bulkQuantity, buyerTargetCost, preferredTradeTerm, deliveryDestination, deliveryTiming, existingSole, changesRequired, targetValues, ndaRequired, requirements, adaptationBrief, sourcingProgram }), 250);
    return () => window.clearTimeout(timer);
  }, [draftReady, accessDetails, name, company, buyerType, market, channel, email, whatsapp, contactPreferences, projectPath, sampleQuantity, bulkQuantity, buyerTargetCost, preferredTradeTerm, deliveryDestination, deliveryTiming, existingSole, changesRequired, targetValues, ndaRequired, requirements, adaptationBrief, sourcingProgram]);

  function clearLocalDraft() {
    clearQuoteRequestDraft(); applyDraft(EMPTY_QUOTE_REQUEST_DRAFT); setDraftMessage("已清除暂存表单内容；已选择的产品清单保持不变。");
  }
  const technical = projectPath === "technical_development";
  const totalQuantity = useMemo(
    () =>
      lines.reduce(
        (sum, line) =>
          sum + (Number.parseInt(line.quantity.replace(/\D/g, ""), 10) || 0),
        0,
      ),
    [lines],
  );
  const quoteReadiness = assessBuyerQuoteReadiness({
    company,
    buyerType,
    market,
    email,
    whatsapp,
    styleCode: lines.map((line) => line.code).join(", "),
    quantity: totalQuantity ? `${totalQuantity} pairs` : "",
    bulkQuantity,
    sampleQuantity,
    preferredTradeTerm,
    deliveryDestination,
    deliveryTiming,
    requirements,
    projectPath,
    adaptationBrief: technical ? undefined : adaptationBrief,
    items: lines,
  }, "zh");
  function updateLine(index: number, field: keyof QuoteLine, value: string) {
    const next = lines.map((line, lineIndex) =>
      lineIndex === index ? { ...line, [field]: value } : line,
    );
    setLines(next);
    saveQuoteList(next);
  }
  function removeLine(code: string) {
    const next = lines.filter((line) => line.code !== code);
    setLines(next);
    saveQuoteList(next);
    trackEvent("quote_list_remove", {
      styleCode: code,
      context: "quote_builder_zh",
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lines.length) {
      setStatus({ kind: "error", message: "提交前请至少加入一款产品。" });
      return;
    }
    if (!email.trim() && !whatsapp.trim()) {
      setStatus({ kind: "error", message: "请至少提供邮箱或WhatsApp号码。" });
      return;
    }
    if (preferredTradeTerm === "DDP_request" && !deliveryDestination.trim()) {
      setStatus({ kind: "error", message: "申请DDP审核前请提供准确目的地。" });
      return;
    }
    setStatus({ kind: "sending", message: "正在保存询价单……" });
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          company,
          buyerType,
          market: `${market}${channel ? ` / ${channel}` : ""}`,
          quantity:
            bulkQuantity ||
            (totalQuantity
              ? `${totalQuantity} pairs across ${lines.length} styles`
              : `${lines.length} styles; quantity to discuss`),
          email,
          whatsapp,
          ...contactPreferences,
          requirements,
          website,
          consent,
          styleCode: lines.map((line) => line.code).join(", "),
          styleLabel: lines
            .map((line) => `${line.code} — ${line.name}`)
            .join(" | "),
          context: "quote_list",
          sourcingProgram,
          finderBrief,
          page: `${window.location.pathname}${window.location.search}`,
          formStartedAt: startedAt.current,
          attribution: getAttribution(),
          projectPath,
          sampleQuantity,
          bulkQuantity,
          buyerTargetCost,
          preferredTradeTerm,
          deliveryDestination,
          deliveryTiming,
          existingSole: technical ? existingSole : "",
          changesRequired: technical ? changesRequired : "",
          targetValues: technical ? targetValues : "",
          ndaRequired: technical ? ndaRequired : "No",
          adaptationBrief: technical ? EMPTY_ADAPTATION_BRIEF : adaptationBrief,
          items: lines.map(
            ({
              code,
              sourceModel,
              name: productName,
              quantity,
              colors,
              sizes,
              notes,
            }) => ({
              code,
              sourceModel,
              name: productName,
              quantity,
              colors,
              sizes,
              notes,
            }),
          ),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(result.message || "询价单暂时无法保存。 ");
      const details = {
        reference: result.reference,
        accessCode: result.accessCode || "",
      };
      setAccessDetails(details);
      if (details.accessCode)
        localStorage.setItem(
          "beiqiang_last_inquiry_access",
          JSON.stringify(details),
        );
      setStatus({
        kind: "success",
        message: `询价单已保存。编号：${result.reference}。私密查询码：${details.accessCode || "将另行发送"}。请保存两项信息。`,
      });
      trackEvent("quote_request_submit", {
        reference: result.reference,
        styleCount: lines.length,
        projectPath,
        context: "quote_builder_zh",
      });
      saveQuoteList([]);
      clearQuoteRequestDraft();
      setDraftMessage("提交成功后，临时表单草稿已清除。");
      clearProductFinderBrief();
      setFinderBrief(null);
      setLines([]);
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "询价单暂时无法保存，请使用WhatsApp或邮件联系。",
      });
    }
  }

  return (
    <>
      <section className="quote-builder-hero">
        <p className="eyebrow">多款B2B询价</p>
        <h1>把候选鞋款整理成一份订单需求。</h1>
        <p>
          为每款填写数量、颜色和尺码。贝强审核可用情况、规格、样品需求和商业条款后再确认报价。
        </p>
        <div className="quote-builder-steps">
          <span>01 选择鞋款</span>
          <span>02 补充订单资料</span>
          <span>03 提交工厂审核</span>
        </div>
      </section>
      <section className="section quote-builder-layout">
        <div className="quote-lines">
          <div className="quote-section-heading">
            <div>
              <p className="eyebrow">您的询价单</p>
              <h2>
                {lines.length ? `已选择${lines.length}款` : "尚未选择产品"}
              </h2>
            </div>
            <Link className="text-link" href="/zh/products/">
              浏览全部产品 →
            </Link>
          </div>
          <QuoteListShare lines={lines} locale="zh" importMessage={shareImportMessage} />
          {lines.length ? (
            lines.map((line, index) => {
              const product = products.find((item) => item.code === line.code);
              return (
                <article className="quote-line" key={line.code}>
                  <img
                    src={line.image}
                    alt={`${line.code} ${product ? productNameZh(product) : line.name}`}
                  />
                  <div className="quote-line-copy">
                    <small>
                      {line.code} / {line.sourceModel}
                    </small>
                    <h3>{product ? productNameZh(product) : line.name}</h3>
                    <Link href={`/zh/products/${line.slug}/`}>
                      查看产品详情
                    </Link>
                  </div>
                  <div className="quote-line-fields">
                    <label>
                      预计双数
                      <input
                        inputMode="numeric"
                        value={line.quantity}
                        onChange={(event) =>
                          updateLine(index, "quantity", event.target.value)
                        }
                        placeholder="例如300"
                      />
                    </label>
                    <label>
                      颜色
                      <input
                        value={line.colors}
                        onChange={(event) =>
                          updateLine(index, "colors", event.target.value)
                        }
                        placeholder="例如黑色、白色"
                      />
                    </label>
                    <label>
                      尺码 / 配比
                      <input
                        value={line.sizes}
                        onChange={(event) =>
                          updateLine(index, "sizes", event.target.value)
                        }
                        placeholder="例如EU 39-45"
                      />
                    </label>
                    <label>
                      单款备注
                      <input
                        value={line.notes}
                        onChange={(event) =>
                          updateLine(index, "notes", event.target.value)
                        }
                        placeholder="包装或改动要求"
                      />
                    </label>
                  </div>
                  <button
                    className="quote-remove"
                    type="button"
                    onClick={() => removeLine(line.code)}
                    aria-label={`移除${line.code}`}
                  >
                    移除
                  </button>
                </article>
              );
            })
          ) : (
            <div className="quote-empty">
              <p>
                请先在产品目录或产品详情页点击“加入询价”。候选款在本设备保留，直到提交或手动移除。
              </p>
              <Link className="button" href="/zh/products/">
                选择产品
              </Link>
            </div>
          )}
        </div>
        <form
          className="quote-request-form"
          onSubmit={submit}
          onFocus={() => {
            if (!startedAt.current) startedAt.current = Date.now();
          }}
        >
          <div>
            <p className="eyebrow eyebrow-light">买家与项目资料</p>
            <h2>提供足够信息，让工厂判断下一步。</h2>
            {sourcingProgram && (
              <p className="quote-program-origin">
                来源：{sourcingProgram.replaceAll("-", " ")}
              </p>
            )}
          </div>
          <BuyerQuoteReadiness readiness={quoteReadiness} />
          <div className="quote-draft-notice"><p><strong>{draftMessage || "当前标签页已开启草稿保护。"}</strong><span>未提交的表单内容只暂存在本浏览器标签页，不会发送给贝强；提交成功或标签页会话结束后清除。</span></p><button type="button" onClick={clearLocalDraft}>清除暂存表单</button></div>
          {finderBrief && (() => {
            const labels = finderBriefLabels(finderBrief, "zh");
            return <section className="finder-brief-handoff" aria-label="从采购选款助手带入的需求">
              <div><p className="eyebrow">已带入采购需求</p><h3>候选款背景已准备好，请核对。</h3></div>
              <dl><div><dt>买家／渠道</dt><dd>{labels.buyer}</dd></div><div><dt>产品方向</dt><dd>{labels.priority}</dd></div><div><dt>穿脱结构</dt><dd>{labels.closure}</dd></div><div><dt>候选款号</dt><dd>{finderBrief.styleCodes.join("、")}</dd></div></dl>
              <p>这是买家提交的采购目标和系统生成的目录候选，不代表销量、库存、价格或工厂可行性确认。下方买家类型与销售渠道仍可修改。</p>
              <button type="button" onClick={() => { clearProductFinderBrief(); setFinderBrief(null); }}>移除带入需求</button>
            </section>;
          })()}
          <fieldset>
            <legend>1. 项目路径</legend>
            <label className="radio-card">
              <input
                type="radio"
                name="path"
                value="base_style_adaptation"
                checked={!technical}
                onChange={(event) => setProjectPath(event.target.value)}
              />
              <span>
                <strong>现有款调整</strong>
                <small>从贝强款号开始，讨论颜色、品牌标识、标签或包装。</small>
              </span>
            </label>
            <label className="radio-card">
              <input
                type="radio"
                name="path"
                value="technical_development"
                checked={technical}
                onChange={(event) => setProjectPath(event.target.value)}
              />
              <span>
                <strong>技术产品开发</strong>
                <small>
                  新楦、模具、鞋底、硬度、材料体系、测试目标、NDA或技术包。
                </small>
              </span>
            </label>
            <p className="technical-gate-note path-gate-note">
              买家目标值先作为开发要求审核，只有经工厂和部件供应商确认后才能成为生产规格。
            </p>
          </fieldset>
          <fieldset className="form-grid">
            <legend>2. 买家信息</legend>
            <label>
              联系人
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
              />
            </label>
            <label>
              公司名称
              <input
                required
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                maxLength={160}
              />
            </label>
            <label>
              买家类型
              <select
                value={buyerType}
                onChange={(event) => setBuyerType(event.target.value)}
              >
                <option value="Importer / wholesaler">进口商 / 批发商</option>
                <option value="Amazon / TikTok seller">
                  Amazon / TikTok卖家
                </option>
                <option value="Brand / private label">品牌 / 私标买家</option>
                <option value="Sourcing agent">采购代理</option>
              </select>
            </label>
            <label>
              目标国家 / 市场
              <input
                required
                value={market}
                onChange={(event) => setMarket(event.target.value)}
                maxLength={120}
              />
            </label>
            <label>
              销售渠道
              <input
                value={channel}
                onChange={(event) => setChannel(event.target.value)}
                maxLength={100}
                placeholder="批发、Amazon、连锁零售……"
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={180}
              />
            </label>
            <label>
              WhatsApp
              <input
                value={whatsapp}
                onChange={(event) => setWhatsapp(event.target.value)}
                maxLength={80}
              />
            </label>
            <label>
              样品数量
              <input
                value={sampleQuantity}
                onChange={(event) => setSampleQuantity(event.target.value)}
                maxLength={80}
                placeholder="需要的双数 / 尺码"
              />
            </label>
            <label>
              预计大货数量
              <input
                value={bulkQuantity}
                onChange={(event) => setBulkQuantity(event.target.value)}
                maxLength={80}
                placeholder="总数量或每款数量"
              />
            </label>
            <label>
              买家目标成本 / 价格方向（选填）
              <input
                value={buyerTargetCost}
                onChange={(event) => setBuyerTargetCost(event.target.value)}
                maxLength={120}
                placeholder="例如：目标FOB 9.50美元/双"
              />
              <small>仅为买家的商业目标，不是贝强报价或接受价格。</small>
            </label>
          </fieldset>
          <ContactPreferenceFields
            locale="zh"
            value={contactPreferences}
            onChange={setContactPreferences}
            legend="3. 联系偏好（选填）"
          />
          <fieldset className="form-grid logistics-fields">
            <legend>4. 交付与贸易术语偏好</legend>
            <label>
              优先讨论方式
              <select
                value={preferredTradeTerm}
                onChange={(event) => setPreferredTradeTerm(event.target.value)}
              >
                <option value="not_sure">不确定，请建议</option>
                <option value="EXW">EXW 工厂交货</option>
                <option value="FOB">FOB 指定装运港</option>
                <option value="FCA">FCA 指定承运人 / 地点</option>
                <option value="DDP_request">申请DDP评估</option>
              </select>
            </label>
            <label>
              交付目的地
              <input
                required={preferredTradeTerm === "DDP_request"}
                value={deliveryDestination}
                onChange={(event) => setDeliveryDestination(event.target.value)}
                maxLength={240}
                placeholder="国家、城市/港口、邮编或FBA代码"
              />
            </label>
            <label className="form-full">
              期望交付时间
              <input
                value={deliveryTiming}
                onChange={(event) => setDeliveryTiming(event.target.value)}
                maxLength={160}
                placeholder="期望到货窗口或紧急程度；以确认结果为准"
              />
            </label>
            <p className="technical-gate-note form-full">
              除非书面报价另有说明，产品价格与运费分开。DDP评估需要目的地、数量和确认后的包装资料；报关、关税、税费和当地派送在货代确认前不作承诺。
            </p>
          </fieldset>
          {technical && (
            <fieldset className="form-grid technical-fields">
              <legend>5. 技术开发门禁</legend>
              <label>
                现有鞋底是否可接受？
                <select
                  value={existingSole}
                  onChange={(event) => setExistingSole(event.target.value)}
                >
                  <option value="Unsure / discuss first">不确定，先讨论</option>
                  <option value="Yes, if sample is acceptable">
                    样品符合要求即可
                  </option>
                  <option value="No, new tooling may be required">
                    不可接受，可能需要新模具
                  </option>
                </select>
              </label>
              <label>
                是否需要NDA / 技术包？
                <select
                  value={ndaRequired}
                  onChange={(event) => setNdaRequired(event.target.value)}
                >
                  <option value="No">不需要</option>
                  <option value="Yes">需要</option>
                </select>
              </label>
              <label className="form-full">
                需要的改动
                <textarea
                  value={changesRequired}
                  onChange={(event) => setChangesRequired(event.target.value)}
                  maxLength={1200}
                  rows={3}
                  placeholder="鞋面、鞋楦、鞋底、硬度、材料、品牌、包装……"
                />
              </label>
              <label className="form-full">
                买家目标值 / 测试要求
                <textarea
                  value={targetValues}
                  onChange={(event) => setTargetValues(event.target.value)}
                  maxLength={1600}
                  rows={3}
                  placeholder="如已知，请写明目标、容差和测量方法。审核前不视为贝强已确认能力。"
                />
              </label>
            </fieldset>
          )}
          {!technical && <AdaptationBriefFields locale="zh" value={adaptationBrief} onChange={setAdaptationBrief} />}
          <fieldset className="form-grid">
            <legend>6. 其他要求</legend>
            <label className="form-full">
              订单背景
              <textarea
                value={requirements}
                onChange={(event) => setRequirements(event.target.value)}
                maxLength={3000}
                rows={4}
                placeholder="包装、标签、参考链接或其他问题……"
              />
            </label>
          </fieldset>
          <label className="form-honeypot" aria-hidden="true">
            Website
            <input
              tabIndex={-1}
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </label>
          <QuoteBriefReview locale="zh" input={{ lines, name, company, buyerType, market, channel, email, whatsapp, contactPreferences, projectPath, sampleQuantity, bulkQuantity, buyerTargetCost, preferredTradeTerm, deliveryDestination, deliveryTiming, existingSole, changesRequired, targetValues, ndaRequired, requirements, adaptationBrief }} />
          <label className="quote-consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              required
            />
            <span>我同意贝强使用这些资料审核并回复本次B2B采购需求。</span>
          </label>
          <button
            className="button button-light"
            type="submit"
            disabled={status.kind === "sending" || status.kind === "success"}
          >
            {status.kind === "sending"
              ? "正在保存……"
              : status.kind === "success"
                ? "询价单已保存"
                : "提交询价单"}
          </button>
          <p
            className={`quote-status quote-status-${status.kind}`}
            aria-live="polite"
          >
            {status.message}
          </p>
          {accessDetails?.accessCode && (
            <>
              <Link
                className="inquiry-status-link inquiry-status-link-light"
                href="/zh/inquiry-status/"
              >
                查看项目进度 →
              </Link>
              <InquiryAttachmentUploader
                reference={accessDetails.reference}
                accessCode={accessDetails.accessCode}
                tone="light"
                locale="zh"
              />
            </>
          )}
        </form>
      </section>
    </>
  );
}
