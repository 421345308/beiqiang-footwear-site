"use client";
import { useState } from "react";
import type { Product } from "../data/products";
import { closureZh } from "../data/products-zh";
import { discoveryCategories } from "../data/product-discovery";
import { colourFamilies, documentedSizes, filterCatalog, type CatalogSelection } from "../lib/catalog-selection";

export default function CatalogFilters({ products, selection, update, reset, count, shown, locale }: {
  products: Product[]; selection: CatalogSelection; update: (patch: Partial<CatalogSelection>) => void; reset: () => void; count: number; shown: number; locale: "en" | "zh";
}) {
  const zh = locale === "zh"; const t = (en: string, cn: string) => zh ? cn : en;
  const [open, setOpen] = useState(false); const [message, setMessage] = useState("");
  const sizes = [...new Set(products.flatMap(documentedSizes))].sort((a,b) => a-b);
  const closures = [...new Set(products.map(p => p.closure))];
  const selected = Object.entries(selection).filter(([key,value]) => ["q","direction","closure","colour","size"].includes(key) && value);
  const label = (key:string, value:string) => key === "direction" ? discoveryCategories.find(c=>c.direction===value)?.[zh?"zh":"en"] || value
    : key === "colour" ? colourFamilies.find(c=>c.id===value)?.[zh?"zh":"en"] || value : key === "size" ? `EU ${value}` : key === "closure" && zh ? closureZh(value as Product["closure"]) : value;
  const available = (patch: Partial<CatalogSelection>) => filterCatalog(products,{...selection,...patch}).length;
  async function share() {
    try { await navigator.clipboard.writeText(window.location.href); setMessage(t("Selection link copied.","已复制选款链接。")); }
    catch { setMessage(t("Copy this page’s address to share the selection.","复制浏览器地址即可分享当前选款条件。")); }
  }
  return <section className="catalog-selection" aria-label={t("Find products","产品筛选")}>
    <div className="catalog-selection-top"><label className="catalog-search"><span>{t("Search the collection","搜索产品")}</span><input type="search" maxLength={80} value={selection.q} onChange={e=>update({q:e.target.value})} placeholder={t("Style code, product or colour","款号、产品名称或颜色")} /></label>
      <button className="catalog-filter-toggle" type="button" aria-expanded={open} aria-controls="catalog-filter-panel" onClick={()=>setOpen(!open)}>{t("Filters","筛选条件")}{selected.length ? ` · ${selected.length}` : ""} {open ? "−" : "+"}</button>
      <label className="catalog-sort"><span>{t("Sort by","排序")}</span><select value={selection.sort} onChange={e=>update({sort:e.target.value})}><option value="code_asc">{t("Style code: ascending","款号升序")}</option><option value="code_desc">{t("Style code: descending","款号降序")}</option><option value="slip_on">{t("Slip-ons first","套穿款优先")}</option><option value="lace_up">{t("Lace-ups first","系带款优先")}</option></select></label>
    </div>
    <div id="catalog-filter-panel" className={`catalog-filter-panel${open ? " is-open" : ""}`}>
      <label><span>{t("Product category","产品类别")}</span><select value={selection.direction} onChange={e=>update({direction:e.target.value})}><option value="">{t("All categories","全部类别")}</option>{discoveryCategories.map(c=><option key={c.direction} value={c.direction}>{c[zh?"zh":"en"]} · {available({direction:c.direction})}</option>)}</select></label>
      <label><span>{t("Closure","穿脱方式")}</span><select value={selection.closure} onChange={e=>update({closure:e.target.value})}><option value="">{t("All closures","全部方式")}</option>{closures.map(c=><option key={c} value={c}>{zh?closureZh(c):c}</option>)}</select></label>
      <label><span>{t("Colour family","配色方向")}</span><select value={selection.colour} onChange={e=>update({colour:e.target.value})}><option value="">{t("All colours","全部配色")}</option>{colourFamilies.map(c=><option key={c.id} value={c.id}>{c[zh?"zh":"en"]} · {available({colour:c.id})}</option>)}</select></label>
      <label><span>{t("EU size range","EU 尺码范围")}</span><select value={selection.size} onChange={e=>update({size:e.target.value})}><option value="">{t("Any size","不限尺码")}</option>{sizes.map(size=><option key={size} value={size}>EU {size} · {available({size:String(size)})}</option>)}</select></label>
      <p className="catalog-range-note">{t("Size filters use the documented range. Confirm sizes and colours together before ordering.","尺码筛选依据款式资料范围，具体色码组合与供货情况需询价确认。")}</p>
    </div>
    <div className="catalog-active-filters">{selected.map(([key,value])=><button key={key} type="button" aria-label={t(`Remove ${label(key,String(value))}`,`移除${label(key,String(value))}`)} onClick={()=>update({[key]:""})}>{label(key,String(value))} <span aria-hidden="true">×</span></button>)}{selected.length>0 && <button type="button" className="catalog-reset" onClick={reset}>{t("Clear filters","清除筛选")}</button>}</div>
    <div className="catalog-results-bar"><strong role="status" aria-live="polite">{t(`${count} matching styles · ${shown} shown`,`${count} 款符合条件 · 已显示 ${shown} 款`)}</strong><button type="button" onClick={share}>{t("Share selection","分享选款条件")} ↗</button></div>{message && <p role="status">{message}</p>}
  </section>;
}
