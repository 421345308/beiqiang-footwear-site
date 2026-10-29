// Website projection of the operations product matrix, reviewed 2026-10-29.
// Specifications and images continue to come from products.ts.
export const selectedAssortment = [
  { code: "BQ008", en: "Layered mesh and a sculpted casual profile.", zh: "拼接网布与立体轮廓，丰富休闲系列外观。" },
  { code: "BQ009", en: "A cleaner textile lace-up for the everyday range.", zh: "简洁纺织系带款，补充日常休闲系列。" },
  { code: "BQ031", en: "A wide-toe knit option with sizes from EU 38 to 47.", zh: "宽鞋头针织款，已记录尺码覆盖 EU 38–47。" },
] as const;

export const selectedCatalogue = {
  path: "/downloads/beiqiang-selected-casual-footwear.pdf",
  styleCount: 8,
  pageCount: 6,
  language: "English",
} as const;
