import type { Product } from "../data/products";
import AddToQuoteButton from "./AddToQuoteButton";
import { CollectionProductLink } from "./CollectionTracking";

export default function ProductCard({ product, collectionSlug }: { product: Product; collectionSlug?: string }) {
  return (
    <article className="product-card catalog-card">
      <CollectionProductLink slug={collectionSlug} styleCode={product.code} className="product-image" href={`/products/${product.slug}/`}>
        <img src={`/catalog-thumbs/${product.slug}.webp`} alt={`${product.code} ${product.name}`} loading="lazy" decoding="async" width={640} height={640} />
      </CollectionProductLink>
      <div className="product-meta">
        <span className="product-tag">{product.closure}</span>
        <span className="product-code">{product.code} / {product.sourceModel}</span>
      </div>
      <h3><CollectionProductLink slug={collectionSlug} styleCode={product.code} href={`/products/${product.slug}/`}>{product.name}</CollectionProductLink></h3>
      <p>{product.shortDescription}</p>
      <ul className="product-facts" aria-label={`${product.code} key facts`}>
        <li>{product.closure}</li><li>{product.size}</li><li>{product.colors.length} colors</li>
      </ul>
      <dl className="product-card-specs" aria-label={`${product.code} sourcing details`}>
        <div><dt>Upper</dt><dd>{product.upper}</dd></div>
        <div><dt>Sole</dt><dd>{product.sole}</dd></div>
        <div><dt>Product views</dt><dd>{product.images.length} images</dd></div>
      </dl>
      <small className="buyer-fit">Best fit: {product.buyerFit}</small>
      <div className="product-card-actions"><CollectionProductLink slug={collectionSlug} styleCode={product.code} className="product-detail-link" href={`/products/${product.slug}/`}>View product details <span aria-hidden="true">→</span></CollectionProductLink><AddToQuoteButton product={product} compact /></div>
    </article>
  );
}
