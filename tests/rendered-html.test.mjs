import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Beiqiang B2B sourcing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Beiqiang Footwear \| Wide Toe Box Walking Shoe Factory Supply/);
  assert.match(html, /Comfort walking shoes built for your market/);
  assert.match(html, /Request a sample/);
  assert.match(html, /Start from a proven style or a product brief/);
  assert.match(html, /Answers before you request a sample/);
  assert.match(html, /https:\/\/www\.beiqiang\.online\//);
  assert.match(html, /421345308@qq\.com/);
  assert.match(html, /8618959805256/);
  assert.doesNotMatch(html, /codex-preview|Building your site|Your site is taking shape/i);
});

test("server-renders the verified BQ001 B2B product page", async () => {
  const response = await render("/products/bq001");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /wide toe box knit slip-on walking shoes/i);
  assert.match(html, /EU 36–46/);
  assert.match(html, /Stretch knit textile/);
  assert.match(html, /EVA sole construction/);
  assert.match(html, /BQ001 sample \/ quotation request/);
  assert.match(html, /Product/);
  assert.match(html, /FAQPage/);
  assert.doesNotMatch(html, /orthopedic|medical|podiatrist|waterproof/i);
});
