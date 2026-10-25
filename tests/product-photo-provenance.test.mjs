import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {products} from '../app/data/products.ts';
import media from '../app/data/product-colour-media.json' with {type:'json'};
import labels from '../app/data/product-photo-labels.json' with {type:'json'};
import provenance from '../data/product-photo-provenance.json' with {type:'json'};

test('published photos retain product-specific provenance and their checked asset hashes',()=>{
  for (const p of products) {
    const entries=provenance.products[p.code];
    assert.deepEqual(entries.map(e=>e.image),p.images,p.code);
    assert.equal(labels[p.code].length,p.images.length,p.code);
    for (const [i,e] of entries.entries()) {
      assert.match(e.sourceSha256,/^[a-f0-9]{64}$/);
      assert.equal(createHash('sha256').update(readFileSync(`public${e.image}`)).digest('hex'),e.outputSha256,e.image);
      assert.equal(labels[p.code][i].role,e.role);
      if(e.colour) {
        assert.ok(p.colors.includes(e.colour),`${p.code} ${e.colour}`);
        assert.ok(media[p.code].views[e.colour].includes(i), `${p.code} ${e.colour} ${i}`);
      }
      if(e.sourceCrop) {
        assert.equal(e.cropBox.length,4);
        assert.ok(e.sourcePage.startsWith('https://'));
        assert.equal(labels[p.code][i].sourceCrop,true,'Source-sheet crops must remain labelled');
      }
    }
    for(const [colour,index] of Object.entries(media[p.code].images)) assert.equal(entries[index].colour,colour);
  }
});
