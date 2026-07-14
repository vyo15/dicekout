import http from "node:http";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, rm, writeFile } from "node:fs/promises";
import { createServer as createViteServer } from "vite";
import { assertLocalRequest, assertSafeBasename, assertSession, resolveContainedPath } from "./security.mjs";
import { createCatalogRepository } from "./catalogRepository.mjs";
import { MAX_IMAGE_INPUT_BYTES, processProductImage } from "./imageProcessor.mjs";
import { marketplaces } from "../../../frontend/src/config/marketplaces.js";
import { productPalettes, PRODUCT_IMAGE_POSITIONS, PRODUCT_IMAGE_SCALES } from "../../../frontend/src/config/productPalettes.js";

const managerDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectRoot = path.resolve(managerDir, "..", "..");
const brandDir = path.join(projectRoot, "frontend", "public", "brand");
const port = 666;
const token = crypto.randomBytes(24).toString("hex");
const repo = createCatalogRepository(projectRoot);
await repo.ensureDirs();
await repo.cleanupTempMedia();

const lockPath = path.join(repo.paths.stateDir, "manager.lock");
const acquireManagerLock = async () => {
  try {
    await writeFile(lockPath, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }), { flag: "wx" });
    return;
  } catch {
    let activePid = 0;
    try {
      const lock = JSON.parse(await readFile(lockPath, "utf8"));
      activePid = Number(lock.pid) || 0;
    } catch {
      activePid = Number(await readFile(lockPath, "utf8").catch(() => "0")) || 0;
    }
    if (activePid > 0) {
      try {
        process.kill(activePid, 0);
        throw new Error(`Catalog Manager lain masih aktif (PID ${activePid}).`);
      } catch (error) {
        if (error.code !== "ESRCH") throw error;
      }
    }
    await rm(lockPath, { force: true });
    await writeFile(lockPath, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }), { flag: "wx" });
  }
};
await acquireManagerLock();

let shuttingDown = false;
const cleanup = async () => {
  if (shuttingDown) return;
  shuttingDown = true;
  await rm(lockPath, { force: true }).catch(() => {});
};
process.on("SIGINT", async () => { await cleanup(); process.exit(0); });
process.on("SIGTERM", async () => { await cleanup(); process.exit(0); });
process.on("exit", () => { if (!shuttingDown) rm(lockPath, { force: true }).catch(() => {}); });

const vite = await createViteServer({
  root: managerDir,
  server: { middlewareMode: true, hmr: false, host: "127.0.0.1", strictPort: true },
  appType: "spa",
});

