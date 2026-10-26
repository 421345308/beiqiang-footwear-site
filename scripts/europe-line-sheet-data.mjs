import { products } from '../app/data/products.ts';
import { supplyMode } from '../app/data/published-product-codes.ts';
import { productTitle, productFact, productColour } from '../app/data/europe-products.ts';
import { europeLocales, t } from '../app/data/europe-copy.ts';

export const sheets = europeLocales.map(locale => ({locale, title:t(locale,'lineSheet'), intro:t(locale,'catalogIntro'), boundary:t(locale,'availability'), supply:t(locale,'supplyIntro'), contact:t(locale,'quote'), labels:Object.fromEntries(['upper','sole','sizes','closure','colour','view'].map(k=>[k,t(locale,k)])), products:products.map(p=>({code:p.code,slug:p.slug,image:p.images[0],title:productTitle(p,locale),upper:productFact(p.upper,locale),sole:productFact(p.sole,locale),size:productFact(p.size,locale),closure:productFact(p.closure,locale),colours:p.colors.map(c=>productColour(c,locale)),supply:t(locale,supplyMode(p.code)==='partner-sourced'?'partner':'own')}))}));
