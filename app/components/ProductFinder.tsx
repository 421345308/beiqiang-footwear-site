/* eslint-disable @next/next/no-img-element */
"use client";

import { productMediaUrl } from "../lib/product-media-url";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { products } from "../data/products";
import { buyerFitZh, closureZh, factZh, productNameZh, productSummaryZh } from "../data/products-zh";
import {
  findProducts,
  type BuyerChannel,
  type ClosurePreference,
  type FinderAnswers,
  type ProductPriority,
} from "../lib/product-finder";
import { saveProductFinderBrief } from "../lib/product-finder-brief";
import { addProductToQuote, readQuoteList } from "../lib/quote-list";
import { trackEvent } from "../lib/tracking";

const reasonZh: Record<string, string> = {
  "Wide toe box": "宽鞋头设计",
  "Slip-on construction": "套穿结构",
  "Breathable or open-textile lace-up": "透气网面或镂空系带款",
  "Men's styles": "男鞋款式",
  "Kids' styles": "童鞋款式",
  "Winter or fleece-lined options": "冬季及加绒款式",
  "Slip-On preference matched": "符合套穿偏好",
  "Lace-Up preference matched": "符合系带偏好",
  "Zip-Up preference matched": "符合拉链偏好",
  "Dial preference matched": "符合旋钮闭合偏好",
};

