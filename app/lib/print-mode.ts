export function printWithBodyClass(className: string) {
  if (typeof window === "undefined" || !document.body) return;
  document.body.classList.add(className);
  const cleanup = () => document.body.classList.remove(className);
  window.addEventListener("afterprint", cleanup, { once: true });
  try { window.print(); } catch (error) { cleanup(); throw error; }
}
