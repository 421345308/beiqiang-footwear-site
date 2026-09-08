import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { FINDER_STYLE_CODES } from "../edgeone-deploy/cloud-functions/api/catalog-style-codes.js";

const projectRoot = resolve(import.meta.dirname, "..");
const outputRoot = resolve(projectRoot, "edgeone-export-v1");
const clientRoot = resolve(projectRoot, "dist", "client");
const siteOrigin = "https://www.beiqiang.online";
const factoryVideo = {
  thumbnail: `${siteOrigin}/videos/beiqiang-factory-tour-poster.jpg`,
  content: `${siteOrigin}/videos/beiqiang-factory-tour.mp4`,
  publicationDate: "2026-09-03T00:00:00+08:00",
  duration: 180,
};
const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("edgeone-export", `${process.pid}-${Date.now()}`);

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });
await cp(clientRoot, outputRoot, { recursive: true, force: true });

const { default: worker } = await import(workerUrl.href);
const productSlugs = (await readdir(resolve(projectRoot, "public", "catalog"), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && FINDER_STYLE_CODES.has(entry.name.toUpperCase()))
  .map((entry) => entry.name)
  .sort();
const productRoutes = productSlugs.map((slug) => {
  return { pathname: `/products/${slug}`, output: `products/${slug}/index.html` };
});
const chineseProductRoutes = productSlugs.map((slug) => ({ pathname: `/zh/products/${slug}`, output: `zh/products/${slug}/index.html` }));
const collectionSlugs = ["wide-toe-box", "knit-slip-on", "breathable-lace-up", "high-top-shoes", "kids-shoes", "extended-size-shoes", "fleece-lined-shoes"];
const collectionRoutes = collectionSlugs.map((slug) => ({
  pathname: `/collections/${slug}`,
  output: `collections/${slug}/index.html`,
}));
const chineseCollectionRoutes = collectionSlugs.map((slug) => ({
  pathname: `/zh/collections/${slug}`,
  output: `zh/collections/${slug}/index.html`,
}));
const solutionSlugs = ["wholesale-walking-shoes", "private-label-walking-shoes", "oem-knit-shoes"];
const solutionRoutes = solutionSlugs.map((slug) => ({ pathname: `/solutions/${slug}`, output: `solutions/${slug}/index.html` }));
const chineseSolutionRoutes = solutionSlugs.map((slug) => ({ pathname: `/zh/solutions/${slug}`, output: `zh/solutions/${slug}/index.html` }));
const resourceSlugs = ["footwear-rfq-checklist", "shoe-sample-approval-checklist", "private-label-walking-shoes-sourcing-guide"];
const resourceRoutes = resourceSlugs.map((slug) => ({ pathname: `/resources/${slug}`, output: `resources/${slug}/index.html` }));
const chineseResourceRoutes = resourceSlugs.map((slug) => ({ pathname: `/zh/resources/${slug}`, output: `zh/resources/${slug}/index.html` }));
const capabilitySlugs = ["factory", "quality-packing", "oem-odm", "private-label-concept", "product-finder", "sourcing-review", "sample-order-process", "buyer-guide", "buyer-workspace", "line-sheet", "privacy", "terms"];
const searchableCapabilitySlugs = capabilitySlugs.filter((slug) => slug !== "buyer-workspace");
const capabilityRoutes = capabilitySlugs.map((slug) => ({ pathname: `/${slug}`, output: `${slug}/index.html` }));
const chineseCapabilitySlugs = ["line-sheet", "factory", "quality-packing", "oem-odm", "private-label-concept", "product-finder", "sourcing-review", "sample-order-process", "buyer-guide"];
const chineseCapabilityRoutes = chineseCapabilitySlugs.map((slug) => ({ pathname: `/zh/${slug}`, output: `zh/${slug}/index.html` }));
const routes = [
  { pathname: "/release.json", output: "release.json" },
  { pathname: "/", output: "index.html" },
  { pathname: "/products", output: "products/index.html" },
  { pathname: "/resources", output: "resources/index.html" },
  { pathname: "/request-quote", output: "request-quote/index.html" },
  { pathname: "/inquiry-status", output: "inquiry-status/index.html" },
  { pathname: "/zh", output: "zh/index.html" },
  { pathname: "/zh/products", output: "zh/products/index.html" },
  { pathname: "/zh/resources", output: "zh/resources/index.html" },
  { pathname: "/zh/request-quote", output: "zh/request-quote/index.html" },
  { pathname: "/zh/inquiry-status", output: "zh/inquiry-status/index.html" },
  { pathname: "/zh/buyer-workspace", output: "zh/buyer-workspace/index.html" },
  { pathname: "/zh/privacy", output: "zh/privacy/index.html" },
  { pathname: "/zh/terms", output: "zh/terms/index.html" },
  ...chineseCapabilityRoutes,
  ...productRoutes,
  ...chineseProductRoutes,
  ...collectionRoutes,
  ...chineseCollectionRoutes,
  ...solutionRoutes,
  ...chineseSolutionRoutes,
  ...resourceRoutes,
  ...chineseResourceRoutes,
  ...capabilityRoutes,
  { pathname: "/admin/inquiries", output: "admin/inquiries/index.html" },
];

for (const route of routes) {
  const response = await worker.fetch(
    new Request(`https://www.beiqiang.online${route.pathname}`, {
      headers: {
        accept: "text/html",
        host: "www.beiqiang.online",
        "x-forwarded-host": "www.beiqiang.online",
        "x-forwarded-proto": "https",
      },
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );

  if (!response.ok) throw new Error(`Static render failed for ${route.pathname} with HTTP ${response.status}`);
  const outputFile = resolve(outputRoot, route.output);
  await mkdir(dirname(outputFile), { recursive: true });
  const renderedHtml = await response.text();
  const localizedHtml = route.pathname === "/zh" || route.pathname.startsWith("/zh/")
    ? renderedHtml.replace('<html lang="en">', '<html lang="zh-CN">')
    : renderedHtml;
  await writeFile(outputFile, localizedHtml, "utf8");
}
await writeFile(
  resolve(outputRoot, "edgeone.json"),
  `${JSON.stringify({
    redirects: [{ source: "/index.html", destination: "/", statusCode: 301 }],
    headers: [
      {
        source: "/videos/beiqiang-factory-tour.en.vtt",
        headers: [{ key: "Content-Type", value: "text/vtt; charset=utf-8" }],
      },
      {
        source: "/videos/beiqiang-factory-tour.zh.vtt",
        headers: [{ key: "Content-Type", value: "text/vtt; charset=utf-8" }],
      },
    ],
  }, null, 2)}\n`,
  "utf8",
);
const sitemapUrls = [
  { path: "/", frequency: "weekly", priority: "1.0" },
  { path: "/products/", frequency: "weekly", priority: "0.9" },
  { path: "/resources/", frequency: "weekly", priority: "0.8" },
  { path: "/request-quote/", frequency: "monthly", priority: "0.8" },
  { path: "/zh/", frequency: "weekly", priority: "0.8" },
  { path: "/zh/products/", frequency: "weekly", priority: "0.8" },
  { path: "/zh/resources/", frequency: "weekly", priority: "0.8" },
  { path: "/zh/request-quote/", frequency: "monthly", priority: "0.7" },
  ...chineseCapabilitySlugs.map((slug) => ({ path: `/zh/${slug}/`, frequency: "monthly", priority: slug === "buyer-guide" ? "0.8" : "0.7" })),
  { path: "/zh/privacy/", frequency: "monthly", priority: "0.5" },
  { path: "/zh/terms/", frequency: "monthly", priority: "0.5" },
  ...productSlugs.map((slug) => ({ path: `/products/${slug}/`, frequency: "monthly", priority: ["bq001", "bq002", "bq009"].includes(slug) ? "0.9" : "0.7" })),
  ...productSlugs.map((slug) => ({ path: `/zh/products/${slug}/`, frequency: "monthly", priority: ["bq001", "bq002", "bq009"].includes(slug) ? "0.8" : "0.6" })),
  ...collectionSlugs.map((slug) => ({ path: `/collections/${slug}/`, frequency: "weekly", priority: "0.8" })),
  ...collectionSlugs.map((slug) => ({ path: `/zh/collections/${slug}/`, frequency: "weekly", priority: "0.7" })),
  ...solutionSlugs.map((slug) => ({ path: `/solutions/${slug}/`, frequency: "monthly", priority: "0.8" })),
  ...solutionSlugs.map((slug) => ({ path: `/zh/solutions/${slug}/`, frequency: "monthly", priority: "0.7" })),
  ...resourceSlugs.map((slug) => ({ path: `/resources/${slug}/`, frequency: "monthly", priority: "0.8" })),
  ...resourceSlugs.map((slug) => ({ path: `/zh/resources/${slug}/`, frequency: "monthly", priority: "0.7" })),
  ...searchableCapabilitySlugs.map((slug) => ({ path: `/${slug}/`, frequency: "monthly", priority: slug === "buyer-guide" ? "0.8" : "0.7" })),
];
const productImages = new Map(
  await Promise.all(
    productSlugs.map(async (slug) => {
      const filenames = await readdir(resolve(projectRoot, "public", "catalog", slug));
      return [
        slug,
        filenames
          .filter((filename) => /\.(?:jpe?g|png|webp)$/i.test(filename))
          .sort()
          .map((filename) => `${siteOrigin}/catalog/${slug}/${filename}`),
      ];
    }),
  ),
);
const escapeXml = (value) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");
const englishPath = (path) => path === "/zh/" ? "/" : path.startsWith("/zh/") ? path.slice(3) : path;
const chinesePath = (path) => path === "/" ? "/zh/" : `/zh${path}`;
const sitemapPathSet = new Set(sitemapUrls.map((url) => url.path));
const renderSitemapUrl = (url) => {
  const enPath = englishPath(url.path);
  const zhPath = chinesePath(enPath);
  const productMatch = url.path.match(/^\/(?:zh\/)?products\/(bq\d{3})\/$/);
  const isChinese = url.path.startsWith("/zh/");
  const isFactory = url.path === "/factory/" || url.path === "/zh/factory/";
  const alternates = sitemapPathSet.has(enPath) && sitemapPathSet.has(zhPath)
    ? [
        `<xhtml:link rel="alternate" hreflang="en" href="${siteOrigin}${enPath}" />`,
        `<xhtml:link rel="alternate" hreflang="zh-CN" href="${siteOrigin}${zhPath}" />`,
        `<xhtml:link rel="alternate" hreflang="x-default" href="${siteOrigin}${enPath}" />`,
      ]
    : [];
  const images = productMatch
    ? (productImages.get(productMatch[1]) || []).map((image) => `<image:image><image:loc>${escapeXml(image)}</image:loc></image:image>`)
    : [];
  const video = isFactory
    ? [`<video:video><video:thumbnail_loc>${factoryVideo.thumbnail}</video:thumbnail_loc><video:title>${escapeXml(isChinese ? "贝强鞋业工厂工作区域与鞋类生产流程实拍" : "Beiqiang footwear factory and production workflow footage")}</video:title><video:description>${escapeXml(isChinese ? "展示贝强鞋业场地外景、材料准备、鞋面车缝、生产线处理、鞋品检查与包装准备的3分钟实拍视频，配有英文旁白、原创背景音乐及中英文同步字幕。" : "A three-minute tour of Beiqiang Footwear showing material preparation, upper stitching, line handling, shoe checking and packing preparation in Quanzhou, China, with English narration, original background music and synchronized captions.")}</video:description><video:content_loc>${factoryVideo.content}</video:content_loc><video:duration>${factoryVideo.duration}</video:duration><video:publication_date>${factoryVideo.publicationDate}</video:publication_date><video:family_friendly>yes</video:family_friendly><video:requires_subscription>no</video:requires_subscription><video:live>no</video:live></video:video>`]
    : [];
  return `  <url><loc>${siteOrigin}${url.path}</loc>${[...alternates, ...images, ...video].join("")}<changefreq>${url.frequency}</changefreq><priority>${url.priority}</priority></url>`;
};
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n${sitemapUrls.map(renderSitemapUrl).join("\n")}\n</urlset>\n`;
await writeFile(resolve(outputRoot, "sitemap.xml"), sitemap, "utf8");
const privateRobotRules = `Disallow: /api/\nDisallow: /admin/\nDisallow: /buyer-workspace/\nDisallow: /inquiry-status/\nDisallow: /zh/buyer-workspace/\nDisallow: /zh/inquiry-status/`;
const robots = `User-agent: Googlebot\nAllow: /\n${privateRobotRules}\n\nUser-agent: OAI-SearchBot\nAllow: /\n${privateRobotRules}\n\nUser-agent: ChatGPT-User\nAllow: /\n${privateRobotRules}\n\nUser-agent: *\nAllow: /\n${privateRobotRules}\n\nSitemap: https://www.beiqiang.online/sitemap.xml\nHost: https://www.beiqiang.online\n`;
await writeFile(resolve(outputRoot, "robots.txt"), robots, "utf8");

console.log(outputRoot);
