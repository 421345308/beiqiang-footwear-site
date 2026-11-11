import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { products } from "../app/data/products.ts";
import { selectLineSheetProducts } from "../app/data/line-sheet-selection.ts";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

test("keeps the released buyer line sheet synchronized with its selected product facts", async () => {
  const manifest = JSON.parse(await readFile(new URL("../app/data/line-sheet-manifest.json", import.meta.url), "utf8"));
  const selectedProducts = selectLineSheetProducts(products);
  assert.equal(manifest.productCount, selectedProducts.length);
  assert.equal(manifest.pageCount, Math.ceil(selectedProducts.length / 5) + 2);
  assert.equal(manifest.productDataSha256, sha256(JSON.stringify(selectedProducts)));

  for (const name of ["beiqiang-footwear-line-sheet-2026.pdf", "beiqiang-footwear-line-sheet-zh-2026.pdf"]) {
    const operating = await readFile(new URL(`../output/pdf/${name}`, import.meta.url));
    const published = await readFile(new URL(`../public/downloads/${name}`, import.meta.url));
    assert.deepEqual(published, operating, `${name} public and operating copies should match`);
    assert.equal(manifest.files[name].sha256, sha256(published));
    assert.equal(manifest.files[name].bytes, published.length);
    assert.equal(published.length > 1_000_000, true);
    assert.ok(published.length <= 600_000 + selectedProducts.length * 22_000, `${name} exceeds the downloadable catalogue size budget`);
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

test("the site footer reports the downloadable catalogue count, not the website total", async () => {
  const {default:worker}=await import('../dist/server/index.js');
  const response=await worker.fetch(new Request('https://www.beiqiang.online/products/bq-lq061'),{ASSETS:{fetch:async()=>new Response('',{status:404})}},{waitUntil(){}});
  assert.equal(response.status,200);
  const html=(await response.text()).replaceAll('<!-- -->','');
  const lineSheetCount=selectLineSheetProducts(products).length;
  assert.ok(html.includes(`${lineSheetCount}-style line sheet`));
  if (lineSheetCount!==products.length) assert.ok(!html.includes(`${products.length}-style line sheet`));
});
