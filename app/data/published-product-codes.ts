import reviewedCatalog from "./reviewed-catalog.json" with { type: "json" };
import { FACTORY_SOURCE_CODES } from "./factory-source-codes.ts";

// This registry controls publication only. Product supply records are maintained
// in the operations workspace and are not customer-facing classifications.
export const ADDITIONAL_PRODUCT_CODES = new Set([...reviewedCatalog.map(product => product.code), "BQ-C2627", "BQ-CA67", "BQ-M858", "BQ-LQ059", "BQ-LQ060", "BQ-LQ2597"]);
export const PUBLISHED_PRODUCT_CODES = new Set([...FACTORY_SOURCE_CODES, ...ADDITIONAL_PRODUCT_CODES]);
