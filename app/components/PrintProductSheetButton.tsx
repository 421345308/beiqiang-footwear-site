"use client";

import { trackEvent } from "../lib/tracking";
import { printWithBodyClass } from "../lib/print-mode";

export default function PrintProductSheetButton({ styleCode }: { styleCode: string }) {
  function printSheet() {
    trackEvent("product_spec_sheet_print", { context: "product_spec_sheet", styleCode });
    printWithBodyClass("product-sheet-printing");
  }

  return <button className="button button-secondary product-print-button" type="button" onClick={printSheet}>Print / save product sheet</button>;
}
