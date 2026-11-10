import type { Product } from "../data/products";
import type { PublicLocale } from "./public-locales";

// Buyer-facing wording of existing product facts; no inventory or market-size conversion.
type Presentation = { summary: string; highlights: string[] };
const copy: Record<string, Record<PublicLocale, Presentation>> = {
  "BQ-9002": {
    en: { summary: "Knit slip-on with a sculpted EVA sole, in light grey and dark grey. EU 38–47.", highlights: ["Knit upper and slip-on opening", "Sculpted EVA sole", "Two colours · EU 38–47"] },
    zh: { summary: "针织套穿鞋，搭配立体EVA鞋底，提供浅灰和深灰两种配色，尺码 EU 38–47。", highlights: ["针织鞋面与套穿结构", "立体EVA鞋底", "两种配色 · EU 38–47"] },
    de: { summary: "Strick-Slipper mit plastisch geformter EVA-Sohle in Hellgrau und Dunkelgrau. EU 38–47.", highlights: ["Strick-Obermaterial und Slip-on-Form", "Plastisch geformte EVA-Sohle", "Zwei Farben · EU 38–47"] },
    fr: { summary: "Chaussure à enfiler en maille avec semelle EVA sculptée, en gris clair et gris foncé. EU 38–47.", highlights: ["Tige en maille et forme à enfiler", "Semelle EVA sculptée", "Deux coloris · EU 38–47"] },
    es: { summary: "Calzado de punto sin cordones con suela EVA de relieve, en gris claro y gris oscuro. EU 38–47.", highlights: ["Empeine de punto y diseño sin cordones", "Suela EVA de relieve", "Dos colores · EU 38–47"] },
  },
  "BQ-LQ02503": {
    en: { summary: "Low-top outdoor-style shoes with a dial fastening, mesh panels and curved overlays. Available in black and tan, EU 39–48.", highlights: ["Dial-and-cord fastening with fabric guides", "Mesh panels and curved side overlays", "Rear pull loop and textured sole profile"] },
    zh: { summary: "低帮户外风休闲鞋，旋钮闭合搭配网面拼接与弧形侧片。黑色、棕黄色可选，尺码 EU 39–48。", highlights: ["旋钮鞋带与织带导环", "网面拼接与弧形侧片", "后跟提拉环与纹路鞋底"] },
    de: { summary: "Niedriger Freizeitschuh im Outdoor-Stil mit Drehverschluss, Mesh-Einsätzen und geschwungenen Besätzen. Schwarz und Hellbraun, EU 39–48.", highlights: ["Drehverschluss mit Kordel und Textilschlaufen", "Mesh-Einsätze und geschwungene Seitenpartien", "Fersenschlaufe und profilierte Sohle"] },
    fr: { summary: "Chaussure basse d'inspiration outdoor à molette, empiècements mesh et renforts incurvés. Noir et marron clair, EU 39–48.", highlights: ["Fermeture à molette et passants textiles", "Empiècements mesh et renforts latéraux incurvés", "Tirette arrière et semelle à relief"] },
    es: { summary: "Calzado bajo de estilo outdoor con cierre de dial, paneles de malla y refuerzos curvos. Negro y marrón claro, EU 39–48.", highlights: ["Cierre de dial con cordón y pasadores textiles", "Paneles de malla y refuerzos laterales curvos", "Tirador trasero y suela con relieve"] },
  },
  BQ001: {
    en: { summary: "Knit slip-on with a wide toe box and EVA sole. Three colours in {size}; check overall fit on a sample.", highlights: ["Knit upper and slip-on opening", "Wide toe box; confirm overall fit on a sample", "Three colours · {size}"] },
    zh: { summary: "针织套穿鞋，宽鞋头搭配EVA鞋底。提供三种配色、{size}；整鞋合脚程度请通过样品确认。", highlights: ["针织鞋面与套穿结构", "宽鞋头；整鞋合脚程度以样品确认", "三种配色 · {size}"] },
    de: { summary: "Strick-Slipper mit breitem Zehenbereich und EVA-Sohle. Drei Farben in {size}; Passform am Muster prüfen.", highlights: ["Strick-Obermaterial und Slip-on-Form", "Breiter Zehenbereich; Passform am Muster prüfen", "Drei Farben · {size}"] },
    fr: { summary: "Modèle à enfiler en maille avec avant-pied large et semelle EVA. Trois coloris en {size} ; vérifier le chaussant sur échantillon.", highlights: ["Tige en maille et forme à enfiler", "Avant-pied large ; chaussant à vérifier sur échantillon", "Trois coloris · {size}"] },
    es: { summary: "Modelo de punto sin cordones con puntera amplia y suela EVA. Tres colores en {size}; comprobar el ajuste con una muestra.", highlights: ["Empeine de punto y diseño sin cordones", "Puntera amplia; comprobar el ajuste con una muestra", "Tres colores · {size}"] },
  },
  BQ003: {
    en: { summary: "Stretch-fabric lace-up with an EVA sole and mesh lining in the documented configuration. Five colours in EU 35–45.", highlights: ["Stretch-fabric upper", "EVA sole; mesh lining in the documented configuration", "Five colours · EU 35–45"] },
    zh: { summary: "弹力织物系带鞋，所列配置采用EVA鞋底及网布内里。提供五种配色、EU 35–45。", highlights: ["弹力织物鞋面", "所列配置为EVA鞋底与网布内里", "五种配色 · EU 35–45"] },
    de: { summary: "Schnürschuh aus Stretchgewebe mit EVA-Sohle und Meshfutter in der dokumentierten Ausführung. Fünf Farben in EU 35–45.", highlights: ["Stretchgewebe-Obermaterial", "EVA-Sohle und Meshfutter in der dokumentierten Ausführung", "Fünf Farben · EU 35–45"] },
    fr: { summary: "Modèle à lacets en textile extensible, avec semelle EVA et doublure mesh dans la configuration documentée. Cinq coloris en EU 35–45.", highlights: ["Tige en textile extensible", "Semelle EVA et doublure mesh dans la configuration documentée", "Cinq coloris · EU 35–45"] },
    es: { summary: "Modelo de cordones en tejido elástico con suela EVA y forro de malla en la configuración documentada. Cinco colores en EU 35–45.", highlights: ["Empeine de tejido elástico", "Suela EVA y forro de malla en la configuración documentada", "Cinco colores · EU 35–45"] },
  },
  "BQ-LQ2597": {
    en: { summary: "Mesh-panel lace-up with a wide toe box, photographed in three colours. EU 39–48.", highlights: ["Mesh panels and lace-up construction", "Wide toe box; confirm overall fit on a sample", "Three colours · EU 39–48"] },
    zh: { summary: "网面拼接系带款，宽鞋头设计，提供三种实拍配色，尺码 EU 39–48。", highlights: ["网面拼接与系带结构", "宽鞋头；整鞋合脚程度以样品确认", "三种配色 · EU 39–48"] },
    de: { summary: "Mesh-Schnürschuh mit breitem Zehenbereich in drei fotografierten Farben. EU 39–48.", highlights: ["Mesh-Einsätze und Schnürung", "Breiter Zehenbereich; Passform am Muster prüfen", "Drei Farben · EU 39–48"] },
    fr: { summary: "Modèle à lacets avec panneaux en mesh et avant-pied large, photographié en trois coloris. EU 39–48.", highlights: ["Panneaux en mesh et lacets", "Avant-pied large ; chaussant à vérifier sur échantillon", "Trois coloris · EU 39–48"] },
    es: { summary: "Modelo de cordones con paneles de malla y puntera amplia, fotografiado en tres colores. EU 39–48.", highlights: ["Paneles de malla y cordones", "Puntera amplia; comprobar el ajuste con una muestra", "Tres colores · EU 39–48"] },
  },
  "BQ-C2627": {
    en: { summary: "Vented clog with an EVA upper and pivoting heel strap. Five colours and paired size labels 35–36, 37–38 and 39–40.", highlights: ["EVA upper with ventilation openings", "Pivoting heel strap", "Five colours · three paired size labels"] },
    zh: { summary: "镂空洞洞鞋，EVA鞋面搭配可转动后跟带。五种配色，尺码标签为35–36、37–38和39–40。", highlights: ["EVA鞋面与镂空结构", "可转动后跟带", "五种配色 · 三组双码标签"] },
    de: { summary: "Clog mit EVA-Oberteil, Öffnungen und schwenkbarem Fersenriemen. Fünf Farben und Doppelgrößen 35–36, 37–38 und 39–40.", highlights: ["EVA-Oberteil mit Öffnungen", "Schwenkbarer Fersenriemen", "Fünf Farben · drei Doppelgrößen"] },
    fr: { summary: "Sabot ajouré avec tige en EVA et bride arrière pivotante. Cinq coloris et doubles pointures 35–36, 37–38 et 39–40.", highlights: ["Tige ajourée en EVA", "Bride arrière pivotante", "Cinq coloris · trois doubles pointures"] },
    es: { summary: "Zueco ventilado con empeine de EVA y tira trasera giratoria. Cinco colores y tallas dobles 35–36, 37–38 y 39–40.", highlights: ["Empeine de EVA con aberturas", "Tira trasera giratoria", "Cinco colores · tres tallas dobles"] },
  },
  BQ008: {
    en: { summary: "Lace-up sneakers with mesh textile and a thick-sole profile. Four colour combinations in EU 36–45 for sport-casual assortments.", highlights: ["Mesh textile upper", "Thick-sole profile", "Four colour combinations · EU 36–45"] },
    zh: { summary: "系带运动鞋，网布鞋面搭配厚底轮廓，提供四种配色、EU 36–45，适合运动休闲系列选款。", highlights: ["网布鞋面", "厚底轮廓与系带结构", "四种配色 · EU 36–45"] },
    de: { summary: "Mesh-Obermaterial mit markanter Sohle und Schnürung. Vier Farbkombinationen in EU 36–45 für sportliche Freizeitsortimente.", highlights: ["Mesh-Obermaterial", "Markantes Sohlenprofil mit Schnürung", "Vier Farbkombinationen · EU 36–45"] },
    fr: { summary: "Tige en mesh, semelle épaisse et fermeture à lacets. Quatre coloris en EU 36–45 pour les collections sport et loisirs.", highlights: ["Tige en mesh", "Silhouette à semelle épaisse et lacets", "Quatre coloris · EU 36–45"] },
    es: { summary: "Empeine de malla, silueta de suela gruesa y cierre de cordones. Cuatro combinaciones de color en EU 36–45 para colecciones deportivas informales.", highlights: ["Empeine de malla", "Silueta de suela gruesa y cordones", "Cuatro combinaciones de color · EU 36–45"] },
  },
  BQ009: {
    en: { summary: "Stretch-knit lace-up sneakers with mesh lining in the listed configuration. Four colours in EU 35–45.", highlights: ["Stretch-knit upper; mesh lining in the listed configuration", "Lace-up fastening", "Four colour options · EU 35–45"] },
    zh: { summary: "弹力针织系带运动鞋，所列配置采用网布内里。提供四种配色，尺码 EU 35–45。", highlights: ["弹力针织鞋面；所列配置采用网布内里", "系带结构", "四种配色 · EU 35–45"] },
    de: { summary: "Stretchstrick-Schnürschuh mit Meshfutter in der angegebenen Ausführung. Vier Farben in EU 35–45.", highlights: ["Stretchstrick-Obermaterial; Meshfutter in der angegebenen Ausführung", "Schnürung", "Vier Farben · EU 35–45"] },
    fr: { summary: "Chaussure à lacets en maille extensible avec doublure mesh pour la configuration indiquée. Quatre coloris en EU 35–45.", highlights: ["Tige en maille extensible ; doublure mesh pour la configuration indiquée", "Fermeture à lacets", "Quatre coloris · EU 35–45"] },
    es: { summary: "Calzado de cordones en punto elástico con forro de malla en la configuración indicada. Cuatro colores en EU 35–45.", highlights: ["Empeine de punto elástico; forro de malla en la configuración indicada", "Cierre de cordones", "Cuatro colores · EU 35–45"] },
  },
  BQ1009: {
    en: { summary: "Low-top lace-up shoes with a contrast collar, photographed in white and black. EU 39–44; confirm the colour and size mix for your order.", highlights: ["Low-top lace-up design", "Contrast collar", "White and black · EU 39–44"] },
    zh: { summary: "低帮系带休闲鞋，撞色鞋口，实拍白色和黑色款。EU 39–44；颜色和尺码配比按订单确认。", highlights: ["低帮系带设计", "撞色鞋口", "白色与黑色 · EU 39–44"] },
    de: { summary: "Niedriger Schnürschuh mit kontrastierendem Schaftrand, fotografiert in Weiß und Schwarz. EU 39–44; Farb- und Größenverteilung für Ihre Bestellung bestätigen.", highlights: ["Niedrige Schnürschuhform", "Kontrastierender Schaftrand", "Weiß und Schwarz · EU 39–44"] },
    fr: { summary: "Chaussure basse à lacets avec col contrasté, photographiée en blanc et en noir. EU 39–44 ; confirmer les coloris et la répartition des pointures pour votre commande.", highlights: ["Modèle bas à lacets", "Col contrasté", "Blanc et noir · EU 39–44"] },
    es: { summary: "Zapatilla baja con cordones y cuello en contraste, fotografiada en blanco y negro. EU 39–44; confirme los colores y la distribución de tallas para su pedido.", highlights: ["Diseño bajo con cordones", "Cuello en contraste", "Blanco y negro · EU 39–44"] },
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
  const value = copy[product.code]?.[locale];
  if (!value) return undefined;
  const size = product.size.replace("-", "–");
  return { summary: value.summary.replaceAll("{size}", size), highlights: value.highlights.map(item => item.replaceAll("{size}", size)) };
}
export const productOrderCopy: Record<PublicLocale, { title: string; text: string }> = {
  en: { title: "Order options", text: "Ask about small mixed-size orders for existing styles, or branding and packaging for your label. Share your colours, size mix, quantity and destination so we can confirm the available configuration, pricing and delivery." },
  zh: { title: "采购与品牌化", text: "现款可咨询小量混码，也可讨论品牌标识与包装方案。提供颜色、尺码配比、数量和目的地，便于确认可供配置、报价与交期。" },
  de: { title: "Bestellmöglichkeiten", text: "Fragen Sie nach kleinen Bestellungen bestehender Modelle mit gemischten Größen oder nach Markenkennzeichnung und Verpackung für Ihre Marke. Nennen Sie Farben, Größenverteilung, Menge und Zielort, damit wir Ausführung, Preis und Lieferzeit bestätigen können." },
  fr: { title: "Options de commande", text: "Renseignez-vous sur les petites commandes de modèles existants en pointures assorties, ou sur le marquage et l’emballage pour votre marque. Précisez les coloris, la répartition des pointures, la quantité et la destination pour confirmer la configuration, le prix et le délai." },
  es: { title: "Opciones de pedido", text: "Consulte sobre pedidos pequeños de modelos existentes con tallas combinadas, o sobre la marca y el embalaje para su propia etiqueta. Indique colores, distribución de tallas, cantidad y destino para confirmar la configuración, el precio y el plazo de entrega." },
};
