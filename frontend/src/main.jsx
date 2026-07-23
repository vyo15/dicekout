import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import AppErrorBoundary from "./components/feedback/AppErrorBoundary.jsx";
import { BASE_PATH } from "./config/site.js";
import "./styles/tokens.css";
import "./index.css";
import "./styles/base.css";
import "./styles/home-foundation.css";
import "./styles/catalog-cards.css";
import "./styles/discovery.css";
import "./styles/catalog-controls.css";
import "./styles/product-detail.css";
import "./styles/about.css";
import "./styles/legal.css";
import "./styles/layout-responsive.css";
import "./styles/home.css";
import "./styles/catalog.css";
import "./styles/overlays.css";
import "./styles/theme-overrides.css";
import "./styles/product-enhancements.css";
import "./styles/feedback.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter basename={BASE_PATH === "/" ? undefined : BASE_PATH}>
        <App />
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>,
);
