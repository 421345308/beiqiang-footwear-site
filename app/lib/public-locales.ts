// Only complete, published language versions appear in navigation or alternates.
// Additional languages can reuse the page templates once their content is ready.
export const publicLocales = [
  { id: "en", hreflang: "en", label: "English", prefix: "" },
  { id: "zh", hreflang: "zh-CN", label: "简体中文", prefix: "/zh" },
] as const;
export type PublicLocale = typeof publicLocales[number]["id"];
export const siteOrigin = "https://www.beiqiang.online";
export function localizedPath(path: string, locale: PublicLocale = "en") {
  const base = path === "/" ? "/" : `/${path.replace(/^\/+|\/+$/g, "")}/`;
  return `${publicLocales.find(item => item.id === locale)!.prefix}${base}`;
}
export function pageAlternates(path: string, locale: PublicLocale = "en") {
  return {
    canonical: `${siteOrigin}${localizedPath(path, locale)}`,
    languages: Object.fromEntries([
      ...publicLocales.map(item => [item.hreflang, `${siteOrigin}${localizedPath(path, item.id)}`]),
      ["x-default", `${siteOrigin}${localizedPath(path, "en")}`],
    ]),
  };
}
export function productPageRoutes(slugs: string[]) {
  return slugs.flatMap(slug => publicLocales.map(locale => ({
    pathname: localizedPath(`/products/${slug}`, locale.id).replace(/\/$/, ""),
    locale: locale.id, lang: locale.hreflang,
  })));
}
