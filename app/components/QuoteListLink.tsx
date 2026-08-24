"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QUOTE_LIST_EVENT, quoteListCount } from "../lib/quote-list";

export default function QuoteListLink({ locale = "en" }: { locale?: "en" | "zh" }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = () => setCount(quoteListCount());
    refresh();
    window.addEventListener(QUOTE_LIST_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener(QUOTE_LIST_EVENT, refresh); window.removeEventListener("storage", refresh); };
  }, []);

  return <Link className="button button-small quote-list-link" href={locale === "zh" ? "/zh/request-quote/" : "/request-quote/"}>{locale === "zh" ? "询价单" : "Quote list"} <span aria-label={locale === "zh" ? `已选${count}款` : `${count} selected styles`}>{count}</span></Link>;
}
