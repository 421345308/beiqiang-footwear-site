import codes from "./line-sheet-selection.json" with { type: "json" };
import printPhotoCodes from "./print-photo-selection.json" with { type: "json" };

// This is the set in the already distributed PDF snapshot, not a product master.
// A website-only product is added here only when it is included in a later sheet.
export const LINE_SHEET_CODES = new Set<string>(codes);
export const lineSheetProductCount = codes.length;

// Existing print-photo selection is independent of the downloadable catalogue.
// Adding a style to the website PDF must not automatically add its print photos.
export const PRINT_PHOTO_CODES = new Set<string>(printPhotoCodes);
if (PRINT_PHOTO_CODES.size !== printPhotoCodes.length) throw new Error("The print-photo selection contains duplicates.");

export function selectLineSheetProducts<T extends { code: string }>(products: T[]): T[] {
  const selected = products.filter((product) => LINE_SHEET_CODES.has(product.code));
  if (selected.length !== LINE_SHEET_CODES.size || LINE_SHEET_CODES.size !== codes.length) {
    throw new Error("The line-sheet selection contains missing or duplicate products.");
  }
  return selected;
}

export function isInLineSheetSnapshot(code: string): boolean {
  return LINE_SHEET_CODES.has(code);
}

export function isInPrintPhotoSnapshot(code: string): boolean {
  return PRINT_PHOTO_CODES.has(code);
}
