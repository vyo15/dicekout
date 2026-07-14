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

export const assertSafeBasename = (value, label = "Nama file") => {
  const name = String(value || "");
  if (!name || name !== path.basename(name) || name.includes("\0")) throw new Error(`${label} tidak valid.`);
  return name;
};

export const resolveContainedPath = async (root, relativeName) => {
  const resolvedRoot = await realpath(root);
  const normalized = String(relativeName || "").replaceAll("\\", "/");
  if (!normalized || normalized.startsWith("/") || normalized.split("/").includes("..")) throw new Error("Path berada di luar allowlist.");
  const candidate = path.resolve(resolvedRoot, normalized);
  if (candidate !== resolvedRoot && !candidate.startsWith(`${resolvedRoot}${path.sep}`)) throw new Error("Path berada di luar allowlist.");
  return candidate;
};

export const assertContainedPath = async (root, candidate) => {
  const relative = path.relative(root, candidate);
  return resolveContainedPath(root, relative);
};
