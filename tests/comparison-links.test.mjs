import assert from "node:assert/strict";
import test from "node:test";
import { buildComparisonUrl, parseComparisonCodes } from "../app/lib/comparison-link.ts";

const allowed = ["BQ001", "BQ002", "BQ009", "BQ030"];

test("restores only unique known product codes and caps a shared comparison at four", () => {
  assert.deepEqual(parseComparisonCodes("bq009,BQ001,bq009,BQ999,not-a-code,BQ002,BQ030,BQ005", allowed), ["BQ009", "BQ001", "BQ002", "BQ030"]);
});

test("builds canonical bilingual comparison links without buyer or commercial data", () => {
  const english = new URL(buildComparisonUrl(["bq009", "BQ001", "BQ009"]));
  const chinese = new URL(buildComparisonUrl(["BQ002", "BQ030"], "zh"));
  assert.equal(english.origin, "https://www.beiqiang.online"); assert.equal(english.pathname, "/products/"); assert.equal(english.searchParams.get("compare"), "BQ009,BQ001");
  assert.equal(chinese.pathname, "/zh/products/"); assert.equal(chinese.searchParams.get("compare"), "BQ002,BQ030");
  for (const url of [english, chinese]) { assert.equal(url.searchParams.has("email"), false); assert.equal(url.searchParams.has("quantity"), false); assert.equal(url.searchParams.has("price"), false); }
});
