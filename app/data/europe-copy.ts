// Reviewed site copy. Values are German, French and Spanish; product facts live separately.
export const europeLocales = ["de", "fr", "es"] as const;
export type EuropeLocale = (typeof europeLocales)[number];
export const copy = {
  printProduct: ["Produktblatt drucken / speichern", "Imprimer / enregistrer la fiche produit", "Imprimir / guardar la ficha del producto"],
  home: ["Startseite", "Accueil", "Inicio"],
  products: ["Kollektion", "Collection", "Colección"],
  finder: ["Schuhe auswählen", "Trouver des modèles", "Encontrar modelos"],
  factory: ["Unser Unternehmen", "Notre entreprise", "Nuestra empresa"],
  guide: ["Einkaufsleitfaden", "Guide d’achat", "Guía de compra"],
  quote: ["Anfrageliste", "Liste de demande", "Lista de consulta"],
  language: ["Sprache", "Langue", "Idioma"],
  menu: ["Menü", "Menu", "Menú"],
  close: ["Schließen", "Fermer", "Cerrar"],
  hero: [
    "Schuhe für Ihre Kollektion. Fertigung für Ihre Marke.",
    "Des chaussures pour votre collection. Une fabrication pour votre marque.",
    "Calzado para su colección. Fabricación para su marca.",
  ],
  intro: [
    "Beiqiang in Quanzhou, China, unterstützt Marken, Importeure und Großhändler bei der Modellauswahl, Musterprüfung und Entwicklung individueller Schuhprojekte.",
    "Basée à Quanzhou, en Chine, Beiqiang accompagne les marques, importateurs et grossistes dans la sélection de modèles, l’examen des échantillons et le développement de projets de chaussures.",
    "Desde Quanzhou, China, Beiqiang acompaña a marcas, importadores y mayoristas en la selección de modelos, la revisión de muestras y el desarrollo de proyectos de calzado.",
  ],
  browse: [
    "Kollektion entdecken",
    "Découvrir la collection",
    "Explorar la colección",
  ],
  custom: [
    "Markenprojekt besprechen",
    "Présenter votre projet de marque",
    "Consultar un proyecto de marca",
  ],
  factoryRange: [
    "Eigene Fertigung und ergänzende Partnerkollektion",
    "Fabrication propre et collection de partenaires",
    "Fabricación propia y colección de proveedores asociados",
  ],
  supplyIntro: [
    "Jedes Modell weist seine Lieferart aus. Beiqiang-Werksmodelle und Modelle von Fertigungspartnern werden getrennt gekennzeichnet. Materialien, verfügbare Ausführungen und Termine werden für jeden Auftrag bestätigt.",
    "Le mode d’approvisionnement est indiqué pour chaque modèle : fabrication Beiqiang ou fournisseur partenaire. Les matières, variantes disponibles et délais sont confirmés pour chaque commande.",
    "Cada modelo indica su origen de suministro: fabricación de Beiqiang o proveedor asociado. Los materiales, las variantes disponibles y los plazos se confirman para cada pedido.",
  ],
  selectTitle: [
    "Die passende Auswahl beginnt beim Produkt.",
    "Une sélection qui commence par le produit.",
    "La selección empieza por el producto.",
  ],
  catalogIntro: [
    "Vergleichen Sie dokumentierte Modelle und echte Farbfotos. Größenbereiche dienen der Auswahl und sind keine Lagerbestandsanzeige.",
    "Comparez les modèles documentés et leurs photos réelles par coloris. Les plages de pointures facilitent la sélection ; elles ne représentent pas un stock disponible.",
    "Compare modelos documentados y fotografías reales por color. Los rangos de tallas orientan la selección; no indican existencias disponibles.",
  ],
  search: [
    "Modell, Bezeichnung oder Farbe suchen",
    "Rechercher un modèle, un nom ou un coloris",
    "Buscar modelo, nombre o color",
  ],
  category: ["Produktkategorie", "Catégorie", "Categoría"],
  closure: ["Verschluss", "Fermeture", "Cierre"],
  colour: ["Farbe", "Coloris", "Color"],
  sizes: ["Größen", "Pointures", "Tallas"],
  size: ["EU-Größe", "Pointure EU", "Talla EU"],
  all: ["Alle", "Tous", "Todos"],
  filters: ["Filter", "Filtres", "Filtros"],
  reset: ["Filter zurücksetzen", "Effacer les filtres", "Restablecer filtros"],
  results: [
    "passende Modelle",
    "modèles correspondants",
    "modelos encontrados",
  ],
  more: [
    "Weitere Modelle anzeigen",
    "Afficher plus de modèles",
    "Mostrar más modelos",
  ],
  noResults: [
    "Keine passenden Modelle. Ändern Sie die Filter oder senden Sie uns Ihre Anforderungen.",
    "Aucun modèle correspondant. Modifiez les filtres ou envoyez-nous vos besoins.",
    "No hay modelos que coincidan. Cambie los filtros o envíenos sus requisitos.",
  ],
  sort: ["Sortierung", "Tri", "Orden"],
  ascending: [
    "Modellnummer aufsteigend",
    "Référence croissante",
    "Referencia ascendente",
  ],
  descending: [
    "Modellnummer absteigend",
    "Référence décroissante",
    "Referencia descendente",
  ],
  share: ["Auswahl teilen", "Partager la sélection", "Compartir selección"],
  copied: ["Link kopiert", "Lien copié", "Enlace copiado"],
  copyFailed: [
    "Kopieren Sie den Link aus der Adresszeile.",
    "Copiez le lien dans la barre d’adresse.",
    "Copie el enlace de la barra de direcciones.",
  ],
  compare: ["Vergleichen", "Comparer", "Comparar"],
  compared: [
    "Zum Vergleich ausgewählt",
    "Sélectionné pour comparaison",
    "Seleccionado para comparar",
  ],
  compareTitle: [
    "Modelle im Vergleich",
    "Comparaison des modèles",
    "Comparación de modelos",
  ],
  compareHint: [
    "Wählen Sie 2 bis 4 Modelle. Vergleichen Sie die dokumentierten Merkmale vor der Anfrage.",
    "Sélectionnez 2 à 4 modèles pour comparer les caractéristiques documentées avant votre demande.",
    "Seleccione de 2 a 4 modelos para comparar sus características documentadas antes de consultar.",
  ],
  compareLimit: [
    "Maximal 4 Modelle im Vergleich.",
    "La comparaison est limitée à 4 modèles.",
    "Puede comparar un máximo de 4 modelos.",
  ],
  remove: ["Entfernen", "Retirer", "Eliminar"],
  view: ["Modelldetails", "Voir le modèle", "Ver modelo"],
  upper: ["Obermaterial", "Tige", "Material del corte"],
  sole: ["Sohle", "Semelle", "Suela"],
  own: [
    "Modell aus der Beiqiang-Fertigung",
    "Modèle fabriqué par Beiqiang",
    "Modelo de fabricación Beiqiang",
  ],
  partner: [
    "Lieferung über einen Fertigungspartner",
    "Fourni par un partenaire de fabrication",
    "Suministrado por un fabricante asociado",
  ],
  availability: [
    "Farben, Größen, Materialausführung und Liefertermin werden für Ihren Auftrag bestätigt.",
    "Les coloris, pointures, matières et délais sont confirmés pour votre commande.",
    "Los colores, tallas, materiales y plazos se confirman para su pedido.",
  ],
  allPhotos: [
    "Alle Modellfotos",
    "Toutes les photos du modèle",
    "Todas las fotos del modelo",
  ],
  photo: ["Foto", "Photo", "Foto"],
  gallery: ["Produktbilder", "Photos du produit", "Fotos del producto"],
  zoom: ["Foto vergrößern", "Agrandir la photo", "Ampliar foto"],
  previous: ["Vorheriges Foto", "Photo précédente", "Foto anterior"],
  next: ["Nächstes Foto", "Photo suivante", "Foto siguiente"],
  chooseColour: [
    "Farbe für Ihre Anfrage wählen",
    "Choisir un coloris pour la demande",
    "Elegir un color para la consulta",
  ],
  add: [
    "Zur Anfrageliste hinzufügen",
    "Ajouter à la demande",
    "Añadir a la consulta",
  ],
  added: [
    "In Ihrer Anfrageliste gespeichert",
    "Enregistré dans votre liste",
    "Guardado en su lista",
  ],
  listFull: [
    "Ihre Liste enthält bereits 12 Modelle. Entfernen Sie zuerst ein Modell.",
    "Votre liste contient déjà 12 modèles. Retirez-en un avant de continuer.",
    "Su lista ya contiene 12 modelos. Elimine uno antes de continuar.",
  ],
  specs: [
    "Produkt und Ausführung",
    "Produit et configuration",
    "Producto y configuración",
  ],
  fitNote: [
    "Passform, Futter und genaue Materialzusammensetzung anhand des gewählten Musters prüfen. Fotos belegen weder Prüfwerte noch aktuelle Verfügbarkeit.",
    "Vérifiez le chaussant, la doublure et la composition exacte sur l’échantillon retenu. Les photos ne prouvent ni les performances testées ni la disponibilité actuelle.",
    "Confirme el ajuste, el forro y la composición exacta con la muestra elegida. Las fotos no acreditan resultados de ensayos ni disponibilidad actual.",
  ],
  wideNote: [
    "Für dieses Modell ist ein breiter Zehenbereich dokumentiert. Dies bestätigt keine Gesamtweite des Leistens; Passform und Größenstaffelung am Muster prüfen.",
    "Ce modèle possède un avant-pied large documenté. Cela ne définit pas la largeur globale de la forme ; vérifiez le chaussant et la gradation sur échantillon.",
    "Este modelo tiene una puntera amplia documentada. Esto no define el ancho total de la horma; confirme el ajuste y la progresión de tallas en la muestra.",
  ],
  branding: ["Marke und Verpackung", "Marque et emballage", "Marca y embalaje"],
  brandingText: [
    "Senden Sie Logo, Platzierung, Farbwünsche und Verpackungsvorgaben. Machbarkeit, Mindestmengen und Musterkosten werden für das konkrete Modell bewertet.",
    "Transmettez votre logo, son emplacement, les coloris souhaités et les exigences d’emballage. La faisabilité, les quantités minimales et le coût des échantillons sont évalués pour le modèle choisi.",
    "Envíe el logotipo, su ubicación, los colores deseados y los requisitos de embalaje. La viabilidad, las cantidades mínimas y los costes de muestras se evalúan para el modelo elegido.",
  ],
  samples: [
    "Muster und Lieferung",
    "Échantillons et livraison",
    "Muestras y entrega",
  ],
  samplesText: [
    "Geben Sie Farben, Größen, Mengen und Lieferort an. Musterverfügbarkeit, Kosten und geplanter Termin werden im schriftlichen Angebot festgehalten.",
    "Indiquez les coloris, pointures, quantités et destination. La disponibilité des échantillons, les frais et le calendrier proposé figurent dans le devis écrit.",
    "Indique colores, tallas, cantidades y destino. La disponibilidad de muestras, los costes y el calendario propuesto se recogerán en la oferta escrita.",
  ],
  finderIntro: [
    "Wählen Sie Ihr Sortiment und den bevorzugten Verschluss. Die Auswahl basiert auf dokumentierten Produkteigenschaften, nicht auf Verkaufsprognosen.",
    "Choisissez votre catégorie et votre fermeture préférée. La sélection repose sur les caractéristiques documentées, pas sur des prévisions de ventes.",
    "Elija su categoría y el cierre preferido. La selección se basa en características documentadas, no en previsiones de ventas.",
  ],
  quoteIntro: [
    "Prüfen Sie Modelle und Farben, ergänzen Sie Mengen und Kontaktdaten. Ihre Anfrage ist noch keine Bestellung.",
    "Vérifiez les modèles et coloris, puis précisez les quantités et vos coordonnées. Cette demande ne constitue pas une commande.",
    "Revise los modelos y colores e indique cantidades y datos de contacto. Esta consulta no constituye un pedido.",
  ],
  empty: [
    "Noch keine Modelle ausgewählt. Sie können auch eine allgemeine Beschaffungsanfrage senden.",
    "Aucun modèle sélectionné. Vous pouvez aussi envoyer une demande d’approvisionnement générale.",
    "Aún no ha seleccionado modelos. También puede enviar una consulta general de abastecimiento.",
  ],
  name: ["Kontaktperson", "Nom du contact", "Persona de contacto"],
  company: ["Unternehmen", "Entreprise", "Empresa"],
  buyerType: ["Einkäufertyp", "Profil d’acheteur", "Tipo de comprador"],
  importer: [
    "Importeur / Großhändler",
    "Importateur / grossiste",
    "Importador / mayorista",
  ],
  onlineSeller: [
    "Amazon- / TikTok-Händler",
    "Vendeur Amazon / TikTok",
    "Vendedor de Amazon / TikTok",
  ],
  brandBuyer: [
    "Marke / Eigenmarke",
    "Marque / marque propre",
    "Marca / marca propia",
  ],
  sourcingAgent: [
    "Beschaffungsagentur",
    "Agent d’approvisionnement",
    "Agente de compras",
  ],
  market: ["Zielmarkt", "Marché cible", "Mercado de destino"],
  quantity: [
    "Geplante Gesamtmenge",
    "Quantité totale prévue",
    "Cantidad total prevista",
  ],
  lineQuantity: [
    "Menge für dieses Modell",
    "Quantité pour ce modèle",
    "Cantidad de este modelo",
  ],
  destination: ["Lieferort", "Lieu de livraison", "Lugar de entrega"],
  timing: [
    "Gewünschter Liefertermin",
    "Date de livraison souhaitée",
    "Fecha de entrega deseada",
  ],
  sampleQuantity: [
    "Gewünschte Mustermenge",
    "Nombre d’échantillons souhaité",
    "Cantidad de muestras solicitada",
  ],
  requirements: [
    "Weitere Anforderungen",
    "Autres exigences",
    "Otros requisitos",
  ],
  notes: ["Hinweise zum Modell", "Notes sur le modèle", "Notas del modelo"],
  email: ["E-Mail", "E-mail", "Correo electrónico"],
  contactHint: [
    "Mindestens E-Mail oder WhatsApp angeben.",
    "Indiquez au moins un e-mail ou un numéro WhatsApp.",
    "Indique al menos un correo electrónico o un número de WhatsApp.",
  ],
  consent: [
    "Ich stimme zu, dass Beiqiang diese Angaben zur Bearbeitung und Beantwortung meiner Anfrage verwendet.",
    "J’accepte que Beiqiang utilise ces informations pour examiner ma demande et y répondre.",
    "Acepto que Beiqiang utilice estos datos para revisar y responder a mi consulta.",
  ],
  submit: ["Anfrage senden", "Envoyer la demande", "Enviar consulta"],
  sending: [
    "Anfrage wird gespeichert…",
    "Enregistrement en cours…",
    "Guardando consulta…",
  ],
  success: [
    "Ihre Anfrage wurde gespeichert.",
    "Votre demande a été enregistrée.",
    "Su consulta se ha guardado.",
  ],
  failure: [
    "Die Anfrage konnte nicht bestätigt werden. Ihre Angaben bleiben erhalten. Bitte versuchen Sie es erneut oder kontaktieren Sie uns per E-Mail.",
    "L’enregistrement n’a pas pu être confirmé. Vos données sont conservées. Réessayez ou contactez-nous par e-mail.",
    "No se pudo confirmar el registro. Sus datos se conservan. Inténtelo de nuevo o contacte por correo electrónico.",
  ],
  required: [
    "Bitte füllen Sie die Pflichtfelder aus und stimmen Sie der Verwendung Ihrer Angaben zu.",
    "Veuillez remplir les champs obligatoires et accepter l’utilisation de vos informations.",
    "Complete los campos obligatorios y acepte el uso de sus datos.",
  ],
  invalidEmail: [
    "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    "Veuillez saisir une adresse e-mail valide.",
    "Introduzca un correo electrónico válido.",
  ],
  reference: [
    "Anfragenummer",
    "Référence de la demande",
    "Referencia de consulta",
  ],
  accessCode: [
    "Privater Zugangscode",
    "Code d’accès privé",
    "Código de acceso privado",
  ],
  receiptNote: [
    "Bewahren Sie Nummer und Zugangscode vertraulich auf. Die Eingangsbestätigung wird in Ihrer gewählten Sprache versendet. Der geschützte Projektbereich ist derzeit auf Englisch und Chinesisch verfügbar. Ihre gewünschte Antwortsprache wird mitgesendet.",
    "Conservez la référence et le code en lieu sûr. L’accusé de réception est envoyé dans la langue choisie. L’espace projet sécurisé est actuellement en anglais et en chinois. Votre langue de réponse souhaitée est transmise avec la demande.",
    "Guarde la referencia y el código de forma privada. El acuse de recibo se envía en el idioma elegido. El área de proyecto protegida está disponible actualmente en inglés y chino. Se transmite el idioma de respuesta solicitado.",
  ],
  statusEnglish: [
    "Projektstatus ansehen (Englisch)",
    "Consulter le suivi du projet (anglais)",
    "Consultar estado del proyecto (inglés)",
  ],
  draftNote: [
    "Ihr Entwurf bleibt in diesem Browser-Tab erhalten, auch beim Sprachwechsel. Erst das Absenden übermittelt ihn an Beiqiang.",
    "Votre brouillon reste dans cet onglet, y compris lors d’un changement de langue. Il n’est transmis à Beiqiang qu’après envoi.",
    "El borrador se conserva en esta pestaña, incluso al cambiar de idioma. Solo se envía a Beiqiang al pulsar Enviar.",
  ],
  review: ["Anfrage prüfen", "Vérifier la demande", "Revisar consulta"],
  optional: ["optional", "facultatif", "opcional"],
  factoryTitle: [
    "Beiqiang · Schuhfertigung in Quanzhou",
    "Beiqiang · Fabrication de chaussures à Quanzhou",
    "Beiqiang · Fabricación de calzado en Quanzhou",
  ],
  factoryText: [
    "Quanzhou Beiqiang Footwear & Apparel Co., Ltd. arbeitet mit Marken und professionellen Einkäufern an bestehenden Modellen und OEM/ODM-Projekten. Die Aufnahmen zeigen Arbeitsbereiche und Fertigungsschritte. Eine konkrete Kapazität oder Zertifizierung wird damit nicht zugesichert.",
    "Quanzhou Beiqiang Footwear & Apparel Co., Ltd. travaille avec les marques et acheteurs professionnels sur des modèles existants et des projets OEM/ODM. Les images présentent les espaces de travail et les étapes de fabrication ; elles ne constituent pas une garantie de capacité ou de certification.",
    "Quanzhou Beiqiang Footwear & Apparel Co., Ltd. trabaja con marcas y compradores profesionales en modelos existentes y proyectos OEM/ODM. Las imágenes muestran áreas de trabajo y etapas de fabricación; no garantizan una capacidad concreta ni una certificación.",
  ],
  videoNote: [
    "Originalaufnahmen · englischer Kommentar, englische und chinesische Untertitel",
    "Images réelles · commentaire en anglais, sous-titres anglais et chinois",
    "Imágenes reales · narración en inglés, subtítulos en inglés y chino",
  ],
  processTitle: [
    "Vom Modell zur bestätigten Bestellung",
    "Du modèle à la commande confirmée",
    "Del modelo al pedido confirmado",
  ],
  step1: [
    "1. Modelle und Anforderungen auswählen",
    "1. Sélectionner les modèles et les besoins",
    "1. Seleccionar modelos y requisitos",
  ],
  step1text: [
    "Modellnummern, Farben, Größen, Zielmarkt und geplante Menge angeben.",
    "Indiquez les références, coloris, pointures, marché cible et quantité prévue.",
    "Indique referencias, colores, tallas, mercado de destino y cantidad prevista.",
  ],
  step2: [
    "2. Machbarkeit und Muster prüfen",
    "2. Vérifier la faisabilité et les échantillons",
    "2. Revisar viabilidad y muestras",
  ],
  step2text: [
    "Materialien, Passform, Änderungen, Prüfumfang und Musterkosten schriftlich abstimmen. Zielwerte sind keine bestätigten Ergebnisse.",
    "Validez par écrit les matières, le chaussant, les modifications, les contrôles et les coûts des échantillons. Les objectifs ne sont pas des résultats confirmés.",
    "Acuerde por escrito materiales, ajuste, cambios, alcance de revisión y costes de muestras. Los objetivos no son resultados confirmados.",
  ],
  step3: [
    "3. Angebot und Bestellung bestätigen",
    "3. Confirmer le devis et la commande",
    "3. Confirmar oferta y pedido",
  ],
  step3text: [
    "Preis, Mindestmenge, Verpackung, Liefertermin und Zahlungsbedingungen werden im Angebot und in der formellen Bestellung festgelegt. Die Abwicklung erfolgt über den bestätigten Alibaba-Trade-Assurance-Auftrag oder einen beidseitigen Vertrag.",
    "Le prix, les quantités minimales, l’emballage, les délais et le paiement sont fixés dans le devis et la commande formelle. La transaction passe par une commande Alibaba Trade Assurance confirmée ou un contrat entre les parties.",
    "El precio, las cantidades mínimas, el embalaje, los plazos y el pago se fijan en la oferta y el pedido formal. La operación se realiza mediante un pedido confirmado de Alibaba Trade Assurance o un contrato entre las partes.",
  ],
  step4: [
    "4. Produktion und Versand abstimmen",
    "4. Coordonner production et expédition",
    "4. Coordinar producción y envío",
  ],
  step4text: [
    "Freigegebene Ausführung, Prüfanforderungen, Kennzeichnung und Transportumfang vor der Produktion bestätigen.",
    "Confirmez la configuration approuvée, les contrôles, l’étiquetage et les modalités de transport avant la production.",
    "Confirme la configuración aprobada, los controles, el etiquetado y el alcance del transporte antes de producir.",
  ],
  privacy: ["Datenschutz", "Confidentialité", "Privacidad"],
  terms: [
    "Nutzungsbedingungen",
    "Conditions d’utilisation",
    "Condiciones de uso",
  ],
  privacyText: [
    "Verantwortlich ist Quanzhou Beiqiang Footwear & Apparel Co., Ltd. Wir verwenden die von Ihnen übermittelten Kontakt-, Unternehmens- und Beschaffungsangaben zur Bearbeitung Ihrer Anfrage und des zugehörigen Projekts. Zugriff erhalten zuständige Mitarbeiter und die dafür eingesetzten Hosting- und E-Mail-Dienste. Zur Sicherheit wird außerdem ein täglich wechselnder Hash der Verbindungsadresse gespeichert. Es gibt keine öffentliche Veröffentlichung Ihrer Anfrage.",
    "Quanzhou Beiqiang Footwear & Apparel Co., Ltd. est responsable du traitement. Nous utilisons les coordonnées et informations d’entreprise et d’achat transmises pour traiter votre demande et le projet associé. L’accès est limité au personnel concerné et aux services d’hébergement et d’e-mail utilisés à cette fin. Un hachage quotidien de l’adresse de connexion est également enregistré pour la sécurité. Votre demande n’est pas publiée.",
    "El responsable es Quanzhou Beiqiang Footwear & Apparel Co., Ltd. Utilizamos los datos de contacto, empresa y compra que envía para gestionar su consulta y el proyecto asociado. Acceden el personal correspondiente y los servicios de alojamiento y correo utilizados para ello. Por seguridad también se registra un hash diario de la dirección de conexión. Su consulta no se publica.",
  ],
  storageText: [
    "Die Anfrageliste bleibt auf Ihrem Gerät; der Formularentwurf wird für den aktuellen Browser-Tab gespeichert. Optionale Website-Statistiken werden erst nach Ihrer Zustimmung aktiviert. Sie können die Auswahl unten ändern. Zur Auskunft, Berichtigung oder Löschung schreiben Sie an shepeiqiang@gmail.com. Erforderliche Geschäftsunterlagen können weiterhin aufbewahrt werden; wir versprechen keine sofortige Löschung aller Daten.",
    "La liste de demande reste sur votre appareil ; le brouillon du formulaire est conservé dans l’onglet courant. Les statistiques facultatives ne sont activées qu’après votre accord, modifiable ci-dessous. Pour demander l’accès, la rectification ou la suppression, écrivez à shepeiqiang@gmail.com. Les documents commerciaux nécessaires peuvent être conservés ; nous ne promettons pas une suppression immédiate de toutes les données.",
    "La lista de consulta permanece en su dispositivo y el borrador se guarda en la pestaña actual. Las estadísticas opcionales solo se activan con su consentimiento, que puede cambiar abajo. Para solicitar acceso, rectificación o eliminación, escriba a shepeiqiang@gmail.com. Los documentos comerciales necesarios pueden conservarse; no se promete la eliminación inmediata de todos los datos.",
  ],
  termsText: [
    "Diese Website unterstützt die gewerbliche Produktauswahl und Beschaffung. Bilder und Angaben sind Produktreferenzen, kein verbindliches Angebot und keine Bestandszusage. Eine Anfrage, ein Musterentscheid oder eine Website-Bestätigung ersetzt weder eine formelle Bestellung noch einen Vertrag. Preise, Prüfwerte, Anpassungen, Lieferfristen und Zahlungen bedürfen einer schriftlichen Vereinbarung für das jeweilige Projekt.",
    "Ce site facilite la sélection et l’achat professionnels. Les photos et informations sont des références produit, pas une offre ferme ni une garantie de stock. Une demande, une décision sur échantillon ou une confirmation sur le site ne remplace pas une commande formelle ni un contrat. Les prix, performances testées, adaptations, délais et paiements nécessitent un accord écrit propre au projet.",
    "Este sitio facilita la selección y compra profesional. Las imágenes y los datos son referencias de producto, no una oferta vinculante ni una garantía de existencias. Una consulta, una decisión sobre una muestra o una confirmación web no sustituyen un pedido formal o contrato. Los precios, resultados de ensayos, adaptaciones, plazos y pagos requieren un acuerdo escrito para cada proyecto.",
  ],
  privacyChoice: [
    "Ihre Datenschutzauswahl",
    "Votre choix de confidentialité",
    "Su elección de privacidad",
  ],
  consentText: [
    "Notwendige Funktionen speichern Anfrageliste und Entwurf auf Ihrem Gerät. Optionale Statistiken helfen uns, die Website zu verbessern, und bleiben ohne Zustimmung deaktiviert.",
    "Les fonctions nécessaires enregistrent votre liste et votre brouillon sur votre appareil. Les statistiques facultatives nous aident à améliorer le site et restent désactivées sans votre accord.",
    "Las funciones necesarias guardan su lista y borrador en el dispositivo. Las estadísticas opcionales ayudan a mejorar el sitio y permanecen desactivadas sin su consentimiento.",
  ],
  essential: [
    "Nur notwendige Funktionen",
    "Fonctions nécessaires uniquement",
    "Solo funciones necesarias",
  ],
  analytics: [
    "Statistiken erlauben",
    "Accepter les statistiques",
    "Aceptar estadísticas",
  ],
  saved: ["Auswahl gespeichert", "Choix enregistré", "Preferencia guardada"],
  lineSheet: ["Produktkatalog", "Catalogue produits", "Catálogo de productos"],
  pdfNote: [
    "Laden Sie den deutschen Katalog mit Modellnummern, Fotos und dokumentierten Produktangaben herunter. Aktuelle Farbfotos und Details finden Sie über die Links im PDF.",
    "Téléchargez le catalogue en français avec les références, photos et caractéristiques documentées. Les liens du PDF ouvrent les photos par coloris et les détails actualisés.",
    "Descargue el catálogo en español con referencias, fotos y características documentadas. Los enlaces del PDF muestran fotos por color y detalles actualizados.",
  ],
  downloadPdf: ["PDF-Katalog herunterladen", "Télécharger le catalogue PDF", "Descargar catálogo PDF"],
  englishPdf: [
    "Katalog anfordern (Englisch)",
    "Demander le catalogue (anglais)",
    "Solicitar catálogo (inglés)",
  ],
  footer: [
    "Schuhfertigung · OEM/ODM · Großhandel",
    "Fabrication de chaussures · OEM/ODM · Vente en gros",
    "Fabricación de calzado · OEM/ODM · Venta mayorista",
  ],
  confirm: [
    "Nach Muster und schriftlichem Angebot zu bestätigen",
    "À confirmer sur échantillon et devis écrit",
    "Por confirmar con muestra y oferta escrita",
  ],
  paired: [
    "Größenangaben des Lieferanten. Vor Umrechnung auf Marktgrößen die Innensohlenlänge am Muster prüfen.",
    "Pointures indiquées par le fournisseur. Vérifiez la longueur de semelle intérieure sur échantillon avant toute conversion.",
    "Tallas indicadas por el proveedor. Confirme la longitud de la plantilla en la muestra antes de convertir tallas.",
  ],
} as const;
export type CopyKey = keyof typeof copy;
export function t(locale: EuropeLocale, key: CopyKey): string {
  return copy[key][europeLocales.indexOf(locale)];
}
export const categories = {
  "wide-toe-box": [
    "Breiter Zehenbereich",
    "Avant-pied large",
    "Puntera amplia",
  ],
  "knit-slip-on": [
    "Strickschuhe zum Hineinschlüpfen",
    "Chaussures en maille à enfiler",
    "Calzado de punto sin cordones",
  ],
  "breathable-lace-up": [
    "Textil-Schnürschuhe",
    "Chaussures textiles à lacets",
    "Calzado textil con cordones",
  ],
  high_top: [
    "Hohe Schuhe und Sockenschuhe",
    "Chaussures montantes et chaussettes",
    "Calzado alto y tipo calcetín",
  ],
  kids: ["Kinderschuhe", "Chaussures enfant", "Calzado infantil"],
  large_size: ["Erweiterte Größen", "Grandes pointures", "Tallas ampliadas"],
  fleece: [
    "Modelle mit Futteroption",
    "Modèles avec option de doublure chaude",
    "Modelos con opción de forro cálido",
  ],
  "clogs-and-vented-shoes": [
    "Clogs und perforierte Schuhe",
    "Sabots et chaussures ajourées",
    "Zuecos y calzado perforado",
  ],
  "mule-shoes": ["Mules", "Mules", "Mules"],
  "casual-sneakers": [
    "Freizeit-Sneaker",
    "Baskets décontractées",
    "Zapatillas casuales",
  ],
  "loafers-and-derbies": [
    "Loafer und Derbys",
    "Mocassins et derbies",
    "Mocasines y zapatos Derby",
  ],
  "ankle-boots": ["Stiefeletten", "Bottines", "Botines"],
  "slide-sandals": ["Pantoletten", "Claquettes", "Sandalias tipo pala"],
} as const;
export function translatedCategory(
  locale: EuropeLocale,
  key: keyof typeof categories,
) {
  return categories[key][europeLocales.indexOf(locale)];
}
