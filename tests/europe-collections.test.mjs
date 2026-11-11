import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { europeCollectionSlugs, publicLocales, supportsLocalePath } from "../app/lib/public-locales.ts";

const root = new URL("../edgeone-export-v1/", import.meta.url);
test("Mary Jane collection presents the style in five languages with a supported quote link", async () => {
  for (const locale of ["en", "zh", "de", "fr", "es"]) {
    const prefix = locale === "en" ? "" : `${locale}/`;
    const html = await readFile(new URL(`${prefix}collections/mary-jane-shoes/index.html`, root), "utf8");
    assert.match(html, /BQ1021/);
    assert.ok(html.includes(`/${prefix}request-quote/`));
    assert.doesNotMatch(html, /program=collection-mary-jane-shoes/);
  }
});
test("localized collection pages link to real products and have reciprocal search alternates", async () => {
  const sitemap = await readFile(new URL("sitemap.xml", root), "utf8");
  for (const slug of europeCollectionSlugs) {
    for (const locale of ["de", "fr", "es"]) {
      const path = `${locale}/collections/${slug}/`;
      const html = await readFile(new URL(`${path}index.html`, root), "utf8");
      assert.match(html, new RegExp(`<html lang="${locale}"`), path);
      assert.match(html, new RegExp(`https://www\\.beiqiang\\.online/${path}`), path);
      assert.match(html, new RegExp(`/${locale}/products/bq`, "i"), path);
      assert.match(html, /"@type":"CollectionPage"/);
      assert.match(html, /"@type":"ItemList"/);
      assert.ok(sitemap.includes(`https://www.beiqiang.online/${path}`), path);
      for (const item of publicLocales) {
        assert.ok(supportsLocalePath(`/collections/${slug}`, item.id));
        const localized = `${item.prefix}/collections/${slug}/`;
        assert.ok(html.includes(`href="https://www.beiqiang.online${localized}"`), `${path} → ${localized}`);
      }
    }
  }
  assert.equal(supportsLocalePath("/collections/mule-shoes/", "fr"), false);
});
