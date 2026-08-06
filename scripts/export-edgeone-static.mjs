import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const outputRoot = resolve(projectRoot, "edgeone-export-v1");
const clientRoot = resolve(projectRoot, "dist", "client");
const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("edgeone-export", `${process.pid}-${Date.now()}`);

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });
await cp(clientRoot, outputRoot, { recursive: true, force: true });

const { default: worker } = await import(workerUrl.href);
const productSlugs = (await readdir(resolve(projectRoot, "public", "catalog"), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && /^bq\d{3}$/.test(entry.name))
  .map((entry) => entry.name)
  .sort();
const productRoutes = productSlugs.map((slug) => {
  return { pathname: `/products/${slug}`, output: `products/${slug}/index.html` };
});
const collectionSlugs = ["wide-toe-box", "knit-slip-on", "breathable-lace-up"];
const collectionRoutes = collectionSlugs.map((slug) => ({
  pathname: `/collections/${slug}`,
  output: `collections/${slug}/index.html`,
}));
const routes = [
  { pathname: "/", output: "index.html" },
  { pathname: "/products", output: "products/index.html" },
  ...productRoutes,
  ...collectionRoutes,
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
  await writeFile(outputFile, await response.text(), "utf8");
}
await writeFile(
  resolve(outputRoot, "edgeone.json"),
  `${JSON.stringify({ redirects: [{ source: "/index.html", destination: "/", statusCode: 301 }] }, null, 2)}\n`,
  "utf8",
);
const sitemapUrls = [
  { path: "/", frequency: "weekly", priority: "1.0" },
  { path: "/products/", frequency: "weekly", priority: "0.9" },
  ...productSlugs.map((slug) => ({ path: `/products/${slug}/`, frequency: "monthly", priority: ["bq001", "bq002", "bq009"].includes(slug) ? "0.9" : "0.7" })),
  ...collectionSlugs.map((slug) => ({ path: `/collections/${slug}/`, frequency: "weekly", priority: "0.8" })),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.map((url) => `  <url><loc>https://www.beiqiang.online${url.path}</loc><changefreq>${url.frequency}</changefreq><priority>${url.priority}</priority></url>`).join("\n")}\n</urlset>\n`;
await writeFile(resolve(outputRoot, "sitemap.xml"), sitemap, "utf8");

console.log(outputRoot);
