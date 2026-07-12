import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const normalizeBasePath = (value = "/") => {
  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
};

export default defineConfig({
  plugins: [react()],
  base: normalizeBasePath(process.env.VITE_BASE_PATH || "/"),
  build: {
    chunkSizeWarningLimit: 700,
  },
});
