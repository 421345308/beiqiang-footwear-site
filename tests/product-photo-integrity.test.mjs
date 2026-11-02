import test from 'node:test';
import assert from 'node:assert/strict';
import {statSync} from 'node:fs';
import {products} from '../app/data/products.ts';
import media from '../app/data/product-colour-media.json' with {type:'json'};
import labels from '../app/data/product-photo-labels.json' with {type:'json'};

test('published photos have valid files, captions and matching colour galleries',()=>{
  for (const product of products) {
    const photos=labels[product.code];
    assert.equal(photos.length,product.images.length,product.code);
    assert.equal(new Set(product.images).size,product.images.length,product.code);
    for (const [index,path] of product.images.entries()) {
      assert.ok(statSync(`public${path}`).size>0,`${product.code} ${path}`);
      const photo=photos[index];
      assert.ok(photo.role,`${product.code} photo ${index}`);
      if (photo.colour) {
        assert.ok(product.colors.includes(photo.colour),`${product.code} ${photo.colour}`);
        assert.ok(media[product.code].views[photo.colour].includes(index),`${product.code} ${photo.colour} ${index}`);
      }
    }
    for (const [colour,index] of Object.entries(media[product.code].images)) {
      assert.equal(photos[index].colour,colour,`${product.code} ${colour}`);
    }
  }
});
