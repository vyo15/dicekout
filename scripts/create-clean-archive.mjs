import { execFileSync } from "node:child_process";
import { access, cp, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.resolve(projectRoot, process.argv[2] || "../dicekout-clean.zip");
const generatedDirectoryNames = new Set([
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".catalog-manager",
  "playwright-report",
  "test-results",
  "blob-report",
  ".git",
]);

const run = (command, args, options = {}) => execFileSync(command, args, {
  cwd: projectRoot,
  stdio: "inherit",
  ...options,
});

const isGitWorkTree = () => {
  try {
    return execFileSync("git", ["rev-parse", "--is-inside-work-tree"], {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim() === "true";
  } catch {
    return false;
  }
};

run(process.execPath, [path.join(projectRoot, "scripts", "validate-source-tree.mjs")]);
await rm(output, { force: true });

if (isGitWorkTree()) {
  const status = execFileSync("git", ["status", "--porcelain"], {
    cwd: projectRoot,
    encoding: "utf8",
  }).trim();
  if (status) {
    throw new Error("Working tree belum bersih. Commit atau stash perubahan sebelum membuat source ZIP.");
  }

  run("git", [
    "archive",
    "--format=zip",
    "--prefix=dicekout/",
    `--output=${output}`,
    "HEAD",
  ]);
} else {
  const stagingRoot = await mkdtemp(path.join(os.tmpdir(), "dicekout-source-"));
  const stagingProject = path.join(stagingRoot, "dicekout");

  try {
    await cp(projectRoot, stagingProject, {
      recursive: true,
      filter: (source) => {
        const resolved = path.resolve(source);
        if (resolved === output) return false;
        const relative = path.relative(projectRoot, resolved);
        if (!relative) return true;
        return !relative.split(path.sep).some((segment) => generatedDirectoryNames.has(segment));
      },
    });

    run("git", ["init", "-q"], { cwd: stagingProject });
    run("git", ["add", "-A"], { cwd: stagingProject });
    run("git", [
      "-c", "user.name=DicekOut Source Packager",
      "-c", "user.email=source-packager@localhost",
      "commit", "-qm", "Create clean source archive",
    ], { cwd: stagingProject });
    run("git", [
      "archive",
      "--format=zip",
      "--prefix=dicekout/",
      `--output=${output}`,
      "HEAD",
    ], { cwd: stagingProject });
  } finally {
    await rm(stagingRoot, { recursive: true, force: true });
  }
}

await access(output);
console.log(`Source ZIP bersih dibuat: ${output}`);
