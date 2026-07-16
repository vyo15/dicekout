import path from "node:path";
import { realpath } from "node:fs/promises";

const isContained = (root, candidate) => candidate === root || candidate.startsWith(`${root}${path.sep}`);

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
  if (
    !name
    || name === "."
    || name === ".."
    || name.includes("/")
    || name.includes("\\")
    || name.includes("\0")
    || [...name].some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    })
    || name !== path.basename(name)
  ) throw new Error(`${label} tidak valid.`);
  return name;
};

export const resolveContainedPath = async (root, relativeName) => {
  const resolvedRoot = await realpath(root);
  const normalized = String(relativeName || "").replaceAll("\\", "/");
  if (
    !normalized
    || normalized.startsWith("/")
    || normalized.split("/").some((segment) => segment === ".." || segment === ".")
  ) throw new Error("Path berada di luar allowlist.");

  const candidate = path.resolve(resolvedRoot, normalized);
  if (!isContained(resolvedRoot, candidate)) throw new Error("Path berada di luar allowlist.");

  const missingSegments = [];
  let current = candidate;
  while (true) {
    try {
      const resolvedCurrent = await realpath(current);
      if (!isContained(resolvedRoot, resolvedCurrent)) throw new Error("Path berada di luar allowlist.");
      return path.join(resolvedCurrent, ...missingSegments);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      const parent = path.dirname(current);
      if (parent === current) throw new Error("Path berada di luar allowlist.");
      missingSegments.unshift(path.basename(current));
      current = parent;
    }
  }
};
