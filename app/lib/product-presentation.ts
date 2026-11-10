import type { Product } from "../data/products";
import type { PublicLocale } from "./public-locales";

// Buyer-facing wording of existing product facts; no inventory or market-size conversion.
type Presentation = { summary: string; highlights: string[] };
const copy: Record<string, Record<PublicLocale, Presentation>> = {
  BQ036: {
    en: { summary: "High-top knit slip-on shoes with a ribbed collar and EVA sole. Black and white or all black, EU 35–45.", highlights: ["High-top knitted textile upper", "Slip-on construction", "EVA sole"] },
    zh: { summary: "高帮针织套穿鞋，罗纹袜套鞋口与 EVA 鞋底；黑白、全黑两种配色，尺码 EU 35–45。", highlights: ["高帮针织织物鞋面", "套穿结构", "EVA 鞋底"] },
    de: { summary: "Hohe Strick-Slipper mit geripptem Schaft und EVA-Sohle. Schwarz-Weiß oder ganz Schwarz, EU 35–45.", highlights: ["Hohes Strick-Obermaterial", "Slip-on-Form", "EVA-Sohle"] },
    fr: { summary: "Chaussures montantes à enfiler en maille, col côtelé et semelle EVA. Noir et blanc ou tout noir, EU 35–45.", highlights: ["Tige montante en maille", "Modèle à enfiler", "Semelle EVA"] },
    es: { summary: "Calzado alto de punto sin cordones, con cuello acanalado y suela EVA. Negro y blanco o todo negro, EU 35–45.", highlights: ["Empeine alto de punto", "Diseño sin cordones", "Suela EVA"] },
  },
  "BQ-LQ015": {
    en: { summary: "Low-top lace-up shoes with a synthetic leather upper and rubber sole. Four colours, EU 37–48.", highlights: ["Lace-up fastening", "Synthetic leather upper", "Rubber sole"] },
    zh: { summary: "低帮系带休闲鞋，合成革鞋面与橡胶鞋底，四种配色，尺码 EU 37–48。", highlights: ["系带闭合", "合成革鞋面", "橡胶鞋底"] },
    de: { summary: "Niedrige Schnürschuhe mit Obermaterial aus Kunstleder und Gummisohle. Vier Farben, EU 37–48.", highlights: ["Schnürung", "Kunstleder-Obermaterial", "Gummisohle"] },
    fr: { summary: "Chaussures basses à lacets, tige en cuir synthétique et semelle en caoutchouc. Quatre coloris, EU 37–48.", highlights: ["Fermeture à lacets", "Tige en cuir synthétique", "Semelle en caoutchouc"] },
    es: { summary: "Calzado bajo de cordones con empeine de cuero sintético y suela de caucho. Cuatro colores, EU 37–48.", highlights: ["Cierre de cordones", "Empeine de cuero sintético", "Suela de caucho"] },
  },
  "BQ-LQ2560": {
    en: { summary: "Low-top lace-up shoes with a plain toe and colour-matched sole. Black or khaki, EU 39–48.", highlights: ["Lace-up fastening", "Plain toe", "Colour-matched sole"] },
    zh: { summary: "低帮系带休闲鞋，素面鞋头搭配同色鞋底；黑色、卡其色可选，尺码 EU 39–48。", highlights: ["系带闭合", "素面鞋头", "同色鞋底"] },
    de: { summary: "Niedrige Schnürschuhe mit schlichter Vorderkappe und farblich abgestimmter Sohle. Schwarz oder Khaki, EU 39–48.", highlights: ["Schnürung", "Schlichte Vorderkappe", "Farblich abgestimmte Sohle"] },
    fr: { summary: "Chaussures basses à lacets, bout uni et semelle assortie. Noir ou kaki, EU 39–48.", highlights: ["Fermeture à lacets", "Bout uni", "Semelle assortie"] },
    es: { summary: "Calzado bajo de cordones con puntera lisa y suela a juego. Negro o caqui, EU 39–48.", highlights: ["Cierre de cordones", "Puntera lisa", "Suela a juego"] },
  },
  "BQ-LQ2580": {
    en: { summary: "Wide-toe lace-up shoes with a jacquard mesh upper and MD + TPR outsole. Yellow or black, EU 39–48.", highlights: ["Wide toe box; check overall fit on a sample", "Jacquard mesh upper", "MD + TPR outsole"] },
    zh: { summary: "宽鞋头系带鞋，贾卡网面鞋面与 MD + TPR 鞋底；黄色、黑色可选，尺码 EU 39–48。", highlights: ["宽鞋头；整鞋合脚程度以样品确认", "贾卡网面鞋面", "MD + TPR 鞋底"] },
    de: { summary: "Schnürschuhe mit breitem Zehenbereich, Jacquard-Mesh und MD-TPR-Laufsohle. Gelb oder Schwarz, EU 39–48.", highlights: ["Breiter Zehenbereich; Passform am Muster prüfen", "Jacquard-Mesh-Obermaterial", "MD-TPR-Laufsohle"] },
    fr: { summary: "Chaussures à lacets à avant-pied large, tige en mesh jacquard et semelle MD + TPR. Jaune ou noir, EU 39–48.", highlights: ["Avant-pied large ; vérifier le chaussant sur échantillon", "Tige en mesh jacquard", "Semelle MD + TPR"] },
    es: { summary: "Calzado de cordones con puntera amplia, malla jacquard y suela MD + TPR. Amarillo o negro, EU 39–48.", highlights: ["Puntera amplia; comprobar el ajuste con una muestra", "Empeine de malla jacquard", "Suela MD + TPR"] },
  },
  "BQ-LQ2416": {
    en: { summary: "Low-top lace-up shoes with stitched side panels, a heel loop and MD sole. Dark grey or khaki, EU 39–48.", highlights: ["Lace-up fastening", "Stitched side panels and heel loop", "MD sole"] },
    zh: { summary: "低帮系带鞋，缝线侧面拼片、后跟提环及 MD 鞋底；深灰色、卡其色可选，尺码 EU 39–48。", highlights: ["系带闭合", "缝线侧片与后跟提环", "MD 鞋底"] },
    de: { summary: "Niedrige Schnürschuhe mit genähten Seitenpartien, Fersenschlaufe und MD-Sohle. Dunkelgrau oder Khaki, EU 39–48.", highlights: ["Schnürung", "Genähte Seitenpartien und Fersenschlaufe", "MD-Sohle"] },
    fr: { summary: "Chaussures basses à lacets avec empiècements cousus, tirette arrière et semelle MD. Gris foncé ou kaki, EU 39–48.", highlights: ["Fermeture à lacets", "Empiècements cousus et tirette arrière", "Semelle MD"] },
    es: { summary: "Calzado bajo de cordones con paneles cosidos, tirador trasero y suela MD. Gris oscuro o caqui, EU 39–48.", highlights: ["Cierre de cordones", "Paneles cosidos y tirador trasero", "Suela MD"] },
  },
  "BQ-LQ02505": {
    en: { summary: "Low-top dial-and-cord shoes with mesh panels, in black or grey. EU 39–48.", highlights: ["Dial closure with cord guides", "Mesh panels and stitched overlays", "Black or grey · EU 39–48"] },
    zh: { summary: "低帮旋钮鞋带休闲鞋，网面拼接，黑色与灰色可选，尺码 EU 39–48。", highlights: ["旋钮鞋带与导环", "网面与缝线拼片", "黑色或灰色 · EU 39–48"] },
    de: { summary: "Niedrige Schuhe mit Drehverschluss und Mesh-Einsätzen in Schwarz oder Grau. EU 39–48.", highlights: ["Drehverschluss mit Kordelführung", "Mesh und aufgenähte Besätze", "Schwarz oder Grau · EU 39–48"] },
    fr: { summary: "Chaussures basses à molette avec empiècements mesh, en noir ou gris. EU 39–48.", highlights: ["Molette et passants de cordon", "Mesh et renforts cousus", "Noir ou gris · EU 39–48"] },
    es: { summary: "Calzado bajo con dial y paneles de malla, en negro o gris. EU 39–48.", highlights: ["Dial y guías de cordón", "Malla y refuerzos cosidos", "Negro o gris · EU 39–48"] },
  },
  "BQ-LQ2509": {
    en: { summary: "Low-top dial shoes with mesh sections and layered stitched panels. Grey or dark brown, EU 39–48.", highlights: ["Dial closure with cord guides", "Layered side panels", "Grey or dark brown · EU 39–48"] },
    zh: { summary: "低帮旋钮鞋带休闲鞋，采用网面与层叠缝线拼片；灰色或深棕色，尺码 EU 39–48。", highlights: ["旋钮鞋带与导环", "层叠侧面拼片", "灰色或深棕色 · EU 39–48"] },
    de: { summary: "Niedrige Schuhe mit Drehverschluss, Mesh und mehrlagigen Besätzen. Grau oder Dunkelbraun, EU 39–48.", highlights: ["Drehverschluss mit Kordelführung", "Mehrlagige Seitenpartien", "Grau oder Dunkelbraun · EU 39–48"] },
    fr: { summary: "Chaussures basses à molette, mesh et renforts superposés. Gris ou marron foncé, EU 39–48.", highlights: ["Molette et passants de cordon", "Renforts latéraux superposés", "Gris ou marron foncé · EU 39–48"] },
    es: { summary: "Calzado bajo de dial con malla y refuerzos superpuestos. Gris o marrón oscuro, EU 39–48.", highlights: ["Dial y guías de cordón", "Paneles laterales superpuestos", "Gris o marrón oscuro · EU 39–48"] },
  },
  "BQ-LQ029": {
    en: { summary: "Black lace-up shoes with an EVA outsole. Mesh or plush lining depends on the selected configuration. EU 39–48.", highlights: ["Lace-up construction", "Mesh or plush lining by configuration", "EVA outsole · EU 39–48"] },
    zh: { summary: "黑色系带休闲鞋，EVA外底；网布或加绒内里按所选版本确认。尺码 EU 39–48。", highlights: ["系带结构", "网布或加绒内里按版本确认", "EVA外底 · EU 39–48"] },
    de: { summary: "Schwarze Schnürschuhe mit EVA-Außensohle. Mesh- oder Plüschfutter je nach Ausführung. EU 39–48.", highlights: ["Schnürung", "Mesh- oder Plüschfutter je nach Ausführung", "EVA-Außensohle · EU 39–48"] },
    fr: { summary: "Chaussures noires à lacets et semelle extérieure EVA. Doublure mesh ou peluche selon la version. EU 39–48.", highlights: ["Fermeture à lacets", "Doublure mesh ou peluche selon la version", "Semelle extérieure EVA · EU 39–48"] },
    es: { summary: "Calzado negro de cordones con suela exterior de EVA. Forro de malla o afelpado según la versión. EU 39–48.", highlights: ["Cierre de cordones", "Forro de malla o afelpado según la versión", "Suela exterior de EVA · EU 39–48"] },
  },
  "BQ-LQ1026": {
    en: { summary: "Plush-lined ankle boots with a dial closure and angular side panel. EU 36–48 across colours; sizes vary by colour.", highlights: ["Dial closure", "Plush lining", "Angular side panel"] },
    zh: { summary: "旋钮闭合加绒短靴，侧片呈斜角轮廓；尺码范围 EU 36–48，各色对应尺码不同。", highlights: ["旋钮闭合", "加绒内里", "斜角侧面拼片"] },
    de: { summary: "Plüschgefütterte Stiefeletten mit Drehverschluss und kantigem Seiteneinsatz. EU 36–48 insgesamt; Größen je Farbe unterschiedlich.", highlights: ["Drehverschluss", "Plüschfutter", "Kantiger Seiteneinsatz"] },
    fr: { summary: "Bottines à doublure peluche, molette et empiècement latéral angulaire. EU 36–48 au total ; pointures selon le coloris.", highlights: ["Fermeture à molette", "Doublure peluche", "Empiècement latéral angulaire"] },
    es: { summary: "Botines de forro afelpado con dial y panel lateral angular. EU 36–48 en conjunto; las tallas varían según el color.", highlights: ["Cierre de dial", "Forro afelpado", "Panel lateral angular"] },
  },
  "BQ-LQ9705": {
    en: { summary: "Plush-lined ankle boots with a dial closure and layered side panels. EU 36–48 across colours; sizes vary by colour.", highlights: ["Dial closure", "Plush lining", "Layered side panels"] },
    zh: { summary: "旋钮闭合加绒短靴，侧面采用层叠拼片；尺码范围 EU 36–48，各色对应尺码不同。", highlights: ["旋钮闭合", "加绒内里", "层叠侧面拼片"] },
    de: { summary: "Plüschgefütterte Stiefeletten mit Drehverschluss und mehrlagigen Seitenpartien. EU 36–48 insgesamt; Größen je Farbe unterschiedlich.", highlights: ["Drehverschluss", "Plüschfutter", "Mehrlagige Seitenpartien"] },
    fr: { summary: "Bottines à doublure peluche, molette et renforts latéraux superposés. EU 36–48 au total ; pointures selon le coloris.", highlights: ["Fermeture à molette", "Doublure peluche", "Renforts latéraux superposés"] },
    es: { summary: "Botines de forro afelpado con dial y paneles laterales superpuestos. EU 36–48 en conjunto; las tallas varían según el color.", highlights: ["Cierre de dial", "Forro afelpado", "Paneles laterales superpuestos"] },
  },
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
