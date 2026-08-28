import type { MetadataRoute } from "next";
import { collections, products } from "./data/products";
import { buyerResources } from "./data/resources";
import { sourcingPrograms } from "./data/sourcing-programs";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = "https://www.beiqiang.online";
  const staticRoutes = ["", "/products", "/collections/wide-toe-box", "/collections/knit-slip-on", "/collections/breathable-lace-up", "/line-sheet", "/factory", "/quality-packing", "/oem-odm", "/private-label-concept", "/sample-order-process", "/buyer-guide", "/resources", "/request-quote", "/privacy", "/terms", "/zh", "/zh/products", "/zh/line-sheet", "/zh/factory", "/zh/quality-packing", "/zh/oem-odm", "/zh/private-label-concept", "/zh/sample-order-process", "/zh/buyer-guide", "/zh/resources", "/zh/request-quote", "/zh/privacy", "/zh/terms"];
  const routes = [
    ...staticRoutes,
    ...products.map((product) => `/products/${product.slug}`),
    ...products.map((product) => `/zh/products/${product.slug}`),
    ...collections.map((collection) => `/collections/${collection.slug}`),
    ...collections.map((collection) => `/zh/collections/${collection.slug}`),
    ...sourcingPrograms.map((program) => `/solutions/${program.slug}`),
    ...sourcingPrograms.map((program) => `/zh/solutions/${program.slug}`),
    ...buyerResources.map((resource) => `/resources/${resource.slug}`),
    ...buyerResources.map((resource) => `/zh/resources/${resource.slug}`),
  ];
  return [...new Set(routes)].map((route) => ({ url: `${origin}${route ? `${route}/` : "/"}` }));
}
