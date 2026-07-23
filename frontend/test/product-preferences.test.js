import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  clearSavedProducts,
  getSavedProductIds,
  replaceSavedProductIds,
  subscribeProductPreferences,
  toggleSavedProduct,
} from "../src/utils/productPreferences.js";

class MemoryStorage {
  constructor() {
    this.values = new Map();
    this.failWrites = false;
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    if (this.failWrites) throw new Error("storage unavailable");
    this.values.set(key, String(value));
  }
}

beforeEach(() => {
  const events = new EventTarget();
  globalThis.window = {
    localStorage: new MemoryStorage(),
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    dispatchEvent: events.dispatchEvent.bind(events),
  };
});

afterEach(() => {
  delete globalThis.window;
});

test("saved products are unique, reversible, and announce preference changes", () => {
  let changeCount = 0;
  const unsubscribe = subscribeProductPreferences(() => { changeCount += 1; });

  assert.equal(replaceSavedProductIds(["produk-1", "produk-1", " produk-2 "]), true);
  assert.deepEqual(getSavedProductIds(), ["produk-1", "produk-2"]);

  const removed = toggleSavedProduct("produk-1");
  assert.equal(removed.success, true);
  assert.equal(removed.saved, false);
  assert.deepEqual(removed.previousIds, ["produk-1", "produk-2"]);
  assert.deepEqual(getSavedProductIds(), ["produk-2"]);

  assert.equal(replaceSavedProductIds(removed.previousIds), true);
  assert.deepEqual(getSavedProductIds(), ["produk-1", "produk-2"]);
  assert.equal(changeCount, 3);
  unsubscribe();
});

test("storage failures never report a successful bookmark mutation", () => {
  window.localStorage.failWrites = true;
  const result = toggleSavedProduct("produk-1");

  assert.equal(result.success, false);
  assert.equal(result.saved, false);
  assert.deepEqual(result.previousIds, []);
  assert.deepEqual(result.nextIds, []);

  const cleared = clearSavedProducts();
  assert.equal(cleared.success, false);
  assert.deepEqual(cleared.previousIds, []);
});
