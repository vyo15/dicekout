import { useCallback, useEffect, useState } from "react";

const SESSION_STORAGE_KEY = "dicekout-manager-session";

const readInitialSession = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("session") || window.sessionStorage.getItem(SESSION_STORAGE_KEY) || "";
};

export const useCatalogManagerApi = () => {
  const [session] = useState(readInitialSession);

  useEffect(() => {
    const url = new URL(window.location.href);
    const supplied = url.searchParams.get("session");
    if (!supplied) return;

    window.sessionStorage.setItem(SESSION_STORAGE_KEY, supplied);
    url.searchParams.delete("session");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const api = useCallback(async (requestPath, { method = "GET", body, headers = {}, raw = false } = {}) => {
    if (!session) throw new Error("Session Catalog Manager tidak tersedia. Buka ulang URL yang ditampilkan terminal.");

    const requestHeaders = { "x-dicekout-session": session, ...headers };
    let requestBody = body;
    if (body !== undefined && !raw) {
      requestHeaders["content-type"] = "application/json";
      requestBody = JSON.stringify(body);
    }

    const response = await fetch(requestPath, { method, headers: requestHeaders, body: requestBody });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Request gagal.");
    return data;
  }, [session]);

  return { api, session };
};
