import test from "node:test";
import assert from "node:assert/strict";
import { assertLocalRequest, assertSession } from "../server/security.mjs";

test("local host accepted",()=>assert.doesNotThrow(()=>assertLocalRequest({headers:{host:"127.0.0.1:4317",origin:"http://127.0.0.1:4317"}},4317)));
test("foreign origin rejected",()=>assert.throws(()=>assertLocalRequest({headers:{host:"127.0.0.1:4317",origin:"https://example.com"}},4317)));
test("session required for write",()=>assert.throws(()=>assertSession({headers:{}},"secret")));
