"use client";

import { printWithBodyClass } from "../lib/print-mode";

export default function BuyerProjectPrintButton({ locale = "en" }: { locale?: "en" | "zh" }) {
  const label = locale === "zh" ? "打印 / 保存项目摘要" : "Print / save project summary";
  const title = locale === "zh" ? "仅用于采购团队内部核对，不是报价、合同或生产订单" : "For internal sourcing review only; not a quotation, contract or production order";
  return <button className="button button-secondary buyer-project-print-button" type="button" title={title} onClick={() => printWithBodyClass("buyer-project-printing")}>{label}</button>;
}
