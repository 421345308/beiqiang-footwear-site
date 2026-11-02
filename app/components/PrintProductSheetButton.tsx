"use client";

import { t } from "../data/europe-copy";
import type { PublicLocale } from "../lib/public-locales";
import { trackEvent } from "../lib/tracking";
import { printWithBodyClass } from "../lib/print-mode";
import { useClientReady } from "./useClientReady";

export default function PrintProductSheetButton({ styleCode, locale = "en" }: { styleCode: string; locale?: PublicLocale }) {
  const ready = useClientReady();
  function printSheet() {
    trackEvent("product_spec_sheet_print", { context: "product_spec_sheet", styleCode });
    printWithBodyClass("product-sheet-printing");
  }

  return <button className="button button-secondary product-print-button" type="button" disabled={!ready} onClick={printSheet}>{locale === "zh" ? "打印 / 保存产品资料" : locale === "en" ? "Print / save product sheet" : t(locale, "printProduct")}</button>;
}
