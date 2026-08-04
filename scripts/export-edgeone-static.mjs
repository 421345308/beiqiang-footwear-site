import { cp, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const outputRoot = resolve(projectRoot, "edgeone-export-v1");
const clientRoot = resolve(projectRoot, "dist", "client");
const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("edgeone-export", `${process.pid}-${Date.now()}`);

await mkdir(outputRoot, { recursive: true });
await cp(clientRoot, outputRoot, { recursive: true, force: true });

const { default: worker } = await import(workerUrl.href);
const routes = [
  { pathname: "/", output: "index.html" },
  { pathname: "/products/bq001", output: "products/bq001/index.html" },
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

console.log(outputRoot);
