import path from "node:path";
import { realpath } from "node:fs/promises";
export const assertLocalRequest = (req, port) => {
  const host = String(req.headers.host || "");
  if (![ `127.0.0.1:${port}`, `localhost:${port}` ].includes(host)) throw new Error("Host tidak diizinkan.");
  const origin = req.headers.origin;
  if (origin && ![ `http://127.0.0.1:${port}`, `http://localhost:${port}` ].includes(origin)) throw new Error("Origin tidak diizinkan.");
};
export const assertSession = (req, token) => {
  if (req.headers["x-dicekout-session"] !== token) throw new Error("Session lokal tidak valid.");
};
export const assertContainedPath = async (root, candidate) => {
  const resolvedRoot = await realpath(root);
  const parent = await realpath(path.dirname(candidate));
  const resolved = path.join(parent, path.basename(candidate));
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) throw new Error("Path berada di luar allowlist.");
  return resolved;
};
