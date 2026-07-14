import assert from "node:assert/strict";
import test from "node:test";

import { assertLocalRequest, assertSession } from "../server/security.mjs";

const localPort = 666;

test("local host accepted", () => {
  assert.doesNotThrow(() =>
    assertLocalRequest(
      {
        headers: {
          host: `127.0.0.1:${localPort}`,
          origin: `http://127.0.0.1:${localPort}`
        }
      },
      localPort
    )
  );
});

test("foreign origin rejected", () => {
  assert.throws(() =>
    assertLocalRequest(
      {
        headers: {
          host: `127.0.0.1:${localPort}`,
          origin: "https://example.com"
        }
      },
      localPort
    )
  );
});

test("session required for write", () => {
  assert.throws(() => assertSession({ headers: {} }, "secret"));
});
