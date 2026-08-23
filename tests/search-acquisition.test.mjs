import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url); workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${pathname}`, { headers: { accept: pathname.endsWith(".xml") ? "application/xml" : "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("publishes one useful B2B sourcing hub and three substantial buyer guides", async () => {
  const hub = await render("/resources"); const hubHtml = await hub.text();
  assert.equal(hub.status, 200); assert.match(hubHtml, /Turn product interest into a brief your supplier can review/i); assert.match(hubHtml, /Footwear RFQ Checklist/i); assert.match(hubHtml, /Shoe Sample Approval Checklist/i); assert.match(hubHtml, /Private Label Walking Shoes/i); assert.match(hubHtml, /CollectionPage/);
  for (const [slug, heading, boundary] of [["footwear-rfq-checklist", /Footwear RFQ Checklist for Importers/i, /buyer target rather than an existing confirmed capability/i], ["shoe-sample-approval-checklist", /Shoe Sample Approval Checklist Before Bulk Production/i, /visual toe shape does not prove a wide last/i], ["private-label-walking-shoes-sourcing-guide", /From Shortlist to Formal Order/i, /not a card checkout/i]]) {
    const response = await render(`/resources/${slug}`); const html = await response.text(); assert.equal(response.status, 200); assert.match(html, heading); assert.match(html, boundary); assert.match(html, /Buyer checklist/i); assert.match(html, /application\/ld\+json/i); assert.match(html, /BreadcrumbList/); assert.doesNotMatch(html, /guaranteed medical benefit|guaranteed orthopedic|guaranteed price|guaranteed customization|bestseller/i);
  }
});

test("exposes a canonical sitemap and robots policy without private buyer routes", async () => {
  const sitemap = await render("/sitemap.xml"); const xml = await sitemap.text();
  assert.equal(sitemap.status, 200); assert.match(sitemap.headers.get("content-type") || "", /xml/i); assert.match(xml, /https:\/\/www\.beiqiang\.online\/products\/bq001\/?/); assert.match(xml, /https:\/\/www\.beiqiang\.online\/resources\/footwear-rfq-checklist\/?/); assert.match(xml, /https:\/\/www\.beiqiang\.online\/solutions\/private-label-walking-shoes\/?/); assert.doesNotMatch(xml, /admin\/inquiries|buyer-workspace|inquiry-status|\/api\//i);
  const robots = await render("/robots.txt"); const text = await robots.text(); assert.equal(robots.status, 200); assert.match(text, /User-Agent:\s*\*/i); assert.match(text, /Disallow:\s*\/api\//i); assert.match(text, /Sitemap:\s*https:\/\/www\.beiqiang\.online\/sitemap\.xml/i);
});

test("marks the internal dashboard as noindex", async () => {
  const response = await render("/admin/inquiries"); const html = await response.text(); assert.equal(response.status, 200); assert.match(html, /name="robots" content="noindex, nofollow/i);
});

test("includes every sourcing resource in the EdgeOne static export contract", async () => {
  const exporter = await readFile(new URL("../scripts/export-edgeone-static.mjs", import.meta.url), "utf8");
  assert.match(exporter, /pathname:\s*"\/resources"/);
  for (const slug of ["footwear-rfq-checklist", "shoe-sample-approval-checklist", "private-label-walking-shoes-sourcing-guide"]) {
    assert.match(exporter, new RegExp(slug));
  }
  assert.match(exporter, /resourceRoutes/);
  assert.match(exporter, /resources\/\$\{slug\}\/index\.html/);
  assert.match(exporter, /searchableCapabilitySlugs/);
  assert.match(exporter, /slug\s*!==\s*"buyer-workspace"/);
  assert.match(exporter, /Disallow: \/api\//);
  const publicRobots = await readFile(new URL("../public/robots.txt", import.meta.url), "utf8");
  assert.match(publicRobots, /Disallow:\s*\/api\//i);
});
