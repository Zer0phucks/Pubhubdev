
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import App from "./App.tsx";
import "./index.css";
import "./sentry";
import { initWebVitals } from "./utils/webVitals";

// Initialize Core Web Vitals monitoring
initWebVitals();

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Analytics />
  </>
);
  