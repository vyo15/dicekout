import http from "node:http";
import { readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import { assertLocalRequest, assertSession } from "./security.mjs";
import { createCatalogRepository } from "./catalogRepository.mjs";
import { inspectImage } from "./imageMetadata.mjs";
import { marketplaces } from "../../../frontend/src/config/marketplaces.js";
import { productPalettes, PRODUCT_IMAGE_POSITIONS, PRODUCT_IMAGE_SCALES } from "../../../frontend/src/config/productPalettes.js";
import { slugifyProductName } from "../../../frontend/src/domain/catalog/normalizeProduct.js";

const managerDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectRoot = path.resolve(managerDir, "..", "..");
const brandDir = path.join(projectRoot, "frontend", "public", "brand");
const port = 666;
const token = crypto.randomBytes(24).toString("hex");
const repo = createCatalogRepository(projectRoot);
await repo.ensureDirs();
const lockPath = path.join(repo.paths.stateDir, "manager.lock");
try { await writeFile(lockPath, String(process.pid), { flag: "wx" }); }
catch { console.error("Catalog Manager lain masih aktif atau lock belum dibersihkan:", lockPath); process.exit(1); }
const cleanup = async () => { await rm(lockPath, { force: true }); process.exit(0); };
process.on("SIGINT", cleanup); process.on("SIGTERM", cleanup);

const vite = await createViteServer({ root: managerDir, server: { middlewareMode: true, hmr: false, host: "127.0.0.1", strictPort: true }, appType: "spa" });
const send = (res, status, payload, type="application/json; charset=utf-8") => { res.writeHead(status,{"content-type":type,"cache-control":"no-store","x-content-type-options":"nosniff"}); res.end(type.startsWith("application/json")?JSON.stringify(payload):payload); };
const readBody = async (req, limit=10*1024*1024) => { const parts=[]; let size=0; for await(const chunk of req){size+=chunk.length;if(size>limit)throw new Error("Payload terlalu besar.");parts.push(chunk);} return parts.length?JSON.parse(Buffer.concat(parts).toString("utf8")):{}; };
const api = async (req,res,url) => {
  assertLocalRequest(req,port);
  if (req.method !== "GET") assertSession(req,token);
  if (req.method==="GET" && url.pathname==="/api/catalog") return send(res,200,await repo.readCatalog());
  if (req.method==="GET" && url.pathname==="/api/options") return send(res,200,{marketplaces,productPalettes,imagePositions:PRODUCT_IMAGE_POSITIONS,imageScales:PRODUCT_IMAGE_SCALES});
  if (req.method==="GET" && url.pathname==="/api/drafts") return send(res,200,await repo.listDrafts());
  if (req.method==="POST" && url.pathname==="/api/drafts") { const body=await readBody(req); return send(res,200,{id:await repo.saveDraft(body.product)}); }
  if (req.method==="POST" && url.pathname==="/api/validate") { const body=await readBody(req); return send(res,200,await repo.validateCandidate(body.product)); }
  if (req.method==="POST" && url.pathname==="/api/media") {
    const body=await readBody(req); const buffer=Buffer.from(String(body.base64||""),"base64");
    if (!buffer.length || buffer.length>8*1024*1024) throw new Error("Gambar wajib diisi dan maksimal 8 MB.");
    const meta=inspectImage(buffer,String(body.mime||""));
    const slug=slugifyProductName(body.slug||body.name)||`product-${Date.now()}`;
    const finalName=`${slug}-${crypto.randomBytes(3).toString("hex")}.${meta.extension}`;
    const temp=await repo.importTempMedia({buffer,finalName});
    return send(res,200,{...temp,...meta,size:buffer.length,path:`images/products/${finalName}`});
  }
  if (req.method==="POST" && url.pathname==="/api/apply") { const body=await readBody(req); return send(res,200,await repo.apply(body.product,body.tempMedia)); }
  if (req.method==="POST" && url.pathname==="/api/rollback") { const body=await readBody(req); await repo.rollback(body.backupId); return send(res,200,{ok:true}); }
  return send(res,404,{error:"Endpoint tidak ditemukan."});
};
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,`http://127.0.0.1:${port}`);if(url.pathname.startsWith("/api/"))return await api(req,res,url);if(url.pathname.startsWith("/brand-assets/")){assertLocalRequest(req,port);const allowed=new Map([["dicekout-logo.png","image/png"],["favicon-64.png","image/png"],["icon-192.png","image/png"],["icon-512.png","image/png"]]);const name=path.basename(decodeURIComponent(url.pathname.slice("/brand-assets/".length)));const type=allowed.get(name);if(!type)return send(res,404,"Not found","text/plain; charset=utf-8");const buffer=await readFile(path.join(brandDir,name));res.writeHead(200,{"content-type":type,"cache-control":"no-store","x-content-type-options":"nosniff"});return res.end(buffer);}if(url.pathname.startsWith("/catalog-media/")){assertLocalRequest(req,port);const name=path.basename(decodeURIComponent(url.pathname.slice("/catalog-media/".length)));const file=path.join(repo.paths.mediaDir,name);const buffer=await readFile(file);const ext=path.extname(name).toLowerCase();const type=ext===".png"?"image/png":ext===".webp"?"image/webp":ext===".jpg"||ext===".jpeg"?"image/jpeg":ext===".svg"?"image/svg+xml":"application/octet-stream";res.writeHead(200,{"content-type":type,"cache-control":"no-store","x-content-type-options":"nosniff"});return res.end(buffer);}return vite.middlewares(req,res,()=>send(res,404,"Not found","text/plain; charset=utf-8"));}catch(error){return send(res,400,{error:error.message||"Terjadi kesalahan."});}});
server.on("error", async (error) => {
  await rm(lockPath, { force: true }).catch(() => {});
  if (error.code === "EADDRINUSE") console.error(`Port ${port} sedang dipakai. Tutup Catalog Manager/proses lain lalu jalankan kembali.`);
  else console.error(error);
  process.exit(1);
});
server.listen(port,"127.0.0.1",()=>console.log(`\nDicekOut Catalog Manager:\nhttp://127.0.0.1:${port}/?session=${token}\n`));
