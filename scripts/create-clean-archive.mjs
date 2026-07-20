import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { access, rm } from "node:fs/promises";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.resolve(projectRoot, process.argv[2] || "../dicekout-clean.zip");
const status = execFileSync("git", ["status", "--porcelain"], { cwd: projectRoot, encoding: "utf8" }).trim();
if (status) {
  throw new Error("Working tree belum bersih. Commit atau stash perubahan sebelum membuat source ZIP.");
}

execFileSync(process.execPath, [path.join(projectRoot, "scripts", "validate-source-tree.mjs")], {
  cwd: projectRoot,
  stdio: "inherit",
});
await rm(output, { force: true });
execFileSync("git", [
  "archive",
  "--format=zip",
  "--prefix=dicekout/",
  `--output=${output}`,
  "HEAD",
], { cwd: projectRoot, stdio: "inherit" });
await access(output);
console.log(`Source ZIP bersih dibuat: ${output}`);
