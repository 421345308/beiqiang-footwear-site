"use client";
import { useEffect, useState } from "react";
import {
  publicLocales,
  basePublicPath,
  supportsLocalePath,
  localizedPath,
  type PublicLocale,
} from "../lib/public-locales";

export default function LanguageSelector({
  locale,
  alternateHref,
  path,
}: {
  locale: PublicLocale;
  alternateHref?: string;
  path?: string;
}) {
  const [current, setCurrent] = useState(
    path || basePublicPath(alternateHref || "/"),
  );
  const [query, setQuery] = useState("");
  useEffect(() => {
    const refresh = () => {
      setCurrent(basePublicPath(window.location.pathname));
      setQuery(window.location.search + window.location.hash);
    };
    refresh();
    window.addEventListener("popstate", refresh);
    return () => window.removeEventListener("popstate", refresh);
  }, [path, alternateHref]);
  const label = {
    en: "Language",
    zh: "语言",
    de: "Sprache",
    fr: "Langue",
    es: "Idioma",
  }[locale];
  function href(id: PublicLocale) {
    return (
      localizedPath(supportsLocalePath(current, id) ? current : "/", id) + query
    );
  }
  return (
    <details
      className="language-selector"
      onToggle={(event) => {
        if (event.currentTarget.open)
          setQuery(window.location.search + window.location.hash);
      }}
    >
      <summary aria-label={label}>
        <span>{label}</span>
        <strong>{locale.toUpperCase()}</strong>
      </summary>
      <div className="language-selector-menu" aria-label={label}>
        {publicLocales.map((item) =>
          item.id === locale ? (
            <span key={item.id} aria-current="page">
              <b>{item.label}</b>
              <small>✓</small>
            </span>
          ) : (
            <a
              key={item.id}
              href={href(item.id)}
              hrefLang={item.hreflang}
              lang={item.hreflang}
            >
              <b>{item.label}</b>
              <small>
                {supportsLocalePath(current, item.id)
                  ? item.id.toUpperCase()
                  : {
                      en: "Home",
                      zh: "首页",
                      de: "Startseite",
                      fr: "Accueil",
                      es: "Inicio",
                    }[item.id]}
              </small>
            </a>
          ),
        )}
      </div>
    </details>
  );
}
