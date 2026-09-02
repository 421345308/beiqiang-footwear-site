import assert from "node:assert/strict";
import test from "node:test";
import { products } from "../app/data/products.ts";
import { factZh, productNameZh } from "../app/data/products-zh.ts";

function product(code) {
  const result = products.find((item) => item.code === code);
  assert.ok(result, `${code} must exist in the public catalogue`);
  return result;
}

test("keeps source-supported materials for the three reviewed catalogue products", () => {
  const bq003 = product("BQ003");
  assert.equal(bq003.upper, "Stretch fabric upper");
  assert.equal(bq003.sole, "EVA sole");
  assert.match(bq003.highlights.join(" "), /Mesh lining recorded/);
  assert.doesNotMatch(bq003.confirmBeforeQuote.join(" "), /Outsole and lining materials/);

  const bq007 = product("BQ007");
  assert.equal(bq007.sole, "EVA + PEBA foamed sole structure");
  assert.match(bq007.highlights.join(" "), /source package/);
  assert.doesNotMatch(bq007.confirmBeforeQuote.join(" "), /Outsole foam\/material/);

  const bq008 = product("BQ008");
  assert.match(bq008.sole, /material confirmed before quotation/);

  const bq010 = product("BQ010");
  assert.equal(bq010.upper, "Stretch fabric upper");
  assert.equal(bq010.sole, "EVA sole");
  assert.match(bq010.highlights.join(" "), /Mesh lining recorded/);
});

test("renders the newly verified facts in buyer-readable Chinese", () => {
  assert.equal(factZh("EVA + PEBA foamed sole structure"), "EVA + PEBA 发泡鞋底结构");
  assert.equal(factZh("Mesh lining recorded in the product package"), "产品资料已记录网布内里");
  assert.equal(factZh("Exact material execution for the selected order"), "所选订单的准确材料执行");
  assert.equal(productNameZh(product("BQ003")), "夏季弹力织物系带休闲鞋");
});

test("keeps Alibaba-trunk materials attached to the exact second-batch products", () => {
  for (const code of ["BQ004", "BQ005", "BQ009", "BQ012", "BQ024"]) {
    const item = product(code);
    assert.equal(item.sole, "EVA sole", `${code} must keep its trunk-recorded EVA sole`);
    assert.match(item.upper, /stretch-fabric upper/i, `${code} must keep its stretch-fabric upper`);
    assert.match(item.highlights.join(" "), /Mesh lining recorded in Alibaba trunk/);
    assert.doesNotMatch(item.confirmBeforeQuote.join(" "), /Outsole and lining materials|Upper, outsole and lining materials/);
  }

  assert.equal(product("BQ004").alibabaProductId, "10000043201799");
  assert.equal(product("BQ005").alibabaProductId, "10000043200726");
  assert.equal(product("BQ009").alibabaProductId, "1601825074604");
  assert.equal(product("BQ012").alibabaProductId, "10000043744505");
  assert.equal(product("BQ024").alibabaProductId, "10000044004948");
  assert.equal(product("BQ023").sourceModel, "A505", "A830 evidence must not spill into adjacent BQ023/A505");
});

test("renders the second-batch material facts in buyer-readable Chinese", () => {
  assert.equal(factZh("Knitted stretch-fabric upper"), "针织弹力织物鞋面");
  assert.equal(factZh("Hollow-knit stretch-fabric upper"), "镂空针织弹力织物鞋面");
  assert.equal(factZh("Mesh lining recorded in Alibaba trunk"), "Alibaba线上正本已记录网布内里");
  assert.equal(productNameZh(product("BQ009")), "透气针织弹力织物系带步行鞋");
});

test("keeps R1811 trunk materials attached to the exact website product identity", () => {
  const bq015 = product("BQ015");
  assert.equal(bq015.sourceModel, "R1811");
  assert.equal(bq015.alibabaProductId, "1601839073314");
  assert.equal(bq015.upper, "Stretch fabric upper");
  assert.equal(bq015.sole, "EVA sole");
  assert.match(bq015.highlights.join(" "), /Mesh lining recorded in Alibaba trunk for the listed configuration/);
  assert.match(bq015.confirmBeforeQuote.join(" "), /Fleece availability by color/);
  assert.doesNotMatch(bq015.confirmBeforeQuote.join(" "), /Outsole and lining materials/);
  assert.equal(
    factZh("Mesh lining recorded in Alibaba trunk for the listed configuration"),
    "Alibaba在售配置已记录网布内里",
  );
});
