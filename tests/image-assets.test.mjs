import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir, stat } from "node:fs/promises";
import { products, heldSourceProducts } from "../app/data/products.ts";

const root = new URL("../public/catalog-thumbs/", import.meta.url);

async function filesBelow(directory, suffix) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory() ? filesBelow(new URL(`${entry.name}/`, directory), suffix) : entry.name.endsWith(suffix) ? [new URL(entry.name, directory)] : []));
  return nested.flat();
}

test("keeps a complete product-aligned WebP thumbnail set", async () => {
  const files = (await readdir(root)).filter((name) => /^bq\d{3}\.webp$/.test(name)).sort();
  assert.deepEqual(files, [...products, ...heldSourceProducts].map((product) => `${product.slug}.webp`).sort());
  for (const file of files) {
    const header = await readFile(new URL(file, root));
    assert.equal(header.subarray(0, 4).toString("ascii"), "RIFF", `${file} should be a RIFF WebP file`);
    assert.equal(header.subarray(8, 12).toString("ascii"), "WEBP", `${file} should be a WebP file`);
  }
});

test("keeps catalogue thumbnails inside the commercial page-weight budget", async () => {
  const files = (await readdir(root)).filter((name) => /^bq\d{3}\.webp$/.test(name));
  const sizes = await Promise.all(files.map((file) => stat(new URL(file, root))));
  const total = sizes.reduce((sum, item) => sum + item.size, 0);
  assert.equal(Math.max(...sizes.map((item) => item.size)) <= 120 * 1024, true, "one thumbnail exceeds 120 KB");
  assert.equal(total <= 2 * 1024 * 1024, true, "catalogue thumbnails exceed 2 MB total");
});

test("keeps one optimized web-gallery image for every catalogue source image", async () => {
  const sources = await filesBelow(new URL("../public/catalog/", import.meta.url), ".jpg");
  const derivatives = await filesBelow(new URL("../public/catalog-web/", import.meta.url), ".webp");
  assert.equal(derivatives.length, sources.length);
  const sizes = await Promise.all(derivatives.map((file) => stat(file)));
  assert.equal(Math.max(...sizes.map((item) => item.size)) <= 140 * 1024, true, "one product web image exceeds 140 KB");
  const deploymentBudget = (products.length + heldSourceProducts.length) * 340 * 1024;
  assert.equal(sizes.reduce((sum, item) => sum + item.size, 0) <= deploymentBudget, true, "product web gallery exceeds the per-product deployment budget");
});

test("keeps complete factory derivatives and a lightweight social preview", async () => {
  const factorySources = (await readdir(new URL("../public/factory/", import.meta.url))).filter((name) => /\.(?:jpe?g|png)$/i.test(name));
  const factoryWeb = (await readdir(new URL("../public/factory-web/", import.meta.url))).filter((name) => /\.webp$/i.test(name));
  assert.equal(factoryWeb.length, factorySources.length);
  const factorySizes = await Promise.all(factoryWeb.map((file) => stat(new URL(`../public/factory-web/${file}`, import.meta.url))));
  assert.equal(Math.max(...factorySizes.map((item) => item.size)) <= 250 * 1024, true, "one factory web image exceeds 250 KB");
  assert.equal(factorySizes.reduce((sum, item) => sum + item.size, 0) <= 2 * 1024 * 1024, true, "factory web images exceed 2 MB total");
  const social = await readFile(new URL("../public/og.jpg", import.meta.url));
  assert.deepEqual([...social.subarray(0, 3)], [0xff, 0xd8, 0xff]);
  assert.equal(social.length <= 300 * 1024, true, "social preview exceeds 300 KB");
});

