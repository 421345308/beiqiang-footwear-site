import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { compareCodes, sitemapCodes, readVpsCatalogue, verifyCatalogParity, formatCatalogReport } from "../scripts/verify-catalog-parity.mjs";
const expected = ["BQ001", "BQ-LQ021"];
const xml = codes => `<urlset>${codes.map(code => `<url><loc>https://example.com/products/${code.toLowerCase()}/</loc></url>`).join("")}</urlset>`;
test("exact sets detect same-count substitutions and duplicates", () => {
  assert.equal(compareCodes(expected, [...expected].reverse()).ok, true);
  assert.deepEqual(compareCodes(expected, ["BQ001", "BQ002"]).missing, ["BQ-LQ021"]);
  assert.deepEqual(compareCodes(expected, ["BQ001", "BQ002"]).unexpected, ["BQ002"]);
  assert.equal(compareCodes(expected, ["BQ001"]).ok, false);
  assert.equal(compareCodes(expected, [...expected, "BQ001"]).ok, false);
  assert.throws(() => compareCodes(expected, []));
  assert.throws(() => compareCodes(expected, ["private-data"]));
});
test("sitemap ignores translated duplicates and fails on malformed/index input", () => {
  assert.deepEqual(sitemapCodes(xml(expected).replace("</urlset>", '<url><loc>https://example.com/zh/products/bq001/</loc></url></urlset>')), expected);
  assert.throws(() => sitemapCodes("<html>error</html>"));
  assert.throws(() => sitemapCodes("<sitemapindex></sitemapindex>"));
});
test("SSH read is fixed, bounded, non-interactive and failure is sanitized", () => {
  assert.deepEqual(readVpsCatalogue((file, args, options) => {
    assert.equal(file, "ssh"); assert.ok(args.includes("BatchMode=yes"));
    assert.equal(options.timeout, 20000);
    assert.match(args.at(-1), /FINDER_STYLE_CODES/);
    assert.doesNotMatch(args.at(-1), /sudo|systemctl|\.env|psql/);
    return JSON.stringify({release: "20261111T110747Z", codes: expected});
  }).codes, expected);
  assert.throws(() => readVpsCatalogue(() => { throw Error("SECRET"); }), error => !error.message.includes("SECRET"));
});
test("stale or inaccessible VPS raises alert despite healthy frontend", async () => {
  const options = {expected, fetchImpl: async (url, opts) => {
    assert.match(url, /sitemap\.xml/); assert.equal(opts.method, undefined);
    return new Response(xml(expected));
  }, readVps: () => ({release: "fixture", codes: ["BQ001", "BQ002"]})};
  const result = await verifyCatalogParity(["https://example.com"], options);
  assert.equal(result[0].ok, false); assert.equal(result[1].ok, true);
  assert.match(formatCatalogReport(result), /ALERT CATALOG_PARITY/);
  const failed = await verifyCatalogParity([], {...options, readVps: () => { throw Error("unavailable"); }});
  assert.equal(failed[0].ok, false);
});
test("frontend drift and HTTP failure fail closed; aligned sources pass", async () => {
  const options = {expected, readVps: () => ({release: "fixture", codes: expected})};
  const stale = await verifyCatalogParity(["https://example.com"], {...options, fetchImpl: async () => new Response(xml(["BQ001", "BQ002"]))});
  assert.equal(stale[1].ok, false);
  const failed = await verifyCatalogParity(["https://example.com"], {...options, fetchImpl: async () => new Response("", {status: 503})});
  assert.equal(failed[1].ok, false);
  const good = await verifyCatalogParity(["https://example.com"], {...options, fetchImpl: async () => new Response(xml(expected))});
  assert.ok(good.every(item => item.ok));
});
test("existing deployment command includes fail-closed catalogue gate", async () => {
  const script = await readFile(new URL("../scripts/verify-deployment-parity.mjs", import.meta.url), "utf8");
  assert.match(script, /await verifyCatalogParity\(targets\)/);
  assert.match(script, /\[\.\.\.results, \.\.\.catalog\]\.every/);
});
