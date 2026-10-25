"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Product } from "../data/products";
import {
  buyerFitZh,
  closureZh,
  colorZh,
  factZh,
  productNameZh,
} from "../data/products-zh";
import { parseComparisonCodes } from "../lib/comparison-link";
import { addProductToQuote, readQuoteList } from "../lib/quote-list";
import { trackEvent } from "../lib/tracking";
import ChineseProductCard from "./ChineseProductCard";
import { ComparisonColour } from "./ProductColourOptions";
import ComparisonShareActions from "./ComparisonShareActions";
import CatalogFilters from "./CatalogFilters";
import { useCatalogSelection } from "./useCatalogSelection";
import { matchingColour } from "../lib/catalog-selection";

const PAGE_SIZE = 12;

export default function ChineseProductCatalog({
  products,
}: {
  products: Product[];
}) {
  const { selection, update, reset, visible, shown } = useCatalogSelection(products);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareCodes, setCompareCodes] = useState<string[]>([]);
  const [message, setMessage] = useState(
    "选择 2–4 款，比较配色、尺码与产品规格。",
  );
  const trackedSharedComparison = useRef("");
  useEffect(() => {
    if (compareOpen) document.getElementById("product-comparison")?.scrollIntoView({ block: "start" });
  }, [compareOpen]);
  const compared = compareCodes
    .map((code) => products.find((product) => product.code === code))
    .filter((product): product is Product => Boolean(product));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const codes = parseComparisonCodes(
        params.get("compare") || "",
        products.map((product) => product.code),
      );
      if (codes.length >= 2) {
        const styleCodes = codes.join(",");
        setCompareCodes(codes);
        setCompareOpen(true);
        setMessage(`已载入分享的产品比较 · ${codes.length}/4款。`);
        if (trackedSharedComparison.current !== styleCodes) {
          trackedSharedComparison.current = styleCodes;
          trackEvent("comparison_open", {
            styleCodes,
            styleCount: codes.length,
            context: "catalog_zh",
          });
        }
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [products]);

  function toggle(product: Product) {
    if (compareCodes.includes(product.code)) {
      setCompareCodes((current) =>
        current.filter((code) => code !== product.code),
      );
      setMessage(`已从比较中移除${product.code}。`);
      return;
    }
    if (compareCodes.length >= 4) {
      setMessage("每次最多比较4款，请先移除一款。 ");
      return;
    }
    const next = [...compareCodes, product.code];
    setCompareCodes(next);
    setMessage(`已加入${product.code}，当前${next.length}/4款。`);
    trackEvent("product_compare", {
      styleCode: product.code,
      styleCount: next.length,
      context: "catalog_zh",
    });
  }

  function addCompared() {
    const existing = new Set(readQuoteList().map((line) => line.code));
    let inserted = 0;
    let already = 0;
    for (const product of compared) {
      if (existing.has(product.code)) already += 1;
      if (addProductToQuote(product)) inserted += 1;
      trackEvent("quote_list_add", {
        styleCode: product.code,
        context: "comparison_zh",
      });
    }
    setMessage(
      `已新增${inserted}款到询价单${already ? `，另有${already}款原已存在` : ""}。`,
    );
  }

  return (
    <>
      <CatalogFilters products={products} selection={selection} update={update} reset={reset} count={visible.length} shown={shown.length} locale="zh" />
      {compared.length >= 2 && !compareOpen && <button className="mobile-compare-shortcut" type="button" onClick={() => setCompareOpen(true)}>对比所选 {compared.length} 款 ↗</button>}
      <aside className={`compare-tray${compareCodes.length ? " has-selection" : ""}`}>
        <div>
          <strong>产品比较</strong>
          <span>{message}</span>
        </div>
        <div>
          {compared.map((product) => (
            <button
              key={product.code}
              type="button"
              onClick={() => toggle(product)}
            >
              {product.code} ×
            </button>
          ))}
          {compareCodes.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setCompareCodes([]);
                setMessage("比较已清空。 ");
              }}
            >
              清空
            </button>
          )}
        </div>
        {compared.length >= 2 && <button type="button" className="compare-open" aria-expanded={compareOpen} aria-controls="product-comparison" onClick={() => setCompareOpen(open => !open)}>{compareOpen ? "收起对比" : "查看对比"} ↗</button>}
      </aside>
      {compared.length >= 2 && compareOpen ? (
        <ComparisonShareActions codes={compareCodes} locale="zh" />
      ) : null}
      {compared.length >= 2 && compareOpen ? (
        <section
          id="product-comparison" className="product-comparison comparison-zh"
          aria-label="已选产品比较"
        >
          <header className="comparison-print-header">
            <p>贝强鞋业 · 买家产品评审</p>
            <h1>产品比较候选清单</h1>
            <span>
              已选款号：{compared.map((product) => product.code).join(" · ")}
            </span>
          </header>
          <div className="comparison-heading">
            <div>
              <p className="eyebrow">采购选款</p>
              <h2>对比所选鞋款</h2>
              <p>先用现有产品资料筛选候选款；数量、颜色、材料执行和时间等信息按您的具体需求确认。</p>
            </div>
            <div>
              <button
                className="button button-small"
                type="button"
                onClick={addCompared}
              >
                全部加入询价
              </button>
              <Link className="text-link" href="/zh/request-quote/">
                打开询价单 →
              </Link>
            </div>
          </div>
          <p className="comparison-mobile-hint">左右滑动查看其他所选鞋款 →</p>
          <div className="comparison-scroll">
            <table>
              <thead>
                <tr>
                  <th>比较项目</th>
                  {compared.map((product) => (
                    <th key={product.code}>
                      <ComparisonColour product={product} locale="zh" />
                      <Link href={`/zh/products/${product.slug}/`}>
                        {product.code}
                      </Link>

                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>产品</th>
                  {compared.map((product) => (
                    <td key={product.code}>{productNameZh(product)}</td>
                  ))}
                </tr>
                <tr>
                  <th>穿脱结构</th>
                  {compared.map((product) => (
                    <td key={product.code}>{closureZh(product.closure)}</td>
                  ))}
                </tr>
                <tr>
                  <th>鞋面</th>
                  {compared.map((product) => (
                    <td key={product.code}>{factZh(product.upper)}</td>
                  ))}
                </tr>
                <tr>
                  <th>鞋底</th>
                  {compared.map((product) => (
                    <td key={product.code}>{factZh(product.sole)}</td>
                  ))}
                </tr>
                <tr>
                  <th>尺码范围</th>
                  {compared.map((product) => (
                    <td key={product.code}>{product.size}</td>
                  ))}
                </tr>
                <tr>
                  <th>配色范围</th>
                  {compared.map((product) => (
                    <td key={product.code}>
                      {product.colors.map(colorZh).join(" · ")}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th>适合买家</th>
                  {compared.map((product) => (
                    <td key={product.code}>{buyerFitZh(product)}</td>
                  ))}
                </tr>
                <tr className="comparison-confirm">
                  <th>报价前确认</th>
                  {compared.map((product) => (
                    <td key={product.code}>
                      <ul>
                        {product.confirmBeforeQuote.map((item) => (
                          <li key={item}>{factZh(item)}</li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
                <tr className="comparison-review-row">
                  <th>选款意见</th>
                  {compared.map((product) => (
                    <td key={product.code}>
                      □ 首选
                      <br />□ 备选
                      <br />□ 暂缓 / 移除
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <footer className="comparison-print-footer">
            <strong>泉州贝强鞋业服饰有限公司</strong>
            <span>
              shepeiqiang@gmail.com · WhatsApp +86 189 5980 5256 ·
              www.beiqiang.online
            </span>
            <p>
              本清单用于买家选款评审，不是报价、采购订单、合同、Trade
              Assurance订单、付款请求或生产授权。最终规格、数量、尺码配比、包装、价格、贸易条款、付款与交付必须以正式书面文件为准。
            </p>
          </footer>
        </section>
      ) : null}
      {visible.length ? (
        <>
          <div className="product-grid catalog-grid">
            {shown.map((product) => (
              <div
                className={`compare-card-wrap ${compareCodes.includes(product.code) ? "compare-selected" : ""}`}
                key={product.code}
              >
                <button
                  className="compare-toggle"
                  type="button"
                  aria-pressed={compareCodes.includes(product.code)}
                  onClick={() => toggle(product)}
                >
                  {compareCodes.includes(product.code) ? "✓ 比较中" : "+ 比较"}
                </button>
                <ChineseProductCard product={product} preferredColour={matchingColour(product, selection.colour)} />
              </div>
            ))}
          </div>
          {shown.length < visible.length ? (
            <div className="catalog-load-more">
              <p>还有{visible.length - shown.length}款匹配产品。</p>
              <button
                className="button"
                type="button"
                onClick={() =>
                  update({ limit: selection.limit + PAGE_SIZE })
                }
              >
                查看更多产品
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="catalog-empty">
          <button className="button button-secondary" type="button" onClick={reset}>{"清除筛选，查看全部鞋款"}</button>
          <p>当前在线选款中没有匹配产品。</p>
          <Link
            className="text-link"
            href="/zh/request-quote/?program=reference-style"
          >
            提交目标款给工厂审核 →
          </Link>
        </div>
      )}
      <details className="catalog-style-index">
        <summary>浏览全部{products.length}个当前产品款号</summary>
        <nav aria-label="全部当前产品页">
          {products.map((product) => (
            <Link key={product.code} href={`/zh/products/${product.slug}/`}>
              {product.code}
            </Link>
          ))}
        </nav>
      </details>
    </>
  );
}
