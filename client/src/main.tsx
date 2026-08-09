import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// PWA registration stays (offline sync engine is future work — OFFLINE_ROADMAP.md).
// Only register the service worker in production builds — in dev, sweep away any
// stale SW registered by an earlier `npm start`, which otherwise intercepts
// refreshes and serves the old cached bundle (filters reset on refresh).
(async () => {
  if (import.meta.env.PROD) {
    const { registerSW } = await import("virtual:pwa-register");
    registerSW({ immediate: true });
  } else if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      await reg.unregister();
    }
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
