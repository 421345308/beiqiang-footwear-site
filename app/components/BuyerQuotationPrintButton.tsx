"use client";

import { printWithBodyClass } from "../lib/print-mode";

export default function BuyerQuotationPrintButton() {
  return <button className="button button-secondary buyer-quotation-print-button" type="button" onClick={() => printWithBodyClass("buyer-quotation-printing")}>Print / save quotation PDF</button>;
}
