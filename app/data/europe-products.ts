import type { Product } from "./products";
import { europeLocales, type EuropeLocale, t } from "./europe-copy.ts";
// Translations never add material, fit, stock or performance claims.
export const names: Record<string, readonly [string, string, string]> = {
  "Wide Toe Box Knit Slip-On Walking Shoes": [
    "Strick-Slipper mit breitem Zehenbereich",
    "Chaussures en maille à enfiler, avant-pied large",
    "Calzado de punto sin cordones y puntera amplia",
  ],
  "Extra Wide Toe Box Knit Slip-On Walking Shoes": [
    "Strick-Slipper mit besonders breitem Zehenbereich",
    "Chaussures en maille à enfiler, avant-pied extra-large",
    "Calzado de punto sin cordones y puntera extraamplia",
  ],
  "Summer Stretch-Fabric Lace-Up Casual Shoes": [
    "Sommerliche Schnürschuhe aus Stretchtextil",
    "Chaussures d’été à lacets en textile extensible",
    "Calzado de verano con cordones y tejido elástico",
  ],
  "Lightweight Knit Slip-On Casual Shoes": [
    "Leichte Strick-Slipper",
    "Chaussures légères en maille à enfiler",
    "Calzado ligero de punto sin cordones",
  ],
  "Summer Hollow-Knit Lace-Up Walking Shoes": [
    "Sommerliche Schnürschuhe aus Lochstrick",
    "Chaussures d’été à lacets en maille ajourée",
    "Calzado de verano con cordones y punto calado",
  ],
  "Autumn Winter Chunky Knit Lace-Up Shoes": [
    "Herbst-/Winter-Strickschnürschuhe mit markanter Sohle",
    "Chaussures automne-hiver en maille à lacets, semelle épaisse",
    "Calzado de punto otoño-invierno con cordones y suela gruesa",
  ],
  "Breathable Textile Slip-On Walking Shoes": [
    "Atmungsaktive Textil-Slipper",
    "Chaussures textiles respirantes à enfiler",
    "Calzado textil transpirable sin cordones",
  ],
  "Mesh Thick-Sole Athletic Walking Shoes": [
    "Sportliche Meshschuhe mit dicker Sohle",
    "Chaussures sportives en mesh à semelle épaisse",
    "Calzado deportivo de malla con suela gruesa",
  ],
  "Breathable Knit Stretch-Fabric Lace-Up Walking Shoes": [
    "Atmungsaktive Schnürschuhe aus Stretchstrick",
    "Chaussures respirantes à lacets en maille extensible",
    "Calzado transpirable con cordones y punto elástico",
  ],
  "Stretch Fabric Toe-Cap Lace-Up Walking Shoes": [
    "Stretchtextil-Schnürschuhe mit Zehenkappe",
    "Chaussures à lacets en textile extensible avec embout",
    "Calzado con cordones, tejido elástico y refuerzo en la puntera",
  ],
  "Men's Textile Slip-On Walking Shoes": [
    "Herren-Textil-Slipper",
    "Chaussures textiles à enfiler pour homme",
    "Calzado textil de hombre sin cordones",
  ],
  "Breathable Knit Chunky Lace-Up Walking Shoes": [
    "Atmungsaktive Strickschnürschuhe mit markanter Sohle",
    "Chaussures respirantes en maille à lacets, semelle épaisse",
    "Calzado de punto transpirable con cordones y suela gruesa",
  ],
  "Knit Textile Slip-On Walking Shoes": [
    "Textil-Strickschuhe zum Hineinschlüpfen",
    "Chaussures en maille textile à enfiler",
    "Calzado de punto textil sin cordones",
  ],
  "Stretch Textile Slip-On Walking Shoes": [
    "Slipper aus Stretchtextil",
    "Chaussures à enfiler en textile extensible",
    "Calzado sin cordones de tejido elástico",
  ],
  "Autumn Winter Textile Lace-Up Walking Shoes": [
    "Herbst-/Winter-Textilschnürschuhe",
    "Chaussures textiles automne-hiver à lacets",
    "Calzado textil otoño-invierno con cordones",
  ],
  "Kids Knit Slip-On Walking Shoes": [
    "Kinder-Strickschuhe zum Hineinschlüpfen",
    "Chaussures enfant en maille à enfiler",
    "Calzado infantil de punto sin cordones",
  ],
  "Quilted Textile Lace-Up Walking Shoes": [
    "Schnürschuhe aus gestepptem Textil",
    "Chaussures à lacets en textile matelassé",
    "Calzado con cordones y tejido acolchado",
  ],
  "Knit Textile Lace-Up Walking Shoes": [
    "Textil-Strickschnürschuhe",
    "Chaussures à lacets en maille textile",
    "Calzado con cordones de punto textil",
  ],
  "Honeycomb-Knit Lace-Up Casual Walking Shoes": [
    "Schnürschuhe mit Wabenstrick",
    "Chaussures à lacets en maille alvéolée",
    "Calzado con cordones y punto de nido de abeja",
  ],
  "Striped Knit Slip-On Walking Shoes": [
    "Gestreifte Strick-Slipper",
    "Chaussures à enfiler en maille rayée",
    "Calzado de punto a rayas sin cordones",
  ],
  "Knit Textile Low-Cut Slip-On Walking Shoes": [
    "Niedrige Textil-Strickslipper",
    "Chaussures basses à enfiler en maille textile",
    "Calzado bajo de punto textil sin cordones",
  ],
  "Low-Cut Chevron Knit Slip-On Shoes": [
    "Niedrige Strick-Slipper mit Zickzackmuster",
    "Chaussures basses à enfiler en maille à chevrons",
    "Calzado bajo sin cordones de punto en espiga",
  ],
  "Breathable Eyelet Knit Lace-Up Walking Shoes": [
    "Atmungsaktive Lochstrick-Schnürschuhe",
    "Chaussures respirantes à lacets en maille ajourée",
    "Calzado transpirable con cordones y punto calado",
  ],
  "Cream Knit Wave-Sole Lace-Up Walking Shoes": [
    "Cremefarbene Strickschnürschuhe mit Wellensohle",
    "Chaussures crème en maille à lacets, semelle ondulée",
    "Calzado de punto crema con cordones y suela ondulada",
  ],
  "Shell-Toe Knit Slip-On Walking Shoes": [
    "Strick-Slipper mit Muschel-Zehenkappe",
    "Chaussures en maille à enfiler avec embout coquille",
    "Calzado de punto sin cordones con puntera tipo concha",
  ],
  "High-Top Sock Knit Walking Shoes": [
    "Hohe Strick-Sockenschuhe",
    "Chaussures chaussettes montantes en maille",
    "Calzado alto de punto tipo calcetín",
  ],
  "Kids Mesh Lace-Up Walking Shoes": [
    "Kinder-Mesh-Schnürschuhe",
    "Chaussures enfant à lacets en mesh",
    "Calzado infantil de malla con cordones",
  ],
  "Wide Toe Box Knit Lace-Up Walking Shoes": [
    "Strickschnürschuhe mit breitem Zehenbereich",
    "Chaussures à lacets en maille, avant-pied large",
    "Calzado de punto con cordones y puntera amplia",
  ],
  "Platform Clogs with Pivot Heel Strap": [
    "Plateau-Clogs mit schwenkbarem Fersenriemen",
    "Sabots à plateforme et bride arrière pivotante",
    "Zuecos de plataforma con tira de talón giratoria",
  ],
  "Closed-Heel Vented Slip-On Shoes": [
    "Perforierte Slipper mit geschlossener Ferse",
    "Chaussures ajourées à enfiler, talon fermé",
    "Calzado perforado sin cordones y talón cerrado",
  ],
  "Buckle Mules with Suede-Effect Upper": [
    "Schnallen-Mules in Veloursoptik",
    "Mules à boucle avec tige aspect suédé",
    "Mules con hebilla y corte de efecto ante",
  ],
  "Panelled Lace-Up Casual Shoes": [
    "Freizeit-Schnürschuhe mit Einsätzen",
    "Chaussures décontractées à lacets et empiècements",
    "Calzado casual con cordones y paneles",
  ],
  "Mesh-Panel Lace-Up Casual Shoes": [
    "Freizeit-Schnürschuhe mit Mesh-Einsätzen",
    "Chaussures décontractées à lacets et empiècements mesh",
    "Calzado casual con cordones y paneles de malla",
  ],
  "Wide Toe Box Mesh Lace-Up Casual Shoes": [
    "Mesh-Schnürschuhe mit breitem Zehenbereich",
    "Chaussures en mesh à lacets, avant-pied large",
    "Calzado de malla con cordones y puntera amplia",
  ],
  "Mesh Panel Casual Sneakers": [
    "Freizeit-Sneaker mit Mesh-Einsätzen",
    "Baskets à empiècements mesh",
    "Zapatillas casuales con paneles de malla",
  ],
  "Layered Mesh Lace-Up Sneakers": [
    "Mesh-Schnürsneaker mit Lagenbesatz",
    "Baskets à lacets en mesh avec superpositions",
    "Zapatillas de malla con cordones y capas superpuestas",
  ],
  "Chunky Sole Derby Shoes": [
    "Derbys mit markanter Sohle",
    "Derbies à semelle épaisse",
    "Zapatos Derby de suela gruesa",
  ],
  "Panelled Lace-Up Casual Sneakers": [
    "Freizeit-Schnürsneaker mit Einsätzen",
    "Baskets décontractées à lacets et empiècements",
    "Zapatillas casuales con cordones y paneles",
  ],
  "Platform High-Top Lace-Up Shoes": [
    "Hohe Plateau-Schnürschuhe",
    "Chaussures montantes à lacets et plateforme",
    "Calzado alto con cordones y plataforma",
  ],
  "Panelled Low-Top Casual Sneakers": [
    "Niedrige Freizeit-Sneaker mit Einsätzen",
    "Baskets basses à empiècements",
    "Zapatillas bajas casuales con paneles",
  ],
  "Colour-Block Low-Top Sneakers": [
    "Niedrige Sneaker in Blockfarben",
    "Baskets basses à blocs de couleurs",
    "Zapatillas bajas con bloques de color",
  ],
  "Layered Upper Casual Shoes": [
    "Freizeitschuhe mit mehrlagigem Obermaterial",
    "Chaussures décontractées à tige superposée",
    "Calzado casual con corte de capas superpuestas",
  ],
  "Low-Top Cupsole Casual Sneakers": [
    "Niedrige Freizeit-Sneaker mit Schalensohle",
    "Baskets basses à semelle cuvette",
    "Zapatillas bajas casuales con suela tipo cupsole",
  ],
  "Side-Zip Low-Top Casual Shoes": [
    "Niedrige Freizeitschuhe mit seitlichem Reißverschluss",
    "Chaussures basses avec fermeture latérale zippée",
    "Calzado bajo casual con cremallera lateral",
  ],
  "Knit Slip-On Casual Shoes": [
    "Strick-Slipper für den Alltag",
    "Chaussures décontractées en maille à enfiler",
    "Calzado casual de punto sin cordones",
  ],
  "Wide-Strap Slide Sandals": [
    "Pantoletten mit breitem Riemen",
    "Claquettes à bride large",
    "Sandalias tipo pala de tira ancha",
  ],
  "Panelled Lace-Up Ankle Boots": [
    "Schnürstiefeletten mit Einsätzen",
    "Bottines à lacets et empiècements",
    "Botines con cordones y paneles",
  ],
  "Metal-Trim Slip-On Loafers": [
    "Loafer mit Metalldekor",
    "Mocassins à détail métallique",
    "Mocasines con adorno metálico",
  ],
  "Closed-Heel Moulded Slip-On Shoes": [
    "Geformte Slipper mit geschlossener Ferse",
    "Chaussures moulées à enfiler, talon fermé",
    "Calzado moldeado sin cordones y talón cerrado",
  ],
  "Textile Low-Top Lace-Up Sneakers": [
    "Niedrige Textil-Schnürsneaker",
    "Baskets basses textiles à lacets",
    "Zapatillas bajas textiles con cordones",
  ],
  "Contrast-Panel Low-Top Sneakers": [
    "Niedrige Sneaker mit Kontrasteinsätzen",
    "Baskets basses à empiècements contrastés",
    "Zapatillas bajas con paneles de contraste",
  ],
  "Mesh Lace-Up Casual Sneakers": [
    "Freizeit-Schnürsneaker aus Mesh",
    "Baskets décontractées à lacets en mesh",
    "Zapatillas casuales de malla con cordones",
  ],
  "Black Plain-Toe Derby Shoes": [
    "Schwarze Derbys mit glatter Vorderkappe",
    "Derbies noirs à bout uni",
    "Zapatos Derby negros de puntera lisa",
  ],
  "Vented Clogs with Pivot Heel Strap": [
    "Perforierte Clogs mit schwenkbarem Fersenriemen",
    "Sabots ajourés à bride arrière pivotante",
    "Zuecos perforados con tira de talón giratoria",
  ],
  "Textured Sole Knit Slip-On Shoes": [
    "Strick-Slipper mit strukturierter Sohle",
    "Chaussures en maille à enfiler, semelle texturée",
    "Calzado de punto sin cordones y suela texturizada",
  ],
  "Low-Cut Knit Slip-On Shoes": [
    "Niedrige Strick-Slipper",
    "Chaussures basses en maille à enfiler",
    "Calzado bajo de punto sin cordones",
  ],
  "Ankle-Collar Knit Sock Shoes": [
    "Knöchelhohe Strick-Sockenschuhe",
    "Chaussures chaussettes en maille à col montant",
    "Calzado de punto tipo calcetín al tobillo",
  ],
  "Chunky Sole Lace-Up Casual Shoes": [
    "Freizeit-Schnürschuhe mit markanter Sohle",
    "Chaussures décontractées à lacets, semelle épaisse",
    "Calzado casual con cordones y suela gruesa",
  ],
  "Side-Zip Ankle Boots": [
    "Stiefeletten mit seitlichem Reißverschluss",
    "Bottines à fermeture latérale zippée",
    "Botines con cremallera lateral",
  ],
  "Knit Slip-On Shoes with Open Sole Sidewalls": [
    "Strick-Slipper mit seitlich offener Sohlenstruktur",
    "Chaussures en maille à enfiler, flancs de semelle ajourés",
    "Calzado de punto sin cordones y laterales de suela abiertos",
  ],
  "Lined High-Top Lace-Up Shoes": [
    "Gefütterte hohe Schnürschuhe",
    "Chaussures montantes à lacets avec doublure",
    "Calzado alto con cordones y forro",
  ],
  "Textile Short-Lace Casual Shoes": [
    "Textil-Freizeitschuhe mit kurzer Schnürung",
    "Chaussures textiles décontractées à laçage court",
    "Calzado casual textil de lazada corta",
  ],
  "Outdoor-Style Lace-Up Casual Shoes": [
    "Freizeit-Schnürschuhe im Outdoor-Stil",
    "Chaussures décontractées à lacets, style plein air",
    "Calzado casual con cordones de estilo outdoor",
  ],
  "Colour-Block Mesh Lace-Up Shoes": [
    "Mesh-Schnürschuhe in Blockfarben",
    "Chaussures en mesh à lacets et blocs de couleurs",
    "Calzado de malla con cordones y bloques de color",
  ],
  "High-Cuff Knit Sock Shoes": [
    "Strick-Sockenschuhe mit hohem Schaft",
    "Chaussures chaussettes en maille à tige haute",
    "Calzado de punto tipo calcetín de caña alta",
  ],
  "Camouflage-Panel Textile Casual Shoes": [
    "Textil-Freizeitschuhe mit Camouflage-Einsätzen",
    "Chaussures textiles à empiècements camouflage",
    "Calzado casual textil con paneles de camuflaje",
  ],
};
export const facts: Record<string, readonly [string, string, string]> = {
  "Slip-On": ["Zum Hineinschlüpfen", "À enfiler", "Sin cordones"],
  "Lace-Up": ["Schnürung", "À lacets", "Con cordones"],
  "Zip-Up": ["Reißverschluss", "Fermeture zippée", "Cremallera"],
  "Knitted textile upper": [
    "Obermaterial aus Stricktextil",
    "Tige en maille textile",
    "Corte de punto textil",
  ],
  "Stretch fabric upper": [
    "Obermaterial aus Stretchtextil",
    "Tige en textile extensible",
    "Corte de tejido elástico",
  ],
  "Knitted stretch-fabric upper": [
    "Obermaterial aus Stretchstrick",
    "Tige en maille extensible",
    "Corte de punto elástico",
  ],
  "Hollow-knit stretch-fabric upper": [
    "Obermaterial aus elastischem Lochstrick",
    "Tige en maille extensible ajourée",
    "Corte de punto elástico calado",
  ],
  "Mesh textile upper": [
    "Obermaterial aus Meshtextil",
    "Tige en textile mesh",
    "Corte de tejido de malla",
  ],
  "Textile upper": ["Textil-Obermaterial", "Tige textile", "Corte textil"],
  "Knit textile upper": [
    "Obermaterial aus Stricktextil",
    "Tige en maille textile",
    "Corte de punto textil",
  ],
  "Stretch textile upper": [
    "Obermaterial aus Stretchtextil",
    "Tige en textile extensible",
    "Corte de tejido elástico",
  ],
  "Quilted textile upper": [
    "Gestepptes Textil-Obermaterial",
    "Tige en textile matelassé",
    "Corte textil acolchado",
  ],
  "Breathable knitted upper": [
    "Atmungsaktives Strick-Obermaterial",
    "Tige en maille respirante",
    "Corte de punto transpirable",
  ],
  "Hollow knitted textile upper": [
    "Obermaterial aus Lochstrick",
    "Tige en maille ajourée",
    "Corte de punto calado",
  ],
  "Striped knitted upper": [
    "Gestreiftes Strick-Obermaterial",
    "Tige en maille rayée",
    "Corte de punto a rayas",
  ],
  "Low-cut knitted upper": [
    "Niedriges Strick-Obermaterial",
    "Tige basse en maille",
    "Corte bajo de punto",
  ],
  "High-top knit textile upper": [
    "Hohes Strick-Obermaterial",
    "Tige montante en maille textile",
    "Corte alto de punto textil",
  ],
  "Breathable mesh upper": [
    "Atmungsaktives Mesh-Obermaterial",
    "Tige en mesh respirant",
    "Corte de malla transpirable",
  ],
  "Stretch knitted textile upper": [
    "Elastisches Stricktextil-Obermaterial",
    "Tige en maille textile extensible",
    "Corte de punto textil elástico",
  ],
  "EVA upper": ["EVA-Obermaterial", "Tige en EVA", "Corte de EVA"],
  "Suede-effect upper; composition to be confirmed": [
    "Veloursoptik; Zusammensetzung zu bestätigen",
    "Aspect suédé ; composition à confirmer",
    "Efecto ante; composición por confirmar",
  ],
  "Panelled upper; composition to be confirmed": [
    "Obermaterial mit Einsätzen; Zusammensetzung zu bestätigen",
    "Tige à empiècements ; composition à confirmer",
    "Corte con paneles; composición por confirmar",
  ],
  "Mesh panels and overlays; composition to be confirmed": [
    "Mesh-Einsätze und Besätze; Zusammensetzung zu bestätigen",
    "Empiècements mesh et renforts ; composition à confirmer",
    "Paneles de malla y superposiciones; composición por confirmar",
  ],
  "Mesh upper with overlays; composition to be confirmed": [
    "Mesh-Obermaterial mit Besätzen; Zusammensetzung zu bestätigen",
    "Tige en mesh avec renforts ; composition à confirmer",
    "Corte de malla con superposiciones; composición por confirmar",
  ],
  "Leather and Mesh": ["Leder und Mesh", "Cuir et mesh", "Cuero y malla"],
  Mesh: ["Mesh", "Mesh", "Malla"],
  "Synthetic Leather + Mesh": [
    "Kunstleder und Mesh",
    "Cuir synthétique et mesh",
    "Cuero sintético y malla",
  ],
  "Synthetic Leather": ["Kunstleder", "Cuir synthétique", "Cuero sintético"],
  Textile: ["Textil", "Textile", "Textil"],
  "Split Leather": ["Spaltleder", "Croûte de cuir", "Cuero serraje"],
  Knit: ["Stricktextil", "Maille", "Punto"],
  Rubber: ["Gummi", "Caoutchouc", "Caucho"],
  "EVA sole": ["EVA-Sohle", "Semelle EVA", "Suela de EVA"],
  "EVA + PEBA foamed sole structure": [
    "Geschäumte Sohlenstruktur aus EVA und PEBA",
    "Structure de semelle en mousse EVA et PEBA",
    "Estructura de suela espumada de EVA y PEBA",
  ],
};
const colourWords: Record<string, readonly [string, string, string]> = {
  "white sole": ["weiße Sohle", "semelle blanche", "suela blanca"],
  "all black": ["ganz schwarz", "noir intégral", "negro integral"],
  "all white": ["ganz weiß", "blanc intégral", "blanco integral"],
  "off white": ["gebrochenes Weiß", "blanc cassé", "blanco roto"],
  "wine red": ["weinrot", "bordeaux", "rojo vino"],
  "military green": ["olivgrün", "vert militaire", "verde militar"],
  "mint green": ["mintgrün", "vert menthe", "verde menta"],
  "light blue": ["hellblau", "bleu clair", "azul claro"],
  "light grey": ["hellgrau", "gris clair", "gris claro"],
  "dark grey": ["dunkelgrau", "gris foncé", "gris oscuro"],
  "light pink": ["hellrosa", "rose clair", "rosa claro"],
  "dark brown": ["dunkelbraun", "marron foncé", "marrón oscuro"],
  "zebra stripe": ["Zebrastreifen", "rayures zébrées", "rayas de cebra"],
  black: ["schwarz", "noir", "negro"],
  white: ["weiß", "blanc", "blanco"],
  grey: ["grau", "gris", "gris"],
  pink: ["rosa", "rose", "rosa"],
  blue: ["blau", "bleu", "azul"],
  orange: ["orange", "orange", "naranja"],
  green: ["grün", "vert", "verde"],
  purple: ["violett", "violet", "morado"],
  khaki: ["khaki", "kaki", "caqui"],
  red: ["rot", "rouge", "rojo"],
  beige: ["beige", "beige", "beige"],
  lavender: ["lavendel", "lavande", "lavanda"],
  cream: ["creme", "crème", "crema"],
  stripe: ["gestreift", "rayé", "a rayas"],
  brown: ["braun", "marron", "marrón"],
  yellow: ["gelb", "jaune", "amarillo"],
  apricot: ["apricot", "abricot", "albaricoque"],
  sand: ["sand", "sable", "arena"],
  camel: ["camel", "camel", "camel"],
  ivory: ["elfenbein", "ivoire", "marfil"],
  navy: ["marineblau", "bleu marine", "azul marino"],
  coffee: ["kaffeebraun", "café", "café"],
  multicolour: ["mehrfarbig", "multicolore", "multicolor"],
  turquoise: ["türkis", "turquoise", "turquesa"],
};
export function productTitle(p: Product, locale: EuropeLocale) {
  return names[p.name]?.[europeLocales.indexOf(locale)] || p.code;
}
export function productFact(value: string, locale: EuropeLocale) {
  return (
    facts[value]?.[europeLocales.indexOf(locale)] ||
    (/^(?:EVA|PVC|EU [\d –/-]+|[\d –/-]+)$/.test(value)
      ? value
      : t(locale, "confirm"))
  );
}
export function productColour(value: string, locale: EuropeLocale) {
  const pattern = new RegExp(
    Object.keys(colourWords)
      .sort((a, b) => b.length - a.length)
      .join("|"),
    "g",
  );
  return value
    .toLowerCase()
    .replace(pattern, (key) => colourWords[key][europeLocales.indexOf(locale)]);
}
