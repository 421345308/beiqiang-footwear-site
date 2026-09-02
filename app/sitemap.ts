import type { MetadataRoute } from "next";
import { collections, products } from "./data/products";
import { buyerResources } from "./data/resources";
import { sourcingPrograms } from "./data/sourcing-programs";

const origin = "https://www.beiqiang.online";
const factoryVideo = {
  thumbnail: `${origin}/videos/beiqiang-factory-proof-poster.jpg`,
  content: `${origin}/videos/beiqiang-factory-proof.mp4`,
  publicationDate: "2026-08-28T00:00:00+08:00",
  duration: 35,
};

function absolute(route: string) {
  return `${origin}${route ? `${route}/` : "/"}`;
}

function englishRoute(route: string) {
  if (route === "/zh") return "";
  return route.startsWith("/zh/") ? route.slice(3) : route;
}

function chineseRoute(route: string) {
  return route ? `/zh${route}` : "/zh";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/products",
    "/product-finder",
    "/sourcing-review",
    "/line-sheet",
    "/factory",
    "/quality-packing",
    "/oem-odm",
    "/private-label-concept",
    "/sample-order-process",
    "/buyer-guide",
    "/resources",
    "/request-quote",
    "/privacy",
    "/terms",
    "/zh",
    "/zh/products",
    "/zh/product-finder",
    "/zh/sourcing-review",
    "/zh/line-sheet",
    "/zh/factory",
    "/zh/quality-packing",
    "/zh/oem-odm",
    "/zh/private-label-concept",
    "/zh/sample-order-process",
    "/zh/buyer-guide",
    "/zh/resources",
    "/zh/request-quote",
    "/zh/privacy",
    "/zh/terms",
  ];
  const routes = [
    ...staticRoutes,
    ...products.flatMap((product) => [
      `/products/${product.slug}`,
      `/zh/products/${product.slug}`,
    ]),
    ...collections.flatMap((collection) => [
      `/collections/${collection.slug}`,
      `/zh/collections/${collection.slug}`,
    ]),
    ...sourcingPrograms.flatMap((program) => [
      `/solutions/${program.slug}`,
      `/zh/solutions/${program.slug}`,
    ]),
    ...buyerResources.flatMap((resource) => [
      `/resources/${resource.slug}`,
      `/zh/resources/${resource.slug}`,
    ]),
  ];
  const routeSet = new Set(routes);

  return [...routeSet].map((route) => {
    const enRoute = englishRoute(route);
    const zhRoute = chineseRoute(enRoute);
    const product = products.find(
      (item) =>
        route === `/products/${item.slug}` ||
        route === `/zh/products/${item.slug}`,
    );
    const isChinese = route === "/zh" || route.startsWith("/zh/");
    const isFactoryPage = route === "/factory" || route === "/zh/factory";

    return {
      url: absolute(route),
      ...(routeSet.has(enRoute) && routeSet.has(zhRoute)
        ? {
            alternates: {
              languages: {
                en: absolute(enRoute),
                "zh-CN": absolute(zhRoute),
                "x-default": absolute(enRoute),
              },
            },
          }
        : {}),
      ...(product
        ? { images: product.images.map((image) => `${origin}${image}`) }
        : {}),
      ...(isFactoryPage
        ? {
            videos: [
              {
                title: isChinese
                  ? "贝强鞋业工厂工作区域与鞋类生产流程实拍"
                  : "Beiqiang footwear factory and production workflow footage",
                thumbnail_loc: factoryVideo.thumbnail,
                description: isChinese
                  ? "展示贝强鞋业工作区域、鞋类生产、检查与包装环节的35秒实拍视频。"
                  : "A 35-second view of Beiqiang Footwear working areas, footwear production, checking and packing in Quanzhou, China.",
                content_loc: factoryVideo.content,
                duration: factoryVideo.duration,
                publication_date: factoryVideo.publicationDate,
                family_friendly: "yes" as const,
                requires_subscription: "no" as const,
                live: "no" as const,
              },
            ],
          }
        : {}),
    };
  });
}