test("keeps both factory-video delivery formats and a lightweight poster", async () => {
  const webm = await stat(new URL("../public/videos/beiqiang-factory-tour.webm", import.meta.url));
  const mp4 = await stat(new URL("../public/videos/beiqiang-factory-tour.mp4", import.meta.url));
  const poster = await readFile(new URL("../public/videos/beiqiang-factory-tour-poster.jpg", import.meta.url));
  const englishCaptions = await readFile(new URL("../public/videos/beiqiang-factory-tour.en.vtt", import.meta.url), "utf8");
  const edgeOneSafeFileLimit = 24 * 1024 * 1024;
  assert.equal(webm.size > 5_000_000 && webm.size <= edgeOneSafeFileLimit, true, "full factory WebM exceeds the EdgeOne-safe 24 MiB limit");
  assert.equal(mp4.size > 5_000_000 && mp4.size <= edgeOneSafeFileLimit, true, "full factory MP4 exceeds the EdgeOne-safe 24 MiB limit");
  assert.deepEqual([...poster.subarray(0, 3)], [0xff, 0xd8, 0xff]);
  assert.equal(poster.length <= 180 * 1024, true, "factory video poster exceeds 180 KB");
  assert.match(englishCaptions, /00:00:00\.450 --> 00:00:03\.870/);
  assert.match(englishCaptions, /Material cutting and component preparation begin the visible workflow/i);
  assert.match(englishCaptions, /Contact Beiqiang for a current catalog, samples, or an OEM and ODM discussion/i);
});

test("keeps footage-derived factory stills web-ready", async () => {
  const stills = await readdir(new URL("../public/factory-video-stills/", import.meta.url));
  assert.equal(stills.length >= 8, true);
  for (const file of stills) {
    const content = await readFile(new URL(`../public/factory-video-stills/${file}`, import.meta.url));
    assert.equal(content.subarray(0, 4).toString("ascii"), "RIFF", `${file} should be a RIFF WebP file`);
    assert.equal(content.subarray(8, 12).toString("ascii"), "WEBP", `${file} should be a WebP file`);
    assert.equal(content.length <= 150 * 1024, true, `${file} exceeds 150 KB`);
  }
});

function readPngHeader(buffer) {
  assert.equal(buffer.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", "not a PNG file");
  assert.equal(buffer.subarray(12, 16).toString("ascii"), "IHDR", "missing IHDR chunk");
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer[24],
    colorType: buffer[25],
  };
}

test("keeps a square, crawlable brand logo for Organization structured data", async () => {
  const logo = readPngHeader(await readFile(new URL("../public/brand/logo-512.png", import.meta.url)));
  assert.equal(logo.width, 512);
  assert.equal(logo.height, 512);
  // Color type 6 = truecolour with alpha; Google warns about logos that disappear
  // on a white background, so the mark must carry its own dark badge.
  assert.equal(logo.colorType, 6, "brand logo should be RGBA");
  assert.equal(logo.width >= 112 && logo.height >= 112, true, "logo is below Google's 112x112 minimum");

  const vector = await readFile(new URL("../public/brand/logo.svg", import.meta.url), "utf8");
  assert.match(vector, /viewBox="0 0 512 512"/);
  assert.match(vector, /#173b32/, "vector logo should use the site forest token");

  // The favicon the browser and Google fall back to when no <link rel="icon"> wins.
  const ico = await readFile(new URL("../public/favicon.ico", import.meta.url));
  assert.deepEqual([...ico.subarray(0, 4)], [0x00, 0x00, 0x01, 0x00], "favicon.ico should be a real ICO container");
  const favicon = await readFile(new URL("../public/favicon.svg", import.meta.url), "utf8");
  assert.match(favicon, /#173b32/, "favicon.svg should be the brand mark, not the framework starter icon");

  const apple = readPngHeader(await readFile(new URL("../public/apple-touch-icon.png", import.meta.url)));
  assert.equal(apple.width, 180);
  assert.equal(apple.height, 180);
  // iOS masks the icon itself, so this variant must be opaque.
  assert.equal(apple.colorType, 2, "apple-touch-icon should be opaque RGB");
});
