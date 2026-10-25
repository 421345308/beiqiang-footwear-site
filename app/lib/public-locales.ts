// Navigation and SEO use the published route coverage below.
// New locales expose the localized sourcing journey; secondary EN/ZH tools remain explicit.
export const publicLocales = [
  { id: "en", hreflang: "en", label: "English", prefix: "" },
  { id: "zh", hreflang: "zh-CN", label: "简体中文", prefix: "/zh" },
  { id: "de", hreflang: "de", label: "Deutsch", prefix: "/de" },
  { id: "fr", hreflang: "fr", label: "Français", prefix: "/fr" },
  { id: "es", hreflang: "es", label: "Español", prefix: "/es" },
] as const;
export type PublicLocale = (typeof publicLocales)[number]["id"];
export type LegacyLocale = "en" | "zh";
export const europePages = [
  "/",
  "/products/",
  "/product-finder/",
  "/request-quote/",
  "/factory/",
  "/buyer-guide/",
  "/privacy/",
  "/terms/",
  "/line-sheet/",
  "/oem-odm/",
  "/quality-packing/",
  "/sample-order-process/",
  "/sourcing-review/",
];
export function basePublicPath(path: string) {
  return path.replace(/^\/(?:zh|de|fr|es)(?=\/|$)/, "") || "/";
}
export function supportsLocalePath(path: string, locale: PublicLocale) {
  const base = `/${basePublicPath(path).replace(/^\/+|\/+$/g, "")}${basePublicPath(path) === "/" ? "" : "/"}`;
  return (
    locale === "en" ||
    locale === "zh" ||
    europePages.includes(base) ||
    /^\/products\/bq(?:\d{3,4}|-[a-z0-9-]+)\/$/.test(base)
  );
}
export const siteOrigin = "https://www.beiqiang.online";
export function localizedPath(path: string, locale: PublicLocale = "en") {
  const base = path === "/" ? "/" : `/${path.replace(/^\/+|\/+$/g, "")}/`;
  return `${publicLocales.find((item) => item.id === locale)!.prefix}${base}`;
}
export function pageAlternates(path: string, locale: PublicLocale = "en") {
  return {
    canonical: `${siteOrigin}${localizedPath(path, locale)}`,
    languages: Object.fromEntries([
      ...publicLocales
        .filter((item) => supportsLocalePath(path, item.id))
        .map((item) => [
          item.hreflang,
          `${siteOrigin}${localizedPath(path, item.id)}`,
        ]),
      ["x-default", `${siteOrigin}${localizedPath(path, "en")}`],
    ]),
  };
}
export function productPageRoutes(slugs: string[]) {
  return slugs.flatMap((slug) =>
    publicLocales.map((locale) => ({
      pathname: localizedPath(`/products/${slug}`, locale.id).replace(
        /\/$/,
        "",
      ),
      locale: locale.id,
      lang: locale.hreflang,
    })),
  );
}
