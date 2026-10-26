// Import only binding types; global Worker fetch types conflict with browser DOM types.
type D1Database = import("@cloudflare/workers-types/index.ts").D1Database;
declare module "cloudflare:workers" {
  export const env: { DB?: D1Database };
}
