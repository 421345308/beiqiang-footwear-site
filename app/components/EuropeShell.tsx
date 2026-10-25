"use client";
import { useEffect, useState } from "react";
import { t, type EuropeLocale, type CopyKey } from "../data/europe-copy";
import { localizedPath } from "../lib/public-locales";
import { readQuoteList, QUOTE_LIST_EVENT } from "../lib/quote-list";
import LanguageSelector from "./LanguageSelector";
export default function EuropeShell({
  locale,
  path,
  children,
}: {
  locale: EuropeLocale;
  path: string;
  children: React.ReactNode;
}) {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.documentElement.lang = locale;
    const update = () => setCount(readQuoteList().length);
    update();
    window.addEventListener(QUOTE_LIST_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(QUOTE_LIST_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, [locale]);
  const href = (p: string) => localizedPath(p, locale);
  return (
    <main lang={locale} className="studio-page europe-site">
      <header className="europe-header">
        <a
          className="brand"
          href={href("/")}
          aria-label={`Beiqiang · ${t(locale, "home")}`}
        >
          <span className="brand-mark">BQ</span>
          <span>
            <strong>BEIQIANG</strong>
            <small>FOOTWEAR</small>
          </span>
        </a>
        <nav className="europe-desktop-nav" aria-label={t(locale, "menu")}>
          {(
            ["products", "product-finder", "factory", "buyer-guide"] as const
          ).map((p, i) => (
            <a key={p} href={href(p)}>
              {t(
                locale,
                ["products", "finder", "factory", "guide"][i] as CopyKey,
              )}
            </a>
          ))}
        </nav>
        <LanguageSelector locale={locale} path={path} />
        <a
          className="europe-quote-link"
          href={href("/request-quote")}
          aria-label={`${t(locale, "quote")} (${count})`}
        >
          {t(locale, "quote")} <b>{count}</b>
        </a>
        <button
          className="europe-menu-button"
          aria-expanded={open}
          aria-controls="europe-menu"
          onClick={() => setOpen(!open)}
        >
          {t(locale, open ? "close" : "menu")}
        </button>
      </header>
      {open && (
        <nav
          id="europe-menu"
          className="europe-mobile-nav"
          aria-label={t(locale, "menu")}
        >
          {(
            [
              "products",
              "product-finder",
              "factory",
              "buyer-guide",
              "request-quote",
            ] as const
          ).map((p, i) => (
            <a key={p} href={href(p)}>
              {t(
                locale,
                ["products", "finder", "factory", "guide", "quote"][
                  i
                ] as CopyKey,
              )}
            </a>
          ))}
        </nav>
      )}
      {children}
      <footer className="europe-footer">
        <div>
          <strong>BEIQIANG</strong>
          <p>{t(locale, "footer")}</p>
          <p>Quanzhou Beiqiang Footwear &amp; Apparel Co., Ltd.</p>
          <p>Quanzhou · Fujian · China</p>
        </div>
        <nav>
          {(
            [
              "products",
              "factory",
              "buyer-guide",
              "line-sheet",
              "privacy",
              "terms",
            ] as const
          ).map((p, i) => (
            <a key={p} href={href(p)}>
              {t(
                locale,
                [
                  "products",
                  "factory",
                  "guide",
                  "lineSheet",
                  "privacy",
                  "terms",
                ][i] as CopyKey,
              )}
            </a>
          ))}
        </nav>
        <div>
          <a href="mailto:shepeiqiang@gmail.com">shepeiqiang@gmail.com</a>
          <a
            href="https://wa.me/8618959805256"
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp +86 189 5980 5256
          </a>
          <p>{t(locale, "availability")}</p>
        </div>
      </footer>
    </main>
  );
}
