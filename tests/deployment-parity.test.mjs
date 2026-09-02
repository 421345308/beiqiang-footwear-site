import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { SITE_RELEASE } from "../app/data/site-release.ts";
import { GET } from "../app/release.json/route.ts";
import { inspectRelease, normalizeOrigin, verifyDeployment } from "../scripts/verify-deployment-parity.mjs";

test("publishes a non-sensitive machine-readable release fingerprint", async () => {
  const response = await GET();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /application\/json/i);
  assert.deepEqual(await response.json(), SITE_RELEASE);
});

test("detects a stale deployment independently from media availability", async () => {
  const inspection = inspectRelease({
    ...SITE_RELEASE,
    releaseId: "older-release",
  });
  assert.equal(inspection.releaseMatches, false);
  assert.equal(inspection.productCountMatches, true);
  assert.equal(inspection.factoryVideoMatches, true);
});

test("checks release identity plus the full factory video and both caption tracks", async () => {
  const seen = [];
  const fetchImpl = async (url) => {
    seen.push(String(url));
    if (String(url).includes("release.json")) return Response.json(SITE_RELEASE);
    const contentType = String(url).endsWith(".mp4") ? "video/mp4" : "text/vtt; charset=utf-8";
    return new Response("x", { status: 200, headers: { "content-type": contentType } });
  };
  const result = await verifyDeployment("https://example.com/path", { fetchImpl });
  assert.equal(result.ok, true);
  assert.equal(result.origin, "https://example.com");
  assert.equal(result.media.length, 3);
  assert.ok(seen.some((url) => url.includes("/release.json?deployment-check=")));
  assert.ok(seen.some((url) => url.endsWith("beiqiang-factory-tour.en.vtt")));
  assert.ok(seen.some((url) => url.endsWith("beiqiang-factory-tour.zh.vtt")));
  assert.throws(() => normalizeOrigin("file:///tmp/site"), /http or https/);
});

test("keeps the EdgeOne static export and operator command wired to the release check", async () => {
  const [exporter, packageJson] = await Promise.all([
    readFile(new URL("../scripts/export-edgeone-static.mjs", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  assert.match(exporter, /pathname:\s*"\/release\.json"/);
  assert.match(exporter, /output:\s*"release\.json"/);
  assert.equal(packageJson.scripts["verify:deployments"], "node --experimental-strip-types scripts/verify-deployment-parity.mjs");
});

