import { getCollection, productsInCollection } from "../data/products";
import { europeCollection } from "../data/europe-collections";
import { productTitle } from "../data/europe-products";
import { t, type EuropeLocale } from "../data/europe-copy";
import { localizedPath, siteOrigin } from "../lib/public-locales";
import { EuropeCard } from "./EuropeProduct";

export default function EuropeCollection({ slug, locale }: { slug: string; locale: EuropeLocale }) {
  const collection = getCollection(slug)!;
  const copy = europeCollection(slug, locale)!;
  const items = productsInCollection(collection.slug);
  const href = (path: string) => localizedPath(path, locale);
  const schema = {
    "@context": "https://schema.org", "@type": "CollectionPage", name: copy.title,
    description: copy.description, inLanguage: locale, url: `${siteOrigin}${href(`/collections/${slug}`)}`,
    mainEntity: { "@type": "ItemList", numberOfItems: items.length, itemListElement: items.map((product, index) => ({
      "@type": "ListItem", position: index + 1, name: `${product.code} ${productTitle(product, locale)}`,
      url: `${siteOrigin}${href(`/products/${product.slug}`)}`,
    })) },
  };
  const labels = {
    de: { options: "Modelle ansehen", order: "Muster und Bestellung", details: "Bestehende Modelle können in kleinen Mengen mit gemischten Farben und Größen angefragt werden. Logo, Etiketten und Verpackung besprechen wir passend zum Modell. Preis, Verfügbarkeit und Lieferzeit bestätigen wir für Ihre Bestellung." },
    fr: { options: "Découvrir les modèles", order: "Échantillons et commande", details: "Les modèles existants peuvent être demandés en petites quantités avec plusieurs coloris et pointures. Le logo, les étiquettes et l’emballage sont étudiés selon le modèle. Le prix, la disponibilité et le délai sont confirmés pour votre commande." },
    es: { options: "Ver los modelos", order: "Muestras y pedido", details: "Puede consultar pedidos pequeños de modelos existentes con colores y tallas combinados. Estudiamos el logotipo, las etiquetas y el embalaje según el modelo. El precio, la disponibilidad y el plazo se confirman para cada pedido." },
  }[locale];
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <section className="europe-content europe-editorial">
      <nav className="studio-breadcrumb"><a href={href("/")}>{t(locale, "home")}</a><span>/</span><a href={href("/products")}>{t(locale, "products")}</a></nav>
      <p className="eyebrow">BEIQIANG · {items.length} {t(locale, "styleCount")}</p>
      <h1>{copy.title}</h1><p className="europe-lead">{copy.description}</p><p>{copy.guidance}</p>
      <h2>{labels.options}</h2>
      <div className="studio-product-grid">{items.map(product => <EuropeCard key={product.code} product={product} locale={locale} />)}</div>
    </section>
    <section className="europe-content europe-tinted"><h2>{labels.order}</h2><p className="europe-lead">{labels.details}</p><div className="europe-actions"><a className="button" href={href("/request-quote")}>{t(locale, "quote")} ↗</a><a href={href("/products")}>{t(locale, "browseAll")} ↗</a></div></section>
  </>;
}
