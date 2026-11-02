// Website projection of the operations product matrix, reviewed 2026-10-29.
// Specifications and images continue to come from products.ts.
export const selectedAssortment = [
  { code: "BQ008", en: "Layered mesh sneakers with a sculpted profile.", zh: "拼接网布运动鞋，轮廓更有层次。" },
  { code: "BQ009", en: "Everyday lace-up sneakers with a clean profile.", zh: "简洁系带运动鞋，适合日常系列选款。" },
  { code: "BQ031", en: "A wide-toe knit option with sizes from EU 38 to 47.", zh: "宽鞋头针织款，已记录尺码覆盖 EU 38–47。" },
] as const;

export const selectedCatalogue = {
  path: "/downloads/beiqiang-selected-casual-footwear.pdf",
  styleCount: 7,
  pageCount: 6,
  language: "English",
} as const;
