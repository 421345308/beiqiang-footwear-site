"use client";

import { useSyncExternalStore } from "react";

// The static page is visible before React attaches handlers. Enable controls
// only after hydration, so early clicks are not silently lost.
const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function useClientReady() {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
}
