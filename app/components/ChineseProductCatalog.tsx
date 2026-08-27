/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Product } from "../data/products";
import { buyerFitZh, closureZh, colorZh, factZh, productNameZh } from "../data/products-zh";
import { parseComparisonCodes } from "../lib/comparison-link";
import { addProductToQuote, readQuoteList } from "../lib/quote-list";
import { trackEvent } from "../lib/tracking";
import ChineseProductCard from "./ChineseProductCard";
import ComparisonShareActions from "./ComparisonShareActions";

export default function ChineseProductCatalog({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [closure, setClosure] = useState("全部");
  const [compareCodes, setCompareCodes] = useState<string[]>([]);
  const [message, setMessage] = useState("请选择2至4款产品进行并排比较。所有未知信息继续保留为待确认。 ");
  const trackedSharedComparison = useRef("");
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesClosure = closure === "全部" || closureZh(product.closure) === closure;
      const haystack = [product.code, product.sourceModel, product.name, productNameZh(product), product.group, ...product.colors, ...product.colors.map(colorZh)].join(" ").toLowerCase();
      return matchesClosure && (!normalized || haystack.includes(normalized));
    });
  }, [closure, products, query]);
  const compared = compareCodes.map((code) => products.find((product) => product.code === code)).filter((product): product is Product => Boolean(product));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const codes = parseComparisonCodes(new URLSearchParams(window.location.search).get("compare") || "", products.map((product) => product.code));
      if (codes.length >= 2) {
        const styleCodes = codes.join(",");
        setCompareCodes(codes); setMessage(`已载入分享的产品比较 · ${codes.length}/4款。`);
        if (trackedSharedComparison.current !== styleCodes) { trackedSharedComparison.current = styleCodes; trackEvent("comparison_open", { styleCodes, styleCount: codes.length, context: "catalog_zh" }); }
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [products]);

  function toggle(product: Product) {
    if (compareCodes.includes(product.code)) { setCompareCodes((current) => current.filter((code) => code !== product.code)); setMessage(`已从比较中移除${product.code}。`); return; }
    if (compareCodes.length >= 4) { setMessage("每次最多比较4款，请先移除一款。 "); return; }
    const next = [...compareCodes, product.code];
    setCompareCodes(next);
    setMessage(`已加入${product.code}，当前${next.length}/4款。`);
    trackEvent("product_compare", { styleCode: product.code, styleCount: next.length, context: "catalog_zh" });
  }

  function addCompared() {
    const existing = new Set(readQuoteList().map((line) => line.code));
    let inserted = 0;
    let already = 0;
    for (const product of compared) {
      if (existing.has(product.code)) already += 1;
      else if (addProductToQuote(product)) inserted += 1;
      trackEvent("quote_list_add", { styleCode: product.code, context: "comparison_zh" });
    }
    setMessage(`已新增${inserted}款到询价单${already ? `，另有${already}款原已存在` : ""}。`);
  }

  return (
    <>
      <div className="catalog-tools" aria-label="产品目录筛选">
        <label><span>按款号、源款号或产品搜索</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例如 BQ009、L1026、套穿" /></label>
        <label><span>穿脱结构</span><select value={closure} onChange={(event) => setClosure(event.target.value)}><option>全部</option><option>套穿</option><option>系带</option></select></label>
        <strong>{visible.length}款</strong>
      </div>
      <aside className="compare-tray"><div><strong>产品比较</strong><span>{message}</span></div><div>{compared.map((product) => <button key={product.code} type="button" onClick={() => toggle(product)}>{product.code} ×</button>)}{compareCodes.length > 0 && <button type="button" onClick={() => { setCompareCodes([]); setMessage("比较已清空。 "); }}>清空</button>}</div></aside>
      {compared.length >= 2 ? <ComparisonShareActions codes={compareCodes} locale="zh" /> : null}
      {compared.length >= 2 ? (
        <section className="product-comparison" aria-label="已选产品比较">
          <div className="comparison-heading"><div><p className="eyebrow">采购选款</p><h2>比较已确认事实与报价前待确认项</h2><p>不根据外观推断材质、宽度、销量或医疗效果。</p></div><div><button className="button button-small" type="button" onClick={addCompared}>全部加入询价</button><Link className="text-link" href="/zh/request-quote/">打开询价单 →</Link></div></div>
          <div className="comparison-scroll"><table><thead><tr><th>比较项目</th>{compared.map((product) => <th key={product.code}><img src={`/catalog-thumbs/${product.slug}.webp`} alt="" loading="lazy" decoding="async" width={640} height={640} /><Link href={`/zh/products/${product.slug}/`}>{product.code}</Link><small>{product.sourceModel}</small></th>)}</tr></thead><tbody><tr><th>产品</th>{compared.map((product) => <td key={product.code}>{productNameZh(product)}</td>)}</tr><tr><th>穿脱结构</th>{compared.map((product) => <td key={product.code}>{closureZh(product.closure)}</td>)}</tr><tr><th>鞋面</th>{compared.map((product) => <td key={product.code}>{factZh(product.upper)}</td>)}</tr><tr><th>鞋底方向</th>{compared.map((product) => <td key={product.code}>{factZh(product.sole)}</td>)}</tr><tr><th>尺码方向</th>{compared.map((product) => <td key={product.code}>{product.size}</td>)}</tr><tr><th>已整理颜色</th>{compared.map((product) => <td key={product.code}>{product.colors.map(colorZh).join(" · ")}</td>)}</tr><tr><th>适合买家</th>{compared.map((product) => <td key={product.code}>{buyerFitZh(product)}</td>)}</tr><tr className="comparison-confirm"><th>报价前确认</th>{compared.map((product) => <td key={product.code}><ul>{product.confirmBeforeQuote.map((item) => <li key={item}>{factZh(item)}</li>)}</ul></td>)}</tr></tbody></table></div>
        </section>
      ) : null}
      {visible.length ? <div className="product-grid catalog-grid">{visible.map((product) => <div className={`compare-card-wrap ${compareCodes.includes(product.code) ? "compare-selected" : ""}`} key={product.code}><button className="compare-toggle" type="button" aria-pressed={compareCodes.includes(product.code)} onClick={() => toggle(product)}>{compareCodes.includes(product.code) ? "✓ 比较中" : "+ 比较"}</button><ChineseProductCard product={product} /></div>)}</div> : <p className="catalog-empty">没有匹配产品，请尝试其他款号、名称或结构。</p>}
    </>
  );
}