export default function ProductFinder({
  locale = "en",
}: {
  locale?: "en" | "zh";
}) {
  const zh = locale === "zh";
  const [buyerChannel, setBuyerChannel] = useState<BuyerChannel>(
    "importer_wholesaler",
  );
  const [priority, setPriority] = useState<ProductPriority>("open");
  const [closure, setClosure] = useState<ClosurePreference>("any");
  const [resultCount, setResultCount] = useState<2 | 3 | 4>(3);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState(
    zh
      ? "选择采购方向后生成候选款。"
      : "Choose a sourcing direction to build a shortlist.",
  );
  const answers: FinderAnswers = {
    buyerChannel,
    priority,
    closure,
    resultCount,
  };
  const matches = useMemo(
    () =>
      submitted
        ? findProducts(products, {
            buyerChannel,
            priority,
            closure,
            resultCount,
          })
        : [],
    [buyerChannel, closure, priority, resultCount, submitted],
  );

  useEffect(() => {
    trackEvent("product_finder_view", {
      context: zh ? "finder_zh" : "finder_en",
    });
  }, [zh]);

  function generate() {
    const next = findProducts(products, answers);
    setSubmitted(true);
    setMessage(
      next.length
        ? zh
          ? `已根据当前选择生成${next.length}款候选。`
          : `${next.length} product candidates generated from the current catalogue.`
        : zh
          ? "当前条件互相冲突或当前目录没有匹配款，请调整产品方向或穿脱结构。"
          : "The current requirements conflict or have no match in this catalogue. Adjust the direction or closure.",
    );
    trackEvent("product_finder_result", {
      context: zh ? "finder_zh" : "finder_en",
      styleCodes: next.map((item) => item.product.code).join(","),
      styleCount: next.length,
    });
  }

  function addAll() {
    const existing = new Set(readQuoteList().map((line) => line.code));
    let added = 0;
    for (const { product } of matches)
      if (!existing.has(product.code) && addProductToQuote(product)) added += 1;
    saveProductFinderBrief({
      mode: "matched_shortlist",
      buyerChannel,
      priority,
      closure,
      styleCodes: matches.map((item) => item.product.code),
    });
    setMessage(
      zh
        ? `已新增${added}款到询价单；原有款不会重复加入。`
        : `${added} new style${added === 1 ? "" : "s"} added to the quote list; existing styles were not duplicated.`,
    );
    trackEvent("product_finder_to_quote", {
      context: zh ? "finder_zh" : "finder_en",
      styleCodes: matches.map((item) => item.product.code).join(","),
      styleCount: matches.length,
    });
  }

  function requestHumanReview() {
    saveProductFinderBrief({
      mode: "human_review",
      buyerChannel,
      priority,
      closure,
      styleCodes: matches.map((item) => item.product.code),
    });
    trackEvent("product_finder_to_quote", {
      context: zh ? "human_review_zh" : "human_review_en",
      styleCodes: matches.map((item) => item.product.code).join(","),
      styleCount: matches.length,
    });
  }

  const comparisonHref = `${zh ? "/zh/products/" : "/products/"}?compare=${matches.map((item) => item.product.code).join(",")}`;

  return (
    <div className="finder-shell">
      <form
        className="finder-form"
        onSubmit={(event) => {
          event.preventDefault();
          generate();
        }}
      >
        <div>
          <p className="eyebrow">{zh ? "采购需求" : "SOURCING NEED"}</p>
          <h2>
            {zh
              ? "先告诉我们您在找什么。"
              : "Tell us what the shortlist must solve."}
          </h2>
          <p>
            {zh
              ? `根据采购方向、穿脱方式和销售渠道，从${products.length}款鞋中寻找适合您的款式。`
              : `Find suitable styles among ${products.length} shoes by product direction, fastening and sales channel.`}
          </p>
        </div>
        <label>
          {zh ? "买家／渠道类型" : "Buyer or sales channel"}
          <select
            value={buyerChannel}
            onChange={(event) =>
              setBuyerChannel(event.target.value as BuyerChannel)
            }
          >
            <option value="importer_wholesaler">
              {zh ? "进口商／批发商" : "Importer / wholesaler"}
            </option>
            <option value="online_seller">
              {zh
                ? "Amazon／TikTok／在线卖家"
                : "Amazon / TikTok / online seller"}
            </option>
            <option value="brand_private_label">
              {zh ? "品牌／私标买家" : "Brand / private-label buyer"}
            </option>
            <option value="sourcing_agent">
              {zh ? "采购代理／尚未确定" : "Sourcing agent / not decided"}
            </option>
          </select>
        </label>
        <label>
          {zh ? "首要产品方向" : "Primary product direction"}
          <select
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as ProductPriority)
            }
          >
            <option value="open">
              {zh
                ? "浏览全部款式"
                : "Explore all styles"}
            </option>
            <option value="wide_toe">
              {zh ? "宽鞋头款式" : "Wide-toe styles"}
            </option>
            <option value="easy_on">
              {zh ? "容易穿脱的套穿鞋" : "Easy-on slip-on shoes"}
            </option>
            <option value="breathable_lace_up">
              {zh
                ? "透气／镂空纺织系带鞋"
                : "Breathable / open-textile lace-up"}
            </option>
            <option value="mens">{zh ? "男鞋系列方向" : "Men's range"}</option>
            <option value="kids">{zh ? "童鞋系列方向" : "Kids range"}</option>
            <option value="cold_weather">
              {zh ? "冬季／加绒选项方向" : "Winter / fleece-option direction"}
            </option>
          </select>
        </label>
        <label>
          {zh ? "穿脱结构" : "Closure preference"}
          <select
            value={closure}
            onChange={(event) =>
              setClosure(event.target.value as ClosurePreference)
            }
          >
            <option value="any">{zh ? "不限" : "No preference"}</option>
            <option value="Slip-On">{zh ? "套穿" : "Slip-On"}</option>
            <option value="Lace-Up">{zh ? "系带" : "Lace-Up"}</option>
            <option value="Zip-Up">{zh ? "拉链" : "Zip-Up"}</option>
            <option value="Dial">{zh ? "旋钮闭合" : "Dial closure"}</option>
          </select>
        </label>
        <label>
          {zh ? "候选数量" : "Shortlist size"}
          <select
            value={resultCount}
            onChange={(event) =>
              setResultCount(Number(event.target.value) as 2 | 3 | 4)
            }
          >
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </label>
        <button className="button" type="submit">
            {zh ? "生成产品候选清单" : "Build product shortlist"}
        </button>
        <small>
          {zh
            ? "您的选择只在当前页面用于匹配，不会自动建立询盘或订单。"
            : "Your choices are used on this page only. They do not create an inquiry or order."}
        </small>
      </form>
      <section className="finder-results" aria-live="polite">
        <div className="finder-results-heading">
          <div>
            <p className="eyebrow">{zh ? "匹配结果" : "MATCHED SHORTLIST"}</p>
            <h2>
              {submitted
                ? matches.length
                  ? zh
                    ? "从真实款号开始比较。"
                    : "Compare from real product codes."
                  : zh
                    ? "没有强行推荐。"
                    : "No forced recommendation."
                : zh
                  ? "候选款将在这里显示。"
                  : "Your candidates will appear here."}
            </h2>
            <p>{message}</p>
          </div>
          {matches.length ? (
            <span>
              {matches.length}/{resultCount}
            </span>
          ) : null}
        </div>
        <div className="finder-result-grid">
          {matches.map(({ product, reasons }) => (
            <article key={product.code}>
              <img
                src={productMediaUrl(`/catalog-thumbs/${product.slug}.webp`)}
                alt={`${product.code} ${zh ? productNameZh(product) : product.name}`}
                width="640"
                height="640"
              />
              <div>
                <small>
                  {product.code}
                </small>
                <h3>{zh ? productNameZh(product) : product.name}</h3>
                <p>
                  {zh
                    ? productSummaryZh(product)
                    : product.shortDescription}
                </p>
                <ul>
                  {reasons.map((reason) => (
                    <li key={reason}>
                      {zh
                        ? reasonZh[reason] ||
                          (reason === [product.closure, product.upper].filter(Boolean).join(" · ")
                            ? [closureZh(product.closure), factZh(product.upper)].filter(Boolean).join(" · ")
                            : "") ||
                          (reason === product.buyerFit
                            ? buyerFitZh(product)
                            : reason
                                .replace("Slip-On", "套穿")
                                .replace("Lace-Up", "系带")
                                .replace("Zip-Up", "拉链")
                                .replace("Dial", "旋钮闭合"))
                        : reason}
                    </li>
                  ))}
                </ul>
                <Link href={`${zh ? "/zh" : ""}/products/${product.slug}/`}>
                  {zh ? "查看产品详情 →" : "Review product details →"}
                </Link>
              </div>
            </article>
          ))}
        </div>
        {submitted ? (
          <div className="finder-actions">
            {matches.length ? (
              <>
                <button className="button" type="button" onClick={addAll}>
                  {zh ? "全部加入询价单" : "Add all to quote list"}
                </button>
                <Link
                  className="button button-secondary"
                  href={comparisonHref}
                  onClick={() =>
                    trackEvent("product_finder_to_compare", {
                      context: zh ? "finder_zh" : "finder_en",
                      styleCodes: matches
                        .map((item) => item.product.code)
                        .join(","),
                      styleCount: matches.length,
                    })
                  }
                >
                  {zh ? "并排比较候选款" : "Compare candidates"}
                </Link>
                <Link
                  className="text-link"
                  href={zh ? "/zh/request-quote/" : "/request-quote/"}
                >
                  {zh ? "打开询价单 →" : "Open quote list →"}
                </Link>
              </>
            ) : null}
            <Link
              className={matches.length ? "text-link" : "button"}
              href={zh ? "/zh/sourcing-review/" : "/sourcing-review/"}
              onClick={requestHumanReview}
            >
              {matches.length
                ? zh
                  ? "让我们帮您选款 →"
                  : "Ask us for selection advice →"
                : zh
                  ? "获取选款建议"
                  : "Ask for selection advice"}
            </Link>
            <small>
              {matches.length
                ? zh
                  ? "可直接将鞋款加入询价单，也可告诉我们您的市场、数量和样品要求。"
                  : "Add styles to your inquiry, or tell us about your market, quantities and sample needs."
                : zh
                  ? "我们会根据您的筛选条件协助寻找合适款式。"
                  : "We will use your criteria to help find suitable styles."}
            </small>
          </div>
        ) : null}
        <small className="finder-boundary">
          {zh
            ? "需要更具体的选款建议？告诉我们您的市场、数量和样品要求。"
            : "For a tailored selection, tell us about your market, quantities and sample requirements."}
        </small>
      </section>
    </div>
  );
}
