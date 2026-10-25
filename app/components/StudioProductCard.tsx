/* eslint-disable @next/next/no-img-element */
"use client";
import type { Product } from "../data/products";
import { closureZh, productNameZh } from "../data/products-zh";
import { localizedPath, type PublicLocale } from "../lib/public-locales";
import AddToQuoteButton from "./AddToQuoteButton";
import { CollectionProductLink } from "./CollectionTracking";
import ProductColourOptions, { useProductColour } from "./ProductColourOptions";
import { colourImage, galleryImage, withColour } from "../lib/product-colours";

export default function StudioProductCard({ product, locale = "en", collectionSlug }: { product: Product; locale?: PublicLocale; collectionSlug?: string }) {
  const zh = locale === "zh";
  const name = zh ? productNameZh(product) : product.name;
  const { id, colour } = useProductColour(product);
  const href = withColour(localizedPath(`/products/${product.slug}`, locale), id);
  return <article className="product-card catalog-card studio-card">
    <CollectionProductLink slug={collectionSlug} styleCode={product.code} className="product-image" href={href}>
      <img src={id ? galleryImage(product.images[colourImage(product, id)]) : `/catalog-thumbs/${product.slug}.webp`} alt={`${name}${colour && colour.imageIndex !== null ? ` · ${colour.name}` : ""}`} loading="lazy" decoding="async" width={640} height={640} />
      <span className="card-image-action" aria-hidden="true">↗</span>
    </CollectionProductLink>
    <div className="product-meta"><span className="product-code">{product.code}</span><span>{zh ? closureZh(product.closure) : product.closure}</span></div>
    <h3><CollectionProductLink slug={collectionSlug} styleCode={product.code} href={href}>{name}</CollectionProductLink></h3>
    <p className="card-size">{product.size}</p>
    <ProductColourOptions product={product} locale={locale} />
    <div className="product-card-actions"><CollectionProductLink slug={collectionSlug} styleCode={product.code} className="product-detail-link" href={href}>{zh ? "查看详情" : "View details"} <span aria-hidden="true">↗</span></CollectionProductLink><AddToQuoteButton product={product} compact locale={locale} /></div>
  </article>;
}
