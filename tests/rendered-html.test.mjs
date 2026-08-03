import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
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
  assert.match(html, /21345308@qq\.com/);
  assert.match(html, /8618959805256/);
  assert.doesNotMatch(html, /421345308@qq\.com/);
  assert.doesNotMatch(html, /codex-preview|Building your site|Your site is taking shape/i);
});
