/* eslint-disable @next/next/no-img-element */
"use client";
import type { Product } from "../data/products";
import { localizedPath } from "../lib/public-locales";
import { colourImage, galleryImage, withColour } from "../lib/product-colours";
import ProductColourOptions, { useProductColour } from "./ProductColourOptions";
import { productNameZh } from "../data/products-zh";

export default function HeroProductPreview({ product, locale }: {product: Product; locale: "en" | "zh"}) {
  const { id } = useProductColour(product);
  const zh = locale === "zh";
  return <div className="studio-product-cover">
    <div className="cover-heading"><span>{zh ? "产品实拍 / 配色预览" : "THE COLLECTION / COLOUR STUDY"}</span><span>{product.code}</span></div>
    <a className="cover-main" href={withColour(localizedPath(`/products/${product.slug}`,locale),id)}>
      <img src={galleryImage(product.images[colourImage(product,id)])} alt={zh ? productNameZh(product) : product.name} width={1000} height={1000} fetchPriority="high" />
      <span><strong>{product.code}</strong>{zh ? productNameZh(product) : product.name}<b aria-hidden="true">↗</b></span>
    </a>
    <ProductColourOptions product={product} locale={locale} />
    <p className="cover-footnote">{zh ? "点击配色查看实拍 · 进入单款了解规格与样品" : "Explore the colours. Open the style for specifications and samples."}</p>
  </div>;
}
