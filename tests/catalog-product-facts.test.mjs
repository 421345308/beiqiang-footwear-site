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
  assert.equal(product("BQ024").alibabaProductId, "10000044041031");
  assert.equal(product("BQ023").sourceModel, "A505", "A830 evidence must not spill into adjacent BQ023/A505");
});

test("keeps A505 and A830 identities, links and buyer-facing facts separated", () => {
  const bq023 = product("BQ023");
  assert.equal(bq023.sourceModel, "A505");
  assert.equal(bq023.alibabaProductId, "10000044004948");
  assert.equal(bq023.size, "To be confirmed");
  assert.equal(bq023.upper, "Knit textile upper");
  assert.match(bq023.confirmBeforeQuote.join(" "), /Size range/);

  const bq024 = product("BQ024");
  assert.equal(bq024.sourceModel, "A830");
  assert.equal(bq024.alibabaProductId, "10000044041031");
  assert.equal(bq024.size, "EU 37-45");
  assert.deepEqual(bq024.colors, ["Black White", "All Black", "Black Yellow", "Beige Grey"]);
  assert.match(bq024.confirmBeforeQuote.join(" "), /Current Alibaba SKU names and image binding/);

  const linkedIds = products.flatMap((item) => item.alibabaProductId ? [item.alibabaProductId] : []);
  assert.equal(new Set(linkedIds).size, linkedIds.length, "Alibaba product links must be unique across the catalogue");
});

test("keeps K6212 free of unsupported winter and fleece positioning", () => {
  const bq021 = product("BQ021");
  assert.equal(bq021.sourceModel, "K6212");
  assert.equal(bq021.upper, "Knit textile upper");
  assert.equal(bq021.size, "EU 35-45");
  assert.deepEqual(bq021.colors, ["Black White", "All Black", "White", "Blue", "Grey"]);
  assert.doesNotMatch(
    [bq021.name, bq021.shortDescription, bq021.group, ...bq021.highlights, ...bq021.confirmBeforeQuote].join(" "),
    /winter|fleece/i,
  );
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

test("keeps M8811 source-recorded EVA attached to BQ006 only", () => {
  const bq006 = product("BQ006");
  assert.equal(bq006.sourceModel, "M8811");
  assert.equal(bq006.alibabaProductId, "10000043734620");
  assert.equal(bq006.sole, "EVA sole");
  assert.match(bq006.highlights.join(" "), /EVA sole recorded in the source package/);
  assert.match(bq006.confirmBeforeQuote.join(" "), /Fleece option by selected color/);
  assert.match(bq006.confirmBeforeQuote.join(" "), /Lining material and exact upper composition/);
  assert.doesNotMatch(bq006.confirmBeforeQuote.join(" "), /Outsole and lining materials/);
  assert.equal(factZh("EVA sole recorded in the source package"), "来源资料已记录EVA鞋底");

  assert.match(product("BQ008").sole, /material confirmed before quotation/);
  assert.match(product("BQ011").sole, /material confirmed before quotation/);
});

test("keeps corrected source-package facts attached to BQ011, BQ013, BQ014 and BQ018", () => {
  const bq011 = product("BQ011");
  assert.deepEqual(bq011.colors, ["Grey Black", "Grey White", "Grey Green"]);

  const bq013 = product("BQ013");
  assert.equal(bq013.sourceModel, "T55836");
  assert.equal(bq013.name, "Knit Textile Slip-On Walking Shoes");
  assert.equal(bq013.upper, "Knit textile upper");
  assert.equal(bq013.size, "EU 35-45");
  assert.doesNotMatch(bq013.confirmBeforeQuote.join(" "), /Size range/);

  const bq014 = product("BQ014");
  assert.equal(bq014.sourceModel, "A507");
  assert.equal(bq014.name, "Stretch Textile Slip-On Walking Shoes");
  assert.deepEqual(bq014.colors, ["Beige White", "Black White", "All Black"]);
  assert.doesNotMatch(
    [bq014.name, bq014.shortDescription, bq014.group, ...bq014.highlights, ...bq014.confirmBeforeQuote].join(" "),
    /autumn|winter|fleece/i,
  );
  assert.equal(bq014.alibabaProductId, undefined, "conflicting stored ID must wait for an Accio live readback");

  const bq018 = product("BQ018");
  assert.equal(bq018.sourceModel, "A116");
  assert.equal(bq018.name, "Knit Textile Lace-Up Walking Shoes");
  assert.deepEqual(bq018.colors, ["Lavender", "Cream", "All Black", "Black White"]);
  assert.doesNotMatch(bq018.confirmBeforeQuote.join(" "), /Closure\/lace construction/);
  assert.match(bq018.confirmBeforeQuote.join(" "), /Blue option and color image/);
});

test("renders corrected product names and colors in buyer-readable Chinese", () => {
  assert.equal(productNameZh(product("BQ013")), "针织织物套穿步行鞋");
  assert.equal(productNameZh(product("BQ014")), "弹力织物套穿步行鞋");
  assert.equal(productNameZh(product("BQ018")), "针织织物系带步行鞋");
  assert.equal(factZh("Knit textile upper"), "针织织物鞋面");
  assert.equal(
    factZh("Blue option and color image before adding it to the assortment"),
    "蓝色选项及对应颜色图片在加入产品组合前确认",
  );
});
