import type { PublicLocale } from "./public-locales.ts";
import type { QuoteLine } from "./quote-list.ts";
import type { SharedQuoteSelection } from "./quote-list-share.ts";

export const quoteShareCopy = {
  en: {
    title: "Share this selection with your buying team",
    notice: "The link includes style, colour, size and quantity. Anyone with the link can see them. Notes and contact details are not included.",
    button: "Copy selection link", copied: "Selection link copied.", manual: "Copy the link below to share this selection.",
    tooLong: "This selection is too long to share in one link. Shorten the size or quantity fields or share fewer styles.",
    imported: (n: number) => `Imported ${n} shared style${n === 1 ? "" : "s"}.`, filled: (n: number) => `Filled empty fields for ${n} existing style${n === 1 ? "" : "s"}.`,
    unchanged: "No new styles were added; they are already in the list or it is full.", invalid: "This link did not contain a valid catalogue style.",
    existing: "Existing entries were preserved. Shared details for those styles:", colour: "Colour", size: "Size", quantity: "Quantity",
  },
  zh: {
    title: "与采购团队分享选款", notice: "链接包含款号、颜色、尺码和数量，持有链接的人均可查看；不包含备注或联系资料。",
    button: "复制选款链接", copied: "已复制选款链接。", manual: "请复制下方链接分享选款。",
    tooLong: "选款信息过长，无法生成一个分享链接。请缩短尺码或数量内容，或分批分享。",
    imported: (n: number) => `已导入${n}款共享产品。`, filled: (n: number) => `已补充${n}款已有产品的空白信息。`, unchanged: "没有新增款式：产品已在清单中，或清单已满。", invalid: "该链接没有有效的目录款号。",
    existing: "已有产品的信息保持不变。链接中的对应需求：", colour: "颜色", size: "尺码", quantity: "数量",
  },
  de: {
    title: "Auswahl mit Ihrem Einkaufsteam teilen", notice: "Der Link enthält Modell, Farbe, Größe und Menge. Alle Personen mit dem Link können diese sehen. Notizen und Kontaktdaten werden nicht geteilt.",
    button: "Auswahllink kopieren", copied: "Auswahllink kopiert.", manual: "Kopieren Sie den folgenden Link, um die Auswahl zu teilen.",
    tooLong: "Die Auswahl ist für einen Link zu lang. Kürzen Sie Größe oder Menge oder teilen Sie weniger Modelle.",
    imported: (n: number) => `${n} geteilte Modelle importiert.`, filled: (n: number) => `Leere Felder bei ${n} vorhandenen Modellen ergänzt.`, unchanged: "Keine neuen Modelle hinzugefügt: Sie stehen bereits auf der Liste oder die Liste ist voll.", invalid: "Der Link enthält kein gültiges Katalogmodell.",
    existing: "Vorhandene Einträge bleiben unverändert. Geteilte Angaben für diese Modelle:", colour: "Farbe", size: "Größe", quantity: "Menge",
  },
  fr: {
    title: "Partager cette sélection avec votre équipe achats", notice: "Le lien contient les modèles, coloris, pointures et quantités. Toute personne disposant du lien peut les consulter. Les notes et coordonnées ne sont pas incluses.",
    button: "Copier le lien de sélection", copied: "Lien de sélection copié.", manual: "Copiez le lien ci-dessous pour partager la sélection.",
    tooLong: "La sélection est trop longue pour un seul lien. Réduisez les champs de pointure ou quantité, ou partagez moins de modèles.",
    imported: (n: number) => `${n} modèle(s) partagé(s) importé(s).`, filled: (n: number) => `Champs vides complétés pour ${n} modèle(s) déjà présent(s).`, unchanged: "Aucun modèle ajouté : il figure déjà dans la liste ou la liste est pleine.", invalid: "Ce lien ne contient aucun modèle valide du catalogue.",
    existing: "Les lignes existantes sont conservées. Détails partagés pour ces modèles :", colour: "Coloris", size: "Pointure", quantity: "Quantité",
  },
  es: {
    title: "Compartir la selección con su equipo de compras", notice: "El enlace incluye modelo, color, talla y cantidad. Cualquier persona con el enlace puede verlos. No incluye notas ni datos de contacto.",
    button: "Copiar enlace de selección", copied: "Enlace de selección copiado.", manual: "Copie el siguiente enlace para compartir la selección.",
    tooLong: "La selección es demasiado larga para un solo enlace. Acorte los campos de talla o cantidad, o comparta menos modelos.",
    imported: (n: number) => `${n} modelo(s) compartido(s) importado(s).`, filled: (n: number) => `Se completaron campos vacíos de ${n} modelo(s) existente(s).`, unchanged: "No se añadieron modelos: ya están en la lista o la lista está completa.", invalid: "El enlace no contiene ningún modelo válido del catálogo.",
    existing: "Se conservaron las entradas existentes. Datos compartidos de esos modelos:", colour: "Color", size: "Talla", quantity: "Cantidad",
  },
} satisfies Record<PublicLocale, { title: string; notice: string; button: string; copied: string; manual: string; tooLong: string; imported: (n: number) => string; filled: (n: number) => string; unchanged: string; invalid: string; existing: string; colour: string; size: string; quantity: string }>;

export function sharedImportMessage(locale: PublicLocale, codes: string[], imported: number, current: QuoteLine[], selections: SharedQuoteSelection[], updated = 0) {
  const copy = quoteShareCopy[locale];
  let message = codes.length ? (imported ? copy.imported(imported) : updated ? copy.filled(updated) : copy.unchanged) : copy.invalid;
  if (imported && updated) message += ` ${copy.filled(updated)}`;
  const existing = selections.filter(item => current.some(line => line.code.toUpperCase() === item.code) && (item.colors || item.sizes || item.quantity));
  if (existing.length) {
    const details = existing.map(item => [item.code, item.colors && `${copy.colour}: ${item.colors}`, item.sizes && `${copy.size}: ${item.sizes}`, item.quantity && `${copy.quantity}: ${item.quantity}`].filter(Boolean).join(" · ")).join("; ");
    message += ` ${copy.existing} ${details}`;
  }
  return message;
}
