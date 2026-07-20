import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scriptPath = path.join(frontendRoot, "scripts", "validate-deployment-config.mjs");

const runValidation = (environment) => spawnSync(process.execPath, [scriptPath], {
  cwd: frontendRoot,
  env: { ...process.env, ...environment },
  encoding: "utf8",
});

test("deployment config accepts a custom domain at the root base path", () => {
  const result = runValidation({ VITE_BASE_PATH: "/", VITE_SITE_URL: "https://dicekout.id" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Konfigurasi deployment valid/);
});

test("deployment config accepts a GitHub Pages repository path", () => {
  const result = runValidation({
    VITE_BASE_PATH: "/dicekout/",
    VITE_SITE_URL: "https://example.github.io/dicekout",
  });
  assert.equal(result.status, 0, result.stderr);
});

test("deployment config rejects a base path that disagrees with the site URL", () => {
  const result = runValidation({
    VITE_BASE_PATH: "/dicekout/",
    VITE_SITE_URL: "https://dicekout.id",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /tidak sinkron/);
});

test("deployment config rejects credentials and unsafe protocols", () => {
  for (const url of ["https://user:secret@dicekout.id", "javascript:alert(1)"]) {
    const result = runValidation({ VITE_BASE_PATH: "/", VITE_SITE_URL: url });
    assert.notEqual(result.status, 0, url);
    assert.match(result.stderr, /HTTP\(S\) tanpa credential/);
  }
});
