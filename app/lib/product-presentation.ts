import type { Product } from "../data/products";
import type { PublicLocale } from "./public-locales";

// Buyer-facing wording of existing product facts; no inventory or market-size conversion.
type Presentation = { summary: string; highlights: string[] };
const copy: Record<string, Record<PublicLocale, Presentation>> = {
  BQ008: {
    en: { summary: "Mesh textile with a thick-sole profile and lace-up fastening. Four colour combinations in EU 36–45 for sport-casual assortments.", highlights: ["Mesh textile upper", "Thick-sole profile", "Four colour combinations · EU 36–45"] },
    zh: { summary: "网布鞋面搭配厚底轮廓与系带结构，提供四种配色、EU 36–45，适合运动休闲系列选款。", highlights: ["网布鞋面", "厚底轮廓与系带结构", "四种配色 · EU 36–45"] },
    de: { summary: "Mesh-Obermaterial mit markanter Sohle und Schnürung. Vier Farbkombinationen in EU 36–45 für sportliche Freizeitsortimente.", highlights: ["Mesh-Obermaterial", "Markantes Sohlenprofil mit Schnürung", "Vier Farbkombinationen · EU 36–45"] },
    fr: { summary: "Tige en mesh, semelle épaisse et fermeture à lacets. Quatre coloris en EU 36–45 pour les collections sport et loisirs.", highlights: ["Tige en mesh", "Silhouette à semelle épaisse et lacets", "Quatre coloris · EU 36–45"] },
    es: { summary: "Empeine de malla, silueta de suela gruesa y cierre de cordones. Cuatro combinaciones de color en EU 36–45 para colecciones deportivas informales.", highlights: ["Empeine de malla", "Silueta de suela gruesa y cordones", "Cuatro combinaciones de color · EU 36–45"] },
  },
  BQ009: {
    en: { summary: "Stretch-knit lace-up with an EVA sole and mesh lining in the listed configuration. Four colours in EU 35–45; confirm materials for your selection.", highlights: ["Stretch-knit upper; mesh lining for the listed configuration", "EVA sole and lace-up fastening", "Four colour options · EU 35–45"] },
    zh: { summary: "弹力针织鞋面搭配系带结构与EVA鞋底，所列配置采用网布内里。提供四种配色、EU 35–45；具体材料以所选订单配置为准。", highlights: ["弹力针织鞋面；所列配置采用网布内里", "EVA鞋底与系带结构", "四种配色 · EU 35–45"] },
    de: { summary: "Stretchstrick-Schnürschuh mit EVA-Sohle und Meshfutter in der angegebenen Ausführung. Vier Farben in EU 35–45; Material der gewählten Ausführung bestätigen.", highlights: ["Stretchstrick-Obermaterial; Meshfutter in der angegebenen Ausführung", "EVA-Sohle und Schnürung", "Vier Farben · EU 35–45"] },
    fr: { summary: "Chaussure à lacets en maille extensible avec semelle EVA et doublure mesh pour la configuration indiquée. Quatre coloris en EU 35–45 ; matière à confirmer selon la sélection.", highlights: ["Tige en maille extensible ; doublure mesh pour la configuration indiquée", "Semelle en EVA et fermeture à lacets", "Quatre coloris · EU 35–45"] },
    es: { summary: "Calzado de cordones en punto elástico con suela EVA y forro de malla en la configuración indicada. Cuatro colores en EU 35–45; confirmar materiales para la selección.", highlights: ["Empeine de punto elástico; forro de malla en la configuración indicada", "Suela de EVA y cierre de cordones", "Cuatro colores · EU 35–45"] },
  },
  BQ031: {
    en: { summary: "A wide toe box, stretch-knit upper and EVA sole, with lace-up fastening. Five colour combinations in EU 38–47; confirm overall fit and size ratios on a sample.", highlights: ["Wide toe box; overall last width confirmed on a sample", "Stretch-knit upper and EVA sole", "Five colour combinations · EU 38–47"] },
    zh: { summary: "宽鞋头搭配弹力针织鞋面、EVA鞋底与系带结构，提供五种配色、EU 38–47；整体合脚程度与尺码配比按样品确认。", highlights: ["宽鞋头；整鞋楦宽按样品确认", "弹力针织鞋面与EVA鞋底", "五种配色 · EU 38–47"] },
    de: { summary: "Breiter Zehenbereich, Stretchstrick-Obermaterial, EVA-Sohle und Schnürung. Fünf Farbkombinationen in EU 38–47; Passform und Größenverteilung am Muster bestätigen.", highlights: ["Breiter Zehenbereich; gesamte Leistenweite am Muster bestätigen", "Stretchstrick-Obermaterial und EVA-Sohle", "Fünf Farbkombinationen · EU 38–47"] },
    fr: { summary: "Avant-pied large, tige en maille extensible, semelle en EVA et lacets. Cinq coloris en EU 38–47 ; confirmer le chaussant et la répartition des pointures sur échantillon.", highlights: ["Avant-pied large ; largeur globale de forme à confirmer sur échantillon", "Tige en maille extensible et semelle en EVA", "Cinq coloris · EU 38–47"] },
    es: { summary: "Puntera amplia, empeine de punto elástico, suela de EVA y cordones. Cinco combinaciones de color en EU 38–47; confirmar el ajuste y la distribución de tallas con una muestra.", highlights: ["Puntera amplia; ancho total de la horma a confirmar con una muestra", "Empeine de punto elástico y suela de EVA", "Cinco combinaciones de color · EU 38–47"] },
  },
};
export function productPresentation(product: Product, locale: PublicLocale): Presentation | undefined {
  return copy[product.code]?.[locale];
}
export const productOrderCopy: Record<PublicLocale, { title: string; text: string }> = {
  en: { title: "Order options", text: "Ask about small mixed-size orders for existing styles, or branding and packaging for your label. Share your colours, size mix, quantity and destination so we can confirm the available configuration, pricing and delivery." },
  zh: { title: "采购与品牌化", text: "现款可咨询小量混码，也可讨论品牌标识与包装方案。提供颜色、尺码配比、数量和目的地，便于确认可供配置、报价与交期。" },
  de: { title: "Bestellmöglichkeiten", text: "Fragen Sie nach kleinen Bestellungen bestehender Modelle mit gemischten Größen oder nach Markenkennzeichnung und Verpackung für Ihre Marke. Nennen Sie Farben, Größenverteilung, Menge und Zielort, damit wir Ausführung, Preis und Lieferzeit bestätigen können." },
  fr: { title: "Options de commande", text: "Renseignez-vous sur les petites commandes de modèles existants en pointures assorties, ou sur le marquage et l’emballage pour votre marque. Précisez les coloris, la répartition des pointures, la quantité et la destination pour confirmer la configuration, le prix et le délai." },
  es: { title: "Opciones de pedido", text: "Consulte sobre pedidos pequeños de modelos existentes con tallas combinadas, o sobre la marca y el embalaje para su propia etiqueta. Indique colores, distribución de tallas, cantidad y destino para confirmar la configuración, el precio y el plazo de entrega." },
};
