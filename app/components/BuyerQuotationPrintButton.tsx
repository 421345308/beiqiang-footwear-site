"use client";

import { printWithBodyClass } from "../lib/print-mode";

export default function BuyerQuotationPrintButton({ locale = "en" }: { locale?: "en" | "zh" }) {
  return <button className="button button-secondary buyer-quotation-print-button" type="button" onClick={() => printWithBodyClass("buyer-quotation-printing")}>{locale === "zh" ? "打印 / 保存报价PDF" : "Print / save quotation PDF"}</button>;
}
