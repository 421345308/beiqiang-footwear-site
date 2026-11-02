import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("five-language product controls remain unavailable until their handlers are ready", async () => {
  const pages = [
    ["products", "Select Orange", "Loading colours…"],
    ["zh/products", "选择 橙色", "配色加载中…"],
    ["de/products", "orange", "Farben werden geladen…"],
    ["fr/products", "orange", "Chargement des coloris…"],
    ["es/products", "naranja", "Cargando colores…"],
  ];
  for (const [path, label, loading] of pages) {
    const html = await readFile(new URL(`../edgeone-export-v1/${path}/bq009/index.html`, import.meta.url), "utf8");
    const buttons = [...html.matchAll(/<button\b[^>]*>/g)].map(match => match[0]);
    const colour = buttons.find(button => button.includes(`aria-label="${label}"`));
    assert.ok(colour, `${path}: colour button exists`);
    assert.match(colour, /\sdisabled(?:="")?(?:\s|>)/, `${path}: colour button waits for hydration`);
    assert.ok(html.includes(loading), `${path}: loading status is visible`);
    const print = buttons.find(button => button.includes("product-print-button"));
    assert.match(print ?? "", /\sdisabled(?:="")?(?:\s|>)/, `${path}: print waits for hydration`);
  }
});
