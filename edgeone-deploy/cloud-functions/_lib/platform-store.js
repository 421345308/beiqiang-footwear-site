import { getStore as getBlobStore } from '@edgeone/pages-blob';

// The Node entry point installs an AsyncLocalStorage accessor. EdgeOne never
// installs it, so its established storage behavior remains unchanged.
export const PLATFORM_CONTEXT = Symbol.for('beiqiang.platform.request-context');
export function platformContext() { return globalThis[PLATFORM_CONTEXT]?.getStore(); }
export function getStore(args) {
  const context = platformContext();
  return context ? context.storage.getStore(args) : getBlobStore(args);
}
