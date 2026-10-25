import { FACTORY_SOURCE_CODES } from "./factory-source-codes.ts";

// Publication and manufacturing origin are separate decisions. Approved external
// styles have real product/source records; they are never added to the factory set.
export const EXTERNAL_SOURCE_CODES = new Set(["BQ-LQ059", "BQ-LQ060", "BQ-LQ2597"]);
export const PUBLISHED_PRODUCT_CODES = new Set([...FACTORY_SOURCE_CODES, ...EXTERNAL_SOURCE_CODES]);
export function supplyMode(code: string): "own-factory" | "partner-sourced" {
  if (FACTORY_SOURCE_CODES.has(code)) return "own-factory";
  if (EXTERNAL_SOURCE_CODES.has(code)) return "partner-sourced";
  throw new Error(`Product is not approved for publication: ${code}`);
}
