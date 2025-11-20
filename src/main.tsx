
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import App from "./App.tsx";
import "./index.css";
import "./sentry";
import { initWebVitals } from "./utils/webVitals";

async function enableMocking() {
  const flag = (import.meta.env.VITE_USE_MOCK_SERVER ?? "true").toLowerCase();
  if (flag !== "false") {
    console.info("[PubHub] Demo API mock server enabled.");
    const { worker } = await import("./mocks/browser");
    await worker
      .start({
        onUnhandledRequest: "bypass",
        serviceWorker: {
          url: "/mockServiceWorker.js",
        },
      })
      .then(() => console.info("[PubHub] Mock server ready."))
      .catch((error) => {
        console.error("[PubHub] Failed to start mock server", error);
      });
  }
}

// Initialize Core Web Vitals monitoring
initWebVitals();

enableMocking().finally(() => {
  createRoot(document.getElementById("root")!).render(
    <>
      <App />
      <Analytics />
    </>
  );
});
  