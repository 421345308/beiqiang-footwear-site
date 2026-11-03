import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { products } from "../app/data/products.ts";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

test("keeps the buyer line sheets synchronized with the current product facts", async () => {
  const manifest = JSON.parse(await readFile(new URL("../app/data/line-sheet-manifest.json", import.meta.url), "utf8"));
  assert.equal(manifest.productCount, products.length);
  assert.equal(manifest.pageCount, Math.ceil(products.length / 5) + 2);
  assert.equal(manifest.productDataSha256, sha256(JSON.stringify(products)));

  for (const name of ["beiqiang-footwear-line-sheet-2026.pdf", "beiqiang-footwear-line-sheet-zh-2026.pdf"]) {
    const operating = await readFile(new URL(`../output/pdf/${name}`, import.meta.url));
    const published = await readFile(new URL(`../public/downloads/${name}`, import.meta.url));
    assert.deepEqual(published, operating, `${name} public and operating copies should match`);
    assert.equal(manifest.files[name].sha256, sha256(published));
    assert.equal(manifest.files[name].bytes, published.length);
    assert.equal(published.length > 1_000_000, true);
    assert.ok(published.length <= 600_000 + products.length * 22_000, `${name} exceeds the downloadable catalogue size budget`);
  }
});

test("keeps current line-sheet documentation and Chinese evidence rendering aligned", async () => {
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  const chineseGenerator = await readFile(new URL("../scripts/generate-line-sheet-zh.py", import.meta.url), "utf8");
  assert.match(readme, /## Product Catalogue and Line Sheet Lead Path/);
  assert.match(readme, /PDFs are generated from the website product source/);
  assert.match(chineseGenerator, /贝强鞋款/);
  assert.doesNotMatch(chineseGenerator, /贝强本厂鞋款|供应商供货/);
  assert.doesNotMatch(chineseGenerator, /paragraph\(c, product\["summaryZh"\]/);
});
