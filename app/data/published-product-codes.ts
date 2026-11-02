import reviewedCatalog from "./reviewed-catalog.json" with { type: "json" };
// This registry controls which product pages are published.
const coreProductCodes = Array.from({ length: 31 }, (_, i) => `BQ${String(i + 1).padStart(3, "0")}`);
export const ADDITIONAL_PRODUCT_CODES = new Set([...reviewedCatalog.map(product => product.code), "BQ-C2627", "BQ-CA67", "BQ-M858", "BQ-LQ059", "BQ-LQ060", "BQ-LQ2597"]);
export const PUBLISHED_PRODUCT_CODES = new Set([...coreProductCodes, ...ADDITIONAL_PRODUCT_CODES]);
