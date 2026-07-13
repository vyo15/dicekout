import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import AppErrorBoundary from "./components/feedback/AppErrorBoundary.jsx";
import { BASE_PATH } from "./config/site.js";
import "./styles/tokens.css";
import "./index.css";
import "./styles/site.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter basename={BASE_PATH === "/" ? undefined : BASE_PATH}>
        <App />
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>,
);
