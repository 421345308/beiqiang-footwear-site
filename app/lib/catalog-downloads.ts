import { SITE_RELEASE } from "../data/site-release.ts";

// Download filenames remain stable for existing links. A release-specific query
// gives browsers a fresh URL when a catalogue changes under the same name.
export function versionedCatalogueUrl(path: string) {
  return `${path}${path.includes("?") ? "&" : "?"}v=${encodeURIComponent(SITE_RELEASE.releaseId)}`;
}
