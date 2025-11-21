import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.tsx";
import "./index.css";
import "./sentry";
import { initWebVitals } from "./utils/webVitals";

async function enableMocking() {
  // Only enable mocking in development mode, never in production
  if (import.meta.env.PROD) {
    return;
  }
  
  const defaultFlag = import.meta.env.DEV ? "true" : "false";
  const rawFlag = (import.meta.env.VITE_USE_MOCK_SERVER ?? defaultFlag).toLowerCase();
  const shouldMock = rawFlag === "true";

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

enableMocking().finally(async () => {
  const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim();

  if (!clerkPublishableKey) {
    if (import.meta.env.PROD) {
      console.error(
        "[PubHub] Missing VITE_CLERK_PUBLISHABLE_KEY. Authentication will fail until it is configured."
      );
    }
    // Fallback UI when Clerk key is missing
    const root = createRoot(document.getElementById("root")!);
    root.render(
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Configuration Error</h1>
        <p>Missing VITE_CLERK_PUBLISHABLE_KEY environment variable.</p>
        <p>Please configure the Clerk publishable key to continue.</p>
      </div>
    );
    return;
  }

  const root = createRoot(document.getElementById("root")!);
  
  // Conditionally load PostHog if keys are available
  const postHogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY?.trim();
  const postHogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST?.trim();
  
  const AppContent = (
    <ClerkProvider publishableKey={clerkPublishableKey || ""}>
      <App />
      <Analytics />
    </ClerkProvider>
  );
  
  // Render app - PostHog will be initialized separately if needed
  root.render(AppContent);
  
  // Initialize PostHog separately if keys are available (after render to avoid blocking)
  if (postHogKey && postHogHost) {
    // Use setTimeout to ensure this runs after initial render and Vite build analysis
    setTimeout(() => {
      // Dynamically import and initialize PostHog after app renders
      // Must use string literal, not variable, for dynamic import to work
      import(/* @vite-ignore */ "posthog-js").then((posthog) => {
        posthog.default.init(postHogKey, {
          api_host: postHogHost,
          defaults: '2025-05-24',
          capture_exceptions: true,
          debug: import.meta.env.MODE === "development",
        });
      }).catch((error) => {
        console.warn("[PubHub] Failed to initialize PostHog:", error);
      });
    }, 0);
  }
});