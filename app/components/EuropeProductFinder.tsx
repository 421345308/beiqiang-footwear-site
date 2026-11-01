"use client";

import { useState } from "react";
import { products, type Product } from "../data/products";
import { europeLocales, type EuropeLocale, t } from "../data/europe-copy";
import { productFact } from "../data/europe-products";
import { findProducts, type FinderAnswers } from "../lib/product-finder";
import { addProductToQuote, readQuoteList } from "../lib/quote-list";
import { localizedPath } from "../lib/public-locales";
import { EuropeCard } from "./EuropeProduct";

const labels = {
  title: ["Eine passende Modellauswahl zusammenstellen", "Composer une sélection adaptée", "Prepare una selección adecuada"],
  intro: ["Wählen Sie Ihren Einkaufskanal und die gewünschte Produktrichtung. Die Auswahl folgt Ihren Angaben und den Produktmerkmalen im Katalog.", "Indiquez votre canal d’achat et le type de produit recherché. La sélection repose sur vos critères et les caractéristiques du catalogue.", "Indique su canal de compra y el tipo de producto que busca. La selección se basa en sus criterios y en las características del catálogo."],
  channel: ["Ihr Einkaufskanal", "Votre profil d’achat", "Su perfil de compra"],
  priority: ["Produktrichtung", "Type de produit recherché", "Tipo de producto"],
  count: ["Anzahl der Vorschläge", "Nombre de suggestions", "Número de propuestas"],
  generate: ["Modelle vorschlagen", "Afficher les suggestions", "Mostrar propuestas"],
  empty: ["Für diese Kombination gibt es keinen Treffer. Wählen Sie eine andere Produktrichtung oder lassen Sie den Verschluss offen.", "Aucun modèle ne correspond à cette combinaison. Changez le type de produit ou choisissez une fermeture sans préférence.", "No hay modelos para esta combinación. Cambie el tipo de producto o seleccione el cierre sin preferencia."],
  relax: ["Verschluss offenlassen und erneut suchen", "Rechercher sans préférence de fermeture", "Buscar sin preferencia de cierre"],
  why: ["Warum dieses Modell?", "Pourquoi ce modèle ?", "¿Por qué este modelo?"],
  human: ["Persönliche Modellauswahl anfragen", "Demander une sélection personnalisée", "Solicitar una selección personalizada"],
  humanText: ["Andere Formen, Größen oder Referenzbilder? Beschreiben Sie Ihre Anforderungen. Diese Anfrage fügt Ihrer Liste keine Modelle hinzu.", "Vous recherchez d’autres formes, pointures ou avez des images de référence ? Décrivez vos besoins. Cette demande n’ajoute aucun modèle à votre liste.", "¿Busca otras formas, tallas o dispone de imágenes de referencia? Describa sus necesidades. Esta consulta no añade modelos a su lista."],
  added: ["Zur Anfrageliste hinzugefügt.", "Ajouté à la liste de demande.", "Añadido a la lista de consulta."],
  existing: ["Dieses Modell ist bereits in Ihrer Liste. Ihre Angaben bleiben erhalten.", "Ce modèle figure déjà dans votre liste. Vos informations sont conservées.", "Este modelo ya está en su lista. Se conservan sus datos."],
  full: ["Ihre Liste enthält bereits 12 Modelle. Bearbeiten Sie zuerst Ihre Anfrageliste.", "Votre liste contient déjà 12 modèles. Modifiez d’abord votre liste de demande.", "Su lista ya contiene 12 modelos. Edite primero su lista de consulta."],
  storage: ["Die Auswahl konnte nicht gespeichert werden. Öffnen Sie das Modell oder kontaktieren Sie uns direkt.", "La sélection n’a pas pu être enregistrée. Ouvrez le modèle ou contactez-nous directement.", "No se pudo guardar la selección. Abra el modelo o contacte con nosotros directamente."],
  result: ["vorgeschlagene Modelle", "modèles proposés", "modelos propuestos"],
} as const;
const channels = {
  importer_wholesaler: ["Importeur / Großhändler", "Importateur / grossiste", "Importador / mayorista"],
  online_seller: ["Onlinehändler", "Vendeur en ligne", "Vendedor en línea"],
  brand_private_label: ["Marke / Eigenmarke", "Marque / marque propre", "Marca / marca propia"],
  sourcing_agent: ["Einkaufsagentur", "Agent d’approvisionnement", "Agente de compras"],
} as const;
const priorities = {
  open: ["Offene Auswahl", "Sans préférence", "Sin preferencia"],
  wide_toe: ["Breiter Zehenbereich", "Avant-pied large", "Puntera amplia"],
  easy_on: ["Schuhe zum Hineinschlüpfen", "Chaussures à enfiler", "Calzado sin cordones"],
  breathable_lace_up: ["Atmungsaktive Textil-Schnürschuhe", "Chaussures textiles respirantes à lacets", "Calzado textil transpirable con cordones"],
  mens: ["Herrenmodelle", "Modèles homme", "Modelos de hombre"],
  kids: ["Kindermodelle", "Modèles enfant", "Modelos infantiles"],
  cold_weather: ["Winter- und Futteroptionen", "Options hiver et doublure chaude", "Opciones de invierno y forro cálido"],
} as const;
const initial: FinderAnswers = { buyerChannel: "importer_wholesaler", priority: "open", closure: "any", resultCount: 3 };

