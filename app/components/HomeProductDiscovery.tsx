/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "../data/products";
import { discoveryGroups, diverseProductPreview } from "../data/product-discovery";
import { localizedPath, type PublicLocale } from "../lib/public-locales";
import StudioProductCard from "./StudioProductCard";

export default function HomeProductDiscovery({ products, locale }: { products: Product[]; locale: PublicLocale }) {
  const zh = locale === "zh";
  const t = (en: string, cn: string) => zh ? cn : en;
  const href = (path: string) => localizedPath(path, locale);
  const groups = discoveryGroups(products);
  const [selected, setSelected] = useState<string>("all");
  const active = groups.find(group => group.slug === selected);
  const shown = active ? active.products.slice(0, 9) : diverseProductPreview(products);
  const count = active ? active.products.length : products.length;
  const destination = active ? href(`/collections/${active.slug}`) : href("/products");

  return <section className="studio-section studio-discovery" id="collections" aria-labelledby="discovery-title">
    <div className="studio-section-heading">
      <div><p className="eyebrow">{t("FIND YOUR PRODUCT","按需求选款")}</p><h2 id="discovery-title">{t("Start with the shoes you need.","先找到适合您的产品")}</h2></div>
      <p>{t("Browse by construction, fit or size range. Select a category to preview its styles, then open a product for full specifications.","按鞋型、鞋头结构或尺码范围浏览。选择产品方向，查看对应款式及单款规格。")}</p>
    </div>
    <nav className="discovery-categories" aria-label={t("Choose a product category","选择产品方向")}>
      {groups.map(group => <a key={group.slug} href={href(`/collections/${group.slug}`)} aria-current={selected === group.slug ? "true" : undefined} onClick={event => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault(); setSelected(group.slug);
      }}>
        <img src={`/catalog-thumbs/${group.cover}.webp`} alt="" width={160} height={160} loading="lazy" />
        <strong>{zh ? group.zh : group.en}</strong><span>{group.products.length} {t("styles","款")} <span aria-hidden="true">↗</span></span>
      </a>)}
    </nav>
    <div className="discovery-tools">
      <button type="button" className={selected === "all" ? "is-active" : ""} aria-pressed={selected === "all"} onClick={() => setSelected("all")}>{t("Across the collection","跨系列浏览")}</button>
      <form action={href("/products")} method="get" role="search"><label className="sr-only" htmlFor="home-product-search">{t("Search products or style codes","搜索产品或款号")}</label><input id="home-product-search" type="search" name="q" maxLength={80} placeholder={t("Search products or style codes","搜索产品名称、颜色或款号")} /><button type="submit">{t("Search","搜索")} ↗</button></form>
    </div>
    <div className="discovery-result-heading"><p role="status" aria-live="polite">{active ? (zh ? active.zh : active.en) : t("A selection across product ranges","不同产品方向展示")}<span> / {t(`Showing ${shown.length} of ${count} styles`, `展示 ${shown.length} 款，共 ${count} 款`)}</span></p><Link className="studio-text-link" href={destination}>{t("View the full range","查看完整系列")} ↗</Link></div>
    <div className="studio-product-grid">{shown.map(product => <StudioProductCard key={product.code} product={product} locale={locale} collectionSlug={active?.slug} />)}</div>
    <div className="discovery-bottom"><p>{t("Looking for a different construction, size range or reference style? Share your requirements for a sourcing review.","未找到所需鞋型、尺码或款式？可提供参考图片与采购要求，进一步评估开发或配套供货方案。")}</p><Link className="studio-text-link" href={href("/sourcing-review")}>{t("Send a product brief","提交选品需求")} ↗</Link></div>
  </section>;
}
