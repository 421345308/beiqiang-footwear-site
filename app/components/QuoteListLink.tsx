"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QUOTE_LIST_EVENT, quoteListCount } from "../lib/quote-list";

export default function QuoteListLink() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = () => setCount(quoteListCount());
    refresh();
    window.addEventListener(QUOTE_LIST_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener(QUOTE_LIST_EVENT, refresh); window.removeEventListener("storage", refresh); };
  }, []);

  return <Link className="button button-small quote-list-link" href="/request-quote/">Quote list <span aria-label={`${count} selected styles`}>{count}</span></Link>;
}
