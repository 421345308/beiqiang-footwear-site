import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const source = fs.readFileSync(new URL('../app/components/BuyerHome.tsx', import.meta.url), 'utf8')
  .replace('import Link from "next/link";', 'const Link = ({children, ...props}) => React.createElement("a", props, children);')
  .replace(/import (\w+) from "\.\/[^"\n]+";/g, (_, name) => `const ${name} = () => React.createElement("div", {"data-component": "${name}"});`);
const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText
  .replaceAll('"react/jsx-runtime"', JSON.stringify(import.meta.resolve('react/jsx-runtime')))
  .replace(/"(\.\.\/[^"\n]+)"/g, (_, path) => JSON.stringify(new URL(`../app/components/${path}.ts`, import.meta.url).href));
const {default: Home} = await import(`data:text/javascript;base64,${Buffer.from(`import React from ${JSON.stringify(import.meta.resolve('react'))};\n${compiled}`).toString('base64')}`);

test('English and Chinese home buying routes are readable without client execution', () => {
  for (const locale of ['en', 'zh']) {
    const html = renderToStaticMarkup(React.createElement(Home, {locale}));
    const prefix = locale === 'zh' ? '/zh' : '';
    assert.match(html, new RegExp(`href="${prefix}/products/?"`));
    assert.match(html, new RegExp(`href="${prefix}/oem-odm/?"`));
    assert.ok(html.includes('href="#collections"'));
    assert.ok(html.includes(locale === 'zh' ? '全部 69 款' : 'all 69 styles'));
    assert.ok(html.includes(locale === 'zh' ? '小量混色码采购' : 'small orders with mixed colours and sizes'));
    assert.ok(html.includes(locale === 'zh' ? '鞋垫或标签、鞋盒及鞋面颜色' : 'insoles or labels, shoe boxes and upper colours'));
    assert.ok(html.includes('data-component="SelectedStyles"'));
    assert.ok(html.includes('data-component="HomeProductDiscovery"'));
    assert.ok(html.includes('application/ld+json'));
    assert.ok(html.includes('data-component="HeroProductPreview"'));
  }
});
