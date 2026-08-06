import Link from "next/link";
import type { Product } from "../data/products";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card catalog-card">
      <Link className="product-image" href={`/products/${product.slug}/`}>
        <img src={product.images[0]} alt={`${product.code} ${product.name}`} loading="lazy" />
      </Link>
      <div className="product-meta">
        <span className={`product-tag tier-${product.tier.toLowerCase()}`}>Tier {product.tier}</span>
        <span className="product-code">{product.code} / {product.sourceModel}</span>
      </div>
      <h3><Link href={`/products/${product.slug}/`}>{product.name}</Link></h3>
      <p>{product.shortDescription}</p>
      <ul className="product-facts" aria-label={`${product.code} key facts`}>
        <li>{product.closure}</li><li>{product.size}</li><li>{product.colors.length} colors</li>
      </ul>
      <small className="buyer-fit">Best fit: {product.buyerFit}</small>
      <Link className="product-detail-link" href={`/products/${product.slug}/`}>View product evidence <span aria-hidden="true">→</span></Link>
    </article>
  );
}
