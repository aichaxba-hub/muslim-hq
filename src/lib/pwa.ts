// Single guarded service-worker registrar. Never registers in dev, iframes, or Lovable preview hosts.
export async function registerAppServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const host = window.location.hostname;
  const params = new URLSearchParams(window.location.search);
  let inIframe = false;
  try { inIframe = window.self !== window.top; } catch { inIframe = true; }
  const refused =
    !import.meta.env.PROD || inIframe ||
    host.startsWith("id-preview--") || host.startsWith("preview--") ||
    host === "lovableproject.com" || host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev") ||
    params.get("sw") === "off";
  if (refused) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.filter(r => r.active?.scriptURL.endsWith("/sw.js")).map(r => r.unregister()));
    return;
  }
  try { await navigator.serviceWorker.register("/sw.js", { scope: "/" }); } catch { /* ignore */ }
}