const send = (res, status, payload, type = "application/json; charset=utf-8") => {
  res.writeHead(status, {
    "content-type": type,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  res.end(type.startsWith("application/json") ? JSON.stringify(payload) : payload);
};

const readRawBody = async (req, limit) => {
  const declared = Number(req.headers["content-length"] || 0);
  if (declared > limit) throw new Error("Payload terlalu besar.");
  const parts = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error("Payload terlalu besar.");
    parts.push(chunk);
  }
  return Buffer.concat(parts);
};

const readJsonBody = async (req, limit = 2 * 1024 * 1024) => {
  const buffer = await readRawBody(req, limit);
  if (!buffer.length) return {};
  try {
    return JSON.parse(buffer.toString("utf8"));
  } catch {
    throw new Error("Payload JSON tidak valid.");
  }
};

const api = async (req, res, url) => {
  assertLocalRequest(req, port);
  assertSession(req, token);

  if (req.method === "GET" && url.pathname === "/api/catalog") return send(res, 200, await repo.readCatalog());
  if (req.method === "GET" && url.pathname === "/api/options") return send(res, 200, {
    marketplaces,
    productPalettes,
    imagePositions: PRODUCT_IMAGE_POSITIONS,
    imageScales: PRODUCT_IMAGE_SCALES,
  });
  if (req.method === "GET" && url.pathname === "/api/drafts") return send(res, 200, await repo.listDrafts());
  if (req.method === "GET" && url.pathname === "/api/backups") return send(res, 200, await repo.listBackups());

  if (req.method === "POST" && url.pathname === "/api/drafts") {
    const body = await readJsonBody(req);
    return send(res, 200, { id: await repo.saveDraft(body.product, body.tempMedia) });
  }
  if (req.method === "POST" && url.pathname === "/api/drafts/delete") {
    const body = await readJsonBody(req);
    return send(res, 200, await repo.deleteDraft(body.draftKey));
  }
  if (req.method === "POST" && url.pathname === "/api/validate") {
    const body = await readJsonBody(req);
    return send(res, 200, await repo.validateCandidate(body.product));
  }
  if (req.method === "POST" && url.pathname === "/api/media") {
    const buffer = await readRawBody(req, MAX_IMAGE_INPUT_BYTES);
    const originalName = decodeURIComponent(String(req.headers["x-original-name"] || ""));
    const processed = await processProductImage({
      buffer,
      suppliedMime: String(req.headers["content-type"] || ""),
      originalName,
      name: decodeURIComponent(String(req.headers["x-product-name"] || "")),
      slug: decodeURIComponent(String(req.headers["x-product-slug"] || "")),
    });
    const temp = await repo.importTempMedia({
      buffer: processed.buffer,
      finalName: processed.finalName,
      metadata: {
        hash: processed.hash,
        path: processed.path,
        original: processed.original,
        optimized: processed.optimized,
      },
    });
    const replaceTemp = String(req.headers["x-replace-temp"] || "");
    if (replaceTemp && replaceTemp !== temp.tempName) await repo.removeTemp(replaceTemp).catch(() => {});
    return send(res, 200, temp);
  }
  if (req.method === "POST" && url.pathname === "/api/media/discard") {
    const body = await readJsonBody(req);
    return send(res, 200, { removed: await repo.removeTemp(body.tempName) });
  }
  if (req.method === "POST" && url.pathname === "/api/apply") {
    const body = await readJsonBody(req);
    return send(res, 200, await repo.apply(body.product, body.tempMedia));
  }
  if (req.method === "POST" && url.pathname === "/api/products/delete-impact") {
    const body = await readJsonBody(req);
    return send(res, 200, await repo.analyzeDelete(body.productId));
  }
  if (req.method === "POST" && url.pathname === "/api/products/delete") {
    const body = await readJsonBody(req);
    return send(res, 200, await repo.deleteProduct(body));
  }
  if (req.method === "POST" && url.pathname === "/api/rollback") {
    const body = await readJsonBody(req);
    return send(res, 200, await repo.rollback(body.backupId));
  }
  return send(res, 404, { error: "Endpoint tidak ditemukan." });
};

const contentTypeForName = (name) => {
  const ext = path.extname(name).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
};

const serveAllowedFile = async (res, root, rawName, allowedExtensions = null) => {
  const name = assertSafeBasename(decodeURIComponent(rawName), "Nama media");
  if (allowedExtensions && !allowedExtensions.includes(path.extname(name).toLowerCase())) return send(res, 404, "Not found", "text/plain; charset=utf-8");
  const file = await resolveContainedPath(root, name);
  const buffer = await readFile(file);
  res.writeHead(200, {
    "content-type": contentTypeForName(name),
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  return res.end(buffer);
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (url.pathname.startsWith("/api/")) return await api(req, res, url);
    if (url.pathname.startsWith("/brand-assets/")) {
      assertLocalRequest(req, port);
      const name = url.pathname.slice("/brand-assets/".length);
      const allowed = ["dicekout-logo.png", "favicon-64.png", "icon-192.png", "icon-512.png"];
      if (!allowed.includes(decodeURIComponent(name))) return send(res, 404, "Not found", "text/plain; charset=utf-8");
      return serveAllowedFile(res, brandDir, name, [".png"]);
    }
    if (url.pathname.startsWith("/catalog-media/")) {
      assertLocalRequest(req, port);
      return serveAllowedFile(res, repo.paths.mediaDir, url.pathname.slice("/catalog-media/".length), [".png", ".webp", ".jpg", ".jpeg", ".svg"]);
    }
    if (url.pathname.startsWith("/temp-media/")) {
      assertLocalRequest(req, port);
      return serveAllowedFile(res, repo.paths.tempDir, url.pathname.slice("/temp-media/".length), [".webp"]);
    }
    return vite.middlewares(req, res, () => send(res, 404, "Not found", "text/plain; charset=utf-8"));
  } catch (error) {
    return send(res, 400, { error: error.message || "Terjadi kesalahan." });
  }
});

server.on("error", async (error) => {
  await cleanup();
  if (error.code === "EADDRINUSE") console.error(`Port ${port} sedang dipakai. Tutup Catalog Manager/proses lain lalu jalankan kembali.`);
  else console.error(error);
  process.exit(1);
});

server.listen(port, "127.0.0.1", () => console.log(`\nDicekOut Catalog Manager:\nhttp://127.0.0.1:${port}/?session=${token}\n`));
