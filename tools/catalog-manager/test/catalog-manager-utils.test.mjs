import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";

import { today } from "../src/catalogManagerUtils.js";

const execFileAsync = promisify(execFile);

test("today formats a local calendar date and rejects invalid input", () => {
  assert.equal(today(new Date(2026, 6, 16, 0, 30)), "2026-07-16");
  assert.equal(today(new Date("invalid")), "");
});

test("today does not move Jakarta dates back to the previous UTC day", async () => {
  const moduleUrl = new URL("../src/catalogManagerUtils.js", import.meta.url).href;
  const script = `import { today } from ${JSON.stringify(moduleUrl)}; process.stdout.write(today(new Date("2026-07-15T17:30:00.000Z")));`;
  const { stdout } = await execFileAsync(process.execPath, ["--input-type=module", "-e", script], {
    env: { ...process.env, TZ: "Asia/Jakarta" },
  });
  assert.equal(stdout, "2026-07-16");
});
