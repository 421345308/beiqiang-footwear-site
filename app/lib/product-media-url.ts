// Change when replacing existing product image files so returning buyers see the
// reviewed photos even when their browser still holds the previous 30-day cache.
export const PRODUCT_MEDIA_REVISION = "20261025-colour-galleries";
export function productMediaUrl(path: string): string {
  return `${path.split("?")[0]}?v=${PRODUCT_MEDIA_REVISION}`;
}
