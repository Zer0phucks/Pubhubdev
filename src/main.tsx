
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.tsx";
import "./index.css";
import "./sentry";
import { initWebVitals } from "./utils/webVitals";

async function enableMocking() {
  const defaultFlag = import.meta.env.DEV ? "true" : "false";
  const rawFlag = (import.meta.env.VITE_USE_MOCK_SERVER ?? defaultFlag).toLowerCase();
  const shouldMock = rawFlag === "true" && import.meta.env.DEV;

  if (!shouldMock) {
    if (rawFlag === "true" && import.meta.env.PROD) {
      console.warn(
        "[PubHub] Mock server is disabled in production builds even though VITE_USE_MOCK_SERVER=true."
      );
    }
    return;
  }

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

// Initialize Core Web Vitals monitoring
initWebVitals();

enableMocking().finally(() => {
  const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!clerkPublishableKey && import.meta.env.PROD) {
    console.error(
      "[PubHub] Missing VITE_CLERK_PUBLISHABLE_KEY. Authentication will fail until it is configured."
    );
  }

  createRoot(document.getElementById("root")!).render(
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <App />
      <Analytics />
    </ClerkProvider>
  );
});
  