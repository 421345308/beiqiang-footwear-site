import reviewedCatalog from "./reviewed-catalog.json" with { type: "json" };
import { FACTORY_SOURCE_CODES } from "./factory-source-codes.ts";

// Keep the historical publication set stable. The owner confirmed on 2026-11-01
// that all currently displayed styles are Beiqiang factory products; old image
// provenance remains historical evidence, not the current supply classification.
export const EXTERNAL_SOURCE_CODES = new Set([...reviewedCatalog.map(product => product.code), "BQ-C2627", "BQ-CA67", "BQ-M858", "BQ-LQ059", "BQ-LQ060", "BQ-LQ2597"]);
export const PUBLISHED_PRODUCT_CODES = new Set([...FACTORY_SOURCE_CODES, ...EXTERNAL_SOURCE_CODES]);
export function supplyMode(code: string): "own-factory" | "partner-sourced" {
  if (PUBLISHED_PRODUCT_CODES.has(code)) return "own-factory";
  throw new Error(`Product is not approved for publication: ${code}`);
}
