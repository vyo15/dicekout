import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assertLocalRequest,
  assertSafeBasename,
  assertSession,
  resolveContainedPath,
} from "../server/security.mjs";

const localPort = 666;

test("local host accepted", () => {
  assert.doesNotThrow(() =>
    assertLocalRequest(
      {
        headers: {
          host: `127.0.0.1:${localPort}`,
          origin: `http://127.0.0.1:${localPort}`,
        },
      },
      localPort,
    )
  );
});

test("foreign origin rejected", () => {
  assert.throws(() =>
    assertLocalRequest(
      {
        headers: {
          host: `127.0.0.1:${localPort}`,
          origin: "https://example.com",
        },
      },
      localPort,
    )
  );
});

test("session required for every API request", () => {
  assert.throws(() => assertSession({ headers: {} }, "secret"));
  assert.doesNotThrow(() => assertSession({ headers: { "x-dicekout-session": "secret" } }, "secret"));
});

test("basenames and allowlisted paths reject traversal", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "dicekout-security-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "nested"), { recursive: true });

  assert.equal(assertSafeBasename("image.webp"), "image.webp");
  assert.throws(() => assertSafeBasename("../image.webp"), /tidak valid/);
  assert.throws(() => assertSafeBasename("nested/image.webp"), /tidak valid/);
  assert.throws(() => assertSafeBasename(".."), /tidak valid/);
  assert.throws(() => assertSafeBasename("."), /tidak valid/);
  assert.throws(() => assertSafeBasename("nested\\image.webp"), /tidak valid/);
  assert.equal(await resolveContainedPath(root, "nested/image.webp"), path.join(root, "nested", "image.webp"));
  await assert.rejects(resolveContainedPath(root, "../secret.txt"), /allowlist/);
  await assert.rejects(resolveContainedPath(root, "/absolute.txt"), /allowlist/);
});


test("allowlisted path rejects symlink escapes when the platform supports symlinks", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "dicekout-security-root-"));
  const outside = await mkdtemp(path.join(os.tmpdir(), "dicekout-security-outside-"));
  t.after(() => Promise.all([
    rm(root, { recursive: true, force: true }),
    rm(outside, { recursive: true, force: true }),
  ]));
  await writeFile(path.join(outside, "secret.txt"), "secret", "utf8");

  try {
    await symlink(outside, path.join(root, "escape"), "dir");
  } catch (error) {
    if (["EPERM", "EACCES", "ENOTSUP"].includes(error?.code)) {
      t.skip(`Symlink tidak tersedia pada platform ini: ${error.code}`);
      return;
    }
    throw error;
  }

  await assert.rejects(resolveContainedPath(root, "escape/secret.txt"), /allowlist/);
});
