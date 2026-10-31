import { readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

// Derive the route manifest from the existing handlers, rather than a second
// hand-maintained API list. Utility modules without handlers are excluded.
export async function loadRoutes(root = new URL('../edgeone-deploy/cloud-functions/api/', import.meta.url)) {
  const routes = new Map();
  async function visit(directory, prefix = '/api') {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(filename, `${prefix}/${entry.name}`);
      else if (entry.name.endsWith('.js')) {
        const routeModule = await import(pathToFileURL(filename).href);
        const methods = Object.fromEntries(Object.entries(routeModule).filter(([name, value]) => /^onRequest(Get|Post|Patch|Delete|Put|Head|Options)$/.test(name) && typeof value === 'function').map(([name, value]) => [name.slice(9).toUpperCase(), value]));
        if (Object.keys(methods).length) routes.set(`${prefix}/${entry.name.slice(0, -3)}`, methods);
      }
    }
  }
  await visit(root instanceof URL ? fileURLToPath(root) : root);
  return routes;
}