export default function EuropeProductFinder({ locale }: { locale: EuropeLocale }) {
  const index = europeLocales.indexOf(locale);
  const text = (key: keyof typeof labels) => labels[key][index];
  const href = (path: string) => localizedPath(path, locale);
  const [answers, setAnswers] = useState<FinderAnswers>(initial);
  // Results reflect the submitted criteria, so changing a field never silently changes a shortlist.
  const [submitted, setSubmitted] = useState<FinderAnswers | null>(null);
  const [message, setMessage] = useState("");
  const matches = submitted ? findProducts(products, submitted) : [];
  function add(product: Product) {
    const current = readQuoteList();
    if (current.some(line => line.code === product.code)) return setMessage(text("existing"));
    if (current.length >= 12) return setMessage(text("full"));
    try { setMessage(addProductToQuote(product) ? text("added") : text("full")); }
    catch { setMessage(text("storage")); }
  }
  return <section className="europe-content europe-finder">
    <h1>{text("title")}</h1><p className="europe-lead">{text("intro")}</p>
    <a className="studio-text-link" href={href("/products")}>{t(locale, "browseAll")} ({products.length}) ↗</a>
    <form className="europe-finder-form" onSubmit={event => { event.preventDefault(); setSubmitted({ ...answers }); setMessage(""); }}>
      <label>{text("channel")}<select value={answers.buyerChannel} onChange={event => setAnswers({ ...answers, buyerChannel: event.target.value as FinderAnswers["buyerChannel"] })}>{(Object.keys(channels) as (keyof typeof channels)[]).map(key => <option key={key} value={key}>{channels[key][index]}</option>)}</select></label>
      <label>{text("priority")}<select value={answers.priority} onChange={event => setAnswers({ ...answers, priority: event.target.value as FinderAnswers["priority"] })}>{(Object.keys(priorities) as (keyof typeof priorities)[]).map(key => <option key={key} value={key}>{priorities[key][index]}</option>)}</select></label>
      <label>{t(locale, "closure")}<select value={answers.closure} onChange={event => setAnswers({ ...answers, closure: event.target.value as FinderAnswers["closure"] })}><option value="any">{t(locale, "all")}</option>{["Slip-On", "Lace-Up"].map(key => <option key={key} value={key}>{productFact(key, locale)}</option>)}</select></label>
      <label>{text("count")}<select value={answers.resultCount} onChange={event => setAnswers({ ...answers, resultCount: Number(event.target.value) as 2 | 3 | 4 })}>{[2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
      <button className="button" type="submit">{text("generate")} ↗</button>
    </form>
    <p role="status" aria-live="polite">{message || (submitted ? `${matches.length} ${text("result")}` : "")}</p>
    {submitted && !matches.length && <aside className="europe-finder-empty"><p>{text("empty")}</p><button className="button button-secondary" onClick={() => { const next = { ...answers, closure: "any" as const }; setAnswers(next); setSubmitted(next); }}>{text("relax")}</button></aside>}
    <div className="studio-product-grid">{matches.map(({ product }) => <div key={product.code}>
      <EuropeCard product={product} locale={locale} />
      <div className="europe-finder-reasons"><strong>{text("why")}</strong><ul>
        {submitted && submitted.priority !== "open" && <li>{priorities[submitted.priority][index]}</li>}
        <li>{productFact(product.closure, locale)} · {productFact(product.upper, locale)}</li>
        <li>{t(locale, "sizes")}: {product.size}</li>
      </ul><button className="button button-secondary" type="button" onClick={() => add(product)}>{t(locale, "add")} ↗</button></div>
    </div>)}</div>
    <aside className="europe-finder-human"><h2>{text("human")}</h2><p>{text("humanText")}</p><a className="button" href={href("/sourcing-review")}>{text("human")} ↗</a><a className="studio-text-link" href={href("/request-quote")}>{t(locale, "quote")} ↗</a></aside>
  </section>;
}
