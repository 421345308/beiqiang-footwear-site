import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { products, getProduct } from "../../../data/products";
import { productNameZh, productSummaryZh } from "../../../data/products-zh";
import { pageAlternates, siteOrigin } from "../../../lib/public-locales";
import StudioProductDetail from "../../../components/StudioProductDetail";
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return products.map(p=>({slug:p.slug})); }
export async function generateMetadata({params}: Props): Promise<Metadata> {
 const product=getProduct((await params).slug); if(!product) return {};
 const name=productNameZh(product);
 const description=productSummaryZh(product);
 const alternates=pageAlternates(`/products/${product.slug}`,"zh");
 const image=`${siteOrigin}/catalog-web/${product.slug}/01_main.webp`;
 return { title:`${name} · ${product.code} | Beiqiang`, description, alternates,
 openGraph:{title:name,description,url:alternates.canonical,images:[{url:image,alt:name}]},
 twitter:{card:"summary_large_image",title:name,description,images:[image]} };
}
export default async function ProductPage({params}: Props) { const product=getProduct((await params).slug); if(!product) notFound(); return <StudioProductDetail product={product} locale="zh" />; }
