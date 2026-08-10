import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the Beiqiang B2B sourcing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /A complete walking-shoe range for your next market test/);
  assert.match(html, /View the complete catalogue/);
  assert.match(html, /421345308@qq\.com/);
  assert.match(html, /8618959805256/);
  assert.doesNotMatch(html, /orthopedic|medical|podiatrist|bunion friendly/i);
});

test("server-renders the complete searchable product catalogue", async () => {
  const response = await render("/products");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Compare all 30 documented styles/i);
  assert.match(html, /BQ001/);
  assert.match(html, /BQ030/);
  assert.doesNotMatch(html, /orthopedic|medical|podiatrist|bunion friendly/i);
});

test("server-renders the verified BQ001 product page", async () => {
  const response = await render("/products/bq001");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Wide Toe Box Knit Slip-On Walking Shoes/i);
  assert.match(html, /EU 36-46/);
  assert.match(html, /Knitted textile upper/);
  assert.match(html, /BQ001 sample \/ quotation request/);
  assert.doesNotMatch(html, /orthopedic|medical|podiatrist|waterproof/i);
});

test("server-renders the verified BQ002 product page", async () => {
  const response = await render("/products/bq002");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Extra Wide Toe Box Knit Slip-On Walking Shoes/i);
  assert.match(html, /Grey White, Grey Black, Grey Khaki/i);
  assert.doesNotMatch(html, /orthopedic|medical|podiatrist|waterproof/i);
});

test("server-renders the evidence-led BQ009 L1026 product page", async () => {
  const response = await render("/products/bq009");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Breathable Mesh Thick-Sole Athletic Walking Shoes/i);
  assert.match(html, /L1026/);
  assert.match(html, /Upper, outsole and lining materials/i);
  assert.doesNotMatch(html, /orthopedic foot support|bunion friendly|anatomical wide toe box/i);
});

test("server-renders lower-tier products conservatively", async () => {
  const response = await render("/products/bq030");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Kids Mesh Lace-Up Walking Shoes/);
  assert.match(html, /Kids compliance and age positioning/);
  assert.doesNotMatch(html, /orthopedic|medical|podiatrist|bunion friendly/i);
});

test("server-renders buyer-intent collection pages", async () => {
  const response = await render("/collections/knit-slip-on");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Knit slip-on walking shoes/);
  assert.match(html, /Compare styles before you request samples/);
});

for (const [pathname, expected] of [
  ["/factory", /factory-side sourcing conversation/i],
  ["/quality-packing", /Make order details visible/i],
  ["/oem-odm", /confirm feasibility first/i],
  ["/sample-order-process", /order-ready specification/i],
]) {
  test(`server-renders the ${pathname} trust page`, async () => {
    const response = await render(pathname);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, expected);
    assert.match(html, /421345308@qq\.com/);
    assert.doesNotMatch(html, /certified|million pairs|medical|orthopedic|guaranteed customization/i);
  });
}

test("server-renders the protected inquiry ledger shell", async () => {
  const response = await render("/admin/inquiries");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Inquiry ledger/);
  assert.match(html, /Dashboard access token/);
  assert.match(html, /Export CSV/);
});
