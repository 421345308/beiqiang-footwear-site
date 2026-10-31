import { wrapUnifiedHandler } from '../_lib/unified-origin-proxy.js';
export const onRequestPut = wrapUnifiedHandler(() => new Response(null, { status: 404 }));
