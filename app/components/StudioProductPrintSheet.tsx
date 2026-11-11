/* eslint-disable @next/next/no-img-element */
"use client";

import type { Product } from "../data/products";
import { isInLineSheetSnapshot } from "../data/line-sheet-selection";
import { colorZh } from "../data/products-zh";
import { productMediaUrl } from "../lib/product-media-url";
import { colourOverview, withColour } from "../lib/product-colours";
import { useProductColour } from "./ProductColourOptions";

export default function StudioProductPrintSheet({ product, name, description, upper, sole, sizeNote, url, locale }: {
  product: Product; name: string; description: string; upper: string; sole: string;
  sizeNote?: string; url: string; locale: "en" | "zh";
}) {
  const zh = locale === "zh";
  const t = (en: string, cn: string) => zh ? cn : en;
  const { id, colour } = useProductColour(product);
  const validImage = (index: number | null | undefined): index is number => index != null && Number.isInteger(index) && Boolean(product.images[index]);
  const missingPhoto = Boolean(colour && !validImage(colour.imageIndex));
  const includePhoto = isInLineSheetSnapshot(product.code);
  const overview = colourOverview(product);
  const imageIndex = colour ? (validImage(colour.imageIndex) ? colour.imageIndex : validImage(overview) ? overview : null) : 0;
  const imageAlt = missingPhoto ? t("Colour overview", "配色概览") : `${name}${colour ? ` · ${zh ? colorZh(colour.name) : colour.name}` : ""}`;
  return <section className="product-print-sheet" aria-label={t("Product specification sheet","产品资料表")}>
      <header><p>BEIQIANG FOOTWEAR</p><h1>{name}</h1><p>{product.code}</p></header>
      <div className="studio-print-body">{includePhoto ? (imageIndex !== null && <img src={productMediaUrl(product.images[imageIndex])} alt={imageAlt} />) : <p>{t("View the product photo on the website.", "产品图片请在网站查看。")}</p>}<div>{missingPhoto && <p>{t("No individual photo for this colour. Request photos before confirming this colour.", "此色暂无单独实拍，确认配色前请咨询图片。")}{includePhoto && imageIndex !== null && t(" Photo: colour overview.", " 图片为配色概览。")}</p>}<p>{description}</p><dl className="studio-specs">{upper && <div><dt>{t("Upper","鞋面")}</dt><dd>{upper}</dd></div>}{sole && <div><dt>{t("Sole","鞋底")}</dt><dd>{sole}</dd></div>}{product.size && <div><dt>{t("Sizes","尺码")}</dt><dd>{product.size}{product.sizeNote && <small className="studio-size-note">{sizeNote}</small>}</dd></div>}<div><dt>{t("Colours","配色")}</dt><dd>{colour ? (zh ? colorZh(colour.name) : colour.name) : product.colors.map(c=>zh ? colorZh(c) : c).join(" · ")}</dd></div></dl></div></div>
      <p>{t("Product reference only. This sheet is not a quotation or order confirmation. Confirm specifications, quantities, prices, sample terms and delivery in the written quotation.","本资料仅供选型，不构成报价或订单确认。具体规格、数量、价格、样品及交付要求以书面报价为准。")}</p><p>Quanzhou Beiqiang Footwear & Apparel Co., Ltd. · shepeiqiang@gmail.com · +86 189 5980 5256</p><p>{withColour(url, id)}</p>
    </section>;
}
