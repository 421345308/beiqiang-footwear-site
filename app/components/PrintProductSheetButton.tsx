"use client";

import { t } from "../data/europe-copy";
import type { PublicLocale } from "../lib/public-locales";
import { trackEvent } from "../lib/tracking";
import { printWithBodyClass } from "../lib/print-mode";

export default function PrintProductSheetButton({ styleCode, locale = "en" }: { styleCode: string; locale?: PublicLocale }) {
  function printSheet() {
    trackEvent("product_spec_sheet_print", { context: "product_spec_sheet", styleCode });
    printWithBodyClass("product-sheet-printing");
  }

  return <button className="button button-secondary product-print-button" type="button" onClick={printSheet}>{locale === "zh" ? "打印 / 保存产品资料" : locale === "en" ? "Print / save product sheet" : t(locale, "printProduct")}</button>;
}
