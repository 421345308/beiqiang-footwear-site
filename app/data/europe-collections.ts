import type { EuropeLocale } from "./europe-copy";
import { europeCollectionSlugs } from "../lib/public-locales";

type CollectionCopy = { title: string; description: string; guidance: string };
type Slug = typeof europeCollectionSlugs[number];
const copy: Record<Slug, Record<EuropeLocale, CollectionCopy>> = {
  "mary-jane-shoes": {
    de: { title: "Mary-Jane-Schuhe für den Großhandel", description: "Vergleichen Sie Mary-Jane-Modelle nach Form, Riemen und abgebildeten Farben.", guidance: "Prüfen Sie Verschluss, Größen, Materialien und Passform anhand des gewählten Musters." },
    fr: { title: "Chaussures babies pour professionnels", description: "Comparez les modèles babies selon leur forme, leurs brides et les coloris photographiés.", guidance: "Vérifiez la fermeture, les pointures, les matières et le chaussant sur l’échantillon choisi." },
    es: { title: "Zapatos Mary Jane para mayoristas", description: "Compare modelos Mary Jane por su forma, sus tiras y los colores fotografiados.", guidance: "Compruebe el cierre, las tallas, los materiales y el ajuste con la muestra elegida." },
  },
  "knit-slip-on": {
    de: { title: "Strick-Slipper für den Großhandel", description: "Vergleichen Sie Slip-on-Modelle aus Strick und Textil nach Form, Farben und EU-Größen.", guidance: "Wählen Sie ein Modell und besprechen Sie Muster, Größenmix und Markenkennzeichnung für Ihr Sortiment." },
    fr: { title: "Chaussures en maille à enfiler pour professionnels", description: "Comparez les modèles à enfiler en maille ou textile selon leur forme, leurs coloris et leurs pointures EU.", guidance: "Choisissez un modèle, puis discutez des échantillons, de l’assortiment de pointures et du marquage pour votre collection." },
    es: { title: "Calzado de punto sin cordones para mayoristas", description: "Compare modelos de punto y textil sin cordones por su forma, colores y tallas EU.", guidance: "Elija un modelo y consulte las muestras, la distribución de tallas y las opciones de marca para su colección." },
  },
  "breathable-lace-up": {
    de: { title: "Freizeit-Schnürschuhe für den Großhandel", description: "Entdecken Sie Schnürschuhe mit Strick-, Mesh- und Textiloberteilen für Ihr Freizeitsortiment.", guidance: "Vergleichen Sie Obermaterial, Farben und Größen und stimmen Sie Muster und Bestellmenge für das gewählte Modell ab." },
    fr: { title: "Chaussures de loisirs à lacets pour professionnels", description: "Découvrez des modèles à lacets en maille, mesh ou textile pour votre collection de chaussures de loisirs.", guidance: "Comparez les tiges, coloris et pointures, puis précisez les échantillons et la quantité pour les modèles choisis." },
    es: { title: "Calzado casual con cordones para mayoristas", description: "Descubra modelos con cordones y empeines de punto, malla o textil para su colección casual.", guidance: "Compare empeines, colores y tallas y acuerde las muestras y cantidades de los modelos elegidos." },
  },
  "wide-toe-box": {
    de: { title: "Schuhe mit breitem Zehenbereich für den Großhandel", description: "Vergleichen Sie Modelle mit dokumentiertem breitem Zehenbereich und den jeweiligen Größen und Farben.", guidance: "Ein breiter Zehenbereich ist keine einheitliche Leistenweite. Prüfen Sie die gesamte Passform am Muster." },
    fr: { title: "Chaussures à avant-pied large pour professionnels", description: "Comparez les modèles dont l’avant-pied large est documenté, ainsi que leurs pointures et coloris.", guidance: "Un avant-pied large ne définit pas à lui seul la largeur de toute la chaussure. Vérifiez le chaussant sur échantillon." },
    es: { title: "Calzado de puntera amplia para mayoristas", description: "Compare los modelos con puntera amplia documentada, sus tallas y sus colores.", guidance: "Una puntera amplia no determina el ancho de toda la horma. Compruebe el ajuste completo con una muestra." },
  },
  "clogs-and-vented-shoes": {
    de: { title: "Clogs und Schuhe mit Belüftungsöffnungen", description: "Vergleichen Sie Clogs mit Fersenriemen und geschlossene Modelle mit Öffnungen für Ihr Sortiment.", guidance: "Die Ausführung des Fersenbereichs und die Größenangaben unterscheiden sich je Modell; prüfen Sie Material und Passform am Muster." },
    fr: { title: "Sabots et chaussures ajourées pour professionnels", description: "Comparez les sabots à bride arrière et les modèles fermés ajourés pour votre assortiment.", guidance: "La forme du talon et les pointures varient selon le modèle ; vérifiez les matières et le chaussant sur échantillon." },
    es: { title: "Zuecos y calzado ventilado para mayoristas", description: "Compare zuecos con tira trasera y modelos cerrados con aberturas para su surtido.", guidance: "La construcción del talón y las tallas varían según el modelo; compruebe materiales y ajuste con una muestra." },
  },
};

export function europeCollection(slug: string, locale: EuropeLocale): CollectionCopy | undefined {
  return copy[slug as Slug]?.[locale];
}
