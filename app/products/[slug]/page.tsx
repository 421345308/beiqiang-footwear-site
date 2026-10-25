import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { products, getProduct } from "../../data/products";
import { pageAlternates, siteOrigin } from "../../lib/public-locales";
import StudioProductDetail from "../../components/StudioProductDetail";
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return products.map(p=>({slug:p.slug})); }
export async function generateMetadata({params}: Props): Promise<Metadata> {
 const product=getProduct((await params).slug); if(!product) return {};
 const name=product.name;
 const description=`${product.name}. ${product.size}, ${product.colors.length} colours. View product specifications, images and wholesale inquiry options.`;
 const alternates=pageAlternates(`/products/${product.slug}`,"en");
 const image=`${siteOrigin}/catalog-web/${product.slug}/01_main.webp`;
 return { title:`${name} · ${product.code} | Beiqiang`, description, alternates,
 openGraph:{title:name,description,url:alternates.canonical,images:[{url:image,alt:name}]},
 twitter:{card:"summary_large_image",title:name,description,images:[image]} };
}
export default async function ProductPage({params}: Props) { const product=getProduct((await params).slug); if(!product) notFound(); return <StudioProductDetail product={product} locale="en" />; }
